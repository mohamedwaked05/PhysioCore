import { useEffect, useState, createContext, useCallback, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from './AuthContext';
import Spinner from '../components/Spinner';
import PhoneInput from '../components/ui/PhoneInput';
import '../styles/auth-modal.css';
import '../styles/ui.css';

const AuthModalContext = createContext(null);

export function useAuthModal() {
    const ctx = useContext(AuthModalContext);
    if (!ctx) throw new Error('useAuthModal must be used inside AuthModalProvider');
    return ctx;
}

/* ── Provider ───────────────────────────────────────────────── */
export function AuthModalProvider({ children }) {
    const [open, setOpen]    = useState(false);
    const pendingCallbackRef = useRef(null);
    const navigate           = useNavigate();

    const openAuthModal = useCallback((callback = null) => {
        pendingCallbackRef.current = callback;
        setOpen(true);
    }, []);

    const closeAuthModal = useCallback(() => {
        setOpen(false);
        pendingCallbackRef.current = null;
    }, []);

    const handleAuthSuccess = useCallback((loggedInUser) => {
        const cb = pendingCallbackRef.current; // read before closeAuthModal clears it
        closeAuthModal();
        if (loggedInUser?.role === 'clinic') {
            navigate('/clinic/dashboard', { replace: true });
            return;
        }
        if (loggedInUser?.role === 'admin') {
            navigate('/admin/dashboard', { replace: true });
            return;
        }
        setTimeout(() => cb?.(), 80);
    }, [closeAuthModal, navigate]);

    return (
        <AuthModalContext.Provider value={{ openAuthModal }}>
            {children}
            {open && (
                <AuthModal
                    onClose={closeAuthModal}
                    onSuccess={handleAuthSuccess}
                />
            )}
        </AuthModalContext.Provider>
    );
}

/* ── Icons ──────────────────────────────────────────────────── */
function EyeIcon({ open }) {
    return open ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>
    ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
    );
}

function GoogleIcon() {
    return (
        <svg width="17" height="17" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.6-8 19.6-20 0-1.3-.1-2.7-.4-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7l-6.5 5C9.5 39.6 16.3 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.5l6.2 5.2C40.9 35.4 44 30.1 44 24c0-1.3-.1-2.7-.4-4z"/>
        </svg>
    );
}

function ClientRoleIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="7" r="4"/>
            <path d="M4 21v-1a8 8 0 0116 0v1"/>
        </svg>
    );
}

function ClinicRoleIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21V7l9-4 9 4v14"/>
            <rect x="9" y="13" width="6" height="8"/>
            <path d="M10 6h4M12 4v4"/>
        </svg>
    );
}

function MailSentIcon() {
    return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 0.75rem' }}>
            <rect x="2" y="4" width="20" height="16" rx="2.5" stroke="var(--primary)" strokeWidth="1.6"/>
            <polyline points="2,7 12,14 22,7" stroke="var(--primary)" strokeWidth="1.6"/>
            <circle cx="18.5" cy="17.5" r="4" fill="#22c55e"/>
            <polyline points="16.5 17.5 18 19 21 16.5" stroke="white" strokeWidth="1.8"/>
        </svg>
    );
}

/* ── Google OAuth popup helper ──────────────────────────────── */
function openGooglePopup(login, onSuccess, onSetupToken) {
    const width  = 500;
    const height = 620;
    const left   = Math.round(window.screen.width  / 2 - width  / 2);
    const top    = Math.round(window.screen.height / 2 - height / 2);

    const base = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';
    const popup = window.open(
        `${base}/auth/google`,
        'google-oauth',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    const handleMessage = (event) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
            window.removeEventListener('message', handleMessage);
            const { user, token } = event.data;
            login(user, token);
            onSuccess(user);
        } else if (event.data?.type === 'GOOGLE_AUTH_SETUP') {
            window.removeEventListener('message', handleMessage);
            onSetupToken(event.data.setupToken);
        } else if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
            window.removeEventListener('message', handleMessage);
        }
    };

    window.addEventListener('message', handleMessage);
    const pollClosed = setInterval(() => {
        if (popup?.closed) {
            clearInterval(pollClosed);
            window.removeEventListener('message', handleMessage);
        }
    }, 500);
}

/* ── Sign-In form ───────────────────────────────────────────── */
function SignInForm({ onSuccess, onForgotPassword }) {
    const { login } = useAuth();
    const [form, setForm]               = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError]             = useState('');
    const [loading, setLoading]         = useState(false);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/auth/login', form);
            const { user, token } = res.data;
            login(user, token);
            onSuccess(user);
        } catch (err) {
            const msg = err.response?.data?.errors?.email?.[0]
                || err.response?.data?.message
                || 'Login failed. Please check your credentials.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = () => {
        openGooglePopup(
            login,
            onSuccess,
            (setupToken) => {
                const params = new URLSearchParams({ setup_token: setupToken });
                window.location.href = `/auth/google/complete?${params}`;
            }
        );
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && (
                <div className="auth-modal-error">
                    {error}
                    {error.toLowerCase().includes('forgot') && (
                        <> <button type="button" className="auth-modal-forgot-btn" style={{ fontWeight: 600, textDecoration: 'underline', color: 'inherit' }} onClick={onForgotPassword}>Reset it here.</button></>
                    )}
                </div>
            )}

            <div className="auth-modal-field">
                <label className="auth-modal-label">Email address</label>
                <input
                    className="auth-modal-input"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    autoFocus
                />
            </div>

            <div className="auth-modal-field">
                <label className="auth-modal-label">Password</label>
                <div className="auth-modal-input-wrap">
                    <input
                        className="auth-modal-input has-icon"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        required
                    />
                    <button type="button" className="auth-modal-eye-btn" onClick={() => setShowPassword(p => !p)}>
                        <EyeIcon open={showPassword} />
                    </button>
                </div>
            </div>

            <div className="auth-modal-meta-row">
                <span />
                <button type="button" className="auth-modal-forgot-btn" onClick={onForgotPassword}>
                    Forgot password?
                </button>
            </div>

            <button className="auth-modal-submit" type="submit" disabled={loading}>
                {loading && <Spinner />}
                {loading ? 'Signing in…' : 'Sign In'}
            </button>

            <div className="auth-modal-divider">or</div>

            <button type="button" className="auth-modal-google" onClick={handleGoogle}>
                <GoogleIcon />
                Continue with Google
            </button>
        </form>
    );
}

/* ── Forgot Password form ───────────────────────────────────── */
function ForgotPasswordForm({ onBack }) {
    const [email, setEmail]   = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent]     = useState(false);
    const [error, setError]   = useState('');

    // Listen for reset-complete broadcast → prompt user to sign in
    useEffect(() => {
        if (!sent) return;
        let ch;
        try {
            ch = new BroadcastChannel('physiocore_password_reset');
            ch.onmessage = (e) => {
                if (e.data?.type === 'PASSWORD_RESET') {
                    ch.close();
                    onBack({ prefillEmail: e.data.email, resetSuccess: true });
                }
            };
        } catch (_) {}
        return () => ch?.close();
    }, [sent, onBack]);

    const handleSubmit = async e => {
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

    if (sent) {
        return (
            <div className="auth-modal-success" style={{ textAlign: 'center' }}>
                <MailSentIcon />
                <p style={{ margin: '0 0 0.4rem', fontWeight: 700, fontSize: '0.95rem', color: '#065f46' }}>
                    Check your inbox
                </p>
                <p style={{ margin: '0 0 1.25rem', fontSize: '0.82rem', color: '#047857', lineHeight: 1.55 }}>
                    We sent a reset link to <strong>{email}</strong>.<br />
                    Click it to set a new password.
                </p>
                <button
                    type="button"
                    className="auth-modal-forgot-btn"
                    onClick={() => onBack({})}
                    style={{ fontSize: '0.82rem', fontWeight: 600 }}
                >
                    ← Back to sign in
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            {error && <div className="auth-modal-error">{error}</div>}

            <div className="auth-modal-field">
                <label className="auth-modal-label">Email address</label>
                <input
                    className="auth-modal-input"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                />
            </div>

            <button className="auth-modal-submit" type="submit" disabled={loading}>
                {loading && <Spinner />}
                {loading ? 'Sending…' : 'Send Reset Link'}
            </button>

            <p style={{ textAlign: 'center', marginTop: '0.75rem', marginBottom: 0 }}>
                <button type="button" className="auth-modal-forgot-btn" onClick={() => onBack({})}>
                    ← Back to sign in
                </button>
            </p>
        </form>
    );
}

/* ── Register form ──────────────────────────────────────────── */
const AM_PAYMENT_OPTIONS = ['Whish', 'OMT', 'BOB', 'Cash'];

function AmFileUpload({ label, file, onChange, accept, hint, error }) {
    const inputRef = useRef(null);
    return (
        <div className="auth-modal-field">
            <label className="auth-modal-label">{label}</label>
            <input ref={inputRef} type="file" accept={accept} style={{ display: 'none' }}
                onChange={e => { const f = e.target.files[0]; if (f) onChange(f); e.target.value = ''; }} />
            <button
                type="button"
                className={`am-file-btn${file ? ' has-file' : ''}${error ? ' error' : ''}`}
                onClick={() => inputRef.current.click()}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    {file
                        ? <polyline points="20 6 9 17 4 12"/>
                        : <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>
                    }
                </svg>
                <span className="am-file-name">{file ? file.name : hint}</span>
            </button>
            {error && <span className="auth-modal-field-error">{error}</span>}
        </div>
    );
}

function RegisterForm({ onSuccess }) {
    const { login }        = useAuth();
    const [form, setForm]  = useState({
        first_name: '', last_name: '', email: '',
        password: '', password_confirmation: '', role: 'client',
    });
    const [errors, setErrors]   = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [step, setStep]       = useState(1);
    const [clinicExtra, setClinicExtra] = useState({
        phone: '', payment_methods: [], license_file: null, cert_file: null,
    });
    const [clinicErrors, setClinicErrors] = useState({});

    useEffect(() => {
        if (!success) return;
        let ch;
        try {
            ch = new BroadcastChannel('physiocore_verification');
            ch.onmessage = (e) => {
                if (e.data?.type === 'EMAIL_VERIFIED') {
                    ch.close();
                    login(e.data.user, e.data.token);
                    onSuccess(e.data.user);
                }
            };
        } catch (_) {}
        return () => ch?.close();
    }, [success, login, onSuccess]);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleStep1 = e => {
        e.preventDefault();
        setErrors({});
        if (form.role === 'clinic') { setStep(2); return; }
        submitRegistration();
    };

    const handleStep2 = e => {
        e.preventDefault();
        const errs = {};
        if (!clinicExtra.phone)                       errs.phone           = 'Phone number is required.';
        if (clinicExtra.payment_methods.length === 0) errs.payment_methods = 'Select at least one payment method.';
        if (!clinicExtra.license_file)                errs.license_file    = 'License document is required.';
        if (!clinicExtra.cert_file)                   errs.cert_file       = 'Certification document is required.';
        if (Object.keys(errs).length > 0) { setClinicErrors(errs); return; }
        setClinicErrors({});
        submitRegistration();
    };

    const submitRegistration = async () => {
        setLoading(true);
        try {
            if (form.role === 'clinic') {
                const fd = new FormData();
                Object.entries(form).forEach(([k, v]) => fd.append(k, v));
                fd.append('clinic_mobile',   clinicExtra.phone);
                fd.append('payment_methods', clinicExtra.payment_methods.join(', '));
                if (clinicExtra.license_file) fd.append('license_file', clinicExtra.license_file);
                if (clinicExtra.cert_file)    fd.append('cert_file',    clinicExtra.cert_file);
                await api.post('/auth/register', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                await api.post('/auth/register', form);
            }
            setSuccess(true);
        } catch (err) {
            const serverErrors = err.response?.data?.errors || { general: ['Registration failed.'] };
            if (form.role === 'clinic' && step === 2) {
                setClinicErrors(serverErrors);
            } else {
                setErrors(serverErrors);
                if (form.role === 'clinic') setStep(1);
            }
        } finally {
            setLoading(false);
        }
    };

    /* ── Verification sent ── */
    if (success) {
        return (
            <div className="auth-modal-success" style={{ textAlign: 'center' }}>
                <MailSentIcon />
                <p style={{ margin: '0 0 0.25rem', fontWeight: 700, fontSize: '0.95rem', color: '#065f46' }}>
                    Check your email
                </p>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#047857', lineHeight: 1.55 }}>
                    We sent a verification link to <strong>{form.email}</strong>.<br />
                    Verify your account to continue.
                </p>
                {form.role === 'clinic' && (
                    <p style={{ margin: '0.6rem 0 0', fontSize: '0.8rem', color: '#047857' }}>
                        Clinic details submitted for admin review.
                    </p>
                )}
            </div>
        );
    }

    /* ── Step 2 — Clinic verification ── */
    if (form.role === 'clinic' && step === 2) {
        return (
            <div>
                {/* Step indicator */}
                <div className="am-step-bar">
                    <div className="am-step am-step--done">
                        <span className="am-step-num">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </span>
                        <span>Account</span>
                    </div>
                    <div className="am-step-connector am-step-connector--done" />
                    <div className="am-step am-step--active">
                        <span className="am-step-num">2</span>
                        <span>Clinic Details</span>
                    </div>
                </div>

                <div className="am-review-note">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    <span>Required for admin review before your clinic is activated.</span>
                </div>

                {clinicErrors.general && <div className="auth-modal-error">{clinicErrors.general[0]}</div>}

                <form onSubmit={handleStep2}>
                    {/* Phone */}
                    <div className="auth-modal-field">
                        <label className="auth-modal-label">Clinic Phone Number</label>
                        <PhoneInput
                            name="clinic_phone"
                            value={clinicExtra.phone}
                            onChange={e => {
                                setClinicExtra(p => ({ ...p, phone: e.target.value }));
                                if (clinicErrors.phone) setClinicErrors(p => ({ ...p, phone: null }));
                            }}
                            placeholder="Clinic phone number"
                            error={!!clinicErrors.phone}
                        />
                        {clinicErrors.phone && <span className="auth-modal-field-error">{clinicErrors.phone}</span>}
                    </div>

                    {/* Payment methods */}
                    <div className="auth-modal-field">
                        <label className="auth-modal-label">Payment Methods Accepted</label>
                        <div className="am-payment-options">
                            {AM_PAYMENT_OPTIONS.map(opt => {
                                const sel = clinicExtra.payment_methods.includes(opt);
                                return (
                                    <button
                                        key={opt}
                                        type="button"
                                        className={`am-payment-pill${sel ? ' selected' : ''}`}
                                        onClick={() => {
                                            const next = sel
                                                ? clinicExtra.payment_methods.filter(o => o !== opt)
                                                : [...clinicExtra.payment_methods, opt];
                                            setClinicExtra(p => ({ ...p, payment_methods: next }));
                                            if (clinicErrors.payment_methods) setClinicErrors(p => ({ ...p, payment_methods: null }));
                                        }}
                                    >
                                        <span className="am-payment-pill-check">
                                            {sel && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                                        </span>
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                        {clinicErrors.payment_methods && <span className="auth-modal-field-error">{clinicErrors.payment_methods}</span>}
                    </div>

                    <AmFileUpload
                        label="License Document"
                        file={clinicExtra.license_file}
                        onChange={f => {
                            setClinicExtra(p => ({ ...p, license_file: f }));
                            if (clinicErrors.license_file) setClinicErrors(p => ({ ...p, license_file: null }));
                        }}
                        accept=".pdf,.jpg,.jpeg,.png"
                        hint="License file (PDF, JPG, PNG — max 5MB)"
                        error={clinicErrors.license_file}
                    />

                    <AmFileUpload
                        label="Certification Document"
                        file={clinicExtra.cert_file}
                        onChange={f => {
                            setClinicExtra(p => ({ ...p, cert_file: f }));
                            if (clinicErrors.cert_file) setClinicErrors(p => ({ ...p, cert_file: null }));
                        }}
                        accept=".pdf,.jpg,.jpeg,.png"
                        hint="Certifications file (PDF, JPG, PNG — max 5MB)"
                        error={clinicErrors.cert_file}
                    />

                    <button className="auth-modal-submit" type="submit" disabled={loading} style={{ marginTop: '0.25rem' }}>
                        {loading && <Spinner />}
                        {loading ? 'Creating account…' : 'Create Account'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '0.65rem', marginBottom: 0 }}>
                    <button type="button" className="auth-modal-forgot-btn"
                        onClick={() => { setStep(1); setClinicErrors({}); }}>
                        ← Back to account info
                    </button>
                </p>
            </div>
        );
    }

    /* ── Step 1 — Basic info ── */
    return (
        <div>
            {/* Step indicator — only when clinic selected */}
            {form.role === 'clinic' && (
                <div className="am-step-bar">
                    <div className="am-step am-step--active">
                        <span className="am-step-num">1</span>
                        <span>Account</span>
                    </div>
                    <div className="am-step-connector" />
                    <div className="am-step">
                        <span className="am-step-num">2</span>
                        <span>Clinic Details</span>
                    </div>
                </div>
            )}

            <form onSubmit={handleStep1}>
                {errors.general && <div className="auth-modal-error">{errors.general[0]}</div>}

                <div className="auth-modal-name-row">
                    <div className="auth-modal-field">
                        <label className="auth-modal-label">First name</label>
                        <input className="auth-modal-input" type="text" name="first_name" value={form.first_name} onChange={handleChange} required autoFocus />
                        {errors.first_name && <span className="auth-modal-field-error">{errors.first_name[0]}</span>}
                    </div>
                    <div className="auth-modal-field">
                        <label className="auth-modal-label">Last name</label>
                        <input className="auth-modal-input" type="text" name="last_name" value={form.last_name} onChange={handleChange} required />
                        {errors.last_name && <span className="auth-modal-field-error">{errors.last_name[0]}</span>}
                    </div>
                </div>

                <div className="auth-modal-field">
                    <label className="auth-modal-label">Email address</label>
                    <input className="auth-modal-input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
                    {errors.email && <span className="auth-modal-field-error">{errors.email[0]}</span>}
                </div>

                <div className="auth-modal-field">
                    <label className="auth-modal-label">Password</label>
                    <input className="auth-modal-input" type="password" name="password" value={form.password} onChange={handleChange} required />
                    {errors.password && <span className="auth-modal-field-error">{errors.password[0]}</span>}
                </div>

                <div className="auth-modal-field">
                    <label className="auth-modal-label">Confirm password</label>
                    <input className="auth-modal-input" type="password" name="password_confirmation" value={form.password_confirmation} onChange={handleChange} required />
                </div>

                <div className="auth-modal-field">
                    <label className="auth-modal-label">I am a</label>
                    <div className="am-role-picker">
                        <button type="button" className={`am-role-card${form.role === 'client' ? ' active' : ''}`} onClick={() => setForm(f => ({ ...f, role: 'client' }))}>
                            <div className="am-role-card-icon"><ClientRoleIcon /></div>
                            <span className="am-role-card-title">Client</span>
                            <span className="am-role-card-desc">Patient seeking rehab</span>
                        </button>
                        <button type="button" className={`am-role-card${form.role === 'clinic' ? ' active' : ''}`} onClick={() => setForm(f => ({ ...f, role: 'clinic' }))}>
                            <div className="am-role-card-icon"><ClinicRoleIcon /></div>
                            <span className="am-role-card-title">Clinic</span>
                            <span className="am-role-card-desc">Healthcare provider</span>
                        </button>
                    </div>
                    {errors.role && <span className="auth-modal-field-error">{errors.role[0]}</span>}
                </div>

                <button className="auth-modal-submit" type="submit" disabled={loading}>
                    {loading && <Spinner />}
                    {form.role === 'clinic'
                        ? (loading ? 'Please wait…' : 'Continue →')
                        : (loading ? 'Creating account…' : 'Create Account')
                    }
                </button>
            </form>
        </div>
    );
}

/* ── Modal shell ────────────────────────────────────────────── */
function AuthModal({ onClose, onSuccess }) {
    // view: 'signin' | 'register' | 'forgot'
    const [view, setView] = useState('signin');

    const handleBackdropClick = e => {
        if (e.target === e.currentTarget) onClose();
    };

    // Called by ForgotPasswordForm when done (reset complete or back clicked)
    const handleForgotBack = ({ prefillEmail, resetSuccess } = {}) => {
        setView('signin');
        // prefillEmail / resetSuccess could be used to pre-fill the sign-in form
        // but that would require lifting state — the user can just type it in
    };

    const isForgot = view === 'forgot';

    const promptText = {
        signin:   <><strong>Sign in</strong> to continue where you left off.</>,
        register: <><strong>Create an account</strong> to get started with PhysioCore.</>,
        forgot:   <>Enter your email and we'll send you a <strong>reset link</strong>.</>,
    }[view];

    return (
        <div className="auth-modal-backdrop" onClick={handleBackdropClick}>
            <div className="auth-modal-card">
                {/* Header */}
                <div className="auth-modal-header">
                    <button
                        className="auth-modal-back"
                        onClick={isForgot ? () => setView('signin') : onClose}
                        aria-label={isForgot ? 'Back to sign in' : 'Go back'}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                    </button>
                    <div className="auth-modal-logo">
                        <div className="auth-modal-logo-icon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M2 12h4l2-6 4 12 2-6h10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" fill="none"/>
                            </svg>
                        </div>
                        <span className="auth-modal-logo-text">PhysioCore</span>
                    </div>
                    <button className="auth-modal-close" onClick={onClose} aria-label="Close">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="auth-modal-body">
                    <p className="auth-modal-prompt">{promptText}</p>

                    {/* Tabs — hidden on forgot view */}
                    {!isForgot && (
                        <div className="auth-modal-tabs">
                            <button
                                type="button"
                                className={`auth-modal-tab${view === 'signin' ? ' active' : ''}`}
                                onClick={() => setView('signin')}
                            >
                                Sign In
                            </button>
                            <button
                                type="button"
                                className={`auth-modal-tab${view === 'register' ? ' active' : ''}`}
                                onClick={() => setView('register')}
                            >
                                Create Account
                            </button>
                        </div>
                    )}

                    {/* Form */}
                    {view === 'signin'   && <SignInForm onSuccess={onSuccess} onForgotPassword={() => setView('forgot')} />}
                    {view === 'register' && <RegisterForm onSuccess={onSuccess} />}
                    {view === 'forgot'   && <ForgotPasswordForm onBack={handleForgotBack} />}
                </div>
            </div>
        </div>
    );
}
