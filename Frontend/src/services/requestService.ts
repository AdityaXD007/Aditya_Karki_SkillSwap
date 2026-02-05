import apiClient from './apiClient';
import type { SessionRequest } from './types';

export const requestsAPI = {
    getRequests: () => apiClient.get<SessionRequest[]>('/requests/'),

    sendRequest: (data: {
        partner: number;
        skill_to_learn: number;
        session_length: number;
        message: string
    }) => apiClient.post('/requests/', data),

    acceptRequest: (id: number) => apiClient.post(`/requests/${id}/accept/`),

    rejectRequest: (id: number) => apiClient.post(`/requests/${id}/reject/`),
};
