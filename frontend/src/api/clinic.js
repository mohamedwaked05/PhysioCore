import api from './axios';

export const getClinicProfile = () => api.get('/clinic/profile');

export const createClinicProfile = (formData) =>
    api.post('/clinic/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

export const updateClinicProfile = (formData) =>
    api.post('/clinic/profile/update', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
