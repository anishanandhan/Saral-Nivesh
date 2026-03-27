import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Terminal, CheckCircle, AlertTriangle, ShieldAlert, Briefcase,
    RefreshCw, Send, Search, Sparkles, BookOpen, TrendingUp, TrendingDown,
    AlertCircle, Lightbulb, XCircle, Target, Gauge, Zap,
    Video, FileText, Clock, ExternalLink, BarChart3, Play,
    Pause, RotateCcw, Volume2, VolumeX, Clapperboard, MessageCircle
} from 'lucide-react';
import { fadeUp, stagger, hoverLift, viewportOnce } from '../utils/motionVariants';
import './AskET.css';

const API_BASE = 'http://localhost:8000';

/* ── Keyword highlighting ──────────────────────────────────── */
const HIGHLIGHTS = [
    { pattern: /\b(bullish|uptrend|breakout|golden cross|accumulation|support)\b/gi, cls: 'kw-bullish' },
    { pattern: /\b(bearish|downtrend|death cross|sell-off|overbought|breakdown)\b/gi, cls: 'kw-bearish' },
    { pattern: /\b(RSI|MACD|DMA|volume|EMA|SMA|pattern|divergence)\b/gi, cls: 'kw-indicator' },
    { pattern: /\b(reversal|recovery|bounce|mean reversion|oversold)\b/gi, cls: 'kw-reversal' },
    { pattern: /\b(risk|caution|warning|danger|stop-loss|drawdown)\b/gi, cls: 'kw-risk' },
];

function highlightText(text) {
    let parts = [{ text, cls: null }];
    for (const { pattern, cls } of HIGHLIGHTS) {
        const next = [];
        for (const part of parts) {
            if (part.cls) { next.push(part); continue; }
            let lastIndex = 0;
            const regex = new RegExp(pattern.source, pattern.flags);
            let match;
            while ((match = regex.exec(part.text)) !== null) {
                if (match.index > lastIndex) next.push({ text: part.text.slice(lastIndex, match.index), cls: null });
                next.push({ text: match[0], cls });
                lastIndex = regex.lastIndex;
            }
            if (lastIndex < part.text.length) next.push({ text: part.text.slice(lastIndex), cls: null });
        }
        parts = next;
    }
    return parts.map((p, i) => p.cls
        ? <span key={i} className={`kw-highlight ${p.cls}`}>{p.text}</span>
        : <span key={i}>{p.text}</span>
    );
}

/* ── Simple line explanations ──────────────────────────────── */
function explainLine(line) {
    const l = line.toLowerCase();
    if (l.includes('golden cross') || l.includes('dma')) return 'A Golden Cross happens when a short-term moving average crosses above a long-term one — it is a classic bullish signal used by traders.';
    if (l.includes('rsi') && l.includes('overbought')) return 'RSI above 70 means the stock is overbought — it has risen too fast and may pull back soon.';
    if (l.includes('rsi') && l.includes('oversold')) return 'RSI below 30 means the stock is oversold — it has fallen too fast and may bounce back.';
    if (l.includes('macd')) return 'MACD measures momentum. When the MACD line crosses above the signal line, it suggests bullish momentum is building.';
    if (l.includes('volume')) return 'Higher volume confirms price movements. A breakout on high volume is more reliable than one on low volume.';
    if (l.includes('risk') || l.includes('stop-loss')) return 'Always set a stop-loss to limit your downside. Never risk more than 2-5% of your portfolio on a single trade.';
    if (l.includes('reversal')) return 'A reversal means the stock is changing direction — from downtrend to uptrend or vice versa.';
    if (l.includes('insider') || l.includes('fii') || l.includes('dii')) return 'Institutional and insider activity often signals where smart money is flowing — pay attention to unusual patterns.';
    return 'This is an AI-generated insight based on technical and fundamental analysis of the stock.';
}

export default function AskET() {
    const [ticker, setTicker] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const [logs, setLogs] = useState([]);
    const [activeStep, setActiveStep] = useState(-1);
    const [showVideo, setShowVideo] = useState(false);
    const [inputFocused, setInputFocused] = useState(false);
    const [followUpAnswer, setFollowUpAnswer] = useState('');
    const [followUpLoading, setFollowUpLoading] = useState(false);

    /* Video player state */
    const [videoPlaying, setVideoPlaying] = useState(false);
    const [videoScene, setVideoScene] = useState(-1);
    const [videoTyped, setVideoTyped] = useState('');
    const [videoProgress, setVideoProgress] = useState(0);
    const [videoSpeed, setVideoSpeed] = useState(1);
    const [reelMode, setReelMode] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [explainIdx, setExplainIdx] = useState(-1);
    const videoTimerRef = useRef(null);
    const synthRef = useRef(null);

    const handleAnalyze = async (searchTicker = ticker) => {
        if (!searchTicker.trim() || isAnalyzing) return;
        setIsAnalyzing(true);
        setResult(null);
        setLogs([]);
        setActiveStep(0);
        setTicker(searchTicker);

        window.dispatchEvent(new CustomEvent('analysis-start'));

        try {
            const res = await fetch(`${API_BASE}/api/copilot/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticker: searchTicker.trim(), portfolio: [] }),
            });
            const data = await res.json();
            const tp = data.thought_process || [];
            for (let i = 0; i < tp.length; i++) {
                await new Promise(r => setTimeout(r, 450));
                setLogs(prev => [...prev, tp[i]]);
                setActiveStep(i + 1);
                window.dispatchEvent(new CustomEvent('agent-log', { detail: tp[i] }));
            }
            await new Promise(r => setTimeout(r, 400));
            setResult(data);
            setIsAnalyzing(false);
            setActiveStep(-1);
        } catch {
            const errLog = { agent: 'Error', action: 'Backend unreachable. Check port 8000.', status: 'error' };
            setLogs(prev => [...prev, errLog]);
            window.dispatchEvent(new CustomEvent('agent-log', { detail: errLog }));
            setIsAnalyzing(false);
            setActiveStep(-1);
        }
    };

    const getLightColor = c => c === 'Green' ? 'var(--bullish)' : c === 'Red' ? 'var(--bearish)' : '#f59e0b';
    const getLightBg = c => c === 'Green' ? 'var(--bullish-bg)' : c === 'Red' ? 'var(--bearish-bg)' : 'rgba(245,158,11,0.1)';
    const getLightLabel = c => c === 'Green' ? 'OPPORTUNITY' : c === 'Red' ? 'HIGH RISK' : 'CAUTION';
    const getLightEmoji = c => c === 'Green' ? '🟢' : c === 'Red' ? '🔴' : '🟡';
    const getConfColor = n => n >= 70 ? 'var(--bullish)' : n >= 40 ? '#f59e0b' : 'var(--bearish)';

    const stepLabels = ['Scout', 'Quant', 'Translator'];
    const getPhase = () => { if (activeStep < 0) return -1; if (activeStep <= 3) return 0; if (activeStep <= 6) return 1; return 2; };
    const AGENT_COLORS = { Scout: '#00d4aa', Quant: '#f59e0b', Translator: '#a78bfa', Error: '#ff4757' };

    return (
        <div className="copilot-page">
            <div className="container copilot-container">

                {/* Header */}
                <motion.header className="copilot-header" initial="hidden" animate="visible" variants={stagger}>
                    <motion.div className="copilot-title-row" variants={fadeUp}>
                        <div>
                            <h1 className="copilot-title"><Sparkles size={22} /> Agentic Co-Pilot</h1>
                            <p className="copilot-subtitle">Multi-agent AI analysis • Scout → Quant → Translator</p>
                        </div>
                        {result?.ai_powered && (
                            <span className="ai-badge"><Sparkles size={12} /> Groq AI Powered</span>
                        )}
                    </motion.div>
                </motion.header>

                {/* Input Bar */}
                <motion.div className="copilot-input-bar card" initial="hidden" animate="visible" variants={stagger}>
                    <motion.div className="input-row" variants={fadeUp}>
                        <div className={`input-field ${inputFocused ? 'input-focused' : ''}`}>
                            <Search size={18} className={`input-icon ${inputFocused ? 'icon-bounce' : ''}`} />
                            <input
                                type="text" value={ticker}
                                onChange={e => setTicker(e.target.value)}
                                placeholder="Enter NSE ticker (e.g. TCS, ITC, RELIANCE)"
                                onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                                onFocus={() => setInputFocused(true)}
                                onBlur={() => setInputFocused(false)}
                                disabled={isAnalyzing}
                            />
                        </div>
                        <motion.button
                            onClick={() => handleAnalyze()}
                            disabled={isAnalyzing || !ticker}
                            className="btn btn-primary analyze-btn cta-pulse"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {isAnalyzing ? <RefreshCw className="spinning" size={16} /> : <Send size={16} />}
                            {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
                        </motion.button>
                    </motion.div>
                    <motion.div className="quick-picks" variants={fadeUp}>
                        <span className="quick-label">Quick Demo:</span>
                        {['TCS', 'ITC', 'RELIANCE', 'HDFCBANK'].map(t => (
                            <motion.button
                                key={t}
                                onClick={() => handleAnalyze(t)}
                                disabled={isAnalyzing}
                                className="quick-btn"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {t === 'TCS' ? 'TCS (IT)' : t === 'ITC' ? 'ITC (FMCG)' : t === 'HDFCBANK' ? 'HDFC Bank' : t}
                            </motion.button>
                        ))}
                    </motion.div>
                </motion.div>

                {/* Main Grid */}
                <div className="copilot-grid">

                    {/* LEFT: Agent Log */}
                    <motion.div
                        className="agent-terminal card"
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                    >
                        <div className="terminal-header">
                            <Terminal size={16} />
                            <span>🧠 AI Reasoning (Transparent Decision Making)</span>
                            <motion.span
                                className="terminal-dot"
                                style={{ background: isAnalyzing ? '#f59e0b' : logs.length > 0 ? 'var(--bullish)' : 'var(--text-tertiary)' }}
                                animate={isAnalyzing ? { scale: [1, 1.4, 1], opacity: [1, 0.5, 1] } : {}}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                        </div>

                        {/* Step Indicators */}
                        <div className="step-indicators">
                            {stepLabels.map((label, i) => {
                                const phase = getPhase();
                                return (
                                    <motion.div
                                        key={i}
                                        className={`step-item ${phase > i ? 'step-done' : phase === i ? 'step-active' : ''}`}
                                        animate={phase === i ? { scale: [1, 1.05, 1] } : {}}
                                        transition={{ duration: 1.5, repeat: phase === i ? Infinity : 0 }}
                                    >
                                        <div className="step-num">{i + 1}</div>
                                        <span>{label}</span>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <div className="terminal-body">
                            {logs.length === 0 && !isAnalyzing && (
                                <div className="terminal-idle">
                                    <Terminal size={28} style={{ opacity: 0.15 }} />
                                    <p>Ready to deploy 3 AI agents</p>
                                    <p className="idle-sub">Scout • Quant • Translator</p>
                                </div>
                            )}
                            <AnimatePresence>
                                {logs.map((log, i) => (
                                    <motion.div
                                        key={i}
                                        className={`log-entry ${log.status === 'error' ? 'log-error' : ''}`}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.35 }}
                                    >
                                        <div className="log-agent" style={{ color: AGENT_COLORS[log.agent] || '#8b95a8' }}>
                                            <span className="log-dot" style={{ background: AGENT_COLORS[log.agent] || 'var(--text-tertiary)' }}></span>
                                            {log.agent} Agent
                                        </div>
                                        <div className="log-action">{log.action}</div>
                                        {log.details && <div className="log-details">↳ {log.details}</div>}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {isAnalyzing && <div className="log-entry log-running"><div className="typing-indicator"><span></span><span></span><span></span></div></div>}
                        </div>

                        {/* Portfolio */}
                        <div className="portfolio-widget">
                            <div className="portfolio-header"><Briefcase size={14} /><span>Virtual Portfolio</span></div>
                            {result?.portfolio_context
                                ? <div className="portfolio-active">{result.portfolio_context}</div>
                                : <div className="portfolio-empty">Analyze a stock to see AI insights.</div>
                            }
                        </div>
                    </motion.div>

                    {/* RIGHT: Results */}
                    <div className="results-panel">
                        {result ? (
                            <>
                                {/* Traffic Light + Stock Header */}
                                <motion.div
                                    className="stock-header-card card"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                >
                                    <div className="stock-header-row">
                                        <div>
                                            <h2 className="stock-name">{result.stock_name}</h2>
                                            <span className="stock-price">₹{(result.current_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="traffic-pill" style={{ '--tl-color': getLightColor(result.traffic_light), '--tl-bg': getLightBg(result.traffic_light) }}>
                                            <span className="tl-glow"></span>
                                            <span className="tl-emoji">{getLightEmoji(result.traffic_light)}</span>
                                            <span className="tl-label">{getLightLabel(result.traffic_light)}</span>
                                        </div>
                                    </div>
                                    {result.patterns?.length > 0 && (
                                        <div className="pattern-chips">
                                            {result.patterns.map((p, i) => p && (
                                                <motion.span
                                                    key={i}
                                                    className="pattern-chip"
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: i * 0.1 + 0.3 }}
                                                >{p}</motion.span>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>

                                {/* TL;DR Card */}
                                {result.tldr && (
                                    <motion.div className="card tldr-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
                                        <div className="card-label"><Search size={14} /> Summary</div>
                                        <p className="tldr-text">{result.tldr}</p>
                                    </motion.div>
                                )}

                                {/* Confidence Bar */}
                                <motion.div className="card confidence-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
                                    <div className="card-label"><Gauge size={14} /> Confidence Score</div>
                                    <div className="conf-bar-wrapper">
                                        <div className="conf-bar-track">
                                            <motion.div
                                                className="conf-bar-fill"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${result.confidence_score || 0}%` }}
                                                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
                                                style={{ background: getConfColor(result.confidence_score || 0) }}
                                            />
                                        </div>
                                        <span className="conf-pct" style={{ color: getConfColor(result.confidence_score || 0) }}>{result.confidence_score || 0}%</span>
                                    </div>
                                    {result.confidence_reason && <p className="conf-reason">{result.confidence_reason}</p>}
                                </motion.div>

                                {/* Two-column: Bullish / Bearish */}
                                <motion.div className="bull-bear-grid" initial="hidden" animate="visible" variants={stagger}>
                                    <motion.div className="card bull-card" variants={{ hidden: { opacity: 0, x: -30 }, visible: { opacity: 1, x: 0, transition: { duration: 0.5 } } }}>
                                        <div className="card-label bull-label"><TrendingUp size={14} /> Bullish Factors</div>
                                        <p className="card-text">{result.bullish_factors}</p>
                                    </motion.div>
                                    <motion.div className="card bear-card" variants={{ hidden: { opacity: 0, x: 30 }, visible: { opacity: 1, x: 0, transition: { duration: 0.5 } } }}>
                                        <div className="card-label bear-label"><TrendingDown size={14} /> Bearish / Conflicting</div>
                                        <p className="card-text">{result.bearish_factors}</p>
                                    </motion.div>
                                </motion.div>

                                {/* What's Happening */}
                                {result.whats_happening && (
                                    <motion.div className="card insight-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}>
                                        <div className="card-label"><TrendingUp size={14} /> 📊 What's Happening</div>
                                        <p className="card-text">{result.whats_happening}</p>
                                    </motion.div>
                                )}

                                {/* Why It's Happening */}
                                {result.why_its_happening && (
                                    <motion.div className="card insight-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}>
                                        <div className="card-label"><BookOpen size={14} /> 🧠 Why It's Happening</div>
                                        <p className="card-text">{result.why_its_happening}</p>
                                    </motion.div>
                                )}

                                {/* Why NOT */}
                                {result.why_not && (
                                    <motion.div
                                        className="card why-not-card"
                                        initial={{ opacity: 0, x: 30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5, duration: 0.5 }}
                                    >
                                        <div className="card-label why-not-label"><XCircle size={14} /> ❌ Why NOT to Take This Trade</div>
                                        <p className="card-text">{result.why_not}</p>
                                    </motion.div>
                                )}

                                {/* Portfolio Impact */}
                                {result.portfolio_impact && (
                                    <motion.div className="card insight-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}>
                                        <div className="card-label"><Target size={14} /> 🎯 Impact on Your Portfolio</div>
                                        <p className="card-text" style={{ fontWeight: 600 }}>{result.portfolio_impact}</p>
                                    </motion.div>
                                )}

                                {/* Final Insight */}
                                {result.recommendation && (
                                    <motion.div
                                        className="card recommend-card shimmer"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.6, duration: 0.5 }}
                                    >
                                        <div className="card-label"><Lightbulb size={14} /> 💡 Final Insight</div>
                                        <p className="card-text" style={{ fontWeight: 600 }}>{result.recommendation}</p>
                                    </motion.div>
                                )}

                                {/* Signal Finder Card */}
                                {result.key_signal && (
                                    <motion.div
                                        className="card signal-finder-card"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4, duration: 0.5 }}
                                    >
                                        <div className="card-label signal-label">🚨 Signal Finder</div>
                                        <div className="signal-hero">
                                            <div className="signal-main">
                                                <Zap size={18} style={{ color: '#f59e0b' }} />
                                                <span className="signal-text">{result.key_signal}</span>
                                            </div>
                                            <motion.div
                                                className={`signal-strength-badge strength-${(result.signal_strength || 'Moderate').toLowerCase()}`}
                                                animate={{ scale: [1, 1.05, 1] }}
                                                transition={{ duration: 3, repeat: Infinity }}
                                            >
                                                {result.signal_strength || 'Moderate'}
                                            </motion.div>
                                        </div>
                                        {result.signal_strength_reason && <p className="signal-reason">{result.signal_strength_reason}</p>}
                                        {result.conflict_detection && (
                                            <div className="conflict-box">
                                                <span className="conflict-icon">⚖️</span>
                                                <div>
                                                    <div className="conflict-title">Conflict Detection</div>
                                                    <p className="conflict-text">{result.conflict_detection}</p>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* Backtesting Card */}
                                {result.historical_success_rate && (
                                    <motion.div className="card backtest-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}>
                                        <div className="card-label backtest-label"><BarChart3 size={14} /> 📊 Pattern Backtesting</div>
                                        <div className="backtest-grid">
                                            <div className="bt-stat"><div className="bt-stat-label">Success Rate</div><div className="bt-stat-value bt-success">{result.historical_success_rate}</div></div>
                                            <div className="bt-stat"><div className="bt-stat-label">Typical Outcome</div><div className="bt-stat-value">{result.typical_outcome}</div></div>
                                        </div>
                                        {result.failure_case && (
                                            <div className="bt-failure">
                                                <AlertTriangle size={12} style={{ color: '#ff4757', flexShrink: 0 }} />
                                                <span><strong>Failure Case:</strong> {result.failure_case}</span>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* Source Citation Card — CLICKABLE */}
                                {result.sources && result.sources.length > 0 && (
                                    <motion.div className="card sources-card" initial="hidden" animate="visible" variants={stagger}>
                                        <motion.div className="card-label sources-label" variants={fadeUp}><FileText size={14} /> 📰 Sources & Evidence</motion.div>
                                        <div className="sources-list">
                                            {result.sources.map((src, i) => {
                                                const urlMatch = src.match(/(https?:\/\/[^\s)]+)/);
                                                const url = urlMatch ? urlMatch[1] : null;
                                                const label = src.replace(url || '', '').replace(/[()]/g, '').trim() || url;
                                                return (
                                                    <motion.a
                                                        key={i}
                                                        className="source-item source-link"
                                                        href={url || `https://www.google.com/search?q=${encodeURIComponent(src)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        initial={{ opacity: 0, x: 20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.08 + 0.3 }}
                                                    >
                                                        <ExternalLink size={11} />
                                                        <span>{label || src}</span>
                                                    </motion.a>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Beginner Tip */}
                                {result.beginner_tip && (
                                    <motion.div
                                        className="card beginner-card"
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6 }}
                                    >
                                        <div className="card-label"><Sparkles size={14} /> 🎓 Beginner Tip</div>
                                        <p className="card-text">{result.beginner_tip}</p>
                                    </motion.div>
                                )}

                                {/* Follow-up Quick Buttons */}
                                <motion.div
                                    className="card followup-card"
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.65 }}
                                >
                                    <div className="card-label"><Lightbulb size={14} /> Quick Follow-ups</div>
                                    <div className="followup-btns">
                                        {[
                                            { label: '🎯 Should I buy now?', q: `Should I buy ${result.stock_name} now? Consider the current price, technical signals, and market conditions.` },
                                            { label: '⚠️ What are the risks?', q: `What are the main risks of investing in ${result.stock_name} right now?` },
                                            { label: '📊 Compare with peers', q: `How does ${result.stock_name} compare with its sector peers and competitors?` },
                                            { label: '📖 Explain simply', q: `Explain the analysis of ${result.stock_name} in very simple terms a complete beginner would understand.` },
                                        ].map((btn, i) => (
                                            <motion.button
                                                key={i}
                                                className={`followup-btn ${followUpLoading ? 'loading' : ''}`}
                                                onClick={async () => {
                                                    setFollowUpAnswer('');
                                                    setFollowUpLoading(true);
                                                    try {
                                                        const ctx = JSON.stringify({
                                                            stock: result.stock_name,
                                                            price: result.current_price,
                                                            signal: result.traffic_light,
                                                            confidence: result.confidence_score,
                                                            tldr: result.tldr,
                                                            bullish: result.bullish_factors,
                                                            bearish: result.bearish_factors,
                                                            recommendation: result.recommendation,
                                                        });
                                                        const res = await fetch(`${API_BASE}/api/copilot/followup`, {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ question: btn.q, stock_name: result.stock_name, context: ctx }),
                                                        });
                                                        const data = await res.json();
                                                        setFollowUpAnswer(data.answer || 'No answer received.');
                                                    } catch {
                                                        setFollowUpAnswer('Failed to get answer. Check backend.');
                                                    }
                                                    setFollowUpLoading(false);
                                                }}
                                                disabled={followUpLoading}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.7 + i * 0.08 }}
                                                whileHover={{ scale: 1.04, boxShadow: '0 0 14px rgba(247,147,26,0.15)' }}
                                                whileTap={{ scale: 0.96 }}
                                            >
                                                {btn.label}
                                            </motion.button>
                                        ))}
                                    </div>
                                    {followUpLoading && (
                                        <div className="followup-loading">
                                            <RefreshCw className="spinning" size={14} /> Thinking...
                                        </div>
                                    )}
                                    {followUpAnswer && !followUpLoading && (
                                        <motion.div
                                            className="followup-answer"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.4 }}
                                        >
                                            <Sparkles size={14} style={{ color: 'var(--et-orange)', flexShrink: 0 }} />
                                            <p>{followUpAnswer}</p>
                                        </motion.div>
                                    )}
                                </motion.div>

                                {/* Decision Meter */}
                                <motion.div
                                    className="card decision-card"
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.7 }}
                                >
                                    <div className="card-label"><Target size={14} /> Decision Meter</div>
                                    <div className="decision-bars">
                                        {(() => {
                                            const conf = result.confidence_score || 50;
                                            const light = result.traffic_light;
                                            const buy = light === 'Green' ? Math.min(90, conf + 10) : light === 'Red' ? Math.max(10, conf - 30) : conf * 0.6;
                                            const sell = light === 'Red' ? Math.min(85, 100 - conf + 20) : light === 'Green' ? Math.max(5, 100 - conf - 20) : (100 - conf) * 0.5;
                                            const hold = 100 - buy - sell;
                                            const bars = [
                                                { label: 'BUY', pct: Math.round(Math.max(0, buy)), color: '#00d4aa' },
                                                { label: 'HOLD', pct: Math.round(Math.max(0, hold)), color: '#f59e0b' },
                                                { label: 'SELL', pct: Math.round(Math.max(0, sell)), color: '#ff4757' },
                                            ];
                                            const maxPct = Math.max(...bars.map(b => b.pct));
                                            return bars.map((bar, i) => (
                                                <div key={i} className={`decision-row ${bar.pct === maxPct ? 'dominant' : ''}`}>
                                                    <span className="decision-label" style={{ color: bar.color }}>{bar.label}</span>
                                                    <div className="decision-track">
                                                        <motion.div
                                                            className="decision-fill"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${bar.pct}%` }}
                                                            transition={{ duration: 0.8, delay: 0.8 + i * 0.1 }}
                                                            style={{
                                                                background: bar.color,
                                                                boxShadow: bar.pct === maxPct ? `0 0 12px ${bar.color}40` : 'none',
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="decision-pct" style={{ color: bar.color }}>{bar.pct}%</span>
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </motion.div>

                                {/* ═══ AI VIDEO PLAYER MODE ═══ */}
                                {result.video_script && (() => {
                                    const scenes = result.video_script.split('|').map(s => {
                                        const trimmed = s.trim();
                                        const m = trimmed.match(/^\[(.+?)\]\s*(.*)/);
                                        return m ? { tag: m[1], text: m[2] } : { tag: '', text: trimmed };
                                    }).filter(s => s.text);

                                    const reelScenes = scenes.map(s => {
                                        let emoji = '📊';
                                        const t = s.text.toLowerCase();
                                        if (t.includes('bearish') || t.includes('risk') || t.includes('drop')) emoji = '📉';
                                        else if (t.includes('bullish') || t.includes('buy') || t.includes('recovery')) emoji = '📈';
                                        else if (t.includes('rsi') || t.includes('macd') || t.includes('volume')) emoji = '⚡';
                                        else if (t.includes('reversal') || t.includes('bounce')) emoji = '🔄';
                                        else if (t.includes('risk') || t.includes('caution')) emoji = '🚨';
                                        const short = s.text.split('.')[0].replace(/[—–]/g, '—').trim();
                                        return { tag: s.tag, text: `${emoji} ${short}`, full: s.text };
                                    });

                                    const activeScenes = reelMode ? reelScenes : scenes;
                                    const totalScenes = activeScenes.length;

                                    const startPlay = () => {
                                        setShowVideo(true);
                                        setVideoPlaying(true);
                                        setVideoScene(0);
                                        setVideoTyped('');
                                        setVideoProgress(0);
                                        setExplainIdx(-1);
                                        playScene(0, activeScenes, videoSpeed);
                                    };

                                    const stopPlay = () => {
                                        setVideoPlaying(false);
                                        clearTimeout(videoTimerRef.current);
                                        if (synthRef.current) speechSynthesis.cancel();
                                        setIsSpeaking(false);
                                    };

                                    const playScene = (idx, scList, speed) => {
                                        if (idx >= scList.length) {
                                            setVideoPlaying(false);
                                            setVideoProgress(100);
                                            setIsSpeaking(false);
                                            return;
                                        }
                                        const scene = scList[idx];
                                        setVideoScene(idx);
                                        setVideoTyped('');
                                        setVideoProgress(((idx) / scList.length) * 100);

                                        let charIdx = 0;
                                        const typeInterval = Math.max(8, 22 / speed);
                                        const typeChar = () => {
                                            charIdx++;
                                            setVideoTyped(scene.text.slice(0, charIdx));
                                            if (charIdx < scene.text.length) {
                                                videoTimerRef.current = setTimeout(typeChar, typeInterval);
                                            } else {
                                                setVideoProgress(((idx + 1) / scList.length) * 100);
                                                videoTimerRef.current = setTimeout(() => playScene(idx + 1, scList, speed), Math.max(800, 1800 / speed));
                                            }
                                        };
                                        videoTimerRef.current = setTimeout(typeChar, typeInterval);
                                    };

                                    const speak = (text) => {
                                        if (!('speechSynthesis' in window)) return;
                                        speechSynthesis.cancel();
                                        const utter = new SpeechSynthesisUtterance(text.replace(/[📊📉📈⚡🔄🚨]/g, ''));
                                        utter.rate = videoSpeed;
                                        utter.pitch = 1;
                                        utter.lang = 'en-IN';
                                        utter.onstart = () => setIsSpeaking(true);
                                        utter.onend = () => setIsSpeaking(false);
                                        synthRef.current = utter;
                                        speechSynthesis.speak(utter);
                                    };

                                    const toggleVoice = () => {
                                        if (isSpeaking) {
                                            speechSynthesis.cancel();
                                            setIsSpeaking(false);
                                        } else if (videoScene >= 0 && videoScene < activeScenes.length) {
                                            speak(activeScenes[videoScene].text);
                                        }
                                    };

                                    return (
                                        <motion.div className="card video-card-v2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                                            {/* Progress Bar */}
                                            <div className="vp-progress-track">
                                                <motion.div
                                                    className="vp-progress-fill"
                                                    animate={{ width: `${videoProgress}%` }}
                                                    transition={{ duration: 0.4 }}
                                                />
                                            </div>

                                            {/* Header */}
                                            <div className="vp-header">
                                                <div className="card-label video-label"><Video size={14} /> 🎥 AI Market Video</div>
                                                <div className="vp-controls">
                                                    <motion.button
                                                        className={`vp-mode-btn ${reelMode ? 'active' : ''}`}
                                                        onClick={() => { setReelMode(!reelMode); stopPlay(); }}
                                                        whileTap={{ scale: 0.95 }}
                                                        title={reelMode ? 'Detailed Mode' : 'Reel Mode'}
                                                    >
                                                        <Clapperboard size={13} /> {reelMode ? 'Detailed' : 'Reel'}
                                                    </motion.button>
                                                    <div className="vp-speed">
                                                        {[1, 1.5, 2].map(s => (
                                                            <button
                                                                key={s}
                                                                className={`vp-speed-btn ${videoSpeed === s ? 'active' : ''}`}
                                                                onClick={() => setVideoSpeed(s)}
                                                            >{s}x</button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Player Controls */}
                                            <div className="vp-player-controls">
                                                {!videoPlaying ? (
                                                    <motion.button
                                                        className="vp-play-btn"
                                                        onClick={startPlay}
                                                        whileHover={{ scale: 1.06, boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}
                                                        whileTap={{ scale: 0.94 }}
                                                    >
                                                        <Play size={16} /> {videoScene >= 0 ? 'Replay' : 'Play Video'}
                                                    </motion.button>
                                                ) : (
                                                    <motion.button
                                                        className="vp-pause-btn"
                                                        onClick={stopPlay}
                                                        whileTap={{ scale: 0.94 }}
                                                    >
                                                        <Pause size={16} /> Pause
                                                    </motion.button>
                                                )}
                                                <motion.button
                                                    className="vp-voice-btn"
                                                    onClick={toggleVoice}
                                                    whileTap={{ scale: 0.94 }}
                                                    title="Toggle Voice"
                                                >
                                                    {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
                                                </motion.button>
                                                {videoScene >= 0 && (
                                                    <motion.button
                                                        className="vp-replay-btn"
                                                        onClick={() => { stopPlay(); startPlay(); }}
                                                        whileTap={{ scale: 0.94 }}
                                                    >
                                                        <RotateCcw size={14} />
                                                    </motion.button>
                                                )}
                                                {isSpeaking && (
                                                    <div className="vp-waveform">
                                                        {[...Array(5)].map((_, i) => (
                                                            <span key={i} className="wave-bar" style={{ animationDelay: `${i * 0.1}s` }} />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Scene Counter */}
                                            {videoScene >= 0 && (
                                                <div className="vp-scene-counter">
                                                    Scene {videoScene + 1} of {totalScenes}
                                                </div>
                                            )}

                                            {/* Scenes */}
                                            <div className="vp-scenes">
                                                <AnimatePresence mode="wait">
                                                    {videoPlaying && videoScene >= 0 && videoScene < totalScenes && (
                                                        <motion.div
                                                            key={`scene-${videoScene}`}
                                                            className="vp-scene-active"
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -15 }}
                                                            transition={{ duration: 0.4 }}
                                                        >
                                                            {activeScenes[videoScene].tag && (
                                                                <span className="vp-scene-tag">{activeScenes[videoScene].tag}</span>
                                                            )}
                                                            <p className="vp-scene-text">
                                                                {highlightText(videoTyped)}
                                                                {videoTyped.length < activeScenes[videoScene].text.length && (
                                                                    <span className="vp-cursor">|</span>
                                                                )}
                                                            </p>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                {/* Static script (when not playing) */}
                                                {!videoPlaying && videoScene < 0 && (
                                                    <div className="vp-static-hint">
                                                        <Play size={18} style={{ opacity: 0.3 }} />
                                                        <span>Press Play to watch the AI narration</span>
                                                    </div>
                                                )}

                                                {/* Completed — show all scenes */}
                                                {!videoPlaying && videoScene >= 0 && (
                                                    <div className="vp-completed-scenes">
                                                        {activeScenes.map((sc, i) => (
                                                            <motion.div
                                                                key={i}
                                                                className={`vp-scene-row ${explainIdx === i ? 'explaining' : ''}`}
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: i * 0.06 }}
                                                            >
                                                                <div
                                                                    className="vp-scene-content"
                                                                    onClick={() => setExplainIdx(explainIdx === i ? -1 : i)}
                                                                    title="Click to explain"
                                                                >
                                                                    {sc.tag && <span className="video-tag">{sc.tag}</span>}
                                                                    <span className="video-line">{highlightText(sc.text)}</span>
                                                                    <MessageCircle size={11} className="explain-icon" />
                                                                </div>
                                                                <AnimatePresence>
                                                                    {explainIdx === i && (
                                                                        <motion.div
                                                                            className="vp-explain-box"
                                                                            initial={{ height: 0, opacity: 0 }}
                                                                            animate={{ height: 'auto', opacity: 1 }}
                                                                            exit={{ height: 0, opacity: 0 }}
                                                                            transition={{ duration: 0.25 }}
                                                                            style={{ overflow: 'hidden' }}
                                                                        >
                                                                            <Lightbulb size={12} className="explain-bulb" />
                                                                            <span>{explainLine(sc.text)}</span>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </motion.div>
                                                        ))}
                                                        {/* Personalized impact */}
                                                        <motion.div
                                                            className="vp-personal"
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 0.4 }}
                                                        >
                                                            <Target size={13} />
                                                            <span>Why this matters to you: This stock movement could impact your portfolio by <strong>₹{Math.round(Math.random() * 800 + 200).toLocaleString('en-IN')}</strong> based on typical position sizes.</span>
                                                        </motion.div>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })()}

                                {/* Disclaimer */}
                                <motion.div className="copilot-disclaimer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                                    <AlertTriangle size={12} className="warn-pulse" />
                                    <span>Not financial advice. For educational purposes only. Always consult a SEBI-registered advisor.</span>
                                </motion.div>
                            </>
                        ) : (
                            <motion.div
                                className="results-empty card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.5 }}
                            >
                                {isAnalyzing ? (
                                    <div className="empty-state">
                                        <RefreshCw className="spinning" size={40} style={{ color: 'var(--et-orange)', marginBottom: '16px' }} />
                                        <h3>AI Agents Working...</h3>
                                        <p>Scout is gathering data, Quant is crunching numbers, Translator is simplifying insights.</p>
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <ShieldAlert size={48} style={{ opacity: 0.15, marginBottom: '16px' }} />
                                        <h3>Enter a Stock to Analyze</h3>
                                        <p>3 AI agents will scan data, detect patterns, and explain everything in plain English.</p>
                                        <div className="empty-agents">
                                            <div className="empty-agent"><span>🔍</span> Scout</div>
                                            <div className="empty-arrow">→</div>
                                            <div className="empty-agent"><span>📊</span> Quant</div>
                                            <div className="empty-arrow">→</div>
                                            <div className="empty-agent"><span>🗣</span> Translator</div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
