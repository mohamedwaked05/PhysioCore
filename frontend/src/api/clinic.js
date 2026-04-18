import api from './axios';

export const getClinicProfile = () => api.get('/clinic/profile');

export const getDashboardCounts    = () => api.get('/clinic/dashboard/counts');
export const getDashboardAnalytics = () => api.get('/clinic/dashboard/analytics');
export const getDashboardAiSummary = () => api.get('/clinic/dashboard/ai-summary');
export const getSafetyFlags        = () => api.get('/clinic/dashboard/safety-flags');
export const resolveSafetyFlag     = (id) => api.patch(`/clinic/ai-insights/${id}/resolve`);
export const getPatientAiInsights  = (clientProfileId) => api.get(`/clinic/patients/${clientProfileId}/ai-insights`);

export const getClinicAccessRequests = () => api.get('/clinic/access-requests');
export const updateAccessRequest = (id, action) =>
    api.patch(`/clinic/access-requests/${id}`, { action });

export const createClinicProfile = (formData) =>
    api.post('/clinic/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

export const updateClinicProfile = (formData) =>
    api.post('/clinic/profile/update', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
