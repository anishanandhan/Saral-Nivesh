"""
Scenario 3: Portfolio-Aware News Prioritisation
User holds 8 stocks. Two news events break simultaneously.
Agent ranks events by materiality to THIS specific portfolio.
"""

import json
from agents.model_router import get_router
from audit.logger import get_audit_logger
from config import DISCLAIMER


def handle_portfolio_news_scenario(
    portfolio: list = None,
    news_events: list = None,
    session_id: str = "scenario3",
) -> dict:
    """
    Handle Scenario 3: Portfolio-aware news prioritisation.
    3-step: identify material events → quantify P&L → rank by impact.
    """
    router = get_router()
    logger = get_audit_logger()

    if not portfolio:
        portfolio = [
            {"ticker": "RELIANCE.NS", "name": "Reliance Industries", "quantity": 100, "avg_price": 2400, "sector": "Oil & Gas"},
            {"ticker": "HDFCBANK.NS", "name": "HDFC Bank", "quantity": 200, "avg_price": 1550, "sector": "Banking"},
            {"ticker": "INFY.NS", "name": "Infosys", "quantity": 150, "avg_price": 1500, "sector": "IT"},
            {"ticker": "ICICIBANK.NS", "name": "ICICI Bank", "quantity": 120, "avg_price": 950, "sector": "Banking"},
            {"ticker": "TCS.NS", "name": "TCS", "quantity": 50, "avg_price": 3600, "sector": "IT"},
            {"ticker": "ITC.NS", "name": "ITC", "quantity": 300, "avg_price": 430, "sector": "FMCG"},
            {"ticker": "SBIN.NS", "name": "SBI", "quantity": 250, "avg_price": 620, "sector": "Banking"},
            {"ticker": "BHARTIARTL.NS", "name": "Bharti Airtel", "quantity": 80, "avg_price": 1100, "sector": "Telecom"},
        ]

    if not news_events:
        news_events = [
            {
                "id": "event_1",
                "headline": "RBI cuts repo rate by 25 basis points to 6.00%",
                "type": "macro",
                "category": "Monetary Policy",
                "details": "RBI MPC unanimously decided to cut repo rate by 25 bps. Stance changed to 'accommodative'. GDP growth forecast maintained at 6.5%.",
                "sectors_affected": ["Banking", "NBFC", "Real Estate", "Auto"],
                "expected_impact": "Positive for rate-sensitive sectors. Lower borrowing costs.",
                "timestamp": "2026-03-24T10:30:00",
            },
            {
                "id": "event_2",
                "headline": "TRAI proposes new tariff floor for telecom operators",
                "type": "regulatory",
                "category": "Sector Regulation",
                "details": "TRAI proposes minimum floor price for mobile data at ₹15/GB. Would increase ARPU for all operators but may impact subscriber growth.",
                "sectors_affected": ["Telecom"],
                "expected_impact": "Mixed — higher ARPU but potential subscriber churn.",
                "timestamp": "2026-03-24T11:00:00",
            },
        ]

    portfolio_total = sum(h["quantity"] * h["avg_price"] for h in portfolio)

    # ── STEP 1: Identify material events for this portfolio ──
    logger.log(
        agent_name="ScenarioHandler",
        action="step1_identify_material_events",
        data_source="News Events + Portfolio",
        input_summary=f"Portfolio: {len(portfolio)} stocks (₹{portfolio_total:,.0f} value). Events: {len(news_events)}",
        session_id=session_id,
    )

    materiality_prompt = f"""Two news events just broke. Analyze which is more material to THIS specific portfolio.

PORTFOLIO (total value: ₹{portfolio_total:,.0f}):
{json.dumps([{{"name": h["name"], "sector": h["sector"], "value": h["quantity"]*h["avg_price"]}} for h in portfolio], indent=2)}

EVENT 1: {news_events[0]["headline"]}
Details: {news_events[0]["details"]}
Sectors: {news_events[0]["sectors_affected"]}

EVENT 2: {news_events[1]["headline"]}
Details: {news_events[1]["details"]}
Sectors: {news_events[1]["sectors_affected"]}

For EACH event, respond in JSON:
{{
    "events": [
        {{
            "event_id": "event_1",
            "headline": "...",
            "stocks_affected": ["list tickers from portfolio affected"],
            "portfolio_exposure_pct": percentage of portfolio exposed,
            "estimated_impact_pct": estimated price impact on affected stocks,
            "direction": "positive/negative/mixed",
            "materiality_rank": 1 or 2,
            "reasoning": "2-3 sentences"
        }},
        ...
    ]
}}

Base rankings on: (a) what % of the portfolio is exposed, (b) magnitude of expected impact."""

    material_result = router.route(
        task_type="reasoning",
        prompt=materiality_prompt,
        system_prompt="You are a portfolio analyst specializing in Indian markets. Quantify impact with real numbers.",
        agent_name="ScenarioHandler",
        session_id=session_id,
        max_tokens=1200,
    )

    events_analysis = []
    try:
        resp = material_result["response"]
        if "```" in resp:
            resp = resp.split("```json")[-1].split("```")[0] if "```json" in resp else resp.split("```")[1]
        parsed = json.loads(resp.strip())
        events_analysis = parsed.get("events", [])
    except Exception:
        # Fallback analysis
        banking_value = sum(h["quantity"] * h["avg_price"] for h in portfolio if h["sector"] == "Banking")
        telecom_value = sum(h["quantity"] * h["avg_price"] for h in portfolio if h["sector"] == "Telecom")

        events_analysis = [
            {
                "event_id": "event_1",
                "headline": news_events[0]["headline"],
                "stocks_affected": ["HDFCBANK.NS", "ICICIBANK.NS", "SBIN.NS"],
                "portfolio_exposure_pct": round(banking_value / portfolio_total * 100, 1),
                "estimated_impact_pct": 2.5,
                "direction": "positive",
                "materiality_rank": 1,
                "reasoning": "Repo rate cut benefits all 3 banking stocks (43% of portfolio). Lower cost of funds improves NIM.",
            },
            {
                "event_id": "event_2",
                "headline": news_events[1]["headline"],
                "stocks_affected": ["BHARTIARTL.NS"],
                "portfolio_exposure_pct": round(telecom_value / portfolio_total * 100, 1),
                "estimated_impact_pct": 3.0,
                "direction": "mixed",
                "materiality_rank": 2,
                "reasoning": "Only Bharti Airtel affected (6% of portfolio). Higher ARPU positive but subscriber churn risk exists.",
            },
        ]

    logger.log(
        agent_name="ScenarioHandler",
        action="step1_materiality_ranked",
        decision=f"Event 1 ranked {'higher' if events_analysis[0].get('materiality_rank',1) == 1 else 'lower'} in materiality",
        session_id=session_id,
    )

    # ── STEP 2: Quantify P&L impact on each holding ─────────
    pnl_impacts = []
    for event in events_analysis:
        affected_tickers = event.get("stocks_affected", [])
        impact_pct = event.get("estimated_impact_pct", 0)
        direction = event.get("direction", "neutral")

        for ticker in affected_tickers:
            holding = next((h for h in portfolio if h["ticker"] == ticker), None)
            if holding:
                current_value = holding["quantity"] * holding["avg_price"]
                multiplier = 1 if direction == "positive" else -1 if direction == "negative" else 0.5
                estimated_pnl = current_value * (impact_pct / 100) * multiplier

                pnl_impacts.append({
                    "ticker": ticker,
                    "stock_name": holding["name"],
                    "event": event["headline"],
                    "current_value": current_value,
                    "estimated_impact_pct": impact_pct * multiplier,
                    "estimated_pnl": round(estimated_pnl),
                    "direction": direction,
                })

    pnl_impacts.sort(key=lambda x: abs(x["estimated_pnl"]), reverse=True)

    total_impact = sum(p["estimated_pnl"] for p in pnl_impacts)

    logger.log(
        agent_name="ScenarioHandler",
        action="step2_quantify_pnl",
        decision=f"Total portfolio impact: ₹{total_impact:+,.0f} across {len(pnl_impacts)} holdings",
        output_summary=f"Top impact: {pnl_impacts[0]['stock_name']} ₹{pnl_impacts[0]['estimated_pnl']:+,.0f}" if pnl_impacts else "No impact",
        session_id=session_id,
    )

    # ── STEP 3: Generate prioritised alert card ──────────────
    alert_prompt = f"""Generate a portfolio impact card for these events:

PORTFOLIO TOTAL: ₹{portfolio_total:,.0f}
ESTIMATED NET IMPACT: ₹{total_impact:+,.0f}

EVENTS (ranked by materiality):
{json.dumps(events_analysis, indent=2)}

P&L IMPACTS:
{json.dumps(pnl_impacts, indent=2)}

Respond in JSON:
{{
    "headline": "Portfolio impact one-liner with ₹ numbers",
    "summary": "3-4 sentence overview for a beginner",
    "priority_event": "Which event matters more and why (1-2 sentences)",
    "holdings_at_risk": ["list of ticker:impact_amount"],
    "recommended_actions": ["list 2-3 specific actions"],
    "overall_portfolio_impact_pct": number,
    "beginner_tip": "Simple tip for a new investor"
}}
{DISCLAIMER}"""

    alert_result = router.route(
        task_type="alert_generation",
        prompt=alert_prompt,
        system_prompt="You are a portfolio risk advisor. Give specific, numbered advice with ₹ amounts.",
        agent_name="ScenarioHandler",
        session_id=session_id,
    )

    alert = {}
    try:
        resp = alert_result["response"]
        if "```" in resp:
            resp = resp.split("```json")[-1].split("```")[0] if "```json" in resp else resp.split("```")[1]
        alert = json.loads(resp.strip())
    except Exception:
        alert = {
            "headline": f"Portfolio Impact: ₹{total_impact:+,.0f} from today's events",
            "summary": f"Two events impact your ₹{portfolio_total:,.0f} portfolio. The RBI rate cut has the largest effect on your banking holdings.",
            "priority_event": f"RBI rate cut affects {sum(1 for e in events_analysis if e.get('materiality_rank') == 1)} events covering the largest portfolio exposure.",
            "recommended_actions": ["Monitor banking stocks at market open", "Review telecom holding if TRAI policy is finalized"],
        }

    logger.log(
        agent_name="ScenarioHandler",
        action="step3_generate_portfolio_alert",
        decision=f"Portfolio impact: ₹{total_impact:+,.0f} ({total_impact/portfolio_total*100:+.1f}%)",
        session_id=session_id,
    )

    sources = [
        {"name": "RBI Monetary Policy", "url": "https://www.rbi.org.in/Scripts/Notifications.aspx"},
        {"name": "TRAI Notices", "url": "https://www.trai.gov.in/notifications"},
        {"name": "NSE FII/DII Data", "url": "https://www.nseindia.com/report/fii-dii-trading-activity"},
        {"name": "ET Markets", "url": "https://economictimes.indiatimes.com/markets"},
    ]

    return {
        "scenario": "portfolio_news",
        "portfolio": portfolio,
        "portfolio_total": portfolio_total,
        "news_events": news_events,
        "events_analysis": events_analysis,
        "pnl_impacts": pnl_impacts,
        "total_impact": total_impact,
        "alert": alert,
        "sources": sources,
        "pipeline_steps": 3,
        "autonomous": True,
        "disclaimer": DISCLAIMER,
    }
