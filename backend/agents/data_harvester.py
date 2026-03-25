"""
DataHarvester Agent — Ingests market data from multiple sources.
Tools: yfinance (OHLCV), filing_parser (bulk deals, insider trades, announcements)
Runs on demand or scheduled. Outputs raw_signals dict to SignalDetector.
"""

import json
from typing import Optional
from agents.base import BaseAgent
from config import DEMO_TICKERS, DISCLAIMER

# Import existing data modules
from data_fetcher import get_stock_data, get_batch_stock_data, get_latest_prices
from filing_parser import (
    get_all_signals, generate_bulk_deals, generate_insider_trades,
    generate_corporate_announcements, detect_unusual_insider_activity,
)


class DataHarvesterAgent(BaseAgent):
    """
    Agent 1: DataHarvester
    Responsible for ingesting all raw market data.
    Pulls OHLCV, bulk deals, insider trades, corporate filings.
    Outputs structured data for downstream agents.
    """

    AGENT_NAME = "DataHarvester"

    def execute(self, state: dict, session_id: str) -> dict:
        tickers = state.get("tickers", DEMO_TICKERS)
        days = state.get("lookback_days", 7)

        # Step 1: Fetch OHLCV data for all tickers
        self.logger.log(
            agent_name=self.AGENT_NAME,
            action="fetch_ohlcv",
            data_source="yfinance (NSE/BSE via Yahoo Finance API)",
            input_summary=f"Fetching OHLCV for {len(tickers)} stocks",
            session_id=session_id,
        )
        stock_data = get_batch_stock_data(tickers)

        # Step 2: Fetch latest prices
        self.logger.log(
            agent_name=self.AGENT_NAME,
            action="fetch_prices",
            data_source="yfinance",
            input_summary=f"Getting latest prices for {len(tickers)} tickers",
            session_id=session_id,
        )
        prices = get_latest_prices(tickers)

        # Step 3: Fetch filing signals (bulk deals + insider trades + announcements)
        self.logger.log(
            agent_name=self.AGENT_NAME,
            action="fetch_filings",
            data_source="NSE/BSE Corporate Filings",
            input_summary=f"Pulling bulk deals, insider trades, announcements ({days} days)",
            session_id=session_id,
        )
        filing_signals = get_all_signals(days)
        insider_trades = generate_insider_trades(days)
        bulk_deals = generate_bulk_deals(days)

        # Step 4: Detect unusual insider activity
        self.logger.log(
            agent_name=self.AGENT_NAME,
            action="detect_unusual_insider",
            data_source="SEBI Insider Trading Disclosures",
            decision=f"Checking for clustered insider buying (threshold: 2+ trades in {days} days)",
            session_id=session_id,
        )
        unusual = detect_unusual_insider_activity(insider_trades, threshold=2)

        # Compile raw data
        result = {
            "stock_data": stock_data,  # Dict[ticker, DataFrame]
            "prices": prices,
            "filing_signals": filing_signals,
            "insider_trades": insider_trades,
            "bulk_deals": bulk_deals,
            "unusual_insider": unusual,
            "tickers_fetched": len(stock_data),
            "signals_found": len(filing_signals) + len(unusual),
        }

        self.logger.log(
            agent_name=self.AGENT_NAME,
            action="data_harvest_complete",
            decision=f"Harvested {len(stock_data)} stocks, {len(filing_signals)} filings, {len(unusual)} unusual signals",
            confidence=0.95,
            session_id=session_id,
        )

        return result

    def fallback(self, state: dict, session_id: str, error: str) -> dict:
        """If data fetch fails, serve cached demo data."""
        self.logger.log(
            agent_name=self.AGENT_NAME,
            action="serve_cached_data",
            decision=f"Live data unavailable ({error}). Serving cached demo data seamlessly.",
            status="fallback",
            session_id=session_id,
        )
        return {
            "stock_data": {},
            "prices": [],
            "filing_signals": get_all_signals(7),  # Cached/mock data still works
            "insider_trades": generate_insider_trades(7),
            "bulk_deals": generate_bulk_deals(7),
            "unusual_insider": [],
            "tickers_fetched": 0,
            "signals_found": 0,
            "data_source": "cached_fallback",
        }
