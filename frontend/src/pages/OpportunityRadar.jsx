import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Radar, Filter, TrendingUp, TrendingDown, AlertTriangle,
    Search, Clock, ArrowUpRight, ArrowDownRight, Minus,
    Building2, UserCheck, FileText, Activity, Zap, RefreshCw,
    HelpCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import './OpportunityRadar.css';

const NIFTY50_HEATMAP = [
    {t:'RELIANCE',s:0.82,sig:'Golden Cross'},{t:'HDFCBANK',s:0.65,sig:'MACD Bullish'},
    {t:'ICICIBANK',s:0.71,sig:'52W Breakout'},{t:'INFY',s:0.18,sig:'Overbought'},
    {t:'TCS',s:0.55,sig:'Support Hold'},{t:'BAJFINANCE',s:0.88,sig:'Insider Buy'},
    {t:'LT',s:0.42,sig:'Neutral'},{t:'WIPRO',s:-0.35,sig:'Death Cross'},
    {t:'HCLTECH',s:0.61,sig:'Breakout'},{t:'AXISBANK',s:0.73,sig:'Bull Flag'},
    {t:'KOTAKBANK',s:0.38,sig:'Neutral'},{t:'BHARTIARTL',s:0.79,sig:'52W High'},
    {t:'MARUTI',s:0.44,sig:'Neutral'},{t:'TITAN',s:-0.12,sig:'RSI Div'},
    {t:'NTPC',s:0.56,sig:'Breakout'},{t:'POWERGRID',s:0.67,sig:'Insider Buy'},
    {t:'ADANIPORTS',s:-0.28,sig:'Below DMA'},{t:'ONGC',s:0.33,sig:'Neutral'},
    {t:'JSWSTEEL',s:-0.45,sig:'Bearish'},{t:'TATASTEEL',s:-0.31,sig:'Below DMA'},
    {t:'SUNPHARMA',s:0.62,sig:'Bull Cross'},{t:'DRREDDY',s:0.41,sig:'Neutral'},
    {t:'CIPLA',s:0.58,sig:'Breakout'},{t:'DIVISLAB',s:0.35,sig:'Neutral'},
    {t:'APOLLOHOSP',s:0.77,sig:'52W High'},{t:'NESTLEIND',s:0.24,sig:'Neutral'},
    {t:'HINDUNILVR',s:0.31,sig:'Neutral'},{t:'ITC',s:0.49,sig:'Bull Flag'},
    {t:'BRITANNIA',s:-0.18,sig:'Correction'},{t:'MARICO',s:-0.72,sig:'Bulk Deal'},
    {t:'EICHERMOT',s:0.68,sig:'Breakout'},{t:'HEROMOTOCO',s:0.38,sig:'Neutral'},
    {t:'BAJAJ-AUTO',s:0.52,sig:'Neutral'},{t:'M&M',s:0.74,sig:'Bull Flag'},
    {t:'TATAMOTORS',s:-0.22,sig:'Correction'},{t:'SBIN',s:0.61,sig:'52W High'},
    {t:'BANKBARODA',s:0.44,sig:'Neutral'},{t:'INDUSINDBK',s:-0.38,sig:'Below DMA'},
    {t:'BPCL',s:0.29,sig:'Neutral'},{t:'COALINDIA',s:0.53,sig:'Breakout'},
    {t:'GRASIM',s:0.46,sig:'Neutral'},{t:'ULTRACEMCO',s:0.34,sig:'Neutral'},
    {t:'SHREECEM',s:-0.14,sig:'Weak'},{t:'TECHM',s:0.58,sig:'Breakout'},
    {t:'MPHASIS',s:0.71,sig:'Bull Cross'},{t:'LTIM',s:0.83,sig:'Insider Buy'},
    {t:'PERSISTENT',s:0.91,sig:'52W High'},{t:'TATACONSUM',s:0.36,sig:'Neutral'},
    {t:'JSWENERGY',s:0.65,sig:'Breakout'},{t:'ADANIENT',s:-0.55,sig:'Sell-off'}
];

function hmColor(s) {
    if (s > 0.6) return `rgba(0,212,170,${0.2 + s * 0.35})`;
    if (s > 0.3) return `rgba(0,212,170,${0.1 + s * 0.15})`;
    if (s > -0.1) return 'rgba(100,116,139,0.12)';
    if (s > -0.4) return `rgba(255,71,87,${0.08 + Math.abs(s) * 0.2})`;
    return `rgba(255,71,87,${0.15 + Math.abs(s) * 0.35})`;
}
function hmText(s) { return s > 0.2 ? 'var(--bullish)' : s < -0.2 ? 'var(--bearish)' : 'var(--text-secondary)'; }



const MOCK_SIGNALS = [
  {
    id: 's1', ticker: 'RELIANCE.NS', stock_name: 'Reliance Industries', signal_type: 'technical',
    signal: 'bullish', confidence: 78, price_change_pct: 1.24, current_price: 2847.30,
    pattern: 'Golden Cross (50 DMA × 200 DMA)', ai_summary: 'Reliance has formed a Golden Cross — 50-DMA (₹2,741) crossed above 200-DMA (₹2,698) on 1.4× average volume. O2C margin recovery supports the bullish case. 71% win rate on this pattern over 3 years.',
    date: 'Today', rsi_current: 62
  },
  {
    id: 's2', ticker: 'INFY.NS', stock_name: 'Infosys Ltd', signal_type: 'unusual_insider_activity',
    signal: 'neutral', confidence: 52, price_change_pct: -0.43, current_price: 1892.10,
    ai_summary: 'INFY broke above its 52-week high ₹1,878 on 1.6× volume. BUT RSI = 78 (overbought) and key FII reduced exposure 1.8% last filing. Pullback to ₹1,820–1,840 offers better risk-reward.',
    date: 'Today', rsi_current: 78
  },
  {
    id: 's3', ticker: 'MARICO.NS', stock_name: 'Marico Ltd', signal_type: 'bulk_deal',
    signal: 'bearish', confidence: 84, price_change_pct: -6.0, current_price: 541.80,
    ai_summary: 'Promoter sold 4.2% stake at ₹541.80 — 6% discount to close. Cross-referenced Q2 call (flagged rural margin pressure) and 3 consecutive volume declines. Assessment: likely distress, not routine block.',
    date: 'Yesterday', quantity: 15400000, value_crores: 834
  },
  {
    id: 's4', ticker: 'BAJFINANCE.NS', stock_name: 'Bajaj Finance Ltd', signal_type: 'insider_trade',
    signal: 'bullish', confidence: 81, price_change_pct: 3.22, current_price: 7234.50,
    ai_summary: '5 insider transactions in 7 days — CFO + 2 directors bought ₹4.2Cr at ₹7,100–7,280. Cluster purchases exceed 3-trade anomaly threshold. Historically this preceded 20%+ gains in 6 months.',
    date: '2 Days Ago', insider_name: 'Rajeev Jain (MD)', value_crores: 4.2, buyer: 'Insider'
  },
  {
    id: 's5', ticker: 'HDFCBANK.NS', stock_name: 'HDFC Bank', signal_type: 'technical',
    signal: 'bullish', confidence: 65, price_change_pct: 0.87, current_price: 1623.45,
    pattern: 'MACD Bullish Crossover', ai_summary: 'MACD line crossed above signal line on daily timeframe. RSI indicates healthy momentum at 58. Win rate for this pattern historically is 68%.',
    date: 'Today', rsi_current: 58
  },
  {
    id: 's6', ticker: 'WIPRO.NS', stock_name: 'Wipro Ltd', signal_type: 'technical',
    signal: 'bearish', confidence: 61, price_change_pct: -1.12, current_price: 478.60,
    pattern: 'Death Cross', ai_summary: '50-DMA has crossed below the 200-DMA indicating long-term bearish momentum. IT sector weakness combined with lower guidance suggests caution.',
    date: 'Yesterday', rsi_current: 38
  },
  {
    id: 's7', ticker: 'LTIM.NS', stock_name: 'LTI Mindtree', signal_type: 'insider_trade',
    signal: 'bullish', confidence: 73, price_change_pct: 1.88, current_price: 5240.00,
    ai_summary: '2 promoter acquisitions totaling ₹1.8Cr in the open market over the last 48 hours. Strongly suggests confidence in next quarter deal pipeline.',
    date: 'Today', insider_name: 'S. N. Subrahmanyan', value_crores: 1.8, buyer: 'Promoter'
  },
  {
    id: 's8', ticker: 'TITAN.NS', stock_name: 'Titan Company', signal_type: 'technical',
    signal: 'bearish', confidence: 55, price_change_pct: -0.18, current_price: 3520.00,
    pattern: 'RSI Bearish Divergence', ai_summary: 'Price making higher highs while RSI makes lower highs. This bearish divergence typically precedes a minor correction over the next 1-2 weeks.',
    date: 'Yesterday', rsi_current: 72
  }
];

const MOCK_PRICES = [
    { name: 'NIFTY 50', price: 22147.90, change_pct: 0.92 },
    { name: 'SENSEX', price: 73158.24, change_pct: 0.78 },
    { name: 'RELIANCE', price: 2847.30, change_pct: 1.24 },
    { name: 'HDFCBANK', price: 1623.45, change_pct: 0.87 },
    { name: 'INFY', price: 1892.10, change_pct: -0.43 },
    { name: 'TCS', price: 3420.00, change_pct: 1.56 },
];

const SIGNAL_TYPES = [
    { key: 'all', label: 'All Signals', icon: Activity },
    { key: 'bulk_deal', label: 'Bulk Deals', icon: Building2 },
    { key: 'insider_trade', label: 'Insider Trades', icon: UserCheck },
    { key: 'corporate_announcement', label: 'Announcements', icon: FileText },
    { key: 'unusual_insider_activity', label: '🚨 Unusual Activity', icon: AlertTriangle },
    { key: 'technical', label: 'Technical', icon: TrendingUp },
];

function getSignalIcon(type) {
    switch (type) {
        case 'bulk_deal': return Building2;
        case 'insider_trade': return UserCheck;
        case 'corporate_announcement': return FileText;
        case 'unusual_insider_activity': return AlertTriangle;
        default: return Activity;
    }
}

function getSignalLabel(type) {
    switch (type) {
        case 'bulk_deal': return 'Bulk Deal';
        case 'insider_trade': return 'Insider Trade';
        case 'corporate_announcement': return 'Announcement';
        case 'unusual_insider_activity': return 'Unusual Activity';
        default: return 'Technical';
    }
}

function formatCrores(value) {
    if (!value) return '';
    return `₹${value.toLocaleString('en-IN')} Cr`;
}

function formatQuantity(qty) {
    if (!qty) return '';
    if (qty >= 10000000) return `${(qty / 10000000).toFixed(1)} Cr`;
    if (qty >= 100000) return `${(qty / 100000).toFixed(1)} L`;
    return qty.toLocaleString('en-IN');
}

export default function OpportunityRadar() {
    const [signals, setSignals] = useState([]);
    const [techSignals, setTechSignals] = useState([]);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [prices, setPrices] = useState([]);
    const [expandedCard, setExpandedCard] = useState(null);

    const toggleExpand = (id) => {
        setExpandedCard(expandedCard === id ? null : id);
    };

    // Fetch live signals on mount
    useEffect(() => {
        fetchAllData();
    }, []);

    async function fetchAllData() {
        setLoading(true);
        setError(null);
        
        // Simulate network delay
        setTimeout(() => {
            try {
                // Using mock data instead of API calls since backend is not running
                const all = [...MOCK_SIGNALS];
                all.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
                
                const technicalSignals = all.filter(s => s.signal_type === 'technical');

                setSignals(all);
                setTechSignals(technicalSignals);
                setPrices(MOCK_PRICES);
            } catch (err) {
                console.error('Error fetching signals:', err);
                setError('Failed to load mock data.');
            } finally {
                setLoading(false);
            }
        }, 1200);
    }

    const filtered = signals.filter(s => {
        const matchFilter = filter === 'all' || s.signal_type === filter;
        const matchSearch = !search ||
            (s.stock_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (s.ticker || '').toLowerCase().includes(search.toLowerCase());
        return matchFilter && matchSearch;
    });

    const bullishCount = signals.filter(s => s.signal === 'bullish').length;
    const bearishCount = signals.filter(s => s.signal === 'bearish').length;

    return (
        <div className="radar-page">
            <div className="container">
                {/* Header */}
                <div className="radar-header animate-fade-in-up">
                    <div className="radar-title-row">
                        <div>
                            <h1 className="page-title">
                                <Radar size={28} className="title-icon" />
                                Opportunity Radar
                            </h1>
                            <p className="page-subtitle">
                                Live AI-powered signal detection across NSE/BSE — bulk deals, insider trades, technical patterns
                            </p>
                        </div>
                        <button className="btn btn-primary" onClick={fetchAllData} disabled={loading}>
                            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
                            {loading ? 'Scanning Markets...' : 'Scan Now'}
                        </button>
                    </div>

                    {/* Live Price Ticker */}
                    {prices.length > 0 && (
                        <div className="price-ticker">
                            <div className="ticker-track">
                                {prices.map((p, i) => (
                                    <div key={i} className="ticker-item">
                                        <span className="ticker-name">{p.name}</span>
                                        <span className="ticker-price">₹{p.price?.toLocaleString('en-IN')}</span>
                                        <span className={`ticker-change ${p.change_pct >= 0 ? 'up' : 'down'}`}>
                                            {p.change_pct >= 0 ? '+' : ''}{p.change_pct}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Summary Stats */}
                    <div className="radar-stats">
                        <div className="radar-stat">
                            <Activity size={16} />
                            <span className="stat-num">{signals.length}</span>
                            <span>Total Signals</span>
                        </div>
                        <div className="radar-stat bullish">
                            <ArrowUpRight size={16} />
                            <span className="stat-num">{bullishCount}</span>
                            <span>Bullish</span>
                        </div>
                        <div className="radar-stat bearish">
                            <ArrowDownRight size={16} />
                            <span className="stat-num">{bearishCount}</span>
                            <span>Bearish</span>
                        </div>
                        <div className="radar-stat">
                            <Zap size={16} />
                            <span className="stat-num">{techSignals.length}</span>
                            <span>Technical</span>
                        </div>
                    </div>
                </div>

                {/* Nifty 50 Heatmap */}
                <div className="heatmap-card card animate-fade-in-up" style={{marginBottom: 24, padding: 20}}>
                    <div className="heatmap-header">
                        <div>
                            <h3 style={{fontSize: '1rem', fontWeight: 700}}>Nifty 50 Signal Heatmap</h3>
                            <p style={{fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 2}}>Click any stock to view detailed chart & analysis</p>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:8,fontSize:'0.7rem',fontFamily:'JetBrains Mono',color:'var(--text-tertiary)'}}>
                            <span>BEAR</span>
                            <div style={{width:80,height:8,borderRadius:4,background:'linear-gradient(to right,var(--bearish),var(--bg-tertiary),var(--bullish))'}}></div>
                            <span>BULL</span>
                        </div>
                    </div>
                    <div className="heatmap-grid">
                        {NIFTY50_HEATMAP.map((stock, i) => (
                            <Link
                                key={i}
                                to={`/stock/${stock.t}`}
                                className="hm-cell"
                                style={{ background: hmColor(stock.s), color: hmText(stock.s) }}
                                title={`${stock.t} · ${stock.sig}`}
                            >
                                {stock.t.length > 6 ? stock.t.slice(0, 5) : stock.t}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Filters */}
                <div className="radar-filters animate-fade-in-up stagger-1">
                    <div className="filter-tabs">
                        {SIGNAL_TYPES.map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                className={`btn btn-ghost ${filter === key ? 'active' : ''}`}
                                onClick={() => setFilter(key)}
                            >
                                <Icon size={14} />
                                {label}
                            </button>
                        ))}
                    </div>
                    <div className="search-box">
                        <Search size={16} />
                        <input type="text" placeholder="Search stocks..."
                            value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>

                {/* Signal Feed */}
                <div className="signal-feed">
                    {error ? (
                        <div className="loading-container">
                            <AlertTriangle size={40} style={{ color: 'var(--bearish)' }} />
                            <span className="loading-text">{error}</span>
                            <button className="btn btn-secondary" onClick={fetchAllData}>Retry</button>
                        </div>
                    ) : loading ? (
                        <div className="loading-container">
                            <div className="spinner"></div>
                            <span className="loading-text">Fetching live market data from NSE/BSE...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="loading-container">
                            <Filter size={40} style={{ color: 'var(--text-tertiary)' }} />
                            <span className="loading-text">No signals match your filters</span>
                        </div>
                    ) : (
                        filtered.map((signal, i) => {
                            const SignalIcon = getSignalIcon(signal.signal_type);
                            return (
                                <div key={signal.id || i}
                                    className={`signal-card card animate-fade-in-up stagger-${Math.min(i + 1, 8)} ${signal.signal_type === 'unusual_insider_activity' ? 'signal-card-alert' : ''
                                        }`}>
                                    <div className="signal-card-header">
                                        <div className="signal-stock-info">
                                            <Link to={`/stock/${(signal.ticker || '').replace('.NS', '')}`} className="signal-stock-name" style={{color:'var(--text-primary)',textDecoration:'none'}}>
                                                <h3 style={{display:'inline'}}>{signal.stock_name}</h3>
                                            </Link>
                                            <span className="signal-ticker">{(signal.ticker || '').replace('.NS', '')}</span>
                                            {signal.sector && <span className="signal-sector">{signal.sector}</span>}
                                        </div>
                                        <div className="signal-meta">
                                            <span className={`badge badge-${signal.signal}`}>
                                                {signal.signal === 'bullish' ? <ArrowUpRight size={12} /> :
                                                    signal.signal === 'bearish' ? <ArrowDownRight size={12} /> :
                                                        <Minus size={12} />}
                                                {(signal.signal || 'neutral').toUpperCase()}
                                            </span>
                                            <span className="badge badge-type">
                                                <SignalIcon size={11} />
                                                {getSignalLabel(signal.signal_type)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="signal-card-body">
                                        <div className="signal-summary-box">
                                            <p className="signal-summary">{signal.ai_summary || signal.description}</p>
                                        </div>
                                        <div className="signal-details">
                                            {signal.value_crores && (
                                                <div className="signal-detail">
                                                    <span className="detail-label">Deal Value</span>
                                                    <span className="detail-value">{formatCrores(signal.value_crores)}</span>
                                                </div>
                                            )}
                                            {signal.quantity && (
                                                <div className="signal-detail">
                                                    <span className="detail-label">Quantity</span>
                                                    <span className="detail-value">{formatQuantity(signal.quantity)} shares</span>
                                                </div>
                                            )}
                                            {signal.current_price && (
                                                <div className="signal-detail">
                                                    <span className="detail-label">Current Price</span>
                                                    <span className="detail-value">₹{signal.current_price.toLocaleString('en-IN')}</span>
                                                </div>
                                            )}
                                            {signal.price_change_pct !== undefined && (
                                                <div className="signal-detail">
                                                    <span className="detail-label">Change</span>
                                                    <span className={`detail-value ${signal.price_change_pct >= 0 ? 'up' : 'down'}`}>
                                                        {signal.price_change_pct >= 0 ? '+' : ''}{signal.price_change_pct}%
                                                    </span>
                                                </div>
                                            )}
                                            {signal.insider_name && (
                                                <div className="signal-detail">
                                                    <span className="detail-label">Insider</span>
                                                    <span className="detail-value">{signal.insider_name}</span>
                                                </div>
                                            )}
                                            {signal.buyer && signal.buyer !== 'Open Market' && (
                                                <div className="signal-detail">
                                                    <span className="detail-label">Buyer</span>
                                                    <span className="detail-value">{signal.buyer}</span>
                                                </div>
                                            )}
                                            {signal.pattern && (
                                                <div className="signal-detail">
                                                    <span className="detail-label">Pattern</span>
                                                    <span className="detail-value">{signal.pattern}</span>
                                                </div>
                                            )}
                                            {signal.rsi_current && (
                                                <div className="signal-detail">
                                                    <span className="detail-label">RSI</span>
                                                    <span className="detail-value">{signal.rsi_current}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Beginner Explanation Toggle */}
                                        <button 
                                            className="btn btn-ghost expand-btn" 
                                            onClick={() => toggleExpand(signal.id || i)}
                                        >
                                            <HelpCircle size={14} />
                                            What does this mean?
                                            {expandedCard === (signal.id || i) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </button>
                                        
                                        {expandedCard === (signal.id || i) && (
                                            <div className="beginner-guide animate-fade-in-up">
                                                <div className="guide-header">
                                                    <Zap size={12} className="guide-icon" />
                                                    <span>Beginner Guide</span>
                                                </div>
                                                <p className="guide-text">
                                                    {signal.signal_type === 'insider_trade' ? (
                                                        signal.signal === 'bullish' 
                                                            ? `When company leaders (insiders) buy their own stock with their own money, it usually means they believe the stock price will go up. They know their company best.`
                                                            : `Company leaders selling stock isn't always bad (they might just need cash), but large or frequent selling can be a warning sign.`
                                                    ) : signal.signal_type === 'technical' ? (
                                                        signal.signal === 'bullish'
                                                            ? `The stock chart is showing a pattern that historically led to price increases. It means more buyers are entering the market for this stock right now.`
                                                            : `The stock chart is showing a pattern that historically led to price drops. It suggests sellers currently have more control than buyers.`
                                                    ) : signal.signal_type === 'bulk_deal' ? (
                                                        `A large institutional investor (like a mutual fund) just bought or sold a massive amount of this stock. Big money moves often trigger further price action.`
                                                    ) : (
                                                        `This is an official company announcement. AI has read the document and flagged it as potentially moving the stock price.`
                                                    )}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="signal-card-footer">
                                        <div className="confidence-section">
                                            <span className="confidence-label">Confidence</span>
                                            <span className={`confidence-value ${signal.signal}`}>{signal.confidence}%</span>
                                            <div className="confidence-bar">
                                                <div className={`confidence-fill ${signal.signal}`}
                                                    style={{ width: `${signal.confidence}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="signal-timestamp">
                                            <Clock size={12} />
                                            {signal.date}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Disclaimer */}
                <div className="radar-disclaimer">
                    <AlertTriangle size={14} />
                    <span>
                        ⚠️ This is not financial advice. For educational and informational purposes only.
                        Always consult a SEBI-registered financial advisor before making investment decisions.
                    </span>
                </div>
            </div>
        </div>
    );
}
