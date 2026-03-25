import { useState, useEffect, useRef, useCallback } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import {
    TrendingUp, TrendingDown, Search, BarChart3, Activity,
    ArrowUpRight, ArrowDownRight, AlertTriangle, Eye
} from 'lucide-react';
import './ChartIntelligence.css';

const API_BASE = 'http://localhost:8000';

const STOCK_LIST = [
    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
    'ITC', 'SBIN', 'BHARTIARTL', 'TATAMOTORS', 'BAJFINANCE',
    'SUNPHARMA', 'WIPRO', 'LT', 'AXISBANK', 'MARUTI',
];

function TradingViewChart({ ticker, height = 350 }) {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchOHLCV() {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE}/api/stocks/${ticker}/ohlcv?period=1y`);
                const json = await res.json();
                if (json.data && json.data.length > 0) {
                    // lightweight-charts needs {time, open, high, low, close} with time as YYYY-MM-DD
                    const formatted = json.data.map(d => ({
                        time: new Date(d.time * 1000).toISOString().split('T')[0],
                        open: d.open,
                        high: d.high,
                        low: d.low,
                        close: d.close,
                    }));
                    // Remove duplicates by time
                    const seen = new Set();
                    const unique = formatted.filter(d => {
                        if (seen.has(d.time)) return false;
                        seen.add(d.time);
                        return true;
                    });
                    setChartData(unique);
                }
            } catch (err) {
                console.error('Error fetching OHLCV:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchOHLCV();
    }, [ticker]);

    useEffect(() => {
        if (!chartContainerRef.current || chartData.length === 0) return;

        // Clean up previous chart
        if (chartRef.current) {
            chartRef.current.remove();
            chartRef.current = null;
        }

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#8b95a8',
                fontSize: 11,
                fontFamily: "'Inter', sans-serif",
            },
            grid: {
                vertLines: { color: 'rgba(255,255,255,0.03)' },
                horzLines: { color: 'rgba(255,255,255,0.03)' },
            },
            width: chartContainerRef.current.clientWidth,
            height: height,
            crosshair: {
                mode: 0,
                vertLine: { color: 'rgba(247,147,26,0.3)', width: 1, style: 2 },
                horzLine: { color: 'rgba(247,147,26,0.3)', width: 1, style: 2 },
            },
            rightPriceScale: {
                borderColor: 'rgba(255,255,255,0.06)',
            },
            timeScale: {
                borderColor: 'rgba(255,255,255,0.06)',
                timeVisible: false,
            },
        });

        const candleSeries = chart.addCandlestickSeries({
            upColor: '#00d4aa',
            downColor: '#ff4757',
            borderDownColor: '#ff4757',
            borderUpColor: '#00d4aa',
            wickDownColor: '#ff4757',
            wickUpColor: '#00d4aa',
        });

        candleSeries.setData(chartData);

        // Add volume series
        const volumeSeries = chart.addHistogramSeries({
            color: 'rgba(247, 147, 26, 0.2)',
            priceFormat: { type: 'volume' },
            priceScaleId: '',
        });

        chart.timeScale().fitContent();
        chartRef.current = chart;

        // Handle resize
        const resizeObserver = new ResizeObserver(entries => {
            if (entries.length > 0 && chartRef.current) {
                const { width } = entries[0].contentRect;
                chartRef.current.applyOptions({ width });
            }
        });
        resizeObserver.observe(chartContainerRef.current);

        return () => {
            resizeObserver.disconnect();
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
        };
    }, [chartData, height]);

    if (loading) {
        return (
            <div className="chart-loading" style={{ height }}>
                <div className="spinner"></div>
                <span>Loading chart data...</span>
            </div>
        );
    }

    return <div ref={chartContainerRef} className="tradingview-chart" />;
}

function RSIGauge({ value }) {
    if (!value && value !== 0) return null;
    const color = value >= 70 ? 'var(--bearish)' : value <= 30 ? 'var(--bullish)' : 'var(--text-secondary)';
    const label = value >= 70 ? 'Overbought' : value <= 30 ? 'Oversold' : 'Neutral';

    return (
        <div className="rsi-gauge">
            <svg viewBox="0 0 100 55" className="gauge-svg">
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" strokeLinecap="round" />
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={`${(value / 100) * 125.6} 125.6`} />
                <text x="50" y="45" textAnchor="middle" fill={color} fontSize="14" fontWeight="700" fontFamily="'JetBrains Mono'">{Math.round(value)}</text>
                <text x="50" y="54" textAnchor="middle" fill="var(--text-tertiary)" fontSize="5.5">{label}</text>
            </svg>
        </div>
    );
}

export default function ChartIntelligence() {
    const [selectedStock, setSelectedStock] = useState('RELIANCE');
    const [technical, setTechnical] = useState(null);
    const [patterns, setPatterns] = useState([]);
    const [backtest, setBacktest] = useState(null);
    const [allPatterns, setAllPatterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Fetch technical data for selected stock
    useEffect(() => {
        fetchStockData(selectedStock);
    }, [selectedStock]);

    // Fetch all patterns on mount
    useEffect(() => {
        fetchAllPatterns();
    }, []);

    async function fetchStockData(stock) {
        setLoading(true);
        try {
            const [techRes, btRes] = await Promise.all([
                fetch(`${API_BASE}/api/stocks/${stock}/technical`).then(r => r.json()),
                fetch(`${API_BASE}/api/backtest/${stock}`).then(r => r.json()).catch(() => null),
            ]);
            setTechnical(techRes);
            setBacktest(btRes);
        } catch (err) {
            console.error('Error fetching stock data:', err);
        } finally {
            setLoading(false);
        }
    }

    async function fetchAllPatterns() {
        try {
            const res = await fetch(`${API_BASE}/api/signals/technical`);
            const json = await res.json();
            setAllPatterns(json.signals || []);
        } catch (err) {
            console.error('Error fetching patterns:', err);
        }
    }

    const filteredStocks = STOCK_LIST.filter(s =>
        s.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="charts-page">
            <div className="container">
                {/* Header */}
                <div className="charts-header animate-fade-in-up">
                    <h1 className="page-title">
                        <TrendingUp size={28} className="title-icon" style={{ color: 'var(--bullish)' }} />
                        Chart Pattern Intelligence
                    </h1>
                    <p className="page-subtitle">
                        Live NSE charts with real-time technical pattern detection and backtested success rates
                    </p>
                </div>

                {/* Stock Selector */}
                <div className="stock-selector animate-fade-in-up stagger-1">
                    <div className="search-box">
                        <Search size={16} />
                        <input type="text" placeholder="Search stocks..."
                            value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="stock-chips">
                        {filteredStocks.map(stock => (
                            <button key={stock}
                                className={`stock-chip ${selectedStock === stock ? 'active' : ''}`}
                                onClick={() => setSelectedStock(stock)}>
                                {stock}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Chart */}
                <div className="chart-section card animate-fade-in-up stagger-2">
                    <div className="chart-header">
                        <div>
                            <h2 className="chart-title">{selectedStock}</h2>
                            {technical && (
                                <span className="chart-price">
                                    ₹{technical.current_price?.toLocaleString('en-IN')}
                                    {technical.above_sma_50 && <span className="price-tag bullish">Above 50-DMA</span>}
                                    {technical.above_sma_200 && <span className="price-tag bullish">Above 200-DMA</span>}
                                </span>
                            )}
                        </div>
                        <div className="chart-period-btns">
                            <span className="chart-live-badge"><span className="live-dot"></span> LIVE</span>
                        </div>
                    </div>
                    <TradingViewChart ticker={selectedStock} height={400} />
                </div>

                {/* Technical Indicators Panel */}
                {technical && (
                    <div className="tech-panel animate-fade-in-up stagger-3">
                        <h3 className="panel-title">
                            <Activity size={16} />
                            Technical Indicators — {selectedStock}
                        </h3>
                        <div className="indicators-grid">
                            <div className="indicator-card">
                                <RSIGauge value={technical.rsi} />
                                <div className="ind-meta">
                                    <span className="ind-name">RSI (14)</span>
                                    <span className={`ind-val ${technical.rsi >= 70 ? 'bearish' : technical.rsi <= 30 ? 'bullish' : ''}`}>
                                        {technical.rsi?.toFixed(1)}
                                    </span>
                                </div>
                            </div>
                            <div className="indicator-card">
                                <div className="ind-block">
                                    <span className="ind-name">MACD</span>
                                    <span className={`ind-val big ${(technical.macd || 0) >= 0 ? 'bullish' : 'bearish'}`}>
                                        {technical.macd > 0 ? '+' : ''}{technical.macd?.toFixed(3)}
                                    </span>
                                    <span className="ind-sub">Signal: {technical.macd_signal?.toFixed(3)}</span>
                                </div>
                            </div>
                            <div className="indicator-card">
                                <div className="ind-block">
                                    <span className="ind-name">50-DMA</span>
                                    <span className="ind-val big">₹{technical.sma_50?.toFixed(0)}</span>
                                    <span className={`ind-sub ${technical.above_sma_50 ? 'bullish' : 'bearish'}`}>
                                        {technical.above_sma_50 ? '✅ Price Above' : '❌ Price Below'}
                                    </span>
                                </div>
                            </div>
                            <div className="indicator-card">
                                <div className="ind-block">
                                    <span className="ind-name">200-DMA</span>
                                    <span className="ind-val big">₹{technical.sma_200?.toFixed(0)}</span>
                                    <span className={`ind-sub ${technical.above_sma_200 ? 'bullish' : 'bearish'}`}>
                                        {technical.above_sma_200 ? '✅ Price Above' : '❌ Price Below'}
                                    </span>
                                </div>
                            </div>
                            <div className="indicator-card">
                                <div className="ind-block">
                                    <span className="ind-name">Support</span>
                                    {(technical.support_levels || []).map((s, i) => (
                                        <span key={i} className="ind-val level">₹{s}</span>
                                    ))}
                                    {(!technical.support_levels || technical.support_levels.length === 0) && (
                                        <span className="ind-val">—</span>
                                    )}
                                </div>
                            </div>
                            <div className="indicator-card">
                                <div className="ind-block">
                                    <span className="ind-name">Resistance</span>
                                    {(technical.resistance_levels || []).map((r, i) => (
                                        <span key={i} className="ind-val level">₹{r}</span>
                                    ))}
                                    {(!technical.resistance_levels || technical.resistance_levels.length === 0) && (
                                        <span className="ind-val">—</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Backtest Results */}
                {backtest && backtest.backtests && Object.keys(backtest.backtests).length > 0 && (
                    <div className="backtest-panel animate-fade-in-up stagger-4">
                        <h3 className="panel-title">
                            <BarChart3 size={16} />
                            Backtest Results — {selectedStock} (3 Year History)
                        </h3>
                        <div className="backtest-grid">
                            {Object.entries(backtest.backtests).map(([pattern, bt]) => (
                                <div key={pattern} className="backtest-card card">
                                    <h4 className="bt-pattern">{pattern}</h4>
                                    <p className="bt-summary">{bt.summary}</p>
                                    {bt.results && Object.entries(bt.results).map(([period, res]) => (
                                        <div key={period} className="bt-period-row">
                                            <span className="bt-period-label">{period.replace('_', ' ')}</span>
                                            <div className="bt-metrics">
                                                <span className={`bt-metric ${res.win_rate >= 60 ? 'success' : 'neutral'}`}>
                                                    {res.win_rate}% win rate
                                                </span>
                                                <span className={`bt-metric ${res.avg_return >= 0 ? 'success' : 'danger'}`}>
                                                    {res.avg_return > 0 ? '+' : ''}{res.avg_return}% avg
                                                </span>
                                                <span className="bt-metric neutral">{res.sample_size} trades</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* All Detected Patterns Across NSE */}
                {allPatterns.length > 0 && (
                    <div className="all-patterns-section animate-fade-in-up stagger-5">
                        <h3 className="panel-title">
                            <Eye size={16} />
                            Live Detected Patterns Across NSE ({allPatterns.length} signals)
                        </h3>
                        <div className="patterns-list">
                            {allPatterns.map((p, i) => (
                                <div key={i} className="pattern-list-item card"
                                    onClick={() => setSelectedStock(p.stock_name)}>
                                    <div className="pli-left">
                                        <span className="pli-stock">{p.stock_name}</span>
                                        <span className={`badge badge-${p.signal}`}>
                                            {p.signal === 'bullish' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                            {p.pattern}
                                        </span>
                                    </div>
                                    <div className="pli-right">
                                        <span className="pli-price">₹{p.current_price?.toLocaleString('en-IN')}</span>
                                        <span className={`pli-conf ${p.signal}`}>{p.confidence}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Disclaimer */}
                <div className="radar-disclaimer">
                    <AlertTriangle size={14} />
                    <span>
                        ⚠️ Past patterns don't guarantee future results. Not financial advice.
                        Always consult a SEBI-registered advisor.
                    </span>
                </div>
            </div>
        </div>
    );
}
