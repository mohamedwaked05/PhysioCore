import api from './axios';

export const getMessages             = (params) => api.get('/messages', { params });
export const sendMessage             = (data)   => api.post('/messages', data);
export const getNotifications        = ()        => api.get('/messages/notifications');
export const markAllNotificationsRead = ()       => api.post('/messages/notifications/read');
export const markMessageRead          = (id)     => api.patch(`/messages/${id}/read`);
