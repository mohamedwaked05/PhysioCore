import api from './axios';

export const getProfile        = ()     => api.get('/client/profile');
export const updateProfile     = (formData) =>
    api.post('/client/profile/update', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
export const getClinics        = ()     => api.get('/client/clinics');
export const getAccessRequests = ()     => api.get('/client/access-requests');
export const createAccessRequest = (data) => api.post('/client/access-request', data);
