import React, { useState, useEffect } from 'react';
import './TickerTape.css';
import { Link } from 'react-router-dom';

const DEFAULT_TICKERS = [
  { s: 'RELIANCE', p: '2,847.30', c: '+1.24%', up: true },
  { s: 'HDFCBANK', p: '1,623.45', c: '+0.87%', up: true },
  { s: 'INFY', p: '1,892.10', c: '-0.43%', up: false },
  { s: 'TCS', p: '3,420.00', c: '+1.56%', up: true },
  { s: 'ICICIBANK', p: '1,124.80', c: '+2.01%', up: true },
  { s: 'WIPRO', p: '478.60', c: '-1.12%', up: false },
  { s: 'BAJFINANCE', p: '7,234.50', c: '+3.22%', up: true },
  { s: 'NIFTY 50', p: '22,147.90', c: '+0.92%', up: true, isIndex: true },
  { s: 'SENSEX', p: '73,158.24', c: '+0.78%', up: true, isIndex: true },
  { s: 'ADANIPORTS', p: '1,089.40', c: '-0.65%', up: false },
  { s: 'MARUTI', p: '12,340.00', c: '+0.34%', up: true },
  { s: 'TITAN', p: '3,520.00', c: '-0.18%', up: false },
  { s: 'LTIM', p: '5,240.00', c: '+1.88%', up: true },
  { s: 'POWERGRID', p: '312.40', c: '+0.55%', up: true }
];

export default function TickerTape() {
  const [tickers, setTickers] = useState(DEFAULT_TICKERS);

  useEffect(() => {
    async function fetchLivePrices() {
      try {
        const res = await fetch('http://localhost:8000/api/stocks/prices');
        if (res.ok) {
          const data = await res.json();
          if (data.prices && data.prices.length > 0) {
            // Map the API response dictionary into the structure our ticker needs
            const liveMap = {};
            data.prices.forEach(p => {
              const symbol = p.ticker.replace('.NS', '');
              liveMap[symbol] = {
                p: p.price.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
                c: (p.change_pct >= 0 ? '+' : '') + p.change_pct.toFixed(2) + '%',
                up: p.change_pct >= 0
              };
            });

            // Update the default tickers with live prices
            setTickers(prev => prev.map(t => {
              if (liveMap[t.s]) {
                return { ...t, ...liveMap[t.s] };
              }
              return t;
            }));
          }
        }
      } catch (e) {
        console.warn('[TickerTape] Failed to fetch live prices, using fallback data.');
      }
    }
    
    fetchLivePrices();
  }, []);

  // Double the array to ensure smooth continuous scrolling
  const displayList = [...tickers, ...tickers, ...tickers];

  return (
    <div className="ticker">
      <div className="ticker-track">
        {displayList.map((t, i) => {
            const content = (
                <div className="ti">
                  <span className="ti-s">{t.s}</span>
                  <span className="ti-p">₹{t.p}</span>
                  <span className={t.up ? 'ti-up' : 'ti-dn'}>
                    {t.up ? '▲' : '▼'} {t.c}
                  </span>
                </div>
            );

            // Link individual stocks to their detail page, but not indices
            if (!t.isIndex) {
                return (
                    <Link 
                        to={`/stock/${t.s}`} 
                        key={i} 
                        style={{textDecoration: 'none'}}
                    >
                        {content}
                    </Link>
                );
            }

            return <div key={i}>{content}</div>;
        })}
      </div>
    </div>
  );
}
