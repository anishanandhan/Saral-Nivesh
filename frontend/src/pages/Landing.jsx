import { Link } from 'react-router-dom';
import {
    Radar, TrendingUp, MessageSquare, Zap, ArrowRight,
    Shield, Eye, BarChart3, Users, Activity, AlertTriangle
} from 'lucide-react';
import './Landing.css';

const stats = [
    { value: '14 Cr+', label: 'Demat Accounts', icon: Users },
    { value: '2,400+', label: 'NSE Stocks Scanned', icon: Eye },
    { value: '47', label: 'Signals Today', icon: Activity },
    { value: '78%', label: 'Avg Pattern Accuracy', icon: BarChart3 },
];

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
        icon: MessageSquare,
        title: 'Ask ET — Market AI',
        description: 'Ask anything about Indian stocks in plain English. "How does the RBI rate cut affect my portfolio?" Get clear, data-driven answers with real source links.',
        path: '/ask',
        gradient: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
        tag: 'CONVERSATIONAL',
    },
];

export default function Landing() {
    return (
        <div className="landing">
            {/* Hero Section */}
            <section className="hero">
                <div className="container">
                    <div className="hero-content">
                        <div className="hero-badge">
                            <Zap size={14} />
                            <span>AI-Powered • Real-Time • NSE/BSE</span>
                        </div>
                        <h1 className="hero-title">
                            Stop Flying Blind.
                            <br />
                            <span className="gradient-text">Start Seeing Signals.</span>
                        </h1>
                        <p className="hero-subtitle">
                            Stock market data is confusing for beginners. We've built an AI agent that monitors the Indian stock market for you, finds potential opportunities, and explains them in plain English. No jargon, just clear signals.
                        </p>
                        <div className="hero-actions">
                            <Link to="/radar" className="btn btn-primary btn-lg">
                                <Radar size={18} />
                                Launch Radar
                                <ArrowRight size={16} />
                            </Link>
                            <Link to="/ask" className="btn btn-secondary btn-lg">
                                <MessageSquare size={18} />
                                Try Ask ET
                            </Link>
                        </div>
                        <div className="hero-disclaimer">
                            <AlertTriangle size={12} />
                            <span>For educational purposes only. Not financial advice.</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Ticker */}
            <section className="stats-section">
                <div className="container">
                    <div className="stats-grid">
                        {stats.map((stat, i) => (
                            <div key={i} className={`stat-card animate-fade-in-up stagger-${i + 1}`}>
                                <stat.icon size={20} className="stat-icon" />
                                <div className="stat-value">{stat.value}</div>
                                <div className="stat-label">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="container">
                    <div className="section-header">
                        <h2>Three AI Agents. One Mission.</h2>
                        <p>Turn raw market data into actionable intelligence</p>
                    </div>
                    <div className="features-grid">
                        {features.map((feature, i) => (
                            <Link
                                key={i}
                                to={feature.path}
                                className={`feature-card card animate-fade-in-up stagger-${i + 1}`}
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
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="how-section">
                <div className="container">
                    <div className="section-header">
                        <h2>How It Works</h2>
                        <p>From raw data to actionable alerts in seconds</p>
                    </div>
                    <div className="how-steps">
                        <div className="how-step animate-fade-in-up stagger-1">
                            <div className="step-number">01</div>
                            <h4>AI Scans the Market</h4>
                            <p>Our autonomous agents continuously scan price charts, company news, and large investor trades across the NSE and BSE.</p>
                        </div>
                        <div className="how-connector">→</div>
                        <div className="how-step animate-fade-in-up stagger-2">
                            <div className="step-number">02</div>
                            <h4>Spotting Patterns</h4>
                            <p>The system looks for unusual activity or repeating historical patterns that normally require expert analysis to spot.</p>
                        </div>
                        <div className="how-connector">→</div>
                        <div className="how-step animate-fade-in-up stagger-3">
                            <div className="step-number">03</div>
                            <h4>Plain English Translation</h4>
                            <p>Advanced AI (like ChatGPT) translates complex financial data into simple, balanced alerts explaining exactly what is happening.</p>
                        </div>
                        <div className="how-connector">→</div>
                        <div className="how-step animate-fade-in-up stagger-4">
                            <div className="step-number">04</div>
                            <h4>You Read Clear Signals</h4>
                            <p>You receive easy-to-read alert cards showing both the positive and negative sides, with helpful tips for new investors.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-brand">
                            <Zap size={16} />
                            <span>Opportunity Radar</span>
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
