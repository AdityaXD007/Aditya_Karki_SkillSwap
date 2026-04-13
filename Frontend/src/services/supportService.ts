import apiClient from './apiClient';

export const supportAPI = {
    submitContact: (data: { full_name: string; email: string; subject: string; message: string }) => {
        return apiClient.post('/contact/', data);
    },
    submitFeedback: (data: { type: string; subject: string; message: string }) => {
        return apiClient.post('/feedback/', data);
    }
};
