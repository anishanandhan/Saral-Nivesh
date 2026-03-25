import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Radar, TrendingUp, MessageSquare, Zap, Menu, X, PlayCircle, BookOpen, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import './Navbar.css';

export default function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    const links = [
        { path: '/', label: 'Home', icon: Zap },
        { path: '/radar', label: 'Opportunity Radar', icon: Radar },
        { path: '/charts', label: 'Chart Intelligence', icon: TrendingUp },
        { path: '/ask', label: 'Ask ET', icon: MessageSquare },
        { path: '/learn', label: 'Learn', icon: BookOpen },
        { path: '/demo', label: 'Judge Testing', icon: PlayCircle },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-inner container">
                <Link to="/" className="navbar-brand">
                    <div className="brand-icon">
                        <Zap size={20} />
                    </div>
                    <div className="brand-text">
                        <span className="brand-name">Opportunity Radar</span>
                        <span className="brand-sub">by ET Markets</span>
                    </div>
                </Link>

                <div className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
                    {links.map(({ path, label, icon: Icon }) => (
                        <Link
                            key={path}
                            to={path}
                            className={`nav-link ${location.pathname === path ? 'active' : ''}`}
                            onClick={() => setMobileOpen(false)}
                        >
                            <Icon size={16} />
                            <span>{label}</span>
                        </Link>
                    ))}
                </div>

                <div className="navbar-actions">
                    <ThemeToggle />
                    <div className="live-indicator">
                        <span className="live-dot"></span>
                        <span>LIVE</span>
                    </div>
                    <button className="logout-btn" onClick={handleLogout} title="Sign out">
                        <LogOut size={16} />
                    </button>
                    <button
                        className="mobile-toggle"
                        onClick={() => setMobileOpen(!mobileOpen)}
                    >
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>
        </nav>
    );
}
