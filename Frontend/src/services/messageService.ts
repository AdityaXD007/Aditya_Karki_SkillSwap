import type { Conversation } from './types';

export const messagesApi = {
    getConversations: async (): Promise<Conversation[]> => {
        // Mock data - replace with real API call
        return Promise.resolve([
            {
                id: '1',
                userName: 'Alice Johnson',
                userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
                lastMessage: 'Looking forward to our session!',
                lastMessageTime: '2026-01-12T10:30:00Z',
                unreadCount: 2,
            },
            {
                id: '2',
                userName: 'Bob Smith',
                userAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop',
                lastMessage: 'Thanks for the help with TypeScript!',
                lastMessageTime: '2026-01-11T15:45:00Z',
                unreadCount: 0,
            },
        ]);
    },

    send: async (conversationId: string, message: string): Promise<void> => {
        // Mock implementation - replace with real API call
        console.log(`Sending message to ${conversationId}: ${message}`);
        return Promise.resolve();
    },
};
