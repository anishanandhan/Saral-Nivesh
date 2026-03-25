import { useState, useRef, useEffect } from 'react';
import {
    MessageSquare, Send, Sparkles, User, Bot, Lightbulb,
    AlertTriangle, ExternalLink
} from 'lucide-react';
import './AskET.css';

const API_BASE = 'http://localhost:8000';

const SUGGESTIONS = [
    "Which Nifty 50 stocks had insider buying this week?",
    "Is Reliance in a breakout?",
    "Compare HDFC Bank vs ICICI Bank technically",
    "What are the key support levels for TCS?",
    "Show me stocks with RSI below 30",
    "Which sectors are showing strength this month?",
];

const WELCOME_MESSAGE = {
    role: 'assistant',
    content: `Welcome to **Ask ET**! I'm your personal AI stock market assistant. 🇮🇳

I speak plain English, not confusing finance jargon. I can help you understand:
- **Your Portfolio Ideas** — Share your portfolio, and I'll tell you if recent news affects it
- **Simplifying Data** — "What does this new RBI rule actually mean for my bank stocks?"
- **Finding Signals** — "Which big companies saw insider buying this week?"
- **Chart Patterns** — "Is Reliance looking good to buy right now?"

I use a team of specialized AI agents to scan **live NSE/BSE data** and read official documents for you. Try asking me a question!`,
    sources: [],
    ai_powered: true,
};

export default function AskET() {
    const [messages, setMessages] = useState([WELCOME_MESSAGE]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSend = async (query = input) => {
        if (!query.trim() || isTyping) return;

        const userMsg = { role: 'user', content: query.trim() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const res = await fetch(`${API_BASE}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: query.trim() }),
            });
            const data = await res.json();

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response || 'Sorry, I couldn\'t generate a response.',
                sources: data.sources || [],
                ai_powered: data.ai_powered || false,
            }]);
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '⚠️ Failed to connect to the backend. Make sure the server is running on port 8000.',
                sources: [],
                ai_powered: false,
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="ask-page">
            <div className="container">
                <div className="chat-layout">
                    {/* Sidebar */}
                    <aside className="chat-sidebar">
                        <div className="sidebar-header">
                            <MessageSquare size={18} />
                            <span>Ask ET</span>
                        </div>

                        <div className="sidebar-section">
                            <h4 className="sidebar-label">Suggested Questions</h4>
                            <div className="suggestion-list">
                                {SUGGESTIONS.map((s, i) => (
                                    <button key={i} className="suggestion-btn" onClick={() => handleSend(s)}>
                                        <Lightbulb size={12} />
                                        <span>{s}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="sidebar-section">
                            <h4 className="sidebar-label">Behind the Scenes: AI Agents</h4>
                            <div className="source-list">
                                <div className="source-item"><span className="source-dot live"></span> DataHarvester Agent (Live NSE Data)</div>
                                <div className="source-item"><span className="source-dot live"></span> ContextEnricher Agent (News & Filings)</div>
                                <div className="source-item"><span className="source-dot live"></span> PortfolioPersonaliser Agent</div>
                                <div className="source-item"><span className="source-dot live"></span> Llama 3.3 70B (Reasoning Engine)</div>
                            </div>
                        </div>

                        <div className="sidebar-disclaimer">
                            <AlertTriangle size={12} />
                            <span>Not financial advice. For educational purposes only.</span>
                        </div>
                    </aside>

                    {/* Chat Area */}
                    <div className="chat-main">
                        <div className="chat-header">
                            <div className="chat-header-info">
                                <Sparkles size={18} className="chat-header-icon" />
                                <div>
                                    <h2>Ask ET — Your Personal Market Assistant</h2>
                                    <span>Powered by Multi-Agent AI System • Live NSE/BSE Data</span>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="chat-messages">
                            {messages.map((msg, i) => (
                                <div key={i} className={`chat-message ${msg.role}`}>
                                    <div className="message-avatar">
                                        {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                    </div>
                                    <div className="message-content">
                                        <div className="message-header">
                                            <span className="message-role">
                                                {msg.role === 'user' ? 'You' : 'Ask ET'}
                                            </span>
                                            {msg.ai_powered && (
                                                <span className="ai-badge">
                                                    <Sparkles size={10} /> AI
                                                </span>
                                            )}
                                        </div>
                                        <div className="message-text" dangerouslySetInnerHTML={{
                                            __html: formatMarkdown(msg.content)
                                        }} />
                                        {msg.sources && msg.sources.length > 0 && (
                                            <div className="message-sources">
                                                <span className="sources-label">📎 Verify Sources:</span>
                                                {msg.sources.map((src, j) => {
                                                    const name = typeof src === 'string' ? src : src.name;
                                                    const url = typeof src === 'string' ? null : src.url;
                                                    return url ? (
                                                        <a key={j} className="source-tag source-link" href={url}
                                                            target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink size={10} />
                                                            {name}
                                                        </a>
                                                    ) : (
                                                        <span key={j} className="source-tag">
                                                            <ExternalLink size={10} />
                                                            {name}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="chat-message assistant">
                                    <div className="message-avatar"><Bot size={16} /></div>
                                    <div className="message-content">
                                        <div className="typing-indicator">
                                            <span></span><span></span><span></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input */}
                        <div className="chat-input-area">
                            <div className="chat-input-wrapper">
                                <textarea
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder='Ask about Indian markets... e.g. "Is Reliance in a breakout?"'
                                    rows={1}
                                    disabled={isTyping}
                                />
                                <button className="send-btn" onClick={() => handleSend()}
                                    disabled={!input.trim() || isTyping}>
                                    <Send size={18} />
                                </button>
                            </div>
                            <div className="input-footer">
                                <span>Ask ET uses Groq AI. Verify important info. Not financial advice.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function formatMarkdown(text) {
    return text
        // Convert markdown links [text](url) to clickable <a> tags
        .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="inline-source-link">$1 ↗</a>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '<br /><br />')
        .replace(/\n- /g, '<br />• ')
        .replace(/\n\|/g, '<br />|')
        .replace(/\n/g, '<br />');
}
