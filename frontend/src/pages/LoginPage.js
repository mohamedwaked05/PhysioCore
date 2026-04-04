import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import AuthSidebar from '../components/AuthSidebar';
import Spinner from '../components/Spinner';
import '../styles/auth.css';

function EyeIcon({ open }) {
    return open ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>
    ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
    );
}

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.6-8 19.6-20 0-1.3-.1-2.7-.4-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7l-6.5 5C9.5 39.6 16.3 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.5l6.2 5.2C40.9 35.4 44 30.1 44 24c0-1.3-.1-2.7-.4-4z"/>
        </svg>
    );
}

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname;

    const [form, setForm] = useState({ email: '', password: '', remember: false });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm({ ...form, [e.target.name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/auth/login', form);
            const { user, token } = res.data;
            login(user, token);
            if (from) {
                navigate(from, { replace: true });
            } else if (user.role === 'client') {
                navigate('/client/dashboard');
            } else if (user.role === 'clinic') {
                navigate('/clinic/dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            const msg = err.response?.data?.errors?.email?.[0]
                || err.response?.data?.message
                || 'Login failed.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = () => {
        window.location.href = 'http://127.0.0.1:8000/api/auth/google';
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
            <AuthSidebar />

            <main className="auth-form-panel">
                <div className="auth-form-container">
                    <p className="auth-form-subtitle">
                        Your recovery continues here.
                    </p>

                    {error && <div className="auth-error-banner">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="auth-field">
                            <label className="auth-label">Email address</label>
                            <div className="auth-input-wrap">
                                <input
                                    className="auth-input"
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="auth-field">
                            <label className="auth-label">Password</label>
                            <div className="auth-input-wrap">
                                <input
                                    className="auth-input has-icon"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                />
                                <button
                                    type="button"
                                    className="auth-eye-btn"
                                    onClick={() => setShowPassword(p => !p)}
                                >
                                    <EyeIcon open={showPassword} />
                                </button>
                            </div>
                        </div>

                        <div className="auth-remember-row">
                            <label className="auth-checkbox-label">
                                <input
                                    className="auth-checkbox"
                                    type="checkbox"
                                    name="remember"
                                    checked={form.remember}
                                    onChange={handleChange}
                                />
                                Keep me logged in
                            </label>
                            <Link to="/forgot-password" className="auth-forgot-link">Forgot password?</Link>
                        </div>

                        <button className="auth-submit-btn" type="submit" disabled={loading}>
                            {loading && <Spinner />}
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <p className="auth-bottom-text" style={{ marginBottom: '1rem' }}>
                        Don't have an account? <Link to="/register">Register</Link>
                    </p>

                    <div className="auth-divider"><span>or sign in with Google</span></div>

                    <button className="auth-google-btn" type="button" onClick={handleGoogle}>
                        <GoogleIcon />
                        Sign in with Google
                    </button>
                </div>
            </main>
            </div>
        </div>
    );
}
