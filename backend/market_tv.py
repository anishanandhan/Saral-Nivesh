"""
Market TV Engine — Bloomberg/CNBC-Style Live Market Streaming
Generates AI-powered financial updates and pushes them via GetStream + SSE.
Includes gTTS voice narration.
"""

import asyncio
import json
import random
import time
from pathlib import Path
from typing import Optional
from collections import deque

from gtts import gTTS
from getstream import Stream
from getstream.models import ChannelInput, UserRequest, MessageRequest

from config import STREAM_API_KEY, STREAM_API_SECRET
from grok_ai import _call_groq_json

# Audio cache directory
AUDIO_DIR = Path(__file__).parent / "audio_cache"
AUDIO_DIR.mkdir(exist_ok=True)


# ─── Market Data (Demo) ────────────────────────────────────────────────

MARKET_SCENARIOS = [
    "Nifty 50 rises 1.4% as banking stocks lead the rally, HDFC Bank up 3%",
    "IT sector under pressure as Infosys and TCS fall 2% on weak Q4 guidance",
    "RBI keeps repo rate unchanged at 6.5%, markets react positively",
    "Reliance Industries hits all-time high on Jio Financial spinoff news",
    "Foreign investors pull out Rs 5,000 crore from Indian equities this week",
    "Adani Group stocks surge 8% after credit upgrade by S&P",
    "Gold prices cross Rs 72,000 per 10 grams, new all-time high",
    "Crude oil drops below $75, positive for India's trade deficit",
    "US Federal Reserve signals potential rate cut in September 2026",
    "Sensex crosses 80,000 mark for the first time, Nifty at 24,300",
    "Tata Motors EV sales jump 45% year-on-year, stock rallies 4%",
    "SEBI tightens F&O regulations, retail participation may decline",
    "Indian rupee strengthens to 82.5 against US dollar on FII inflows",
    "Pharma stocks rally 3% as US FDA approvals boost sentiment",
    "Banking Nifty breaks out above 52,000 with strong volume",
    "Bitcoin crosses $95,000 amid institutional buying frenzy",
    "Bajaj Finance reports 22% profit growth, stock jumps 5%",
    "Auto sector bullish as June sales data beats expectations",
    "FMCG stocks gain as rural demand shows recovery signals",
    "Metal stocks fall 2% on China slowdown concerns",
]

TICKER_DATA = [
    {"symbol": "NIFTY 50", "price": "24,312.45", "change": "+1.2%", "direction": "up"},
    {"symbol": "SENSEX", "price": "80,145.80", "change": "+0.9%", "direction": "up"},
    {"symbol": "RELIANCE", "price": "₹2,945", "change": "+2.1%", "direction": "up"},
    {"symbol": "TCS", "price": "₹3,820", "change": "-0.8%", "direction": "down"},
    {"symbol": "HDFCBANK", "price": "₹1,678", "change": "+1.5%", "direction": "up"},
    {"symbol": "INFY", "price": "₹1,542", "change": "-1.2%", "direction": "down"},
    {"symbol": "ITC", "price": "₹468", "change": "+0.6%", "direction": "up"},
    {"symbol": "BTC/USD", "price": "$94,850", "change": "+3.4%", "direction": "up"},
    {"symbol": "GOLD", "price": "₹72,150", "change": "+0.3%", "direction": "up"},
    {"symbol": "CRUDE", "price": "$74.20", "change": "-1.8%", "direction": "down"},
    {"symbol": "BAJFINANCE", "price": "₹7,245", "change": "+4.2%", "direction": "up"},
    {"symbol": "TATAMOTORS", "price": "₹985", "change": "+2.8%", "direction": "up"},
    {"symbol": "SBIN", "price": "₹832", "change": "+0.5%", "direction": "up"},
    {"symbol": "WIPRO", "price": "₹478", "change": "-0.3%", "direction": "down"},
    {"symbol": "ADANIENT", "price": "₹3,120", "change": "+5.1%", "direction": "up"},
]


# ─── AI Content Generation ─────────────────────────────────────────────

MARKET_TV_SYSTEM_PROMPT = """You are an expert financial news anchor for a live Bloomberg/CNBC-style TV channel.

Your job is to convert market events into broadcast-ready content with a detailed spoken narration.

OUTPUT FORMAT (STRICT JSON):
{
"hook": "Very catchy headline (max 6 words, powerful, no punctuation at end)",
"summary": "Simple explanation of what happened (max 15 words, easy to understand)",
"cta": "Engaging call-to-action or forward-looking statement (max 8 words)",
"narration": "A detailed 3-4 sentence spoken narration script that a news anchor would read on air. Cover what happened, why it matters, the impact on investors, and what to watch next. Speak directly to the viewer. Use a professional but engaging tone.",
"sentiment": "bullish" or "bearish" or "neutral",
"urgency": "breaking" or "alert" or "update"
}

RULES:
* Hook must grab attention instantly (use words like crash, surge, shock, boom, rally, warning, breaking)
* Summary must clearly explain the reason behind the news in simple terms
* Narration should be 3-4 sentences, detailed, professional, spoken like a real news anchor reading live
* Use simple language that a beginner investor would understand
* No emojis, no hashtags
* No extra text outside JSON
* Make it sound like breaking financial news
* sentiment must be exactly "bullish", "bearish", or "neutral"
* urgency must be exactly "breaking", "alert", or "update"

IMPORTANT: Output ONLY valid JSON. No extra text."""


def generate_market_update(news: Optional[str] = None) -> dict:
    """Generate a market update using Groq AI."""
    if not news:
        news = random.choice(MARKET_SCENARIOS)

    parsed = _call_groq_json(MARKET_TV_SYSTEM_PROMPT, f"BREAKING NEWS:\n{news}")

    if parsed and "hook" in parsed and "summary" in parsed:
        return {
            "hook": parsed.get("hook", ""),
            "summary": parsed.get("summary", ""),
            "cta": parsed.get("cta", ""),
            "narration": parsed.get("narration", ""),
            "sentiment": parsed.get("sentiment", "neutral"),
            "urgency": parsed.get("urgency", "update"),
            "source_news": news,
            "timestamp": time.time(),
            "ai_powered": True,
        }

    # Fallback
    keywords = ["crash", "surge", "fall", "rise", "boom", "rally", "drop", "jump"]
    hook_word = next((w for w in keywords if w.lower() in news.lower()), "breaking")
    return {
        "hook": f"Markets {hook_word} right now",
        "summary": news[:80] if len(news) > 80 else news,
        "cta": "Stay tuned for more updates",
        "narration": f"Breaking news from the markets. {news}. We are monitoring this situation closely and will bring you more updates as they develop. Stay with us.",
        "sentiment": "neutral",
        "urgency": "update",
        "source_news": news,
        "timestamp": time.time(),
        "ai_powered": False,
    }


# ─── gTTS Audio Generation ─────────────────────────────────────────────

def generate_narration_audio(text: str, filename: str) -> Optional[str]:
    """Generate narration audio using gTTS (free Google TTS). Returns filename or None."""
    if not text:
        return None
    try:
        filepath = AUDIO_DIR / filename
        tts = gTTS(text=text, lang='en', slow=False)
        tts.save(str(filepath))
        size = filepath.stat().st_size
        if size > 0:
            print(f"[MarketTV] 🔊 Audio: {filename} ({size//1024}KB)")
            return filename
        return None
    except Exception as e:
        print(f"[MarketTV] gTTS error: {e}")
        return None


# ─── GetStream Integration ─────────────────────────────────────────────

_stream_client = None


def get_stream_client() -> Optional[Stream]:
    """Initialize or return cached Stream client."""
    global _stream_client
    if _stream_client:
        return _stream_client
    if not STREAM_API_KEY or not STREAM_API_SECRET:
        return None
    try:
        _stream_client = Stream(api_key=STREAM_API_KEY, api_secret=STREAM_API_SECRET)
        return _stream_client
    except Exception as e:
        print(f"[MarketTV] Stream client init error: {e}")
        return None


def setup_stream_channel():
    """Create/get the market-tv channel and setup user."""
    client = get_stream_client()
    if not client:
        print("[MarketTV] No Stream client — running without Stream")
        return None

    try:
        # Upsert the system user
        client.upsert_users(
            UserRequest(id="market-tv-bot", name="Market TV Bot", role="admin")
        )
        # Get or create the channel
        channel = client.chat.channel("messaging", "market-tv")
        channel.get_or_create(
            data=ChannelInput(
                created_by_id="market-tv-bot",
            )
        )
        print("[MarketTV] Stream channel 'market-tv' ready")
        return channel
    except Exception as e:
        print(f"[MarketTV] Stream channel setup error: {e}")
        return None


def push_to_stream(update: dict):
    """Push a market update to the Stream channel."""
    client = get_stream_client()
    if not client:
        return

    try:
        channel = client.chat.channel("messaging", "market-tv")
        channel.send_message(
            MessageRequest(
                id=f"market-update-{int(update['timestamp'])}",
                text=f"{update['hook']} — {update['summary']}",
                user_id="market-tv-bot",
                custom={
                    "hook": update["hook"],
                    "summary": update["summary"],
                    "cta": update["cta"],
                    "sentiment": update["sentiment"],
                    "urgency": update["urgency"],
                },
            )
        )
    except Exception as e:
        print(f"[MarketTV] Stream push error: {e}")


def generate_stream_token(user_id: str) -> str:
    """Generate a user token for Stream frontend auth."""
    client = get_stream_client()
    if not client:
        return ""
    try:
        return client.create_token(user_id)
    except Exception as e:
        print(f"[MarketTV] Token generation error: {e}")
        return ""


# ─── Update History & SSE ───────────────────────────────────────────────

update_history: deque = deque(maxlen=20)
sse_subscribers: list = []


def get_latest_update() -> Optional[dict]:
    """Return the most recent update."""
    return update_history[-1] if update_history else None


def get_ticker_data() -> list:
    """Return randomized ticker data for the scrolling strip."""
    # Slightly randomize prices each time for realism
    tickers = []
    for t in TICKER_DATA:
        change_val = random.uniform(-0.5, 0.5) + float(t["change"].replace("%", "").replace("+", ""))
        direction = "up" if change_val > 0 else "down"
        tickers.append({
            **t,
            "change": f"{'+' if change_val > 0 else ''}{change_val:.1f}%",
            "direction": direction,
        })
    return tickers


# ─── Background Loop ───────────────────────────────────────────────────

_running = False


async def market_tv_loop():
    """Background loop that generates market updates every 30-60 seconds."""
    global _running
    _running = True

    # Setup Stream channel
    setup_stream_channel()

    print("[MarketTV] 🔴 LIVE — Background generation started")

    while _running:
        try:
            # Generate new update
            update = generate_market_update()
            update["tickers"] = get_ticker_data()

            # Generate voice narration MP3 with gTTS
            narration = update.get("narration", "")
            if narration:
                audio_file = f"narration_{int(update['timestamp'])}.mp3"
                result = generate_narration_audio(narration, audio_file)
                update["audio_url"] = f"/audio/{result}" if result else None
            else:
                update["audio_url"] = None

            update_history.append(update)

            # Push to Stream (non-blocking)
            try:
                push_to_stream(update)
            except Exception as e:
                print(f"[MarketTV] Stream push error (non-fatal): {e}")

            # Notify all SSE subscribers
            update_json = json.dumps(update)
            dead_subscribers = []
            for q in sse_subscribers:
                try:
                    await q.put(update_json)
                except Exception:
                    dead_subscribers.append(q)

            for q in dead_subscribers:
                if q in sse_subscribers:
                    sse_subscribers.remove(q)

            print(f"[MarketTV] Update pushed: {update['hook']} (audio: {'yes' if update.get('audio_url') else 'no'})")

            # Cleanup old audio files (keep last 5)
            try:
                audio_files = sorted(AUDIO_DIR.glob("narration_*.mp3"), key=lambda f: f.stat().st_mtime)
                for i in range(len(audio_files) - 5):
                    audio_files[i].unlink(missing_ok=True)
            except Exception:
                pass

            # Wait 35-60 seconds
            delay = random.randint(35, 60)
            await asyncio.sleep(delay)

        except Exception as e:
            print(f"[MarketTV] Loop error: {e}")
            await asyncio.sleep(10)


def stop_market_tv():
    """Stop the background loop."""
    global _running
    _running = False
    print("[MarketTV] Background generation stopped")
