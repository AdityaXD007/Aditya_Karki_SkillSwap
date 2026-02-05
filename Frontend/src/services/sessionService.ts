import apiClient from './apiClient';
import type { LearningSession } from './types';

export const sessionsAPI = {
    getSessions: () => apiClient.get<LearningSession[]>('/sessions/'),
};
