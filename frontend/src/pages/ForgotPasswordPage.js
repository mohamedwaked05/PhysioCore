import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
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

function MailSentIcon() {
    return (
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2.5" stroke="var(--primary)" strokeWidth="1.6"/>
            <polyline points="2,7 12,14 22,7" stroke="var(--primary)" strokeWidth="1.6"/>
            <circle cx="18.5" cy="17.5" r="4" fill="#22c55e"/>
            <polyline points="16.5 17.5 18 19 21 16.5" stroke="white" strokeWidth="1.8"/>
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
                    Locked<br />out? <em>No</em><br />worries.
                </h1>
                <p className="lp-desc">
                    We'll send a secure reset link to your inbox so you can get back to your recovery in seconds.
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
export default function ForgotPasswordPage() {
    const navigate = useNavigate();

    const [email, setEmail]     = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent]       = useState(false);
    const [error, setError]     = useState('');
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('physiocore-theme') === 'dark');

    const toggleDark = () => {
        setDarkMode(prev => {
            const next = !prev;
            localStorage.setItem('physiocore-theme', next ? 'dark' : 'light');
            return next;
        });
    };

    // Listen for reset-complete broadcast → forward to login
    useEffect(() => {
        if (!sent) return;
        let ch;
        try {
            ch = new BroadcastChannel('physiocore_password_reset');
            ch.onmessage = (e) => {
                if (e.data?.type === 'PASSWORD_RESET') {
                    ch.close();
                    navigate('/login', {
                        state: { resetEmail: e.data.email, resetSuccess: true },
                        replace: true,
                    });
                }
            };
        } catch (_) {}
        return () => ch?.close();
    }, [sent, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setSent(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

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

    /* ── Email sent screen ─────────────────────────────────── */
    if (sent) {
        return (
            <div className={`login-page${darkMode ? ' dark' : ''}`}>
                <Sidebar />
                <div className="lp-form-panel">
                    {themeToggle}
                    <div className="lp-card">
                        <div className="lp-verify-wrap">
                            <div className="lp-verify-icon-wrap">
                                <MailSentIcon />
                            </div>
                            <h2 className="lp-verify-title">Check your inbox</h2>
                            <p className="lp-verify-desc">
                                We sent a password reset link to{' '}
                                <span className="lp-verify-email-chip">{email}</span>
                                .<br />Click the link in the email to set a new password.
                            </p>
                            <p className="lp-verify-note">
                                Didn't receive it? Check your spam folder.
                            </p>
                            <p style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                                <Link to="/login" className="lp-forgot-link">Back to sign in →</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Request form ──────────────────────────────────────── */
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
                        Forgot <span className="lp-title-accent">password?</span>
                    </h2>
                    <p className="lp-subtitle">Enter your email and we'll send you a reset link.</p>

                    {error && (
                        <div className="lp-error-banner">
                            <AlertCircleIcon />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="lp-field">
                            <label className="lp-label">Email address</label>
                            <div className="lp-input-wrap">
                                <span className="lp-input-icon"><MailIcon /></span>
                                <input
                                    className="lp-input"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button className="lp-submit-btn" type="submit" disabled={loading} style={{ marginTop: '0.25rem' }}>
                            {loading && <Spinner />}
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>

                    <p className="lp-bottom-text">
                        Remember your password? <Link to="/login">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
