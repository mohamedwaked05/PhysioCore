import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function VerifyEmailPage() {
    const { id, hash } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [status, setStatus] = useState('verifying'); // verifying | success | error

    useEffect(() => {
        const expires = searchParams.get('expires');
        const signature = searchParams.get('signature');

        api.get(`/auth/verify-email/${id}/${hash}?expires=${expires}&signature=${signature}`)
            .then(() => {
                setStatus('success');
                setTimeout(() => navigate('/login'), 3000);
            })
            .catch(() => {
                setStatus('error');
            });
    }, [id, hash, searchParams, navigate]);

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                {status === 'verifying' && (
                    <>
                        <h2 style={styles.title}>Verifying your email...</h2>
                        <p style={styles.text}>Please wait.</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <h2 style={{ ...styles.title, color: '#16a34a' }}>Email Verified!</h2>
                        <p style={styles.text}>Your email has been verified. Redirecting to login...</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <h2 style={{ ...styles.title, color: '#dc2626' }}>Verification Failed</h2>
                        <p style={styles.text}>The link is invalid or has expired.</p>
                        <button style={styles.button} onClick={() => navigate('/login')}>
                            Back to Login
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f3f4f6' },
    card: { backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center' },
    title: { marginBottom: '1rem', fontSize: '1.5rem' },
    text: { color: '#6b7280', marginBottom: '1rem' },
    button: { padding: '0.75rem 1.5rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '1rem', cursor: 'pointer' },
};
