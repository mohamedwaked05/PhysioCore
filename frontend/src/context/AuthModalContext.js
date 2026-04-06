import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from './AuthContext';
import Spinner from '../components/Spinner';
import '../styles/auth-modal.css';

const AuthModalContext = createContext(null);

export function useAuthModal() {
    const ctx = useContext(AuthModalContext);
    if (!ctx) throw new Error('useAuthModal must be used inside AuthModalProvider');
    return ctx;
}

/* ── Provider ───────────────────────────────────────────────── */
export function AuthModalProvider({ children }) {
    const [open, setOpen]           = useState(false);
    const pendingCallbackRef        = useRef(null);
    const navigate                  = useNavigate();

    const openAuthModal = useCallback((callback = null) => {
        pendingCallbackRef.current = callback;
        setOpen(true);
    }, []);

    const closeAuthModal = useCallback(() => {
        setOpen(false);
        pendingCallbackRef.current = null;
    }, []);

    // Called by SignInForm / Google popup after a successful login.
    // loggedInUser is the user object returned from the API.
    const handleAuthSuccess = useCallback((loggedInUser) => {
        closeAuthModal();

        // Non-client roles should never complete a guest action —
        // send them straight to their own dashboard.
        if (loggedInUser?.role === 'clinic') {
            navigate('/clinic/dashboard', { replace: true });
            return;
        }
        if (loggedInUser?.role === 'admin') {
            navigate('/dashboard', { replace: true });
            return;
        }

        const cb = pendingCallbackRef.current;
        // Small delay so AuthContext state propagates before callback fires
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

/* ── Google OAuth popup helper ──────────────────────────────── */
function openGooglePopup(login, onSuccess, onSetupToken) {
    const width  = 500;
    const height = 620;
    const left   = Math.round(window.screen.width  / 2 - width  / 2);
    const top    = Math.round(window.screen.height / 2 - height / 2);

    const popup = window.open(
        'http://127.0.0.1:8000/api/auth/google',
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

    // Clean up listener if popup is closed manually
    const pollClosed = setInterval(() => {
        if (popup?.closed) {
            clearInterval(pollClosed);
            window.removeEventListener('message', handleMessage);
        }
    }, 500);
}

/* ── Sign-In form ───────────────────────────────────────────── */
function SignInForm({ onSuccess }) {
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
                // New Google user — navigate full page to complete registration
                window.location.href = `/auth/google/complete?setup_token=${setupToken}`;
            }
        );
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && <div className="auth-modal-error">{error}</div>}

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
                <a href="/forgot-password" className="auth-modal-forgot">Forgot password?</a>
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

/* ── Register form ──────────────────────────────────────────── */
function RegisterForm() {
    const [form, setForm]   = useState({
        first_name: '', last_name: '', email: '',
        password: '', password_confirmation: '', role: 'client',
    });
    const [errors, setErrors]   = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        setErrors({});
        setLoading(true);
        try {
            await api.post('/auth/register', form);
            setSuccess(true);
        } catch (err) {
            setErrors(err.response?.data?.errors || { general: ['Registration failed.'] });
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="auth-modal-success">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: '#065f46', marginBottom: '0.5rem' }}>
                    <path d="M22 13V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2h8"/>
                    <polyline points="2 6 12 12 22 6"/>
                    <polyline points="16 19 18 21 22 17"/>
                </svg>
                <p style={{ margin: '0 0 0.25rem', fontWeight: 600, fontSize: '0.9rem' }}>Check your email</p>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#047857' }}>
                    We sent a verification link to <strong>{form.email}</strong>. Verify your account then sign in to continue.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
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
                <select className="auth-modal-select" name="role" value={form.role} onChange={handleChange}>
                    <option value="client">Client (Patient)</option>
                    <option value="clinic">Clinic</option>
                </select>
            </div>

            <button className="auth-modal-submit" type="submit" disabled={loading}>
                {loading && <Spinner />}
                {loading ? 'Creating account…' : 'Create Account'}
            </button>
        </form>
    );
}

/* ── Modal shell ────────────────────────────────────────────── */
function AuthModal({ onClose, onSuccess }) {
    const [tab, setTab] = useState('signin');

    // Close on backdrop click
    const handleBackdropClick = e => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div className="auth-modal-backdrop" onClick={handleBackdropClick}>
            <div className="auth-modal-card">
                {/* Header */}
                <div className="auth-modal-header">
                    <button className="auth-modal-back" onClick={onClose} aria-label="Go back">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                    </button>
                    <div className="auth-modal-logo">
                        <div className="auth-modal-logo-icon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L4 7v5c0 5 3.5 9.74 8 11 4.5-1.26 8-6 8-11V7l-8-5z" fill="white" opacity="0.9"/>
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
                    <p className="auth-modal-prompt">
                        {tab === 'signin'
                            ? <><strong>Sign in</strong> to continue where you left off.</>
                            : <><strong>Create an account</strong> to get started with PhysioCore.</>
                        }
                    </p>

                    {/* Tabs */}
                    <div className="auth-modal-tabs">
                        <button
                            type="button"
                            className={`auth-modal-tab${tab === 'signin' ? ' active' : ''}`}
                            onClick={() => setTab('signin')}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            className={`auth-modal-tab${tab === 'register' ? ' active' : ''}`}
                            onClick={() => setTab('register')}
                        >
                            Create Account
                        </button>
                    </div>

                    {/* Form */}
                    {tab === 'signin'
                        ? <SignInForm onSuccess={onSuccess} />
                        : <RegisterForm />
                    }
                </div>
            </div>
        </div>
    );
}
