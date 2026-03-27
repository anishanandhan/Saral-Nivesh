import { motion, AnimatePresence } from 'framer-motion';
import { useGamification } from '../context/GamificationContext';
import { Flame, Trophy, Star, Zap, Award, Target } from 'lucide-react';
import './LearnerDashboard.css';

/* ═══════════════════════════════════════════════════════════════
   LEARNER DASHBOARD
   XP Bar • Level Badge • Streak Flame • Achievements
   ═══════════════════════════════════════════════════════════════ */
export default function LearnerDashboard() {
    const {
        xp, level, nextLevel, levelProgress, streak,
        lessonsCompleted, quizzesCompleted, unlockedBadges,
        levelUpEvent, badgeEvent, xpPopup, BADGE_DEFS,
    } = useGamification();

    return (
        <motion.div
            className="learner-dashboard"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* ── Level + XP Bar ───────────────────────────── */}
            <div className="dash-main">
                <div className="dash-level">
                    <motion.div
                        className="level-emoji"
                        animate={levelUpEvent ? { scale: [1, 1.5, 1], rotate: [0, 15, -15, 0] } : {}}
                        transition={{ duration: 0.6 }}
                    >
                        {level.emoji}
                    </motion.div>
                    <div className="level-info">
                        <span className="level-name" style={{ color: level.color }}>
                            {level.name}
                        </span>
                        <span className="xp-text">{xp} XP</span>
                    </div>
                </div>

                <div className="xp-bar-wrapper">
                    <div className="xp-bar-track">
                        <motion.div
                            className="xp-bar-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${levelProgress}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            style={{ background: level.color }}
                        />
                        <motion.div
                            className="xp-bar-glow"
                            initial={{ width: 0 }}
                            animate={{ width: `${levelProgress}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            style={{ background: level.color }}
                        />
                    </div>
                    <span className="xp-bar-label">
                        {nextLevel ? `${nextLevel.minXP - xp} XP to ${nextLevel.name}` : 'MAX LEVEL'}
                    </span>
                </div>
            </div>

            {/* ── Stats Row ───────────────────────────────── */}
            <div className="dash-stats">
                <motion.div className="dash-stat" whileHover={{ scale: 1.05, y: -3 }}>
                    <motion.div
                        className="stat-icon streak-flame"
                        animate={streak > 0 ? {
                            scale: [1, 1.15, 1],
                            filter: ['brightness(1)', 'brightness(1.4)', 'brightness(1)']
                        } : {}}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        <Flame size={18} />
                    </motion.div>
                    <span className="stat-value">{streak}</span>
                    <span className="stat-label">Day Streak</span>
                </motion.div>

                <motion.div className="dash-stat" whileHover={{ scale: 1.05, y: -3 }}>
                    <div className="stat-icon lessons-icon"><Target size={18} /></div>
                    <span className="stat-value">{lessonsCompleted}</span>
                    <span className="stat-label">Lessons</span>
                </motion.div>

                <motion.div className="dash-stat" whileHover={{ scale: 1.05, y: -3 }}>
                    <div className="stat-icon quizzes-icon"><Star size={18} /></div>
                    <span className="stat-value">{quizzesCompleted}</span>
                    <span className="stat-label">Quizzes</span>
                </motion.div>

                <motion.div className="dash-stat" whileHover={{ scale: 1.05, y: -3 }}>
                    <div className="stat-icon badges-icon"><Award size={18} /></div>
                    <span className="stat-value">{unlockedBadges.length}</span>
                    <span className="stat-label">Badges</span>
                </motion.div>
            </div>

            {/* ── Badges Row ──────────────────────────────── */}
            {unlockedBadges.length > 0 && (
                <div className="dash-badges">
                    {BADGE_DEFS.filter(b => unlockedBadges.includes(b.id)).map((badge, i) => (
                        <motion.div
                            key={badge.id}
                            className="badge-chip"
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.08, type: 'spring', stiffness: 400 }}
                            title={badge.desc}
                        >
                            <span className="badge-emoji">{badge.emoji}</span>
                            <span className="badge-name">{badge.name}</span>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* ── XP Popup ────────────────────────────────── */}
            <AnimatePresence>
                {xpPopup && (
                    <motion.div
                        className="xp-popup"
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -30, scale: 0.8 }}
                        transition={{ duration: 0.4 }}
                    >
                        <Zap size={14} />
                        +{xpPopup.amount} XP — {xpPopup.reason}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Level Up Overlay ─────────────────────────── */}
            <AnimatePresence>
                {levelUpEvent && (
                    <motion.div
                        className="level-up-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="level-up-card"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: [0.5, 1.3, 1], opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="level-up-glow" style={{ background: levelUpEvent.color }} />
                            <span className="level-up-emoji">{levelUpEvent.emoji}</span>
                            <h3>Level Up!</h3>
                            <p style={{ color: levelUpEvent.color }}>{levelUpEvent.name}</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Badge Unlock Toast ───────────────────────── */}
            <AnimatePresence>
                {badgeEvent && (
                    <motion.div
                        className="badge-toast"
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 300, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        <Trophy size={16} className="toast-trophy" />
                        <div>
                            <span className="toast-title">🎉 Badge Unlocked!</span>
                            <span className="toast-badge">{badgeEvent.emoji} {badgeEvent.name}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
