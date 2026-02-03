import { store } from '../store';
import { 
  addOrderNotification, 
  addReviewNotification 
} from '../store/slices/notificationSlice';
import { orderService, OrderCreateRequest } from './orderService';
import { messageService, MessageCreateRequest } from './messageService';
import { reviewService, ReviewCreateRequest } from './reviewService';
import { Order, Message, Review, ApiResponse } from '../types/api';

/**
 * Enhanced order service with notification integration
 */
export const notificationAwareOrderService = {
  ...orderService,

  // Override createOrder to add notification for farmer
  createOrder: async (orderData: OrderCreateRequest): Promise<ApiResponse<Order>> => {
    const result = await orderService.createOrder(orderData);
    
    if (result.success && result.data) {
      // Get buyer name for notification
      const buyerName = (result.data as any).buyer?.profile?.name || 'Buyer';
      
      // This notification would typically be sent via WebSocket to the farmer
      // For now, we'll add it to the current user's notifications if they're the farmer
      // In a real implementation, this would be handled by the backend
      console.log('Order created - would notify farmer:', {
        orderId: result.data._id,
        status: 'PENDING',
        buyerName
      });
    }
    
    return result;
  },

  // Override acceptOrder to add notification for buyer
  acceptOrder: async (id: string): Promise<ApiResponse<Order>> => {
    const result = await orderService.acceptOrder(id);
    
    if (result.success && result.data) {
      const farmerName = (result.data as any).farmer?.location?.district || 'Farmer';
      
      // Add notification for order acceptance
      store.dispatch(addOrderNotification({
        orderId: id,
        status: 'ACCEPTED',
        farmerName
      }));
    }
    
    return result;
  },

  // Override completeOrder to add notification for buyer
  completeOrder: async (id: string): Promise<ApiResponse<Order>> => {
    const result = await orderService.completeOrder(id);
    
    if (result.success && result.data) {
      const farmerName = (result.data as any).farmer?.location?.district || 'Farmer';
      
      // Add notification for order completion
      store.dispatch(addOrderNotification({
        orderId: id,
        status: 'COMPLETED',
        farmerName
      }));
    }
    
    return result;
  },

  // Override cancelOrder to add notification
  cancelOrder: async (id: string): Promise<ApiResponse<Order>> => {
    const result = await orderService.cancelOrder(id);
    
    if (result.success) {
      // Add notification for order cancellation
      store.dispatch(addOrderNotification({
        orderId: id,
        status: 'CANCELLED'
      }));
    }
    
    return result;
  }
};

/**
 * Enhanced message service with notification integration
 */
export const notificationAwareMessageService = {
  ...messageService,

  // Override sendMessage to add notification for receiver
  sendMessage: async (messageData: MessageCreateRequest): Promise<ApiResponse<Message>> => {
    const result = await messageService.sendMessage(messageData);
    
    if (result.success && result.data) {
      // In a real implementation, this notification would be sent to the receiver
      // via WebSocket or server-sent events. For now, we'll log it.
      console.log('Message sent - would notify receiver:', {
        receiverId: messageData.receiverId,
        content: messageData.content
      });
    }
    
    return result;
  },

  // Enhanced getConversation that marks messages as read and clears notifications
  getConversation: async (participantId: string): Promise<ApiResponse<Message[]>> => {
    const result = await messageService.getConversation(participantId);
    
    if (result.success) {
      // Mark messages as read
      await messageService.markAsRead(participantId);
    }
    
    return result;
  }
};

/**
 * Enhanced review service with notification integration
 */
export const notificationAwareReviewService = {
  ...reviewService,

  // Override submitReview to add notification for reviewee
  submitReview: async (reviewData: ReviewCreateRequest): Promise<ApiResponse<Review>> => {
    const result = await reviewService.submitReview(reviewData);
    
    if (result.success && result.data) {
      // Get reviewer name from current user context
      const state = store.getState();
      const reviewerName = state.auth.user?.profile?.name || 'Someone';
      
      // Add notification for review submission (pending approval)
      store.dispatch(addReviewNotification({
        reviewerName,
        rating: reviewData.rating,
        isApproved: false
      }));
      
      console.log('Review submitted - would notify reviewee:', {
        revieweeId: reviewData.revieweeId,
        reviewerName,
        rating: reviewData.rating
      });
    }
    
    return result;
  }
};

/**
 * Admin notification service for system announcements
 */
export const adminNotificationService = {
  // Send system-wide announcement
  sendSystemAnnouncement: (title: string, message: string) => {
    store.dispatch(addOrderNotification({
      orderId: 'system',
      status: 'SYSTEM_ANNOUNCEMENT',
      // Override the default message formatting for system announcements
    }));
    
    // In a real implementation, this would call a backend API
    // that sends notifications to all users
    console.log('System announcement sent:', { title, message });
  },

  // Notify about review approval
  notifyReviewApproval: (reviewerName: string, rating: number, revieweeId: string) => {
    store.dispatch(addReviewNotification({
      reviewerName,
      rating,
      isApproved: true
    }));
    
    console.log('Review approved - would notify reviewee:', {
      revieweeId,
      reviewerName,
      rating
    });
  },

  // Notify about content moderation actions
  notifyContentModeration: (action: string, contentType: string, userId: string) => {
    // In a real implementation, this would send targeted notifications
    console.log('Content moderation action:', { action, contentType, userId });
  }
};

/**
 * Notification polling service for real-time updates
 * In a production app, this would be replaced with WebSocket connections
 */
export const notificationPollingService = {
  startPolling: () => {
    // Poll for new notifications every 30 seconds
    const interval = setInterval(async () => {
      try {
        // In a real implementation, this would call backend APIs to check for:
        // 1. New messages
        // 2. Order status updates
        // 3. Review approvals
        // 4. System announcements
        
        // For now, we'll just log that polling is active
        console.log('Polling for notifications...');
      } catch (error) {
        console.error('Notification polling error:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }
};

/**
 * WebSocket service for real-time notifications
 * This would be implemented in a production environment
 */
export const webSocketNotificationService = {
  connect: (userId: string) => {
    // In a real implementation:
    // 1. Connect to WebSocket server
    // 2. Subscribe to user-specific notification channel
    // 3. Handle incoming notifications and dispatch to Redux store
    
    console.log('WebSocket notification service would connect for user:', userId);
    
    return {
      disconnect: () => {
        console.log('WebSocket notification service would disconnect');
      }
    };
  }
};