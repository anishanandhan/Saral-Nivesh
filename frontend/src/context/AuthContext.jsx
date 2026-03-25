import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const VALID_CREDENTIALS = { username: 'demo', password: 'demo123' };

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('et_auth_user');
        if (stored) {
            try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
        }
        setIsLoading(false);
    }, []);

    const login = (username, password) => {
        if (username === VALID_CREDENTIALS.username && password === VALID_CREDENTIALS.password) {
            const userData = { username, loginTime: new Date().toISOString() };
            setUser(userData);
            localStorage.setItem('et_auth_user', JSON.stringify(userData));
            return { success: true };
        }
        return { success: false, error: 'Invalid username or password' };
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('et_auth_user');
    };

    return (
        <AuthContext.Provider value={{ user, isLoggedIn: !!user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
