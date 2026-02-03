import React, { useEffect, useRef } from 'react'

// Screen Reader Only Text Component
interface ScreenReaderOnlyProps {
  children: React.ReactNode
}

export const ScreenReaderOnly: React.FC<ScreenReaderOnlyProps> = ({ children }) => (
  <span className="sr-only">{children}</span>
)

// Skip Link Component
interface SkipLinkProps {
  href: string
  children: React.ReactNode
}

export const SkipLink: React.FC<SkipLinkProps> = ({ href, children }) => (
  <a href={href} className="skip-link">
    {children}
  </a>
)

// Live Region for Screen Reader Announcements
interface LiveRegionProps {
  message: string
  politeness?: 'polite' | 'assertive'
  clearAfter?: number // milliseconds
}

export const LiveRegion: React.FC<LiveRegionProps> = ({ 
  message, 
  politeness = 'polite',
  clearAfter = 3000 
}) => {
  const regionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (message && clearAfter > 0) {
      const timer = setTimeout(() => {
        if (regionRef.current) {
          regionRef.current.textContent = ''
        }
      }, clearAfter)

      return () => clearTimeout(timer)
    }
  }, [message, clearAfter])

  return (
    <div
      ref={regionRef}
      aria-live={politeness}
      aria-atomic="true"
      className="sr-live-region"
    >
      {message}
    </div>
  )
}

// Accessible Loading Spinner
interface AccessibleLoadingProps {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
}

export const AccessibleLoading: React.FC<AccessibleLoadingProps> = ({ 
  size = 'md', 
  label = 'Loading...',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 border-gray-300 border-t-primary-600 ${sizeClasses[size]}`}
        role="status"
        aria-label={label}
      >
        <ScreenReaderOnly>{label}</ScreenReaderOnly>
      </div>
    </div>
  )
}

// Accessible Error Message
interface AccessibleErrorProps {
  message: string
  id?: string
  className?: string
}

export const AccessibleError: React.FC<AccessibleErrorProps> = ({ 
  message, 
  id,
  className = '' 
}) => (
  <div
    id={id}
    role="alert"
    aria-live="assertive"
    className={`error-accessible ${className}`}
  >
    <span className="error-icon" aria-hidden="true">⚠️</span>
    <span className="text-accessible">{message}</span>
  </div>
)

// Accessible Success Message
interface AccessibleSuccessProps {
  message: string
  id?: string
  className?: string
}

export const AccessibleSuccess: React.FC<AccessibleSuccessProps> = ({ 
  message, 
  id,
  className = '' 
}) => (
  <div
    id={id}
    role="status"
    aria-live="polite"
    className={`success-accessible ${className}`}
  >
    <span className="success-icon" aria-hidden="true">✅</span>
    <span className="text-accessible">{message}</span>
  </div>
)

// Accessible Button with Enhanced States
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  loading?: boolean
  loadingText?: string
  children: React.ReactNode
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  variant = 'primary',
  loading = false,
  loadingText = 'Loading...',
  children,
  disabled,
  className = '',
  ...props
}) => {
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  }

  return (
    <button
      className={`
        btn-accessible keyboard-nav
        px-6 py-3 rounded-xl font-medium transition-all duration-200
        focus:outline-none focus:ring-4 focus:ring-offset-2
        disabled:opacity-60 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${className}
      `}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <AccessibleLoading size="sm" label={loadingText} className="mr-2" />
          <ScreenReaderOnly>{loadingText}</ScreenReaderOnly>
          <span aria-hidden="true">{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}

// Accessible Form Field with Enhanced Labels
interface AccessibleFieldProps {
  label: string
  id: string
  required?: boolean
  error?: string
  helpText?: string
  children: React.ReactNode
}

export const AccessibleField: React.FC<AccessibleFieldProps> = ({
  label,
  id,
  required = false,
  error,
  helpText,
  children
}) => {
  const errorId = error ? `${id}-error` : undefined
  const helpId = helpText ? `${id}-help` : undefined
  const describedBy = [errorId, helpId].filter(Boolean).join(' ')

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="label-accessible">
        {label}
        {required && (
          <span className="required-indicator" aria-label="required">
            *
          </span>
        )}
      </label>
      
      {React.cloneElement(children as React.ReactElement, {
        id,
        'aria-required': required,
        'aria-invalid': !!error,
        'aria-describedby': describedBy || undefined
      } as any)}
      
      {helpText && (
        <p id={helpId} className="text-sm text-accessible-muted">
          {helpText}
        </p>
      )}
      
      {error && (
        <AccessibleError message={error} id={errorId} />
      )}
    </div>
  )
}

// Accessible Modal with Focus Management
interface AccessibleModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = ''
}) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousFocusRef.current = document.activeElement as HTMLElement
      
      // Focus the modal
      if (modalRef.current) {
        modalRef.current.focus()
      }
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
    } else {
      // Restore focus to previously focused element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
      
      // Restore body scroll
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          className={`
            relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6
            focus:outline-none focus:ring-4 focus:ring-primary-500
            ${className}
          `}
          tabIndex={-1}
          onKeyDown={handleKeyDown}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 id="modal-title" className="text-xl font-semibold text-accessible">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Close modal"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>
          
          <div>{children}</div>
        </div>
      </div>
    </div>
  )
}

// Accessible Tooltip
interface AccessibleTooltipProps {
  content: string
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export const AccessibleTooltip: React.FC<AccessibleTooltipProps> = ({
  content,
  children,
  position = 'top'
}) => {
  const tooltipId = `tooltip-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="tooltip-accessible">
      {React.cloneElement(children as React.ReactElement, {
        'aria-describedby': tooltipId
      } as any)}
      <div
        id={tooltipId}
        role="tooltip"
        className={`tooltip-text tooltip-${position}`}
      >
        {content}
      </div>
    </div>
  )
}

export default {
  ScreenReaderOnly,
  SkipLink,
  LiveRegion,
  AccessibleLoading,
  AccessibleError,
  AccessibleSuccess,
  AccessibleButton,
  AccessibleField,
  AccessibleModal,
  AccessibleTooltip
}