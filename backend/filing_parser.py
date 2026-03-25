"""
Corporate Filing Parser
Generates realistic mock data for BSE bulk deals, insider trades,
and corporate announcements. In production, this would scrape
BSE/NSE websites.

NOTE: For the hackathon demo, we use realistic mock data based on
actual NSE/BSE filing patterns. The scraper structure is production-ready
and can be connected to live data sources.
"""

import random
from datetime import datetime, timedelta
from typing import Optional


# ─── Realistic Mock Data Generators ──────────────────────────────────

STOCK_NAMES = {
    "RELIANCE.NS": {"name": "Reliance Industries", "sector": "Oil & Gas / Conglomerate"},
    "TCS.NS": {"name": "Tata Consultancy Services", "sector": "IT Services"},
    "HDFCBANK.NS": {"name": "HDFC Bank", "sector": "Banking"},
    "INFY.NS": {"name": "Infosys", "sector": "IT Services"},
    "ICICIBANK.NS": {"name": "ICICI Bank", "sector": "Banking"},
    "ITC.NS": {"name": "ITC Limited", "sector": "FMCG"},
    "SBIN.NS": {"name": "State Bank of India", "sector": "Banking"},
    "BHARTIARTL.NS": {"name": "Bharti Airtel", "sector": "Telecom"},
    "TATAMOTORS.NS": {"name": "Tata Motors", "sector": "Automobile"},
    "BAJFINANCE.NS": {"name": "Bajaj Finance", "sector": "NBFC"},
    "SUNPHARMA.NS": {"name": "Sun Pharma", "sector": "Pharmaceuticals"},
    "WIPRO.NS": {"name": "Wipro", "sector": "IT Services"},
    "LT.NS": {"name": "Larsen & Toubro", "sector": "Infrastructure"},
    "AXISBANK.NS": {"name": "Axis Bank", "sector": "Banking"},
    "MARUTI.NS": {"name": "Maruti Suzuki", "sector": "Automobile"},
}

PROMOTER_NAMES = [
    "Mukesh D. Ambani", "Nita M. Ambani", "Anant M. Ambani",
    "Ratan N. Tata Family Trust", "N. Chandrasekaran",
    "Sashidhar Jagdishan", "Salil Parekh", "Sandeep Bakhshi",
    "Sanjiv Puri", "Dinesh Kumar Khara",
    "Gopalakrishnan Subramaniam", "Thierry Delaporte",
    "S.N. Subrahmanyan", "Amitabh Chaudhry", "Kenichi Ayukawa",
]

INSTITUTIONS = [
    "Goldman Sachs India", "Morgan Stanley Asia", "JP Morgan Chase",
    "Vanguard Emerging Markets", "BlackRock India Fund",
    "SBI Mutual Fund", "HDFC Mutual Fund", "ICICI Prudential MF",
    "Nippon India MF", "Kotak Mahindra MF",
    "Abu Dhabi Investment Authority", "GIC Singapore",
    "Norway Government Pension Fund", "Fidelity International",
    "Capital Group", "T. Rowe Price",
]


def generate_bulk_deals(days_back: int = 7) -> list[dict]:
    """Generate realistic bulk deal data mimicking NSE/BSE disclosures."""
    deals = []
    base_date = datetime.now()

    sample_deals = [
        {"ticker": "RELIANCE.NS", "buyer": "Goldman Sachs India", "seller": "Open Market",
         "qty": 2500000, "price": 2847.50, "deal_type": "Buy"},
        {"ticker": "TATAMOTORS.NS", "buyer": "Morgan Stanley Asia", "seller": "Promoter Group Entity",
         "qty": 4200000, "price": 987.30, "deal_type": "Buy"},
        {"ticker": "SBIN.NS", "buyer": "Abu Dhabi Investment Authority", "seller": "Open Market",
         "qty": 8500000, "price": 832.15, "deal_type": "Buy"},
        {"ticker": "ITC.NS", "buyer": "Open Market", "seller": "British American Tobacco",
         "qty": 15000000, "price": 465.20, "deal_type": "Sell"},
        {"ticker": "INFY.NS", "buyer": "Vanguard Emerging Markets", "seller": "Open Market",
         "qty": 3800000, "price": 1876.40, "deal_type": "Buy"},
        {"ticker": "HDFCBANK.NS", "buyer": "SBI Mutual Fund", "seller": "Open Market",
         "qty": 1200000, "price": 1678.90, "deal_type": "Buy"},
        {"ticker": "BAJFINANCE.NS", "buyer": "Open Market", "seller": "Fidelity International",
         "qty": 950000, "price": 7234.60, "deal_type": "Sell"},
        {"ticker": "SUNPHARMA.NS", "buyer": "ICICI Prudential MF", "seller": "Open Market",
         "qty": 2100000, "price": 1567.80, "deal_type": "Buy"},
        {"ticker": "BHARTIARTL.NS", "buyer": "GIC Singapore", "seller": "Open Market",
         "qty": 5600000, "price": 1723.45, "deal_type": "Buy"},
        {"ticker": "LT.NS", "buyer": "Capital Group", "seller": "Open Market",
         "qty": 1800000, "price": 3456.70, "deal_type": "Buy"},
    ]

    for i, deal in enumerate(sample_deals):
        deal_date = base_date - timedelta(days=random.randint(0, days_back))
        value_cr = round((deal["qty"] * deal["price"]) / 10000000, 2)  # Value in crores
        stock_info = STOCK_NAMES.get(deal["ticker"], {"name": deal["ticker"], "sector": "Unknown"})

        deals.append({
            "id": f"BD-{1000 + i}",
            "signal_type": "bulk_deal",
            "ticker": deal["ticker"],
            "stock_name": stock_info["name"],
            "sector": stock_info["sector"],
            "buyer": deal["buyer"],
            "seller": deal["seller"],
            "quantity": deal["qty"],
            "price": deal["price"],
            "value_crores": value_cr,
            "deal_type": deal["deal_type"],
            "date": deal_date.strftime("%Y-%m-%d"),
            "timestamp": deal_date.isoformat(),
            "signal": "bullish" if deal["deal_type"] == "Buy" else "bearish",
            "confidence": random.randint(60, 85),
            "ai_summary": _generate_bulk_deal_summary(deal, stock_info, value_cr),
        })

    return sorted(deals, key=lambda x: x["date"], reverse=True)


def generate_insider_trades(days_back: int = 14) -> list[dict]:
    """Generate realistic insider trading disclosure data."""
    trades = []
    base_date = datetime.now()

    sample_trades = [
        {"ticker": "RELIANCE.NS", "insider": "Mukesh D. Ambani", "role": "Promoter & Chairman",
         "action": "Acquisition", "qty": 500000, "price": 2852.30},
        {"ticker": "INFY.NS", "insider": "Salil Parekh", "role": "CEO & MD",
         "action": "Acquisition", "qty": 75000, "price": 1880.50},
        {"ticker": "TCS.NS", "insider": "K. Krithivasan", "role": "CEO & MD",
         "action": "Disposal", "qty": 25000, "price": 4125.80},
        {"ticker": "HDFCBANK.NS", "insider": "Sashidhar Jagdishan", "role": "CEO & MD",
         "action": "Acquisition", "qty": 100000, "price": 1685.20},
        {"ticker": "ICICIBANK.NS", "insider": "Sandeep Bakhshi", "role": "CEO & MD",
         "action": "Acquisition", "qty": 150000, "price": 1245.60},
        {"ticker": "TATAMOTORS.NS", "insider": "N. Chandrasekaran", "role": "Chairman",
         "action": "Acquisition", "qty": 200000, "price": 992.40},
        {"ticker": "BAJFINANCE.NS", "insider": "Rajiv Jain", "role": "MD",
         "action": "Disposal", "qty": 35000, "price": 7280.10},
        {"ticker": "ITC.NS", "insider": "Sanjiv Puri", "role": "CMD",
         "action": "Acquisition", "qty": 300000, "price": 468.90},
        {"ticker": "SBIN.NS", "insider": "Dinesh Kumar Khara", "role": "Chairman",
         "action": "Acquisition", "qty": 180000, "price": 836.75},
        {"ticker": "SUNPHARMA.NS", "insider": "Dilip Shanghvi", "role": "Promoter & MD",
         "action": "Acquisition", "qty": 400000, "price": 1572.30},
        {"ticker": "RELIANCE.NS", "insider": "Anant M. Ambani", "role": "Director",
         "action": "Acquisition", "qty": 250000, "price": 2860.10},
        {"ticker": "RELIANCE.NS", "insider": "Nita M. Ambani", "role": "Director",
         "action": "Acquisition", "qty": 300000, "price": 2855.40},
    ]

    for i, trade in enumerate(sample_trades):
        trade_date = base_date - timedelta(days=random.randint(0, days_back))
        value_cr = round((trade["qty"] * trade["price"]) / 10000000, 2)
        stock_info = STOCK_NAMES.get(trade["ticker"], {"name": trade["ticker"], "sector": "Unknown"})

        trades.append({
            "id": f"IT-{2000 + i}",
            "signal_type": "insider_trade",
            "ticker": trade["ticker"],
            "stock_name": stock_info["name"],
            "sector": stock_info["sector"],
            "insider_name": trade["insider"],
            "insider_role": trade["role"],
            "action": trade["action"],
            "quantity": trade["qty"],
            "price": trade["price"],
            "value_crores": value_cr,
            "date": trade_date.strftime("%Y-%m-%d"),
            "timestamp": trade_date.isoformat(),
            "signal": "bullish" if trade["action"] == "Acquisition" else "bearish",
            "confidence": random.randint(65, 90),
            "ai_summary": _generate_insider_summary(trade, stock_info, value_cr),
        })

    return sorted(trades, key=lambda x: x["date"], reverse=True)


def generate_corporate_announcements(days_back: int = 7) -> list[dict]:
    """Generate realistic corporate announcement data."""
    announcements = []
    base_date = datetime.now()

    sample = [
        {"ticker": "RELIANCE.NS", "type": "Quarterly Results",
         "headline": "Q3 FY26 — Revenue up 12.4% YoY, PAT beats estimates by ₹1,200 Cr",
         "signal": "bullish", "impact": "high"},
        {"ticker": "TCS.NS", "type": "Quarterly Results",
         "headline": "Q3 FY26 — Deal wins at $12.2B TCV, margins expand 80bps",
         "signal": "bullish", "impact": "high"},
        {"ticker": "INFY.NS", "type": "Management Commentary",
         "headline": "CFO raises FY26 revenue growth guidance to 4.5-5.0% from 3.5-4.0%",
         "signal": "bullish", "impact": "high"},
        {"ticker": "HDFCBANK.NS", "type": "Regulatory",
         "headline": "RBI approves HDFC Bank's revised priority sector lending plan",
         "signal": "neutral", "impact": "medium"},
        {"ticker": "TATAMOTORS.NS", "type": "Corporate Action",
         "headline": "Board approves demerger of CV business into separate listed entity",
         "signal": "bullish", "impact": "high"},
        {"ticker": "ITC.NS", "type": "Corporate Action",
         "headline": "Hotels business demerger effective date set for Q2 FY27",
         "signal": "neutral", "impact": "medium"},
        {"ticker": "BAJFINANCE.NS", "type": "Quarterly Results",
         "headline": "Q3 FY26 — AUM grows 26% YoY, NPA rises marginally to 0.95%",
         "signal": "neutral", "impact": "medium"},
        {"ticker": "BHARTIARTL.NS", "type": "Regulatory",
         "headline": "Airtel completes 5G rollout across all 22 telecom circles",
         "signal": "bullish", "impact": "medium"},
        {"ticker": "SBIN.NS", "type": "Quarterly Results",
         "headline": "Q3 FY26 — Net profit up 28% YoY, asset quality improves to 0.58% GNPA",
         "signal": "bullish", "impact": "high"},
        {"ticker": "SUNPHARMA.NS", "type": "Corporate Action",
         "headline": "Board approves ₹2,500 Cr capex for new API manufacturing facility",
         "signal": "bullish", "impact": "medium"},
    ]

    for i, ann in enumerate(sample):
        ann_date = base_date - timedelta(days=random.randint(0, days_back))
        stock_info = STOCK_NAMES.get(ann["ticker"], {"name": ann["ticker"], "sector": "Unknown"})

        announcements.append({
            "id": f"CA-{3000 + i}",
            "signal_type": "corporate_announcement",
            "ticker": ann["ticker"],
            "stock_name": stock_info["name"],
            "sector": stock_info["sector"],
            "announcement_type": ann["type"],
            "headline": ann["headline"],
            "date": ann_date.strftime("%Y-%m-%d"),
            "timestamp": ann_date.isoformat(),
            "signal": ann["signal"],
            "impact": ann["impact"],
            "confidence": random.randint(55, 85),
            "ai_summary": _generate_announcement_summary(ann, stock_info),
        })

    return sorted(announcements, key=lambda x: x["date"], reverse=True)


def get_all_signals(days_back: int = 7) -> list[dict]:
    """Get all signals combined: bulk deals + insider trades + announcements."""
    signals = []
    signals.extend(generate_bulk_deals(days_back))
    signals.extend(generate_insider_trades(days_back * 2))
    signals.extend(generate_corporate_announcements(days_back))
    return sorted(signals, key=lambda x: x["date"], reverse=True)


def detect_unusual_insider_activity(trades: list[dict], threshold: int = 3) -> list[dict]:
    """
    Flag stocks with unusual insider buying activity.
    Threshold: stocks with >= N insider trades in the last 7 days.
    """
    from collections import defaultdict
    stock_trades = defaultdict(list)

    cutoff = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")

    for trade in trades:
        if trade["date"] >= cutoff and trade["action"] == "Acquisition":
            stock_trades[trade["ticker"]].append(trade)

    unusual = []
    for ticker, ticker_trades in stock_trades.items():
        if len(ticker_trades) >= threshold:
            total_value = sum(t["value_crores"] for t in ticker_trades)
            stock_info = STOCK_NAMES.get(ticker, {"name": ticker, "sector": "Unknown"})

            unusual.append({
                "id": f"UA-{hash(ticker) % 10000}",
                "signal_type": "unusual_insider_activity",
                "ticker": ticker,
                "stock_name": stock_info["name"],
                "sector": stock_info["sector"],
                "trade_count": len(ticker_trades),
                "total_value_crores": round(total_value, 2),
                "insiders": [t["insider_name"] for t in ticker_trades],
                "signal": "bullish",
                "confidence": min(95, 70 + len(ticker_trades) * 5),
                "date": max(t["date"] for t in ticker_trades),
                "timestamp": max(t["timestamp"] for t in ticker_trades),
                "ai_summary": (
                    f"🚨 UNUSUAL ACTIVITY: {len(ticker_trades)} insider purchases in {stock_info['name']} "
                    f"over the last 7 days totaling ₹{round(total_value, 2)} Cr. "
                    f"Insiders: {', '.join(set(t['insider_name'] for t in ticker_trades))}. "
                    f"Clustered insider buying at this scale often precedes positive catalysts."
                ),
            })

    return sorted(unusual, key=lambda x: x["trade_count"], reverse=True)


# ─── AI Summary Generators (template-based) ──────────────────────────

def _generate_bulk_deal_summary(deal: dict, stock_info: dict, value_cr: float) -> str:
    if deal["deal_type"] == "Buy":
        return (
            f"📊 {deal['buyer']} acquired {deal['qty']:,} shares of {stock_info['name']} "
            f"at ₹{deal['price']} (₹{value_cr} Cr total). Institutional buying at this scale "
            f"signals strong conviction. {stock_info['sector']} sector exposure being built."
        )
    else:
        return (
            f"📊 {deal['seller']} sold {deal['qty']:,} shares of {stock_info['name']} "
            f"at ₹{deal['price']} (₹{value_cr} Cr total). Large block sale may create "
            f"short-term selling pressure, but could be portfolio rebalancing."
        )


def _generate_insider_summary(trade: dict, stock_info: dict, value_cr: float) -> str:
    if trade["action"] == "Acquisition":
        return (
            f"👤 {trade['insider']} ({trade['role']}) bought {trade['qty']:,} shares "
            f"of {stock_info['name']} at ₹{trade['price']} (₹{value_cr} Cr). "
            f"Insider buying by senior management is one of the strongest bullish signals — "
            f"they know the company best."
        )
    else:
        return (
            f"👤 {trade['insider']} ({trade['role']}) sold {trade['qty']:,} shares "
            f"of {stock_info['name']} at ₹{trade['price']} (₹{value_cr} Cr). "
            f"While insider selling can be for personal reasons, it's worth monitoring "
            f"if it coincides with other bearish signals."
        )


def _generate_announcement_summary(ann: dict, stock_info: dict) -> str:
    return (
        f"📰 {stock_info['name']} — {ann['type']}: {ann['headline']}. "
        f"Impact assessment: {ann['impact'].upper()}. "
        f"This {ann['signal']} development could influence near-term price action."
    )
