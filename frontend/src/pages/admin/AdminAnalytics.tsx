import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminDashboardLayout from '../../components/Layout/AdminDashboardLayout'
import { adminService, AnalyticsData, AuditLog } from '../../services/adminService'
import { LoadingSpinner, ErrorDisplay, Button, Modal } from '../../components/UI'

interface DateRange {
  startDate: string
  endDate: string
}

interface ExportData {
  type: 'analytics' | 'audit-logs'
  format: 'json' | 'csv'
  dateRange?: DateRange
}

const AdminAnalytics: React.FC = () => {
  // Set default date range (last 30 days) immediately
  const getDefaultDateRange = (): DateRange => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }
  }

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [auditLoading, setAuditLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [auditError, setAuditError] = useState<string | null>(null)
  
  // Filters - initialize with default date range
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange())
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day')
  const [auditPage, setAuditPage] = useState(1)
  const [auditTotal, setAuditTotal] = useState(0)
  
  // Export modal
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  // Load analytics data
  const loadAnalytics = async () => {
    console.log('loadAnalytics called')
    try {
      setLoading(true)
      setError(null)
      
      const params: any = { groupBy }
      if (dateRange.startDate) params.startDate = dateRange.startDate
      if (dateRange.endDate) params.endDate = dateRange.endDate
      
      console.log('Calling adminService.getAnalytics with params:', params)
      const response = await adminService.getAnalytics(params)
      console.log('Got response:', response)
      
      if (response.success && response.data) {
        console.log('Setting analytics data:', response.data)
        setAnalytics(response.data)
      } else {
        console.log('Response not successful:', response)
        setError(response.message || 'Failed to load analytics data')
      }
    } catch (err) {
      console.error('Failed to load analytics:', err)
      setError('Failed to load analytics data')
    } finally {
      console.log('Setting loading to false')
      setLoading(false)
    }
  }

  // Load audit logs
  const loadAuditLogs = async (page = 1) => {
    try {
      setAuditLoading(true)
      setAuditError(null)
      
      const params: any = { page, limit: 20 }
      if (dateRange.startDate) params.startDate = dateRange.startDate
      if (dateRange.endDate) params.endDate = dateRange.endDate
      
      const response = await adminService.getAuditLogs(params)
      if (response.success && response.data) {
        setAuditLogs(response.data)
        setAuditTotal(response.pagination?.total || 0)
      } else {
        setAuditError(response.message || 'Failed to load audit logs')
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err)
      setAuditError('Failed to load audit logs')
    } finally {
      setAuditLoading(false)
    }
  }

  // Handle date range change
  const handleDateRangeChange = (field: keyof DateRange, value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }))
  }

  // Apply filters
  const applyFilters = () => {
    loadAnalytics()
    loadAuditLogs(1)
    setAuditPage(1)
  }

  // Reset filters
  const resetFilters = () => {
    setDateRange({ startDate: '', endDate: '' })
    setGroupBy('day')
    setAuditPage(1)
  }

  // Export data
  const exportData = async (exportConfig: ExportData) => {
    try {
      setExportLoading(true)
      
      let blob: Blob
      let filename: string
      
      if (exportConfig.type === 'analytics') {
        blob = await adminService.exportAnalytics({
          format: exportConfig.format,
          startDate: exportConfig.dateRange?.startDate,
          endDate: exportConfig.dateRange?.endDate,
          groupBy
        })
        filename = `analytics-${new Date().toISOString().split('T')[0]}.${exportConfig.format}`
      } else {
        blob = await adminService.exportAuditLogs({
          format: exportConfig.format,
          startDate: exportConfig.dateRange?.startDate,
          endDate: exportConfig.dateRange?.endDate
        })
        filename = `audit-logs-${new Date().toISOString().split('T')[0]}.${exportConfig.format}`
      }
      
      // Download the blob
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setShowExportModal(false)
    } catch (err) {
      console.error('Export failed:', err)
      alert('Export failed. Please try again.')
    } finally {
      setExportLoading(false)
    }
  }

  // Load data when component mounts or filters change
  useEffect(() => {
    console.log('AdminAnalytics useEffect running')
    loadAnalytics()
    loadAuditLogs(1)
  }, []) // Load immediately on mount, don't wait for date range

  console.log('AdminAnalytics render - loading:', loading, 'analytics:', !!analytics, 'error:', error)

  if (loading && !analytics) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600">Loading analytics data...</span>
        </div>
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
                Analytics & Reports
              </h1>
              <p className="text-gray-600 mt-1">
                Detailed analytics, reporting, and audit logs
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowExportModal(true)}
                className="flex items-center space-x-2"
              >
                <span>📊</span>
                <span>Export Data</span>
              </Button>
              <Link to="/admin">
                <Button variant="outline">
                  ← Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group By
              </label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as 'day' | 'week' | 'month')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
              </select>
            </div>
            <div className="flex items-end space-x-2">
              <Button onClick={applyFilters} className="flex-1">
                Apply Filters
              </Button>
              <Button variant="outline" onClick={resetFilters}>
                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Analytics Overview */}
        {error ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <ErrorDisplay message={error} onRetry={loadAnalytics} />
            <div className="mt-4 text-sm text-gray-500">
              Debug info: Check browser console for more details
            </div>
          </div>
        ) : analytics ? (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {analytics.overview.users.total}
                  </div>
                  <div className="text-sm text-gray-600">Total Users</div>
                  <div className="text-xs text-green-600 mt-1">
                    +{analytics.overview.users.recent} recent
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {analytics.overview.products.total}
                  </div>
                  <div className="text-sm text-gray-600">Total Products</div>
                  <div className="text-xs text-green-600 mt-1">
                    +{analytics.overview.products.recent} recent
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {analytics.overview.orders.total}
                  </div>
                  <div className="text-sm text-gray-600">Total Orders</div>
                  <div className="text-xs text-green-600 mt-1">
                    +{analytics.overview.orders.recent} recent
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    NPR {analytics.overview.revenue.total.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Revenue</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Avg: NPR {analytics.overview.revenue.average.toFixed(0)}
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Breakdown */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Farmers</span>
                    <span className="font-semibold">{analytics.overview.users.farmers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Buyers</span>
                    <span className="font-semibold">{analytics.overview.users.buyers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Admins</span>
                    <span className="font-semibold">
                      {analytics.overview.users.total - analytics.overview.users.farmers - analytics.overview.users.buyers}
                    </span>
                  </div>
                </div>
              </div>

              {/* Product Status */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Published</span>
                    <span className="font-semibold text-green-600">{analytics.overview.products.published}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Draft/Inactive</span>
                    <span className="font-semibold text-yellow-600">
                      {analytics.overview.products.total - analytics.overview.products.published}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Publish Rate</span>
                    <span className="font-semibold">
                      {analytics.overview.products.total > 0 
                        ? ((analytics.overview.products.published / analytics.overview.products.total) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Status */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Completed</span>
                    <span className="font-semibold text-green-600">{analytics.overview.orders.completed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pending/In Progress</span>
                    <span className="font-semibold text-yellow-600">
                      {analytics.overview.orders.total - analytics.overview.orders.completed}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Completion Rate</span>
                    <span className="font-semibold">
                      {analytics.overview.orders.total > 0 
                        ? ((analytics.overview.orders.completed / analytics.overview.orders.total) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Review Status */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Approved</span>
                    <span className="font-semibold text-green-600">{analytics.overview.reviews.approved}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pending</span>
                    <span className="font-semibold text-yellow-600">
                      {analytics.overview.reviews.total - analytics.overview.reviews.approved}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Approval Rate</span>
                    <span className="font-semibold">
                      {analytics.overview.reviews.total > 0 
                        ? ((analytics.overview.reviews.approved / analytics.overview.reviews.total) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Time Series Data */}
            {analytics.timeSeriesData && analytics.timeSeriesData.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Trends ({groupBy === 'day' ? 'Daily' : groupBy === 'week' ? 'Weekly' : 'Monthly'})
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Period
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Orders
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Revenue
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {analytics.timeSeriesData.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item._id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.orders}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            NPR {item.revenue.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">
                No analytics data available
              </div>
              <Button onClick={loadAnalytics} variant="outline">
                Retry Loading
              </Button>
            </div>
          </div>
        )}

        {/* Audit Logs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Audit Logs</h2>
            <div className="text-sm text-gray-500">
              Total: {auditTotal} entries
            </div>
          </div>
          
          {auditLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : auditError ? (
            <ErrorDisplay message={auditError} onRetry={() => loadAuditLogs(auditPage)} />
          ) : auditLogs.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Performed By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Target
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            log.action.includes('APPROVE') 
                              ? 'bg-green-100 text-green-800'
                              : log.action.includes('REJECT')
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {log.action.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.performedBy.profile.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.targetType}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {log.details.reviewer && `Reviewer: ${log.details.reviewer}`}
                          {log.details.reviewee && ` | Reviewee: ${log.details.reviewee}`}
                          {log.details.rating && ` | Rating: ${log.details.rating}⭐`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {auditTotal > 20 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((auditPage - 1) * 20) + 1} to {Math.min(auditPage * 20, auditTotal)} of {auditTotal} entries
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const newPage = auditPage - 1
                        setAuditPage(newPage)
                        loadAuditLogs(newPage)
                      }}
                      disabled={auditPage <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const newPage = auditPage + 1
                        setAuditPage(newPage)
                        loadAuditLogs(newPage)
                      }}
                      disabled={auditPage * 20 >= auditTotal}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No audit logs found for the selected date range.
            </div>
          )}
        </div>

        {/* Export Modal */}
        {showExportModal && (
          <Modal
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
            title="Export Data"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Type
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="exportType"
                      value="analytics"
                      defaultChecked
                      className="mr-2"
                    />
                    Analytics Overview
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="exportType"
                      value="audit-logs"
                      className="mr-2"
                    />
                    Audit Logs
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="exportFormat"
                      value="json"
                      defaultChecked
                      className="mr-2"
                    />
                    JSON
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="exportFormat"
                      value="csv"
                      className="mr-2"
                    />
                    CSV
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowExportModal(false)}
                  disabled={exportLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const exportType = (document.querySelector('input[name="exportType"]:checked') as HTMLInputElement)?.value as 'analytics' | 'audit-logs'
                    const exportFormat = (document.querySelector('input[name="exportFormat"]:checked') as HTMLInputElement)?.value as 'json' | 'csv'
                    
                    exportData({
                      type: exportType || 'analytics',
                      format: exportFormat || 'json',
                      dateRange: dateRange.startDate && dateRange.endDate ? dateRange : undefined
                    })
                  }}
                  disabled={exportLoading}
                >
                  {exportLoading ? 'Exporting...' : 'Export'}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AdminDashboardLayout>
  )
}

export default AdminAnalytics