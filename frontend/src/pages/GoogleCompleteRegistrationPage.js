import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import AuthSidebar from '../components/AuthSidebar';
import Spinner from '../components/Spinner';
import '../styles/auth.css';

export default function GoogleCompleteRegistrationPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [role, setRole] = useState('client');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const setupToken = searchParams.get('setup_token');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});
        setLoading(true);

        const payload = { setup_token: setupToken, role };
        if (password) {
            payload.password = password;
            payload.password_confirmation = passwordConfirmation;
        }

        try {
            await api.post('/auth/google/complete', payload);
            navigate('/login?message=Account created. Please verify your email before logging in.');
        } catch (err) {
            const data = err.response?.data;
            if (data?.errors) setFieldErrors(data.errors);
            else setError(data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!setupToken) {
        navigate('/login');
        return null;
    }

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
            <AuthSidebar />

            <main className="auth-form-panel">
                <div className="auth-form-container">
                    <h1 className="auth-form-title">Almost there</h1>
                    <p className="auth-form-subtitle">Complete your PhysioCore account setup.</p>

                    {error && <div className="auth-error-banner">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="auth-field">
                            <label className="auth-label">I am a</label>
                            <select
                                className="auth-input"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                            >
                                <option value="client">Client (Patient)</option>
                                <option value="clinic">Clinic</option>
                            </select>
                            {fieldErrors.role && <p className="auth-field-error">{fieldErrors.role[0]}</p>}
                        </div>

                        <div className="auth-field">
                            <label className="auth-label">
                                Password <span style={{ color: '#b0a99f', fontWeight: 400 }}>(optional — lets you log in without Google)</span>
                            </label>
                            <input
                                className="auth-input"
                                type="password"
                                placeholder="Min 8 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            {fieldErrors.password && <p className="auth-field-error">{fieldErrors.password[0]}</p>}
                        </div>

                        {password && (
                            <div className="auth-field">
                                <label className="auth-label">Confirm password</label>
                                <input
                                    className="auth-input"
                                    type="password"
                                    placeholder="Repeat your password"
                                    value={passwordConfirmation}
                                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                                />
                            </div>
                        )}

                        <button className="auth-submit-btn" type="submit" disabled={loading}>
                            {loading && <Spinner />}
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>
                </div>
            </main>
            </div>
        </div>
    );
}
