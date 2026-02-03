import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, X } from 'lucide-react'
import Button from './Button'

interface BackNavigationProps {
  to?: string
  label?: string
  variant?: 'button' | 'link' | 'icon'
  className?: string
  fallbackPath?: string
  onBack?: () => void
  showCancel?: boolean
  cancelLabel?: string
  onCancel?: () => void
}

const BackNavigation: React.FC<BackNavigationProps> = ({
  to,
  label = 'Back',
  variant = 'button',
  className = '',
  fallbackPath = '/',
  onBack,
  showCancel = false,
  cancelLabel = 'Cancel',
  onCancel
}) => {
  const navigate = useNavigate()
  const location = useLocation()

  const handleBack = () => {
    if (onBack) {
      onBack()
      return
    }

    if (to) {
      navigate(to)
      return
    }

    // Try to go back in history, but fallback to a safe path
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate(fallbackPath)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
      return
    }
    
    handleBack()
  }

  if (variant === 'icon') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <button
          onClick={handleBack}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          aria-label={label}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        {showCancel && (
          <button
            onClick={handleCancel}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            aria-label={cancelLabel}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    )
  }

  if (variant === 'link') {
    return (
      <div className={`flex items-center space-x-4 ${className}`}>
        <button
          onClick={handleBack}
          className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{label}</span>
        </button>
        {showCancel && (
          <button
            onClick={handleCancel}
            className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>{cancelLabel}</span>
          </button>
        )}
      </div>
    )
  }

  // Default button variant
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <Button
        variant="secondary"
        onClick={handleBack}
        className="flex items-center space-x-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{label}</span>
      </Button>
      {showCancel && (
        <Button
          variant="outline"
          onClick={handleCancel}
          className="flex items-center space-x-2"
        >
          <X className="w-4 h-4" />
          <span>{cancelLabel}</span>
        </Button>
      )}
    </div>
  )
}

export default BackNavigation

// Specialized back navigation components for common patterns
export const OrderBackNavigation: React.FC<{ 
  orderId: string
  showOrdersLink?: boolean
}> = ({ orderId, showOrdersLink = true }) => (
  <div className="flex items-center space-x-4">
    <BackNavigation
      to={`/orders/${orderId}`}
      label="Back to Order"
      variant="link"
    />
    {showOrdersLink && (
      <BackNavigation
        to="/orders"
        label="All Orders"
        variant="link"
      />
    )}
  </div>
)

export const FarmerBackNavigation: React.FC<{ 
  section: string
  showDashboardLink?: boolean
}> = ({ section, showDashboardLink = true }) => (
  <div className="flex items-center space-x-4">
    <BackNavigation
      to={`/farmer/${section}`}
      label={`Back to ${section.charAt(0).toUpperCase() + section.slice(1)}`}
      variant="link"
    />
    {showDashboardLink && (
      <BackNavigation
        to="/farmer"
        label="Dashboard"
        variant="link"
      />
    )}
  </div>
)

export const ReviewFormNavigation: React.FC<{ 
  orderId: string
  onCancel?: () => void
}> = ({ orderId, onCancel }) => (
  <BackNavigation
    to={`/orders/${orderId}`}
    label="Back to Order"
    variant="button"
    showCancel={true}
    cancelLabel="Cancel Review"
    onCancel={onCancel}
  />
)