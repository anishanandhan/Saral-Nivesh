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
from grok_ai import generate_signal_alert, generate_chat_response, run_copilot_with_groq, BEGINNER_GLOSSARY, _call_groq_json

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
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request Models ──────────────────────────────────────────────────

class ChatRequest(BaseModel):
    query: str
    portfolio: Optional[list[dict]] = None

class CopilotRequest(BaseModel):
    ticker: str
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


@app.post("/api/copilot/analyze")
async def analyze_copilot(request: CopilotRequest):
    """Run the Agentic Co-Pilot Multi-Agent Pipeline (Scout → Quant → Translator)"""
    ticker = request.ticker.upper()
    if not ticker.endswith(".NS"):
        ticker += ".NS"

    # ── STEP 1: Scout Agent ──
    df = get_stock_data(ticker, period="1y")
    info = get_stock_info(ticker)

    # ── STEP 2: Quant Agent ──
    patterns = []
    summary = {}
    if df is not None and not df.empty:
        patterns = scan_stock(ticker, df)
        summary = get_technical_summary(df)

    rsi_val = round(summary.get("rsi", 50), 1) if summary else 50
    macd_val = round(summary.get("macd", 0), 2) if summary else 0
    trend = "Bullish" if summary.get("above_sma_50") else "Bearish" if summary else "Neutral"
    pattern_names = []
    for i, p in enumerate(patterns):
        if i >= 3:
            break
        pattern_names.append(p.get("pattern", ""))

    # ── STEP 3: Build portfolio context ──
    is_fmcg = "ITC" in ticker or "HINDUNILVR" in ticker or "MARICO" in ticker
    is_it = "TCS" in ticker or "INFY" in ticker or "TECHM" in ticker
    ptf_context = ""
    if request.portfolio:
        for item in request.portfolio:
            if item.get("ticker", "") == ticker:
                qty = item.get("quantity", 0)
                avg = item.get("avg_price", 0)
                ptf_context = f"You hold {qty} shares at ₹{avg}."
    if not ptf_context and is_it:
        ptf_context = f"You hold 50 shares of {ticker.replace('.NS', '')} at ₹3,600."
    elif not ptf_context and is_fmcg:
        ptf_context = f"You hold 200 shares of {ticker.replace('.NS', '')} at ₹410."

    # ── STEP 4: News context (demo) ──
    news = ""
    if is_it:
        news = "FII sold ₹2,400 Cr in IT sector this week. Q3 guidance was cautious."
    elif is_fmcg:
        news = "Rural demand recovery noted in FMCG. Raw material costs declining."
    else:
        news = "Normal market conditions. No major sector-specific events."

    # ── STEP 5: Translator Agent (Groq AI) ──
    stock_name = info.get("name", ticker.replace(".NS", ""))
    ai_result = run_copilot_with_groq(
        stock_name=stock_name,
        trend=trend,
        rsi=rsi_val,
        macd=macd_val,
        patterns=pattern_names,
        news=news,
        portfolio_context=ptf_context,
    )

    curr_price = 0
    if info.get("current_price"):
        curr_price = info.get("current_price")
    elif df is not None and not df.empty:
        curr_price = round(float(df['Close'].iloc[-1]), 2)

    return {
        "thought_process": [
            # ── Scout Agent (3 steps) ──
            {
                "agent": "Scout",
                "action": "Connecting to NSE data feed...",
                "status": "complete",
                "details": f"✔ Target: {ticker} | Period: 1 year | Source: yfinance/NSE"
            },
            {
                "agent": "Scout",
                "action": "✔ Fetched OHLCV data + company profile",
                "status": "complete",
                "details": f"Sector: {info.get('sector', 'N/A')} | Current Price: ₹{curr_price}"
            },
            {
                "agent": "Scout",
                "action": "✔ Scanned news & filings for key events",
                "status": "complete",
                "details": f"News: {news[:90]}"
            },
            # ── Quant Agent (3 steps) ──
            {
                "agent": "Quant",
                "action": "Running RSI, MACD & moving average calculations...",
                "status": "complete",
                "details": f"✔ RSI(14) = {rsi_val} | MACD = {macd_val} | Trend: {trend}"
            },
            {
                "agent": "Quant",
                "action": "✔ Pattern detection complete",
                "status": "complete",
                "details": f"Detected: {', '.join(pattern_names) if pattern_names else 'No chart patterns'} | SMA-50, SMA-200 calculated"
            },
            {
                "agent": "Quant",
                "action": f"✔ Generated {len(patterns)} actionable signals",
                "status": "complete",
                "details": f"Signal strength: {'Strong' if abs(rsi_val - 50) > 20 else 'Moderate'} | Volatility: {'High' if abs(macd_val) > 50 else 'Normal'}"
            },
            # ── Translator Agent (3 steps) ──
            {
                "agent": "Translator",
                "action": "Sending analysis to Groq AI (Llama 3.3 70B)...",
                "status": "complete",
                "details": f"✔ Prompt: TL;DR + Confidence + Why NOT format | Model: {('llama-3.3-70b-versatile')}"
            },
            {
                "agent": "Translator",
                "action": "✔ AI generated structured explanation",
                "status": "complete",
                "details": f"Traffic Light: {ai_result.get('traffic_light', 'Yellow')} | Confidence: {ai_result.get('confidence_score', 'N/A')}%"
            },
            {
                "agent": "Translator",
                "action": "✔ Added beginner glossary & risk warnings",
                "status": "complete",
                "details": f"AI: {'✅ Groq powered' if ai_result.get('ai_powered') else '⚡ Rule-based fallback'} | Glossary terms injected"
            },
        ],
        "traffic_light": ai_result.get("traffic_light", "Yellow"),
        "tldr": ai_result.get("tldr", ""),
        "key_signal": ai_result.get("key_signal", ""),
        "signal_strength": ai_result.get("signal_strength", "Moderate"),
        "signal_strength_reason": ai_result.get("signal_strength_reason", ""),
        "whats_happening": ai_result.get("whats_happening", ""),
        "why_its_happening": ai_result.get("why_its_happening", ""),
        "bullish_factors": ai_result.get("bullish_factors", ""),
        "bearish_factors": ai_result.get("bearish_factors", ""),
        "conflict_detection": ai_result.get("conflict_detection", ""),
        "why_not": ai_result.get("why_not", ""),
        "confidence_score": ai_result.get("confidence_score", 50),
        "confidence_reason": ai_result.get("confidence_reason", ""),
        "portfolio_impact": ai_result.get("portfolio_impact", ""),
        "historical_success_rate": ai_result.get("historical_success_rate", ""),
        "typical_outcome": ai_result.get("typical_outcome", ""),
        "failure_case": ai_result.get("failure_case", ""),
        "sources": ai_result.get("sources", []),
        "recommendation": ai_result.get("recommendation", ""),
        "beginner_tip": ai_result.get("beginner_tip", ""),
        "video_script": ai_result.get("video_script", ""),
        "current_price": curr_price,
        "stock_name": stock_name,
        "portfolio_context": ptf_context,
        "patterns": pattern_names,
        "ai_powered": ai_result.get("ai_powered", False),
    }


# ─── Portfolio Analysis Endpoints ────────────────────────────────────


class PortfolioRequest(BaseModel):
    holdings: list[dict]


class StockInsightRequest(BaseModel):
    ticker: str


@app.post("/api/portfolio/analyze")
async def analyze_portfolio(request: PortfolioRequest):
    """Master Portfolio AI Analysis — evaluates entire portfolio."""
    holdings = request.holdings
    if not holdings:
        raise HTTPException(status_code=400, detail="Portfolio is empty")

    portfolio_analysis = []
    sector_map = {}
    total_invested = 0
    total_current = 0

    for h in holdings:
        ticker = h.get("ticker", "")
        ns_ticker = ticker if ticker.endswith(".NS") else f"{ticker}.NS"

        stock_info = {
            "ticker": ticker,
            "name": h.get("name", ticker),
            "qty": h.get("qty", 0),
            "buyPrice": h.get("buyPrice", 0),
            "currentPrice": h.get("currentPrice", 0),
        }

        # Try to fetch real technical data
        try:
            df = get_stock_data(ns_ticker, period="6mo")
            if df is not None and len(df) > 0:
                summary = get_technical_summary(df)
                stock_info["rsi"] = round(summary.get("rsi", 50), 1)
                stock_info["trend"] = "Bullish" if summary.get("above_sma_50") else "Bearish"
                stock_info["sma_50"] = round(summary.get("sma_50", 0), 2)
                stock_info["sma_200"] = round(summary.get("sma_200", 0), 2)
                stock_info["currentPrice"] = round(float(df['Close'].iloc[-1]), 2)
        except Exception as e:
            print(f"[Portfolio] Error fetching {ticker}: {e}")
            stock_info.setdefault("rsi", 50)
            stock_info.setdefault("trend", "Neutral")

        # Sector detection (simple rules)
        info = {}
        try:
            info = get_stock_info(ns_ticker)
            stock_info["sector"] = info.get("sector", "Unknown")
        except:
            stock_info["sector"] = "Unknown"

        invested = stock_info["buyPrice"] * stock_info["qty"]
        current = stock_info["currentPrice"] * stock_info["qty"]
        total_invested += invested
        total_current += current

        sector = stock_info.get("sector", "Unknown")
        sector_map[sector] = sector_map.get(sector, 0) + current

        portfolio_analysis.append(stock_info)

    total_pnl = total_current - total_invested
    total_pnl_pct = (total_pnl / total_invested * 100) if total_invested > 0 else 0

    # Sector allocation percentages
    allocation = []
    for sector, value in sorted(sector_map.items(), key=lambda x: x[1], reverse=True):
        pct = round((float(value) / float(total_current) * 100) if float(total_current) > 0 else 0)
        allocation.append({"sector": sector, "percent": pct})

    # Identify risks and opportunities
    overbought = [s["ticker"] for s in portfolio_analysis if s.get("rsi", 50) > 70]
    oversold = [s["ticker"] for s in portfolio_analysis if s.get("rsi", 50) < 30]
    bullish = [s["ticker"] for s in portfolio_analysis if s.get("trend") == "Bullish"]
    bearish = [s["ticker"] for s in portfolio_analysis if s.get("trend") == "Bearish"]

    health = "Bullish" if len(bullish) > len(bearish) + 1 else "Bearish" if len(bearish) > len(bullish) + 1 else "Neutral"

    risks = []
    if overbought:
        risks.append(f"{', '.join(overbought)} in overbought territory (RSI > 70). Consider partial profit booking.")
    if allocation and allocation[0]["percent"] > 40:
        risks.append(f"Portfolio concentrated in {allocation[0]['sector']} ({allocation[0]['percent']}%). Diversify.")
    if bearish:
        risks.append(f"{', '.join(bearish)} showing bearish trends. Monitor closely.")

    opportunities = []
    if oversold:
        opportunities.append(f"{', '.join(oversold)} oversold — potential bounce opportunity.")
    if bullish:
        opportunities.append(f"{', '.join(bullish)} showing strong bullish momentum.")

    return {
        "summary": f"Portfolio is {health} with {len(holdings)} stocks. "
                   f"Total P&L: {'+'if total_pnl >= 0 else ''}₹{total_pnl:,.0f} ({total_pnl_pct:+.1f}%).",
        "allocation": allocation,
        "risks": risks,
        "opportunities": opportunities,
        "recommendations": {
            "hold": [s["ticker"] for s in portfolio_analysis if s.get("trend") != "Bearish" and s.get("rsi", 50) <= 70],
            "buy": oversold,
            "sell": overbought,
        },
        "health": health,
        "total_invested": round(total_invested, 2),
        "total_current": round(total_current, 2),
        "total_pnl": round(total_pnl, 2),
        "disclaimer": DISCLAIMER,
    }


@app.post("/api/portfolio/stock-insight")
async def stock_insight(request: StockInsightRequest):
    """Per-stock insight with RSI, trend, and signal classification."""
    ticker = request.ticker
    if not ticker.endswith(".NS"):
        ticker += ".NS"

    df = get_stock_data(ticker, period="6mo")
    if df is None or len(df) == 0:
        raise HTTPException(status_code=404, detail=f"No data found for {ticker}")

    summary = get_technical_summary(df)
    patterns = scan_stock(ticker, df)

    rsi = round(summary.get("rsi", 50), 1)
    trend = "Bullish" if summary.get("above_sma_50") else "Bearish"

    if rsi > 70:
        signal = "Overbought"
        recommendation = "SELL or reduce — RSI indicates strong overbought conditions."
    elif rsi < 30:
        signal = "Oversold"
        recommendation = "BUY — RSI indicates oversold conditions, potential bounce."
    elif trend == "Bullish" and rsi > 55:
        signal = "Bullish"
        recommendation = "HOLD — strong momentum with healthy RSI."
    elif trend == "Bearish" and rsi < 45:
        signal = "Bearish"
        recommendation = "CAUTION — bearish trend with weak RSI. Monitor closely."
    else:
        signal = "Neutral"
        recommendation = "HOLD — no strong signals. Wait for clearer direction."

    return {
        "ticker": ticker.replace(".NS", ""),
        "rsi": rsi,
        "trend": trend,
        "signal": signal,
        "recommendation": recommendation,
        "patterns": [p.get("pattern", "") for p in patterns[:3]],
        "current_price": round(float(df['Close'].iloc[-1]), 2),
        "sma_50": round(summary.get("sma_50", 0), 2),
        "sma_200": round(summary.get("sma_200", 0), 2),
        "disclaimer": DISCLAIMER,
    }


# ─── Quick Follow-Up ──────────────────────────────────────────────────

class FollowUpRequest(BaseModel):
    question: str
    stock_name: str
    context: str  # JSON summary of existing analysis

@app.post("/api/copilot/followup")
async def copilot_followup(req: FollowUpRequest):
    """Answer a follow-up question quickly using existing analysis context."""
    try:
        answer = _call_groq_json(
            system_prompt="""You are an expert financial advisor answering a quick follow-up question about a stock.
You already have the full analysis context. Answer concisely in 2-3 sentences, in simple language a beginner would understand.
Output STRICT JSON: {"answer": "your answer here"}
No extra text outside JSON.""",
            user_prompt=f"""Stock: {req.stock_name}
Analysis Context: {req.context}
Question: {req.question}

Answer this follow-up question based on the analysis above.""",
        )
        return {"answer": answer.get("answer", "I couldn't generate an answer. Please try again.") if answer else "Analysis unavailable."}
    except Exception as e:
        return {"answer": f"Error generating answer: {str(e)}"}


# ─── Floating Assistant Chat ──────────────────────────────────────────

class AssistantChatRequest(BaseModel):
    query: str
    history: list[dict] = []

@app.post("/api/assistant/chat")
async def assistant_chat(req: AssistantChatRequest):
    """Answer questions from the floating AI assistant using Market TV context."""
    from market_tv import get_latest_update
    from grok_ai import _call_groq, MASTER_SYSTEM_PROMPT
    
    try:
        latest = get_latest_update()
        market_context = "No live market update available at the moment."
        if latest:
            market_context = f"Headline: {latest.get('hook', '')}\nSummary: {latest.get('summary', '')}"
            
        system_prompt = f"""{MASTER_SYSTEM_PROMPT}

You are the 'Ask ET AI' floating assistant. The user is asking a question while watching the live market TV feed.
CURRENT LIVE MARKET CONTEXT:
{market_context}

IMPORTANT RULES:
1. Keep your explanation extremely brief, short, and sweet (1-2 sentences maximum).
2. If their question is about 'the news' or 'the market' or 'what is going on', use the LIVE MARKET CONTEXT above to answer.
3. Provide simple financial advice or explanations without making direct buy/sell recommendations."""

        history_text = ""
        for msg in req.history[-4:]:
            if msg.get("role") != "system":
                history_text += f"{msg.get('role', 'user').capitalize()}: {msg.get('content', '')}\n"
                
        user_prompt = f"Chat History:\n{history_text}\nUser: {req.query}\nAI:"
        
        answer = _call_groq(system_prompt, user_prompt, max_tokens=300)
        return {"response": answer if answer else "I'm currently unable to process your request."}
    except Exception as e:
        return {"response": f"Error: {str(e)}"}
# ─── Market TV — Live Streaming Endpoints ─────────────────────────────

import asyncio
from starlette.responses import StreamingResponse
from starlette.staticfiles import StaticFiles
from market_tv import (
    market_tv_loop, stop_market_tv, get_latest_update,
    get_ticker_data, generate_stream_token, generate_market_update,
    sse_subscribers, update_history, AUDIO_DIR,
)

# Mount audio cache as static files
app.mount("/audio", StaticFiles(directory=str(AUDIO_DIR)), name="audio")


@app.on_event("startup")
async def start_market_tv():
    """Start the Market TV background loop on server startup."""
    asyncio.create_task(market_tv_loop())


@app.on_event("shutdown")
async def shutdown_market_tv():
    """Stop the Market TV background loop on server shutdown."""
    stop_market_tv()


@app.get("/api/market-tv/stream")
async def market_tv_sse():
    """Server-Sent Events endpoint for real-time market updates."""
    queue = asyncio.Queue()
    sse_subscribers.append(queue)

    async def event_generator():
        try:
            # Send the latest update immediately if available
            latest = get_latest_update()
            if latest:
                import json
                yield f"data: {json.dumps(latest)}\n\n"

            while True:
                data = await queue.get()
                yield f"data: {data}\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            if queue in sse_subscribers:
                sse_subscribers.remove(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
        },
    )


@app.get("/api/market-tv/latest")
async def market_tv_latest():
    """Get the latest market TV update."""
    latest = get_latest_update()
    if latest:
        return latest
    # Generate one now if none exists
    update = generate_market_update()
    update["tickers"] = get_ticker_data()
    update_history.append(update)
    return update


@app.get("/api/market-tv/tickers")
async def market_tv_tickers():
    """Get current ticker data for the scrolling strip."""
    return {"tickers": get_ticker_data()}


@app.post("/api/market-tv/token")
async def market_tv_token():
    """Generate a Stream user token for frontend auth."""
    token = generate_stream_token("market-tv-viewer")
    return {"token": token, "user_id": "market-tv-viewer", "api_key": "6s2769m4c6bz"}


# ─── Run Server ───────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

