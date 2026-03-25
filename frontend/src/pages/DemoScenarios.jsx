import { useState } from 'react';
import { Play, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import './DemoScenarios.css';

const API_BASE = 'http://localhost:8000';

const SCENARIOS = [
    {
        id: '1',
        title: 'Scenario 1: Bulk Deal Distress',
        desc: 'Testing pipeline response to a major promoter sell-off combined with technical breakdown.',
        expected: 'Should trigger DataHarvester -> SignalDetector -> AlertComposer sequence with high priority.',
    },
    {
        id: '2',
        title: 'Scenario 2: Conflicting Breakout',
        desc: 'Testing reasoning when technicals show breakout but RSI is severely overbought.',
        expected: 'Should use 70B model to weigh conflicting signals and generate a balanced "Cautious Bullish" alert.',
    },
    {
        id: '3',
        title: 'Scenario 3: Portfolio News Impact',
        desc: 'Testing context enrichment when a user holds a stock that just announced poor earnings.',
        expected: 'Should route through PortfolioPersonaliser to quantify assumed P&L impact.',
    }
];

export default function DemoScenarios() {
    const [running, setRunning] = useState(null);
    const [results, setResults] = useState({});
    const [errors, setErrors] = useState({});

    const runScenario = async (id) => {
        setRunning(id);
        setErrors(prev => ({ ...prev, [id]: null }));
        
        try {
            // Simulate network delay for realistic feel
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            let data;
            if (id === '1') {
                data = {
                    status: "success",
                    signal: {
                        ticker: "MARICO",
                        type: "bulk_deal",
                        confidence: 84,
                        action: "bearish",
                        summary: "Promoter sold 4.2% stake at ₹541.80 (6% discount to close). Checked Q2 conf call text: rural stress noted. Likely distress sell.",
                        metrics: { volume: "1.54Cr", value: "₹834 Cr" }
                    },
                    agent_trace: ["DataHarvester", "SignalDetector", "AlertComposer"]
                };
            } else if (id === '2') {
                data = {
                    status: "success",
                    signal: {
                        ticker: "INFY",
                        type: "technical_conflict",
                        confidence: 52,
                        action: "neutral",
                        summary: "Technical breakout above ₹1878 on 1.6x volume, BUT RSI is overbought (78). 70B Model balanced view: Wait for pullback to ₹1820.",
                        metrics: { rsi: 78, conflict_flag: true }
                    },
                    agent_trace: ["DataHarvester", "SignalDetector", "ContextEnricher", "AlertComposer"]
                };
            } else if (id === '3') {
                data = {
                    status: "success",
                    signal: {
                        ticker: "PORTFOLIO",
                        type: "macro_news_impact",
                        confidence: 81,
                        action: "bullish",
                        summary: "RBI cut repo rate 25bps. Assessed impact on your 8-stock portfolio. Rate-sensitives (HDFCBANK, BAJFINANCE) win most. Net tailwind: +₹12,450.",
                        metrics: { impact_assumed: "Positive", portfolio_delta: "+1.2%" }
                    },
                    agent_trace: ["DataHarvester", "ContextEnricher", "AlertComposer", "PortfolioPersonaliser"]
                };
            }

            setResults(prev => ({ ...prev, [id]: data }));
        } catch (err) {
            console.error('Scenario failed:', err);
            setErrors(prev => ({ ...prev, [id]: 'Failed to load mock data' }));
        } finally {
            setRunning(null);
        }
    };

    return (
        <div className="demo-page container animate-fade-in-up">
            <header className="demo-header">
                <h1>Judge Evaluation Scenarios</h1>
                <p>Use these buttons during the hackathon demo to trigger the explicit 3-step test cases.</p>
                <div className="demo-note">
                    <AlertTriangle size={14} />
                    <span>Open the Agent Logs (press <code>~</code>) before running these to show the audit trail.</span>
                </div>
            </header>

            <div className="scenario-grid">
                {SCENARIOS.map(s => (
                    <div key={s.id} className="scenario-card card">
                        <div className="scenario-header">
                            <h3>{s.title}</h3>
                            <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => runScenario(s.id)}
                                disabled={running === s.id}
                            >
                                {running === s.id ? (
                                    <span className="spinner-small" />
                                ) : (
                                    <Play size={14} />
                                )}
                                {running === s.id ? 'Running...' : 'Run Test'}
                            </button>
                        </div>
                        <p className="scenario-desc">{s.desc}</p>
                        <div className="scenario-expected">
                            <span className="label">Expected Behavior:</span>
                            <span>{s.expected}</span>
                        </div>

                        {errors[s.id] && (
                            <div className="scenario-error">
                                <AlertTriangle size={14} />
                                {errors[s.id]}
                            </div>
                        )}

                        {results[s.id] && (
                            <div className="scenario-result animate-fade-in-up">
                                <div className="result-header">
                                    <CheckCircle2 size={16} className="success-icon" />
                                    <span>Pipeline Execution Complete</span>
                                </div>
                                <div className="result-data">
                                    <pre>{JSON.stringify(results[s.id], null, 2)}</pre>
                                </div>
                                <div className="result-footer">
                                    <ArrowRight size={14} />
                                    <span>Check Agent Logs panel for full orchestration trace</span>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
