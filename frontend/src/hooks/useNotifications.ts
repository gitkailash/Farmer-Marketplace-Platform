import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useAuth } from '../contexts/AuthProvider'
import { 
  addMessageNotification,
  addOrderNotification,
  addReviewNotification
} from '../store/slices/notificationSlice'
import { RootState } from '../store'

export const useNotifications = () => {
  const dispatch = useDispatch()
  const { user } = useAuth()

  // Helper functions to create notifications
  const notifyNewMessage = (senderName: string, message: string, senderId: string) => {
    dispatch(addMessageNotification({
      senderName,
      message,
      senderId
    }))
  }

  const notifyOrderUpdate = (orderId: string, status: string, buyerName?: string, farmerName?: string) => {
    dispatch(addOrderNotification({
      orderId,
      status,
      buyerName,
      farmerName
    }))
  }

  const notifyNewReview = (reviewerName: string, rating: number, isApproved: boolean = false) => {
    dispatch(addReviewNotification({
      reviewerName,
      rating,
      isApproved
    }))
  }

  // In a real application, you would set up WebSocket connections or polling here
  // For now, we'll provide the notification functions for manual triggering
  
  return {
    notifyNewMessage,
    notifyOrderUpdate,
    notifyNewReview
  }
}

// Hook for checking new messages periodically
export const useMessageNotifications = () => {
  const dispatch = useDispatch()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    // This would typically connect to a WebSocket or set up polling
    // For now, we'll simulate with a simple interval check
    const checkForNewMessages = async () => {
      try {
        // In a real implementation, you would:
        // 1. Call an API to check for new messages since last check
        // 2. Compare with local state to identify truly new messages
        // 3. Create notifications for new messages
        
        // For now, this is a placeholder that would be implemented
        // when real-time messaging is added
      } catch (error) {
        console.error('Failed to check for new messages:', error)
      }
    }

    // Check every 2 minutes when user is active (reduced frequency to prevent message handler violations)
    const interval = setInterval(checkForNewMessages, 120000) // Changed from 30000 to 120000 (2 minutes)

    // Check immediately on mount
    checkForNewMessages()

    return () => clearInterval(interval)
  }, [user, dispatch])
}

// Hook for order notifications
export const useOrderNotifications = () => {
  const dispatch = useDispatch()
  const { user } = useAuth()

  const notifyOrderStatusChange = (orderId: string, newStatus: string, otherPartyName?: string) => {
    if (user?.role === 'FARMER') {
      // Farmer receives notifications about new orders and order updates
      if (newStatus === 'PENDING') {
        dispatch(addOrderNotification({
          orderId,
          status: newStatus,
          buyerName: otherPartyName
        }))
      }
    } else if (user?.role === 'BUYER') {
      // Buyer receives notifications about order acceptance and completion
      if (['ACCEPTED', 'COMPLETED', 'CANCELLED'].includes(newStatus)) {
        dispatch(addOrderNotification({
          orderId,
          status: newStatus,
          farmerName: otherPartyName
        }))
      }
    }
  }

  return {
    notifyOrderStatusChange
  }
}

// Hook for review notifications
export const useReviewNotifications = () => {
  const dispatch = useDispatch()
  const { user } = useAuth()

  const notifyReviewReceived = (reviewerName: string, rating: number) => {
    dispatch(addReviewNotification({
      reviewerName,
      rating,
      isApproved: false // Reviews need approval first
    }))
  }

  const notifyReviewApproved = (reviewerName: string, rating: number) => {
    dispatch(addReviewNotification({
      reviewerName,
      rating,
      isApproved: true
    }))
  }

  return {
    notifyReviewReceived,
    notifyReviewApproved
  }
}