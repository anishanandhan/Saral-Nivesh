"""
Technical Pattern Detection Engine
Detects RSI divergence, MACD crossover, Golden/Death cross,
support/resistance levels, and breakout patterns.
Returns structured JSON signals per stock.
"""

import pandas as pd
import numpy as np
from typing import Optional
from config import (
    RSI_PERIOD, RSI_OVERBOUGHT, RSI_OVERSOLD,
    MACD_FAST, MACD_SLOW, MACD_SIGNAL,
    SMA_SHORT, SMA_LONG,
)


# ─── Core Indicator Calculations ─────────────────────────────────────

def calculate_rsi(df: pd.DataFrame, period: int = RSI_PERIOD) -> pd.Series:
    """Calculate Relative Strength Index."""
    delta = df["Close"].diff()
    gain = delta.where(delta > 0, 0.0)
    loss = -delta.where(delta < 0, 0.0)
    avg_gain = gain.rolling(window=period, min_periods=period).mean()
    avg_loss = loss.rolling(window=period, min_periods=period).mean()
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return rsi


def calculate_macd(
    df: pd.DataFrame,
    fast: int = MACD_FAST,
    slow: int = MACD_SLOW,
    signal: int = MACD_SIGNAL,
) -> tuple[pd.Series, pd.Series, pd.Series]:
    """Calculate MACD line, signal line, and histogram."""
    ema_fast = df["Close"].ewm(span=fast, adjust=False).mean()
    ema_slow = df["Close"].ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    histogram = macd_line - signal_line
    return macd_line, signal_line, histogram


def calculate_sma(df: pd.DataFrame, period: int) -> pd.Series:
    """Calculate Simple Moving Average."""
    return df["Close"].rolling(window=period).mean()


def calculate_ema(df: pd.DataFrame, period: int) -> pd.Series:
    """Calculate Exponential Moving Average."""
    return df["Close"].ewm(span=period, adjust=False).mean()


def calculate_bollinger_bands(
    df: pd.DataFrame, period: int = 20, std_dev: int = 2
) -> tuple[pd.Series, pd.Series, pd.Series]:
    """Calculate Bollinger Bands (upper, middle, lower)."""
    middle = df["Close"].rolling(window=period).mean()
    std = df["Close"].rolling(window=period).std()
    upper = middle + (std * std_dev)
    lower = middle - (std * std_dev)
    return upper, middle, lower


def find_support_resistance(df: pd.DataFrame, window: int = 20) -> dict:
    """
    Find key support and resistance levels using pivot points
    and recent swing highs/lows.
    """
    highs = df["High"].rolling(window=window, center=True).max()
    lows = df["Low"].rolling(window=window, center=True).min()

    # Find recent swing highs (resistance) and swing lows (support)
    recent = df.tail(60)
    resistance_levels = []
    support_levels = []

    for i in range(2, len(recent) - 2):
        # Swing high
        if (
            recent["High"].iloc[i] > recent["High"].iloc[i - 1]
            and recent["High"].iloc[i] > recent["High"].iloc[i - 2]
            and recent["High"].iloc[i] > recent["High"].iloc[i + 1]
            and recent["High"].iloc[i] > recent["High"].iloc[i + 2]
        ):
            resistance_levels.append(round(float(recent["High"].iloc[i]), 2))

        # Swing low
        if (
            recent["Low"].iloc[i] < recent["Low"].iloc[i - 1]
            and recent["Low"].iloc[i] < recent["Low"].iloc[i - 2]
            and recent["Low"].iloc[i] < recent["Low"].iloc[i + 1]
            and recent["Low"].iloc[i] < recent["Low"].iloc[i + 2]
        ):
            support_levels.append(round(float(recent["Low"].iloc[i]), 2))

    current_price = float(df["Close"].iloc[-1])

    # Filter: resistance above current price, support below
    resistance = sorted([r for r in resistance_levels if r > current_price])[:3]
    support = sorted([s for s in support_levels if s < current_price], reverse=True)[:3]

    return {
        "resistance": resistance,
        "support": support,
        "current_price": round(current_price, 2),
    }


# ─── Pattern Detection ────────────────────────────────────────────────

def detect_rsi_divergence(df: pd.DataFrame) -> Optional[dict]:
    """
    Detect bullish or bearish RSI divergence.
    Bullish: Price makes lower low, RSI makes higher low
    Bearish: Price makes higher high, RSI makes lower high
    """
    rsi = calculate_rsi(df)
    if rsi.isna().all():
        return None

    recent = df.tail(30).copy()
    recent["RSI"] = rsi.tail(30).values

    current_rsi = float(recent["RSI"].iloc[-1])

    # Check for bullish divergence (last 20 bars)
    lookback = recent.tail(20)
    price_min_idx = lookback["Close"].idxmin()
    price_min_pos = lookback.index.get_loc(price_min_idx)

    if price_min_pos > 5:
        earlier_section = lookback.iloc[:price_min_pos]
        if len(earlier_section) > 0:
            earlier_min_idx = earlier_section["Close"].idxmin()
            if float(lookback.loc[price_min_idx, "Close"]) < float(earlier_section.loc[earlier_min_idx, "Close"]):
                rsi_at_price_min = float(lookback.loc[price_min_idx, "RSI"])
                rsi_at_earlier_min = float(earlier_section.loc[earlier_min_idx, "RSI"])
                if rsi_at_price_min > rsi_at_earlier_min:
                    return {
                        "pattern": "RSI Bullish Divergence",
                        "signal": "bullish",
                        "confidence": min(85, 60 + abs(rsi_at_price_min - rsi_at_earlier_min)),
                        "rsi_current": round(current_rsi, 1),
                        "description": (
                            f"Price made a lower low but RSI made a higher low "
                            f"(RSI: {round(rsi_at_earlier_min, 1)} → {round(rsi_at_price_min, 1)}), "
                            f"suggesting weakening selling pressure and potential reversal upward."
                        ),
                    }

    # Check for bearish divergence
    price_max_idx = lookback["Close"].idxmax()
    price_max_pos = lookback.index.get_loc(price_max_idx)

    if price_max_pos > 5:
        earlier_section = lookback.iloc[:price_max_pos]
        if len(earlier_section) > 0:
            earlier_max_idx = earlier_section["Close"].idxmax()
            if float(lookback.loc[price_max_idx, "Close"]) > float(earlier_section.loc[earlier_max_idx, "Close"]):
                rsi_at_price_max = float(lookback.loc[price_max_idx, "RSI"])
                rsi_at_earlier_max = float(earlier_section.loc[earlier_max_idx, "RSI"])
                if rsi_at_price_max < rsi_at_earlier_max:
                    return {
                        "pattern": "RSI Bearish Divergence",
                        "signal": "bearish",
                        "confidence": min(85, 60 + abs(rsi_at_earlier_max - rsi_at_price_max)),
                        "rsi_current": round(current_rsi, 1),
                        "description": (
                            f"Price made a higher high but RSI made a lower high "
                            f"(RSI: {round(rsi_at_earlier_max, 1)} → {round(rsi_at_price_max, 1)}), "
                            f"suggesting weakening buying pressure and potential pullback."
                        ),
                    }

    # Simple RSI overbought/oversold
    if current_rsi >= RSI_OVERBOUGHT:
        return {
            "pattern": "RSI Overbought",
            "signal": "bearish",
            "confidence": min(75, 50 + (current_rsi - RSI_OVERBOUGHT)),
            "rsi_current": round(current_rsi, 1),
            "description": f"RSI at {round(current_rsi, 1)} — stock is overbought. Watch for potential pullback.",
        }
    elif current_rsi <= RSI_OVERSOLD:
        return {
            "pattern": "RSI Oversold",
            "signal": "bullish",
            "confidence": min(75, 50 + (RSI_OVERSOLD - current_rsi)),
            "rsi_current": round(current_rsi, 1),
            "description": f"RSI at {round(current_rsi, 1)} — stock is oversold. Watch for potential bounce.",
        }

    return None


def detect_macd_crossover(df: pd.DataFrame) -> Optional[dict]:
    """Detect MACD bullish or bearish crossover."""
    macd_line, signal_line, histogram = calculate_macd(df)

    if macd_line.isna().all() or signal_line.isna().all():
        return None

    # Check last 3 bars for a crossover
    for i in range(-3, 0):
        try:
            prev_macd = float(macd_line.iloc[i - 1])
            curr_macd = float(macd_line.iloc[i])
            prev_signal = float(signal_line.iloc[i - 1])
            curr_signal = float(signal_line.iloc[i])

            # Bullish crossover: MACD crosses above signal
            if prev_macd <= prev_signal and curr_macd > curr_signal:
                strength = abs(curr_macd - curr_signal)
                return {
                    "pattern": "MACD Bullish Crossover",
                    "signal": "bullish",
                    "confidence": min(80, 55 + strength * 10),
                    "macd_value": round(curr_macd, 3),
                    "signal_value": round(curr_signal, 3),
                    "description": (
                        f"MACD line ({round(curr_macd, 3)}) crossed above the signal line "
                        f"({round(curr_signal, 3)}), indicating building upward momentum. "
                        f"This is a classic buy signal used by momentum traders."
                    ),
                }

            # Bearish crossover: MACD crosses below signal
            if prev_macd >= prev_signal and curr_macd < curr_signal:
                strength = abs(curr_signal - curr_macd)
                return {
                    "pattern": "MACD Bearish Crossover",
                    "signal": "bearish",
                    "confidence": min(80, 55 + strength * 10),
                    "macd_value": round(curr_macd, 3),
                    "signal_value": round(curr_signal, 3),
                    "description": (
                        f"MACD line ({round(curr_macd, 3)}) crossed below the signal line "
                        f"({round(curr_signal, 3)}), indicating weakening momentum. "
                        f"This suggests a potential trend reversal or pullback."
                    ),
                }
        except (IndexError, ValueError):
            continue

    return None


def detect_moving_average_cross(df: pd.DataFrame) -> Optional[dict]:
    """Detect Golden Cross (bullish) or Death Cross (bearish) — 50 DMA vs 200 DMA."""
    if len(df) < SMA_LONG + 5:
        return None

    sma_short = calculate_sma(df, SMA_SHORT)
    sma_long = calculate_sma(df, SMA_LONG)

    # Check last 5 bars for a crossover
    for i in range(-5, 0):
        try:
            prev_short = float(sma_short.iloc[i - 1])
            curr_short = float(sma_short.iloc[i])
            prev_long = float(sma_long.iloc[i - 1])
            curr_long = float(sma_long.iloc[i])

            # Golden Cross: 50 DMA crosses above 200 DMA
            if prev_short <= prev_long and curr_short > curr_long:
                return {
                    "pattern": "Golden Cross",
                    "signal": "bullish",
                    "confidence": 75,
                    "sma_50": round(curr_short, 2),
                    "sma_200": round(curr_long, 2),
                    "description": (
                        f"50-day moving average (₹{round(curr_short, 2)}) crossed above "
                        f"200-day MA (₹{round(curr_long, 2)}) — a Golden Cross. "
                        f"Historically one of the strongest bullish signals, indicating a "
                        f"potential long-term uptrend."
                    ),
                }

            # Death Cross: 50 DMA crosses below 200 DMA
            if prev_short >= prev_long and curr_short < curr_long:
                return {
                    "pattern": "Death Cross",
                    "signal": "bearish",
                    "confidence": 75,
                    "sma_50": round(curr_short, 2),
                    "sma_200": round(curr_long, 2),
                    "description": (
                        f"50-day moving average (₹{round(curr_short, 2)}) crossed below "
                        f"200-day MA (₹{round(curr_long, 2)}) — a Death Cross. "
                        f"This is a significant bearish signal suggesting potential long-term downtrend."
                    ),
                }
        except (IndexError, ValueError):
            continue

    return None


def detect_breakout(df: pd.DataFrame) -> Optional[dict]:
    """Detect price breakout above resistance or below support."""
    sr = find_support_resistance(df)
    current_price = sr["current_price"]
    recent_volume = float(df["Volume"].tail(5).mean())
    avg_volume = float(df["Volume"].tail(30).mean())
    volume_ratio = recent_volume / avg_volume if avg_volume > 0 else 1

    # Check if price broke above recent resistance with volume
    if sr["resistance"] and volume_ratio > 1.3:
        # Find the closest resistance that was recently broken
        prev_closes = df["Close"].tail(10)
        for res in sr["resistance"]:
            broken_days = sum(1 for p in prev_closes if float(p) >= res)
            if broken_days >= 2 and broken_days <= 5:
                return {
                    "pattern": "Breakout Above Resistance",
                    "signal": "bullish",
                    "confidence": min(85, 60 + (volume_ratio - 1) * 15),
                    "resistance_level": res,
                    "volume_ratio": round(volume_ratio, 2),
                    "description": (
                        f"Price broke above key resistance at ₹{res} with "
                        f"{round(volume_ratio, 1)}x average volume — a confirmed breakout. "
                        f"Volume surge validates the move, suggesting strong buyer interest."
                    ),
                }

    # Check breakdown below support
    if sr["support"] and volume_ratio > 1.3:
        prev_closes = df["Close"].tail(10)
        for sup in sr["support"]:
            broken_days = sum(1 for p in prev_closes if float(p) <= sup)
            if broken_days >= 2 and broken_days <= 5:
                return {
                    "pattern": "Breakdown Below Support",
                    "signal": "bearish",
                    "confidence": min(85, 60 + (volume_ratio - 1) * 15),
                    "support_level": sup,
                    "volume_ratio": round(volume_ratio, 2),
                    "description": (
                        f"Price broke below key support at ₹{sup} with "
                        f"{round(volume_ratio, 1)}x average volume — a confirmed breakdown. "
                        f"Increased selling pressure suggests further downside risk."
                    ),
                }

    return None


def detect_volume_spike(df: pd.DataFrame) -> Optional[dict]:
    """Detect unusual volume spikes (>2x average)."""
    if len(df) < 30:
        return None

    avg_volume = float(df["Volume"].tail(30).mean())
    latest_volume = float(df["Volume"].iloc[-1])

    if avg_volume > 0 and latest_volume > avg_volume * 2:
        ratio = latest_volume / avg_volume
        price_change = float(df["Close"].iloc[-1] - df["Close"].iloc[-2])
        signal = "bullish" if price_change > 0 else "bearish"

        return {
            "pattern": "Unusual Volume Spike",
            "signal": signal,
            "confidence": min(70, 45 + ratio * 5),
            "volume_ratio": round(ratio, 2),
            "description": (
                f"Volume surged to {round(ratio, 1)}x the 30-day average "
                f"({'with price up' if price_change > 0 else 'with price down'} ₹{abs(round(price_change, 2))}). "
                f"Unusual volume often precedes significant price moves — "
                f"{'institutional buying interest likely' if price_change > 0 else 'heavy selling pressure detected'}."
            ),
        }

    return None


# ─── Main Scanner ─────────────────────────────────────────────────────

def scan_stock(ticker: str, df: pd.DataFrame) -> list[dict]:
    """
    Run all pattern detectors on a single stock.
    Returns a list of detected signals.
    """
    signals = []
    stock_name = ticker.replace(".NS", "")

    detectors = [
        detect_rsi_divergence,
        detect_macd_crossover,
        detect_moving_average_cross,
        detect_breakout,
        detect_volume_spike,
    ]

    for detector in detectors:
        try:
            result = detector(df)
            if result:
                result["ticker"] = ticker
                result["stock_name"] = stock_name
                result["current_price"] = round(float(df["Close"].iloc[-1]), 2)
                result["timestamp"] = str(df.index[-1])
                result["price_change_pct"] = round(
                    float((df["Close"].iloc[-1] - df["Close"].iloc[-2]) / df["Close"].iloc[-2] * 100), 2
                )

                # Add support/resistance context
                sr = find_support_resistance(df)
                result["support_levels"] = sr["support"]
                result["resistance_levels"] = sr["resistance"]

                signals.append(result)
        except Exception as e:
            print(f"[PatternEngine] Error in {detector.__name__} for {ticker}: {e}")

    return signals


def scan_all_stocks(stock_data: dict[str, pd.DataFrame]) -> list[dict]:
    """
    Scan all stocks and return a combined list of signals,
    sorted by confidence (highest first).
    """
    all_signals = []
    for ticker, df in stock_data.items():
        signals = scan_stock(ticker, df)
        all_signals.extend(signals)

    sorted_signals = sorted(all_signals, key=lambda x: x.get("confidence", 0), reverse=True)
    for sig in sorted_signals:
        if "confidence" in sig:
            sig["confidence"] = round(float(sig["confidence"]), 1)
    
    return sorted_signals


def get_technical_summary(df: pd.DataFrame) -> dict:
    """
    Get a full technical summary for a single stock,
    including all indicators and support/resistance.
    """
    rsi = calculate_rsi(df)
    macd_line, signal_line, histogram = calculate_macd(df)
    sma_50 = calculate_sma(df, 50)
    sma_200 = calculate_sma(df, 200)
    bb_upper, bb_middle, bb_lower = calculate_bollinger_bands(df)
    sr = find_support_resistance(df)

    current_price = float(df["Close"].iloc[-1])

    # 52w High / Low (approx 252 trading days)
    lookback = min(252, len(df))
    high52 = float(df["High"].tail(lookback).max())
    low52 = float(df["Low"].tail(lookback).min())

    # Vol vs Average (20 day average)
    vol_current = float(df["Volume"].iloc[-1])
    vol_avg = float(df["Volume"].tail(20).mean())
    vol_ratio = round(vol_current / vol_avg, 2) if vol_avg > 0 else 1.0

    return {
        "rsi": round(float(rsi.iloc[-1]), 2) if not rsi.isna().all() else None,
        "macd": round(float(macd_line.iloc[-1]), 3) if not macd_line.isna().all() else None,
        "macd_signal": round(float(signal_line.iloc[-1]), 3) if not signal_line.isna().all() else None,
        "macd_histogram": round(float(histogram.iloc[-1]), 3) if not histogram.isna().all() else None,
        "sma_50": round(float(sma_50.iloc[-1]), 2) if not sma_50.isna().all() else None,
        "sma_200": round(float(sma_200.iloc[-1]), 2) if not sma_200.isna().all() else None,
        "bollinger_upper": round(float(bb_upper.iloc[-1]), 2) if not bb_upper.isna().all() else None,
        "bollinger_lower": round(float(bb_lower.iloc[-1]), 2) if not bb_lower.isna().all() else None,
        "support_levels": sr["support"],
        "resistance_levels": sr["resistance"],
        "current_price": round(current_price, 2),
        "above_sma_50": current_price > float(sma_50.iloc[-1]) if not sma_50.isna().all() else None,
        "above_sma_200": current_price > float(sma_200.iloc[-1]) if not sma_200.isna().all() else None,
        "high52": round(high52, 2),
        "low52": round(low52, 2),
        "volRatio": vol_ratio,
    }
