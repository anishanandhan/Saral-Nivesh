import { useState, useEffect, useRef } from 'react';
import {
    Terminal, X, RefreshCw, Play, ChevronUp,
    Search, BarChart3, MessageSquare, CheckCircle, Loader
} from 'lucide-react';
import './AgentLogPanel.css';

const API_BASE = 'http://localhost:8000';

/* Color map for each agent */
const AGENT_CONFIG = {
    Scout: { color: '#00d4aa', bg: 'rgba(0,212,170,0.08)', emoji: '🔍', label: 'SCOUT AGENT' },
    Quant: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', emoji: '📊', label: 'QUANT AGENT' },
    Translator: { color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', emoji: '🗣️', label: 'TRANSLATOR AGENT' },
    Error: { color: '#ff4757', bg: 'rgba(255,71,87,0.08)', emoji: '❌', label: 'ERROR' },
};

export default function AgentLogPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [logs, setLogs] = useState([]);            // current display logs
    const [storedLogs, setStoredLogs] = useState([]); // logs from last analysis (for replay)
    const [isReplaying, setIsReplaying] = useState(false);
    const [apiStats, setApiStats] = useState({ total_tokens: 0, total_cost_usd: 0 });
    const [loading, setLoading] = useState(false);
    const bodyRef = useRef(null);

    // Listen for analysis events from AskET page
    useEffect(() => {
        const handleAgentLog = (e) => {
            const newLog = e.detail;
            setStoredLogs(prev => [...prev, newLog]);
            setLogs(prev => [...prev, newLog]);
        };
        const handleAnalysisStart = () => {
            setStoredLogs([]);
            setLogs([]);
        };
        window.addEventListener('agent-log', handleAgentLog);
        window.addEventListener('analysis-start', handleAnalysisStart);
        return () => {
            window.removeEventListener('agent-log', handleAgentLog);
            window.removeEventListener('analysis-start', handleAnalysisStart);
        };
    }, []);

    // Toggle on backtick key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === '`' || e.key === '~') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Fetch API stats when opened
    useEffect(() => {
        if (isOpen) fetchStats();
    }, [isOpen]);

    // Auto-scroll to bottom on new log
    useEffect(() => {
        if (bodyRef.current) {
            bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
        }
    }, [logs]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/audit-log?limit=5`);
            const data = await res.json();
            setApiStats(data.stats || { total_tokens: 0, total_cost_usd: 0 });
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    };

    // Replay logs with streaming effect
    const replayLogs = async () => {
        if (storedLogs.length === 0 || isReplaying) return;
        setIsReplaying(true);
        setLogs([]);
        for (let i = 0; i < storedLogs.length; i++) {
            await new Promise(r => setTimeout(r, 500));
            setLogs(prev => [...prev, storedLogs[i]]);
        }
        setIsReplaying(false);
    };

    const getAgentConfig = (name) => AGENT_CONFIG[name] || AGENT_CONFIG.Error;

    // Collapsed button
    if (!isOpen) {
        return (
            <button className="agent-trigger-btn" onClick={() => setIsOpen(true)}>
                <Terminal size={16} />
                <span>Agent Logs</span>
                {storedLogs.length > 0 && (
                    <span className="log-count-badge">{storedLogs.length}</span>
                )}
                <span className="kb-shortcut">`</span>
            </button>
        );
    }

    return (
        <div className="agent-panel animate-slide-up">
            {/* Header */}
            <div className="ap-header">
                <div className="ap-title">
                    <Terminal size={14} className="ap-icon" />
                    <span>🧠 Agent Orchestration Log</span>
                    <span className="ap-live-badge">
                        <span className="pulse"></span> Live
                    </span>
                </div>
                <div className="ap-actions">
                    {storedLogs.length > 0 && (
                        <button
                            className={`replay-btn ${isReplaying ? 'replaying' : ''}`}
                            onClick={replayLogs}
                            disabled={isReplaying}
                            title="Replay AI thinking"
                        >
                            {isReplaying ? <Loader size={12} className="spinning" /> : <Play size={12} />}
                            <span>{isReplaying ? 'Replaying...' : 'Replay'}</span>
                        </button>
                    )}
                    <button className={`btn-icon ${loading ? 'spinning' : ''}`} onClick={fetchStats}>
                        <RefreshCw size={14} />
                    </button>
                    <button className="btn-icon" onClick={() => setIsOpen(false)}>
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Stats bar */}
            <div className="ap-stats">
                <div className="ap-stat">🪙 Cost: ${apiStats.total_cost_usd?.toFixed(4) || '0.0000'}</div>
                <div className="ap-stat">⚡ Tokens: {apiStats.total_tokens?.toLocaleString() || 0}</div>
                <div className="ap-stat">📋 Steps: {logs.length}</div>
            </div>

            {/* Log body */}
            <div className="ap-body" ref={bodyRef}>
                {logs.length === 0 && !isReplaying ? (
                    <div className="ap-empty">
                        <Terminal size={24} style={{ opacity: 0.12 }} />
                        <p className="ap-waiting">Waiting for analysis...</p>
                        <p className="ap-waiting-sub">
                            Open the <strong>AI Co-Pilot</strong> page and analyze a stock.
                            Agent logs will stream here in real-time.
                        </p>
                        <div className="ap-agent-preview">
                            <span style={{ color: AGENT_CONFIG.Scout.color }}>🔍 Scout</span>
                            <span className="ap-arrow">→</span>
                            <span style={{ color: AGENT_CONFIG.Quant.color }}>📊 Quant</span>
                            <span className="ap-arrow">→</span>
                            <span style={{ color: AGENT_CONFIG.Translator.color }}>🗣️ Translator</span>
                        </div>
                    </div>
                ) : (
                    <div className="ap-log-list">
                        {logs.map((log, i) => {
                            const cfg = getAgentConfig(log.agent);
                            const isLast = i === logs.length - 1;
                            return (
                                <div
                                    key={i}
                                    className={`ap-log-item ${isLast && isReplaying ? 'log-appearing' : 'log-visible'}`}
                                    style={{ '--agent-color': cfg.color, '--agent-bg': cfg.bg }}
                                >
                                    <div className="ap-log-line-indicator" style={{ background: cfg.color }}></div>
                                    <div className="ap-log-content">
                                        <div className="ap-log-header">
                                            <span className="ap-agent-tag" style={{ color: cfg.color, background: cfg.bg }}>
                                                {cfg.emoji} {cfg.label}
                                            </span>
                                            <span className="ap-status-badge">
                                                {log.status === 'error' ? (
                                                    <span className="status-error">✗ Error</span>
                                                ) : (
                                                    <span className="status-done">✔ Complete</span>
                                                )}
                                            </span>
                                        </div>
                                        <div className="ap-log-action">{log.action}</div>
                                        {log.details && (
                                            <div className="ap-log-details">
                                                <span className="ap-detail-arrow">↳</span> {log.details}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {isReplaying && (
                            <div className="ap-log-item log-typing">
                                <div className="ap-log-line-indicator" style={{ background: '#f59e0b' }}></div>
                                <div className="ap-log-content">
                                    <div className="typing-dots">
                                        <span></span><span></span><span></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
