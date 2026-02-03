import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminDashboardLayout from '../../components/Layout/AdminDashboardLayout'
import { adminService, ModerationItem } from '../../services/adminService'
import { LoadingSpinner, ErrorDisplay, Button, Modal } from '../../components/UI'
import ContentFlagButton from '../../components/admin/ContentFlagButton'
import ContentRemovalTool from '../../components/admin/ContentRemovalTool'
import { getLocalizedText, getLocalizedCategory } from '../../utils/multilingual'
import { useI18n } from '../../contexts/I18nProvider'

interface ModerationStats {
  reviews: { pending: number; total: number }
  products: { pending: number; total: number }
  messages: { pending: number; total: number }
}

const AdminModeration: React.FC = () => {
  const { language } = useI18n()
  const [activeTab, setActiveTab] = useState<'reviews' | 'products' | 'messages'>('reviews')
  const [moderationData, setModerationData] = useState<ModerationItem[]>([])
  const [stats, setStats] = useState<ModerationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null)
  const [showModerationModal, setShowModerationModal] = useState(false)
  const [moderationAction, setModerationAction] = useState<'approve' | 'reject' | null>(null)
  const [moderationLoading, setModerationLoading] = useState(false)

  useEffect(() => {
    loadModerationData()
    loadStats()
  }, [activeTab])

  const loadModerationData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await adminService.getModerationQueue({
        type: activeTab,
        status: 'pending',
        limit: 50
      })
      
      if (response.success && response.data) {
        // Add the type field to each item since the backend doesn't include it
        const itemsWithType = (response.data.items || []).map(item => ({
          ...item,
          type: activeTab.slice(0, -1) as 'review' | 'product' | 'message' // Remove 's' from 'reviews', 'products', 'messages'
        }))
        setModerationData(itemsWithType)
      } else {
        setError(response.message || 'Failed to load moderation data')
      }
    } catch (err) {
      console.error('Failed to load moderation data:', err)
      setError('Failed to load moderation data')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      // Load stats for all types
      const [reviewsResponse, productsResponse, messagesResponse] = await Promise.all([
        adminService.getModerationQueue({ type: 'reviews', status: 'pending' }),
        adminService.getModerationQueue({ type: 'products', status: 'pending' }),
        adminService.getModerationQueue({ type: 'messages', status: 'pending' })
      ])

      setStats({
        reviews: {
          pending: reviewsResponse.data?.items?.length || 0,
          total: reviewsResponse.pagination?.total || 0
        },
        products: {
          pending: productsResponse.data?.items?.length || 0,
          total: productsResponse.pagination?.total || 0
        },
        messages: {
          pending: messagesResponse.data?.items?.length || 0,
          total: messagesResponse.pagination?.total || 0
        }
      })
    } catch (err) {
      console.error('Failed to load moderation stats:', err)
    }
  }

  const handleModerationAction = (item: ModerationItem, action: 'approve' | 'reject') => {
    setSelectedItem(item)
    setModerationAction(action)
    setShowModerationModal(true)
  }

  const handleFlagContent = async (contentId: string, reason: string) => {
    try {
      const contentType = activeTab === 'reviews' ? 'review' : activeTab === 'products' ? 'product' : 'message'
      await adminService.flagContent(contentType, contentId)
      await loadModerationData()
      await loadStats()
    } catch (err) {
      console.error('Failed to flag content:', err)
      setError('Failed to flag content')
    }
  }

  const handleRemoveContent = async (contentId: string, reason: string) => {
    try {
      const contentType = activeTab === 'reviews' ? 'review' : activeTab === 'products' ? 'product' : 'message'
      await adminService.removeContent(contentType, contentId)
      await loadModerationData()
      await loadStats()
    } catch (err) {
      console.error('Failed to remove content:', err)
      setError('Failed to remove content')
    }
  }

  const confirmModerationAction = async () => {
    if (!selectedItem || !moderationAction) return

    try {
      setModerationLoading(true)
      
      // Call appropriate moderation endpoint based on item type
      if (selectedItem.type === 'review') {
        await adminService.moderateReview(selectedItem._id, moderationAction)
      } else if (selectedItem.type === 'product') {
        const newStatus = moderationAction === 'approve' ? 'PUBLISHED' : 'INACTIVE'
        await adminService.moderateProduct(selectedItem._id, newStatus)
      } else if (selectedItem.type === 'message') {
        const moderationFlag = moderationAction === 'approve' ? 'APPROVED' : 'REJECTED'
        await adminService.moderateMessage(selectedItem._id, moderationFlag)
      }

      // Refresh data
      await loadModerationData()
      await loadStats()
      
      // Close modal
      setShowModerationModal(false)
      setSelectedItem(null)
      setModerationAction(null)
    } catch (err) {
      console.error('Moderation action failed:', err)
      setError('Failed to perform moderation action')
    } finally {
      setModerationLoading(false)
    }
  }

  const renderModerationItem = (item: ModerationItem) => {
    switch (item.type) {
      case 'review':
        return (
          <div key={item._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    {item.reviewer?.profile?.name || 'Unknown Reviewer'}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="text-sm font-medium text-gray-900">
                    {item.reviewee?.profile?.name || 'Unknown Reviewee'}
                  </span>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-sm ${
                          i < (item.rating || 0) ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 mb-3">{item.comment}</p>
                <div className="text-xs text-gray-500">
                  Submitted: {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex space-x-2 ml-4">
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleModerationAction(item, 'approve')}
                >
                  Approve
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleModerationAction(item, 'reject')}
                >
                  Reject
                </Button>
                <ContentFlagButton
                  contentType="review"
                  contentId={item._id}
                  onFlag={handleFlagContent}
                />
                <ContentRemovalTool
                  contentType="review"
                  contentId={item._id}
                  contentTitle={`Review by ${item.reviewer?.profile?.name}`}
                  onRemove={handleRemoveContent}
                />
              </div>
            </div>
          </div>
        )

      case 'product':
        return (
          <div key={item._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    {getLocalizedText(item.name, language) || 'Product Name Not Available'}
                  </h3>
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                    {getLocalizedCategory(item.category, language) || 'Uncategorized'}
                  </span>
                </div>
                <p className="text-gray-700 mb-2">
                  {getLocalizedText(item.description, language) || 'Description not available'}
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                  <span>Price: ${item.price}</span>
                  <span>Farmer: {item.farmer?.location?.district}, {item.farmer?.location?.municipality}</span>
                </div>
                <div className="text-xs text-gray-500">
                  Created: {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex space-x-2 ml-4">
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleModerationAction(item, 'approve')}
                >
                  Publish
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleModerationAction(item, 'reject')}
                >
                  Reject
                </Button>
                <ContentFlagButton
                  contentType="product"
                  contentId={item._id}
                  onFlag={handleFlagContent}
                />
                <ContentRemovalTool
                  contentType="product"
                  contentId={item._id}
                  contentTitle={getLocalizedText(item.name, language) || 'Product Name Not Available'}
                  onRemove={handleRemoveContent}
                />
              </div>
            </div>
          </div>
        )

      case 'message':
        return (
          <div key={item._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    {item.sender?.profile?.name || 'Unknown Sender'}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="text-sm font-medium text-gray-900">
                    {item.receiver?.profile?.name || 'Unknown Receiver'}
                  </span>
                </div>
                <p className="text-gray-700 mb-3">{item.content}</p>
                <div className="text-xs text-gray-500">
                  Sent: {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex space-x-2 ml-4">
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleModerationAction(item, 'approve')}
                >
                  Approve
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleModerationAction(item, 'reject')}
                >
                  Reject
                </Button>
                <ContentFlagButton
                  contentType="message"
                  contentId={item._id}
                  onFlag={handleFlagContent}
                />
                <ContentRemovalTool
                  contentType="message"
                  contentId={item._id}
                  contentTitle={`Message from ${item.sender?.profile?.name}`}
                  onRemove={handleRemoveContent}
                />
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (loading && !moderationData.length) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </AdminDashboardLayout>
    )
  }

  if (error && !moderationData.length) {
    return (
      <AdminDashboardLayout>
        <ErrorDisplay 
          message={error}
          onRetry={() => loadModerationData()}
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
                Content Moderation
              </h1>
              <p className="text-gray-600 mt-1">
                Review and moderate platform content
              </p>
            </div>
            <Link
              to="/admin"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600 text-lg">⭐</span>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">Reviews</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.reviews.pending}</p>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {stats.reviews.pending} pending review{stats.reviews.pending !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-lg">🌾</span>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">Products</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.products.pending}</p>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {stats.products.pending} pending product{stats.products.pending !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-lg">💬</span>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">Messages</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.messages.pending}</p>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {stats.messages.pending} pending message{stats.messages.pending !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { key: 'reviews', label: 'Reviews', count: stats?.reviews.pending || 0 },
                { key: 'products', label: 'Products', count: stats?.products.pending || 0 },
                { key: 'messages', label: 'Messages', count: stats?.messages.pending || 0 }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : moderationData.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">✅</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No pending {activeTab}
                </h3>
                <p className="text-gray-500">
                  All {activeTab} have been reviewed and moderated.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {moderationData.map(renderModerationItem)}
              </div>
            )}
          </div>
        </div>

        {/* Moderation Confirmation Modal */}
        <Modal
          isOpen={showModerationModal}
          onClose={() => setShowModerationModal(false)}
          title={`${moderationAction === 'approve' ? 'Approve' : 'Reject'} ${selectedItem?.type || 'Item'}`}
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to {moderationAction} this {selectedItem?.type}?
              {moderationAction === 'reject' && (
                <span className="block mt-2 text-sm text-red-600">
                  This action will hide the content from public view.
                </span>
              )}
            </p>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => setShowModerationModal(false)}
                disabled={moderationLoading}
              >
                Cancel
              </Button>
              <Button
                variant={moderationAction === 'approve' ? 'success' : 'danger'}
                onClick={confirmModerationAction}
                loading={moderationLoading}
              >
                {moderationAction === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminDashboardLayout>
  )
}

export default AdminModeration