import React from 'react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  action?: React.ReactNode
  className?: string
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📭',
  title,
  description,
  actionLabel,
  onAction,
  action,
  className = ''
}) => {
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="max-w-md mx-auto">
        <div className="text-6xl mb-4 flex items-center justify-center">
          {icon}
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {title}
        </h3>
        
        {description && (
          <p className="text-gray-600 mb-6">
            {description}
          </p>
        )}
        
        {(actionLabel && onAction) || action ? (
          <div className="mt-6">
            {action || (
              <button
                onClick={onAction}
                className="btn-primary"
              >
                {actionLabel}
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default EmptyState

// Specialized empty state components
export const NoProducts: React.FC<{ onAddProduct?: () => void }> = ({ onAddProduct }) => (
  <EmptyState
    icon="🌾"
    title="No products found"
    description="There are no products available at the moment. Check back later or try adjusting your search."
    actionLabel={onAddProduct ? "Add Product" : undefined}
    onAction={onAddProduct}
  />
)

export const NoOrders: React.FC<{ userType?: 'buyer' | 'farmer' }> = ({ userType = 'buyer' }) => (
  <EmptyState
    icon="📦"
    title="No orders yet"
    description={
      userType === 'buyer' 
        ? "You haven't placed any orders yet. Start browsing products to make your first purchase!"
        : "You haven't received any orders yet. Make sure your products are published and visible to buyers."
    }
  />
)

export const NoMessages: React.FC = () => (
  <EmptyState
    icon="💬"
    title="No messages"
    description="You don't have any messages yet. Messages will appear here when buyers and farmers communicate."
  />
)

export const NoReviews: React.FC = () => (
  <EmptyState
    icon="⭐"
    title="No reviews yet"
    description="No reviews have been submitted yet. Reviews will appear here after completed orders."
  />
)

export const EmptyCart: React.FC<{ onBrowseProducts?: () => void }> = ({ onBrowseProducts }) => (
  <EmptyState
    icon="🛍️"
    title="Your cart is empty"
    description="Add some products to your cart to get started with your order."
    actionLabel="Browse Products"
    onAction={onBrowseProducts}
  />
)