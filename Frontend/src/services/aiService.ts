import apiClient from './apiClient';

export interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export const aiService = {
    sendMessage: async (message: string, history: Message[]) => {
        try {
            const response = await apiClient.post('/ai/chat/', { message, history });
            return response.data.response;
        } catch (error) {
            console.error('Error sending message to AI:', error);
            throw error;
        }
    },
};
