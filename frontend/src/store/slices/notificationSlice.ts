import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Notification {
  id: string
  type: 'message' | 'order' | 'review' | 'system'
  title: string
  message: string
  isRead: boolean
  createdAt: string
  data?: any // Additional data for the notification
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
}

// Load notifications from localStorage
const loadNotificationsFromStorage = (): Notification[] => {
  try {
    const stored = localStorage.getItem('notifications')
    if (stored) {
      const parsed = JSON.parse(stored)
      // Filter out notifications older than 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return parsed.filter((n: Notification) => new Date(n.createdAt) > thirtyDaysAgo)
    }
  } catch (error) {
    console.error('Failed to load notifications from localStorage:', error)
  }
  return []
}

// Save notifications to localStorage
const saveNotificationsToStorage = (notifications: Notification[]) => {
  try {
    localStorage.setItem('notifications', JSON.stringify(notifications))
  } catch (error) {
    console.error('Failed to save notifications to localStorage:', error)
  }
}

const storedNotifications = loadNotificationsFromStorage()

const initialState: NotificationState = {
  notifications: storedNotifications,
  unreadCount: storedNotifications.filter(n => !n.isRead).length,
  loading: false,
  error: null
}

// Helper function to generate unique ID
const generateId = () => `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'isRead' | 'createdAt'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: generateId(),
        isRead: false,
        createdAt: new Date().toISOString()
      }
      
      state.notifications.unshift(notification)
      state.unreadCount += 1
      
      // Keep only last 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50)
      }
      
      // Persist to localStorage
      saveNotificationsToStorage(state.notifications)
    },

    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload)
      if (notification && !notification.isRead) {
        notification.isRead = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
        // Persist to localStorage
        saveNotificationsToStorage(state.notifications)
      }
    },

    markAllAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.isRead = true
      })
      state.unreadCount = 0
      // Persist to localStorage
      saveNotificationsToStorage(state.notifications)
    },

    removeNotification: (state, action: PayloadAction<string>) => {
      const index = state.notifications.findIndex(n => n.id === action.payload)
      if (index !== -1) {
        const notification = state.notifications[index]
        if (!notification.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1)
        }
        state.notifications.splice(index, 1)
        // Persist to localStorage
        saveNotificationsToStorage(state.notifications)
      }
    },

    clearAllNotifications: (state) => {
      state.notifications = []
      state.unreadCount = 0
      // Persist to localStorage
      saveNotificationsToStorage(state.notifications)
    },

    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.notifications = action.payload
      state.unreadCount = action.payload.filter(n => !n.isRead).length
      // Persist to localStorage
      saveNotificationsToStorage(state.notifications)
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },

    // Specific notification creators for different types
    addMessageNotification: (state, action: PayloadAction<{
      senderName: string
      message: string
      senderId: string
    }>) => {
      const { senderName, message, senderId } = action.payload
      const notification: Notification = {
        id: generateId(),
        type: 'message',
        title: `New message from ${senderName}`,
        message: message.length > 100 ? `${message.substring(0, 100)}...` : message,
        isRead: false,
        createdAt: new Date().toISOString(),
        data: { senderId, senderName }
      }
      
      state.notifications.unshift(notification)
      state.unreadCount += 1
      
      // Keep only last 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50)
      }
      
      // Persist to localStorage
      saveNotificationsToStorage(state.notifications)
    },

    addOrderNotification: (state, action: PayloadAction<{
      orderId: string
      status: string
      buyerName?: string
      farmerName?: string
    }>) => {
      const { orderId, status, buyerName, farmerName } = action.payload
      let title = ''
      let message = ''
      
      switch (status) {
        case 'PENDING':
          title = 'New Order Received'
          message = `You have a new order from ${buyerName || 'a buyer'}`
          break
        case 'ACCEPTED':
          title = 'Order Accepted'
          message = `${farmerName || 'The farmer'} has accepted your order`
          break
        case 'COMPLETED':
          title = 'Order Completed'
          message = 'Your order has been completed. You can now leave a review.'
          break
        case 'CANCELLED':
          title = 'Order Cancelled'
          message = 'An order has been cancelled'
          break
        default:
          title = 'Order Update'
          message = `Order status changed to ${status}`
      }
      
      const notification: Notification = {
        id: generateId(),
        type: 'order',
        title,
        message,
        isRead: false,
        createdAt: new Date().toISOString(),
        data: { orderId, status, buyerName, farmerName }
      }
      
      state.notifications.unshift(notification)
      state.unreadCount += 1
      
      // Keep only last 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50)
      }
      
      // Persist to localStorage
      saveNotificationsToStorage(state.notifications)
    },

    addReviewNotification: (state, action: PayloadAction<{
      reviewerName: string
      rating: number
      isApproved: boolean
    }>) => {
      const { reviewerName, rating, isApproved } = action.payload
      const title = isApproved ? 'New Review Approved' : 'Review Submitted'
      const message = isApproved 
        ? `${reviewerName} left you a ${rating}-star review`
        : `${reviewerName} submitted a review (pending approval)`
      
      const notification: Notification = {
        id: generateId(),
        type: 'review',
        title,
        message,
        isRead: false,
        createdAt: new Date().toISOString(),
        data: { reviewerName, rating, isApproved }
      }
      
      state.notifications.unshift(notification)
      state.unreadCount += 1
      
      // Keep only last 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50)
      }
      
      // Persist to localStorage
      saveNotificationsToStorage(state.notifications)
    }
  }
})

export const {
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  clearAllNotifications,
  setNotifications,
  setLoading,
  setError,
  addMessageNotification,
  addOrderNotification,
  addReviewNotification
} = notificationSlice.actions

export default notificationSlice.reducer

// Selectors
export const selectNotifications = (state: { notifications: NotificationState }) => state.notifications.notifications
export const selectUnreadCount = (state: { notifications: NotificationState }) => state.notifications.unreadCount
export const selectNotificationLoading = (state: { notifications: NotificationState }) => state.notifications.loading
export const selectNotificationError = (state: { notifications: NotificationState }) => state.notifications.error
export const selectUnreadNotifications = (state: { notifications: NotificationState }) => 
  state.notifications.notifications.filter(n => !n.isRead)
export const selectNotificationsByType = (type: Notification['type']) => (state: { notifications: NotificationState }) =>
  state.notifications.notifications.filter(n => n.type === type)