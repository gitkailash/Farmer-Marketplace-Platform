import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { selectUnreadCount } from '../../store/slices/notificationSlice'
import { RootState } from '../../store'
import { NotificationCenter } from './NotificationCenter'

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const unreadCount = useSelector((state: RootState) => selectUnreadCount(state))

  const toggleNotifications = () => {
    setIsOpen(!isOpen)
  }

  const closeNotifications = () => {
    setIsOpen(false)
  }

  return (
    <>
      <button
        onClick={toggleNotifications}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md"
        aria-label="Notifications"
      >
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
          />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-[1.25rem] h-5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationCenter 
        isOpen={isOpen}
        onClose={closeNotifications}
      />
    </>
  )
}