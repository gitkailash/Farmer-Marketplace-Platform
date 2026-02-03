import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export interface ToastData {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastProps extends ToastData {
  onRemove: (id: string) => void
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  action,
  onRemove
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleRemove()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration])

  const handleRemove = () => {
    setIsRemoving(true)
    setTimeout(() => {
      onRemove(id)
    }, 300)
  }

  const typeStyles = {
    success: {
      container: 'bg-green-50 border-green-200',
      icon: '✅',
      iconColor: 'text-green-500',
      titleColor: 'text-green-800',
      messageColor: 'text-green-700'
    },
    error: {
      container: 'bg-red-50 border-red-200',
      icon: '❌',
      iconColor: 'text-red-500',
      titleColor: 'text-red-800',
      messageColor: 'text-red-700'
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200',
      icon: '⚠️',
      iconColor: 'text-yellow-500',
      titleColor: 'text-yellow-800',
      messageColor: 'text-yellow-700'
    },
    info: {
      container: 'bg-blue-50 border-blue-200',
      icon: 'ℹ️',
      iconColor: 'text-blue-500',
      titleColor: 'text-blue-800',
      messageColor: 'text-blue-700'
    }
  }

  const styles = typeStyles[type]

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isRemoving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        max-w-sm w-full bg-white shadow-lg rounded-lg border pointer-events-auto
        ${styles.container}
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className={`text-lg ${styles.iconColor}`}>
              {styles.icon}
            </span>
          </div>
          
          <div className="ml-3 w-0 flex-1">
            {title && (
              <p className={`text-sm font-medium ${styles.titleColor}`}>
                {title}
              </p>
            )}
            
            <p className={`text-sm ${title ? 'mt-1' : ''} ${styles.messageColor}`}>
              {message}
            </p>
            
            {action && (
              <div className="mt-3">
                <button
                  onClick={action.onClick}
                  className="text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  {action.label}
                </button>
              </div>
            )}
          </div>
          
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={handleRemove}
              className="rounded-md inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Toast Container Component
interface ToastContainerProps {
  toasts: ToastData[]
  onRemove: (id: string) => void
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null

  const containerContent = (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="flex flex-col items-end justify-start min-h-screen pt-4 pr-4 space-y-4">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  )

  return createPortal(containerContent, document.body)
}

// Toast Hook for managing toasts
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const addToast = (toast: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { ...toast, id }])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const clearToasts = () => {
    setToasts([])
  }

  // Convenience methods
  const success = (message: string, title?: string, options?: Partial<ToastData>) => {
    addToast({ type: 'success', message, title, ...options })
  }

  const error = (message: string, title?: string, options?: Partial<ToastData>) => {
    addToast({ type: 'error', message, title, ...options })
  }

  const warning = (message: string, title?: string, options?: Partial<ToastData>) => {
    addToast({ type: 'warning', message, title, ...options })
  }

  const info = (message: string, title?: string, options?: Partial<ToastData>) => {
    addToast({ type: 'info', message, title, ...options })
  }

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    success,
    error,
    warning,
    info
  }
}