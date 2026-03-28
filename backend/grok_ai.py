"""
Groq API Integration Module — Hackathon Edition
Uses Groq's fast LLM inference API (Llama 3.3 70B) with structured prompts:
1. Master System Prompt
2. Stock Explanation Prompt
3. Signal Detection Prompt
4. Portfolio Analysis Prompt
5. News Prioritization Prompt
6. Beginner Mode Prompt
7. Multi-Agent Flow (Scout → Quant → Translator)

Falls back to template-based explanations if the API is unavailable.
"""

import json
import re
from typing import Optional
from openai import OpenAI

from config import GROQ_API_KEY, GROQ_BASE_URL, GROQ_MODEL, DISCLAIMER


# ─── Beginner Glossary ──────────────────────────────────────────────
BEGINNER_GLOSSARY = {
    "RSI": "RSI (Relative Strength Index) — Think of it like a 'temperature' for a stock. Below 30 = 'cold' (oversold, might bounce up). Above 70 = 'hot' (overbought, might cool down). Between 30-70 = normal.",
    "MACD": "MACD (Moving Average Convergence Divergence) — Imagine two runners. When the fast runner overtakes the slow one, it's a 'bullish signal' (stock might go up). When the slow one overtakes the fast one, it's a 'bearish signal' (stock might go down).",
    "DMA": "DMA (Day Moving Average) — Like a smoothed-out average of the stock price over X days. 50-DMA = 50-day average, 200-DMA = 200-day average. If the price is above its DMA, the trend is generally UP.",
    "Golden Cross": "Golden Cross — When the 50-day average line crosses ABOVE the 200-day average line. It's like a green traffic light suggesting the long-term trend is turning positive.",
    "Death Cross": "Death Cross — The opposite of Golden Cross. The 50-day average drops BELOW the 200-day average. It's like a red traffic signal for the stock's long-term trend.",
    "FII": "FII (Foreign Institutional Investors) — Big international investment firms that invest in Indian markets. When FIIs buy, it's generally positive. When they sell heavily, it can put downward pressure on stocks.",
    "DII": "DII (Domestic Institutional Investors) — Indian mutual funds, insurance companies etc. They often buy when FIIs sell, acting as a 'safety net' for the market.",
    "Bulk Deal": "Bulk Deal — When someone buys or sells more than 0.5% of a company's total shares in a single day. It's like a 'big move' that other investors watch closely because it signals strong conviction.",
    "Support Level": "Support Level — A price floor where a stock tends to stop falling and bounce back up, like a trampoline. If it breaks below support, it could fall further.",
    "Resistance Level": "Resistance Level — A price ceiling where a stock tends to stop rising, like hitting a glass roof. If it breaks above resistance, it could rise sharply.",
    "Breakout": "Breakout — When a stock price moves above a key resistance level on high volume. Think of it like a dam breaking — once the barrier is crossed, the move can accelerate.",
    "Overbought": "Overbought — When a stock has risen too much, too fast. Like a rubber band stretched too far — it often snaps back. RSI above 70 indicates overbought.",
    "Oversold": "Oversold — When a stock has fallen too much, too fast. Like a spring compressed — it often bounces back. RSI below 30 indicates oversold.",
    "Volume": "Volume — The number of shares traded in a day. High volume = strong conviction behind the move. Low volume = weak, unreliable move.",
}


# ─── Master System Prompt ────────────────────────────────────────────
MASTER_SYSTEM_PROMPT = f"""You are an expert Indian stock market analyst and educator.

Your goals:
1. Help beginner investors understand stocks in simple language.
2. Provide balanced, data-driven insights (never one-sided).
3. Always explain reasoning clearly.
4. Avoid jargon unless explained.
5. Do NOT give absolute buy/sell advice — give risk-aware suggestions.

Style:
- Use simple English
- Use bullet points
- Be concise but insightful
- Always include: Reason, Risk, Final suggestion

Context:
You are analyzing Indian stock market data (NSE/BSE).
Use ₹ for all Indian stock prices.

CRITICAL — ANTI-GENERIC RULES:
Avoid generic statements like:
- "Market is volatile"
- "Stock may go up or down"
- "Past performance doesn't guarantee future results"
- "Do your own research"
Instead:
- Use the SPECIFIC data provided (exact RSI values, MACD numbers, price levels)
- Give specific reasoning tied to the actual numbers
- Be precise and insightful — reference the exact indicators
- Always cite the actual stock name and actual values

{DISCLAIMER}"""


# ─── Groq Client ─────────────────────────────────────────────────────
def get_groq_client() -> Optional[OpenAI]:
    """Initialize Groq API client via OpenAI SDK (compatible)."""
    if not GROQ_API_KEY or GROQ_API_KEY == "your_groq_api_key_here":
        return None
    return OpenAI(api_key=GROQ_API_KEY, base_url=GROQ_BASE_URL)


def _call_groq(system_prompt: str, user_prompt: str, max_tokens: int = 1200) -> Optional[str]:
    """Call Groq API with the given prompts. Returns None on failure."""
    client = get_groq_client()
    if client is None:
        return None
    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.4,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"[GroqAI] API error: {e}")
        return None


def _call_groq_json(system_prompt: str, user_prompt: str) -> Optional[dict]:
    """Call Groq API in JSON mode. Returns parsed dict or None."""
    client = get_groq_client()
    if client is None:
        return None
    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt + "\n\nIMPORTANT: Output ONLY valid JSON. No extra text."},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=1500,
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content.strip()
        return json.loads(content)
    except json.JSONDecodeError as e:
        print(f"[GroqAI] JSON decode error: {e}")
        return None
    except Exception as e:
        print(f"[GroqAI] API error in JSON mode: {e}")
        return None


def _add_glossary_to_response(text: str) -> str:
    """Append relevant glossary terms found in the response."""
    # Disabled by user request: Do not append raw markdown glossary lists
    return text


# ─── PROMPT 2: Stock Explanation ─────────────────────────────────────
def generate_stock_explanation(stock_name: str, trend: str, rsi: float,
                                news: str, price: float = 0) -> str:
    """Generate a beginner-friendly stock explanation using Groq."""
    user_prompt = f"""Explain this stock in a way a beginner can understand.

Stock: {stock_name}
Current Price: ₹{price}
Price Trend: {trend}
RSI: {rsi}
Recent News: {news}

Output format:

📊 What's happening:
- (Explain trend in simple terms)

🧠 Why it's happening:
- (Link news + data)

⚠️ Risks:
- (Mention overbought, volatility, etc.)

💡 Simple Advice:
- (NOT buy/sell — guide like a mentor)

Use analogies if possible. Avoid technical jargon."""

    result = _call_groq(MASTER_SYSTEM_PROMPT, user_prompt)
    if result:
        return _add_glossary_to_response(result)

    # Fallback
    return f"""📊 What's happening:
- {stock_name} is currently trading at ₹{price} with a {trend} trend.
- RSI is at {rsi} {'(overbought zone — stock may be due for a pullback)' if rsi > 70 else '(oversold zone — stock may bounce back)' if rsi < 30 else '(healthy range)'}.

🧠 Why it's happening:
- {news if news else 'No major recent news.'}

⚠️ Risks:
- {'RSI above 70 suggests the stock is overbought.' if rsi > 70 else 'Market volatility can cause sudden price moves.'}
- Always consider your risk tolerance before acting.

💡 Simple Advice:
- {'Wait for a pullback before considering entry.' if rsi > 70 else 'This could be a good level to watch for entry.' if rsi < 30 else 'Monitor the trend and wait for clearer signals.'}

{DISCLAIMER}"""


# ─── PROMPT 3: Signal Detection ──────────────────────────────────────
def generate_signal_analysis(stock_name: str, breakout: bool, rsi: float,
                              volume: str, fii_dii: str, news: str) -> str:
    """Generate balanced signal detection analysis using Groq."""
    user_prompt = f"""Analyze the following stock signals and generate a balanced investment insight.

Stock: {stock_name}
Signals:
- Breakout: {"Yes" if breakout else "No"}
- RSI: {rsi}
- Volume: {volume}
- FII/DII Activity: {fii_dii}
- News: {news}

Your task:
1. Identify the main bullish signal
2. Identify conflicting signals
3. Give a balanced conclusion

Output format:

🚨 Key Signal:
- (What major event happened)

📈 Bullish Factors:
-

⚠️ Bearish / Conflicting Factors:
-

📊 Historical Insight:
- (If this pattern usually works or fails — even generic is fine)

💡 Final Insight:
- (Balanced, not extreme)

⚠️ Do NOT give direct buy/sell."""

    result = _call_groq(MASTER_SYSTEM_PROMPT, user_prompt)
    if result:
        return _add_glossary_to_response(result)

    # Fallback
    return f"""🚨 Key Signal:
- {stock_name} {'shows a breakout pattern' if breakout else 'is consolidating'} with RSI at {rsi}.

📈 Bullish Factors:
- {'Breakout confirmed on ' + volume + ' volume' if breakout else 'Price holding above key support levels'}
- {fii_dii if fii_dii else 'No notable FII/DII activity'}

⚠️ Bearish / Conflicting Factors:
- {'RSI is in overbought territory (>70) — pullback likely' if rsi > 70 else 'No major bearish signal detected'}
- {news if 'sell' in news.lower() else 'Market-wide volatility remains a factor'}

📊 Historical Insight:
- {'Breakouts with overbought RSI have a ~55% chance of being sustained.' if breakout and rsi > 70 else 'This pattern historically has favorable odds when accompanied by strong volume.'}

💡 Final Insight:
- {'Approach with caution despite the breakout — wait for RSI to cool down before entering.' if rsi > 70 else 'The setup looks promising but always manage your risk with stop-losses.'}

{DISCLAIMER}"""


# ─── PROMPT 4: Portfolio Analysis ────────────────────────────────────
def generate_portfolio_analysis(portfolio: list[dict], market_context: str = "") -> str:
    """Generate portfolio analysis using Groq."""
    portfolio_str = "\n".join([f"- {p.get('ticker', p.get('name', '?'))}: {p.get('allocation', p.get('quantity', '?'))} shares @ ₹{p.get('avg_price', '?')}" for p in portfolio])

    user_prompt = f"""Analyze this user's portfolio and provide personalized insights.

Portfolio:
{portfolio_str}

Market Context:
{market_context if market_context else "Normal market conditions."}

Your task:
1. Identify overexposure (sector concentration)
2. Identify missing diversification
3. Suggest improvements

Output format:

📊 Portfolio Overview:
- (What stands out)

⚠️ Risks:
-

💡 Suggestions:
- (Diversification ideas)

🧠 Beginner Tip:
- (Simple explanation)"""

    result = _call_groq(MASTER_SYSTEM_PROMPT, user_prompt)
    if result:
        return _add_glossary_to_response(result)
    return "Portfolio analysis is currently unavailable. Please try again later."


# ─── PROMPT 5: News Prioritization ───────────────────────────────────
def generate_news_priority(portfolio: list[dict], news_1: str, news_2: str) -> str:
    """Determine which news impacts the portfolio more, with Groq."""
    portfolio_str = ", ".join([str(p.get("ticker", p.get("name", "?"))) for p in portfolio])
    user_prompt = f"""A user holds this portfolio:
{portfolio_str}

Two news events occurred:
1. {news_1}
2. {news_2}

Your task:
1. Identify which news impacts the portfolio more
2. Explain why
3. Estimate impact (low/medium/high)

Output format:

📰 Most Important News:
-

📊 Impact on Portfolio:
- (Which stocks affected)

📉 Estimated Impact:
- (Low/Medium/High with reason)

💡 Suggested Action:
- (General guidance, not buy/sell)"""

    result = _call_groq(MASTER_SYSTEM_PROMPT, user_prompt)
    if result:
        return _add_glossary_to_response(result)
    return "News analysis is currently unavailable."


# ─── PROMPT 6: Beginner Mode ────────────────────────────────────────
def explain_concept(concept: str) -> str:
    """Explain a stock market concept for a complete beginner."""
    # Check glossary first
    for term, explanation in BEGINNER_GLOSSARY.items():
        if term.lower() == concept.lower():
            return f"""🧠 Simple Explanation:
- {explanation}

📦 Example:
- Think of {term} like a health checkup for a stock — it tells you if the stock is in good shape or needs attention.

⚠️ Why it matters:
- Understanding {term} helps you make informed decisions instead of guessing."""

    user_prompt = f"""Explain this stock market concept for a complete beginner.

Concept: {concept}

Rules:
- Use very simple language
- Use real-life analogies
- Avoid jargon
- Keep it short

Output format:

🧠 Simple Explanation:
-

📦 Example:
- (Real life analogy)

⚠️ Why it matters:
-"""

    result = _call_groq(MASTER_SYSTEM_PROMPT, user_prompt)
    if result:
        return result
    return f"🧠 {concept}: This is a stock market concept. Visit our Learn page for a detailed explanation."


# ─── PROMPT 7: Multi-Agent Copilot (TL;DR + Confidence + Why NOT) ────
def run_copilot_with_groq(stock_name: str, trend: str, rsi: float,
                           macd: float, patterns: list, news: str,
                           portfolio_context: str = "") -> dict:
    """
    Runs the full Scout → Quant → Translator pipeline via Groq.
    Returns structured output with TL;DR, Confidence, and Why NOT.
    """
    analysis_context = f"""Stock: {stock_name}
Trend: {trend}
RSI: {rsi}
MACD: {macd}
Patterns Detected: {', '.join(patterns) if patterns else 'None'}
Recent News/Events: {news}
{f'Portfolio Context: {portfolio_context}' if portfolio_context else ''}"""

    user_prompt = f"""You are the final 'Translator' agent in a 3-agent system.

Agent 1 (Scout) gathered: {analysis_context}
Agent 2 (Quant) calculated the technical indicators above.

Your job: Analyze the stock and generate a structured, beginner-friendly output.
You MUST detect ACTIONABLE SIGNALS, not just summarize data.

You MUST output in this EXACT JSON format:
{{
    "traffic_light": "Green" or "Yellow" or "Red",
    "tldr": "One-line summary including BOTH opportunity and risk. Be specific.",
    "key_signal": "Most important actionable signal (e.g., RSI Oversold at 24.8, MACD Bullish Crossover)",
    "signal_strength": "Strong" or "Moderate" or "Weak",
    "signal_strength_reason": "One line reason for the strength rating",
    "whats_happening": "2-3 sentences on current price action in simple language",
    "why_its_happening": "2-3 sentences connecting the news/events to the data",
    "bullish_factors": "2-3 specific bullish reasons with actual data values",
    "bearish_factors": "2-3 specific bearish/conflicting reasons with actual data values",
    "conflict_detection": "Are there conflicting signals? Explain clearly in 1-2 sentences",
    "why_not": "2-3 strong reasons AGAINST investing in this stock right now",
    "confidence_score": 72,
    "confidence_reason": "One line explaining the confidence level",
    "portfolio_impact": "Low or Medium or High + one line reason",
    "historical_success_rate": "Estimated success rate of the detected pattern (e.g., 65-70%)",
    "typical_outcome": "What usually happens after this pattern (e.g., price rises 5-10% in 2 weeks)",
    "failure_case": "When does this pattern fail? One specific scenario",
    "sources": ["NSE OHLCV data (1-year)", "RSI/MACD technical indicators", "mention other relevant sources"],
    "recommendation": "A balanced, mentor-like final insight (NOT buy/sell)",
    "beginner_tip": "One simple tip using a real-life analogy",
    "video_script": "A 30-second reel-style script. Format: [Hook] one attention line | [Insight] what's happening | [Signal] key signal | [Risk] one risk | [Takeaway] final line. Keep it conversational, short sentences, beginner-friendly."
}}

CRITICAL RULES:
- Use ₹ for prices. Reference actual RSI, MACD values.
- Be SPECIFIC — avoid generic statements like 'market is volatile'
- Always balance both bullish AND bearish sides
- The 'why_not' field is MANDATORY — give real reasons against the trade
- confidence_score must be 0-100 integer
- signal_strength must be exactly "Strong", "Moderate", or "Weak"
- sources must be a JSON array of strings
- historical_success_rate should be a realistic range (60-75%, not 95%)
- video_script must be a single string with | separators between sections
- NEVER give direct buy/sell advice"""

    parsed = _call_groq_json(MASTER_SYSTEM_PROMPT, user_prompt)

    if parsed:
        # Normalize fields — Groq sometimes returns lists instead of strings
        text_fields = ["tldr", "key_signal", "whats_happening", "why_its_happening",
                       "bullish_factors", "bearish_factors", "why_not",
                       "confidence_reason", "portfolio_impact", "recommendation", "beginner_tip"]
        for key in text_fields:
            if key in parsed and isinstance(parsed[key], list):
                parsed[key] = "\n".join(str(item) for item in parsed[key])
            elif key in parsed and not isinstance(parsed[key], str):
                parsed[key] = str(parsed[key]) if parsed[key] else ""

        # Add glossary to key text fields
        glossary_fields = ["whats_happening", "why_its_happening", "bullish_factors",
                           "bearish_factors", "why_not", "recommendation"]
        for key in glossary_fields:
            if key in parsed and parsed[key] and isinstance(parsed[key], str):
                parsed[key] = _add_glossary_to_response(parsed[key])
        # Ensure confidence_score is int
        if "confidence_score" in parsed:
            try:
                parsed["confidence_score"] = int(parsed["confidence_score"])
            except (ValueError, TypeError):
                parsed["confidence_score"] = 50
        return {"ai_powered": True, **parsed}

    # Fallback (no API)
    if rsi > 70:
        light, conf = "Yellow", 45
        tldr = f"{stock_name} is overbought at RSI {rsi} — short-term pullback likely despite {trend} trend."
        why_not = f"RSI at {rsi} is in overbought territory. Entering now risks buying at a local top."
    elif rsi < 30:
        light, conf = "Green", 65
        tldr = f"{stock_name} is oversold at RSI {rsi} — potential bounce, but {trend} trend persists."
        why_not = f"The {trend} trend is still intact. Catching a falling knife can lead to further losses."
    else:
        light, conf = "Yellow", 55
        tldr = f"{stock_name} is range-bound with RSI at {rsi} and MACD at {macd}. No clear direction yet."
        why_not = "No strong signal in either direction. Entering without a clear trend is risky."

    return {
        "ai_powered": False,
        "traffic_light": light,
        "tldr": tldr,
        "key_signal": f"RSI at {rsi}, MACD at {macd}",
        "whats_happening": f"{stock_name} is showing a {trend} trend with RSI at {rsi} and MACD at {macd}.",
        "why_its_happening": news if news else "No notable recent events.",
        "bullish_factors": f"{'Patterns detected: ' + ', '.join(patterns) if patterns else 'No strong bullish patterns detected.'}",
        "bearish_factors": f"{'RSI in overbought zone at ' + str(rsi) if rsi > 70 else 'MACD negative at ' + str(macd) if macd < 0 else 'No strong bearish signal.'}",
        "why_not": why_not,
        "confidence_score": conf,
        "confidence_reason": f"{'Mixed signals' if 40 < conf < 60 else 'Moderate conviction'} based on RSI {rsi} and {trend} trend.",
        "portfolio_impact": "Medium — monitor closely for trend confirmation.",
        "recommendation": f"Watch {stock_name} for a clear breakout or breakdown before taking action. Set alerts at key levels.",
        "beginner_tip": "Think of investing like planting a tree — the best time to start was yesterday, the second best is today. But always plant in good soil (strong fundamentals).",
    }


# ─── Legacy compatibility functions ──────────────────────────────────

def generate_signal_alert(signal_data: dict) -> dict:
    """Generate an AI-powered alert card for a detected signal."""
    stock = signal_data.get("stock_name", signal_data.get("ticker", "Unknown"))
    signal = signal_data.get("signal", "neutral")
    pattern = signal_data.get("pattern", signal_data.get("signal_type", "Signal"))
    confidence = signal_data.get("confidence", 60)
    description = signal_data.get("description", signal_data.get("ai_summary", ""))

    # Try Groq
    result_text = _call_groq(
        MASTER_SYSTEM_PROMPT,
        f"""Analyze this signal and generate a concise alert for a beginner:
Stock: {stock}, Signal: {signal}, Pattern: {pattern}, Confidence: {confidence}%
Details: {description}

Output a 2-3 sentence plain English explanation, then a risk note.""",
        max_tokens=400,
    )

    action_map = {
        "bullish": "watch" if confidence < 70 else "buy_consideration",
        "bearish": "watch" if confidence < 70 else "sell_consideration",
        "neutral": "hold",
    }

    return {
        "stock": stock,
        "signal_type": pattern,
        "plain_english_explanation": result_text if result_text else (description or f"{pattern} detected on {stock}."),
        "bullish_or_bearish": signal,
        "confidence": confidence,
        "suggested_action": action_map.get(signal, "watch"),
        "risk_note": "Past patterns don't guarantee future results.",
        "disclaimer": DISCLAIMER,
        "ai_powered": result_text is not None,
    }


def generate_chat_response(
    user_query: str,
    context: dict | None = None,
    portfolio: list[dict] | None = None,
) -> dict:
    """Generate a conversational response for the Ask ET chat."""
    # Build stock context
    stock_data_context = ""
    stock_url_context = ""
    if context and context.get("stock_data"):
        for symbol, data in context["stock_data"].items():
            stock_data_context += f"""
REAL LIVE DATA for {symbol}:
- Current Price: ₹{data.get('current_price', 'N/A')}
- RSI (14): {data.get('rsi', 'N/A')}
- MACD: {data.get('macd', 'N/A')} (Signal: {data.get('macd_signal', 'N/A')})
- 50-DMA: ₹{data.get('sma_50', 'N/A')}
- 200-DMA: ₹{data.get('sma_200', 'N/A')}
- 52-Week High: ₹{data.get('52w_high', 'N/A')}
- 52-Week Low: ₹{data.get('52w_low', 'N/A')}
- Patterns: {data.get('patterns_detected', [])}
"""
            stock_url_context += f"""
URLs for {symbol}:
- NSE: {data.get('nse_url', '')}
- Yahoo Finance: {data.get('yahoo_url', '')}
- Screener.in: {data.get('screener_url', '')}
"""

    system_prompt = f"""{MASTER_SYSTEM_PROMPT}

CRITICAL — USE REAL DATA:
{stock_data_context if stock_data_context else "No specific stock data available."}

SOURCE CITATION:
{stock_url_context if stock_url_context else "Use general NSE/BSE URLs."}
At the end, include a "📎 Sources" section.

{f'User Portfolio: {json.dumps(portfolio, default=str)}' if portfolio else ''}"""

    result = _call_groq(system_prompt, user_query, max_tokens=1500)

    if result:
        result = _add_glossary_to_response(result)
        # Extract sources
        link_pattern = r'\[([^\]]+)\]\((https?://[^\)]+)\)'
        found_links = re.findall(link_pattern, result)
        sources = [{"name": n.strip(), "url": u.strip()} for n, u in found_links]
        if not sources:
            sources = [
                {"name": "NSE India", "url": "https://www.nseindia.com"},
                {"name": "Yahoo Finance", "url": "https://finance.yahoo.com"},
            ]
        return {
            "response": result,
            "sources": sources,
            "ai_powered": True,
            "disclaimer": DISCLAIMER,
        }

    # Fallback
    return {
        "response": f"I can help you with Indian stock market analysis. Try asking about a specific stock like TCS, Reliance, or ITC.\n\n{DISCLAIMER}",
        "sources": [{"name": "NSE India", "url": "https://www.nseindia.com"}],
        "ai_powered": False,
        "disclaimer": DISCLAIMER,
    }
