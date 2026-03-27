<div align="center">
  <br />
    <img src="frontend/public/Logo.png" alt="Saral Nivesh Logo" width="120" />
  <br />

  # Saral Nivesh
  **AI-Powered Financial Intelligence Layer for the Indian Retail Investor**
  <br />
  <br />
  
  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
  ![Groq LPUs](https://img.shields.io/badge/Groq-FF3D00?style=for-the-badge&logo=groq)
  ![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)

</div>

<br/>

## 🎯 The Vision
Most retail investors are flying blind—reacting to tips, missing critical filings, and struggling to read chart technicals. 

**Saral Nivesh** acts as the definitive intelligence layer that turns overwhelming market data into actionable, money-making decisions. We built a custom 5-Agent Pipeline that specifically identifies signals (not just news wrappers), translates difficult chart patterns into plain English, and mathematically filters alerts based on your specific portfolio holdings.

## ✨ Core Agentic Features

✅ **Opportunity Radar**
A fully autonomous multi-agent pipeline monitoring block deals, filings, and insider trades to mathematically calculate signals and surface hidden opportunities.

✅ **Chart Intelligence**
Live technical pattern engine (Breakouts, Reversal, RSI Divergences) mapped directly against a backtesting engine to output historical success rates for every pattern detection.

✅ **Ask ET (Portfolio-Aware Chat)**
A lightning-fast, localized LLM Agent interacting specifically with your mock portfolio context. Ask it about breaking news, and it mathematically predicts the P&L impact on your holdings.

✅ **Market TV (Floating Interface)**
Dynamic UI reels mapping real-time text-to-speech hooks to a Floating AI assistant. The Floating Agent uses localized RAG (Retrieval-Augmented Generation) against the live broadcast to answer questions flawlessly. 

✅ **Enterprise-Grade Audit Trail**
Not a generic hackathon prototype built to break. The backend logs a permanent SQLite trail `audit_log.db` tracking every hallucination, fallback state, LPU duration, LLM confidence score, and estimated API fractional cost.

---

## 🏗️ Architecture Stack
- **Frontend View**: React + Vite (Glassmorphic Design System, Framer Motion)
- **Backend Orchestrator**: FastAPI (Custom `State-Machine` Sequential Pipeline)
- **AI Models & Pricing**: Open-Source (Llama/Mixtral) routed through Groq LPUs for extreme latency optimization.

---

## ⚡ Quick Start Local Demo

### Prerequisites
Make sure you obtain a [Groq API Key](https://console.groq.com/).

### Backend Setup
```bash
# Clone the repository
git clone https://github.com/anishanandhan/Saral-Nivesh.git
cd Saral-Nivesh/backend

# Create virtual environment 
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env and place your key
echo "GROQ_API_KEY=your_key_here" > .env

# Start FastAPI server
python main.py
```

### Frontend Setup
```bash
# Open a second terminal window
cd Saral-Nivesh/frontend

# Install node dependencies
npm install

# Start development server
npm run dev
```
Navigate to `http://localhost:5173/` in your browser. (The `/login` gateway accepts ANY user credentials with a password >= 8 chars).

---

> *Built for the ET Gen AI Hackathon (Track 6: AI for the Indian Investor)*
