import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamification } from '../context/GamificationContext';
import { CheckCircle, XCircle, ArrowRight, RotateCcw, Trophy, Zap, Star } from 'lucide-react';
import './QuizMode.css';

/* ═══════════════════════════════════════════════════════════════
   QUIZ DATA — Stock Market Questions
   ═══════════════════════════════════════════════════════════════ */
const QUIZ_BANK = [
    {
        q: 'What does RSI stand for?',
        type: 'mcq',
        options: ['Real Stock Index', 'Relative Strength Index', 'Return on Stock Investment', 'Random Signal Indicator'],
        answer: 1,
        explanation: 'RSI = Relative Strength Index. It measures momentum on a 0–100 scale.',
        topic: 'indicators',
    },
    {
        q: 'A green candlestick means the stock closed HIGHER than it opened.',
        type: 'tf',
        options: ['True', 'False'],
        answer: 0,
        explanation: 'Correct! A green candle = closing price > opening price (buyers won).',
        topic: 'charts',
    },
    {
        q: 'What does an RSI above 70 typically indicate?',
        type: 'mcq',
        options: ['Oversold', 'Overbought', 'Neutral', 'No signal'],
        answer: 1,
        explanation: 'RSI > 70 means the stock is overbought — it has risen fast and may pull back.',
        topic: 'indicators',
    },
    {
        q: 'Which exchange does the Nifty 50 index belong to?',
        type: 'mcq',
        options: ['BSE', 'NSE', 'NYSE', 'SEBI'],
        answer: 1,
        explanation: 'Nifty 50 is the benchmark index of the National Stock Exchange (NSE).',
        topic: 'basics',
    },
    {
        q: 'A Golden Cross occurs when the 50-DMA crosses ABOVE the 200-DMA.',
        type: 'tf',
        options: ['True', 'False'],
        answer: 0,
        explanation: 'Correct! Golden Cross = 50 DMA crosses above 200 DMA = strong bullish signal.',
        topic: 'indicators',
    },
    {
        q: 'What is a "bulk deal" in the Indian stock market?',
        type: 'mcq',
        options: ['Buying in bulk from a store', 'A trade > 0.5% of company shares', 'A government bond purchase', 'An IPO subscription'],
        answer: 1,
        explanation: 'A bulk deal is when 0.5%+ of a company\'s shares are traded in a single transaction.',
        topic: 'signals',
    },
    {
        q: 'In a bear market, stock prices are generally rising.',
        type: 'tf',
        options: ['True', 'False'],
        answer: 1,
        explanation: 'False! A bear market = falling prices. A bull market = rising prices.',
        topic: 'basics',
    },
    {
        q: 'Which Indian market regulator protects investors?',
        type: 'mcq',
        options: ['RBI', 'SEBI', 'NABARD', 'IRDAI'],
        answer: 1,
        explanation: 'SEBI (Securities & Exchange Board of India) regulates the stock market.',
        topic: 'basics',
    },
    {
        q: 'MACD crossing ABOVE the signal line is a bullish signal.',
        type: 'tf',
        options: ['True', 'False'],
        answer: 0,
        explanation: 'Correct! MACD > signal line = momentum is turning bullish.',
        topic: 'indicators',
    },
    {
        q: 'TCS has RSI 78, broke 52-week high, but FII selling. This is:',
        type: 'mcq',
        options: ['Purely bullish', 'Purely bearish', 'Conflicting signal', 'No signal'],
        answer: 2,
        explanation: 'Breakout is bullish, but RSI>70 (overbought) + FII selling creates conflicting signals.',
        topic: 'signals',
    },
    {
        q: 'A Demat account is required to buy stocks in India.',
        type: 'tf',
        options: ['True', 'False'],
        answer: 0,
        explanation: 'True! A Demat (dematerialized) account holds your shares electronically.',
        topic: 'basics',
    },
    {
        q: 'What does the "P/E ratio" tell you?',
        type: 'mcq',
        options: ['Profit per employee', 'Price / Earnings per share', 'Portfolio efficiency', 'Percentage exposure'],
        answer: 1,
        explanation: 'P/E = Price / Earnings per share. Shows how much you pay per ₹1 of profit.',
        topic: 'basics',
    },
];

/* ═══════════════════════════════════════════════════════════════
   QUIZ MODE COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function QuizMode({ topic = 'all' }) {
    const { completeQuiz, addXP } = useGamification();

    // Filter by topic
    const allQuestions = topic === 'all'
        ? QUIZ_BANK
        : QUIZ_BANK.filter(q => q.topic === topic);
    const questions = allQuestions.slice(0, 8); // Max 8 per session

    const [currentQ, setCurrentQ] = useState(0);
    const [selected, setSelected] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [finished, setFinished] = useState(false);
    const [answers, setAnswers] = useState([]); // track all answers

    const question = questions[currentQ];
    const isCorrect = selected === question?.answer;
    const progress = ((currentQ) / questions.length) * 100;

    const handleSelect = useCallback((idx) => {
        if (showResult) return;
        setSelected(idx);
        setShowResult(true);

        const correct = idx === question.answer;
        const newCombo = correct ? combo + 1 : 0;
        const newScore = score + (correct ? 1 : 0);
        setCombo(newCombo);
        setScore(newScore);
        setAnswers(prev => [...prev, { q: currentQ, selected: idx, correct }]);

        // Award XP for correct (with combo bonus)
        if (correct) {
            const bonus = newCombo >= 3 ? 5 : 0;
            addXP(10 + bonus, bonus > 0 ? `Quiz (${newCombo}x combo!)` : 'Correct answer');
        }
    }, [showResult, question, combo, score, currentQ, addXP]);

    const handleNext = () => {
        if (currentQ + 1 >= questions.length) {
            setFinished(true);
            completeQuiz(score + (isCorrect ? 0 : 0), questions.length);
        } else {
            setCurrentQ(c => c + 1);
            setSelected(null);
            setShowResult(false);
        }
    };

    const handleRestart = () => {
        setCurrentQ(0);
        setSelected(null);
        setShowResult(false);
        setScore(0);
        setCombo(0);
        setFinished(false);
        setAnswers([]);
    };

    if (questions.length === 0) {
        return <div className="quiz-empty">No questions available for this topic.</div>;
    }

    /* ── Results Screen ───────────────────────────────── */
    if (finished) {
        const pct = Math.round((score / questions.length) * 100);
        const grade = pct >= 90 ? 'A+' : pct >= 70 ? 'A' : pct >= 50 ? 'B' : 'C';
        const message = pct === 100 ? '🎉 Perfect Score!'
            : pct >= 70 ? '🔥 Great job!'
            : pct >= 50 ? '👍 Not bad!'
            : '📚 Keep learning!';

        return (
            <motion.div
                className="quiz-results"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="results-emoji">
                    {pct === 100 ? '🏆' : pct >= 70 ? '⭐' : pct >= 50 ? '📊' : '📖'}
                </div>
                <h2 className="results-title">{message}</h2>
                <div className="results-stats">
                    <div className="result-stat">
                        <span className="result-value">{score}/{questions.length}</span>
                        <span className="result-label">Correct</span>
                    </div>
                    <div className="result-stat">
                        <span className="result-value result-grade">{grade}</span>
                        <span className="result-label">Grade</span>
                    </div>
                    <div className="result-stat">
                        <span className="result-value">{pct}%</span>
                        <span className="result-label">Accuracy</span>
                    </div>
                </div>
                <motion.button
                    className="btn btn-primary quiz-restart-btn"
                    onClick={handleRestart}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <RotateCcw size={16} /> Try Again
                </motion.button>
            </motion.div>
        );
    }

    /* ── Question Screen ──────────────────────────────── */
    return (
        <div className="quiz-container">
            {/* Progress Bar */}
            <div className="quiz-progress-bar">
                <motion.div
                    className="quiz-progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4 }}
                />
            </div>

            <div className="quiz-meta">
                <span className="quiz-counter">
                    Question {currentQ + 1} of {questions.length}
                </span>
                {combo >= 2 && (
                    <motion.span
                        className="combo-badge"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        key={combo}
                    >
                        <Zap size={12} /> {combo}x Combo!
                    </motion.span>
                )}
                <span className="quiz-score">
                    <Star size={12} /> {score} correct
                </span>
            </div>

            {/* Question Card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentQ}
                    className="quiz-card"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="quiz-type-badge">
                        {question.type === 'tf' ? 'TRUE / FALSE' : 'MULTIPLE CHOICE'}
                    </div>
                    <h3 className="quiz-question">{question.q}</h3>

                    {/* Options */}
                    <div className="quiz-options">
                        {question.options.map((opt, idx) => {
                            let cls = 'quiz-option';
                            if (showResult) {
                                if (idx === question.answer) cls += ' correct';
                                else if (idx === selected && !isCorrect) cls += ' wrong';
                            } else if (idx === selected) {
                                cls += ' selected';
                            }

                            return (
                                <motion.button
                                    key={idx}
                                    className={cls}
                                    onClick={() => handleSelect(idx)}
                                    disabled={showResult}
                                    whileHover={!showResult ? { scale: 1.02 } : {}}
                                    whileTap={!showResult ? { scale: 0.98 } : {}}
                                    animate={showResult && idx === selected && !isCorrect
                                        ? { x: [0, -8, 8, -8, 8, 0] }
                                        : {}
                                    }
                                    transition={{ duration: 0.4 }}
                                >
                                    <span className="option-letter">
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    <span className="option-text">{opt}</span>
                                    {showResult && idx === question.answer && (
                                        <CheckCircle size={18} className="option-icon correct-icon" />
                                    )}
                                    {showResult && idx === selected && !isCorrect && (
                                        <XCircle size={18} className="option-icon wrong-icon" />
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Feedback */}
                    <AnimatePresence>
                        {showResult && (
                            <motion.div
                                className={`quiz-feedback ${isCorrect ? 'feedback-correct' : 'feedback-wrong'}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                            >
                                <span className="feedback-icon">
                                    {isCorrect ? '✅' : '❌'}
                                </span>
                                <p>{question.explanation}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Next Button */}
                    {showResult && (
                        <motion.button
                            className="btn btn-primary quiz-next-btn"
                            onClick={handleNext}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {currentQ + 1 >= questions.length ? (
                                <><Trophy size={16} /> See Results</>
                            ) : (
                                <><ArrowRight size={16} /> Next Question</>
                            )}
                        </motion.button>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
