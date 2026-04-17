import api from './axios';

export const getMessages = (params) => api.get('/messages', { params });
export const sendMessage = (data) => api.post('/messages', data);
export const getNotifications = () => api.get('/messages/notifications');
