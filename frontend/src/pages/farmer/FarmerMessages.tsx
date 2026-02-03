import React, { useState, useEffect } from 'react'
import { MessageList, MessageThread } from '../../components/Messaging'
import { MessageThread as MessageThreadType } from '../../services/messageService'
import { EmptyState, LoadingSpinner, ErrorDisplay } from '../../components/UI'
import { messageService } from '../../services/messageService'
import { useMessageNotifications } from '../../hooks/useNotifications'

interface MessageNotifications {
  unreadCount: number
  newMessagesCount: number
  activeThreads: number
}

const FarmerMessages: React.FC = () => {
  const [selectedThread, setSelectedThread] = useState<MessageThreadType | null>(null)
  const [notifications, setNotifications] = useState<MessageNotifications>({
    unreadCount: 0,
    newMessagesCount: 0,
    activeThreads: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize message notifications hook
  useMessageNotifications()

  // Load message notifications
  const loadNotifications = async () => {
    try {
      const [threadsResponse, unreadResponse] = await Promise.all([
        messageService.getMessageThreads(),
        messageService.getUnreadCount()
      ])

      if (threadsResponse.success && threadsResponse.data) {
        const threads = threadsResponse.data
        const unreadCount = unreadResponse.success && unreadResponse.data 
          ? unreadResponse.data.count 
          : 0

        // Calculate new messages (messages from today)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const newMessagesCount = threads.filter(thread => 
          thread.lastMessage && 
          new Date(thread.lastMessage.createdAt) >= today &&
          thread.unreadCount > 0
        ).length

        setNotifications({
          unreadCount,
          newMessagesCount,
          activeThreads: threads.length
        })
      }
    } catch (err) {
      console.error('Failed to load message notifications:', err)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        await loadNotifications()
      } catch (err) {
        setError('Failed to load messages')
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // Disabled polling for V1 since messaging is not needed until V2
    // Poll for new messages every 30 seconds
    // const interval = setInterval(loadNotifications, 30000)
    // return () => clearInterval(interval)
  }, [])

  const handleSelectThread = (thread: MessageThreadType) => {
    setSelectedThread(thread)
    // Refresh notifications when a thread is selected (in case messages were read)
    setTimeout(loadNotifications, 1000)
  }

  const handleCloseThread = () => {
    setSelectedThread(null)
    // Refresh notifications when thread is closed
    loadNotifications()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600">Communicate with buyers about orders and products</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600">Communicate with buyers about orders and products</p>
        </div>
        <ErrorDisplay 
          message={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Notifications */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600">Communicate with buyers about orders and products</p>
        </div>
        
        {/* Message Notifications */}
        <div className="flex gap-3">
          {notifications.unreadCount > 0 && (
            <div className="bg-blue-100 border border-blue-200 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-blue-600 text-lg">💬</span>
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    {notifications.unreadCount} Unread Message{notifications.unreadCount > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-blue-700">
                    {notifications.activeThreads} active conversation{notifications.activeThreads > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {notifications.newMessagesCount > 0 && (
            <div className="bg-green-100 border border-green-200 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-lg">🆕</span>
                <div>
                  <p className="text-sm font-medium text-green-900">
                    {notifications.newMessagesCount} New Today
                  </p>
                  <p className="text-xs text-green-700">Recent messages from buyers</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Message List */}
        <div className="lg:col-span-1">
          <MessageList
            onSelectThread={handleSelectThread}
            selectedThreadId={selectedThread?.participantId}
          />
        </div>

        {/* Message Thread */}
        <div className="lg:col-span-2">
          {selectedThread ? (
            <MessageThread
              participantId={selectedThread.participantId}
              participantName={selectedThread.participantName}
              participantRole={selectedThread.participantRole}
              onClose={handleCloseThread}
            />
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex items-center justify-center">
              <EmptyState
                icon="💬"
                title="Select a Conversation"
                description="Choose a conversation from the list to start messaging with buyers."
              />
            </div>
          )}
        </div>
      </div>

      {/* Messaging Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-blue-400 text-xl">💡</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Messaging Tips
            </h3>
            <div className="text-sm text-blue-700 mt-1">
              <ul className="list-disc list-inside space-y-1">
                <li>Respond promptly to buyer inquiries to build trust</li>
                <li>Be clear about product availability and delivery times</li>
                <li>Use simple language and be friendly in your communications</li>
                <li>All messages are monitored by administrators for quality assurance</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Response Templates */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-gray-400 text-xl">📝</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-800">
              Quick Response Templates
            </h3>
            <div className="text-sm text-gray-700 mt-2 space-y-1">
              <p><strong>Product Availability:</strong> "Thank you for your interest! This product is currently available with [quantity] units in stock."</p>
              <p><strong>Delivery Information:</strong> "I can deliver to your area within [timeframe]. Delivery fee is [amount]."</p>
              <p><strong>Order Confirmation:</strong> "Your order has been received and will be ready for delivery on [date]."</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FarmerMessages