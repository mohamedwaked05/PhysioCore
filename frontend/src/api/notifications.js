import api from './axios';

// All notification calls use _skipAuthRedirect so a stale token on a
// background mark-seen call never triggers a global logout.
const SKIP = { _skipAuthRedirect: true };

export const fetchNotifications       = ()    => api.get('/notifications', { ...SKIP });
export const markNotificationSeen     = (id)  => api.patch(`/notifications/${id}/seen`, {}, { ...SKIP });
export const markAllNotificationsSeen = ()    => api.post('/notifications/seen-all', {}, { ...SKIP });
