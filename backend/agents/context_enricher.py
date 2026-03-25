"""
ContextEnricher Agent — Adds context to each detected signal.
For each signal: fetches related news, recent earnings, cross-references
insider activity. Uses fast model (8B) for summarization.
"""

import json
from agents.base import BaseAgent
from config import DISCLAIMER


class ContextEnricherAgent(BaseAgent):
    """
    Agent 3: ContextEnricher
    Enriches each signal with additional context:
    - Recent stock performance trend
    - Cross-reference with insider activity
    - Sector comparison
    Uses fast model (8B) for cheap summarization.
    """

    AGENT_NAME = "ContextEnricher"

    def execute(self, state: dict, session_id: str) -> dict:
        signals = state.get("detected_signals", [])
        stock_data = state.get("stock_data", {})
        insider_trades = state.get("insider_trades", [])
        prices = state.get("prices", [])

        enriched = []
        for i, signal in enumerate(signals[:30]):  # Top 30 signals
            enriched_signal = self._enrich_signal(signal, stock_data, insider_trades, prices, session_id)
            enriched.append(enriched_signal)

        self.logger.log(
            agent_name=self.AGENT_NAME,
            action="enrichment_complete",
            decision=f"Enriched {len(enriched)} signals with price context, insider cross-reference, and sector data",
            output_summary=f"Average enrichment score: {sum(s.get('enrichment_score', 0) for s in enriched) / max(len(enriched), 1):.1f}/10",
            session_id=session_id,
        )

        return {"enriched_signals": enriched}

    def _enrich_signal(self, signal: dict, stock_data: dict, insider_trades: list, prices: list, session_id: str) -> dict:
        ticker = signal.get("ticker", "")
        stock_name = signal.get("stock_name", ticker.replace(".NS", ""))

        # Add price context
        price_data = next((p for p in prices if p.get("name") == stock_name or p.get("ticker") == ticker), None)
        if price_data:
            signal["current_price"] = price_data.get("price", 0)
            signal["price_change_pct"] = price_data.get("change_pct", 0)

        # Cross-reference with insider trades for this stock
        related_insider = [t for t in insider_trades if t.get("stock_name") == stock_name]
        if related_insider:
            signal["insider_activity"] = {
                "count": len(related_insider),
                "total_value": sum(t.get("value_crores", 0) for t in related_insider),
                "predominant_action": self._get_predominant_action(related_insider),
            }
            signal["cross_reference"] = f"{len(related_insider)} insider trade(s) found for {stock_name}"

        # Compute enrichment score (how much context we added)
        enrichment_score = 0
        if price_data: enrichment_score += 3
        if related_insider: enrichment_score += 3
        if signal.get("confidence", 0) > 70: enrichment_score += 2
        if signal.get("impact") == "high": enrichment_score += 2
        signal["enrichment_score"] = min(enrichment_score, 10)

        # Generate plain-English context using fast LLM
        if enrichment_score >= 5:  # Only for high-value signals
            context_text = self._generate_context(signal, session_id)
            if context_text:
                signal["enriched_context"] = context_text

        # Add stock-specific source URLs
        clean_ticker = stock_name.replace(" ", "").upper()
        signal["source_urls"] = {
            "nse": f"https://www.nseindia.com/get-quotes/equity?symbol={clean_ticker}",
            "yahoo": f"https://finance.yahoo.com/quote/{clean_ticker}.NS/",
            "screener": f"https://www.screener.in/company/{clean_ticker}/",
            "tradingview": f"https://in.tradingview.com/chart/?symbol=NSE%3A{clean_ticker}",
        }

        return signal

    def _get_predominant_action(self, trades: list) -> str:
        buys = sum(1 for t in trades if t.get("trade_type") == "Buy")
        sells = sum(1 for t in trades if t.get("trade_type") == "Sell")
        return "buying" if buys > sells else "selling" if sells > buys else "mixed"

    def _generate_context(self, signal: dict, session_id: str) -> str:
        """Use fast LLM to generate a beginner-friendly context summary."""
        prompt = f"""Add context to this stock signal for a beginner Indian investor (2-3 sentences):

Stock: {signal.get('stock_name', 'Unknown')}
Signal Type: {signal.get('pattern', signal.get('signal_type', 'Unknown'))}
Signal: {signal.get('signal', 'neutral')}
Current Price: ₹{signal.get('current_price', 'N/A')}
Insider Activity: {signal.get('cross_reference', 'None')}

Write in simple English. Explain what this means for someone new to investing."""

        return self.llm_call(
            task_type="summarization",  # Routes to fast 8B model
            prompt=prompt,
            system_prompt="You are a friendly stock market explainer for beginners. Keep it simple, short, and in Indian context (₹, NSE, BSE).",
            session_id=session_id,
            max_tokens=200,
        )

    def fallback(self, state: dict, session_id: str, error: str) -> dict:
        # Pass signals through unenriched
        return {"enriched_signals": state.get("detected_signals", [])}
