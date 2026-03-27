import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LogIn, AlertCircle, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import './LoginPage.css';

export default function LoginPage() {
    const { isLoggedIn, login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (isLoggedIn) {
        return <Navigate to="/home" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        
        // Add artificial delay for a premium feedback feel
        setTimeout(() => {
            const result = login(username, password);
            if (!result.success) {
                setError(result.error);
                setIsSubmitting(false);
            }
        }, 800);
    };

    return (
        <div className="login-wrapper">
            {/* Animated Ambient Background */}
            <div className="ambient-bg">
                <div className="ambient-blob blob-orange"></div>
                <div className="ambient-blob blob-teal"></div>
                <div className="ambient-blob blob-purple"></div>
                <div className="ambient-grid"></div>
            </div>

            <motion.div 
                className="login-container"
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, cubicBezier: [0.16, 1, 0.3, 1] }}
            >
                <div className="login-header">
                    <motion.img 
                        src="/Logo.png"
                        alt="Saral Nivesh Logo"
                        className="login-main-logo"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.2, type: 'spring', stiffness: 200 }}
                        style={{ width: '1000px', height: '200px', objectFit: 'contain', marginBottom: '-50px', borderRadius: '16px' }}
                    />
                    <h1 className="login-title">Saral Nivesh</h1>
                    <p className="login-subtitle">AI-Powered Financial Intelligence</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Username</label>
                        <div className="input-wrapper">
                            <input
                                type="text"
                                placeholder="Enter any username"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                            <input
                                type="password"
                                placeholder="Min. 8 characters allowed"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div 
                                className="error-banner"
                                initial={{ opacity: 0, height: 0, y: -10 }}
                                animate={{ opacity: 1, height: 'auto', y: 0 }}
                                exit={{ opacity: 0, height: 0, y: -10 }}
                            >
                                <div className="error-banner-content">
                                    <AlertCircle size={18} />
                                    <span>{error}</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button 
                        type="submit" 
                        className={`submit-btn ${isSubmitting ? 'loading' : ''}`}
                        disabled={isSubmitting}
                    >
                        <span className="btn-text">
                            {isSubmitting ? 'Authenticating...' : 'Secure Authorization'}
                            {!isSubmitting && <LogIn size={18} className="btn-icon" />}
                        </span>
                        {isSubmitting && <div className="btn-loader"></div>}
                    </button>
                    
                    <div className="secure-badge">
                        <ShieldCheck size={14} />
                        <span>Encrypted Session • Any Username Enabled</span>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
