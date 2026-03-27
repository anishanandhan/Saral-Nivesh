"""
Configuration module for the Opportunity Radar backend.
Loads environment variables and defines app-wide constants.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# --- Groq API Configuration ---
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_BASE_URL = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
GROQ_MODEL = "llama-3.3-70b-versatile"

# --- Stream API Configuration ---
STREAM_API_KEY = os.getenv("STREAM_API_KEY", "")
STREAM_API_SECRET = os.getenv("STREAM_API_SECRET", "")

# --- ElevenLabs Configuration ---
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")

# --- Stock Universe (Nifty 50 core stocks) ---
NIFTY_50_TICKERS = [
    "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
    "HINDUNILVR.NS", "ITC.NS", "SBIN.NS", "BHARTIARTL.NS", "KOTAKBANK.NS",
    "LT.NS", "AXISBANK.NS", "ASIANPAINT.NS", "MARUTI.NS", "TITAN.NS",
    "SUNPHARMA.NS", "BAJFINANCE.NS", "WIPRO.NS", "ULTRACEMCO.NS", "ONGC.NS",
    "NTPC.NS", "TATAMOTORS.NS", "JSWSTEEL.NS", "POWERGRID.NS", "M&M.NS",
    "ADANIENT.NS", "TATASTEEL.NS", "HCLTECH.NS", "INDUSINDBK.NS", "COALINDIA.NS",
]

# Subset for fast demo
DEMO_TICKERS = [
    "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
    "ITC.NS", "SBIN.NS", "BHARTIARTL.NS", "TATAMOTORS.NS", "BAJFINANCE.NS",
    "SUNPHARMA.NS", "WIPRO.NS", "LT.NS", "AXISBANK.NS", "MARUTI.NS",
]

# --- Technical Analysis Parameters ---
RSI_PERIOD = 14
RSI_OVERBOUGHT = 70
RSI_OVERSOLD = 30
MACD_FAST = 12
MACD_SLOW = 26
MACD_SIGNAL = 9
SMA_SHORT = 50
SMA_LONG = 200

# --- Data Fetch Parameters ---
OHLCV_PERIOD = "1y"          # Default period for pattern detection
BACKTEST_PERIOD = "3y"       # Period for backtesting
INTRADAY_INTERVAL = "1d"     # Daily candles

# --- Cache Settings ---
CACHE_DIR = os.path.join(os.path.dirname(__file__), "cache")
os.makedirs(CACHE_DIR, exist_ok=True)

# --- Disclaimer ---
DISCLAIMER = (
    "⚠️ This is not financial advice. For educational and informational purposes only. "
    "Always consult a SEBI-registered financial advisor before making investment decisions."
)
