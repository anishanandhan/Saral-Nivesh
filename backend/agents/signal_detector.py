"""
SignalDetector Agent — Technical pattern detection engine.
Uses pattern_engine for RSI, MACD, breakouts, crossovers.
Uses Groq 8B (fast model) for quick signal classification.
Outputs detected_signals list to ContextEnricher.
"""

import json
from agents.base import BaseAgent
from pattern_engine import scan_stock, scan_all_stocks, get_technical_summary
from backtester import backtest_pattern, get_backtest_summary
from config import DISCLAIMER


class SignalDetectorAgent(BaseAgent):
    """
    Agent 2: SignalDetector
    Detects technical patterns and classifies signals.
    Uses fast model (8B) for classification — cheap and instant.
    """

    AGENT_NAME = "SignalDetector"

    def execute(self, state: dict, session_id: str) -> dict:
        stock_data = state.get("stock_data", {})
        filing_signals = state.get("filing_signals", [])
        unusual_insider = state.get("unusual_insider", [])

        # Step 1: Run technical pattern detection across all stocks
        self.logger.log(
            agent_name=self.AGENT_NAME,
            action="scan_technical_patterns",
            data_source="pandas-ta / pattern_engine",
            input_summary=f"Scanning {len(stock_data)} stocks for RSI, MACD, breakouts, crossovers",
            session_id=session_id,
        )
        tech_signals = scan_all_stocks(stock_data)

        # Step 2: Classify each filing signal using fast LLM
        classified_filings = []
        for signal in filing_signals[:20]:  # Limit to top 20 to save API calls
            classified = self._classify_signal(signal, session_id)
            classified_filings.append(classified)

        # Step 3: Merge all signals
        all_signals = []

        # Technical signals
        for sig in tech_signals:
            sig["source_agent"] = self.AGENT_NAME
            sig["signal_category"] = "technical"
            all_signals.append(sig)

        # Filing signals (classified)
        for sig in classified_filings:
            sig["source_agent"] = self.AGENT_NAME
            sig["signal_category"] = "fundamental"
            all_signals.append(sig)

        # Unusual insider activity (high priority)
        for sig in unusual_insider:
            sig["source_agent"] = self.AGENT_NAME
            sig["signal_category"] = "anomaly"
            sig["priority"] = "high"
            all_signals.append(sig)

        # Sort by confidence
        all_signals.sort(key=lambda x: x.get("confidence", 0), reverse=True)

        self.logger.log(
            agent_name=self.AGENT_NAME,
            action="signals_detected",
            decision=f"Detected {len(tech_signals)} technical + {len(classified_filings)} fundamental + {len(unusual_insider)} anomaly signals",
            output_summary=f"Top signal: {all_signals[0].get('pattern', all_signals[0].get('signal_type', 'N/A'))} on {all_signals[0].get('stock_name', 'N/A')}" if all_signals else "No signals",
            confidence=0.85,
            session_id=session_id,
        )

        return {
            "detected_signals": all_signals,
            "technical_count": len(tech_signals),
            "fundamental_count": len(classified_filings),
            "anomaly_count": len(unusual_insider),
        }

    def _classify_signal(self, signal: dict, session_id: str) -> dict:
        """Use fast LLM (8B) to classify a filing signal's impact."""
        signal_type = signal.get("signal_type", "unknown")
        stock = signal.get("stock_name", "Unknown")
        summary = signal.get("ai_summary", signal.get("description", ""))

        prompt = f"""Classify this Indian stock market signal briefly:
Stock: {stock}
Type: {signal_type}
Details: {summary}

Respond in exactly this JSON format:
{{"impact": "high/medium/low", "urgency": "immediate/monitor/routine", "sentiment_score": 0.0 to 1.0}}"""

        response = self.llm_call(
            task_type="classification",  # Routes to fast 8B model
            prompt=prompt,
            system_prompt="You are a stock signal classifier. Return only valid JSON.",
            session_id=session_id,
            max_tokens=100,
        )

        # Parse classification
        try:
            if "```" in response:
                response = response.split("```")[1].replace("json", "").strip()
            classification = json.loads(response)
            signal["impact"] = classification.get("impact", "medium")
            signal["urgency"] = classification.get("urgency", "monitor")
            signal["sentiment_score"] = classification.get("sentiment_score", 0.5)
        except (json.JSONDecodeError, Exception):
            signal["impact"] = "medium"
            signal["urgency"] = "monitor"
            signal["sentiment_score"] = 0.5

        return signal

    def fallback(self, state: dict, session_id: str, error: str) -> dict:
        """If pattern detection fails, return filing signals unclassified."""
        return {
            "detected_signals": state.get("filing_signals", []) + state.get("unusual_insider", []),
            "technical_count": 0,
            "fundamental_count": len(state.get("filing_signals", [])),
            "anomaly_count": len(state.get("unusual_insider", [])),
        }
