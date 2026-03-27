import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import {
    Radar, TrendingUp, MessageSquare, Zap, ArrowRight,
    Shield, Eye, BarChart3, Users, Activity, AlertTriangle, Sparkles, Search,
    Volume2, VolumeX
} from 'lucide-react';
import './Landing.css';

/* ─── Animation Variants ───────────────────────────────────── */
const stagger = { visible: { transition: { staggerChildren: 0.15 } } };

const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
};

const fadeInScale = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: 'easeOut' } },
};

const slideLeft = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};

const slideRight = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};

/* ─── Data ─────────────────────────────────────────────────── */
const features = [
    {
        icon: Radar,
        title: 'Opportunity Radar',
        description: 'See what the big players are doing. AI tracks large block trades, promoter buying, and major news, transforming confusing filings into clear alerts.',
        path: '/radar',
        gradient: 'linear-gradient(135deg, #f7931a, #ffd700)',
        tag: 'PRIMARY',
    },
    {
        icon: TrendingUp,
        title: 'Chart Pattern Intelligence',
        description: 'Charts look like gibberish? Our AI reads the charts for you, finds historical patterns, and tells you exactly what they mean for the stock price.',
        path: '/charts',
        gradient: 'linear-gradient(135deg, #00d4aa, #00b894)',
        tag: 'TECHNICAL',
    },
    {
        icon: Sparkles,
        title: 'AI Co-Pilot — Agentic Dashboard',
        description: 'Multi-agent AI analyzes any stock and translates complex data into plain English. See the AI\'s reasoning process live, with TL;DR, Confidence Scores, and a Traffic Light system.',
        path: '/ask',
        gradient: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
        tag: 'MULTI-AGENT',
    },
];

const howSteps = [
    { num: '01', title: 'AI Scans the Market', desc: 'Our autonomous agents continuously scan price charts, company news, and large investor trades across the NSE and BSE.' },
    { num: '02', title: 'Spotting Patterns', desc: 'The system looks for unusual activity or repeating historical patterns that normally require expert analysis to spot.' },
    { num: '03', title: 'Plain English Translation', desc: 'Advanced AI (like ChatGPT) translates complex financial data into simple, balanced alerts explaining exactly what is happening.' },
    { num: '04', title: 'You Read Clear Signals', desc: 'You receive easy-to-read alert cards showing both the positive and negative sides, with helpful tips for new investors.' },
];

const signals = [
    { label: 'Bulk Deal Detected', ticker: 'TCS', type: 'info', delay: 0 },
    { label: 'RSI Overbought Alert', ticker: 'RELIANCE', type: 'warning', delay: 1.5 },
    { label: 'Breakout Confirmed', ticker: 'HDFCBANK', type: 'success', delay: 3 },
];

/* ─── CountUp Component ───────────────────────────────────── */
function CountUp({ target, prefix = '' }) {
    const [val, setVal] = useState(0);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                let start = 0;
                const duration = 1200;
                const stepTime = 16;
                const steps = duration / stepTime;
                const increment = target / steps;
                const timer = setInterval(() => {
                    start += increment;
                    if (start >= target) { setVal(target); clearInterval(timer); }
                    else setVal(Math.round(start));
                }, stepTime);
                observer.disconnect();
            }
        }, { threshold: 0.3 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [target]);

    return <span ref={ref}>{prefix}{val.toLocaleString('en-IN')}</span>;
}

/* ─── AI Demo Preview ─────────────────────────────────────── */
const DEMO_INSIGHTS = {
    TCS: { sentiment: 'Bullish', rsi: 58, signal: 'RSI healthy at 58. Trading above 50-DMA. FII activity mixed — watch for consolidation. Good long-term hold.', confidence: 78 },
    RELIANCE: { sentiment: 'Neutral', rsi: 52, signal: 'Consolidating near support at ₹1,400. MACD flat. Volume declining. Wait for breakout confirmation above ₹1,450.', confidence: 62 },
    HDFCBANK: { sentiment: 'Bullish', rsi: 61, signal: 'Repo rate cut benefits banking sector. Price above both 50 & 200 DMA. Strong accumulation by DIIs.', confidence: 85 },
    INFY: { sentiment: 'Bearish', rsi: 42, signal: 'Weak Q3 guidance dragging sentiment. Trading below 50-DMA. RSI trending down. Consider reducing exposure.', confidence: 58 },
};

function AIDemoPreview() {
    const [ticker, setTicker] = useState('');
    const [result, setResult] = useState(null);
    const [typing, setTyping] = useState(false);
    const [displayedText, setDisplayedText] = useState('');

    const handleAnalyze = () => {
        const key = ticker.trim().toUpperCase();
        const insight = DEMO_INSIGHTS[key];
        if (!insight) {
            setResult({ error: true });
            setDisplayedText('');
            setTyping(false);
            return;
        }
        setResult(insight);
        setTyping(true);
        setDisplayedText('');

        let i = 0;
        const text = insight.signal;
        const timer = setInterval(() => {
            i++;
            setDisplayedText(text.slice(0, i));
            if (i >= text.length) { clearInterval(timer); setTyping(false); }
        }, 18);
    };

    return (
        <motion.section
            className="ai-demo-section"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
        >
            <div className="container">
                <div className="ai-demo-card card">
                    <div className="ai-demo-header">
                        <Sparkles size={20} className="demo-sparkle" />
                        <div>
                            <h3>Try AI Analysis — Instantly</h3>
                            <p>Enter a stock ticker and see our AI in action</p>
                        </div>
                    </div>

                    <div className="ai-demo-input-row">
                        <input
                            type="text"
                            className="ai-demo-input"
                            placeholder="Enter ticker (TCS, RELIANCE, HDFCBANK, INFY)"
                            value={ticker}
                            onChange={(e) => setTicker(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                        />
                        <motion.button
                            className="btn btn-primary ai-demo-btn"
                            onClick={handleAnalyze}
                            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(247,147,26,0.4)' }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Search size={16} /> Analyze
                        </motion.button>
                    </div>

                    {result && !result.error && (
                        <motion.div
                            className="ai-demo-result"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={ticker}
                        >
                            <div className="demo-result-header">
                                <span className="demo-ticker">{ticker}</span>
                                <span className={`demo-sentiment ${result.sentiment.toLowerCase()}`}>
                                    {result.sentiment === 'Bullish' ? '🟢' : result.sentiment === 'Bearish' ? '🔴' : '🟡'} {result.sentiment}
                                </span>
                                <span className="demo-confidence">
                                    Confidence: {result.confidence}%
                                </span>
                            </div>
                            <div className="demo-signal-text">
                                {displayedText}
                                {typing && <span className="demo-cursor">|</span>}
                            </div>
                            <div className="demo-rsi-bar">
                                <span className="rsi-label">RSI: {result.rsi}</span>
                                <div className="rsi-track">
                                    <motion.div
                                        className="rsi-fill"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${result.rsi}%` }}
                                        transition={{ duration: 0.8 }}
                                        style={{
                                            background: result.rsi > 70 ? '#ff4757' : result.rsi < 30 ? '#ff4757' : '#00d4aa'
                                        }}
                                    />
                                </div>
                            </div>
                            <Link to="/ask" className="demo-full-link">
                                See full analysis →
                            </Link>
                        </motion.div>
                    )}

                    {result?.error && (
                        <motion.p
                            className="demo-error"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            Try one of: TCS, RELIANCE, HDFCBANK, INFY
                        </motion.p>
                    )}
                </div>
            </div>
        </motion.section>
    );
}

/* ─── Market TV — Bloomberg/CNBC-Style Live Feed ─────────── */
const API_BASE = 'http://localhost:8000';

const BG_VIDEO_URL = '/bg.mp4';

function MarketTV() {
    const [update, setUpdate] = useState(null);
    const [tickers, setTickers] = useState([]);
    const [isLive, setIsLive] = useState(false);
    const [voiceOn, setVoiceOn] = useState(false);
    const [fadeKey, setFadeKey] = useState(0);
    const videoRef = useRef(null);
    const sseRef = useRef(null);
    const voiceRef = useRef(false);
    const updateRef = useRef(null);
    const audioRef = useRef(null);

    // Keep refs in sync
    useEffect(() => { voiceRef.current = voiceOn; }, [voiceOn]);
    useEffect(() => { updateRef.current = update; }, [update]);

    // Play the audio from a URL
    const playAudio = (audioUrl) => {
        if (!audioUrl) return;
        // Stop current audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
        const fullUrl = `${API_BASE}${audioUrl}`;
        console.log('[MarketTV] Playing audio:', fullUrl);
        const audio = new Audio(fullUrl);
        audioRef.current = audio;
        audio.play().catch(e => console.error('[MarketTV] Audio play error:', e));
    };

    // Auto-play audio on new SSE update if voice is on
    const onNewUpdate = (data) => {
        if (voiceRef.current && data.audio_url) {
            playAudio(data.audio_url);
        }
    };

    // Toggle voice on/off
    const toggleVoice = () => {
        const newVal = !voiceRef.current;
        voiceRef.current = newVal;
        setVoiceOn(newVal);
        console.log('[MarketTV] Voice toggled:', newVal);

        if (newVal) {
            // Play current update's audio immediately
            const current = updateRef.current;
            if (current?.audio_url) {
                playAudio(current.audio_url);
            }
        } else {
            // Stop audio
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        }
    };

    // Connect to SSE
    useEffect(() => {
        // Fetch initial data
        fetch(`${API_BASE}/api/market-tv/latest`)
            .then(r => r.json())
            .then(data => {
                setUpdate(data);
                if (data.tickers) setTickers(data.tickers);
                setIsLive(true);
                setFadeKey(k => k + 1);
            })
            .catch(() => {});

        // Open SSE connection
        const evtSource = new EventSource(`${API_BASE}/api/market-tv/stream`);
        sseRef.current = evtSource;

        evtSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setUpdate(data);
                if (data.tickers) setTickers(data.tickers);
                setIsLive(true);
                setFadeKey(k => k + 1);
                // Auto-play audio if voice is on
                onNewUpdate(data);
            } catch {}
        };

        evtSource.onerror = () => {
            setIsLive(false);
        };

        return () => {
            evtSource.close();
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // Sentiment color
    const sentimentColor = update?.sentiment === 'bullish' ? '#00d4aa'
        : update?.sentiment === 'bearish' ? '#ff4757' : '#f59e0b';

    const urgencyLabel = update?.urgency === 'breaking' ? 'BREAKING'
        : update?.urgency === 'alert' ? 'ALERT' : 'UPDATE';

    return (
        <section className="market-tv-section">
            {/* Background Video */}
            <video
                ref={videoRef}
                className="market-tv-bg-video"
                src={BG_VIDEO_URL}
                autoPlay
                muted
                loop
                playsInline
            />
            <div className="market-tv-overlay" />

            {/* LIVE Badge */}
            <div className="market-tv-live-badge">
                <span className={`live-dot ${isLive ? 'active' : ''}`} />
                <span>{isLive ? 'LIVE' : 'CONNECTING...'}</span>
            </div>

            {/* Voice Toggle */}
            <button
                className={`market-tv-voice-btn ${voiceOn ? 'active' : ''}`}
                onClick={toggleVoice}
                title={voiceOn ? 'Mute narration' : 'Enable narration'}
            >
                {voiceOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            {/* Content Overlays */}
            <div className="market-tv-content">
                {update ? (
                    <motion.div
                        key={fadeKey}
                        className="market-tv-text-stack"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                    >
                        <div className="market-tv-urgency" style={{ color: sentimentColor }}>
                            {urgencyLabel}
                        </div>
                        <h1 className="market-tv-hook">{update.hook}</h1>
                        <p className="market-tv-summary">{update.summary}</p>
                        <p className="market-tv-cta" style={{ borderColor: sentimentColor }}>
                            {update.cta}
                        </p>
                        {update.ai_powered && (
                            <span className="market-tv-ai-badge">
                                <Sparkles size={12} /> AI Generated
                            </span>
                        )}
                    </motion.div>
                ) : (
                    <div className="market-tv-loading">
                        <Sparkles size={24} className="loading-spin" />
                        <p>Generating first update...</p>
                    </div>
                )}
            </div>

            {/* Scrolling Ticker */}
            {tickers.length > 0 && (
                <div className="market-tv-ticker">
                    <div className="ticker-track">
                        {[...tickers, ...tickers].map((t, i) => (
                            <span key={i} className="ticker-item">
                                <span className="ticker-symbol">{t.symbol}</span>
                                <span className="ticker-price">{t.price}</span>
                                <span className={`ticker-change ${t.direction}`}>{t.change}</span>
                                <span className="ticker-divider">|</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Channel Label */}
            <div className="market-tv-channel">
                <Zap size={12} />
                <span>Saral Nivesh TV</span>
            </div>
        </section>
    );
}

/* ─── Component ────────────────────────────────────────────── */
export default function Landing() {
    const howRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: howRef, offset: ['start end', 'end start'] });
    const imgY = useTransform(scrollYProgress, [0, 1], [0, -80]);
    const imgScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.05]);

    return (
        <div className="landing">
            {/* Floating Glow Blobs */}
            <div className="glow-blob blob-1" aria-hidden="true" />
            <div className="glow-blob blob-2" aria-hidden="true" />
            <div className="glow-blob blob-3" aria-hidden="true" />

            {/* ─── HERO ──────────────────────────────────────────── */}
            <section className="hero">
                <div className="hero-bg-image" aria-hidden="true" />
                <div className="hero-overlay" aria-hidden="true" />

                <div className="container">
                    <motion.div
                        className="hero-content"
                        initial="hidden"
                        animate="visible"
                        variants={stagger}
                    >
                        <motion.div className="hero-badge" variants={fadeUp}>
                            <Zap size={14} />
                            <span>AI-Powered • Real-Time • NSE/BSE</span>
                        </motion.div>

                        <motion.h1 className="hero-title" variants={fadeUp}>
                            Stop Flying Blind.
                            <br />
                            <span className="gradient-text">Start Seeing Signals.</span>
                        </motion.h1>

                        <motion.p className="hero-subtitle" variants={fadeUp}>
                            Stock market data is confusing for beginners. We've built an AI agent that monitors the Indian stock market for you, finds potential opportunities, and explains them in plain English. No jargon, just clear signals.
                        </motion.p>

                        <motion.div className="hero-actions" variants={fadeUp}>
                            <Link to="/radar" className="btn btn-primary btn-lg">
                                <Radar size={18} />
                                Launch Radar
                                <ArrowRight size={16} />
                            </Link>
                            <Link to="/ask" className="btn btn-secondary btn-lg">
                                <MessageSquare size={18} />
                                Try Ask ET
                            </Link>
                        </motion.div>

                        <motion.div className="hero-disclaimer" variants={fadeUp}>
                            <AlertTriangle size={12} />
                            <span>For educational purposes only. Not financial advice.</span>
                        </motion.div>

                        <motion.div className="hero-trust" variants={fadeUp}>
                            Built for Indian retail investors • NSE/BSE ready • Groq AI powered
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ─── LIVE MARKET SNAPSHOT STRIP ───────────────────── */}
            <motion.section
                className="market-snapshot"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
            >
                <div className="container">
                    <div className="snapshot-strip">
                        <motion.div className="snapshot-item"
                            whileHover={{ scale: 1.05, y: -3 }}
                        >
                            <span className="snap-label">NIFTY 50</span>
                            <span className="snap-value bullish">
                                <CountUp target={22147} prefix="₹" />
                            </span>
                            <span className="snap-change bullish">▲ 0.92%</span>
                        </motion.div>

                        <div className="snap-divider" />

                        <motion.div className="snapshot-item"
                            whileHover={{ scale: 1.05, y: -3 }}
                        >
                            <span className="snap-label">SENSEX</span>
                            <span className="snap-value bullish">
                                <CountUp target={73158} prefix="₹" />
                            </span>
                            <span className="snap-change bullish">▲ 0.78%</span>
                        </motion.div>

                        <div className="snap-divider" />

                        <motion.div className="snapshot-item"
                            whileHover={{ scale: 1.05, y: -3 }}
                        >
                            <span className="snap-label">Market Mood</span>
                            <span className="snap-sentiment bullish">
                                <span className="sentiment-dot bullish-dot" />
                                Bullish
                            </span>
                        </motion.div>

                        <div className="snap-divider" />

                        <motion.div className="snapshot-item"
                            whileHover={{ scale: 1.05, y: -3 }}
                        >
                            <span className="snap-label">Top Gainer</span>
                            <span className="snap-ticker">BAJFINANCE</span>
                            <span className="snap-change bullish">▲ 3.22%</span>
                        </motion.div>

                        <div className="snap-divider" />

                        <motion.div className="snapshot-item"
                            whileHover={{ scale: 1.05, y: -3 }}
                        >
                            <span className="snap-label">Top Loser</span>
                            <span className="snap-ticker">ADANIPORTS</span>
                            <span className="snap-change bearish">▼ 0.65%</span>
                        </motion.div>

                        <div className="snap-live-badge">
                            <span className="live-dot" /> LIVE
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* ─── AI DEMO PREVIEW ──────────────────────────────── */}
            <AIDemoPreview />

            {/* ─── MARKET TV — LIVE FINANCIAL FEED ──────────────── */}
            <MarketTV />

            {/* ─── THREE AI AGENTS ─────────────────────────────── */}
            <motion.section
                className="features-section"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={stagger}
            >
                <div className="section-bg-image features-bg" aria-hidden="true" />
                <div className="section-bg-overlay" aria-hidden="true" />

                <div className="container">
                    <motion.div className="section-header" variants={fadeUp}>
                        <h2>Three AI Agents. One Mission.</h2>
                        <p>Turn raw market data into actionable intelligence</p>
                    </motion.div>

                    <div className="features-grid">
                        {features.map((feature, i) => (
                            <motion.div
                                key={i}
                                variants={fadeUp}
                                whileHover={{
                                    scale: 1.04,
                                    rotateX: 2,
                                    rotateY: -2,
                                    boxShadow: '0 20px 60px rgba(108, 92, 231, 0.15)',
                                }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                style={{ perspective: 800 }}
                            >
                                <Link
                                    to={feature.path}
                                    className={`feature-card card`}
                                >
                                    <div className="feature-header">
                                        <div
                                            className="feature-icon"
                                            style={{ background: feature.gradient }}
                                        >
                                            <feature.icon size={24} />
                                        </div>
                                        <span className="feature-tag badge badge-type">{feature.tag}</span>
                                    </div>
                                    <h3 className="feature-title">{feature.title}</h3>
                                    <p className="feature-desc">{feature.description}</p>
                                    <div className="feature-cta">
                                        <span>Explore</span>
                                        <ArrowRight size={14} />
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* ─── HOW IT WORKS — Split Layout (Option A) ──────── */}
            <section className="how-section" ref={howRef}>
                <div className="section-bg-image how-bg" aria-hidden="true" />
                <div className="section-bg-overlay" aria-hidden="true" />

                <div className="container">
                    <motion.div
                        className="section-header"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.3 }}
                        variants={fadeUp}
                    >
                        <h2>How It Works</h2>
                        <p>From raw data to actionable alerts in seconds</p>
                    </motion.div>

                    <div className="how-split-layout">
                        {/* Left: Steps */}
                        <motion.div
                            className="how-steps-col"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.2 }}
                            variants={stagger}
                        >
                            {howSteps.map((step, i) => (
                                <motion.div
                                    key={i}
                                    className="how-step"
                                    variants={i % 2 === 0 ? slideLeft : slideRight}
                                >
                                    <div className="step-number">{step.num}</div>
                                    <div className="step-body">
                                        <h4>{step.title}</h4>
                                        <p>{step.desc}</p>
                                    </div>
                                    {i < howSteps.length - 1 && (
                                        <motion.div
                                            className="step-connector"
                                            initial={{ scaleY: 0 }}
                                            whileInView={{ scaleY: 1 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.5, delay: 0.3 }}
                                        />
                                    )}
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Right: Dashboard Image with Parallax */}
                        <motion.div
                            className="how-image-col"
                            style={{ y: imgY, scale: imgScale }}
                        >
                            <div className="how-dashboard-img">
                                <img
                                    src="/assets/bg-dashboard.webp"
                                    alt="Stock market analytics dashboard"
                                    loading="lazy"
                                />
                                <div className="how-img-overlay" />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ─── AI IN ACTION — New Section ──────────────────── */}
            <motion.section
                className="ai-action-section"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
                variants={stagger}
            >
                {/* Moving gradient + image background */}
                <div className="ai-action-bg" aria-hidden="true" />
                <div className="ai-action-overlay" aria-hidden="true" />

                <div className="container">
                    <motion.div className="ai-action-content" variants={fadeUp}>
                        <div className="ai-action-text">
                            <motion.h2 variants={fadeUp}>
                                <Sparkles size={28} className="ai-action-icon" />
                                AI in Action
                            </motion.h2>
                            <motion.p className="ai-action-subtitle" variants={fadeUp}>
                                Our multi-agent AI system monitors 2,400+ NSE stocks in real-time,
                                detecting patterns, anomalies, and opportunities that human traders miss.
                            </motion.p>
                            <motion.div className="ai-action-features" variants={fadeUp}>
                                <div className="ai-feat">
                                    <Eye size={16} />
                                    <span>Real-time bulk deal detection</span>
                                </div>
                                <div className="ai-feat">
                                    <Activity size={16} />
                                    <span>RSI & technical pattern matching</span>
                                </div>
                                <div className="ai-feat">
                                    <BarChart3 size={16} />
                                    <span>Portfolio-aware event ranking</span>
                                </div>
                            </motion.div>
                            <motion.div variants={fadeUp}>
                                <Link to="/radar" className="btn btn-primary btn-lg ai-action-cta">
                                    <Radar size={18} />
                                    See Live Signals
                                    <ArrowRight size={16} />
                                </Link>
                            </motion.div>
                        </div>

                        {/* Live Signal Indicators */}
                        <div className="ai-action-signals">
                            {signals.map((sig, i) => (
                                <motion.div
                                    key={i}
                                    className={`signal-card signal-${sig.type}`}
                                    initial={{ opacity: 0, x: 40 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: sig.delay * 0.3 + 0.4, duration: 0.6 }}
                                >
                                    <div className="signal-pulse" />
                                    <div className="signal-content">
                                        <span className="signal-ticker">{sig.ticker}</span>
                                        <span className="signal-label">{sig.label}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </motion.section>

            {/* ─── Footer ──────────────────────────────────────── */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-brand">
                            <img src="/Logo.png" alt="Logo" style={{height: '20px', borderRadius: '4px', objectFit: 'contain'}} />
                            <span>Saral Nivesh</span>
                            <span className="footer-divider">•</span>
                            <span className="footer-sub">ET AI Hackathon 2026</span>
                        </div>
                        <div className="footer-disclaimer">
                            <Shield size={12} />
                            <span>Not financial advice. For educational purposes only. Always consult a SEBI-registered advisor.</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
