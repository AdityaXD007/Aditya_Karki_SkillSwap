import apiClient from './apiClient';
import type { Conversation, Message } from './types';

export const messagesApi = {
    getConversations: async (): Promise<Conversation[]> => {
        const response = await apiClient.get<any[]>('/chat/conversations/');
        return response.data.map((c: any) => ({
            id: c.id,
            userName: c.partner_name,
            userAvatar: c.partner_avatar || `https://ui-avatars.com/api/?name=${c.partner_name}&background=random`,
            lastMessage: c.last_message || 'Start a conversation',
            lastMessageTime: c.updated_at,
            unreadCount: c.unread_count || 0,
        }));
    },

    getMessages: async (conversationId: number): Promise<Message[]> => {
        const response = await apiClient.get<any[]>(`/chat/messages/?conversation_id=${conversationId}`);
        return response.data.map((m: any) => ({
            id: m.id,
            text: m.content,
            senderId: m.sender,
            userName: m.sender_name,
            userAvatar: m.sender_avatar || `https://ui-avatars.com/api/?name=${m.sender_name}&background=random`,
            timestamp: m.timestamp,
            isRead: m.is_read
        }));
    },

    send: async (conversationId: number, message: string): Promise<void> => {
        await apiClient.post('/chat/messages/', {
            conversation: conversationId,
            content: message
        });
    },
};
