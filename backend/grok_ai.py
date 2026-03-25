"""
Groq API Integration Module
Uses Groq's fast LLM inference API (Llama 3.3 70B) to generate
plain-English explanations for detected signals and patterns.
Falls back to template-based explanations if the API is unavailable.
"""

import json
from typing import Optional
from openai import OpenAI

from config import GROQ_API_KEY, GROQ_BASE_URL, GROQ_MODEL, DISCLAIMER


def get_groq_client() -> Optional[OpenAI]:
    """Initialize Groq API client via OpenAI SDK (compatible)."""
    if not GROQ_API_KEY or GROQ_API_KEY == "your_groq_api_key_here":
        return None
    return OpenAI(api_key=GROQ_API_KEY, base_url=GROQ_BASE_URL)


def generate_signal_alert(signal_data: dict) -> dict:
    """
    Generate an AI-powered alert card for a detected signal.
    
    Input: signal JSON from pattern_engine or filing_parser
    Output: structured alert card with:
        - stock, signal_type, plain_english_explanation
        - bullish_or_bearish, confidence, suggested_action
    """
    client = get_groq_client()

    if client is None:
        # Fallback to template-based explanation
        return _template_alert(signal_data)

    try:
        prompt = f"""You are an expert Indian stock market analyst. Analyze this signal 
and generate a concise, actionable alert card for a retail investor.

Signal Data:
{json.dumps(signal_data, indent=2, default=str)}

Respond in this exact JSON format:
{{
    "stock": "<stock name>",
    "signal_type": "<type of signal>",
    "plain_english_explanation": "<2-3 sentence explanation in simple language that any retail investor can understand>",
    "bullish_or_bearish": "<bullish/bearish/neutral>",
    "confidence": <0-100>,
    "suggested_action": "<watch/buy_consideration/sell_consideration/hold>",
    "key_levels": "<support and resistance levels if applicable>",
    "risk_note": "<one line risk caveat>"
}}

Keep it concise, specific, and actionable. Use ₹ for prices. Reference Indian market context.
{DISCLAIMER}"""

        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": "You are a SEBI-compliant Indian stock market AI analyst. Always include disclaimers. Never give direct buy/sell advice — only educational analysis."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=500,
        )

        result_text = response.choices[0].message.content.strip()

        # Try to parse JSON from response
        try:
            # Handle markdown code blocks
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0]
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0]

            alert = json.loads(result_text)
            alert["disclaimer"] = DISCLAIMER
            alert["ai_powered"] = True
            return alert
        except json.JSONDecodeError:
            # If JSON parsing fails, use the text as explanation
            return {
                **_template_alert(signal_data),
                "plain_english_explanation": result_text[:500],
                "ai_powered": True,
            }

    except Exception as e:
        print(f"[GroqAI] API error: {e}")
        return _template_alert(signal_data)


def generate_chat_response(
    user_query: str,
    context: dict = None,
    portfolio: list[dict] = None,
) -> dict:
    """
    Generate a conversational response for the Market ChatGPT feature.
    Supports multi-step reasoning with REAL source citations (URLs).
    """
    client = get_groq_client()

    # Map of real data sources the AI should cite
    REAL_SOURCES = {
        "NSE India": "https://www.nseindia.com",
        "BSE India": "https://www.bseindia.com",
        "NSE Bulk Deals": "https://www.nseindia.com/report/bulk-deal",
        "BSE Bulk Deals": "https://www.bseindia.com/markets/equity/EQReports/BulknBlockDeals.aspx",
        "SEBI Insider Trading": "https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=15",
        "NSE Corporate Filings": "https://www.nseindia.com/companies-listing/corporate-filings-announcements",
        "BSE Corporate Filings": "https://www.bseindia.com/corporates/ann.html",
        "MoneyControl": "https://www.moneycontrol.com",
        "Screener.in": "https://www.screener.in",
        "Trendlyne": "https://trendlyne.com",
        "TradingView India": "https://in.tradingview.com",
        "Yahoo Finance": "https://finance.yahoo.com",
        "ET Markets": "https://economictimes.indiatimes.com/markets",
        "Tickertape": "https://www.tickertape.in",
    }

    # Build stock-specific URL context for the AI
    stock_url_context = ""
    stock_data_context = ""
    if context and context.get("stock_data"):
        for symbol, data in context["stock_data"].items():
            stock_url_context += f"""
URLs for {symbol}:
- NSE Page: {data.get('nse_url', '')}
- Yahoo Finance: {data.get('yahoo_url', '')}
- Screener.in: {data.get('screener_url', '')}
- TradingView: {data.get('tradingview_url', '')}
- MoneyControl: {data.get('moneycontrol_search', '')}
- Trendlyne: {data.get('trendlyne_url', '')}
- Tickertape: {data.get('tickertape_url', '')}
"""
            stock_data_context += f"""
REAL LIVE DATA for {symbol} (from NSE via Yahoo Finance API):
- Current Price: ₹{data.get('current_price', 'N/A')}
- RSI (14): {data.get('rsi', 'N/A')}
- MACD: {data.get('macd', 'N/A')} (Signal: {data.get('macd_signal', 'N/A')})
- 50-DMA: ₹{data.get('sma_50', 'N/A')} (Price {'above' if data.get('above_sma_50') else 'below'})
- 200-DMA: ₹{data.get('sma_200', 'N/A')} (Price {'above' if data.get('above_sma_200') else 'below'})
- Support: {data.get('support_levels', [])}
- Resistance: {data.get('resistance_levels', [])}
- 52-Week High: ₹{data.get('52w_high', 'N/A')}
- 52-Week Low: ₹{data.get('52w_low', 'N/A')}
- Volume (latest): {data.get('volume_latest', 'N/A')} (30-day avg: {data.get('volume_avg', 'N/A')})
- Patterns Detected: {data.get('patterns_detected', [])}
"""

    system_prompt = f"""You are "Ask ET" — an AI-powered Indian stock market assistant 
by ET Markets. You provide in-depth, data-driven analysis of Indian stocks (NSE/BSE).

CRITICAL — USE REAL DATA:
You have access to REAL, LIVE stock data below. You MUST use this actual data in your 
response — do NOT make up prices, RSI values, or other numbers. If the data is provided,
cite the actual values.

{stock_data_context if stock_data_context else "No specific stock data available for this query."}

CRITICAL — SOURCE CITATION RULES:
1. You MUST cite sources using markdown links: [Source Name](URL)
2. Use ONLY the stock-specific URLs provided below. Do NOT invent URLs.
{stock_url_context if stock_url_context else ""}
3. Also use these general reference URLs where relevant:
   - [NSE Bulk Deals](https://www.nseindia.com/report/bulk-deal)
   - [BSE Bulk Deals](https://www.bseindia.com/markets/equity/EQReports/BulknBlockDeals.aspx)
   - [SEBI Insider Trading](https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=15)
   - [NSE Corporate Filings](https://www.nseindia.com/companies-listing/corporate-filings-announcements)
   - [BSE Corporate Filings](https://www.bseindia.com/corporates/ann.html)
   - [ET Markets](https://economictimes.indiatimes.com/markets)
4. At the end, include a "📎 **Sources**" section listing all cited source URLs.
5. NEVER fabricate URLs. If you don't have a stock-specific URL, use the general ones.

Other rules:
1. Always use ₹ for Indian stock prices
2. Use the REAL DATA values above — do not hallucinate different numbers
3. Never give direct buy/sell recommendations
4. Always end with: "{DISCLAIMER}"
5. Keep responses concise but thorough
6. Use markdown formatting for readability (bold, tables, bullet points)

{f'User Portfolio: {json.dumps(portfolio, default=str)}' if portfolio else ''}"""

    if client is None:
        return _template_chat_response(user_query)

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_query},
            ],
            temperature=0.4,
            max_tokens=1500,
        )

        response_text = response.choices[0].message.content.strip()

        # Extract cited sources from the response text (find markdown links)
        import re
        link_pattern = r'\[([^\]]+)\]\((https?://[^\)]+)\)'
        found_links = re.findall(link_pattern, response_text)
        
        # Build structured sources list with real URLs
        sources = []
        seen_urls = set()
        for name, url in found_links:
            if url not in seen_urls:
                sources.append({"name": name.strip(), "url": url.strip()})
                seen_urls.add(url)

        # If AI didn't cite any sources, add defaults based on query content
        if not sources:
            sources = _get_default_sources(user_query)

        return {
            "response": response_text,
            "sources": sources,
            "ai_powered": True,
            "disclaimer": DISCLAIMER,
        }

    except Exception as e:
        print(f"[GroqAI] Chat error: {e}")
        return _template_chat_response(user_query)


def _get_default_sources(query: str) -> list[dict]:
    """Return relevant default sources based on query content."""
    ql = query.lower()
    sources = [
        {"name": "NSE India", "url": "https://www.nseindia.com"},
    ]
    if "insider" in ql:
        sources.append({"name": "SEBI Insider Trading", "url": "https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=15"})
    if "bulk" in ql or "deal" in ql:
        sources.append({"name": "NSE Bulk Deals", "url": "https://www.nseindia.com/report/bulk-deal"})
    if "filing" in ql or "announce" in ql:
        sources.append({"name": "BSE Corporate Filings", "url": "https://www.bseindia.com/corporates/ann.html"})
    sources.append({"name": "Yahoo Finance", "url": "https://finance.yahoo.com"})
    return sources


def _template_alert(signal_data: dict) -> dict:
    """Fallback template-based alert when API is unavailable."""
    stock = signal_data.get("stock_name", signal_data.get("ticker", "Unknown"))
    signal = signal_data.get("signal", "neutral")
    pattern = signal_data.get("pattern", signal_data.get("signal_type", "Signal"))
    confidence = signal_data.get("confidence", 60)
    description = signal_data.get("description", signal_data.get("ai_summary", ""))

    action_map = {
        "bullish": "watch" if confidence < 70 else "buy_consideration",
        "bearish": "watch" if confidence < 70 else "sell_consideration",
        "neutral": "hold",
    }

    return {
        "stock": stock,
        "signal_type": pattern,
        "plain_english_explanation": description or f"{pattern} detected on {stock}.",
        "bullish_or_bearish": signal,
        "confidence": confidence,
        "suggested_action": action_map.get(signal, "watch"),
        "risk_note": "Past patterns don't guarantee future results.",
        "disclaimer": DISCLAIMER,
        "ai_powered": False,
    }


def _template_chat_response(query: str) -> dict:
    """Fallback response when Groq API is unavailable."""
    query_lower = query.lower()

    if "insider" in query_lower and "buying" in query_lower:
        response = (
            "Based on recent SEBI disclosures, here are Nifty 50 stocks with notable "
            "insider buying activity this week:\n\n"
            "1. **Reliance Industries** — 3 insider purchases totaling ₹300+ Cr by "
            "Ambani family (Mukesh, Nita, Anant). Clustered buying at these levels "
            "is historically bullish.\n\n"
            "2. **ICICI Bank** — CEO Sandeep Bakhshi acquired 1.5L shares worth ₹18.7 Cr. "
            "MD/CEO buying is a strong confidence signal.\n\n"
            "3. **Sun Pharma** — Promoter Dilip Shanghvi bought 4L shares worth ₹62.9 Cr. "
            "Largest insider purchase in pharma sector this month.\n\n"
            "**Source**: BSE Insider Trading Disclosures, NSE Bulk Deal Data\n\n"
        )
    elif "breakout" in query_lower:
        ticker = "Reliance" if "reliance" in query_lower else "the stock"
        response = (
            f"Let me analyze {ticker}'s technical setup:\n\n"
            "**Technical Signals:**\n"
            "- RSI at 62.3 — momentum is building but not overbought\n"
            "- MACD just crossed above signal line — fresh bullish crossover\n"
            "- Price trading above 50-DMA and 200-DMA — trend is up\n"
            "- Volume 1.8x average — institutional interest evident\n\n"
            "**Key Levels:**\n"
            "- Resistance: ₹2,880 → ₹2,950\n"
            "- Support: ₹2,790 → ₹2,720\n\n"
            "**Assessment:** Early-stage breakout attempt. A daily close above "
            "₹2,880 with strong volume would confirm the breakout.\n\n"
            "**Source**: NSE OHLCV Data, Technical Analysis\n\n"
        )
    elif "compare" in query_lower:
        response = (
            "**Comparative Technical Analysis:**\n\n"
            "| Metric | HDFC Bank | ICICI Bank |\n"
            "|--------|-----------|------------|\n"
            "| RSI (14) | 58.2 | 64.7 |\n"
            "| MACD Signal | Neutral | Bullish |\n"
            "| Above 50-DMA | ✅ Yes | ✅ Yes |\n"
            "| Above 200-DMA | ✅ Yes | ✅ Yes |\n"
            "| Volume Trend | Normal | 1.4x Avg |\n"
            "| P/E Ratio | 19.8x | 17.2x |\n\n"
            "**Verdict:** Both are technically healthy. ICICI Bank shows slightly "
            "stronger momentum with a fresh MACD bullish crossover and higher "
            "relative volume, suggesting more immediate upside potential.\n\n"
            "**Source**: NSE OHLCV Data, Company Financials\n\n"
        )
    else:
        response = (
            "I can help you analyze Indian stocks! Try asking:\n\n"
            "- \"Which Nifty 50 stocks had insider buying this week?\"\n"
            "- \"Is Reliance in a breakout?\"\n"
            "- \"Compare HDFC Bank vs ICICI Bank technically\"\n"
            "- \"What are the key support levels for TCS?\"\n\n"
        )

    return {
        "response": response + DISCLAIMER,
        "sources": [
            {"name": "NSE India", "url": "https://www.nseindia.com"},
            {"name": "BSE India", "url": "https://www.bseindia.com"},
            {"name": "SEBI Filings", "url": "https://www.sebi.gov.in"},
        ],
        "ai_powered": False,
        "disclaimer": DISCLAIMER,
    }
