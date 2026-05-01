import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import '../styles/login.css';

/* ── Icons ──────────────────────────────────────────────────── */
function MailIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2.5"/>
            <polyline points="2,7 12,14 22,7"/>
        </svg>
    );
}

function LockIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2.5"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
    );
}

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

function MoonIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
        </svg>
    );
}

function SunIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="4"/>
            <line x1="12" y1="2" x2="12" y2="5"/>
            <line x1="12" y1="19" x2="12" y2="22"/>
            <line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/>
            <line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/>
            <line x1="2" y1="12" x2="5" y2="12"/>
            <line x1="19" y1="12" x2="22" y2="12"/>
            <line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/>
            <line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/>
        </svg>
    );
}

function CheckCircleIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
    );
}

function AlertCircleIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: '1px' }}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <circle cx="12" cy="16" r="0.6" fill="currentColor"/>
        </svg>
    );
}

/* ── Sidebar feature icons ──────────────────────────────────── */
function ChartLineIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
    );
}

function ShieldCheckIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L4 7v5c0 5 3.5 9.74 8 11 4.5-1.26 8-6 8-11V7l-8-5z"/>
            <polyline points="9 12 11 14 15 10"/>
        </svg>
    );
}

function UsersIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87"/>
            <path d="M16 3.13a4 4 0 010 7.75"/>
        </svg>
    );
}

/* ── Page component ─────────────────────────────────────────── */
export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname;

    const resetSuccess = location.state?.resetSuccess ?? false;
    const resetEmail   = location.state?.resetEmail   ?? '';

    const [form, setForm]               = useState({ email: resetEmail, password: '', remember: false });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError]             = useState('');
    const [loading, setLoading]         = useState(false);
    const [darkMode, setDarkMode]       = useState(() => localStorage.getItem('physiocore-theme') === 'dark');

    const toggleDark = () => {
        setDarkMode(prev => {
            const next = !prev;
            localStorage.setItem('physiocore-theme', next ? 'dark' : 'light');
            return next;
        });
    };

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
        const base = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
        window.location.href = `${base}/api/auth/google`;
    };

    return (
        <div className={`login-page${darkMode ? ' dark' : ''}`}>

            {/* ══════════ LEFT SIDEBAR ══════════ */}
            <aside className="lp-sidebar">
                {/* Animated background orbs */}
                <div className="lp-orb lp-orb-1" />
                <div className="lp-orb lp-orb-2" />
                <div className="lp-orb lp-orb-3" />
                <div className="lp-orb lp-orb-4" />

                <div className="lp-sidebar-content">
                    {/* Logo */}
                    <div className="lp-logo">
                        <div className="lp-logo-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M2 12h4l2-6 4 12 2-6h10" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" fill="none"/>
                            </svg>
                        </div>
                        <span className="lp-logo-text">PhysioCore</span>
                    </div>

                    {/* Headline */}
                    <h1 className="lp-headline">
                        Recover.<br /><em>Rebuild.</em><br />Thrive.
                    </h1>
                    <p className="lp-desc">
                        Your AI-powered rehabilitation companion — connecting patients and clinics for measurably better outcomes.
                    </p>

                    {/* Feature list */}
                    <div className="lp-features">
                        <div className="lp-feature">
                            <div className="lp-feature-icon"><ChartLineIcon /></div>
                            <div className="lp-feature-text">
                                <strong>Smart Progress Tracking</strong>
                                <span>Log pain and effort daily. Visualise your recovery in real time.</span>
                            </div>
                        </div>
                        <div className="lp-feature">
                            <div className="lp-feature-icon"><ShieldCheckIcon /></div>
                            <div className="lp-feature-text">
                                <strong>AI Safety Monitoring</strong>
                                <span>Rule-based AI flags unsafe patterns before they become problems.</span>
                            </div>
                        </div>
                        <div className="lp-feature">
                            <div className="lp-feature-icon"><UsersIcon /></div>
                            <div className="lp-feature-text">
                                <strong>Clinic Connect</strong>
                                <span>Find verified clinics and follow structured rehabilitation plans.</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="lp-stats">
                        <div className="lp-stat">
                            <span className="lp-stat-value">1,200+</span>
                            <span className="lp-stat-label">Patients</span>
                        </div>
                        <div className="lp-stat">
                            <span className="lp-stat-value">85</span>
                            <span className="lp-stat-label">Clinics</span>
                        </div>
                        <div className="lp-stat">
                            <span className="lp-stat-value">94%</span>
                            <span className="lp-stat-label">Recovery Rate</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ══════════ RIGHT FORM PANEL ══════════ */}
            <div className="lp-form-panel">
                {/* Dark / light mode toggle */}
                <button
                    className="lp-theme-toggle"
                    onClick={toggleDark}
                    aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                    title={darkMode ? 'Light mode' : 'Dark mode'}
                >
                    {darkMode ? <SunIcon /> : <MoonIcon />}
                </button>

                <div className="lp-card">
                    {/* Back button */}
                    <button className="lp-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                        Back
                    </button>

                    {/* Title */}
                    <h2 className="lp-title">
                        Welcome <span className="lp-title-accent">back</span>
                    </h2>
                    <p className="lp-subtitle">Sign in to continue your recovery journey.</p>

                    {/* Banners */}
                    {resetSuccess && (
                        <div className="lp-success-banner">
                            <CheckCircleIcon />
                            Password reset successfully — sign in with your new password.
                        </div>
                    )}
                    {error && (
                        <div className="lp-error-banner">
                            <AlertCircleIcon />
                            <span>
                                {error}
                                {error.includes('Forgot password') && (
                                    <> <Link to="/forgot-password" className="lp-error-link">Reset it here.</Link></>
                                )}
                            </span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="lp-field">
                            <label className="lp-label">Email address</label>
                            <div className="lp-input-wrap">
                                <span className="lp-input-icon"><MailIcon /></span>
                                <input
                                    className="lp-input"
                                    type="email"
                                    name="email"
                                    placeholder="you@example.com"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="lp-field">
                            <label className="lp-label">Password</label>
                            <div className="lp-input-wrap">
                                <span className="lp-input-icon"><LockIcon /></span>
                                <input
                                    className="lp-input has-right-icon"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                />
                                <button
                                    type="button"
                                    className="lp-eye-btn"
                                    onClick={() => setShowPassword(p => !p)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    <EyeIcon open={showPassword} />
                                </button>
                            </div>
                        </div>

                        <div className="lp-meta-row">
                            <label className="lp-checkbox-label">
                                <input
                                    className="lp-checkbox"
                                    type="checkbox"
                                    name="remember"
                                    checked={form.remember}
                                    onChange={handleChange}
                                />
                                Keep me signed in
                            </label>
                            <Link to="/forgot-password" className="lp-forgot-link">Forgot password?</Link>
                        </div>

                        <button className="lp-submit-btn" type="submit" disabled={loading}>
                            {loading && <Spinner />}
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <p className="lp-bottom-text">
                        Don't have an account? <Link to="/register">Register</Link>
                    </p>

                    <div className="lp-divider"><span>or continue with</span></div>

                    <button className="lp-google-btn" type="button" onClick={handleGoogle}>
                        <GoogleIcon />
                        Sign in with Google
                    </button>
                </div>
            </div>
        </div>
    );
}
