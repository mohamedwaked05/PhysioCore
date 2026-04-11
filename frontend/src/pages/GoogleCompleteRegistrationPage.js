import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Spinner from '../components/Spinner';
import PhoneInput from '../components/ui/PhoneInput';
import '../styles/login.css';

const PAYMENT_OPTIONS = ['Whish', 'OMT', 'BOB', 'Cash'];

/* ── Icons ──────────────────────────────────────────────────── */
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

function InfoIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
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

/* ── File upload field ──────────────────────────────────────── */
function FileUploadField({ label, file, onChange, accept, hint, error }) {
    const inputRef = useRef(null);
    return (
        <div className="lp-field">
            <label className="lp-label">{label}</label>
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files[0]; if (f) onChange(f); e.target.value = ''; }}
            />
            <button
                type="button"
                className={`lp-file-btn${file ? ' has-file' : ''}${error ? ' error' : ''}`}
                onClick={() => inputRef.current.click()}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    {file
                        ? <polyline points="20 6 9 17 4 12"/>
                        : <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>
                    }
                </svg>
                <span className="lp-file-name">{file ? file.name : hint}</span>
            </button>
            {error && <p className="lp-field-error">{error}</p>}
        </div>
    );
}

/* ── Sidebar ────────────────────────────────────────────────── */
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
                    Almost<br /><em>there.</em>
                </h1>
                <p className="lp-desc">
                    One last step — tell us who you are and your account will be ready to go.
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
export default function GoogleCompleteRegistrationPage() {
    const [searchParams] = useSearchParams();
    const navigate       = useNavigate();
    const { login }      = useAuth();

    const [step, setStep]                          = useState(1);
    const [role, setRole]                          = useState('client');
    const [password, setPassword]                  = useState('');
    const [passwordConfirmation, setPasswordConf]  = useState('');
    const [showPass, setShowPass]                  = useState(false);
    const [showConfirm, setShowConfirm]            = useState(false);
    const [clinicExtra, setClinicExtra]            = useState({
        phone: '', payment_methods: [], license_file: null, cert_file: null,
    });
    const [clinicErrors, setClinicErrors]          = useState({});
    const [loading, setLoading]                    = useState(false);
    const [error, setError]                        = useState('');
    const [fieldErrors, setFieldErrors]            = useState({});
    const [success, setSuccess]                    = useState(false);
    const [darkMode, setDarkMode]                  = useState(() => localStorage.getItem('physiocore-theme') === 'dark');

    const setupToken = searchParams.get('setup_token');

    const toggleDark = () => {
        setDarkMode(prev => {
            const next = !prev;
            localStorage.setItem('physiocore-theme', next ? 'dark' : 'light');
            return next;
        });
    };

    // Listen for the verification broadcast → auto-login
    useEffect(() => {
        if (!success) return;
        let ch;
        try {
            ch = new BroadcastChannel('physiocore_verification');
            ch.onmessage = (e) => {
                if (e.data?.type === 'EMAIL_VERIFIED') {
                    ch.close();
                    login(e.data.user, e.data.token);
                    const r = e.data.user?.role;
                    if (r === 'clinic')      navigate('/clinic/dashboard',  { replace: true });
                    else if (r === 'client') navigate('/client/dashboard',  { replace: true });
                    else                     navigate('/dashboard',          { replace: true });
                }
            };
        } catch (_) {}
        return () => ch?.close();
    }, [success, login, navigate]);

    if (!setupToken) {
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
                                We sent a verification link to your email address.<br />
                                Click it to activate your account and go straight to your dashboard.
                            </p>
                            {role === 'clinic' && (
                                <p className="lp-verify-note" style={{ color: 'var(--primary)', fontWeight: 500 }}>
                                    Your clinic details have been submitted for admin review.
                                </p>
                            )}
                            <p className="lp-verify-note">Waiting for verification...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Step 1 — Role + optional password ─────────────────── */
    const handleStep1 = (e) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});
        if (role === 'clinic') {
            setStep(2);
        } else {
            submitForm({});
        }
    };

    /* ── Step 2 — Clinic details ────────────────────────────── */
    const handleStep2 = (e) => {
        e.preventDefault();
        const errs = {};
        if (!clinicExtra.phone)                       errs.phone           = 'Phone number is required.';
        if (clinicExtra.payment_methods.length === 0) errs.payment_methods = 'Select at least one payment method.';
        if (!clinicExtra.license_file)                errs.license_file    = 'License document is required.';
        if (!clinicExtra.cert_file)                   errs.cert_file       = 'Certification document is required.';
        if (Object.keys(errs).length > 0) { setClinicErrors(errs); return; }
        setClinicErrors({});
        submitForm(clinicExtra);
    };

    /* ── Submission ─────────────────────────────────────────── */
    const submitForm = async (clinic) => {
        setLoading(true);
        try {
            if (role === 'clinic') {
                const fd = new FormData();
                fd.append('setup_token', setupToken);
                fd.append('role', role);
                if (password) {
                    fd.append('password', password);
                    fd.append('password_confirmation', passwordConfirmation);
                }
                fd.append('clinic_mobile',   clinic.phone);
                fd.append('payment_methods', clinic.payment_methods.join(', '));
                if (clinic.license_file) fd.append('license_file', clinic.license_file);
                if (clinic.cert_file)    fd.append('cert_file',    clinic.cert_file);
                await api.post('/auth/google/complete', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                const payload = { setup_token: setupToken, role };
                if (password) {
                    payload.password              = password;
                    payload.password_confirmation = passwordConfirmation;
                }
                await api.post('/auth/google/complete', payload);
            }
            setSuccess(true);
        } catch (err) {
            const data = err.response?.data;
            if (data?.errors) {
                if (role === 'clinic' && step === 2) {
                    setClinicErrors(data.errors);
                } else {
                    setFieldErrors(data.errors);
                    if (role === 'clinic') setStep(1);
                }
            } else {
                setError(data?.message || 'Something went wrong. Please try again.');
                if (role === 'clinic') setStep(1);
            }
        } finally {
            setLoading(false);
        }
    };

    /* ── Step 2 render — Clinic Details ────────────────────── */
    if (role === 'clinic' && step === 2) {
        return (
            <div className={`login-page${darkMode ? ' dark' : ''}`}>
                <Sidebar />
                <div className="lp-form-panel">
                    {themeToggle}
                    <div className="lp-card">
                        <button
                            className="lp-back-btn"
                            onClick={() => { setStep(1); setClinicErrors({}); }}
                            aria-label="Go back"
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <polyline points="15 18 9 12 15 6"/>
                            </svg>
                            Back
                        </button>

                        {/* Step indicator */}
                        <div className="lp-step-bar">
                            <div className="lp-step done">
                                <span className="lp-step-num"><CheckIcon /></span>
                                <span>Account Info</span>
                            </div>
                            <div className="lp-step-connector done" />
                            <div className="lp-step active">
                                <span className="lp-step-num">2</span>
                                <span>Clinic Details</span>
                            </div>
                        </div>

                        <h2 className="lp-title">
                            Clinic <span className="lp-title-accent">verification</span>
                        </h2>
                        <p className="lp-subtitle">Provide your clinic documents for admin review.</p>

                        <div className="lp-review-note">
                            <span className="lp-review-note-icon"><InfoIcon /></span>
                            <span>These documents will be reviewed by our admin team before your clinic account is activated. All fields are required.</span>
                        </div>

                        {clinicErrors.general && (
                            <div className="lp-error-banner">
                                <AlertCircleIcon />
                                <span>{clinicErrors.general[0]}</span>
                            </div>
                        )}

                        <form onSubmit={handleStep2}>
                            <div className="lp-field">
                                <label className="lp-label">Clinic Phone Number</label>
                                <PhoneInput
                                    name="clinic_phone"
                                    value={clinicExtra.phone}
                                    onChange={(e) => {
                                        setClinicExtra(p => ({ ...p, phone: e.target.value }));
                                        if (clinicErrors.phone) setClinicErrors(p => ({ ...p, phone: null }));
                                    }}
                                    placeholder="Clinic phone number"
                                    error={!!clinicErrors.phone}
                                />
                                {clinicErrors.phone && <p className="lp-field-error">{clinicErrors.phone}</p>}
                            </div>

                            <div className="lp-field">
                                <label className="lp-label">Payment Methods Accepted</label>
                                <div className="lp-payment-options">
                                    {PAYMENT_OPTIONS.map(opt => {
                                        const sel = clinicExtra.payment_methods.includes(opt);
                                        return (
                                            <button
                                                key={opt}
                                                type="button"
                                                className={`lp-payment-pill${sel ? ' selected' : ''}`}
                                                onClick={() => {
                                                    const next = sel
                                                        ? clinicExtra.payment_methods.filter(o => o !== opt)
                                                        : [...clinicExtra.payment_methods, opt];
                                                    setClinicExtra(p => ({ ...p, payment_methods: next }));
                                                    if (clinicErrors.payment_methods) setClinicErrors(p => ({ ...p, payment_methods: null }));
                                                }}
                                            >
                                                <span className="lp-payment-pill-check">
                                                    {sel && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                                                </span>
                                                {opt}
                                            </button>
                                        );
                                    })}
                                </div>
                                {clinicErrors.payment_methods && <p className="lp-field-error">{clinicErrors.payment_methods}</p>}
                            </div>

                            <FileUploadField
                                label="License Document"
                                file={clinicExtra.license_file}
                                onChange={(f) => {
                                    setClinicExtra(p => ({ ...p, license_file: f }));
                                    if (clinicErrors.license_file) setClinicErrors(p => ({ ...p, license_file: null }));
                                }}
                                accept=".pdf,.jpg,.jpeg,.png"
                                hint="Upload official clinic license (PDF, JPG, PNG — max 5MB)"
                                error={clinicErrors.license_file}
                            />

                            <FileUploadField
                                label="Certification Document"
                                file={clinicExtra.cert_file}
                                onChange={(f) => {
                                    setClinicExtra(p => ({ ...p, cert_file: f }));
                                    if (clinicErrors.cert_file) setClinicErrors(p => ({ ...p, cert_file: null }));
                                }}
                                accept=".pdf,.jpg,.jpeg,.png"
                                hint="Upload certifications or accreditations (PDF, JPG, PNG — max 5MB)"
                                error={clinicErrors.cert_file}
                            />

                            <button className="lp-submit-btn" type="submit" disabled={loading} style={{ marginTop: '0.5rem' }}>
                                {loading && <Spinner />}
                                {loading ? 'Creating account…' : 'Create Account'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Step 1 render — Role + optional password ───────────── */
    return (
        <div className={`login-page${darkMode ? ' dark' : ''}`}>
            <Sidebar />

            <div className="lp-form-panel">
                {themeToggle}

                <div className="lp-card">
                    {/* Step indicator — shown when clinic is selected */}
                    {role === 'clinic' && (
                        <div className="lp-step-bar">
                            <div className="lp-step active">
                                <span className="lp-step-num">1</span>
                                <span>Account Info</span>
                            </div>
                            <div className="lp-step-connector" />
                            <div className="lp-step">
                                <span className="lp-step-num">2</span>
                                <span>Clinic Details</span>
                            </div>
                        </div>
                    )}

                    <h2 className="lp-title">
                        Almost <span className="lp-title-accent">there</span>
                    </h2>
                    <p className="lp-subtitle">Complete your PhysioCore account setup.</p>

                    {error && (
                        <div className="lp-error-banner">
                            <AlertCircleIcon />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleStep1}>
                        {/* Role picker */}
                        <div className="lp-field">
                            <label className="lp-label">I am a</label>
                            <div className="lp-role-picker">
                                <button
                                    type="button"
                                    className={`lp-role-card${role === 'client' ? ' active' : ''}`}
                                    onClick={() => setRole('client')}
                                >
                                    <div className="lp-role-card-icon"><ClientRoleIcon /></div>
                                    <span className="lp-role-card-title">Client</span>
                                    <span className="lp-role-card-desc">Patient seeking rehab</span>
                                </button>
                                <button
                                    type="button"
                                    className={`lp-role-card${role === 'clinic' ? ' active' : ''}`}
                                    onClick={() => setRole('clinic')}
                                >
                                    <div className="lp-role-card-icon"><ClinicRoleIcon /></div>
                                    <span className="lp-role-card-title">Clinic</span>
                                    <span className="lp-role-card-desc">Healthcare provider</span>
                                </button>
                            </div>
                            {fieldErrors.role && <p className="lp-field-error">{fieldErrors.role[0]}</p>}
                        </div>

                        {/* Optional password */}
                        <div className="lp-field">
                            <label className="lp-label">
                                Password&nbsp;
                                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                                    — optional, lets you sign in without Google
                                </span>
                            </label>
                            <div className="lp-input-wrap">
                                <span className="lp-input-icon"><LockIcon /></span>
                                <input
                                    className="lp-input has-right-icon"
                                    type={showPass ? 'text' : 'password'}
                                    placeholder="Min. 8 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button type="button" className="lp-eye-btn" onClick={() => setShowPass(p => !p)} aria-label={showPass ? 'Hide' : 'Show'}>
                                    <EyeIcon open={showPass} />
                                </button>
                            </div>
                            {fieldErrors.password && <p className="lp-field-error">{fieldErrors.password[0]}</p>}
                        </div>

                        {/* Confirm password — only shown when password is typed */}
                        {password && (
                            <div className="lp-field">
                                <label className="lp-label">Confirm password</label>
                                <div className="lp-input-wrap">
                                    <span className="lp-input-icon"><LockIcon /></span>
                                    <input
                                        className="lp-input has-right-icon"
                                        type={showConfirm ? 'text' : 'password'}
                                        placeholder="Repeat your password"
                                        value={passwordConfirmation}
                                        onChange={(e) => setPasswordConf(e.target.value)}
                                    />
                                    <button type="button" className="lp-eye-btn" onClick={() => setShowConfirm(p => !p)} aria-label={showConfirm ? 'Hide' : 'Show'}>
                                        <EyeIcon open={showConfirm} />
                                    </button>
                                </div>
                            </div>
                        )}

                        <button className="lp-submit-btn" type="submit" disabled={loading} style={{ marginTop: '0.25rem' }}>
                            {loading && <Spinner />}
                            {role === 'clinic'
                                ? (loading ? 'Please wait…' : 'Continue →')
                                : (loading ? 'Creating account…' : 'Complete Setup')
                            }
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
