import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
    BookOpen, TrendingUp, BarChart3, Shield, ChevronDown,
    Activity, Lightbulb, Search, Sparkles, GraduationCap,
    CandlestickChart, LineChart, BarChart, Brain, Zap,
    ArrowUpRight, ArrowDownRight, HelpCircle, Gamepad2
} from 'lucide-react';
import TypingText from '../components/TypingText';
import LearnerDashboard from '../components/LearnerDashboard';
import QuizMode from '../components/QuizMode';
import { useGamification } from '../context/GamificationContext';
import { fadeUp, stagger, hoverLift, viewportOnce } from '../utils/motionVariants';
import './Learn.css';

/* ─── AI Tutor Typing Explanations ────────────────────────────── */
const AI_EXPLANATIONS = {
    basics: "A stock is a tiny piece of ownership in a company. When you buy a share of Reliance, you literally own a small fraction of that company. If Reliance does well, your share becomes more valuable — you can sell it later for profit.",
    charts: "A stock chart is simply a picture of how a stock's price moved over time. The X-axis is time, and the Y-axis is the price. Once you learn to read patterns, charts become your best friend.",
    indicators: "Indicators are math formulas applied to price data. They help answer 3 key questions: Is this stock overbought? Is the trend strong? Is a reversal coming?",
    signals: "Signals are real-world events or chart patterns that suggest the stock price might move. Our AI monitors thousands of data points and flags the most interesting ones for you.",
    glossary: "Every expert was once a beginner. Here are the key terms you'll need to navigate the stock market confidently.",
    quiz: "Time to test what you've learned! Answer questions, earn XP, and level up your stock market knowledge.",
};

/* ─── Tab Definitions ─────────────────────────────────────────── */
const TABS = [
    { id: 'basics', label: 'What are Stocks?', icon: BookOpen, color: '#f79318' },
    { id: 'charts', label: 'Charts 101', icon: TrendingUp, color: '#00d4aa' },
    { id: 'indicators', label: 'Indicators', icon: BarChart3, color: '#3b82f6' },
    { id: 'signals', label: 'Signals', icon: Activity, color: '#8b5cf6' },
    { id: 'glossary', label: 'Glossary', icon: Search, color: '#14b8a6' },
    { id: 'quiz', label: '🎮 Quiz', icon: Gamepad2, color: '#ff6347' },
];

/* ─── Concept Cards Data ──────────────────────────────────────── */
const CONCEPTS = {
    basics: [
        { title: 'NSE', subtitle: 'National Stock Exchange', desc: "India's largest exchange. Nifty 50 is its benchmark — top 50 companies by market cap.", emoji: '🏛️' },
        { title: 'BSE', subtitle: 'Bombay Stock Exchange', desc: "Asia's oldest exchange. Sensex tracks the top 30 companies.", emoji: '📊' },
        { title: 'SEBI', subtitle: 'The Regulator', desc: 'Securities & Exchange Board of India — ensures fair play and protects investors.', emoji: '🛡️' },
        { title: 'Demat Account', subtitle: 'Your Digital Locker', desc: 'Holds stocks electronically. You need one to buy stocks (via Zerodha, Groww, etc).', emoji: '🔐' },
    ],
    charts: [
        { title: 'Line Chart', subtitle: 'The Simplest View', desc: 'Connects closing prices. Great for spotting the overall trend direction.', emoji: '📈', icon: LineChart },
        { title: 'Candlestick', subtitle: 'The Pro Standard', desc: 'Shows Open, High, Low, Close. Green = bullish day. Red = bearish day.', emoji: '🕯️', icon: CandlestickChart },
        { title: 'Volume Bars', subtitle: 'Conviction Meter', desc: 'Shows how many shares traded. High volume = strong move. Low volume = weak signal.', emoji: '📊', icon: BarChart },
        { title: 'Support & Resistance', subtitle: 'Price Boundaries', desc: 'Support = floor where buyers step in. Resistance = ceiling where sellers emerge.', emoji: '🧱' },
    ],
    indicators: [
        { title: 'RSI', subtitle: 'Relative Strength Index', desc: 'Scale 0–100. Above 70 = overbought (may drop). Below 30 = oversold (may bounce).', value: '58', valueColor: '#f59e0b', emoji: '⚡' },
        { title: 'MACD', subtitle: 'Momentum Tracker', desc: 'When MACD crosses above signal line = bullish momentum is building.', value: '+2.4', valueColor: '#00d4aa', emoji: '🔀' },
        { title: '50 DMA', subtitle: '50-Day Moving Average', desc: 'If price is above the 50-DMA, short-term trend is bullish. Acts as dynamic support.', value: '₹2,741', valueColor: '#f79318', emoji: '📐' },
        { title: '200 DMA', subtitle: 'The Big Picture', desc: 'The long-term trend indicator. Price above = bullish. Below = bearish.', value: '₹2,698', valueColor: '#f79318', emoji: '🔭' },
        { title: 'Golden Cross', subtitle: '50 DMA × 200 DMA', desc: '50 DMA crosses ABOVE 200 DMA = very bullish. Short-term momentum overtaking long-term.', value: '🟢', valueColor: '#00d4aa', emoji: '✨' },
        { title: 'Death Cross', subtitle: 'Bearish Reversal', desc: '50 DMA crosses BELOW 200 DMA = bearish signal. Long-term weakness setting in.', value: '🔴', valueColor: '#ff4757', emoji: '💀' },
    ],
    signals: [
        { title: 'Bulk Deals', subtitle: 'Big Money Moves', desc: 'When institutions buy/sell >0.5% of a company. Big money votes with action.', emoji: '🏢' },
        { title: 'Insider Trades', subtitle: 'Those Who Know Best', desc: 'When directors/CFOs buy or sell their own company stock. Legal if disclosed to SEBI.', emoji: '👤' },
        { title: 'Technical Patterns', subtitle: 'Chart Signals', desc: 'Golden Cross, breakouts, RSI divergence — patterns with measurable win rates.', emoji: '📈' },
        { title: 'Corporate Actions', subtitle: 'Official Events', desc: 'Results, dividends, stock splits — events that directly affect a stock\'s fundamental value.', emoji: '📄' },
    ],
};

/* ─── Glossary Data ───────────────────────────────────────────── */
const GLOSSARY = [
    { term: 'Bull Market', def: 'When stock prices are generally rising. Optimism is high.', emoji: '🐂' },
    { term: 'Bear Market', def: 'When stock prices are falling. Fear is dominant.', emoji: '🐻' },
    { term: 'Market Cap', def: 'Total value of all shares. Share price × total shares.', emoji: '💰' },
    { term: 'P/E Ratio', def: 'Price-to-Earnings. How much you pay per ₹1 of earnings.', emoji: '📉' },
    { term: 'Dividend', def: 'Cash payment from profits. Like rent from owning a stock.', emoji: '💸' },
    { term: 'Portfolio', def: "Your collection of investments. Diversify = don't put all eggs in one basket.", emoji: '🎒' },
    { term: 'Volatility', def: 'How wildly a price swings. High = more risk, more opportunity.', emoji: '🎢' },
    { term: 'IPO', def: 'Initial Public Offering. When a company first sells shares publicly.', emoji: '🚀' },
    { term: 'Blue Chip', def: 'Large, stable company. Like Reliance, HDFC, TCS. Safer but slower growth.', emoji: '💎' },
    { term: 'Stop Loss', def: 'Auto-sell order to limit losses. E.g., sell if price drops below ₹500.', emoji: '🛑' },
    { term: 'Nifty 50', def: 'Index of top 50 NSE companies by market cap. India\'s benchmark.', emoji: '🇮🇳' },
    { term: 'FII / DII', def: 'Foreign / Domestic Institutional Investors. Their buying/selling moves markets.', emoji: '🏦' },
];

/* ─── Learning Path Steps ─────────────────────────────────────── */
const LEARNING_STEPS = [
    { num: '01', title: 'Understand Basics', desc: 'What stocks are and how markets work', color: '#f79318' },
    { num: '02', title: 'Read Charts', desc: 'Learn to spot patterns and trends', color: '#00d4aa' },
    { num: '03', title: 'Know Indicators', desc: 'RSI, MACD, moving averages decoded', color: '#3b82f6' },
    { num: '04', title: 'Spot Signals', desc: 'Identify real opportunities with data', color: '#8b5cf6' },
];

/* ─── Highlight Box Data ──────────────────────────────────────── */
const HIGHLIGHT_EXAMPLES = {
    basics: {
        label: '💡 Real Example',
        text: 'If you bought 10 shares of TCS at ₹3,200 and today TCS is at ₹3,420, your profit = 10 × (₹3,420 − ₹3,200) = ₹2,200 profit. That\'s a 6.9% return!',
        accent: '#f79318',
    },
    charts: {
        label: '💡 Reading a Candlestick',
        text: 'A green candle with a long body means buyers dominated — price opened low and closed high. A red candle with a long body means sellers won.',
        accent: '#00d4aa',
    },
    indicators: {
        label: '💡 Plain English',
        text: 'If HDFC Bank has RSI = 58, MACD bullish, and price above 50 DMA — it means: "The stock is healthy, has good momentum, and is trending up. Not too hot, not too cold."',
        accent: '#3b82f6',
    },
    signals: {
        label: '⚠️ Remember This',
        text: 'Signals are NOT buy/sell orders. They\'re spotlights that show you where to look. Always do your own research, check multiple signals, and never invest money you can\'t afford to lose.',
        accent: '#f59e0b',
    },
};

/* ─── Key Concepts Lists ──────────────────────────────────────── */
const KEY_CONCEPTS = {
    basics: [
        'More buyers than sellers → Price goes UP',
        'More sellers than buyers → Price goes DOWN',
        'News, earnings, economy, and even rumors shift the balance',
    ],
    charts: [
        'Support — floor where buyers step in',
        'Resistance — ceiling where sellers emerge',
        'Breakout — price moves past support/resistance with volume',
        'Trend — higher highs + higher lows = uptrend',
    ],
    signals: [
        'Bullish ▲ — signal suggests price may go UP',
        'Bearish ▼ — signal suggests price may go DOWN',
        'Conflicting ⚠ — mixed signals, pros and cons both present',
        'Confidence % — AI strength rating (higher = more reliable)',
        'Win Rate — how often this pattern worked in backtesting',
    ],
};

/* ─── Animation Variants ──────────────────────────────────────── */
const cardVariant = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: (i) => ({
        opacity: 1, y: 0, scale: 1,
        transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' },
    }),
};

const listItemVariant = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
        opacity: 1, x: 0,
        transition: { delay: i * 0.1, duration: 0.4 },
    }),
};

const glossaryVariant = {
    hidden: { opacity: 0, scale: 0.9, rotateX: -10 },
    visible: (i) => ({
        opacity: 1, scale: 1, rotateX: 0,
        transition: { delay: i * 0.04, duration: 0.4, ease: 'easeOut' },
    }),
};

/* ─── Animated Section Wrapper ────────────────────────────────── */
function AnimatedSection({ children }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.15 });
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: 'easeOut' }}
        >
            {children}
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   LEARN PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function Learn() {
    const [activeTab, setActiveTab] = useState('basics');
    const [expandedAccordions, setExpandedAccordions] = useState({});
    const { visitTab, completeLesson } = useGamification();

    // Track tab visits for gamification
    useEffect(() => {
        visitTab(activeTab);
    }, [activeTab, visitTab]);

    const toggleAccordion = (id) => {
        setExpandedAccordions(prev => ({ ...prev, [id]: !prev[id] }));
        if (!expandedAccordions[id]) completeLesson(); // award XP for reading
    };

    const concepts = CONCEPTS[activeTab] || [];
    const highlight = HIGHLIGHT_EXAMPLES[activeTab];
    const keyConcepts = KEY_CONCEPTS[activeTab] || [];

    return (
        <div className="learn-page">
            <div className="container">

                {/* ── Gamification Dashboard ───────────────────── */}
                <LearnerDashboard />

                {/* ── Hero Section ─────────────────────────────── */}
                <motion.section
                    className="learn-hero"
                    initial="hidden" animate="visible" variants={stagger}
                >
                    <motion.div className="hero-badge" variants={fadeUp}>
                        <GraduationCap size={14} />
                        <span>Free Learning Platform</span>
                    </motion.div>

                    <motion.h1 variants={fadeUp}>
                        Learn{' '}
                        <span className="gradient-text shimmer">Stock Market</span>
                    </motion.h1>

                    <motion.p className="hero-subtitle" variants={fadeUp}>
                        New to investing? No worries. We explain everything in simple words — <br />
                        no jargon, no confusing charts. Start from zero and build confidence.
                    </motion.p>

                    {/* Learning Path Steps */}
                    <motion.div className="learning-path" variants={fadeUp}>
                        {LEARNING_STEPS.map((step, i) => (
                            <motion.div
                                key={i}
                                className="path-step"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 + i * 0.12 }}
                                whileHover={{ y: -5, scale: 1.03 }}
                                onClick={() => setActiveTab(TABS[i].id)}
                                style={{ '--step-color': step.color }}
                            >
                                <div className="path-num">{step.num}</div>
                                <div className="path-info">
                                    <span className="path-title">{step.title}</span>
                                    <span className="path-desc">{step.desc}</span>
                                </div>
                                {i < LEARNING_STEPS.length - 1 && (
                                    <div className="path-connector" />
                                )}
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.section>

                {/* ── Tab Navigation ───────────────────────────── */}
                <motion.div
                    className="tab-nav"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                >
                    {TABS.map((tab) => (
                        <motion.button
                            key={tab.id}
                            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                            whileHover={{ y: -3 }}
                            whileTap={{ scale: 0.96 }}
                            style={{ '--tab-color': tab.color }}
                        >
                            <tab.icon size={16} />
                            <span>{tab.label}</span>
                            {activeTab === tab.id && (
                                <motion.div
                                    className="tab-indicator"
                                    layoutId="tabIndicator"
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                            )}
                        </motion.button>
                    ))}
                </motion.div>

                {/* ── Content Area ─────────────────────────────── */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        className="learn-content"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.35 }}
                    >
                        {/* AI Tutor Explanation */}
                        <div className="ai-tutor-box">
                            <div className="tutor-header">
                                <div className="tutor-avatar">
                                    <Brain size={18} />
                                </div>
                                <div>
                                    <span className="tutor-name">AI Tutor</span>
                                    <span className="tutor-badge">explains</span>
                                </div>
                            </div>
                            <p className="tutor-text">
                                <TypingText
                                    text={AI_EXPLANATIONS[activeTab]}
                                    speed={15}
                                    trigger={true}
                                    key={activeTab}
                                />
                            </p>
                        </div>

                        {/* Quiz Mode */}
                        {activeTab === 'quiz' && (
                            <AnimatedSection>
                                <QuizMode topic="all" />
                            </AnimatedSection>
                        )}

                        {/* Key Concepts Bullets */}
                        {activeTab !== 'quiz' && keyConcepts.length > 0 && (
                            <AnimatedSection>
                                <div className="key-concepts-section">
                                    <h3 className="section-label">
                                        <Zap size={16} /> Key Concepts
                                    </h3>
                                    <div className="key-list">
                                        {keyConcepts.map((item, i) => (
                                            <motion.div
                                                key={i}
                                                className="key-item"
                                                custom={i}
                                                initial="hidden"
                                                whileInView="visible"
                                                viewport={{ once: true }}
                                                variants={listItemVariant}
                                            >
                                                <span className="key-dot" />
                                                <span>{item}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </AnimatedSection>
                        )}

                        {/* Concept Cards Grid */}
                        {concepts.length > 0 && activeTab !== 'glossary' && activeTab !== 'quiz' && (
                            <AnimatedSection>
                                <h3 className="section-label">
                                    <Sparkles size={16} />
                                    {activeTab === 'basics' ? 'Key Places' :
                                     activeTab === 'charts' ? 'Types of Charts' :
                                     activeTab === 'indicators' ? 'Essential Indicators' :
                                     'Signal Types We Track'}
                                </h3>
                                <div className="concept-cards">
                                    {concepts.map((card, i) => (
                                        <motion.div
                                            key={card.title}
                                            className="concept-card"
                                            custom={i}
                                            initial="hidden"
                                            whileInView="visible"
                                            viewport={{ once: true }}
                                            variants={cardVariant}
                                            whileHover={{
                                                y: -8,
                                                scale: 1.03,
                                                boxShadow: '0 16px 48px rgba(0,0,0,0.3), 0 0 20px rgba(247,147,26,0.08)',
                                            }}
                                        >
                                            <div className="concept-emoji">{card.emoji}</div>
                                            {card.value && (
                                                <div className="concept-value" style={{ color: card.valueColor }}>
                                                    {card.value}
                                                </div>
                                            )}
                                            <h4 className="concept-title">{card.title}</h4>
                                            <p className="concept-subtitle">{card.subtitle}</p>
                                            <p className="concept-desc">{card.desc}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </AnimatedSection>
                        )}

                        {/* Highlight / Example Box */}
                        {highlight && activeTab !== 'quiz' && (
                            <AnimatedSection>
                                <motion.div
                                    className="highlight-box"
                                    style={{ '--highlight-accent': highlight.accent }}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <div className="highlight-glow" />
                                    <div className="highlight-label">{highlight.label}</div>
                                    <p className="highlight-text">{highlight.text}</p>
                                </motion.div>
                            </AnimatedSection>
                        )}

                        {/* Glossary Grid */}
                        {activeTab === 'glossary' && (
                            <AnimatedSection>
                                <div className="glossary-grid">
                                    {GLOSSARY.map((g, i) => (
                                        <motion.div
                                            key={g.term}
                                            className="glossary-card"
                                            custom={i}
                                            initial="hidden"
                                            whileInView="visible"
                                            viewport={{ once: true }}
                                            variants={glossaryVariant}
                                            whileHover={{
                                                scale: 1.05,
                                                borderColor: 'rgba(247,147,26,0.4)',
                                                boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 12px rgba(247,147,26,0.1)',
                                            }}
                                        >
                                            <div className="glossary-emoji">{g.emoji}</div>
                                            <div className="glossary-term">{g.term}</div>
                                            <div className="glossary-def">{g.def}</div>
                                        </motion.div>
                                    ))}
                                </div>
                            </AnimatedSection>
                        )}

                        {/* Deep Dive Accordions */}
                        {activeTab !== 'glossary' && activeTab !== 'quiz' && (
                            <AnimatedSection>
                                <h3 className="section-label" style={{ marginTop: 40 }}>
                                    <BookOpen size={16} /> Deep Dive
                                </h3>
                                <div className="accordion-list">
                                    {getAccordionItems(activeTab).map((item, i) => (
                                        <motion.div
                                            key={item.id}
                                            className={`accordion-item ${expandedAccordions[item.id] ? 'open' : ''}`}
                                            initial={{ opacity: 0, y: 15 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.08 }}
                                        >
                                            <motion.button
                                                className="accordion-trigger"
                                                onClick={() => toggleAccordion(item.id)}
                                                whileTap={{ scale: 0.99 }}
                                            >
                                                <div className="accordion-left">
                                                    <span className="accordion-icon">{item.emoji}</span>
                                                    <span>{item.title}</span>
                                                </div>
                                                <motion.div
                                                    animate={{ rotate: expandedAccordions[item.id] ? 180 : 0 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <ChevronDown size={18} />
                                                </motion.div>
                                            </motion.button>
                                            <AnimatePresence>
                                                {expandedAccordions[item.id] && (
                                                    <motion.div
                                                        className="accordion-body"
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.35, ease: 'easeInOut' }}
                                                        style={{ overflow: 'hidden' }}
                                                    >
                                                        <div className="accordion-content">
                                                            <p>{item.content}</p>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    ))}
                                </div>
                            </AnimatedSection>
                        )}

                    </motion.div>
                </AnimatePresence>

            </div>
        </div>
    );
}

/* ── Accordion Content per Tab ────────────────────────────────── */
function getAccordionItems(tab) {
    switch (tab) {
        case 'basics': return [
            { id: 'b1', emoji: '🧐', title: 'Why do stock prices go up or down?', content: "It's simple supply and demand. More buyers than sellers → price goes UP. More sellers than buyers → price goes DOWN. News, earnings, economy, and even rumors shift buyer/seller balance." },
            { id: 'b2', emoji: '🤔', title: 'How do I start investing?', content: "Step 1: Open a Demat account (Zerodha, Groww). Step 2: Link your bank account. Step 3: Search for a stock (like TCS). Step 4: Place a buy order. It's as easy as ordering online!" },
            { id: 'b3', emoji: '⚠️', title: 'What are the risks?', content: "Stock prices can go down. You can lose some or all of your investment. Never invest money you can't afford to lose. Diversify (buy multiple stocks), set stop-losses, and think long-term." },
            { id: 'b4', emoji: '💡', title: 'How much money do I need?', content: "You can start with as little as ₹100! Many stocks are available for under ₹500 per share. Start small, learn the ropes, then gradually increase your investments." },
        ];
        case 'charts': return [
            { id: 'c1', emoji: '🕯️', title: 'How to read a candlestick?', content: "Each candle shows 4 things: Open price (starting), Close price (ending), High (peak), Low (bottom). A green/white candle = closed higher than opened (buyers won). Red/black = closed lower (sellers won)." },
            { id: 'c2', emoji: '📏', title: 'What are support and resistance?', content: "Support is like a floor — the price bounces off it because buyers step in. Resistance is like a ceiling — the price struggles to break through because sellers emerge. When price breaks through resistance, it becomes the new support." },
            { id: 'c3', emoji: '💥', title: 'What is a breakout?', content: "A breakout happens when the stock price moves above resistance or below support with high volume. It signals the start of a new trend. Volume confirms the breakout is real (not a false signal)." },
        ];
        case 'indicators': return [
            { id: 'i1', emoji: '🌡️', title: 'How to use RSI in practice?', content: "RSI above 70 means overbought — the stock has risen fast and may pull back. RSI below 30 means oversold — the stock has dropped fast and may bounce. The safest zone for buying is RSI 40-60 with an upward trend." },
            { id: 'i2', emoji: '🔄', title: 'When MACD gives a buy signal?', content: "When the MACD line crosses ABOVE the signal line = momentum is shifting bullish. Strongest when this happens below the zero line (recovery from bearish territory). Volume should confirm the crossover." },
            { id: 'i3', emoji: '⚖️', title: 'Should I use one or multiple indicators?', content: "Always use multiple! No single indicator is perfect. A strong setup is: RSI (momentum) + MACD (trend) + Volume (confirmation). When all three agree, the signal is much more reliable." },
        ];
        case 'signals': return [
            { id: 's1', emoji: '🏢', title: 'How to read a bulk deal?', content: "Check who is buying/selling (institution vs individual), the price discount/premium to market, and the stake size. A bulk deal at market price by an FII = typically positive. A deal at 5%+ discount by a promoter = potential red flag." },
            { id: 's2', emoji: '👤', title: 'Why insider trades matter?', content: "Insiders know their company best. When multiple insiders buy with their own money, it's a strong confidence signal. However, insider selling isn't always bearish — they may need cash for personal reasons." },
            { id: 's3', emoji: '📊', title: 'Understanding win rates', content: "A pattern with 70% win rate means it worked 70 out of 100 times historically. Always check sample size too — 70% from 200 samples is much more reliable than 70% from 10 samples." },
        ];
        default: return [];
    }
}
