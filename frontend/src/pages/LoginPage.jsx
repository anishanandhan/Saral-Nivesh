import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
    const { isLoggedIn, login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    if (isLoggedIn) {
        return <Navigate to="/" replace />;
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        const result = login(username, password);
        if (!result.success) {
            setError(result.error);
        }
    };

    return (
        <div className="login-page">
            <div className="login-particles">
                {[...Array(8)].map((_, i) => <div key={i} className="particle" />)}
            </div>
            <div className="login-card">
                <div className="login-brand">
                    <div className="login-logo">OR</div>
                    <div className="login-brand-name">Opportunity Radar</div>
                    <div className="login-brand-sub">ET AI Investor</div>
                </div>
                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <input
                            className="form-input"
                            type="text"
                            placeholder="Enter username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            className="form-input"
                            type="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    {error && (
                        <div className="login-error">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}
                    <button type="submit" className="login-btn">
                        <LogIn size={18} />
                        Sign In
                    </button>
                </form>
                <div className="login-hint">
                    <div className="login-hint-label">Demo Credentials</div>
                    <div className="login-hint-creds">demo / demo123</div>
                </div>
            </div>
        </div>
    );
}
