"""
Backtesting Module
Tests historical performance of detected patterns.
For a given stock and pattern type, finds every past occurrence
and calculates win rate and average returns.
"""

import pandas as pd
import numpy as np
from typing import Optional

from data_fetcher import get_stock_data
from pattern_engine import (
    calculate_rsi, calculate_macd, calculate_sma,
)
from config import (
    BACKTEST_PERIOD, RSI_PERIOD, MACD_FAST, MACD_SLOW,
    MACD_SIGNAL, SMA_SHORT, SMA_LONG,
)


def backtest_pattern(
    ticker: str,
    pattern_name: str,
    forward_days: list[int] | None = None,
) -> Optional[dict]:
    if forward_days is None:
        forward_days = [10, 20, 30]
    """
    Backtest a specific pattern on a stock over the last 3 years.
    
    Args:
        ticker: Stock ticker (e.g., "RELIANCE.NS")
        pattern_name: One of "MACD Crossover", "RSI Oversold", "RSI Overbought",
                       "Golden Cross", "Death Cross", "Volume Spike"
        forward_days: Days to measure future returns [10, 20, 30]
    
    Returns:
        Dict with win rate, average returns, occurrence count, and summary.
    """
    df = get_stock_data(ticker, period=BACKTEST_PERIOD)
    if df is None or len(df) < 250:
        return None

    stock_name = ticker.replace(".NS", "")

    # Find all historical occurrences of the pattern
    entry_dates = _find_pattern_occurrences(df, pattern_name)

    if not entry_dates or len(entry_dates) < 3:
        return {
            "ticker": ticker,
            "stock_name": stock_name,
            "pattern": pattern_name,
            "occurrences": len(entry_dates) if entry_dates else 0,
            "message": f"Insufficient data — only {len(entry_dates) if entry_dates else 0} occurrences found.",
            "results": {},
        }

    # Calculate forward returns for each occurrence
    results = {}
    for fwd in forward_days:
        returns = []
        for entry_idx in entry_dates:
            exit_idx = entry_idx + fwd
            if exit_idx < len(df):
                entry_price = float(df["Close"].iloc[entry_idx])
                exit_price = float(df["Close"].iloc[exit_idx])
                ret = ((exit_price - entry_price) / entry_price) * 100
                returns.append(ret)

        if returns:
            wins = sum(1 for r in returns if r > 0)
            results[f"{fwd}_day"] = {
                "win_rate": round((wins / len(returns)) * 100, 1),
                "avg_return": round(np.mean(returns), 2),
                "median_return": round(np.median(returns), 2),
                "best_return": round(max(returns), 2),
                "worst_return": round(min(returns), 2),
                "sample_size": len(returns),
            }

    # Generate plain-English summary
    primary = results.get("30_day", results.get("20_day", results.get("10_day", {})))
    win_rate = primary.get("win_rate", 0)
    avg_return = primary.get("avg_return", 0)
    sample_size = primary.get("sample_size", 0)
    period_label = "30 days" if "30_day" in results else "20 days" if "20_day" in results else "10 days"

    summary = (
        f"This pattern ({pattern_name}) has worked {win_rate}% of the time on {stock_name} "
        f"over the last 3 years ({sample_size} occurrences), with an average "
        f"{'+' if avg_return > 0 else ''}{avg_return}% return over {period_label}."
    )

    return {
        "ticker": ticker,
        "stock_name": stock_name,
        "pattern": pattern_name,
        "period": "3 years",
        "occurrences": len(entry_dates),
        "results": results,
        "summary": summary,
    }


def _find_pattern_occurrences(df: pd.DataFrame, pattern_name: str) -> list[int]:
    """Find indices of all historical occurrences of a pattern."""
    occurrences = []
    pattern_lower = pattern_name.lower()

    if "macd" in pattern_lower and "bullish" in pattern_lower:
        occurrences = _find_macd_crossovers(df, bullish=True)
    elif "macd" in pattern_lower and "bearish" in pattern_lower:
        occurrences = _find_macd_crossovers(df, bullish=False)
    elif "macd" in pattern_lower:
        occurrences = _find_macd_crossovers(df, bullish=True)
    elif "rsi" in pattern_lower and ("oversold" in pattern_lower or "bullish" in pattern_lower):
        occurrences = _find_rsi_extremes(df, oversold=True)
    elif "rsi" in pattern_lower and ("overbought" in pattern_lower or "bearish" in pattern_lower):
        occurrences = _find_rsi_extremes(df, oversold=False)
    elif "golden" in pattern_lower:
        occurrences = _find_ma_crossovers(df, golden=True)
    elif "death" in pattern_lower:
        occurrences = _find_ma_crossovers(df, golden=False)
    elif "volume" in pattern_lower:
        occurrences = _find_volume_spikes(df)
    elif "breakout" in pattern_lower:
        occurrences = _find_breakouts(df)

    return occurrences


def _find_macd_crossovers(df: pd.DataFrame, bullish: bool = True) -> list[int]:
    """Find all MACD crossover points in history."""
    ema_fast = df["Close"].ewm(span=MACD_FAST, adjust=False).mean()
    ema_slow = df["Close"].ewm(span=MACD_SLOW, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=MACD_SIGNAL, adjust=False).mean()

    occurrences = []
    for i in range(1, len(df)):
        prev_macd = float(macd_line.iloc[i - 1])
        curr_macd = float(macd_line.iloc[i])
        prev_signal = float(signal_line.iloc[i - 1])
        curr_signal = float(signal_line.iloc[i])

        if bullish and prev_macd <= prev_signal and curr_macd > curr_signal:
            occurrences.append(i)
        elif not bullish and prev_macd >= prev_signal and curr_macd < curr_signal:
            occurrences.append(i)

    return occurrences


def _find_rsi_extremes(df: pd.DataFrame, oversold: bool = True) -> list[int]:
    """Find all RSI oversold/overbought entry points."""
    rsi = calculate_rsi(df)
    threshold = 30 if oversold else 70
    occurrences = []

    for i in range(1, len(rsi)):
        if pd.isna(rsi.iloc[i]) or pd.isna(rsi.iloc[i - 1]):
            continue
        if oversold:
            # Entry when RSI crosses back above 30 (recovery from oversold)
            if float(rsi.iloc[i - 1]) < threshold and float(rsi.iloc[i]) >= threshold:
                occurrences.append(i)
        else:
            # Entry when RSI crosses above 70 (overbought signal)
            if float(rsi.iloc[i - 1]) < threshold and float(rsi.iloc[i]) >= threshold:
                occurrences.append(i)

    return occurrences


def _find_ma_crossovers(df: pd.DataFrame, golden: bool = True) -> list[int]:
    """Find Golden Cross or Death Cross occurrences."""
    if len(df) < SMA_LONG + 5:
        return []

    sma_short = calculate_sma(df, SMA_SHORT)
    sma_long = calculate_sma(df, SMA_LONG)

    occurrences = []
    for i in range(SMA_LONG + 1, len(df)):
        prev_short = float(sma_short.iloc[i - 1])
        curr_short = float(sma_short.iloc[i])
        prev_long = float(sma_long.iloc[i - 1])
        curr_long = float(sma_long.iloc[i])

        if golden and prev_short <= prev_long and curr_short > curr_long:
            occurrences.append(i)
        elif not golden and prev_short >= prev_long and curr_short < curr_long:
            occurrences.append(i)

    return occurrences


def _find_volume_spikes(df: pd.DataFrame, threshold: float = 2.0) -> list[int]:
    """Find days with volume > threshold x average."""
    occurrences = []
    for i in range(30, len(df)):
        avg_vol = float(df["Volume"].iloc[i - 30:i].mean())
        curr_vol = float(df["Volume"].iloc[i])
        if avg_vol > 0 and curr_vol > avg_vol * threshold:
            occurrences.append(i)
    return occurrences


def _find_breakouts(df: pd.DataFrame, lookback: int = 20) -> list[int]:
    """Find breakout above recent N-day high."""
    occurrences = []
    for i in range(lookback + 1, len(df)):
        recent_high = float(df["High"].iloc[i - lookback:i].max())
        curr_close = float(df["Close"].iloc[i])
        if curr_close > recent_high:
            occurrences.append(i)
    return occurrences


def get_backtest_summary(ticker: str) -> dict:
    """Run backtests for all major patterns on a single stock."""
    patterns = [
        "MACD Bullish Crossover",
        "RSI Oversold Recovery",
        "Golden Cross",
        "Volume Spike",
        "Breakout",
    ]

    results = {}
    for pattern in patterns:
        bt = backtest_pattern(ticker, pattern)
        if bt and bt.get("results"):
            results[pattern] = bt

    return {
        "ticker": ticker,
        "stock_name": ticker.replace(".NS", ""),
        "backtests": results,
    }
