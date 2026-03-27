# How to Run the Project

## Prerequisites
- **Python 3.10+** (with `pip`)
- **Node.js 18+** (with `npm`)

## Quick Start

### 1. Backend Server

```bash
cd backend

# Create virtual environment (first time only)
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Start the server
python main.py


The backend runs at **http://localhost:8000**

### 2. Frontend App

Open a new terminal:

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

The frontend runs at **http://localhost:5173**

### 3. Open the Application

Navigate to **http://localhost:5173** in your browser.

## Key Pages

| Page | URL | What it does |
|------|-----|-------------|
| Home | `/` | Landing page |
| Opportunity Radar | `/radar` | Live signal detection dashboard |
| Chart Intelligence | `/charts` | Technical charting with AI |
| **AI Co-Pilot** | **`/ask`** | **Agentic Dashboard (Scout → Quant → Translator)** |
| Learn | `/learn` | Educational content |
| Judge Testing | `/demo` | Hackathon scenario testing |

## Environment Setup

Create a `.env` file in the `backend/` directory:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_BASE_URL=https://api.groq.com/openai/v1
```

Get a free API key from [console.groq.com](https://console.groq.com).
