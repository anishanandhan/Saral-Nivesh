"""
Opportunity Radar — FastAPI Backend Server
Main API server providing endpoints for:
- Signal scanning (technical + fundamental)
- Pattern detection and backtesting
- Stock data and technical summaries
- AI-powered chat (Ask ET)
"""

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import json

from config import DEMO_TICKERS, NIFTY_50_TICKERS, DISCLAIMER
from data_fetcher import (
    get_stock_data, get_stock_info, get_batch_stock_data, get_latest_prices,
)
from pattern_engine import scan_stock, scan_all_stocks, get_technical_summary
from filing_parser import (
    get_all_signals, generate_bulk_deals, generate_insider_trades,
    generate_corporate_announcements, detect_unusual_insider_activity,
)
from backtester import backtest_pattern, get_backtest_summary
from grok_ai import generate_signal_alert, generate_chat_response

# Import new multi-agent components
from agents.orchestrator import run_pipeline, run_chat_pipeline
from audit.logger import get_audit_logger
from scenarios.bulk_deal_distress import handle_bulk_deal_scenario
from scenarios.conflicting_breakout import handle_conflicting_breakout_scenario
from scenarios.portfolio_news import handle_portfolio_news_scenario


# ─── App Setup ────────────────────────────────────────────────────────

app = FastAPI(
    title="Opportunity Radar — AI for the Indian Investor",
    description="AI-powered signal detection engine for NSE/BSE markets",
    version="1.0.0",
)

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request Models ──────────────────────────────────────────────────

class ChatRequest(BaseModel):
    query: str
    portfolio: Optional[list[dict]] = None


class BacktestRequest(BaseModel):
    ticker: str
    pattern: str


class PipelineRequest(BaseModel):
    tickers: Optional[list[str]] = None
    portfolio: Optional[list[dict]] = None
    query: Optional[str] = ""
    lookback_days: Optional[int] = 7


# ─── Health & Info ────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "name": "Opportunity Radar API",
        "version": "1.0.0",
        "status": "running",
        "disclaimer": DISCLAIMER,
    }


@app.get("/api/health")
async def health():
    return {"status": "ok"}


# ─── Stock Data Endpoints ────────────────────────────────────────────

@app.get("/api/stocks/prices")
async def get_prices(
    tickers: Optional[str] = Query(None, description="Comma-separated tickers"),
):
    """Get latest prices for stocks."""
    ticker_list = tickers.split(",") if tickers else DEMO_TICKERS
    prices = get_latest_prices(ticker_list)
    return {"prices": prices, "count": len(prices)}


@app.get("/api/stocks/{ticker}/info")
async def get_info(ticker: str):
    """Get stock info for a single ticker."""
    if not ticker.endswith(".NS"):
        ticker += ".NS"
    info = get_stock_info(ticker)
    return info


@app.get("/api/stocks/{ticker}/ohlcv")
async def get_ohlcv(
    ticker: str,
    period: str = Query("1y", description="Data period: 1mo, 3mo, 6mo, 1y, 3y"),
):
    """Get OHLCV data for charting."""
    if not ticker.endswith(".NS"):
        ticker += ".NS"
    df = get_stock_data(ticker, period=period)
    if df is None:
        raise HTTPException(status_code=404, detail=f"No data found for {ticker}")

    # Convert to JSON-friendly format
    data = []
    for idx, row in df.iterrows():
        data.append({
            "time": int(idx.timestamp()),
            "open": round(float(row["Open"]), 2),
            "high": round(float(row["High"]), 2),
            "low": round(float(row["Low"]), 2),
            "close": round(float(row["Close"]), 2),
            "volume": int(row["Volume"]),
        })

    return {"ticker": ticker, "data": data, "count": len(data)}


@app.get("/api/stocks/{ticker}/technical")
async def get_technical(ticker: str):
    """Get full technical summary for a stock."""
    if not ticker.endswith(".NS"):
        ticker += ".NS"
    df = get_stock_data(ticker)
    if df is None:
        raise HTTPException(status_code=404, detail=f"No data found for {ticker}")

    summary = get_technical_summary(df)
    summary["ticker"] = ticker
    summary["stock_name"] = ticker.replace(".NS", "")
    return summary


# ─── Signal Scanning Endpoints ───────────────────────────────────────

@app.get("/api/signals/technical")
async def get_technical_signals(
    tickers: Optional[str] = Query(None, description="Comma-separated tickers"),
):
    """Scan stocks for technical patterns (RSI, MACD, breakouts, etc.)."""
    ticker_list = tickers.split(",") if tickers else DEMO_TICKERS
    stock_data = get_batch_stock_data(ticker_list)
    signals = scan_all_stocks(stock_data)
    return {
        "signals": signals,
        "count": len(signals),
        "stocks_scanned": len(stock_data),
        "disclaimer": DISCLAIMER,
    }


@app.get("/api/signals/filings")
async def get_filing_signals(
    days: int = Query(7, description="Days to look back"),
    signal_type: Optional[str] = Query(None, description="Filter: bulk_deal, insider_trade, corporate_announcement"),
):
    """Get corporate filing signals (bulk deals, insider trades, announcements)."""
    if signal_type == "bulk_deal":
        signals = generate_bulk_deals(days)
    elif signal_type == "insider_trade":
        signals = generate_insider_trades(days)
    elif signal_type == "corporate_announcement":
        signals = generate_corporate_announcements(days)
    else:
        signals = get_all_signals(days)

    return {
        "signals": signals,
        "count": len(signals),
        "disclaimer": DISCLAIMER,
    }


@app.get("/api/signals/all")
async def get_all_combined_signals(
    tickers: Optional[str] = Query(None, description="Comma-separated tickers"),
):
    """Get ALL signals combined: technical patterns + corporate filings."""
    # Technical signals
    ticker_list = tickers.split(",") if tickers else DEMO_TICKERS
    stock_data = get_batch_stock_data(ticker_list)
    tech_signals = scan_all_stocks(stock_data)

    # Filing signals
    filing_signals = get_all_signals(7)

    # Unusual insider activity
    insider_trades = generate_insider_trades(14)
    unusual = detect_unusual_insider_activity(insider_trades, threshold=2)

    # Combine and sort by confidence
    all_signals = tech_signals + filing_signals + unusual
    all_signals.sort(key=lambda x: x.get("confidence", 0), reverse=True)

    return {
        "signals": all_signals,
        "count": len(all_signals),
        "technical_count": len(tech_signals),
        "filing_count": len(filing_signals),
        "unusual_activity_count": len(unusual),
        "disclaimer": DISCLAIMER,
    }


@app.get("/api/signals/unusual-insider")
async def get_unusual_insider():
    """Detect stocks with unusual insider buying clusters."""
    trades = generate_insider_trades(14)
    unusual = detect_unusual_insider_activity(trades, threshold=2)
    return {
        "alerts": unusual,
        "count": len(unusual),
        "disclaimer": DISCLAIMER,
    }


# ─── Backtesting Endpoints ───────────────────────────────────────────

@app.post("/api/backtest")
async def run_backtest(request: BacktestRequest):
    """Backtest a specific pattern on a stock."""
    ticker = request.ticker
    if not ticker.endswith(".NS"):
        ticker += ".NS"

    result = backtest_pattern(ticker, request.pattern)
    if result is None:
        raise HTTPException(status_code=404, detail="Insufficient data for backtest")

    result["disclaimer"] = DISCLAIMER
    return result


@app.get("/api/backtest/{ticker}")
async def get_stock_backtests(ticker: str):
    """Run all pattern backtests for a single stock."""
    if not ticker.endswith(".NS"):
        ticker += ".NS"

    result = get_backtest_summary(ticker)
    result["disclaimer"] = DISCLAIMER
    return result


# ─── AI Chat Endpoint ────────────────────────────────────────────────

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Ask ET — AI-powered market Q&A with real-time stock data context."""
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    query = request.query.strip()

    # ── Step 1: Detect which stock(s) the user is asking about ──
    detected_tickers = _detect_tickers(query)

    # ── Step 2: Fetch REAL live data for detected stocks ──
    stock_context = {}
    for ticker in detected_tickers[:3]:  # Max 3 stocks for context
        try:
            ns_ticker = ticker if ticker.endswith(".NS") else f"{ticker}.NS"
            df = get_stock_data(ns_ticker, period="1y")
            if df is not None and len(df) > 0:
                summary = get_technical_summary(df)
                patterns = scan_stock(ns_ticker, df)
                stock_context[ticker.replace(".NS", "")] = {
                    "ticker": ns_ticker,
                    "current_price": round(float(df['Close'].iloc[-1]), 2),
                    "rsi": round(summary.get("rsi", 0), 2),
                    "macd": round(summary.get("macd", 0), 4),
                    "macd_signal": round(summary.get("macd_signal", 0), 4),
                    "sma_50": round(summary.get("sma_50", 0), 2),
                    "sma_200": round(summary.get("sma_200", 0), 2),
                    "above_sma_50": summary.get("above_sma_50", False),
                    "above_sma_200": summary.get("above_sma_200", False),
                    "support_levels": summary.get("support_levels", []),
                    "resistance_levels": summary.get("resistance_levels", []),
                    "patterns_detected": [p.get("pattern", "") for p in patterns],
                    "52w_high": round(float(df['High'].max()), 2),
                    "52w_low": round(float(df['Low'].min()), 2),
                    "volume_avg": int(df['Volume'].tail(30).mean()),
                    "volume_latest": int(df['Volume'].iloc[-1]),
                    "nse_url": f"https://www.nseindia.com/get-quotes/equity?symbol={ticker.replace('.NS', '')}",
                    "yahoo_url": f"https://finance.yahoo.com/quote/{ns_ticker}/",
                    "screener_url": f"https://www.screener.in/company/{ticker.replace('.NS', '')}/",
                    "tradingview_url": f"https://in.tradingview.com/chart/?symbol=NSE%3A{ticker.replace('.NS', '')}",
                    "moneycontrol_search": f"https://www.moneycontrol.com/stocks/cptmarket/compsearchnew.php?search_data={ticker.replace('.NS', '')}&cid=&mbession=&board=&myession=&search_type=MC",
                    "trendlyne_url": f"https://trendlyne.com/equity/{ticker.replace('.NS', '')}/",
                    "tickertape_url": f"https://www.tickertape.in/stocks/{ticker.replace('.NS', '').lower()}",
                }
        except Exception as e:
            print(f"[Chat] Error fetching data for {ticker}: {e}")

    # ── Step 3: Build enriched context ──
    context = {
        "detected_stocks": list(stock_context.keys()),
        "stock_data": stock_context,
        "timestamp": "2026-03-21",
        "market_status": "Live data from NSE via Yahoo Finance API",
    }

    response = run_chat_pipeline(
        query=query,
        portfolio=request.portfolio,
        stock_data_context=context,
    )

    return response


# ── Ticker Detection Helper ─────────────────────────────────────────

# Map of common names/aliases → NSE ticker
STOCK_NAME_MAP = {
    "reliance": "RELIANCE", "ril": "RELIANCE", "jio": "RELIANCE",
    "tcs": "TCS", "tata consultancy": "TCS",
    "hdfc bank": "HDFCBANK", "hdfc": "HDFCBANK", "hdfcbank": "HDFCBANK",
    "infosys": "INFY", "infy": "INFY",
    "icici": "ICICIBANK", "icici bank": "ICICIBANK", "icicibank": "ICICIBANK",
    "hul": "HINDUNILVR", "hindustan unilever": "HINDUNILVR", "hindunilvr": "HINDUNILVR",
    "itc": "ITC",
    "sbi": "SBIN", "sbin": "SBIN", "state bank": "SBIN",
    "airtel": "BHARTIARTL", "bharti airtel": "BHARTIARTL", "bhartiartl": "BHARTIARTL",
    "kotak": "KOTAKBANK", "kotak bank": "KOTAKBANK", "kotakbank": "KOTAKBANK",
    "lt": "LT", "l&t": "LT", "larsen": "LT",
    "axis": "AXISBANK", "axis bank": "AXISBANK", "axisbank": "AXISBANK",
    "asian paints": "ASIANPAINT", "asianpaint": "ASIANPAINT",
    "maruti": "MARUTI", "maruti suzuki": "MARUTI",
    "titan": "TITAN",
    "sun pharma": "SUNPHARMA", "sunpharma": "SUNPHARMA",
    "bajaj finance": "BAJFINANCE", "bajfinance": "BAJFINANCE", "bajaj": "BAJFINANCE",
    "wipro": "WIPRO",
    "ultratech": "ULTRACEMCO", "ultracemco": "ULTRACEMCO",
    "ongc": "ONGC",
    "ntpc": "NTPC",
    "tata motors": "TATAMOTORS", "tatamotors": "TATAMOTORS",
    "jsw steel": "JSWSTEEL", "jswsteel": "JSWSTEEL",
    "power grid": "POWERGRID", "powergrid": "POWERGRID",
    "m&m": "M&M", "mahindra": "M&M",
    "adani": "ADANIENT", "adani enterprises": "ADANIENT", "adanient": "ADANIENT",
    "tata steel": "TATASTEEL", "tatasteel": "TATASTEEL",
    "hcl tech": "HCLTECH", "hcltech": "HCLTECH", "hcl": "HCLTECH",
    "indusind": "INDUSINDBK", "indusind bank": "INDUSINDBK", "indusindbk": "INDUSINDBK",
    "coal india": "COALINDIA", "coalindia": "COALINDIA",
    "nifty": "NIFTY_50", "nifty 50": "NIFTY_50",
    "bajaj auto": "BAJAJ-AUTO",
}


def _detect_tickers(query: str) -> list[str]:
    """Detect stock ticker symbols from a user's natural language query."""
    query_lower = query.lower()
    found = []

    # Sort by length (longest first) so "bajaj finance" matches before "bajaj"
    sorted_names = sorted(STOCK_NAME_MAP.keys(), key=len, reverse=True)

    for name in sorted_names:
        if name in query_lower:
            ticker = STOCK_NAME_MAP[name]
            if ticker not in found and ticker != "NIFTY_50":
                found.append(ticker)

    return found


@app.get("/api/chat/suggestions")
async def chat_suggestions():
    """Get suggested queries for the chat interface."""
    return {
        "suggestions": [
            "Which Nifty 50 stocks had insider buying this week?",
            "Is Reliance in a breakout?",
            "Compare HDFC Bank vs ICICI Bank technically",
            "What are the key support levels for TCS?",
            "Show me stocks with RSI below 30",
            "Which sectors are showing strength this month?",
        ]
    }


# ─── Multi-Agent Pipeline Endpoints ──────────────────────────────────

@app.post("/api/pipeline/run")
async def execute_pipeline(request: PipelineRequest):
    """Run the full 5-agent autonomous pipeline."""
    try:
        result = run_pipeline(
            tickers=request.tickers,
            portfolio=request.portfolio,
            user_query=request.query,
            lookback_days=request.lookback_days,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/audit-log")
async def get_audit_trail(
    limit: int = Query(50, description="Number of logs to return"),
    session_id: Optional[str] = Query(None, description="Filter by session"),
):
    """Get the enterprise audit trail of all agent actions."""
    logger = get_audit_logger()
    logs = logger.get_logs(limit=limit, session_id=session_id)
    stats = logger.get_cost_summary()
    return {"logs": logs, "stats": stats}


# ─── Scenario Judge Scenarios ────────────────────────────────────────

@app.get("/api/scenarios/{scenario_id}")
async def trigger_scenario(scenario_id: str):
    """Trigger the specific 3 Judge Scenario Packs."""
    if scenario_id == "1":
        return handle_bulk_deal_scenario()
    elif scenario_id == "2":
        return handle_conflicting_breakout_scenario()
    elif scenario_id == "3":
        return handle_portfolio_news_scenario()
    else:
        raise HTTPException(status_code=404, detail="Scenario not found: use 1, 2, or 3")


# ─── AI Alert Generation ─────────────────────────────────────────────

@app.post("/api/ai/alert")
async def generate_alert(signal_data: dict):
    """Generate an AI-powered alert card for a signal."""
    alert = generate_signal_alert(signal_data)
    return alert


# ─── Run Server ───────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
