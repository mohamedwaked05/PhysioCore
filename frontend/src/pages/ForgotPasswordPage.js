import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import AuthSidebar from '../components/AuthSidebar';
import Spinner from '../components/Spinner';
import '../styles/auth.css';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);
        try {
            const res = await api.post('/auth/forgot-password', { email });
            setMessage(res.data.message);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
            <AuthSidebar />

            <main className="auth-form-panel">
                <div className="auth-form-container">
                    <h1 className="auth-form-title">Forgot password?</h1>
                    <p className="auth-form-subtitle">Enter your email and we'll send you a reset link.</p>

                    {message && <div className="auth-success-banner">{message}</div>}
                    {error && <div className="auth-error-banner">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="auth-field">
                            <label className="auth-label">Email address</label>
                            <input
                                className="auth-input"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <button className="auth-submit-btn" type="submit" disabled={loading}>
                            {loading && <Spinner />}
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>

                    <p className="auth-bottom-text">
                        <Link to="/login">Back to Sign In</Link>
                    </p>
                </div>
            </main>
            </div>
        </div>
    );
}
