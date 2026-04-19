import apiClient from './apiClient';

export interface Notification {
    id: number;
    sender_username?: string;
    sender_avatar?: string;
    notification_type: 'SESSION_CANCELLED' | 'REQUEST_WITHDRAWN' | 'SESSION_ACCEPTED' | 'NEW_REQUEST' | 'GENERAL';
    title: string;
    content: string;
    link?: string;
    is_read: boolean;
    created_at: string;
}

export const notificationsAPI = {
    getNotifications: () => apiClient.get<Notification[]>('/notifications/'),
    markAsRead: (id: number) => apiClient.post(`/notifications/${id}/mark_as_read/`),
    markAllAsRead: () => apiClient.post('/notifications/mark_all_as_read/'),
    clearAll: () => apiClient.delete('/notifications/clear_all/'),
};
