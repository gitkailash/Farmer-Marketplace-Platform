import { apiGet, apiPost, apiPut, apiDelete } from './api';
import { Message, ApiResponse, PaginatedResponse } from '../types/api';

export interface MessageCreateRequest {
  receiverId: string;
  content: string;
  language?: 'en' | 'ne'; // Optional language specification
}

export interface MessageThread {
  participantId: string;
  participantName: string;
  participantRole: 'BUYER' | 'FARMER';
  lastMessage?: Message;
  unreadCount: number;
  languageStats?: {
    totalMessages: number;
    englishMessages: number;
    nepaliMessages: number;
    mixedLanguage: boolean;
  };
}

export const messageService = {
  // Detect message language based on content
  detectLanguage: (content: string): 'en' | 'ne' => {
    // Simple language detection based on character sets
    // Devanagari script range: U+0900-U+097F
    const devanagariRegex = /[\u0900-\u097F]/;
    
    if (devanagariRegex.test(content)) {
      return 'ne';
    }
    
    return 'en'; // Default to English
  },

  // Send a new message with automatic language detection
  sendMessage: async (messageData: MessageCreateRequest): Promise<ApiResponse<Message>> => {
    // Auto-detect language if not provided
    if (!messageData.language) {
      messageData.language = messageService.detectLanguage(messageData.content);
    }
    
    return apiPost<Message>('/messages', messageData);
  },

  // Send message with explicit language
  sendMessageWithLanguage: async (
    receiverId: string, 
    content: string, 
    language: 'en' | 'ne'
  ): Promise<ApiResponse<Message>> => {
    return apiPost<Message>('/messages', { receiverId, content, language });
  },

  // Get conversation between current user and another user
  getConversation: async (participantId: string): Promise<ApiResponse<Message[]>> => {
    return apiGet<Message[]>(`/messages/conversation/${participantId}`);
  },

  // Get all message threads for current user
  getMessageThreads: async (): Promise<ApiResponse<MessageThread[]>> => {
    return apiGet<MessageThread[]>('/messages/conversations');
  },

  // Mark messages as read
  markAsRead: async (participantId: string): Promise<ApiResponse<void>> => {
    return apiPost<void>(`/messages/read/${participantId}`);
  },

  // Mark specific message as read
  markMessageAsRead: async (messageId: string): Promise<ApiResponse<void>> => {
    return apiPut<void>(`/messages/${messageId}/read`);
  },

  // Get unread message count
  getUnreadCount: async (): Promise<ApiResponse<{ count: number }>> => {
    return apiGet<{ count: number }>('/messages/unread/count');
  },

  // Get all messages for current user with pagination
  getMessages: async (page = 1, limit = 50): Promise<PaginatedResponse<Message>> => {
    return apiGet<Message[]>(`/messages?page=${page}&limit=${limit}`) as Promise<PaginatedResponse<Message>>;
  },

  // Delete a message
  deleteMessage: async (messageId: string): Promise<ApiResponse<void>> => {
    return apiDelete<void>(`/messages/${messageId}`);
  },

  // Search messages
  searchMessages: async (query: string): Promise<ApiResponse<Message[]>> => {
    return apiGet<Message[]>(`/messages/search?q=${encodeURIComponent(query)}`);
  },

  // Get message statistics
  getMessageStats: async (): Promise<ApiResponse<{
    total: number;
    unread: number;
    conversations: number;
  }>> => {
    return apiGet('/messages/stats');
  },

  // Report a message (for moderation)
  reportMessage: async (messageId: string, reason: string): Promise<ApiResponse<void>> => {
    return apiPost<void>(`/messages/${messageId}/report`, { reason });
  },

  // Block a user (prevent receiving messages from them)
  blockUser: async (userId: string): Promise<ApiResponse<void>> => {
    return apiPost<void>(`/messages/block/${userId}`);
  },

  // Unblock a user
  unblockUser: async (userId: string): Promise<ApiResponse<void>> => {
    return apiDelete<void>(`/messages/block/${userId}`);
  },

  // Get blocked users list
  getBlockedUsers: async (): Promise<ApiResponse<string[]>> => {
    return apiGet<string[]>('/messages/blocked');
  },
};