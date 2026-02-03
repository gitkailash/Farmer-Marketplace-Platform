import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminDashboardLayout from '../../components/Layout/AdminDashboardLayout'
import { SystemAnnouncementPanel } from '../../components/admin/SystemAnnouncementPanel'
import { adminService, AnalyticsData } from '../../services/adminService'
import { LoadingSpinner, ErrorDisplay } from '../../components/UI'
import { Users, BarChart2, Shield, Box, FileText, Star, Languages } from 'lucide-react'

const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await adminService.getAnalytics()
        if (response.success && response.data) {
          setAnalytics(response.data)
        } else {
          setError(response.message || 'Failed to load analytics data')
        }
      } catch (err) {
        console.error('Failed to load analytics:', err)
        setError('Failed to load analytics data')
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [])

  if (loading) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </AdminDashboardLayout>
    )
  }

  if (error) {
    return (
      <AdminDashboardLayout>
        <ErrorDisplay 
          message={error}
          onRetry={() => window.location.reload()}
        />
      </AdminDashboardLayout>
    )
  }

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                System overview and management tools
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {analytics ? new Date(analytics.generatedAt).toLocaleString() : 'Unknown'}
            </div>
          </div>
        </div>

        {/* System Announcements */}
        <SystemAnnouncementPanel />

        {/* System Overview Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Users Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                     <Users className="text-blue-600 text-lg" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.overview.users.total}</p>
                </div>
              </div>
              <div className="mt-4 flex justify-between text-sm">
                <span className="text-gray-500">Farmers: {analytics.overview.users.farmers}</span>
                <span className="text-gray-500">Buyers: {analytics.overview.users.buyers}</span>
              </div>
              {analytics.overview.users.recent > 0 && (
                <div className="mt-2 text-sm text-green-600">
                  +{analytics.overview.users.recent} new this week
                </div>
              )}
            </div>

            {/* Products Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Box className="text-green-600 text-lg" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">Products</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.overview.products.total}</p>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Published: {analytics.overview.products.published}
              </div>
              {analytics.overview.products.recent > 0 && (
                <div className="mt-2 text-sm text-green-600">
                  +{analytics.overview.products.recent} new this week
                </div>
              )}
            </div>

            {/* Orders Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BarChart2 className="text-purple-600 text-lg" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.overview.orders.total}</p>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Completed: {analytics.overview.orders.completed}
              </div>
              {analytics.overview.orders.recent > 0 && (
                <div className="mt-2 text-sm text-green-600">
                  +{analytics.overview.orders.recent} new this week
                </div>
              )}
            </div>

            {/* Reviews Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Star className="text-yellow-600 text-lg" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">Reviews</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.overview.reviews.total}</p>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Approved: {analytics.overview.reviews.approved}
              </div>
              {analytics.overview.reviews.recent > 0 && (
                <div className="mt-2 text-sm text-green-600">
                  +{analytics.overview.reviews.recent} new this week
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Management */}
          <Link
            to="/admin/users"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Users className="text-blue-600 text-xl" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  User Management
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Manage users, roles, and permissions
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-blue-600">
              <span>Manage Users</span>
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Content Moderation */}
          <Link
            to="/admin/moderation"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                  <Shield className="text-red-600 text-xl" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-red-600 transition-colors">
                  Content Moderation
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Review and moderate platform content
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-red-600">
              <span>Review Content</span>
              {analytics && (analytics.overview.reviews.total - analytics.overview.reviews.approved) > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {analytics.overview.reviews.total - analytics.overview.reviews.approved}
                </span>
              )}
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Content Management */}
          <Link
            to="/admin/content"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <FileText className="text-green-600 text-xl" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-green-600 transition-colors">
                  Content Management
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Manage gallery, news, and messages
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <span>Manage Content</span>
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Translation Management */}
          <Link
            to="/admin/translations"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <Languages className="text-indigo-600 text-xl" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                  Translation Management
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Manage translations and monitor completeness
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-indigo-600">
              <span>Manage Translations</span>
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Analytics */}
          <Link
            to="/admin/analytics"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <BarChart2 className="text-purple-600 text-xl" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-purple-600 transition-colors">
                  Analytics & Reports
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  View detailed analytics and reports
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-purple-600">
              <span>View Reports</span>
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>

        {/* Top Farmers Section */}
        {analytics && analytics.topFarmers && analytics.topFarmers.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Top Rated Farmers
              </h2>
              <Link
                to="/admin/users?role=FARMER&sortBy=rating&sortOrder=desc"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View All Farmers →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.topFarmers.slice(0, 6).map((farmer) => (
                <div
                  key={farmer._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">
                      {farmer.userId.profile.name}
                    </h3>
                    {farmer.isVerified && (
                      <span className="text-green-500 text-sm">✓ Verified</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {farmer.location.district}, {farmer.location.municipality}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Star className="text-yellow-500" />
                      <span className="ml-1 text-sm font-medium">
                        {farmer.rating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {farmer.reviewCount} reviews
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {analytics?.overview.users.recent || 0}
              </div>
              <div className="text-sm text-gray-600">New Users This Week</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {analytics?.overview.products.recent || 0}
              </div>
              <div className="text-sm text-gray-600">New Products This Week</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {analytics?.overview.orders.recent || 0}
              </div>
              <div className="text-sm text-gray-600">New Orders This Week</div>
            </div>
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  )
}

export default AdminDashboard