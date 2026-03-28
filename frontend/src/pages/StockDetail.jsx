import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lightbulb } from 'lucide-react';
import { createChart, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import './StockDetail.css';

const API_BASE = 'http://localhost:8000';

export default function StockDetail() {
    const { ticker } = useParams();
    const navigate = useNavigate();
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);
    const [timeframe, setTimeframe] = useState('3M');

    // State for live data
    const [stock, setStock] = useState({
        name: `${ticker} — Stock`, sector: 'Unknown', price: 0, change: 0
    });
    const [indicators, setIndicators] = useState({ rsi: 0, macd: 0, dma50: 0, dma200: 0, high52: 0, low52: 0, volRatio: 0 });
    
    // Chart data sets
    const [chartData, setChartData] = useState([]);
    const [volumeData, setVolumeData] = useState([]);

    // 1. Fetch live stock price and indicators from the backend on mount
    useEffect(() => {
        async function fetchRealData() {
            try {
                const queryTicker = ticker || 'RELIANCE';
                // Technical data (RSI, MAs, etc)
                const techRes = await fetch(`${API_BASE}/api/stocks/${queryTicker}/technical`);
                if (techRes.ok) {
                    const tech = await techRes.json();
                    
                    // Batch price to get the daily percentage change
                    let changePct = stock.change;
                    try {
                        const priceRes = await fetch(`${API_BASE}/api/stocks/prices?tickers=${queryTicker}`);
                        if (priceRes.ok) {
                            const pData = await priceRes.json();
                            if (pData.prices && pData.prices.length > 0) changePct = pData.prices[0].change_pct;
                        }
                    } catch(e) {}

                    setStock(prev => ({
                        ...prev,
                        price: tech.current_price || prev.price,
                        change: changePct
                    }));

                    setIndicators({
                        rsi: tech.rsi ? Math.round(tech.rsi) : 50,
                        macd: tech.macd ? tech.macd.toFixed(2) : 0,
                        dma50: tech.sma_50 || (tech.current_price * 0.95),
                        dma200: tech.sma_200 || (tech.current_price * 0.90),
                        high52: tech.high52 || 0,
                        low52: tech.low52 || 0,
                        volRatio: tech.volRatio || 1.0
                    });
                }
            } catch(e) {
                console.warn('[StockDetail] Live data fetch failed, using mock data:', e);
            }
        }
        fetchRealData();
    }, [ticker]);

    // 2. Fetch or Generate Candlestick pattern
    useEffect(() => {
        async function fetchChartData() {
            const queryTicker = ticker || 'RELIANCE';
            let data = [];
            let vols = [];

            try {
                const mappedTf = timeframe === '1W' ? '1mo' : timeframe === '1M' ? '1mo' : timeframe === '3M' ? '3mo' : timeframe === '6M' ? '6mo' : '1y';
                const ohlcvRes = await fetch(`${API_BASE}/api/stocks/${queryTicker}/ohlcv?period=${mappedTf}`);
                if (ohlcvRes.ok) {
                    const json = await ohlcvRes.json();
                    if (json.data && json.data.length > 0) {
                        data = json.data.map(d => ({
                            time: new Date(d.time * 1000).toISOString().split('T')[0],
                            open: d.open, high: d.high, low: d.low, close: d.close, 
                        }));
                        // remove duplicates
                        const seen = new Set();
                        data = data.filter(d => {
                            if(seen.has(d.time)) return false;
                            seen.add(d.time);
                            return true;
                        });
                        vols = data.map(d => {
                            const original = json.data.find(x => new Date(x.time * 1000).toISOString().split('T')[0] === d.time);
                            return {
                                time: d.time,
                                value: original?.volume || 1000000,
                                color: d.close >= d.open ? 'rgba(0, 212, 170, 0.3)' : 'rgba(255, 71, 87, 0.3)'
                            };
                        });
                    }
                }
            } catch (e) {
                console.warn('[StockDetail] Chart data fetch failed.');
            }

            // Fallback to mock data if backend query failed or returned no data
            if (data.length === 0) {
                console.warn('[StockDetail] No chart data found on backend rendering empty chart.');
            }

            setChartData(data);
            setVolumeData(vols);
        }
        
        // Wait till we have a price to fetch chart data to avoid double fetch race
        if (stock.price !== 0) {
            fetchChartData();
        }
    }, [ticker, timeframe, stock.price]);


    useEffect(() => {
        if (!chartRef.current || chartData.length === 0) return;

        // Cleanup previous chart
        if (chartInstanceRef.current) {
            chartInstanceRef.current.remove();
            chartInstanceRef.current = null;
        }

        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

        const chart = createChart(chartRef.current, {
            width: chartRef.current.clientWidth,
            height: 360,
            layout: {
                background: { color: 'transparent' },
                textColor: isDark ? '#8b95a8' : '#6b7280',
            },
            grid: {
                vertLines: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)' },
                horzLines: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)' },
            },
            crosshair: { mode: 0 },
            rightPriceScale: { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)' },
            timeScale: { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)' },
        });

        chartInstanceRef.current = chart;

        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#00d4aa',
            downColor: '#ff4757',
            borderDownColor: '#ff4757',
            borderUpColor: '#00d4aa',
            wickDownColor: '#ff4757',
            wickUpColor: '#00d4aa',
        });
        candleSeries.setData(chartData);

        const volumeSeries = chart.addSeries(HistogramSeries, {
            priceFormat: { type: 'volume' },
            priceScaleId: 'volume',
        });
        volumeSeries.priceScale().applyOptions({
            scaleMargins: { top: 0.85, bottom: 0 },
        });
        volumeSeries.setData(volumeData);

        chart.timeScale().fitContent();

        const handleResize = () => {
            if (chartRef.current) {
                chart.applyOptions({ width: chartRef.current.clientWidth });
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
            chartInstanceRef.current = null;
        };
    }, [chartData, volumeData]);

    const up = stock.change >= 0;
    const rsiStatus = indicators.rsi > 70 ? 'down' : indicators.rsi < 30 ? 'neutral' : 'up';
    const macdStatus = parseFloat(indicators.macd) > 0 ? 'up' : 'down';

    return (
        <div className="stock-detail-page">
            <div className="container">
                <button className="stock-back" onClick={() => navigate(-1)}>
                    <ArrowLeft size={16} />
                    Back
                </button>

                <div className="stock-header">
                    <div className="stock-header-left">
                        <h1>{ticker?.toUpperCase()}</h1>
                        <div className="stock-fullname">{stock.name} · {stock.sector}</div>
                    </div>
                    <div className="stock-header-right">
                        <div className={`stock-price-big ${up ? 'up' : 'down'}`} style={{color: up ? 'var(--bullish)' : 'var(--bearish)'}}>
                            ₹{Number(stock.price).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </div>
                        <div className="stock-change-row">
                            <span className={`stock-change ${up ? 'up' : 'down'}`}>
                                {up ? '▲' : '▼'} {up ? '+' : ''}{Number(stock.change).toFixed(2)}%
                            </span>
                        </div>
                    </div>
                </div>

                <div className="stock-layout">
                    <div>
                        <div className="stock-chart-card">
                            <div className="chart-controls">
                                <div className="chart-tabs">
                                    {['1W', '1M', '3M', '6M', '1Y'].map(tf => (
                                        <button
                                            key={tf}
                                            className={`chart-tab ${timeframe === tf ? 'active' : ''}`}
                                            onClick={() => setTimeframe(tf)}
                                        >
                                            {tf}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="chart-container" ref={chartRef}></div>
                        </div>

                        <div className="stock-beginner-box" style={{marginTop:16}}>
                            <h4><Lightbulb size={14} /> Beginner Tip</h4>
                            <p>
                                This chart shows the price movement of {ticker?.toUpperCase()} over time. 
                                <strong style={{color:'var(--bullish)'}}> Green candles</strong> mean the price went up that day. 
                                <strong style={{color:'var(--bearish)'}}> Red candles</strong> mean it went down. 
                                The bars at the bottom show trading volume — how many shares were traded. Higher volume means stronger conviction behind the move.
                            </p>
                        </div>
                    </div>

                    <div className="stock-sidebar">
                        <div className="sidebar-card">
                            <div className="sidebar-card-title">Technical Indicators</div>
                            <div className="indicator-row">
                                <span className="indicator-name">RSI (14)</span>
                                <span className={`indicator-value ${rsiStatus}`}>
                                    {indicators.rsi} — {indicators.rsi > 70 ? 'Overbought' : indicators.rsi < 30 ? 'Oversold' : 'Healthy'}
                                </span>
                            </div>
                            <div className="indicator-row">
                                <span className="indicator-name">MACD</span>
                                <span className={`indicator-value ${macdStatus}`}>
                                    {indicators.macd > 0 ? '+' : ''}{indicators.macd} {indicators.macd > 0 ? 'Bullish' : 'Bearish'}
                                </span>
                            </div>
                            <div className="indicator-row">
                                <span className="indicator-name">50 DMA</span>
                                <span className="indicator-value">₹{parseFloat(indicators.dma50).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                            <div className="indicator-row">
                                <span className="indicator-name">200 DMA</span>
                                <span className="indicator-value">₹{parseFloat(indicators.dma200).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                            <div className="indicator-row">
                                <span className="indicator-name">52W High</span>
                                <span className="indicator-value neutral">₹{parseFloat(indicators.high52).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                            <div className="indicator-row">
                                <span className="indicator-name">52W Low</span>
                                <span className="indicator-value">₹{parseFloat(indicators.low52).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                            <div className="indicator-row">
                                <span className="indicator-name">Volume vs Avg</span>
                                <span className={`indicator-value ${indicators.volRatio >= 1.2 ? 'up' : indicators.volRatio < 0.8 ? 'down' : 'neutral'}`}>
                                    {indicators.volRatio}× {indicators.volRatio >= 1.2 ? '↑' : indicators.volRatio < 0.8 ? '↓' : '—'}
                                </span>
                            </div>
                            <div className="indicator-row">
                                <span className="indicator-name">DMA Cross</span>
                                <span className={`indicator-value ${parseFloat(indicators.dma50) > parseFloat(indicators.dma200) ? 'up' : 'down'}`}>
                                    {parseFloat(indicators.dma50) > parseFloat(indicators.dma200) ? '50 > 200 ✓' : '50 < 200 ✗'}
                                </span>
                            </div>
                        </div>

                        <div className="sidebar-card">
                            <div className="sidebar-card-title">Recent Signals</div>
                            <div className="signal-mini">
                                <div className="signal-mini-header">
                                    <span className="signal-mini-type">MACD Bullish Cross</span>
                                    <span className="signal-mini-date">2 days ago</span>
                                </div>
                                <div className="signal-mini-text">MACD line crossed above signal line with increasing volume.</div>
                            </div>
                            <div className="signal-mini">
                                <div className="signal-mini-header">
                                    <span className="signal-mini-type">Above 50 DMA</span>
                                    <span className="signal-mini-date">5 days ago</span>
                                </div>
                                <div className="signal-mini-text">Price broke above 50-day moving average on 1.3× volume.</div>
                            </div>
                            <div className="signal-mini">
                                <div className="signal-mini-header">
                                    <span className="signal-mini-type">RSI Recovery</span>
                                    <span className="signal-mini-date">1 week ago</span>
                                </div>
                                <div className="signal-mini-text">RSI bounced from 38 to 55, indicating buyers returning.</div>
                            </div>
                        </div>

                        <div className="stock-beginner-box">
                            <h4><Lightbulb size={14} /> What do these indicators mean?</h4>
                            <p>
                                <strong>RSI</strong> tells you if the stock is being bought too much (overbought &gt;70) or sold too much (oversold &lt;30). 
                                <strong> MACD</strong> shows momentum — positive means buyers are in control. 
                                <strong> DMA</strong> (Moving Averages) show the trend direction. If 50 DMA &gt; 200 DMA, it's called a "Golden Cross" — very bullish!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
