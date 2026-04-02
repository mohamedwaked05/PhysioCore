import { useState } from 'react';
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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

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
            navigate('/login?message=Password reset successfully. You can now log in.');
        } catch (err) {
            const data = err.response?.data;
            if (data?.errors) setFieldErrors(data.errors);
            else setError(data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

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
