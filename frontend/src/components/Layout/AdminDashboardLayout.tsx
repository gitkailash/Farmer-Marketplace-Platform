import React, { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import Layout from './Layout'
import { adminService } from '../../services/adminService'
import { Home, Users, Shield, FileText, BarChart2 } from 'lucide-react'

interface AdminDashboardLayoutProps {
  children: React.ReactNode
}

interface DashboardStats {
  totalUsers: number
  pendingReviews: number
  recentActivity: number
}

const AdminDashboardLayout: React.FC<AdminDashboardLayoutProps> = ({ children }) => {
  const location = useLocation()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingReviews: 0,
    recentActivity: 0
  })
  const [loading, setLoading] = useState(true)

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: <Home className="text-xl" />,
      description: 'System overview and analytics'
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: <Users className="text-xl" />,
      description: 'Manage users and roles'
    },
    {
      name: 'Moderation',
      href: '/admin/moderation',
      icon: <Shield className="text-xl" />,
      description: 'Review content and moderate platform'
    },
    {
      name: 'Content',
      href: '/admin/content',
      icon: <FileText className="text-xl" />,
      description: 'Manage gallery, news, and mayor messages'
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: <BarChart2 className="text-xl" />,
      description: 'View reports and system metrics'
    }
  ]

  // Load dashboard statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true)
        
        // Load analytics data for overview
        const analyticsResponse = await adminService.getAnalytics()
        if (analyticsResponse.success && analyticsResponse.data) {
          const analytics = analyticsResponse.data
          
          // Load pending reviews count
          const moderationResponse = await adminService.getModerationQueue({
            type: 'reviews',
            status: 'pending',
            limit: 1
          })
          
          const pendingReviews = moderationResponse.success && moderationResponse.pagination
            ? moderationResponse.pagination.total
            : 0

          setStats({
            totalUsers: analytics.overview.users.total,
            pendingReviews,
            recentActivity: analytics.overview.users.recent + 
                           analytics.overview.products.recent + 
                           analytics.overview.orders.recent
          })
        }
      } catch (error) {
        console.error('Failed to load admin dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [location.pathname]) // Reload stats when navigating between pages

  return (
    <Layout className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Desktop Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-24">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Admin Dashboard
                </h2>
                <p className="text-sm text-gray-600">
                  Manage platform and users
                </p>
              </div>

              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const isActive = location.pathname === item.href || 
                    (item.href === '/admin' && location.pathname === '/admin/')
                  
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={({ isActive: navIsActive }) => {
                        const active = isActive || navIsActive
                        return `group flex items-start p-3 rounded-lg transition-all duration-200 ${
                          active
                            ? 'bg-blue-50 border border-blue-200 text-blue-700'
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
                      {item.name === 'Moderation' && stats.pendingReviews > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {stats.pendingReviews}
                        </span>
                      )}
                    </NavLink>
                  )
                })}
              </nav>

              {/* Quick Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  System Overview
                </h3>
                {loading ? (
                  <div className="space-y-2">
                    <div className="animate-pulse bg-gray-200 h-4 rounded"></div>
                    <div className="animate-pulse bg-gray-200 h-4 rounded"></div>
                    <div className="animate-pulse bg-gray-200 h-4 rounded"></div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Users</span>
                      <span className="font-medium text-blue-600">{stats.totalUsers}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Pending Reviews</span>
                      <span className={`font-medium ${stats.pendingReviews > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {stats.pendingReviews}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Recent Activity</span>
                      <span className="font-medium text-green-600">{stats.recentActivity}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  {stats.pendingReviews > 0 && (
                    <NavLink
                      to="/admin/moderation"
                      className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Shield className="text-xl" /> Review Pending ({stats.pendingReviews})
                    </NavLink>
                  )}
                  <NavLink
                    to="/admin/users"
                    className="block w-full text-left px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                  >
                     <Users className="text-xl" /> Manage Users
                  </NavLink>
                  <NavLink
                    to="/admin/content"
                    className="block w-full text-left px-3 py-2 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
                  >
                    <FileText className="text-xl" /> Update Content
                  </NavLink>
                  <NavLink
                    to="/admin/analytics"
                    className="block w-full text-left px-3 py-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors"
                  >
                    <BarChart2 className="text-xl" /> View Reports
                  </NavLink>
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

export default AdminDashboardLayout