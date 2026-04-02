import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import AuthSidebar from '../components/AuthSidebar';
import Spinner from '../components/Spinner';
import '../styles/auth.css';

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

export default function RegisterPage() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        first_name: '', last_name: '', email: '',
        password: '', password_confirmation: '', role: 'client',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

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
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setErrors(err.response?.data?.errors || { general: ['Registration failed.'] });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = () => {
        window.location.href = 'http://127.0.0.1:8000/api/auth/google';
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
            <AuthSidebar />

            <main className="auth-form-panel">
                <div className="auth-form-container">
                    <h1 className="auth-form-title">Create account</h1>
                    <p className="auth-form-subtitle">Join PhysioCore and start your recovery journey</p>

                    {success && <div className="auth-success-banner">{success}</div>}
                    {errors.general && <div className="auth-error-banner">{errors.general[0]}</div>}

                    <button className="auth-google-btn" type="button" onClick={handleGoogle}>
                        <GoogleIcon />
                        Sign up with Google
                    </button>

                    <div className="auth-divider"><span>or sign up with email</span></div>

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <div className="auth-field" style={{ flex: 1 }}>
                                <label className="auth-label">First name</label>
                                <input
                                    className="auth-input"
                                    type="text"
                                    name="first_name"
                                    placeholder="John"
                                    value={form.first_name}
                                    onChange={handleChange}
                                    required
                                />
                                {errors.first_name && <p className="auth-field-error">{errors.first_name[0]}</p>}
                            </div>
                            <div className="auth-field" style={{ flex: 1 }}>
                                <label className="auth-label">Last name</label>
                                <input
                                    className="auth-input"
                                    type="text"
                                    name="last_name"
                                    placeholder="Doe"
                                    value={form.last_name}
                                    onChange={handleChange}
                                    required
                                />
                                {errors.last_name && <p className="auth-field-error">{errors.last_name[0]}</p>}
                            </div>
                        </div>

                        <div className="auth-field">
                            <label className="auth-label">Email address</label>
                            <input
                                className="auth-input"
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                            {errors.email && <p className="auth-field-error">{errors.email[0]}</p>}
                        </div>

                        <div className="auth-field">
                            <label className="auth-label">Password</label>
                            <input
                                className="auth-input"
                                type="password"
                                name="password"
                                placeholder="Min 8 characters"
                                value={form.password}
                                onChange={handleChange}
                                required
                            />
                            {errors.password && <p className="auth-field-error">{errors.password[0]}</p>}
                        </div>

                        <div className="auth-field">
                            <label className="auth-label">Confirm password</label>
                            <input
                                className="auth-input"
                                type="password"
                                name="password_confirmation"
                                placeholder="Repeat your password"
                                value={form.password_confirmation}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="auth-field">
                            <label className="auth-label">I am a</label>
                            <select
                                className="auth-input"
                                name="role"
                                value={form.role}
                                onChange={handleChange}
                            >
                                <option value="client">Client (Patient)</option>
                                <option value="clinic">Clinic</option>
                            </select>
                            {errors.role && <p className="auth-field-error">{errors.role[0]}</p>}
                        </div>

                        <button className="auth-submit-btn" type="submit" disabled={loading}>
                            {loading && <Spinner />}
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    <p className="auth-bottom-text">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </p>
                </div>
            </main>
            </div>
        </div>
    );
}
