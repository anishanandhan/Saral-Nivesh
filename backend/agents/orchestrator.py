"""
Orchestrator — Wires all 5 agents into a sequential pipeline.
DataHarvester → SignalDetector → ContextEnricher → AlertComposer → PortfolioPersonaliser

Implements:
- Sequential pipeline execution with state passing
- Session tracking (each run gets a unique session_id)
- Checkpointing (if a step fails, later steps still get partial data)
- Full audit trail logged at every step
"""

import uuid
import time
from typing import Optional
from audit.logger import get_audit_logger
from agents.data_harvester import DataHarvesterAgent
from agents.signal_detector import SignalDetectorAgent
from agents.context_enricher import ContextEnricherAgent
from agents.alert_composer import AlertComposerAgent
from agents.portfolio_personaliser import PortfolioPersonaliserAgent
from config import DEMO_TICKERS


# Agent pipeline definition
PIPELINE = [
    ("DataHarvester", DataHarvesterAgent),
    ("SignalDetector", SignalDetectorAgent),
    ("ContextEnricher", ContextEnricherAgent),
    ("AlertComposer", AlertComposerAgent),
    ("PortfolioPersonaliser", PortfolioPersonaliserAgent),
]


def run_pipeline(
    tickers: list[str] = None,
    portfolio: list[dict] = None,
    user_query: str = "",
    lookback_days: int = 7,
    session_id: str = "",
) -> dict:
    """
    Run the full 5-agent pipeline.
    
    Args:
        tickers: List of NSE tickers to scan (default: DEMO_TICKERS)
        portfolio: User's portfolio [{ticker, quantity, avg_price}, ...]
        user_query: Optional Ask ET query
        lookback_days: Days to look back for filings
        session_id: Unique ID for this pipeline run
    
    Returns:
        Final state dict with all pipeline outputs
    """
    logger = get_audit_logger()

    if not session_id:
        session_id = str(uuid.uuid4())[:8]

    if not tickers:
        tickers = DEMO_TICKERS

    # Initial state
    state = {
        "session_id": session_id,
        "tickers": tickers,
        "portfolio": portfolio or [],
        "user_query": user_query,
        "lookback_days": lookback_days,
        "pipeline_start": time.time(),
    }

    logger.log(
        agent_name="Orchestrator",
        action="pipeline_start",
        input_summary=f"Running 5-agent pipeline: {len(tickers)} tickers, query='{user_query[:50]}', portfolio={len(portfolio or [])} stocks",
        session_id=session_id,
    )

    # Execute pipeline sequentially
    pipeline_log = []
    for agent_name, AgentClass in PIPELINE:
        step_start = time.time()

        agent = AgentClass()
        state = agent.run(state, session_id=session_id)

        step_duration = (time.time() - step_start) * 1000
        pipeline_log.append({
            "agent": agent_name,
            "duration_ms": round(step_duration, 1),
            "status": "success" if state.get("last_agent", "").endswith("(fallback)") is False else "fallback",
        })

    total_duration = (time.time() - state["pipeline_start"]) * 1000

    # Log pipeline completion
    logger.log(
        agent_name="Orchestrator",
        action="pipeline_complete",
        decision=f"5-agent pipeline completed in {total_duration:.0f}ms",
        output_summary=f"Generated {state.get('alert_count', 0)} alert cards",
        duration_ms=total_duration,
        session_id=session_id,
    )

    # Add pipeline metadata to state
    state["pipeline_log"] = pipeline_log
    state["pipeline_duration_ms"] = round(total_duration, 1)
    state["session_id"] = session_id

    return state


def run_chat_pipeline(
    query: str,
    portfolio: list[dict] = None,
    stock_data_context: dict = None,
) -> dict:
    """
    Lightweight pipeline for Ask ET chat — skips full signal scan.
    Uses PortfolioPersonaliser directly with pre-built context.
    """
    session_id = str(uuid.uuid4())[:8]
    logger = get_audit_logger()

    logger.log(
        agent_name="Orchestrator",
        action="chat_pipeline_start",
        input_summary=f"Chat query: '{query[:100]}'",
        session_id=session_id,
    )

    state = {
        "session_id": session_id,
        "user_query": query,
        "portfolio": portfolio or [],
        "alert_cards": [],
        "stock_data_context": stock_data_context or {},
        "prices": [],
    }

    # Run only the personaliser agent for chat
    agent = PortfolioPersonaliserAgent()
    state = agent.run(state, session_id=session_id)

    return state.get("chat_response", {
        "response": "I couldn't process your query. Please try again.",
        "sources": [],
        "ai_powered": False,
        "disclaimer": "Not financial advice.",
    })
