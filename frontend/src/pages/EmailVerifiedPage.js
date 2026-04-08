import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import '../styles/auth.css';

function StatusIcon({ type }) {
    if (type === 'success') {
        return (
            <div style={styles.iconWrap('#d1fae5', '#10b981')}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            </div>
        );
    }
    if (type === 'error') {
        return (
            <div style={styles.iconWrap('#fee2e2', '#ef4444')}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </div>
        );
    }
    // spinner
    return (
        <div style={styles.iconWrap('#ede9fe', '#7c3aed')}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.2" strokeLinecap="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                </path>
            </svg>
        </div>
    );
}

export default function EmailVerifiedPage() {
    const [searchParams]    = useSearchParams();
    const navigate          = useNavigate();
    const { login }         = useAuth();

    const status = searchParams.get('status'); // success | already-verified | invalid
    const token  = searchParams.get('token');
    const role   = searchParams.get('role');

    const [phase, setPhase]     = useState('loading'); // loading | done | error | already
    const [userData, setUserData] = useState(null);
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        if (status === 'success' && token && role) {
            localStorage.setItem('token', token);

            api.get('/user')
                .then(({ data }) => {
                    setUserData(data);
                    setPhase('done');

                    // Broadcast to all same-origin tabs (e.g. the registration tab)
                    try {
                        const ch = new BroadcastChannel('physiocore_verification');
                        ch.postMessage({ type: 'EMAIL_VERIFIED', user: data, token });
                        ch.close();
                    } catch (_) {}

                    // Count down from 5 then close this tab
                    let secs = 5;
                    const tick = setInterval(() => {
                        secs -= 1;
                        setCountdown(secs);
                        if (secs <= 0) {
                            clearInterval(tick);
                            window.close();
                        }
                    }, 1000);
                })
                .catch(() => {
                    localStorage.removeItem('token');
                    setPhase('error');
                });
        } else if (status === 'already-verified') {
            setPhase('already');
        } else {
            setPhase('error');
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps


    /* ── Render ── */
    if (phase === 'loading') {
        return (
            <div style={styles.page}>
                <div style={styles.card}>
                    <StatusIcon type="loading" />
                    <h2 style={styles.title}>Verifying your email…</h2>
                    <p style={styles.sub}>Hang tight, this only takes a moment.</p>
                </div>
            </div>
        );
    }

    if (phase === 'done') {
        return (
            <div style={styles.page}>
                <div style={styles.card}>
                    <StatusIcon type="success" />
                    <h2 style={{ ...styles.title, color: '#065f46' }}>Email verified!</h2>
                    <p style={styles.sub}>
                        Your registration tab has been redirected to your dashboard.
                    </p>
                    <p style={{ ...styles.sub, color: '#9ca3af', fontSize: '0.82rem', margin: 0 }}>
                        This tab closes in {countdown}s…
                    </p>
                </div>
            </div>
        );
    }

    if (phase === 'already') {
        return (
            <div style={styles.page}>
                <div style={styles.card}>
                    <StatusIcon type="success" />
                    <h2 style={{ ...styles.title, color: '#065f46' }}>Already verified</h2>
                    <p style={styles.sub}>Your email is already confirmed. Sign in to continue.</p>
                    <button style={styles.btn} onClick={() => navigate('/login')}>Go to Sign In</button>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <StatusIcon type="error" />
                <h2 style={{ ...styles.title, color: '#991b1b' }}>Verification failed</h2>
                <p style={styles.sub}>This link is invalid or has expired. Request a new one from your account.</p>
                <button style={styles.btn} onClick={() => navigate('/login')}>Back to Sign In</button>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8f7f4 0%, #edeaf5 100%)',
        fontFamily: "'Inter', sans-serif",
        padding: '1.5rem',
    },
    card: {
        background: '#fff',
        borderRadius: '20px',
        padding: '3rem 2.5rem',
        boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
        maxWidth: '420px',
        width: '100%',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
    },
    iconWrap: (bg, border) => ({
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: bg,
        border: `1.5px solid ${border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '0.75rem',
    }),
    title: {
        fontSize: '1.45rem',
        fontWeight: 700,
        color: '#1a1a2e',
        margin: '0.25rem 0 0.1rem',
    },
    sub: {
        fontSize: '0.9rem',
        color: '#6b7280',
        margin: '0 0 1rem',
        lineHeight: 1.5,
    },
    btn: {
        marginTop: '0.5rem',
        padding: '0.65rem 2rem',
        background: '#3e4772',
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        fontSize: '0.9rem',
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: "'Inter', sans-serif",
    },
    progressBar: {
        width: '100%',
        height: '3px',
        background: '#e5e7eb',
        borderRadius: '999px',
        overflow: 'hidden',
        marginTop: '0.5rem',
    },
    progressFill: {
        height: '100%',
        width: '100%',
        background: '#10b981',
        borderRadius: '999px',
        animation: 'progressDrain 2.2s linear forwards',
    },
};
