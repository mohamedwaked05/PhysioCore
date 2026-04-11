import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function GoogleCallbackPage() {
    const [searchParams] = useSearchParams();
    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        const role = searchParams.get('role');
        const setupToken = searchParams.get('setup_token');

        // New user — redirect to role selection
        if (setupToken) {
            navigate('/auth/google/complete?setup_token=' + setupToken);
            return;
        }

        // Existing user — log them in
        if (token && role) {
            localStorage.setItem('token', token);
            api.get('/user')
                .then(({ data }) => {
                    // Popup mode: send result back to parent window, then close
                    if (window.opener && !window.opener.closed) {
                        window.opener.postMessage(
                            { type: 'GOOGLE_AUTH_SUCCESS', user: data, token },
                            window.location.origin
                        );
                        window.close();
                        return;
                    }
                    // Normal (full-page) mode
                    login(data, token);
                    if (role === 'client') {
                        navigate('/client/dashboard');
                    } else if (role === 'clinic') {
                        navigate('/clinic/dashboard');
                    } else {
                        navigate('/dashboard');
                    }
                })
                .catch(() => {
                    localStorage.removeItem('token');
                    if (window.opener && !window.opener.closed) {
                        window.opener.postMessage(
                            { type: 'GOOGLE_AUTH_ERROR', error: 'auth_failed' },
                            window.location.origin
                        );
                        window.close();
                        return;
                    }
                    navigate('/login?error=google_auth_failed');
                });
            return;
        }

        // New user in popup — send setup token back to parent
        if (setupToken && window.opener && !window.opener.closed) {
            window.opener.postMessage(
                { type: 'GOOGLE_AUTH_SETUP', setupToken },
                window.location.origin
            );
            window.close();
            return;
        }

        navigate('/login');
    }, []);

    return (
        <div style={styles.container}>
            <p>Signing you in with Google...</p>
        </div>
    );
}

const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' },
};
