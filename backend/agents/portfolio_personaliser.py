"""
PortfolioPersonaliser Agent — Portfolio-aware filtering & P&L impact.
Filters alerts to only portfolio-relevant signals.
Quantifies estimated P&L impact on specific holdings.
Powers the 'Ask ET' chat interface.
Uses Groq 70B (reasoning model) for complex portfolio analysis.
"""

import json
from agents.base import BaseAgent
from config import DISCLAIMER


class PortfolioPersonaliserAgent(BaseAgent):
    """
    Agent 5: PortfolioPersonaliser
    - Filters alerts by user's portfolio
    - Quantifies P&L impact
    - Ranks by materiality
    - Handles Ask ET chat queries
    """

    AGENT_NAME = "PortfolioPersonaliser"

    def execute(self, state: dict, session_id: str) -> dict:
        alerts = state.get("alert_cards", [])
        portfolio = state.get("portfolio", [])
        query = state.get("user_query", "")

        # If there's a chat query, handle it
        if query:
            return self._handle_chat(query, alerts, portfolio, state, session_id)

        # Otherwise, filter and personalize alerts
        if portfolio:
            return self._personalize_alerts(alerts, portfolio, session_id)

        # No portfolio — return all alerts with general context
        return {"personalized_alerts": alerts, "portfolio_mode": False}

    def _personalize_alerts(self, alerts: list, portfolio: list, session_id: str) -> dict:
        """Filter alerts to portfolio-relevant signals and add P&L impact."""
        portfolio_tickers = set()
        portfolio_map = {}
        for holding in portfolio:
            ticker = holding.get("ticker", "").replace(".NS", "").upper()
            portfolio_tickers.add(ticker)
            portfolio_map[ticker] = holding

        self.logger.log(
            agent_name=self.AGENT_NAME,
            action="filter_by_portfolio",
            input_summary=f"Portfolio: {', '.join(portfolio_tickers)} ({len(portfolio_tickers)} stocks)",
            decision=f"Filtering {len(alerts)} alerts for portfolio relevance",
            session_id=session_id,
        )

        relevant = []
        for alert in alerts:
            stock = alert.get("stock", "").replace(" ", "").upper()
            ticker = alert.get("ticker", "").replace(".NS", "").upper()

            if stock in portfolio_tickers or ticker in portfolio_tickers:
                # Add portfolio-specific context
                holding = portfolio_map.get(stock) or portfolio_map.get(ticker, {})
                qty = holding.get("quantity", 0)
                avg_price = holding.get("avg_price", 0)
                current = alert.get("current_price", 0)

                if qty and avg_price and current:
                    pnl = (current - avg_price) * qty
                    pnl_pct = ((current - avg_price) / avg_price) * 100 if avg_price else 0
                    alert["portfolio_impact"] = {
                        "quantity": qty,
                        "avg_buy_price": avg_price,
                        "current_value": round(current * qty, 2),
                        "unrealized_pnl": round(pnl, 2),
                        "pnl_percentage": round(pnl_pct, 2),
                        "materiality": "high" if abs(pnl) > 10000 else "medium" if abs(pnl) > 1000 else "low",
                    }

                alert["portfolio_relevant"] = True
                relevant.append(alert)

        # Sort by materiality
        relevant.sort(
            key=lambda x: abs(x.get("portfolio_impact", {}).get("unrealized_pnl", 0)),
            reverse=True,
        )

        self.logger.log(
            agent_name=self.AGENT_NAME,
            action="personalization_complete",
            decision=f"{len(relevant)} alerts relevant to portfolio out of {len(alerts)} total",
            output_summary=f"Top impact: {relevant[0].get('stock', 'N/A')} (₹{relevant[0].get('portfolio_impact', {}).get('unrealized_pnl', 0):,.0f})" if relevant else "No relevant alerts",
            session_id=session_id,
        )

        return {
            "personalized_alerts": relevant,
            "all_alerts": alerts,
            "portfolio_mode": True,
            "portfolio_size": len(portfolio_tickers),
        }

    def _handle_chat(self, query: str, alerts: list, portfolio: list, state: dict, session_id: str) -> dict:
        """Handle Ask ET chat query with portfolio context."""
        # Build context from live data
        stock_data_ctx = state.get("stock_data_context", {})
        prices = state.get("prices", [])

        portfolio_text = ""
        if portfolio:
            portfolio_text = f"\nUser's Portfolio: {json.dumps(portfolio, default=str)}"

        alerts_summary = ""
        if alerts:
            top3 = alerts[:3]
            alerts_summary = "\nActive alerts:\n" + "\n".join([
                f"- {a.get('stock', '?')}: {a.get('signal_type', '?')} ({a.get('signal', '?')}, {a.get('confidence', 0)}%)"
                for a in top3
            ])

        stock_context = ""
        if stock_data_ctx:
            stock_context = "\nLive Stock Data:\n" + json.dumps(stock_data_ctx, indent=2, default=str)

        prompt = f"""User question: {query}
{portfolio_text}
{alerts_summary}
{stock_context}

Provide a helpful, data-driven answer. Cite specific stock-specific URLs.
Include real numbers from the data above.
At the end, list sources as: 📎 **Sources** with markdown links.
{DISCLAIMER}"""

        response = self.llm_call(
            task_type="chat",  # Routes to 70B reasoning model
            prompt=prompt,
            system_prompt="""You are "Ask ET" — an AI Indian stock market assistant.
Rules:
- Use ₹ for prices
- Cite real NSE/BSE URLs for each stock mentioned
- Always give balanced analysis (bull + bear case)
- Never give direct buy/sell advice
- Include the disclaimer at the end""",
            session_id=session_id,
            max_tokens=1500,
            temperature=0.4,
        )

        # Extract source links from response
        import re
        links = re.findall(r'\[([^\]]+)\]\((https?://[^\)]+)\)', response)
        sources = [{"name": n.strip(), "url": u.strip()} for n, u in links]

        if not sources:
            sources = [
                {"name": "NSE India", "url": "https://www.nseindia.com"},
                {"name": "Yahoo Finance", "url": "https://finance.yahoo.com"},
            ]

        return {
            "chat_response": {
                "response": response,
                "sources": sources,
                "ai_powered": bool(response),
                "disclaimer": DISCLAIMER,
            }
        }

    def fallback(self, state: dict, session_id: str, error: str) -> dict:
        return {
            "personalized_alerts": state.get("alert_cards", []),
            "portfolio_mode": False,
        }
