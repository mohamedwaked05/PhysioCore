import api from './axios';

export const getClinicProfile = () => api.get('/clinic/profile');

export const getDashboardCounts = () => api.get('/clinic/dashboard/counts');

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
