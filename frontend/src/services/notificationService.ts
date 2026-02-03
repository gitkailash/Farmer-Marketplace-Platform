import { apiGet, apiPost, apiPut, apiDelete } from './api';
import { Notification, ApiResponse, PaginatedResponse } from '../types/api';

export interface NotificationCreateRequest {
  userId: string;
  type: 'ORDER_UPDATE' | 'NEW_MESSAGE' | 'REVIEW_APPROVED' | 'ADMIN_ANNOUNCEMENT';
  title: string;
  message: string;
  language?: 'en' | 'ne'; // Language preference for the notification
  data?: Record<string, any>;
}

export interface LocalizedNotificationRequest {
  userId: string;
  templateKey: string;
  variables?: Record<string, string>;
  userLanguage?: 'en' | 'ne';
}

export const notificationService = {
  // Get user's notifications
  getNotifications: async (page = 1, limit = 20): Promise<PaginatedResponse<Notification>> => {
    return apiGet<Notification[]>(`/notifications?page=${page}&limit=${limit}`) as Promise<PaginatedResponse<Notification>>;
  },

  // Get unread notifications count
  getUnreadCount: async (): Promise<ApiResponse<{ count: number }>> => {
    return apiGet<{ count: number }>('/notifications/unread-count');
  },

  // Mark notification as read
  markAsRead: async (notificationId: string): Promise<ApiResponse<void>> => {
    return apiPut<void>(`/notifications/${notificationId}/read`);
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<ApiResponse<void>> => {
    return apiPut<void>('/notifications/mark-all-read');
  },

  // Delete notification
  deleteNotification: async (notificationId: string): Promise<ApiResponse<void>> => {
    return apiDelete<void>(`/notifications/${notificationId}`);
  },

  // Clear all notifications
  clearAllNotifications: async (): Promise<ApiResponse<void>> => {
    return apiDelete<void>('/notifications/clear-all');
  },

  // Create notification (admin only)
  createNotification: async (notificationData: NotificationCreateRequest): Promise<ApiResponse<Notification>> => {
    return apiPost<Notification>('/notifications', notificationData);
  },

  // Create localized notification using template
  createLocalizedNotification: async (request: LocalizedNotificationRequest): Promise<ApiResponse<Notification>> => {
    return apiPost<Notification>('/notifications/localized', request);
  },

  // Send localized broadcast notification (admin only)
  sendLocalizedBroadcast: async (notification: {
    templateKey: string;
    variables?: Record<string, string>;
    targetRole?: 'BUYER' | 'FARMER' | 'ALL';
    targetLanguage?: 'en' | 'ne' | 'both';
  }): Promise<ApiResponse<void>> => {
    return apiPost<void>('/notifications/broadcast-localized', notification);
  },

  // Get system message in user's preferred language
  getSystemMessage: async (messageKey: string, variables?: Record<string, string>): Promise<ApiResponse<{ message: string; language: 'en' | 'ne' }>> => {
    const params = new URLSearchParams();
    params.append('messageKey', messageKey);
    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        params.append(`variables[${key}]`, value);
      });
    }
    return apiGet<{ message: string; language: 'en' | 'ne' }>(`/notifications/system-message?${params.toString()}`);
  },

  // Send broadcast notification (admin only)
  sendBroadcast: async (notification: {
    title: string;
    message: string;
    type: 'ADMIN_ANNOUNCEMENT';
    targetRole?: 'BUYER' | 'FARMER' | 'ALL';
  }): Promise<ApiResponse<void>> => {
    return apiPost<void>('/notifications/broadcast', notification);
  },

  // Get notification preferences
  getPreferences: async (): Promise<ApiResponse<{
    orderUpdates: boolean;
    newMessages: boolean;
    reviewApprovals: boolean;
    adminAnnouncements: boolean;
    emailNotifications: boolean;
  }>> => {
    return apiGet('/notifications/preferences');
  },

  // Update notification preferences with language preference
  updatePreferences: async (preferences: {
    orderUpdates?: boolean;
    newMessages?: boolean;
    reviewApprovals?: boolean;
    adminAnnouncements?: boolean;
    emailNotifications?: boolean;
    preferredLanguage?: 'en' | 'ne'; // Language preference for notifications
  }): Promise<ApiResponse<void>> => {
    return apiPut<void>('/notifications/preferences', preferences);
  },
};