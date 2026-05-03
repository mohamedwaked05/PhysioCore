import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Spinner from '../components/Spinner';
import '../styles/login.css';

/* ── Icons ──────────────────────────────────────────────────── */
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

function AlertCircleIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: '1px' }}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <circle cx="12" cy="16" r="0.6" fill="currentColor"/>
        </svg>
    );
}

function CheckBigIcon() {
    return (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" stroke="#22c55e" strokeWidth="1.6"/>
            <polyline points="8 12 11 15 16 9"/>
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

/* ── Sidebar ────────────────────────────────────────────────── */
function Sidebar() {
    return (
        <aside className="lp-sidebar">
            <div className="lp-orb lp-orb-1" />
            <div className="lp-orb lp-orb-2" />
            <div className="lp-orb lp-orb-3" />
            <div className="lp-orb lp-orb-4" />

            <div className="lp-sidebar-content">
                <div className="lp-logo">
                    <div className="lp-logo-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M2 12h4l2-6 4 12 2-6h10" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" fill="none"/>
                        </svg>
                    </div>
                    <span className="lp-logo-text">PhysioCore</span>
                </div>

                <h1 className="lp-headline">
                    Recover<br /><em>smarter,</em><br />not harder.
                </h1>
                <p className="lp-desc">
                    Set a new password and pick up your recovery exactly where you left off.
                </p>

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
    );
}

/* ── Page component ─────────────────────────────────────────── */
export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm]   = useState(false);
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [success, setSuccess]     = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [darkMode, setDarkMode]   = useState(() => localStorage.getItem('physiocore-theme') === 'dark');

    const token = searchParams.get('token');
    const email = searchParams.get('email');

    const toggleDark = () => {
        setDarkMode(prev => {
            const next = !prev;
            localStorage.setItem('physiocore-theme', next ? 'dark' : 'light');
            return next;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});
        setLoading(true);
        try {
            await api.post('/auth/reset-password', {
                token, email, password,
                password_confirmation: passwordConfirmation,
            });
            setSuccess(true);

            try {
                const ch = new BroadcastChannel('physiocore_password_reset');
                ch.postMessage({ type: 'PASSWORD_RESET', email });
                ch.close();
            } catch (_) {}
        } catch (err) {
            const data = err.response?.data;
            if (data?.errors) setFieldErrors(data.errors);
            else setError(data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!success) return;
        let secs = 5;
        const tick = setInterval(() => {
            secs -= 1;
            setCountdown(secs);
            if (secs <= 0) {
                clearInterval(tick);
                window.close();
            }
        }, 1000);
        return () => clearInterval(tick);
    }, [success]);

    if (!token || !email) {
        navigate('/login');
        return null;
    }

    const themeToggle = (
        <button
            className="lp-theme-toggle"
            onClick={toggleDark}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={darkMode ? 'Light mode' : 'Dark mode'}
        >
            {darkMode ? <SunIcon /> : <MoonIcon />}
        </button>
    );

    if (success) {
        return (
            <div className={`login-page${darkMode ? ' dark' : ''}`}>
                <Sidebar />
                <div className="lp-form-panel">
                    {themeToggle}
                    <div className="lp-card">
                        <div className="lp-verify-wrap">
                            <div className="lp-verify-icon-wrap">
                                <CheckBigIcon />
                            </div>
                            <h2 className="lp-verify-title">Password reset!</h2>
                            <p className="lp-verify-desc">
                                Your password has been updated. Your previous tab will take you to sign in.
                            </p>
                            <p className="lp-verify-note">
                                This tab closes in {countdown}s…
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`login-page${darkMode ? ' dark' : ''}`}>
            <Sidebar />

            <div className="lp-form-panel">
                {themeToggle}

                <div className="lp-card">
                    <button className="lp-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                        Back
                    </button>

                    <h2 className="lp-title">
                        Reset <span className="lp-title-accent">password</span>
                    </h2>
                    <p className="lp-subtitle">Enter your new password below.</p>

                    {error && (
                        <div className="lp-error-banner">
                            <AlertCircleIcon />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="lp-field">
                            <label className="lp-label">New password</label>
                            <div className="lp-input-wrap">
                                <span className="lp-input-icon"><LockIcon /></span>
                                <input
                                    className="lp-input has-right-icon"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Min 8 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
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
                            {fieldErrors.password && <p className="lp-field-error">{fieldErrors.password[0]}</p>}
                        </div>

                        <div className="lp-field">
                            <label className="lp-label">Confirm new password</label>
                            <div className="lp-input-wrap">
                                <span className="lp-input-icon"><LockIcon /></span>
                                <input
                                    className="lp-input has-right-icon"
                                    type={showConfirm ? 'text' : 'password'}
                                    placeholder="Repeat your password"
                                    value={passwordConfirmation}
                                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="lp-eye-btn"
                                    onClick={() => setShowConfirm(p => !p)}
                                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                                >
                                    <EyeIcon open={showConfirm} />
                                </button>
                            </div>
                        </div>

                        <button className="lp-submit-btn" type="submit" disabled={loading} style={{ marginTop: '0.25rem' }}>
                            {loading && <Spinner />}
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
