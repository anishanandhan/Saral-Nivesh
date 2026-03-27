import { useState, useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, TrendingDown, Search, BarChart3, Activity,
    ArrowUpRight, ArrowDownRight, AlertTriangle, Eye
} from 'lucide-react';
import { fadeUp, stagger, staggerFast, hoverLift, tapScale, viewportOnce } from '../utils/motionVariants';
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
                    const formatted = json.data.map(d => ({
                        time: new Date(d.time * 1000).toISOString().split('T')[0],
                        open: d.open, high: d.high, low: d.low, close: d.close,
                    }));
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
        if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#8b95a8', fontSize: 11, fontFamily: "'Inter', sans-serif",
            },
            grid: { vertLines: { color: 'rgba(255,255,255,0.03)' }, horzLines: { color: 'rgba(255,255,255,0.03)' } },
            width: chartContainerRef.current.clientWidth, height,
            crosshair: { mode: 0, vertLine: { color: 'rgba(247,147,26,0.3)', width: 1, style: 2 }, horzLine: { color: 'rgba(247,147,26,0.3)', width: 1, style: 2 } },
            rightPriceScale: { borderColor: 'rgba(255,255,255,0.06)' },
            timeScale: { borderColor: 'rgba(255,255,255,0.06)', timeVisible: false },
        });

        chart.addSeries(CandlestickSeries, {
            upColor: '#00d4aa', downColor: '#ff4757',
            borderDownColor: '#ff4757', borderUpColor: '#00d4aa',
            wickDownColor: '#ff4757', wickUpColor: '#00d4aa',
        }).setData(chartData);

        chart.addSeries(HistogramSeries, {
            color: 'rgba(247, 147, 26, 0.2)', priceFormat: { type: 'volume' }, priceScaleId: '',
        });

        chart.timeScale().fitContent();
        chartRef.current = chart;

        const resizeObserver = new ResizeObserver(entries => {
            if (entries.length > 0 && chartRef.current) chartRef.current.applyOptions({ width: entries[0].contentRect.width });
        });
        resizeObserver.observe(chartContainerRef.current);

        return () => { resizeObserver.disconnect(); if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; } };
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
                <motion.path
                    d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
                    initial={{ strokeDasharray: '0 125.6' }}
                    whileInView={{ strokeDasharray: `${(value / 100) * 125.6} 125.6` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                />
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
    const [searchFocused, setSearchFocused] = useState(false);

    useEffect(() => { fetchStockData(selectedStock); }, [selectedStock]);
    useEffect(() => { fetchAllPatterns(); }, []);

    async function fetchStockData(stock) {
        setLoading(true);
        try {
            const [techRes, btRes] = await Promise.all([
                fetch(`${API_BASE}/api/stocks/${stock}/technical`).then(r => r.json()),
                fetch(`${API_BASE}/api/backtest/${stock}`).then(r => r.json()).catch(() => null),
            ]);
            setTechnical(techRes);
            setBacktest(btRes);
        } catch (err) { console.error('Error fetching stock data:', err); }
        finally { setLoading(false); }
    }

    async function fetchAllPatterns() {
        try {
            const res = await fetch(`${API_BASE}/api/signals/technical`);
            const json = await res.json();
            setAllPatterns(json.signals || []);
        } catch (err) { console.error('Error fetching patterns:', err); }
    }

    const filteredStocks = STOCK_LIST.filter(s => s.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="charts-page">
            <div className="container">
                {/* Header */}
                <motion.div className="charts-header" initial="hidden" animate="visible" variants={stagger}>
                    <motion.h1 className="page-title" variants={fadeUp}>
                        <TrendingUp size={28} className="title-icon" style={{ color: 'var(--bullish)' }} />
                        Chart Pattern Intelligence
                    </motion.h1>
                    <motion.p className="page-subtitle" variants={fadeUp}>
                        Live NSE charts with real-time technical pattern detection and backtested success rates
                    </motion.p>
                </motion.div>

                {/* Stock Selector */}
                <motion.div className="stock-selector" initial="hidden" animate="visible" variants={stagger}>
                    <motion.div className={`search-box ${searchFocused ? 'search-focused' : ''}`} variants={fadeUp}>
                        <Search size={16} className={searchFocused ? 'icon-bounce' : ''} />
                        <input type="text" placeholder="Search stocks..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} />
                    </motion.div>
                    <motion.div className="stock-chips" variants={fadeUp}>
                        {filteredStocks.map(stock => (
                            <motion.button
                                key={stock}
                                className={`stock-chip ${selectedStock === stock ? 'active' : ''}`}
                                onClick={() => setSelectedStock(stock)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                layout
                            >
                                {stock}
                            </motion.button>
                        ))}
                    </motion.div>
                </motion.div>

                {/* Main Chart */}
                <motion.div
                    className="chart-section card"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                >
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
                            <span className="chart-live-badge"><span className="live-dot live-blink"></span> LIVE</span>
                        </div>
                    </div>
                    <TradingViewChart ticker={selectedStock} height={400} />
                </motion.div>

                {/* Technical Indicators Panel */}
                <AnimatePresence>
                    {technical && (
                        <motion.div
                            className="tech-panel"
                            initial="hidden" whileInView="visible" viewport={viewportOnce}
                            variants={stagger}
                        >
                            <motion.h3 className="panel-title" variants={fadeUp}>
                                <Activity size={16} />
                                Technical Indicators — {selectedStock}
                            </motion.h3>
                            <div className="indicators-grid">
                                {[
                                    <><RSIGauge value={technical.rsi} /><div className="ind-meta"><span className="ind-name">RSI (14)</span><span className={`ind-val ${technical.rsi >= 70 ? 'bearish' : technical.rsi <= 30 ? 'bullish' : ''}`}>{technical.rsi?.toFixed(1)}</span></div></>,
                                    <div className="ind-block"><span className="ind-name">MACD</span><span className={`ind-val big ${(technical.macd || 0) >= 0 ? 'bullish' : 'bearish'}`}>{technical.macd > 0 ? '+' : ''}{technical.macd?.toFixed(3)}</span><span className="ind-sub">Signal: {technical.macd_signal?.toFixed(3)}</span></div>,
                                    <div className="ind-block"><span className="ind-name">50-DMA</span><span className="ind-val big">₹{technical.sma_50?.toFixed(0)}</span><span className={`ind-sub ${technical.above_sma_50 ? 'bullish' : 'bearish'}`}>{technical.above_sma_50 ? '✅ Price Above' : '❌ Price Below'}</span></div>,
                                    <div className="ind-block"><span className="ind-name">200-DMA</span><span className="ind-val big">₹{technical.sma_200?.toFixed(0)}</span><span className={`ind-sub ${technical.above_sma_200 ? 'bullish' : 'bearish'}`}>{technical.above_sma_200 ? '✅ Price Above' : '❌ Price Below'}</span></div>,
                                    <div className="ind-block"><span className="ind-name">Support</span>{(technical.support_levels || []).map((s, i) => <span key={i} className="ind-val level">₹{s}</span>)}{(!technical.support_levels || technical.support_levels.length === 0) && <span className="ind-val">—</span>}</div>,
                                    <div className="ind-block"><span className="ind-name">Resistance</span>{(technical.resistance_levels || []).map((r, i) => <span key={i} className="ind-val level">₹{r}</span>)}{(!technical.resistance_levels || technical.resistance_levels.length === 0) && <span className="ind-val">—</span>}</div>,
                                ].map((content, i) => (
                                    <motion.div key={i} className="indicator-card" variants={fadeUp} whileHover={hoverLift}>
                                        {content}
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Backtest Results */}
                {backtest && backtest.backtests && Object.keys(backtest.backtests).length > 0 && (
                    <motion.div className="backtest-panel" initial="hidden" whileInView="visible" viewport={viewportOnce} variants={stagger}>
                        <motion.h3 className="panel-title" variants={fadeUp}>
                            <BarChart3 size={16} />
                            Backtest Results — {selectedStock} (3 Year History)
                        </motion.h3>
                        <div className="backtest-grid">
                            {Object.entries(backtest.backtests).map(([pattern, bt], i) => (
                                <motion.div
                                    key={pattern}
                                    className="backtest-card card shimmer"
                                    variants={fadeUp}
                                    whileHover={{ y: -8, scale: 1.02, boxShadow: '0 12px 40px rgba(0,0,0,0.3)' }}
                                >
                                    <h4 className="bt-pattern">{pattern}</h4>
                                    <p className="bt-summary">{bt.summary}</p>
                                    {bt.results && Object.entries(bt.results).map(([period, res]) => (
                                        <div key={period} className="bt-period-row">
                                            <span className="bt-period-label">{period.replace('_', ' ')}</span>
                                            <div className="bt-metrics">
                                                <span className={`bt-metric ${res.win_rate >= 60 ? 'success' : 'neutral'}`}>{res.win_rate}% win rate</span>
                                                <span className={`bt-metric ${res.avg_return >= 0 ? 'success' : 'danger'}`}>{res.avg_return > 0 ? '+' : ''}{res.avg_return}% avg</span>
                                                <span className="bt-metric neutral">{res.sample_size} trades</span>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* All Detected Patterns */}
                {allPatterns.length > 0 && (
                    <motion.div className="all-patterns-section" initial="hidden" whileInView="visible" viewport={viewportOnce} variants={stagger}>
                        <motion.h3 className="panel-title" variants={fadeUp}>
                            <Eye size={16} />
                            Live Detected Patterns Across NSE ({allPatterns.length} signals)
                        </motion.h3>
                        <div className="patterns-list">
                            {allPatterns.map((p, i) => (
                                <motion.div
                                    key={i}
                                    className="pattern-list-item card"
                                    onClick={() => setSelectedStock(p.stock_name)}
                                    variants={fadeUp}
                                    whileHover={{
                                        scale: 1.02,
                                        backgroundColor: 'rgba(255,255,255,0.03)',
                                        borderColor: p.signal === 'bullish' ? 'rgba(0,212,170,0.3)' : 'rgba(255,71,87,0.3)',
                                    }}
                                >
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
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Disclaimer */}
                <motion.div className="radar-disclaimer" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                    <AlertTriangle size={14} className="warn-pulse" />
                    <span>⚠️ Past patterns don't guarantee future results. Not financial advice. Always consult a SEBI-registered advisor.</span>
                </motion.div>
            </div>
        </div>
    );
}
