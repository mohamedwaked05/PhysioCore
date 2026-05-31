import api from './axios';

const SKIP = { _skipAuthRedirect: true };

export const getMessages              = (params)   => api.get('/messages', { params });
export const getClinicThreads         = ()         => api.get('/messages/threads');
export const getMessage               = (id)       => api.get(`/messages/${id}`);
export const sendMessage              = (data)     => api.post('/messages', data);
export const getNotifications         = ()         => api.get('/messages/notifications');
export const markAllNotificationsRead = ()         => api.post('/messages/notifications/read');
export const markMessageRead          = (id)       => api.patch(`/messages/${id}/read`);
export const markDelivered            = (ids)      => api.post('/messages/delivered', { message_ids: ids }, { ...SKIP });
export const markSeen                 = (params)   => api.post('/messages/seen', params, { ...SKIP });
export const uploadChatImage          = (file)     => {
    const fd = new FormData();
    fd.append('image', file);
    return api.post('/messages/upload-image', fd);
};
