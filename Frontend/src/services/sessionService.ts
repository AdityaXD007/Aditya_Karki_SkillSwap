import apiClient from './apiClient';
import type { LearningSession } from './types';

export const sessionsAPI = {
    getSessions: () => apiClient.get<LearningSession[]>('/sessions/'),
    startSession: (id: number) => apiClient.post(`/sessions/${id}/start_session/`),
    pauseSession: (id: number) => apiClient.post(`/sessions/${id}/pause_session/`),
    resumeSession: (id: number) => apiClient.post(`/sessions/${id}/resume_session/`),
    endSession: (id: number) => apiClient.post(`/sessions/${id}/end_session/`),
};
