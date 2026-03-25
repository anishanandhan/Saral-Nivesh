import { useState, useEffect } from 'react';
import { 
    Terminal, X, Activity, Server, Database, 
    Cpu, Zap, DollarSign, Clock, Settings, RefreshCw 
} from 'lucide-react';
import './AgentLogPanel.css';

const API_BASE = 'http://localhost:8000';

export default function AgentLogPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({ total_tokens: 0, total_cost_usd: 0 });
    const [loading, setLoading] = useState(false);

    // Toggle on '`' (backtick) or '~' key
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

    // Fetch logs when opened or manually
    useEffect(() => {
        if (isOpen) {
            fetchLogs();
            // Optional: poll every 5 seconds
            const interval = setInterval(fetchLogs, 5000);
            return () => clearInterval(interval);
        }
    }, [isOpen]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/audit-log?limit=50`);
            const data = await res.json();
            setLogs(data.logs || []);
            setStats(data.stats || { total_tokens: 0, total_cost_usd: 0 });
        } catch (err) {
            console.error('Failed to fetch audit logs:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button className="agent-trigger-btn" onClick={() => setIsOpen(true)}>
                <Terminal size={16} />
                <span>Agent Logs</span>
                <span className="kb-shortcut">`</span>
            </button>
        );
    }

    return (
        <div className="agent-panel animate-slide-up">
            <div className="ap-header">
                <div className="ap-title">
                    <Terminal size={14} className="ap-icon" />
                    <span>Agent Orchestration Log</span>
                    <span className="ap-live-badge"><span className="pulse"></span> Live</span>
                </div>
                <div className="ap-actions">
                    <button className={`btn-icon ${loading ? 'spinning' : ''}`} onClick={fetchLogs}>
                        <RefreshCw size={14} />
                    </button>
                    <button className="btn-icon" onClick={() => setIsOpen(false)}>
                        <X size={14} />
                    </button>
                </div>
            </div>

            <div className="ap-stats">
                <div className="ap-stat">
                    <Server size={12} />
                    <span>Cost: ${stats.total_cost_usd?.toFixed(4) || '0.0000'}</span>
                </div>
                <div className="ap-stat">
                    <Cpu size={12} />
                    <span>Tokens: {stats.total_tokens?.toLocaleString() || 0}</span>
                </div>
                <div className="ap-stat">
                    <Database size={12} />
                    <span>Logs: {logs.length}</span>
                </div>
            </div>

            <div className="ap-body">
                {logs.length === 0 ? (
                    <div className="ap-empty">No agent activity logged yet.</div>
                ) : (
                    <div className="ap-log-list">
                        {logs.map((log, i) => (
                            <div key={i} className={`ap-log-item ${log.status}`}>
                                <div className="ap-log-header">
                                    <span className={`log-agent badge-${log.agent_name.toLowerCase()}`}>
                                        {log.agent_name}
                                    </span>
                                    <span className="log-action">{log.action}</span>
                                    <span className="log-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                </div>
                                
                                {log.model_used && (
                                    <div className="log-meta">
                                        <Cpu size={10} /> {log.model_used} 
                                        ({log.tokens_used} tkns = ${log.cost_usd?.toFixed(5)})
                                    </div>
                                )}
                                
                                {log.details && (
                                    <div className="log-details">
                                        <pre>{log.details}</pre>
                                    </div>
                                )}

                                {log.confidence !== null && log.confidence !== undefined && (
                                    <div className="log-meta confidence">
                                        <strong>Confidence:</strong> {log.confidence}%
                                    </div>
                                )}
                                
                                {log.status === 'error' && log.error && (
                                    <div className="log-error">
                                        {log.error}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
