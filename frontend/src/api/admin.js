import api from './axios';

export const getAdminStats       = ()           => api.get('/admin/stats');
export const getAdminClinics     = (params)     => api.get('/admin/clinics', { params });
export const getAdminClinic      = (id)         => api.get(`/admin/clinics/${id}`);
export const approveClinic       = (id)         => api.post(`/admin/clinics/${id}/approve`);
export const rejectClinic        = (id, data)   => api.post(`/admin/clinics/${id}/reject`, data);
export const getAdminUsers       = (params)     => api.get('/admin/users', { params });
export const toggleUserStatus    = (id, data)   => api.patch(`/admin/users/${id}/status`, data);
export const getAdminSafetyFlags = (params)     => api.get('/admin/safety-flags', { params });
export const adminResolveFlag    = (id)         => api.patch(`/admin/safety-flags/${id}/resolve`);
