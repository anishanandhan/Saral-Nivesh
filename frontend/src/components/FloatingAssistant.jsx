import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2 } from 'lucide-react';
import './FloatingAssistant.css';

const API_BASE = 'http://localhost:8000';

export default function FloatingAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'ai', content: "Hi! I'm your Market AI. Ask me anything about the live updates on screen or the market in general!" }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMsg = { role: 'user', content: inputValue };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE}/api/assistant/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: userMsg.content,
                    history: messages
                })
            });

            const data = await response.json();
            setMessages(prev => [...prev, { role: 'ai', content: data.response }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', content: "I'm having trouble connecting right now. Please try again!" }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="floating-assistant-wrapper">
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        className="fa-panel"
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                        {/* Header */}
                        <div className="fa-header">
                            <div className="fa-header-info">
                                <img src="/AI.png" alt="AI Agent" className="fa-avatar-small" onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/8649/8649592.png"; }} />
                                <div>
                                    <h4>Ask ET AI</h4>
                                    <span className="fa-status"><span className="fa-status-dot"></span> Live Observer</span>
                                </div>
                            </div>
                            <button className="fa-close-btn" onClick={() => setIsOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Chat History */}
                        <div className="fa-messages">
                            {messages.map((msg, i) => (
                                <div key={i} className={`fa-message-row ${msg.role === 'user' ? 'fa-user-row' : 'fa-ai-row'}`}>
                                    <div className={`fa-message-bubble ${msg.role === 'user' ? 'fa-user-bubble' : 'fa-ai-bubble'}`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="fa-message-row fa-ai-row">
                                    <div className="fa-message-bubble fa-ai-bubble fa-loading">
                                        <Loader2 size={16} className="fa-spinner" />
                                        <span>Thinking...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="fa-input-area">
                            <input 
                                type="text"
                                placeholder="Why is the market going down?"
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                                disabled={isLoading}
                            />
                            <button 
                                className="fa-send-btn" 
                                onClick={handleSend}
                                disabled={!inputValue.trim() || isLoading}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Toggle Button */}
            <motion.button 
                className="fa-toggle-btn"
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
            >
                <img src="/AI.png" alt="Ask AI" onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/8649/8649592.png"; }} />
            </motion.button>
        </div>
    );
}

