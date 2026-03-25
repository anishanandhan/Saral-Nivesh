import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lightbulb } from 'lucide-react';
import { createChart, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import './StockDetail.css';

// Simulated stock database
const STOCKS = {
    'RELIANCE': { name: 'Reliance Industries Ltd', sector: 'Oil & Gas / Conglomerate', price: 2847.30, change: 1.24 },
    'HDFCBANK': { name: 'HDFC Bank Ltd', sector: 'Banking', price: 1623.45, change: 0.87 },
    'INFY':     { name: 'Infosys Ltd', sector: 'IT Services', price: 1892.10, change: -0.43 },
    'TCS':      { name: 'Tata Consultancy Services', sector: 'IT Services', price: 3420.00, change: 1.56 },
    'ICICIBANK':{ name: 'ICICI Bank Ltd', sector: 'Banking', price: 1124.80, change: 2.01 },
    'BAJFINANCE':{ name: 'Bajaj Finance Ltd', sector: 'NBFC', price: 7234.50, change: 3.22 },
    'WIPRO':    { name: 'Wipro Ltd', sector: 'IT Services', price: 478.60, change: -1.12 },
    'MARUTI':   { name: 'Maruti Suzuki India', sector: 'Automobile', price: 12340.00, change: 0.34 },
    'TITAN':    { name: 'Titan Company Ltd', sector: 'Consumer', price: 3520.00, change: -0.18 },
    'LT':       { name: 'Larsen & Toubro', sector: 'Infrastructure', price: 3580.40, change: 0.92 },
    'SBIN':     { name: 'State Bank of India', sector: 'Banking', price: 812.30, change: 1.45 },
    'BHARTIARTL':{ name: 'Bharti Airtel Ltd', sector: 'Telecom', price: 1687.50, change: 0.76 },
    'AXISBANK': { name: 'Axis Bank Ltd', sector: 'Banking', price: 1156.20, change: 1.33 },
    'KOTAKBANK':{ name: 'Kotak Mahindra Bank', sector: 'Banking', price: 1823.90, change: 0.44 },
    'ADANIPORTS':{ name: 'Adani Ports & SEZ', sector: 'Infrastructure', price: 1089.40, change: -0.65 },
    'NTPC':     { name: 'NTPC Ltd', sector: 'Power', price: 372.80, change: 0.55 },
    'POWERGRID':{ name: 'Power Grid Corp', sector: 'Power', price: 312.40, change: 0.55 },
    'SUNPHARMA':{ name: 'Sun Pharmaceutical', sector: 'Pharma', price: 1756.30, change: 1.11 },
    'HCLTECH':  { name: 'HCL Technologies', sector: 'IT Services', price: 1834.70, change: 0.88 },
    'TATAMOTORS':{ name: 'Tata Motors Ltd', sector: 'Automobile', price: 987.60, change: -0.22 },
    'LTIM':     { name: 'LTIMindtree Ltd', sector: 'IT Services', price: 5240.00, change: 1.88 },
    'M&M':      { name: 'Mahindra & Mahindra', sector: 'Automobile', price: 2856.30, change: 1.15 },
    'COALINDIA':{ name: 'Coal India Ltd', sector: 'Mining', price: 428.50, change: 0.53 },
    'JSWSTEEL': { name: 'JSW Steel Ltd', sector: 'Metals', price: 892.40, change: -0.45 },
    'TATASTEEL':{ name: 'Tata Steel Ltd', sector: 'Metals', price: 156.80, change: -0.31 },
    'PERSISTENT':{ name: 'Persistent Systems', sector: 'IT Services', price: 5820.00, change: 2.34 },
    'ITC':      { name: 'ITC Ltd', sector: 'FMCG', price: 468.90, change: 0.49 },
    'HINDUNILVR':{ name: 'Hindustan Unilever', sector: 'FMCG', price: 2634.50, change: 0.31 },
    'NESTLEIND':{ name: 'Nestle India Ltd', sector: 'FMCG', price: 2412.80, change: 0.24 },
    'CIPLA':    { name: 'Cipla Ltd', sector: 'Pharma', price: 1534.20, change: 0.58 },
    'DRREDDY':  { name: 'Dr. Reddy\'s Laboratories', sector: 'Pharma', price: 6478.30, change: 0.41 },
    'APOLLOHOSP':{ name: 'Apollo Hospitals', sector: 'Healthcare', price: 6890.50, change: 1.22 },
    'EICHERMOT':{ name: 'Eicher Motors', sector: 'Automobile', price: 4567.80, change: 0.68 },
    'MARICO':   { name: 'Marico Ltd', sector: 'FMCG', price: 576.40, change: -3.42 },
    'ADANIENT': { name: 'Adani Enterprises', sector: 'Conglomerate', price: 2456.70, change: -1.55 },
    'BPCL':     { name: 'Bharat Petroleum', sector: 'Oil & Gas', price: 612.30, change: 0.29 },
    'ONGC':     { name: 'Oil & Natural Gas Corp', sector: 'Oil & Gas', price: 268.40, change: 0.33 },
    'INDUSINDBK':{ name: 'IndusInd Bank', sector: 'Banking', price: 1423.60, change: -0.38 },
    'TECHM':    { name: 'Tech Mahindra', sector: 'IT Services', price: 1678.90, change: 0.58 },
    'MPHASIS':  { name: 'Mphasis Ltd', sector: 'IT Services', price: 2890.40, change: 0.71 },
};

function generateCandleData(basePrice, days = 90) {
    const data = [];
    let price = basePrice * 0.9;
    const now = new Date();
    for (let i = days; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayStr = date.toISOString().split('T')[0];
        const volatility = basePrice * 0.015;
        const open = price + (Math.random() - 0.48) * volatility;
        const close = open + (Math.random() - 0.45) * volatility;
        const high = Math.max(open, close) + Math.random() * volatility * 0.5;
        const low = Math.min(open, close) - Math.random() * volatility * 0.5;
        data.push({ time: dayStr, open, high, low, close });
        price = close;
    }
    return data;
}

function generateVolumeData(candles) {
    return candles.map(c => ({
        time: c.time,
        value: Math.floor(500000 + Math.random() * 2000000),
        color: c.close >= c.open ? 'rgba(0, 212, 170, 0.3)' : 'rgba(255, 71, 87, 0.3)',
    }));
}

function getIndicators(price) {
    const rsi = Math.floor(35 + Math.random() * 40);
    const macd = ((Math.random() - 0.4) * 20).toFixed(1);
    const dma50 = (price * (0.96 + Math.random() * 0.04)).toFixed(2);
    const dma200 = (price * (0.90 + Math.random() * 0.08)).toFixed(2);
    const high52 = (price * (1.02 + Math.random() * 0.08)).toFixed(2);
    const low52 = (price * (0.75 + Math.random() * 0.10)).toFixed(2);
    const volRatio = (0.8 + Math.random() * 0.8).toFixed(1);
    return { rsi, macd, dma50, dma200, high52, low52, volRatio };
}

export default function StockDetail() {
    const { ticker } = useParams();
    const navigate = useNavigate();
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);
    const [timeframe, setTimeframe] = useState('3M');

    const stock = STOCKS[ticker?.toUpperCase()] || {
        name: `${ticker} — Stock`, sector: 'Unknown', price: 1000, change: 0
    };
    const up = stock.change >= 0;
    const indicators = getIndicators(stock.price);

    useEffect(() => {
        if (!chartRef.current) return;

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

        const days = timeframe === '1M' ? 30 : timeframe === '3M' ? 90 : timeframe === '6M' ? 180 : timeframe === '1Y' ? 365 : 14;
        const candles = generateCandleData(stock.price, days);
        const volumes = generateVolumeData(candles);

        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#00d4aa',
            downColor: '#ff4757',
            borderDownColor: '#ff4757',
            borderUpColor: '#00d4aa',
            wickDownColor: '#ff4757',
            wickUpColor: '#00d4aa',
        });
        candleSeries.setData(candles);

        const volumeSeries = chart.addSeries(HistogramSeries, {
            priceFormat: { type: 'volume' },
            priceScaleId: 'volume',
        });
        volumeSeries.priceScale().applyOptions({
            scaleMargins: { top: 0.85, bottom: 0 },
        });
        volumeSeries.setData(volumes);

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
    }, [ticker, timeframe, stock.price]);

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
                            ₹{stock.price.toLocaleString('en-IN')}
                        </div>
                        <div className="stock-change-row">
                            <span className={`stock-change ${up ? 'up' : 'down'}`}>
                                {up ? '▲' : '▼'} {up ? '+' : ''}{stock.change}%
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
                                <span className="indicator-value">₹{parseFloat(indicators.dma50).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="indicator-row">
                                <span className="indicator-name">200 DMA</span>
                                <span className="indicator-value">₹{parseFloat(indicators.dma200).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="indicator-row">
                                <span className="indicator-name">52W High</span>
                                <span className="indicator-value neutral">₹{parseFloat(indicators.high52).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="indicator-row">
                                <span className="indicator-name">52W Low</span>
                                <span className="indicator-value">₹{parseFloat(indicators.low52).toLocaleString('en-IN')}</span>
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
