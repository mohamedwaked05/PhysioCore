import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
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

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [success, setSuccess]     = useState(false);
    const [countdown, setCountdown] = useState(5);

    const token = searchParams.get('token');
    const email = searchParams.get('email');

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

            // Notify the forgot-password tab so it can redirect to login
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

    if (success) {
        return (
            <div className="auth-wrapper">
                <div className="auth-card">
                <AuthSidebar />
                <main className="auth-form-panel">
                    <div className="auth-form-container" style={{ textAlign: 'center' }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: '50%',
                            background: '#d1fae5', border: '1.5px solid #10b981',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1.25rem',
                        }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                        </div>
                        <h1 className="auth-form-title" style={{ color: '#065f46' }}>Password reset!</h1>
                        <p className="auth-form-subtitle">
                            Your password has been updated. Your previous tab will take you to sign in.
                        </p>
                        <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                            This tab closes in {countdown}s…
                        </p>
                    </div>
                </main>
                </div>
            </div>
        );
    }

    if (!token || !email) {
        navigate('/login');
        return null;
    }

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
            <AuthSidebar />

            <main className="auth-form-panel">
                <div className="auth-form-container">
                    <h1 className="auth-form-title">Reset password</h1>
                    <p className="auth-form-subtitle">Enter your new password below.</p>

                    {error && <div className="auth-error-banner">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="auth-field">
                            <label className="auth-label">New password</label>
                            <div className="auth-input-wrap">
                                <input
                                    className="auth-input has-icon"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Min 8 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(p => !p)}>
                                    <EyeIcon open={showPassword} />
                                </button>
                            </div>
                            {fieldErrors.password && <p className="auth-field-error">{fieldErrors.password[0]}</p>}
                        </div>

                        <div className="auth-field">
                            <label className="auth-label">Confirm new password</label>
                            <input
                                className="auth-input"
                                type="password"
                                placeholder="Repeat your password"
                                value={passwordConfirmation}
                                onChange={(e) => setPasswordConfirmation(e.target.value)}
                                required
                            />
                        </div>

                        <button className="auth-submit-btn" type="submit" disabled={loading}>
                            {loading && <Spinner />}
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                </div>
            </main>
            </div>
        </div>
    );
}
