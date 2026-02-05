import apiClient from './apiClient';
import type { Match } from './types';

export const matchesApi = {
    getRecommended: () => apiClient.get<Match[]>('/matches/recommended/'),

    search: (query: string) => apiClient.get<Match[]>(`/matches/?search=${query}`),
};
