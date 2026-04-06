import axios from 'axios';

// Public API client — no auth token, no 401 redirect.
// Used for read-only public endpoints that don't require authentication.
const publicApi = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
});

export const getPublicClinics = () => publicApi.get('/clinics');
export const getPublicClinic  = (id) => publicApi.get(`/clinics/${id}`);
