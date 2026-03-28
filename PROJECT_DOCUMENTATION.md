# Saral Nivesh: Project Documentation

## 1. Executive Summary

**Saral Nivesh** acts as the definitive intelligence layer that turns overwhelming market data into actionable, money-making decisions for the Indian retail investor. Moving beyond simple news wrappers, the platform employs a custom **Multi-Agent Pipeline** to identify signals, translate complex chart patterns into plain English, and mathematically filter alerts based on a user's specific portfolio holdings.

---

## 2. Core Features

### 2.1 Opportunity Radar
A fully autonomous multi-agent pipeline monitoring real-time market activity:
- Detects block deals, corporate filings, and unusual insider trades.
- Mathematically calculates signals to surface hidden market opportunities.
- Continuously runs pattern recognition algorithms to identify trading breakouts, reversals, and RSI divergences across major NSE indices.

### 2.2 Chart Intelligence (Backtested Patterns)
Live technical charting mapped directly against an internal backtesting engine.
- Every pattern detection provides historical success rates for higher confidence.
- Provides support, resistance, and moving average mapping instantly.

### 2.3 Ask ET / Multi-Agent Co-Pilot
A conversational interface backed by the **Scout → Quant → Translator** pipeline:
- **Scout Agent:** Fetches live OHLCV data, news sentiments, and current pricing.
- **Quant Agent:** Detects algorithmic patterns (MACD, RSI momentum) and moving average trends.
- **Translator Agent (Groq / Llama 3.3 70B):** Generates structured explanations, confidence scores, beginner terminology glossaries, and P&L impact on user portfolios.

### 2.4 Market TV
Dynamic UI reels mapping real-time text-to-speech hooks to a Floating AI assistant. The Floating Agent uses localized RAG against the live broadcast to answer questions flawlessly.

### 2.5 My Portfolio & Gamification
- Live tracking of holdings, real-time portfolio P&L updates.
- Deep integration with context: Ask ET responds to market news with direct mathematical insights on how your portfolio is specifically impacted.
- Educational features with "Learn" center and integrated terminology explanations.

---

## 3. Technical Architecture

The platform follows a robust decoupling of a modern React interface calling an orchestrating AI backend server:

- **Frontend View:** React + Vite, built with glassmorphic UI components, dynamic framer-motion animations, and specialized data visualization via Lightweight Charts.
- **Backend Orchestrator:** FastAPI (Python 3.10+), functioning as a `State-Machine` sequential pipeline.
- **AI Models & Pricing Engine:** Llama 3.3 70B (and other open-source models) routed via Groq LPUs for extreme latency optimization, capable of sub-second reasoning and JSON parsing.
- **Audit Logging:** SQLite-backed `audit_log.db` tracking every hallucination check, LLM confidence score, execution duration, and fractional API cost.

---

## 4. Backend Application Structure

Located in the `/backend` directory, the FastAPI server drives the AI logic:

### Key Modules:
- **`main.py`:** Restful entry point for all API requests (signal tracking, portfolio impact, chat proxying, chart rendering data).
- **`grok_ai.py`:** Connects to Groq LPUs, structures standard LLM calls into predictable JSON responses for robust frontend rendering.
- **`pattern_engine.py`:** Core technical engine checking for classical TA signals (RSI divergencies, MACD crossovers, Support/Resistance zones).
- **`backtester.py`:** Historical event correlator mapping the `pattern_engine` discoveries to past historical success/failure rates.
- **`data_fetcher.py` / `filing_parser.py`:** Live scraping and data aggregation from Yahoo Finance, NSE sources, and structured filing repositories.
- **`agents/`:** Encapsulates the multi-agent routing sequences (Orchestrator).
- **`scenarios/`:** Specific predefined evaluation paths (e.g., Bulk Deal Distress, Conflicting Breakouts) for Judge Demo presentations.

---

## 5. Frontend Application Structure

Located in the `/frontend` directory, navigating the investor using React Router:

### Key Directories:
- **`src/pages/`:** 
  - `OpportunityRadar.jsx`: High-density data grid displaying live market signals.
  - `ChartIntelligence.jsx`: Lightweight charting visuals displaying pattern annotations.
  - `AskET.jsx`: Chat-like conversational interface for the multi-agent runner.
  - `Learn.jsx`: Structured learning material for beginners viewing market fundamentals.
  - `MyPortfolio.jsx`: Personal investment dashboard for mock portfolio monitoring.
- **`src/components/`:**
  - `TickerTape.jsx`: Continuous live scrolling marquee providing split-second NSE/BSE updates.
  - `FloatingAssistant.jsx`: On-the-fly conversational agent accessible globally.
  - `AgentLogPanel.jsx`: Debug and transparency drawer revealing the underlying thoughts of the Scout, Quant, and Translator agents.
- **`src/context/`:**
  - Standardized state management for Authentication, User Portfolio, Gamification streaks, and Theme Management.

---

## 6. Enterprise-Grade Audit Trail

Saral Nivesh leaves no room for silent failures. The Enterprise-grade Audit Trail is an automated tracker ensuring AI consistency.
- **Cost Analysis:** Tracks LPU consumption per token.
- **Confidence Rating:** Aborts or warns users heavily if the model's confidence ranking falls below defined safety levels.
- **Hallucination Fallback:** Implements programmatic overrides if structural JSON fails formatting criteria during parsing.

---

## 7. Future Roadmap

1. **Brokerage Integration (OAuth):** Moving beyond mock portfolios to live Zerodha/Upstox connections.
2. **Push Notifications:** WebSocket alerts firing immediately when the radar detects high-confidence portfolio impact patterns.
3. **Advanced Market TV Video Engine:** Generating seamless multi-scene video outputs using more complex WebGL implementations and dynamic scene transitions.
4. **Community Benchmarks:** Implementing social layer logic to allow followers checking top investor agent-actions.
