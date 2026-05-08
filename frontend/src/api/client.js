import api from './axios';

export const getProfile        = ()     => api.get('/client/profile');
export const updateProfile     = (formData) => api.post('/client/profile/update', formData);
export const getClinics        = ()     => api.get('/client/clinics');
export const getClinic         = (id)   => api.get(`/client/clinics/${id}`);
export const getAccessRequests = ()     => api.get('/client/access-requests');
export const createAccessRequest   = (data) => api.post('/client/access-request', data);
export const submitSessionFeedback = (data) => api.post('/client/session-feedback', data);
export const getTrackingStatus     = (clinicId) => api.get('/client/tracking/status', { params: { clinic_id: clinicId } });
export const escalateSafety        = (data) => api.post('/client/ai/escalate', data);
export const getLatestAiInsight    = (clinicId) => api.get('/client/ai/latest', { params: { clinic_id: clinicId } });
