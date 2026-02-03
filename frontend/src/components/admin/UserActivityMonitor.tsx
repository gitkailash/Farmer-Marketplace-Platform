import React, { useState, useEffect } from 'react'
import { adminService, AuditLog } from '../../services/adminService'
import { LoadingSpinner, ErrorDisplay } from '../UI'

interface UserActivityMonitorProps {
  userId: string
  className?: string
}

const UserActivityMonitor: React.FC<UserActivityMonitorProps> = ({ userId, className = '' }) => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load user activity logs
  const loadActivityLogs = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await adminService.getAuditLogs({
        userId,
        limit: 10 // Show last 10 activities
      })
      
      if (response.success && response.data) {
        setLogs(response.data)
      } else {
        setError(response.message || 'Failed to load activity logs')
      }
    } catch (err) {
      console.error('Failed to load activity logs:', err)
      setError('Failed to load activity logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadActivityLogs()
  }, [userId])

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return `${diffInMinutes} minutes ago`
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays} days ago`
    }
  }

  // Get action icon and color
  const getActionDisplay = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return { icon: '🔐', color: 'text-green-600', label: 'Logged in' }
      case 'LOGOUT':
        return { icon: '🚪', color: 'text-gray-600', label: 'Logged out' }
      case 'CREATE_PRODUCT':
        return { icon: '🌾', color: 'text-blue-600', label: 'Created product' }
      case 'UPDATE_PRODUCT':
        return { icon: '✏️', color: 'text-yellow-600', label: 'Updated product' }
      case 'DELETE_PRODUCT':
        return { icon: '🗑️', color: 'text-red-600', label: 'Deleted product' }
      case 'PLACE_ORDER':
        return { icon: '🛒', color: 'text-purple-600', label: 'Placed order' }
      case 'ACCEPT_ORDER':
        return { icon: '✅', color: 'text-green-600', label: 'Accepted order' }
      case 'COMPLETE_ORDER':
        return { icon: '📦', color: 'text-blue-600', label: 'Completed order' }
      case 'SUBMIT_REVIEW':
        return { icon: '⭐', color: 'text-yellow-600', label: 'Submitted review' }
      case 'SEND_MESSAGE':
        return { icon: '💬', color: 'text-blue-600', label: 'Sent message' }
      case 'APPROVE_REVIEW':
        return { icon: '✅', color: 'text-green-600', label: 'Approved review' }
      case 'REJECT_REVIEW':
        return { icon: '❌', color: 'text-red-600', label: 'Rejected review' }
      case 'UPDATE_PROFILE':
        return { icon: '👤', color: 'text-blue-600', label: 'Updated profile' }
      default:
        return { icon: '📝', color: 'text-gray-600', label: action.toLowerCase().replace('_', ' ') }
    }
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <ErrorDisplay 
          message={error}
          onRetry={loadActivityLogs}
        />
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <button
          onClick={loadActivityLogs}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Refresh
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">📊</div>
          <p className="text-gray-600">No recent activity found</p>
          <p className="text-sm text-gray-500 mt-1">
            User activity will appear here as they use the platform
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => {
            const actionDisplay = getActionDisplay(log.action)
            
            return (
              <div key={log.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                <div className="flex-shrink-0">
                  <span className="text-lg">{actionDisplay.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${actionDisplay.color}`}>
                      {actionDisplay.label}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(log.timestamp)}
                    </p>
                  </div>
                  {log.details && (
                    <p className="text-xs text-gray-600 mt-1">
                      {typeof log.details === 'string' 
                        ? log.details 
                        : JSON.stringify(log.details)
                      }
                    </p>
                  )}
                  {log.performedBy && (
                    <p className="text-xs text-gray-500 mt-1">
                      by {log.performedBy.profile.name}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
          
          {logs.length >= 10 && (
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing last 10 activities
              </p>
              <button
                onClick={() => {
                  // Navigate to full activity log page
                  window.open(`/admin/audit-logs?userId=${userId}`, '_blank')
                }}
                className="text-sm text-blue-600 hover:text-blue-700 mt-1"
              >
                View all activity →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default UserActivityMonitor