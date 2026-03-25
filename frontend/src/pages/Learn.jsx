import { useState } from 'react';
import {
    BookOpen, TrendingUp, BarChart3, Shield, ChevronDown,
    DollarSign, Activity, PieChart, Lightbulb, Search
} from 'lucide-react';
import './Learn.css';

const sections = [
    {
        id: 'basics',
        icon: BookOpen,
        iconClass: 'orange',
        title: 'What Are Stocks?',
        subtitle: 'The absolute basics of the stock market',
        content: (
            <>
                <div className="content-block">
                    <h4><Lightbulb size={16} /> Think of it this way</h4>
                    <p>
                        A <strong>stock</strong> is a tiny piece of ownership in a company. When you buy a share of Reliance, you literally own a small fraction of that company. If Reliance does well and makes more money, your share becomes more valuable — you can sell it later for profit.
                    </p>
                </div>
                <div className="content-block">
                    <h4>Why do stock prices go up or down?</h4>
                    <p>It's simple supply and demand:</p>
                    <ul>
                        <li><strong>More buyers than sellers</strong> → Price goes UP (people want the stock)</li>
                        <li><strong>More sellers than buyers</strong> → Price goes DOWN (people want to exit)</li>
                        <li>News, earnings, economy, even rumors can shift buyer/seller balance</li>
                    </ul>
                </div>
                <div className="content-block">
                    <h4>Key Places</h4>
                    <div className="info-cards">
                        <div className="info-card">
                            <h5>NSE (National Stock Exchange)</h5>
                            <p>India's largest exchange. Nifty 50 is its benchmark index — top 50 companies by market size.</p>
                        </div>
                        <div className="info-card">
                            <h5>BSE (Bombay Stock Exchange)</h5>
                            <p>Asia's oldest exchange. Sensex is its benchmark — top 30 companies.</p>
                        </div>
                        <div className="info-card">
                            <h5>SEBI</h5>
                            <p>Securities and Exchange Board of India — the regulator that ensures fair play.</p>
                        </div>
                        <div className="info-card">
                            <h5>Demat Account</h5>
                            <p>Your digital locker to hold stocks electronically. You need one to buy stocks (via Zerodha, Groww, etc).</p>
                        </div>
                    </div>
                </div>
                <div className="example-box">
                    <div className="example-label">💡 Real Example</div>
                    <p>If you bought 10 shares of TCS at ₹3,200, and today TCS is at ₹3,420, your profit = 10 × (₹3,420 − ₹3,200) = <strong style={{color: 'var(--bullish)'}}>₹2,200 profit</strong>. That's a 6.9% return.</p>
                </div>
            </>
        ),
    },
    {
        id: 'charts',
        icon: TrendingUp,
        iconClass: 'green',
        title: 'Reading Stock Charts 101',
        subtitle: 'Charts are not scary — here\'s how to read them',
        content: (
            <>
                <div className="content-block">
                    <h4>What is a Stock Chart?</h4>
                    <p>
                        A stock chart shows the history of a stock's price over time. The X-axis is time (days, weeks, months), the Y-axis is price. Reading charts helps you understand where the price has been and spot patterns for where it might go.
                    </p>
                </div>
                <div className="content-block">
                    <h4>Types of Charts</h4>
                    <div className="info-cards">
                        <div className="info-card">
                            <h5>📈 Line Chart</h5>
                            <p>Simplest — just connects closing prices. Great for seeing overall trend direction at a glance.</p>
                        </div>
                        <div className="info-card">
                            <h5>🕯️ Candlestick Chart</h5>
                            <p>Shows Open, High, Low, Close for each period. Green/white = closed higher (bullish). Red/black = closed lower (bearish).</p>
                        </div>
                        <div className="info-card">
                            <h5>📊 Volume Bars</h5>
                            <p>Shows how many shares were traded. High volume = strong conviction. Low volume = weak move, may not last.</p>
                        </div>
                    </div>
                </div>
                <div className="content-block">
                    <h4>Key Concepts</h4>
                    <ul>
                        <li><strong>Support</strong> — A price level where the stock tends to stop falling (buyers step in)</li>
                        <li><strong>Resistance</strong> — A price level where the stock tends to stop rising (sellers step in)</li>
                        <li><strong>Breakout</strong> — When the price moves above resistance or below support with volume</li>
                        <li><strong>Trend</strong> — Higher highs & higher lows = uptrend. Lower highs & lower lows = downtrend</li>
                    </ul>
                </div>
                <div className="example-box">
                    <div className="example-label">💡 Reading a Candlestick</div>
                    <p>A <strong style={{color: 'var(--bullish)'}}>green candle</strong> with a long body means buyers were strong that day — the price opened low and closed high. A <strong style={{color: 'var(--bearish)'}}>red candle</strong> with a long body means sellers dominated.</p>
                </div>
            </>
        ),
    },
    {
        id: 'indicators',
        icon: BarChart3,
        iconClass: 'blue',
        title: 'Key Indicators Explained',
        subtitle: 'RSI, MACD, Moving Averages — what they actually mean',
        content: (
            <>
                <div className="content-block">
                    <h4>Why Use Indicators?</h4>
                    <p>Indicators are math formulas applied to price data to help answer questions like: "Is this stock overbought?", "Is the trend strong?", "Is a reversal coming?"</p>
                </div>
                <div className="content-block">
                    <div className="info-cards">
                        <div className="info-card">
                            <div className="value orange">RSI</div>
                            <h5>Relative Strength Index</h5>
                            <p>Measures if a stock is overbought (&gt;70) or oversold (&lt;30). Scale: 0–100. Think of it as the stock's "energy level" — too high means it might rest, too low means it might bounce.</p>
                        </div>
                        <div className="info-card">
                            <div className="value green">MACD</div>
                            <h5>Moving Avg Convergence/Divergence</h5>
                            <p>Tracks the relationship between two moving averages. When MACD crosses above signal line = bullish. Below = bearish. Shows momentum shifts.</p>
                        </div>
                        <div className="info-card">
                            <div className="value orange">50 DMA</div>
                            <h5>50-Day Moving Average</h5>
                            <p>Average closing price of the last 50 days. If price is above it, the short-term trend is up. Acts as dynamic support.</p>
                        </div>
                        <div className="info-card">
                            <div className="value orange">200 DMA</div>
                            <h5>200-Day Moving Average</h5>
                            <p>Average of last 200 days. The "big picture" trend indicator. Price above = long-term bullish. Below = long-term bearish.</p>
                        </div>
                    </div>
                </div>
                <div className="content-block">
                    <h4>Famous Patterns</h4>
                    <div className="info-cards">
                        <div className="info-card">
                            <div className="value green">Golden Cross</div>
                            <p>50 DMA crosses ABOVE the 200 DMA. Very bullish long-term signal. Means short-term momentum is overtaking the long-term trend.</p>
                        </div>
                        <div className="info-card">
                            <div className="value red">Death Cross</div>
                            <p>50 DMA crosses BELOW 200 DMA. Bearish signal. Short-term weakness is pulling down the stock's longer trend.</p>
                        </div>
                    </div>
                </div>
                <div className="example-box">
                    <div className="example-label">💡 Plain English</div>
                    <p>If HDFCBANK has RSI = 58, MACD bullish, and price above 50 DMA — in plain English: "The stock is healthy, has good momentum, and is trending up. Not too hot, not too cold."</p>
                </div>
            </>
        ),
    },
    {
        id: 'signals',
        icon: Activity,
        iconClass: 'purple',
        title: 'Understanding Market Signals',
        subtitle: 'What insider trading, bulk deals, and AI alerts mean',
        content: (
            <>
                <div className="content-block">
                    <h4>What Are Signals?</h4>
                    <p>
                        Signals are events or patterns that suggest the stock price might move. Our AI monitors thousands of data points and flags the most interesting ones for you.
                    </p>
                </div>
                <div className="content-block">
                    <h4>Types of Signals We Track</h4>
                    <div className="info-cards">
                        <div className="info-card">
                            <h5>🏢 Bulk Deals</h5>
                            <p>When a mutual fund, foreign investor, or promoter buys/sells a large block of shares (&gt;0.5% of company). Big money votes with action.</p>
                        </div>
                        <div className="info-card">
                            <h5>👤 Insider Trading</h5>
                            <p>When directors, CFOs, or promoters buy/sell their own company's stock. Legal if disclosed to SEBI. Insiders know their company best.</p>
                        </div>
                        <div className="info-card">
                            <h5>📈 Technical Patterns</h5>
                            <p>Chart patterns (Golden Cross, breakouts, etc.) that have historically predicted future price movement with measurable win rates.</p>
                        </div>
                        <div className="info-card">
                            <h5>📄 Corporate Actions</h5>
                            <p>Annual results, dividends, stock splits, board meeting outcomes — events that directly affect the stock's fundamental value.</p>
                        </div>
                    </div>
                </div>
                <div className="content-block">
                    <h4>How to Read Signal Cards</h4>
                    <ul>
                        <li><strong style={{color: 'var(--bullish)'}}>Bullish ▲</strong> — Signal suggests price may go UP</li>
                        <li><strong style={{color: 'var(--bearish)'}}>Bearish ▼</strong> — Signal suggests price may go DOWN</li>
                        <li><strong style={{color: 'var(--neutral)'}}>Conflicting ⚠</strong> — Mixed signals; pros and cons both present</li>
                        <li><strong>Confidence %</strong> — How strong the AI thinks this signal is (higher = more reliable)</li>
                        <li><strong>Win Rate</strong> — How often this pattern worked in backtest (e.g., 71% means it worked 71 out of 100 times)</li>
                    </ul>
                </div>
                <div className="example-box">
                    <div className="example-label">💡 What to do with signals</div>
                    <p>Signals are <strong>not</strong> "buy/sell" orders. Think of them as spotlights — they show you where to look. Always do your own research, check multiple signals, and never invest money you can't afford to lose.</p>
                </div>
            </>
        ),
    },
    {
        id: 'glossary',
        icon: Search,
        iconClass: 'teal',
        title: 'Quick Glossary',
        subtitle: 'Key terms explained in simple words',
        content: (
            <div className="glossary-grid">
                {[
                    { term: 'Bull Market', def: 'When stock prices are generally rising. Optimism is high.' },
                    { term: 'Bear Market', def: 'When stock prices are falling. Fear is dominant.' },
                    { term: 'Market Cap', def: 'Total value of all shares. Share price × total shares = market cap.' },
                    { term: 'P/E Ratio', def: 'Price-to-Earnings. How much you pay per ₹1 of the company earnings. Lower = cheaper.' },
                    { term: 'Dividend', def: 'Cash payment companies give shareholders from profits. Like rent from owning a stock.' },
                    { term: 'Portfolio', def: 'Your collection of investments. Diversifying = not putting all eggs in one basket.' },
                    { term: 'Volatility', def: 'How wildly a price swings. High volatility = more risk but more opportunity.' },
                    { term: 'IPO', def: 'Initial Public Offering. When a company first sells shares to the public.' },
                    { term: 'Blue Chip', def: 'Large, stable, well-known company. Like Reliance, HDFC, TCS. Safer but slower growth.' },
                    { term: 'Stop Loss', def: 'An auto-sell order to limit losses. E.g., sell if price drops below ₹500.' },
                    { term: 'Nifty 50', def: 'Index of the top 50 companies on NSE by market cap. Benchmark for Indian markets.' },
                    { term: 'FII/DII', def: 'Foreign/Domestic Institutional Investors. Their buying/selling moves markets.' },
                ].map(g => (
                    <div key={g.term} className="glossary-item">
                        <div className="glossary-term">{g.term}</div>
                        <div className="glossary-def">{g.def}</div>
                    </div>
                ))}
            </div>
        ),
    },
];

export default function Learn() {
    const [openSections, setOpenSections] = useState(['basics']);

    const toggleSection = (id) => {
        setOpenSections(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    return (
        <div className="learn-page">
            <div className="container">
                <div className="learn-hero">
                    <h1>
                        Learn <span className="gradient-text">Stock Market</span>
                    </h1>
                    <p>
                        New to the stock market? No worries. We explain everything in simple words — no jargon, no confusing charts. Start with the basics and work your way up.
                    </p>
                </div>

                <div className="learn-topics-nav">
                    {sections.map(s => (
                        <button
                            key={s.id}
                            className={`topic-chip ${openSections.includes(s.id) ? 'active' : ''}`}
                            onClick={() => toggleSection(s.id)}
                        >
                            <s.icon size={14} style={{ marginRight: 4, verticalAlign: -2 }} />
                            {s.title}
                        </button>
                    ))}
                </div>

                <div className="learn-sections">
                    {sections.map(s => (
                        <div key={s.id} className="learn-section">
                            <div className="section-header" onClick={() => toggleSection(s.id)}>
                                <div className="section-header-left">
                                    <div className={`section-icon ${s.iconClass}`}>
                                        <s.icon size={22} />
                                    </div>
                                    <div className="section-title-group">
                                        <h3>{s.title}</h3>
                                        <p>{s.subtitle}</p>
                                    </div>
                                </div>
                                <ChevronDown
                                    size={20}
                                    className={`section-chevron ${openSections.includes(s.id) ? 'open' : ''}`}
                                />
                            </div>
                            <div className={`section-body ${openSections.includes(s.id) ? '' : 'closed'}`}>
                                {s.content}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
