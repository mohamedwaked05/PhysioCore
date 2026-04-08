import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Spinner from '../components/Spinner';
import '../styles/login.css';

/* ── Icons ──────────────────────────────────────────────────── */
function PersonIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="7" r="4"/>
            <path d="M4 21v-1a8 8 0 0116 0v1"/>
        </svg>
    );
}

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

function ClientRoleIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="7" r="4"/>
            <path d="M4 21v-1a8 8 0 0116 0v1"/>
            <path d="M8 14.5s1 1.5 4 1.5 4-1.5 4-1.5" opacity="0.5"/>
        </svg>
    );
}

function ClinicRoleIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21V7l9-4 9 4v14"/>
            <rect x="9" y="13" width="6" height="8"/>
            <path d="M10 6h4M12 4v4"/>
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

/* ── Shared sidebar ─────────────────────────────────────────── */
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
                    Start your<br /><em>recovery</em><br />today.
                </h1>
                <p className="lp-desc">
                    Join thousands of patients and clinics using AI-powered rehabilitation to achieve better, safer outcomes.
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
export default function RegisterPage() {
    const navigate  = useNavigate();
    const location  = useLocation();
    const { login } = useAuth();
    const initRole  = location.state?.role ?? 'client';

    const [form, setForm] = useState({
        first_name: '', last_name: '', email: '',
        password: '', password_confirmation: '', role: initRole,
    });
    const [errors, setErrors]         = useState({});
    const [loading, setLoading]       = useState(false);
    const [success, setSuccess]       = useState('');
    const [showPass, setShowPass]     = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [darkMode, setDarkMode]     = useState(() => localStorage.getItem('physiocore-theme') === 'dark');

    const toggleDark = () => {
        setDarkMode(prev => {
            const next = !prev;
            localStorage.setItem('physiocore-theme', next ? 'dark' : 'light');
            return next;
        });
    };

    // Listen for email verification broadcast → auto-login
    useEffect(() => {
        if (!success) return;
        let ch;
        try {
            ch = new BroadcastChannel('physiocore_verification');
            ch.onmessage = (e) => {
                if (e.data?.type === 'EMAIL_VERIFIED') {
                    ch.close();
                    login(e.data.user, e.data.token);
                    const role = e.data.user?.role;
                    if (role === 'clinic')      navigate('/clinic/dashboard', { replace: true });
                    else if (role === 'client') navigate('/client/dashboard', { replace: true });
                    else                        navigate('/dashboard',        { replace: true });
                }
            };
        } catch (_) {}
        return () => ch?.close();
    }, [success, login, navigate]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setLoading(true);
        try {
            const res = await api.post('/auth/register', form);
            setSuccess(res.data.message);
            setTimeout(() => navigate('/login'), 4000);
        } catch (err) {
            setErrors(err.response?.data?.errors || { general: ['Registration failed.'] });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = () => {
        window.location.href = 'http://127.0.0.1:8000/api/auth/google';
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

    /* ── Verification sent screen ──────────────────────────── */
    if (success) {
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
                                We sent a verification link to{' '}
                                <span className="lp-verify-email-chip">{form.email}</span>
                                .<br />Click the link to activate your account and get started.
                            </p>
                            <p className="lp-verify-note">
                                Redirecting to sign in shortly...
                            </p>
                            <p style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                                <Link to="/login" className="lp-forgot-link">Go to sign in →</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Registration form ─────────────────────────────────── */
    return (
        <div className={`login-page${darkMode ? ' dark' : ''}`}>
            <Sidebar />

            <div className="lp-form-panel">
                {themeToggle}

                <div className="lp-card">
                    {/* Back */}
                    <button className="lp-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                        Back
                    </button>

                    {/* Title */}
                    <h2 className="lp-title">
                        Create <span className="lp-title-accent">account</span>
                    </h2>
                    <p className="lp-subtitle">Join PhysioCore and start your recovery journey.</p>

                    {/* General error */}
                    {errors.general && (
                        <div className="lp-error-banner">
                            <AlertCircleIcon />
                            <span>{errors.general[0]}</span>
                        </div>
                    )}

                    {/* Google sign up */}
                    <button className="lp-google-btn" type="button" onClick={handleGoogle} style={{ marginBottom: '1.1rem' }}>
                        <GoogleIcon />
                        Sign up with Google
                    </button>

                    <div className="lp-divider"><span>or sign up with email</span></div>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        {/* Name row */}
                        <div className="lp-name-row">
                            <div className="lp-field">
                                <label className="lp-label">First name</label>
                                <div className="lp-input-wrap">
                                    <span className="lp-input-icon"><PersonIcon /></span>
                                    <input
                                        className="lp-input"
                                        type="text"
                                        name="first_name"
                                        placeholder="Jane"
                                        value={form.first_name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                {errors.first_name && <p className="lp-field-error">{errors.first_name[0]}</p>}
                            </div>
                            <div className="lp-field">
                                <label className="lp-label">Last name</label>
                                <div className="lp-input-wrap">
                                    <span className="lp-input-icon"><PersonIcon /></span>
                                    <input
                                        className="lp-input"
                                        type="text"
                                        name="last_name"
                                        placeholder="Smith"
                                        value={form.last_name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                {errors.last_name && <p className="lp-field-error">{errors.last_name[0]}</p>}
                            </div>
                        </div>

                        {/* Email */}
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
                            {errors.email && <p className="lp-field-error">{errors.email[0]}</p>}
                        </div>

                        {/* Password */}
                        <div className="lp-field">
                            <label className="lp-label">Password</label>
                            <div className="lp-input-wrap">
                                <span className="lp-input-icon"><LockIcon /></span>
                                <input
                                    className="lp-input has-right-icon"
                                    type={showPass ? 'text' : 'password'}
                                    name="password"
                                    placeholder="Min. 8 characters"
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                />
                                <button type="button" className="lp-eye-btn" onClick={() => setShowPass(p => !p)} aria-label={showPass ? 'Hide password' : 'Show password'}>
                                    <EyeIcon open={showPass} />
                                </button>
                            </div>
                            {errors.password && <p className="lp-field-error">{errors.password[0]}</p>}
                        </div>

                        {/* Confirm password */}
                        <div className="lp-field">
                            <label className="lp-label">Confirm password</label>
                            <div className="lp-input-wrap">
                                <span className="lp-input-icon"><LockIcon /></span>
                                <input
                                    className="lp-input has-right-icon"
                                    type={showConfirm ? 'text' : 'password'}
                                    name="password_confirmation"
                                    placeholder="Repeat your password"
                                    value={form.password_confirmation}
                                    onChange={handleChange}
                                    required
                                />
                                <button type="button" className="lp-eye-btn" onClick={() => setShowConfirm(p => !p)} aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                                    <EyeIcon open={showConfirm} />
                                </button>
                            </div>
                        </div>

                        {/* Role */}
                        <div className="lp-field">
                            <label className="lp-label">I am a</label>
                            <div className="lp-role-picker">
                                <button
                                    type="button"
                                    className={`lp-role-card${form.role === 'client' ? ' active' : ''}`}
                                    onClick={() => setForm(f => ({ ...f, role: 'client' }))}
                                >
                                    <div className="lp-role-card-icon"><ClientRoleIcon /></div>
                                    <span className="lp-role-card-title">Client</span>
                                    <span className="lp-role-card-desc">Patient seeking rehab</span>
                                </button>
                                <button
                                    type="button"
                                    className={`lp-role-card${form.role === 'clinic' ? ' active' : ''}`}
                                    onClick={() => setForm(f => ({ ...f, role: 'clinic' }))}
                                >
                                    <div className="lp-role-card-icon"><ClinicRoleIcon /></div>
                                    <span className="lp-role-card-title">Clinic</span>
                                    <span className="lp-role-card-desc">Healthcare provider</span>
                                </button>
                            </div>
                            {errors.role && <p className="lp-field-error">{errors.role[0]}</p>}
                        </div>

                        <button className="lp-submit-btn" type="submit" disabled={loading} style={{ marginTop: '0.25rem' }}>
                            {loading && <Spinner />}
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    <p className="lp-bottom-text">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
