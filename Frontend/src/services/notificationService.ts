import apiClient from './apiClient';
import type { Notification } from './types';

export const notificationsAPI = {
    getNotifications: () => apiClient.get<Notification[]>('/notifications/'),
    markAsRead: (id: number) => apiClient.post(`/notifications/${id}/mark_as_read/`),
    markAllAsRead: () => apiClient.post('/notifications/mark_all_as_read/'),
    clearAll: () => apiClient.delete('/notifications/clear_all/'),
};
