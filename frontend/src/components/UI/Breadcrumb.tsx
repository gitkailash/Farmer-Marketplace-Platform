import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
  current?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
  showHome?: boolean
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ 
  items, 
  className = '', 
  showHome = true 
}) => {
  const location = useLocation()

  // Add home breadcrumb if requested
  const breadcrumbItems = showHome 
    ? [{ label: 'Home', href: '/', icon: <Home className="w-4 h-4" />, current: false }, ...items]
    : items

  return (
    <nav 
      className={`flex ${className}`} 
      aria-label="Breadcrumb"
      role="navigation"
    >
      <ol className="flex items-center space-x-2 text-sm">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1
          const isCurrent = item.current || isLast || item.href === location.pathname

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight 
                  className="w-4 h-4 text-gray-400 mx-2" 
                  aria-hidden="true"
                />
              )}
              
              {item.href && !isCurrent ? (
                <Link
                  to={item.href}
                  className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {item.icon && <span>{item.icon}</span>}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span 
                  className={`flex items-center space-x-1 ${
                    isCurrent 
                      ? 'text-gray-900 font-medium' 
                      : 'text-gray-500'
                  }`}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {item.icon && <span>{item.icon}</span>}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default Breadcrumb

// Specialized breadcrumb components for common patterns
export const OrderBreadcrumb: React.FC<{ 
  orderId: string
  orderNumber?: string
  showReview?: boolean
}> = ({ orderId, orderNumber, showReview = false }) => {
  const items: BreadcrumbItem[] = [
    { label: 'Orders', href: '/orders' },
    { 
      label: orderNumber ? `Order #${orderNumber}` : `Order #${orderId.slice(-8)}`, 
      href: `/orders/${orderId}` 
    }
  ]

  if (showReview) {
    items.push({ label: 'Review', current: true })
  }

  return <Breadcrumb items={items} />
}

export const FarmerBreadcrumb: React.FC<{ 
  section: string
  subsection?: string
}> = ({ section, subsection }) => {
  const items: BreadcrumbItem[] = [
    { label: 'Farmer Dashboard', href: '/farmer' },
    { label: section, href: `/farmer/${section.toLowerCase()}` }
  ]

  if (subsection) {
    items.push({ label: subsection, current: true })
  }

  return <Breadcrumb items={items} />
}

export const AdminBreadcrumb: React.FC<{ 
  section: string
  subsection?: string
  itemId?: string
}> = ({ section, subsection, itemId }) => {
  const items: BreadcrumbItem[] = [
    { label: 'Admin Dashboard', href: '/admin' },
    { label: section, href: `/admin/${section.toLowerCase()}` }
  ]

  if (itemId) {
    items.push({ 
      label: `${section.slice(0, -1)} #${itemId.slice(-8)}`, 
      href: `/admin/${section.toLowerCase()}/${itemId}` 
    })
  }

  if (subsection) {
    items.push({ label: subsection, current: true })
  }

  return <Breadcrumb items={items} />
}