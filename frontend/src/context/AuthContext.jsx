import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

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
        if (!username.trim()) {
            return { success: false, error: 'Username cannot be empty.' };
        }
        if (password.length < 8) {
            return { success: false, error: 'Disclaimer: Password must be a minimum of 8 characters.' };
        }

        const userData = { username, loginTime: new Date().toISOString() };
        setUser(userData);
        localStorage.setItem('et_auth_user', JSON.stringify(userData));
        return { success: true };
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
