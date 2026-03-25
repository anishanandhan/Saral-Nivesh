"""
Stock Data Fetcher Module
Fetches OHLCV data for NSE stocks using yfinance.
Provides caching to work offline during demos.
"""

import json
import os
import time
from datetime import datetime, timedelta
from typing import Optional

import pandas as pd
import yfinance as yf

from config import CACHE_DIR, DEMO_TICKERS, OHLCV_PERIOD, BACKTEST_PERIOD


def get_stock_data(
    ticker: str,
    period: str = OHLCV_PERIOD,
    interval: str = "1d",
    use_cache: bool = True,
) -> Optional[pd.DataFrame]:
    """
    Fetch OHLCV data for a given NSE ticker.
    Caches data locally so the demo works even if APIs fail.
    
    Args:
        ticker: NSE ticker symbol (e.g., "RELIANCE.NS")
        period: Data period ("1y", "3y", "5y")
        interval: Candle interval ("1d", "1h")
        use_cache: Whether to try cache first
    
    Returns:
        DataFrame with Open, High, Low, Close, Volume columns
    """
    cache_file = os.path.join(CACHE_DIR, f"{ticker}_{period}_{interval}.parquet")

    # Try cache first (valid for 4 hours)
    if use_cache and os.path.exists(cache_file):
        cache_age = time.time() - os.path.getmtime(cache_file)
        if cache_age < 14400:  # 4 hours
            try:
                df = pd.read_parquet(cache_file)
                if not df.empty:
                    return df
            except Exception:
                pass

    # Fetch fresh data from Yahoo Finance
    try:
        stock = yf.Ticker(ticker)
        df = stock.history(period=period, interval=interval)

        if df.empty:
            # Fallback to cached data if available
            if os.path.exists(cache_file):
                return pd.read_parquet(cache_file)
            return None

        # Clean up column names
        df.columns = [col.strip() for col in df.columns]

        # Cache the data
        df.to_parquet(cache_file)
        return df

    except Exception as e:
        print(f"[DataFetcher] Error fetching {ticker}: {e}")
        # Fallback to cache
        if os.path.exists(cache_file):
            try:
                return pd.read_parquet(cache_file)
            except Exception:
                pass
        return None


def get_stock_info(ticker: str) -> dict:
    """Get basic stock information (name, sector, market cap)."""
    cache_file = os.path.join(CACHE_DIR, f"{ticker}_info.json")

    if os.path.exists(cache_file):
        cache_age = time.time() - os.path.getmtime(cache_file)
        if cache_age < 86400:  # 24 hours
            with open(cache_file, "r") as f:
                return json.load(f)

    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        result = {
            "ticker": ticker,
            "name": info.get("shortName", ticker.replace(".NS", "")),
            "sector": info.get("sector", "Unknown"),
            "industry": info.get("industry", "Unknown"),
            "market_cap": info.get("marketCap", 0),
            "current_price": info.get("currentPrice", info.get("regularMarketPrice", 0)),
            "prev_close": info.get("previousClose", 0),
            "day_high": info.get("dayHigh", 0),
            "day_low": info.get("dayLow", 0),
            "fifty_two_week_high": info.get("fiftyTwoWeekHigh", 0),
            "fifty_two_week_low": info.get("fiftyTwoWeekLow", 0),
            "pe_ratio": info.get("trailingPE", 0),
            "dividend_yield": info.get("dividendYield", 0),
        }

        with open(cache_file, "w") as f:
            json.dump(result, f)

        return result

    except Exception as e:
        print(f"[DataFetcher] Error fetching info for {ticker}: {e}")
        return {
            "ticker": ticker,
            "name": ticker.replace(".NS", ""),
            "sector": "Unknown",
            "current_price": 0,
        }


def get_batch_stock_data(
    tickers: list[str] = DEMO_TICKERS,
    period: str = OHLCV_PERIOD,
) -> dict[str, pd.DataFrame]:
    """
    Fetch OHLCV data for multiple tickers.
    Returns a dict mapping ticker → DataFrame.
    """
    results = {}
    for ticker in tickers:
        df = get_stock_data(ticker, period=period)
        if df is not None and not df.empty:
            results[ticker] = df
    return results


def get_latest_prices(tickers: list[str] = DEMO_TICKERS) -> list[dict]:
    """Get latest price snapshots for a list of tickers."""
    prices = []
    for ticker in tickers:
        df = get_stock_data(ticker, period="5d")
        if df is not None and len(df) >= 2:
            latest = df.iloc[-1]
            prev = df.iloc[-2]
            change = latest["Close"] - prev["Close"]
            change_pct = (change / prev["Close"]) * 100

            prices.append({
                "ticker": ticker,
                "name": ticker.replace(".NS", ""),
                "price": round(float(latest["Close"]), 2),
                "change": round(float(change), 2),
                "change_pct": round(float(change_pct), 2),
                "volume": int(latest["Volume"]),
                "high": round(float(latest["High"]), 2),
                "low": round(float(latest["Low"]), 2),
                "timestamp": str(df.index[-1]),
            })

    return prices
