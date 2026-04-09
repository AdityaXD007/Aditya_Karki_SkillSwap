import apiClient from './apiClient';
import type { SessionRequest } from './types';

export const requestsAPI = {
    getRequests: () => apiClient.get<SessionRequest[]>('/requests/'),

    sendRequest: (data: {
        partner: number;
        skill_to_learn: number;
        session_length: number;
        message: string;
        proposed_time?: string;
    }) => apiClient.post('/requests/', data),

    acceptRequest: (id: number, data?: { scheduled_time?: string }) =>
        apiClient.post(`/requests/${id}/accept/`, data || {}),

    rejectRequest: (id: number) => apiClient.post(`/requests/${id}/reject/`),
    withdrawRequest: (id: number) => apiClient.patch(`/requests/${id}/withdraw/`),
};
