import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api',
    timeout: 10000,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
});

// Attach token + handle FormData uploads.
// IMPORTANT: When the body is FormData, delete the default 'Content-Type: application/json'
// header so axios can set 'Content-Type: multipart/form-data; boundary=...' automatically.
// Without this, the axios default header overrides the boundary and PHP cannot parse the body.
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    }
    return config;
});

// If the server returns 401, only redirect to login when there was an active session.
// Pass { _skipAuthRedirect: true } in the axios config to suppress the redirect for
// background / non-critical calls (e.g. marking a notification as seen).
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && !error.config?._skipAuthRedirect) {
            const hadToken = !!localStorage.getItem('token');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (hadToken) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
