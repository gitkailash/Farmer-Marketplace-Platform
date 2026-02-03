import React, { createContext, useContext } from 'react'
import { ToastContainer, useToast } from '../components/UI/Toast'
import type { ToastData } from '../components/UI/Toast'

interface ToastContextType {
  addToast: (toast: Omit<ToastData, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
  success: (message: string, title?: string, options?: Partial<ToastData>) => void
  error: (message: string, title?: string, options?: Partial<ToastData>) => void
  warning: (message: string, title?: string, options?: Partial<ToastData>) => void
  info: (message: string, title?: string, options?: Partial<ToastData>) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToastContext = () => {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: React.ReactNode
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const toast = useToast()

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </ToastContext.Provider>
  )
}