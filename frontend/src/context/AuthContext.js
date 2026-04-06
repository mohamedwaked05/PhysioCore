import { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });

    const login = (userData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        // Clear state first so the 401 interceptor won't redirect to /login
        // if the server rejects an already-expired token.
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('pc-photo');
        setUser(null);
        // Fire the server-side token revocation in the background (no-auth header
        // since we already removed the token, so ignore any response).
        api.post('/auth/logout').catch(() => {});
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
