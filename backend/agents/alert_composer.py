"""
AlertComposer Agent — Generates structured alert cards.
Takes enriched signals → produces final alert cards with:
bull_case, bear_case, conflicting_signals, recommended_action.
Uses Groq 70B (reasoning model) for complex analysis.
"""

import json
from agents.base import BaseAgent
from config import DISCLAIMER


class AlertComposerAgent(BaseAgent):
    """
    Agent 4: AlertComposer
    Generates final structured alert cards with AI-powered analysis.
    Uses reasoning model (70B) — this is where the complex thinking happens.
    """

    AGENT_NAME = "AlertComposer"

    def execute(self, state: dict, session_id: str) -> dict:
        signals = state.get("enriched_signals", [])

        # Only compose alerts for top-priority signals
        top_signals = [s for s in signals if s.get("confidence", 0) >= 50][:15]

        self.logger.log(
            agent_name=self.AGENT_NAME,
            action="compose_alerts",
            input_summary=f"Composing {len(top_signals)} alert cards from {len(signals)} enriched signals",
            data_source="ContextEnricher output",
            session_id=session_id,
        )

        alerts = []
        for signal in top_signals:
            alert = self._compose_alert(signal, session_id)
            alerts.append(alert)

        self.logger.log(
            agent_name=self.AGENT_NAME,
            action="alerts_composed",
            decision=f"Generated {len(alerts)} structured alert cards",
            output_summary=f"Highest confidence: {max((a.get('confidence', 0) for a in alerts), default=0)}%",
            session_id=session_id,
        )

        return {"alert_cards": alerts, "alert_count": len(alerts)}

    def _compose_alert(self, signal: dict, session_id: str) -> dict:
        stock = signal.get("stock_name", signal.get("ticker", "Unknown"))
        signal_type = signal.get("pattern", signal.get("signal_type", "Unknown"))
        signal_dir = signal.get("signal", "neutral")
        confidence = signal.get("confidence", 60)
        enriched_ctx = signal.get("enriched_context", signal.get("ai_summary", ""))
        insider_info = signal.get("insider_activity", {})
        cross_ref = signal.get("cross_reference", "")

        prompt = f"""Generate a structured alert card for this Indian stock signal.

SIGNAL DATA:
- Stock: {stock}
- Signal Type: {signal_type}
- Direction: {signal_dir}
- Confidence: {confidence}%
- Context: {enriched_ctx}
- Current Price: ₹{signal.get('current_price', 'N/A')}
- Insider Activity: {json.dumps(insider_info) if insider_info else 'None'}
- Cross Reference: {cross_ref}

RESPOND IN THIS EXACT JSON FORMAT:
{{
    "plain_english": "2-3 sentence explanation a beginner can understand",
    "bull_case": "Why this could be positive (1-2 sentences)",
    "bear_case": "Why this could be negative (1-2 sentences)",
    "conflicting_signals": ["list any conflicting indicators"],
    "what_to_watch": "What the investor should monitor next",
    "risk_level": "low/medium/high",
    "beginner_tip": "One simple tip for a new investor about this signal"
}}

Be balanced. Never give direct buy/sell advice. Use ₹ for prices.
{DISCLAIMER}"""

        response = self.llm_call(
            task_type="alert_generation",  # Routes to 70B reasoning model
            prompt=prompt,
            system_prompt="You are an expert Indian market analyst generating balanced, SEBI-compliant alert cards. Always include both bull and bear cases. Never recommend buy/sell directly.",
            session_id=session_id,
            max_tokens=600,
            temperature=0.4,
        )

        # Parse the AI response
        alert = {
            "stock": stock,
            "ticker": signal.get("ticker", f"{stock}.NS"),
            "signal_type": signal_type,
            "signal": signal_dir,
            "confidence": confidence,
            "current_price": signal.get("current_price"),
            "source_urls": signal.get("source_urls", {}),
            "source_agent": self.AGENT_NAME,
            "disclaimer": DISCLAIMER,
        }

        try:
            if "```" in response:
                response = response.split("```json")[-1].split("```")[0] if "```json" in response else response.split("```")[1].split("```")[0]
            ai_data = json.loads(response.strip())
            alert.update(ai_data)
        except (json.JSONDecodeError, Exception):
            alert["plain_english"] = enriched_ctx or f"{signal_type} detected on {stock}."
            alert["bull_case"] = f"This {signal_dir} signal has {confidence}% confidence."
            alert["bear_case"] = "Market conditions can change rapidly. Always verify with multiple sources."
            alert["conflicting_signals"] = []
            alert["what_to_watch"] = "Monitor price action and volume over the next few sessions."
            alert["risk_level"] = "medium"
            alert["beginner_tip"] = "Don't act on a single signal. Look at the bigger picture."

        return alert

    def fallback(self, state: dict, session_id: str, error: str) -> dict:
        """If AI fails, create basic alert cards from raw signal data."""
        signals = state.get("enriched_signals", state.get("detected_signals", []))
        basic_alerts = []
        for sig in signals[:15]:
            basic_alerts.append({
                "stock": sig.get("stock_name", "Unknown"),
                "ticker": sig.get("ticker", ""),
                "signal_type": sig.get("pattern", sig.get("signal_type", "Unknown")),
                "signal": sig.get("signal", "neutral"),
                "confidence": sig.get("confidence", 50),
                "plain_english": sig.get("ai_summary", sig.get("description", "Signal detected")),
                "bull_case": "Potential opportunity detected.",
                "bear_case": "Further research recommended.",
                "conflicting_signals": [],
                "risk_level": "medium",
                "beginner_tip": "Always do your own research before investing.",
                "source_agent": f"{self.AGENT_NAME} (fallback)",
                "disclaimer": DISCLAIMER,
            })
        return {"alert_cards": basic_alerts, "alert_count": len(basic_alerts)}
