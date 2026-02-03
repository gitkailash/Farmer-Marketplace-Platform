import React, { useState, useEffect, useCallback } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import Layout from './Layout'
import FarmerTabNavigation from './FarmerTabNavigation'
import { productService } from '../../services/productService'
import { orderService } from '../../services/orderService'
import { messageService } from '../../services/messageService'
import { useAppTranslation } from '../../contexts/I18nProvider'
import { BarChart2, Package, Clipboard, MessageCircle, Star } from 'lucide-react';

interface FarmerDashboardLayoutProps {
  children: React.ReactNode
}

interface DashboardStats {
  activeProducts: number
  pendingOrders: number
  unreadMessages: number
}

const FarmerDashboardLayout: React.FC<FarmerDashboardLayoutProps> = ({ children }) => {
  const location = useLocation()
  const { t, isReady, isLoading } = useAppTranslation('farmer')
  const [stats, setStats] = useState<DashboardStats>({
    activeProducts: 0,
    pendingOrders: 0,
    unreadMessages: 0
  })

  // Helper function to ensure translation returns a string
  const getTranslation = useCallback((key: string, fallback: string): string => {
    if (!isReady || isLoading) {
      return fallback; // Return fallback immediately if not ready
    }
    
    const result = t(key, fallback)
    return typeof result === 'string' ? result : fallback
  }, [t, isReady, isLoading])

  const navigationItems = [
    {
      name: getTranslation('navigation.overview', 'Overview'),
      href: '/farmer',
      icon: <BarChart2 className="text-xl" />,
      description: getTranslation('navigation.overviewDesc', 'Dashboard overview and statistics')
    },
    {
      name: getTranslation('navigation.products', 'Products'),
      href: '/farmer/products',
      icon: <Package className="text-xl" />,
      description: getTranslation('navigation.productsDesc', 'Manage your product listings')
    },
    {
      name: getTranslation('navigation.orders', 'Orders'),
      href: '/farmer/orders',
      icon: <Clipboard className="text-xl" />,
      description: getTranslation('navigation.ordersDesc', 'View and manage incoming orders')
    },
    {
      name: getTranslation('navigation.messages', 'Messages'),
      href: '/farmer/messages',
      icon: <MessageCircle className="text-xl" />,
      description: getTranslation('navigation.messagesDesc', 'Communicate with buyers')
    },
    {
      name: getTranslation('navigation.reviews', 'Reviews'),
      href: '/farmer/reviews',
      icon: <Star className="text-xl" />,
      description: getTranslation('navigation.reviewsDesc', 'View customer reviews and ratings')
    }
  ]

  // Load dashboard statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        // Load products count
        const productsResponse = await productService.getFarmerProducts()
        const activeProducts = productsResponse.success && productsResponse.data 
          ? productsResponse.data.filter(p => p.status === 'PUBLISHED').length 
          : 0

        // Load pending orders count
        const ordersResponse = await orderService.getMyOrders()
        const pendingOrders = ordersResponse.success && ordersResponse.data
          ? ordersResponse.data.filter(o => o.status === 'PENDING').length
          : 0

        // Load unread messages count
        const messagesResponse = await messageService.getMessageThreads()
        const unreadMessages = messagesResponse.success && messagesResponse.data
          ? messagesResponse.data.filter((t: any) => t.unreadCount > 0).length
          : 0

        setStats({
          activeProducts,
          pendingOrders,
          unreadMessages
        })
      } catch (error) {
        console.error('Failed to load dashboard stats:', error)
      }
    }

    loadStats()
  }, [location.pathname]) // Reload stats when navigating between pages

  return (
    <Layout className="bg-gray-50">
      {/* Mobile Tab Navigation */}
      <FarmerTabNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Desktop Sidebar Navigation */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-24">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  {getTranslation('dashboard.title', 'Farmer Dashboard')}
                </h2>
                <p className="text-sm text-gray-600">
                  {getTranslation('dashboard.subtitle', 'Manage your farming business')}
                </p>
              </div>

              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const isActive = location.pathname === item.href || 
                    (item.href === '/farmer' && location.pathname === '/farmer/')
                  
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={({ isActive: navIsActive }) => {
                        const active = isActive || navIsActive
                        return `group flex items-start p-3 rounded-lg transition-all duration-200 ${
                          active
                            ? 'bg-primary-50 border border-primary-200 text-primary-700'
                            : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                        }`
                      }}
                    >
                      <div className="flex-shrink-0">
                        <span className="text-xl">{item.icon}</span>
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                      {/* Show notification badges */}
                      {item.name === 'Orders' && stats.pendingOrders > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {stats.pendingOrders}
                        </span>
                      )}
                      {item.name === 'Messages' && stats.unreadMessages > 0 && (
                        <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {stats.unreadMessages}
                        </span>
                      )}
                    </NavLink>
                  )
                })}
              </nav>

              {/* Quick Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  {getTranslation('quickStats.title', 'Quick Stats')}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{getTranslation('stats.activeProducts', 'Active Products')}</span>
                    <span className="font-medium text-green-600">{stats.activeProducts}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{getTranslation('stats.pendingOrders', 'Pending Orders')}</span>
                    <span className={`font-medium ${stats.pendingOrders > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {stats.pendingOrders}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{getTranslation('stats.unreadMessages', 'Unread Messages')}</span>
                    <span className={`font-medium ${stats.unreadMessages > 0 ? 'text-blue-600' : 'text-gray-900'}`}>
                      {stats.unreadMessages}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  {getTranslation('quickActions.title', 'Quick Actions')}
                </h3>
                <div className="space-y-2">
                  <NavLink
                    to="/farmer/products"
                    className="block w-full text-left px-3 py-2 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md transition-colors"
                  >
                    {getTranslation('quickActions.addProduct', '+ Add Product')}
                  </NavLink>
                  {stats.pendingOrders > 0 && (
                    <NavLink
                      to="/farmer/orders"
                      className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                    >
                      📋 {getTranslation('quickActions.reviewOrders', 'Review Orders')} ({stats.pendingOrders})
                    </NavLink>
                  )}
                  {stats.unreadMessages > 0 && (
                    <NavLink
                      to="/farmer/messages"
                      className="block w-full text-left px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      💬 {getTranslation('quickActions.checkMessages', 'Check Messages')} ({stats.unreadMessages})
                    </NavLink>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="min-h-[600px]">
              {children}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default FarmerDashboardLayout