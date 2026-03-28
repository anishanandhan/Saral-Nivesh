import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PortfolioContext = createContext(null);

const API_BASE = 'http://localhost:8000';

// ─── Fallback Prices (used when backend is unavailable) ──────────────
const FALLBACK_PRICES = {
    'RELIANCE': { price: 2945.50, sector: 'Energy', rsi: 58, trend: 'Bullish' },
    'TCS': { price: 3842.75, sector: 'IT', rsi: 72, trend: 'Bullish' },
    'HDFCBANK': { price: 1678.30, sector: 'Banking', rsi: 45, trend: 'Neutral' },
    'INFY': { price: 1456.80, sector: 'IT', rsi: 62, trend: 'Bullish' },
    'ICICIBANK': { price: 1245.60, sector: 'Banking', rsi: 55, trend: 'Bullish' },
    'HINDUNILVR': { price: 2310.40, sector: 'FMCG', rsi: 38, trend: 'Bearish' },
    'ITC': { price: 438.25, sector: 'FMCG', rsi: 48, trend: 'Neutral' },
    'SBIN': { price: 812.50, sector: 'Banking', rsi: 64, trend: 'Bullish' },
    'BHARTIARTL': { price: 1587.90, sector: 'Telecom', rsi: 71, trend: 'Bullish' },
    'KOTAKBANK': { price: 1892.15, sector: 'Banking', rsi: 42, trend: 'Neutral' },
    'LT': { price: 3456.70, sector: 'Infrastructure', rsi: 53, trend: 'Neutral' },
    'AXISBANK': { price: 1156.80, sector: 'Banking', rsi: 60, trend: 'Bullish' },
    'ASIANPAINT': { price: 2890.30, sector: 'Consumer', rsi: 35, trend: 'Bearish' },
    'MARUTI': { price: 12450.60, sector: 'Auto', rsi: 67, trend: 'Bullish' },
    'TITAN': { price: 3245.80, sector: 'Consumer', rsi: 74, trend: 'Bullish' },
    'SUNPHARMA': { price: 1678.40, sector: 'Pharma', rsi: 51, trend: 'Neutral' },
    'BAJFINANCE': { price: 7234.50, sector: 'NBFC', rsi: 69, trend: 'Bullish' },
    'WIPRO': { price: 456.70, sector: 'IT', rsi: 41, trend: 'Neutral' },
    'TATAMOTORS': { price: 945.30, sector: 'Auto', rsi: 57, trend: 'Bullish' },
    'TATASTEEL': { price: 156.40, sector: 'Metals', rsi: 44, trend: 'Bearish' },
    'HCLTECH': { price: 1623.80, sector: 'IT', rsi: 66, trend: 'Bullish' },
    'NTPC': { price: 378.90, sector: 'Power', rsi: 52, trend: 'Neutral' },
    'ONGC': { price: 267.30, sector: 'Energy', rsi: 47, trend: 'Neutral' },
    'POWERGRID': { price: 312.50, sector: 'Power', rsi: 49, trend: 'Neutral' },
    'COALINDIA': { price: 445.60, sector: 'Mining', rsi: 43, trend: 'Bearish' },
    'ADANIENT': { price: 3120.40, sector: 'Conglomerate', rsi: 76, trend: 'Bullish' },
    'ULTRACEMCO': { price: 11234.50, sector: 'Cement', rsi: 54, trend: 'Neutral' },
};

// Sector map for tickers (used when backend doesn't return sector)
const SECTOR_MAP = {
    'RELIANCE': 'Energy', 'TCS': 'IT', 'HDFCBANK': 'Banking', 'INFY': 'IT',
    'ICICIBANK': 'Banking', 'HINDUNILVR': 'FMCG', 'ITC': 'FMCG', 'SBIN': 'Banking',
    'BHARTIARTL': 'Telecom', 'KOTAKBANK': 'Banking', 'LT': 'Infrastructure',
    'AXISBANK': 'Banking', 'ASIANPAINT': 'Consumer', 'MARUTI': 'Auto',
    'TITAN': 'Consumer', 'SUNPHARMA': 'Pharma', 'BAJFINANCE': 'NBFC',
    'WIPRO': 'IT', 'TATAMOTORS': 'Auto', 'TATASTEEL': 'Metals',
    'HCLTECH': 'IT', 'NTPC': 'Power', 'ONGC': 'Energy',
    'POWERGRID': 'Power', 'COALINDIA': 'Mining', 'ADANIENT': 'Conglomerate',
    'ULTRACEMCO': 'Cement',
};

// ─── Default demo portfolio for first-time users ────────────────────
const DEFAULT_PORTFOLIO = [
    { ticker: 'TCS', name: 'Tata Consultancy Services', qty: 10, buyPrice: 3400, addedAt: '2026-02-10' },
    { ticker: 'INFY', name: 'Infosys', qty: 8, buyPrice: 1500, addedAt: '2026-02-25' },
    { ticker: 'HDFCBANK', name: 'HDFC Bank', qty: 12, buyPrice: 1600, addedAt: '2026-03-01' },
    { ticker: 'ITC', name: 'ITC Ltd', qty: 20, buyPrice: 450, addedAt: '2025-12-20' },
    { ticker: 'RELIANCE', name: 'Reliance Industries', qty: 5, buyPrice: 2800, addedAt: '2026-01-15' },
    { ticker: 'TATAMOTORS', name: 'Tata Motors', qty: 6, buyPrice: 900, addedAt: '2026-01-05' },
];

const STORAGE_KEY = 'et_portfolio_holdings';

function getStockData(ticker, livePrices) {
    const live = livePrices[ticker];
    if (live) return live;
    return FALLBACK_PRICES[ticker] || { price: 0, sector: 'Unknown', rsi: 50, trend: 'Neutral' };
}

function getSignal(rsi) {
    if (rsi >= 70) return 'Overbought';
    if (rsi <= 30) return 'Oversold';
    if (rsi >= 55) return 'Bullish';
    if (rsi <= 45) return 'Bearish';
    return 'Neutral';
}

export function PortfolioProvider({ children }) {
    const [holdings, setHoldings] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) return JSON.parse(stored);
        } catch { /* ignore */ }
        return DEFAULT_PORTFOLIO;
    });

    const [livePrices, setLivePrices] = useState(FALLBACK_PRICES);

    // ─── Fetch live prices from backend on mount ────────────────────
    useEffect(() => {
        async function fetchLivePrices() {
            try {
                // Get all unique tickers from holdings + common defaults
                const allTickers = [...new Set([
                    ...holdings.map(h => h.ticker),
                    ...Object.keys(FALLBACK_PRICES),
                ])];

                const tickerStr = allTickers.map(t => t.endsWith('.NS') ? t : `${t}.NS`).join(',');
                const priceRes = await fetch(`${API_BASE}/api/stocks/prices?tickers=${tickerStr}`);
                const priceData = await priceRes.json();

                const updatedPrices = { ...FALLBACK_PRICES };

                // Update prices from the batch price endpoint
                if (priceData.prices) {
                    for (const p of priceData.prices) {
                        const clean = p.ticker?.replace('.NS', '') || p.name;
                        if (clean && p.price) {
                            updatedPrices[clean] = {
                                ...updatedPrices[clean],
                                price: p.price,
                                sector: SECTOR_MAP[clean] || updatedPrices[clean]?.sector || 'Unknown',
                            };
                        }
                    }
                }

                // Fetch real-time technical data (RSI, trend) for portfolio holdings
                const techPromises = holdings.map(async (h) => {
                    try {
                        const res = await fetch(`${API_BASE}/api/stocks/${h.ticker}/technical`);
                        if (!res.ok) return null;
                        const tech = await res.json();
                        return { ticker: h.ticker, tech };
                    } catch {
                        return null;
                    }
                });

                const techResults = await Promise.all(techPromises);
                for (const result of techResults) {
                    if (!result || !result.tech) continue;
                    const t = result.ticker;
                    const tech = result.tech;
                    const rsi = tech.rsi ? Math.round(tech.rsi) : updatedPrices[t]?.rsi || 50;
                    const trend = rsi >= 55 ? 'Bullish' : rsi <= 45 ? 'Bearish' : 'Neutral';
                    updatedPrices[t] = {
                        ...updatedPrices[t],
                        price: tech.current_price || updatedPrices[t]?.price || 0,
                        rsi,
                        trend,
                        sector: SECTOR_MAP[t] || updatedPrices[t]?.sector || 'Unknown',
                    };
                }

                setLivePrices(updatedPrices);
                console.log('[Portfolio] Live prices loaded from backend');
            } catch (err) {
                console.warn('[Portfolio] Backend unavailable, using fallback prices:', err.message);
            }
        }

        fetchLivePrices();
    }, [holdings.length]); // Re-fetch when stocks are added/removed

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
    }, [holdings]);

    const addStock = useCallback((stock) => {
        setHoldings(prev => {
            const existing = prev.find(h => h.ticker === stock.ticker);
            if (existing) {
                // Average the buy price
                const totalQty = existing.qty + stock.qty;
                const avgPrice = ((existing.qty * existing.buyPrice) + (stock.qty * stock.buyPrice)) / totalQty;
                return prev.map(h =>
                    h.ticker === stock.ticker
                        ? { ...h, qty: totalQty, buyPrice: Math.round(avgPrice * 100) / 100 }
                        : h
                );
            }
            return [...prev, { ...stock, addedAt: new Date().toISOString().split('T')[0] }];
        });
    }, []);

    const sellStock = useCallback((ticker, qty) => {
        setHoldings(prev => {
            return prev.map(h => {
                if (h.ticker !== ticker) return h;
                const remaining = h.qty - qty;
                if (remaining <= 0) return null;
                return { ...h, qty: remaining };
            }).filter(Boolean);
        });
    }, []);

    const clearPortfolio = useCallback(() => {
        setHoldings([]);
    }, []);

    const resetToDefault = useCallback(() => {
        setHoldings(DEFAULT_PORTFOLIO);
    }, []);

    // ─── Computed Values ─────────────────────────────────────────
    const enrichedHoldings = holdings.map(h => {
        const data = getStockData(h.ticker, livePrices);
        const currentValue = data.price * h.qty;
        const invested = h.buyPrice * h.qty;
        const pnl = currentValue - invested;
        const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;
        return {
            ...h,
            currentPrice: data.price,
            sector: data.sector,
            rsi: data.rsi,
            trend: data.trend,
            signal: getSignal(data.rsi),
            currentValue,
            invested,
            pnl,
            pnlPercent,
        };
    });

    const totalInvestment = enrichedHoldings.reduce((sum, h) => sum + h.invested, 0);
    const currentValue = enrichedHoldings.reduce((sum, h) => sum + h.currentValue, 0);
    const totalPnl = currentValue - totalInvestment;
    const totalPnlPercent = totalInvestment > 0 ? (totalPnl / totalInvestment) * 100 : 0;

    // Sector allocation
    const sectorAllocation = {};
    enrichedHoldings.forEach(h => {
        if (!sectorAllocation[h.sector]) sectorAllocation[h.sector] = 0;
        sectorAllocation[h.sector] += h.currentValue;
    });
    const sectorPercent = {};
    Object.entries(sectorAllocation).forEach(([sector, value]) => {
        sectorPercent[sector] = currentValue > 0 ? Math.round((value / currentValue) * 100) : 0;
    });

    // Portfolio health
    const avgRsi = enrichedHoldings.length > 0
        ? enrichedHoldings.reduce((sum, h) => sum + h.rsi, 0) / enrichedHoldings.length
        : 50;
    const bullishCount = enrichedHoldings.filter(h => h.trend === 'Bullish').length;
    const bearishCount = enrichedHoldings.filter(h => h.trend === 'Bearish').length;
    const portfolioHealth = bullishCount > bearishCount + 1 ? 'Bullish'
        : bearishCount > bullishCount + 1 ? 'Bearish' : 'Neutral';

    const confidenceScore = Math.min(95, Math.max(25,
        Math.round(50 + (bullishCount - bearishCount) * 8 + (totalPnlPercent > 0 ? 10 : -5))
    ));

    return (
        <PortfolioContext.Provider value={{
            holdings: enrichedHoldings,
            rawHoldings: holdings,
            addStock,
            sellStock,
            clearPortfolio,
            resetToDefault,
            totalInvestment,
            currentValue,
            totalPnl,
            totalPnlPercent,
            sectorAllocation: sectorPercent,
            portfolioHealth,
            confidenceScore,
            avgRsi,
            mockPrices: livePrices,
        }}>
            {children}
        </PortfolioContext.Provider>
    );
}

export function usePortfolio() {
    const ctx = useContext(PortfolioContext);
    if (!ctx) throw new Error('usePortfolio must be used inside PortfolioProvider');
    return ctx;
}
