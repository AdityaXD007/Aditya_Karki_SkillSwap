import apiClient from './apiClient';
import type { LearningSession } from './types';

export const sessionsAPI = {
    getSessions: () => apiClient.get<LearningSession[]>('/sessions/'),
    startSession: (id: number) => apiClient.post(`/sessions/${id}/start_session/`),
    pauseSession: (id: number) => apiClient.post(`/sessions/${id}/pause_session/`),
    resumeSession: (id: number) => apiClient.post(`/sessions/${id}/resume_session/`),
    endSession: (id: number) => apiClient.post(`/sessions/${id}/end_session/`),
    cancelSession: (id: number, reason: string) => apiClient.post(`/sessions/${id}/cancel/`, { reason }),
    rescheduleSession: (id: number, newTime: string, reason: string) => apiClient.post(`/sessions/${id}/reschedule/`, { new_time: newTime, reason }),
    acceptReschedule: (id: number) => apiClient.post(`/sessions/${id}/accept_reschedule/`),
    rejectReschedule: (id: number) => apiClient.post(`/sessions/${id}/reject_reschedule/`),
};
