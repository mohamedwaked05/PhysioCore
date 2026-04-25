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
        // Remove persisted credentials before navigating away.
        // Do NOT call setUser(null) here — it would trigger ProtectedRoute to
        // render <Navigate to="/login"> before window.location.href fires,
        // causing a /login flash. The full-page reload resets all React state
        // naturally from the now-empty localStorage.
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('pc-photo');
        // Revoke the token server-side in the background. Token is already gone
        // from localStorage so the request interceptor sends no Authorization
        // header; the 401 response is suppressed by the interceptor's hadToken
        // check (hadToken === false → no redirect).
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
