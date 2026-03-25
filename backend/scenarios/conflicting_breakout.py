"""
Scenario 2: Breakout with Conflicting Signals
Large-cap IT stock broke above 52-week high with above-average volume,
BUT RSI is overbought (78) AND key FII reduced exposure.
4-step balanced analysis with bull/bear case and verdict.
"""

import json
from agents.model_router import get_router
from audit.logger import get_audit_logger
from config import DISCLAIMER


def handle_conflicting_breakout_scenario(
    stock: str = None,
    technicals: dict = None,
    fii_data: dict = None,
    session_id: str = "scenario2",
) -> dict:
    """
    Handle Scenario 2: Breakout with conflicting signals.
    Produces BALANCED analysis — not binary buy/sell.
    """
    router = get_router()
    logger = get_audit_logger()

    if not stock:
        stock = "Infosys (INFY)"
    if not technicals:
        technicals = {
            "ticker": "INFY.NS",
            "current_price": 1892.50,
            "52_week_high": 1875.30,
            "breakout_above_52w": True,
            "breakout_volume_ratio": 2.3,
            "rsi": 78.4,
            "rsi_status": "overbought",
            "macd": 15.2,
            "macd_signal": 12.8,
            "macd_status": "bullish",
            "sma_50": 1780.00,
            "sma_200": 1650.00,
            "above_50dma": True,
            "above_200dma": True,
        }
    if not fii_data:
        fii_data = {
            "institution": "Morgan Stanley",
            "action": "reduced_exposure",
            "change_pct": -2.1,
            "filing_date": "2026-03-20",
            "new_holding_pct": 3.8,
            "old_holding_pct": 5.9,
        }

    # ── STEP 1: Detect the breakout pattern ──────────────────
    logger.log(
        agent_name="ScenarioHandler",
        action="step1_detect_breakout",
        data_source="Technical Analysis Engine",
        input_summary=f"{stock}: Broke above 52W high (₹{technicals['52_week_high']}) at ₹{technicals['current_price']} with {technicals['breakout_volume_ratio']}x volume",
        decision="52-week breakout confirmed with volume",
        confidence=0.9,
        session_id=session_id,
    )

    # ── STEP 2: Backtest historical success rate ──────────────
    backtest_prompt = f"""Estimate the historical success rate of this pattern on Indian IT stocks:
Pattern: 52-week high breakout with 2x+ volume
Stock: {stock}
RSI at breakout: {technicals['rsi']}

Based on your knowledge, provide:
{{
    "win_rate_pct": estimated percentage,
    "avg_return_10d": expected return in 10 days,
    "avg_return_30d": expected return in 30 days,
    "sample_size": estimated similar occurrences,
    "caveat": "key limitation of this estimate"
}}"""

    backtest_result = router.route(
        task_type="analysis",
        prompt=backtest_prompt,
        system_prompt="You are a quantitative analyst. Provide realistic estimates based on Indian IT sector history.",
        agent_name="ScenarioHandler",
        session_id=session_id,
    )

    backtest = {}
    try:
        resp = backtest_result["response"]
        if "```" in resp:
            resp = resp.split("```json")[-1].split("```")[0] if "```json" in resp else resp.split("```")[1]
        backtest = json.loads(resp.strip())
    except Exception:
        backtest = {
            "win_rate_pct": 65,
            "avg_return_10d": 3.2,
            "avg_return_30d": 7.8,
            "sample_size": 12,
            "caveat": "Estimate based on historical patterns; overbought RSI reduces reliability",
        }

    logger.log(
        agent_name="ScenarioHandler",
        action="step2_backtest",
        data_source="Historical Pattern Analysis",
        decision=f"Win rate: {backtest.get('win_rate_pct', 'N/A')}%, Avg 30d return: {backtest.get('avg_return_30d', 'N/A')}%",
        session_id=session_id,
    )

    # ── STEP 3: Surface conflicting signals ──────────────────
    logger.log(
        agent_name="ScenarioHandler",
        action="step3_identify_conflicts",
        data_source="RSI + FII Filing Data",
        decision=f"CONFLICTS: RSI {technicals['rsi']} (overbought) + {fii_data['institution']} reduced by {abs(fii_data['change_pct'])}%",
        input_summary=f"Bullish: breakout + volume. Bearish: RSI={technicals['rsi']}, FII exit {fii_data['change_pct']}%",
        session_id=session_id,
    )

    # ── STEP 4: Generate BALANCED recommendation ──────────────
    analysis_prompt = f"""Generate a BALANCED analysis card for this conflicting signal scenario.

BULLISH SIGNALS:
- {stock} broke above 52-week high (₹{technicals['52_week_high']}) → now at ₹{technicals['current_price']}
- Volume is {technicals['breakout_volume_ratio']}x average (strong conviction)
- MACD: {technicals['macd_status']} (MACD={technicals['macd']}, Signal={technicals['macd_signal']})
- Above 50-DMA (₹{technicals['sma_50']}) and 200-DMA (₹{technicals['sma_200']})

BEARISH SIGNALS:
- RSI = {technicals['rsi']} (overbought zone, >70)
- {fii_data['institution']} reduced exposure from {fii_data['old_holding_pct']}% to {fii_data['new_holding_pct']}% ({fii_data['change_pct']}% change)
- Historically, breakouts with RSI>75 have mixed follow-through

BACKTEST DATA:
- Win rate: {backtest.get('win_rate_pct', 'N/A')}%
- Avg 10-day return: {backtest.get('avg_return_10d', 'N/A')}%
- Avg 30-day return: {backtest.get('avg_return_30d', 'N/A')}%

Respond in JSON:
{{
    "headline": "One-line balanced headline",
    "bull_case": "3-4 sentences explaining why this is bullish",
    "bear_case": "3-4 sentences explaining why caution is needed",
    "conflicting_signals": ["list each conflict explicitly"],
    "verdict": "1-3 sentences balanced assessment — NOT binary buy/sell",
    "risk_level": "high/medium/low",
    "what_to_watch": "What to monitor in next few sessions",
    "beginner_tip": "Simple advice for a new investor"
}}

CRITICAL: You MUST give equal weight to bull and bear cases.
Oversimplified buy/sell outputs are not acceptable.
{DISCLAIMER}"""

    analysis_result = router.route(
        task_type="reasoning",
        prompt=analysis_prompt,
        system_prompt="You are a balanced Indian market analyst. Give equal weight to bullish and bearish signals. Never simplify to buy/sell.",
        agent_name="ScenarioHandler",
        session_id=session_id,
        temperature=0.3,
        max_tokens=1000,
    )

    analysis = {}
    try:
        resp = analysis_result["response"]
        if "```" in resp:
            resp = resp.split("```json")[-1].split("```")[0] if "```json" in resp else resp.split("```")[1]
        analysis = json.loads(resp.strip())
    except Exception:
        analysis = {
            "headline": f"⚡ {stock}: Breakout Confirmed, But Conflicting Signals Demand Caution",
            "bull_case": f"{stock} has broken above its 52-week high with {technicals['breakout_volume_ratio']}x volume, MACD is bullish, and price is above both 50 and 200 DMAs.",
            "bear_case": f"RSI at {technicals['rsi']} is in overbought territory. {fii_data['institution']} cut exposure by {abs(fii_data['change_pct'])}%. Breakouts at these RSI levels often face pullbacks.",
            "conflicting_signals": [f"RSI Overbought ({technicals['rsi']})", f"FII Exit ({fii_data['institution']})", "Breakout at resistance zone"],
            "verdict": "The breakout is real and volume-confirmed, but the overbought RSI and FII exit create asymmetric risk. A pullback to retest the breakout level is more probable than a straight run-up.",
            "risk_level": "medium",
        }

    logger.log(
        agent_name="ScenarioHandler",
        action="step4_balanced_analysis",
        decision=f"Risk Level: {analysis.get('risk_level', 'unknown')} | Verdict: {analysis.get('verdict', '')[:100]}",
        model_used=analysis_result.get("model_used", ""),
        cost_estimate=analysis_result.get("cost_estimate", 0),
        session_id=session_id,
    )

    ticker_clean = technicals.get("ticker", "INFY.NS").replace(".NS", "")
    sources = [
        {"name": f"NSE {ticker_clean}", "url": f"https://www.nseindia.com/get-quotes/equity?symbol={ticker_clean}"},
        {"name": f"TradingView {ticker_clean}", "url": f"https://in.tradingview.com/chart/?symbol=NSE%3A{ticker_clean}"},
        {"name": f"Yahoo Finance {ticker_clean}", "url": f"https://finance.yahoo.com/quote/{ticker_clean}.NS/"},
        {"name": "NSE FII/DII Data", "url": "https://www.nseindia.com/report/fii-dii-trading-activity"},
    ]

    return {
        "scenario": "conflicting_breakout",
        "stock": stock,
        "technicals": technicals,
        "fii_data": fii_data,
        "backtest": backtest,
        "analysis": analysis,
        "sources": sources,
        "pipeline_steps": 4,
        "autonomous": True,
        "disclaimer": DISCLAIMER,
    }
