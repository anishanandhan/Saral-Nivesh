import { createContext, useContext, useState, useEffect, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════
   GAMIFICATION CONTEXT
   XP • Levels • Daily Streaks • Achievements
   Persisted in localStorage
   ═══════════════════════════════════════════════════════════════ */

const GamificationContext = createContext();

/* ── Level thresholds ─────────────────────────────────────────── */
const LEVELS = [
    { name: 'Beginner',      minXP: 0,    emoji: '🌱', color: '#00d4aa' },
    { name: 'Intermediate',  minXP: 200,  emoji: '📊', color: '#3b82f6' },
    { name: 'Pro',           minXP: 500,  emoji: '🚀', color: '#8b5cf6' },
    { name: 'Expert',        minXP: 1000, emoji: '💎', color: '#f59e0b' },
    { name: 'Master',        minXP: 2000, emoji: '👑', color: '#f79318' },
];

/* ── Badge definitions ────────────────────────────────────────── */
const BADGE_DEFS = [
    { id: 'first_lesson',   name: 'First Steps',       emoji: '🎓', desc: 'Complete your first lesson',       xpReq: 10 },
    { id: 'quiz_ace',       name: 'Quiz Ace',           emoji: '🎯', desc: 'Score 100% on a quiz',             xpReq: null },
    { id: 'streak_3',       name: 'On Fire',            emoji: '🔥', desc: '3-day learning streak',            streakReq: 3 },
    { id: 'streak_7',       name: 'Committed',          emoji: '💪', desc: '7-day learning streak',            streakReq: 7 },
    { id: 'xp_100',         name: 'Getting Serious',    emoji: '⚡', desc: 'Earn 100 XP',                      xpReq: 100 },
    { id: 'xp_500',         name: 'Half Way',           emoji: '🏆', desc: 'Earn 500 XP',                      xpReq: 500 },
    { id: 'xp_1000',        name: 'Market Scholar',     emoji: '🎖️', desc: 'Earn 1000 XP',                     xpReq: 1000 },
    { id: 'first_quiz',     name: 'Quiz Taker',         emoji: '📝', desc: 'Complete your first quiz',         xpReq: null },
    { id: 'explorer',       name: 'Explorer',           emoji: '🗺️', desc: 'Visit all learning tabs',          xpReq: null },
];

/* ── Helpers ──────────────────────────────────────────────────── */
function getLevel(xp) {
    let level = LEVELS[0];
    for (const l of LEVELS) {
        if (xp >= l.minXP) level = l;
    }
    return level;
}

function getNextLevel(xp) {
    for (const l of LEVELS) {
        if (xp < l.minXP) return l;
    }
    return null; // Already max
}

function getLevelProgress(xp) {
    const current = getLevel(xp);
    const next = getNextLevel(xp);
    if (!next) return 100; // Max level
    const range = next.minXP - current.minXP;
    const progress = xp - current.minXP;
    return Math.min(100, Math.round((progress / range) * 100));
}

function getTodayKey() {
    return new Date().toISOString().split('T')[0];
}

function loadState() {
    try {
        const raw = localStorage.getItem('gamification');
        if (raw) return JSON.parse(raw);
    } catch {}
    return null;
}

const DEFAULT_STATE = {
    xp: 0,
    streak: 0,
    lastActiveDate: null,
    unlockedBadges: [],
    quizzesCompleted: 0,
    lessonsCompleted: 0,
    tabsVisited: [],
    recentXPGains: [], // [{amount, reason, timestamp}]
};

/* ── Provider ─────────────────────────────────────────────────── */
export function GamificationProvider({ children }) {
    const [state, setState] = useState(() => loadState() || DEFAULT_STATE);
    const [levelUpEvent, setLevelUpEvent] = useState(null); // trigger level-up animation
    const [badgeEvent, setBadgeEvent] = useState(null);     // trigger badge unlock popup
    const [xpPopup, setXpPopup] = useState(null);           // +XP floating text

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem('gamification', JSON.stringify(state));
    }, [state]);

    // Update streak on mount
    useEffect(() => {
        const today = getTodayKey();
        if (state.lastActiveDate === today) return; // Already active today

        setState(prev => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayKey = yesterday.toISOString().split('T')[0];

            const newStreak = prev.lastActiveDate === yesterdayKey
                ? prev.streak + 1
                : prev.lastActiveDate === today ? prev.streak : 1;

            return { ...prev, streak: newStreak, lastActiveDate: today };
        });
    }, []);

    // Check for auto-unlockable badges
    const checkBadges = useCallback((newState) => {
        const newly = [];
        for (const badge of BADGE_DEFS) {
            if (newState.unlockedBadges.includes(badge.id)) continue;
            let unlock = false;
            if (badge.xpReq != null && newState.xp >= badge.xpReq) unlock = true;
            if (badge.streakReq != null && newState.streak >= badge.streakReq) unlock = true;
            if (unlock) newly.push(badge.id);
        }
        if (newly.length > 0) {
            const firstBadge = BADGE_DEFS.find(b => b.id === newly[0]);
            setBadgeEvent(firstBadge);
            setTimeout(() => setBadgeEvent(null), 3000);
            return [...newState.unlockedBadges, ...newly];
        }
        return newState.unlockedBadges;
    }, []);

    const addXP = useCallback((amount, reason = 'Activity') => {
        setState(prev => {
            const oldLevel = getLevel(prev.xp);
            const newXP = prev.xp + amount;
            const newLevel = getLevel(newXP);

            if (newLevel.name !== oldLevel.name) {
                setLevelUpEvent(newLevel);
                setTimeout(() => setLevelUpEvent(null), 3000);
            }

            setXpPopup({ amount, reason });
            setTimeout(() => setXpPopup(null), 2000);

            const newState = {
                ...prev,
                xp: newXP,
                lastActiveDate: getTodayKey(),
                recentXPGains: [
                    { amount, reason, timestamp: Date.now() },
                    ...prev.recentXPGains.slice(0, 9),
                ],
            };
            newState.unlockedBadges = checkBadges(newState);
            return newState;
        });
    }, [checkBadges]);

    const completeLesson = useCallback(() => {
        setState(prev => {
            const newState = { ...prev, lessonsCompleted: prev.lessonsCompleted + 1 };
            newState.unlockedBadges = checkBadges(newState);
            return newState;
        });
        addXP(15, 'Lesson completed');
    }, [addXP, checkBadges]);

    const completeQuiz = useCallback((score, total) => {
        const pct = (score / total) * 100;
        const xpEarned = Math.round(10 + (pct / 100) * 20);
        setState(prev => {
            const newState = {
                ...prev,
                quizzesCompleted: prev.quizzesCompleted + 1,
                unlockedBadges: prev.unlockedBadges.includes('first_quiz')
                    ? prev.unlockedBadges : [...prev.unlockedBadges, 'first_quiz'],
            };
            if (pct === 100 && !newState.unlockedBadges.includes('quiz_ace')) {
                newState.unlockedBadges = [...newState.unlockedBadges, 'quiz_ace'];
                const badge = BADGE_DEFS.find(b => b.id === 'quiz_ace');
                setBadgeEvent(badge);
                setTimeout(() => setBadgeEvent(null), 3000);
            }
            return newState;
        });
        addXP(xpEarned, `Quiz ${Math.round(pct)}%`);
    }, [addXP]);

    const visitTab = useCallback((tabId) => {
        setState(prev => {
            if (prev.tabsVisited.includes(tabId)) return prev;
            const newTabs = [...prev.tabsVisited, tabId];
            const newState = { ...prev, tabsVisited: newTabs };
            // Check explorer badge
            if (newTabs.length >= 5 && !prev.unlockedBadges.includes('explorer')) {
                newState.unlockedBadges = [...prev.unlockedBadges, 'explorer'];
                const badge = BADGE_DEFS.find(b => b.id === 'explorer');
                setBadgeEvent(badge);
                setTimeout(() => setBadgeEvent(null), 3000);
            }
            return newState;
        });
        addXP(5, 'Explored new topic');
    }, [addXP]);

    const resetProgress = useCallback(() => {
        setState(DEFAULT_STATE);
        localStorage.removeItem('gamification');
    }, []);

    const value = {
        ...state,
        level: getLevel(state.xp),
        nextLevel: getNextLevel(state.xp),
        levelProgress: getLevelProgress(state.xp),
        addXP, completeLesson, completeQuiz, visitTab, resetProgress,
        levelUpEvent, badgeEvent, xpPopup,
        LEVELS, BADGE_DEFS,
    };

    return (
        <GamificationContext.Provider value={value}>
            {children}
        </GamificationContext.Provider>
    );
}

export function useGamification() {
    const ctx = useContext(GamificationContext);
    if (!ctx) throw new Error('useGamification must be used within GamificationProvider');
    return ctx;
}

export { LEVELS, BADGE_DEFS, getLevel, getNextLevel, getLevelProgress };
