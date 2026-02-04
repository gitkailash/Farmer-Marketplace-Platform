import React, { useState, useEffect } from 'react'
import { adminNewsService, NewsItemAdmin } from '../../services/contentService'
import { LoadingSpinner, ErrorDisplay, Button, Modal } from '../UI'
import { MultilingualInputField, MultilingualTextareaField } from '../UI/MultilingualInput'
import { MultilingualRichTextEditor } from '../UI/MultilingualRichTextEditor'
import { useToastContext } from '../../contexts/ToastProvider'
import { useAppTranslation } from '../../contexts/I18nProvider'

interface MultilingualText {
  en: string
  ne: string
}

interface NewsFormData {
  headline: MultilingualText
  content: MultilingualText
  summary: MultilingualText
  link: string
  priority: 'LOW' | 'NORMAL' | 'HIGH'
  language: 'en' | 'ne'
  isActive: boolean
  publishedAt: string
  useRichText: boolean
}

const NEWS_PRIORITIES = [
  { value: 'LOW', label: 'Low Priority', icon: '📄', color: 'gray' },
  { value: 'NORMAL', label: 'Normal Priority', icon: '📰', color: 'blue' },
  { value: 'HIGH', label: 'High Priority', icon: '🚨', color: 'red' }
] as const

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ne', name: 'नेपाली (Nepali)' }
]

const NewsManagement: React.FC = () => {
  const [items, setItems] = useState<NewsItemAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingItem, setEditingItem] = useState<NewsItemAdmin | null>(null)
  const [formData, setFormData] = useState<NewsFormData>({
    headline: { en: '', ne: '' },
    content: { en: '', ne: '' },
    summary: { en: '', ne: '' },
    link: '',
    priority: 'NORMAL',
    language: 'en',
    isActive: true,
    publishedAt: new Date().toISOString().slice(0, 16), // Format for datetime-local input
    useRichText: false
  })
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState<{
    priority: string
    language: string
    isActive: string
  }>({
    priority: '',
    language: 'en',
    isActive: ''
  })
  const [formErrors, setFormErrors] = useState<{
    headline?: { en?: string; ne?: string }
    content?: { en?: string; ne?: string }
    summary?: { en?: string; ne?: string }
  }>({})

  const { success: showToastSuccess, error: showToastError } = useToastContext()
  const { t } = useAppTranslation('admin')

  // Helper function to safely get translation string
  const getTranslation = (key: string, fallback: string): string => {
    const translation = t(key)
    return typeof translation === 'string' ? translation : fallback
  }

  useEffect(() => {
    loadItems()
  }, [filter])

  const loadItems = async () => {
    try {
      setLoading(true)
      setError(null)

      const params: any = {
        sortBy: 'publishedAt',
        sortOrder: 'desc' as const,
        limit: 100
      }

      if (filter.priority) params.priority = filter.priority
      if (filter.language) params.language = filter.language
      if (filter.isActive) params.isActive = filter.isActive === 'true'

      const response = await adminNewsService.getAllItems(params)
      
      if (response.success && response.data) {
        setItems(response.data)
      } else {
        setError(response.message || 'Failed to load news items')
      }
    } catch (err) {
      console.error('Failed to load news items:', err)
      setError('Failed to load news items')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Reset form errors
    setFormErrors({})
    
    // Validate required fields
    const errors: typeof formErrors = {}
    
    if (!formData.headline.en.trim()) {
      errors.headline = { en: getTranslation('news.errors.headlineRequired', 'English headline is required') }
    }
    
    // For critical content (HIGH priority), require both languages
    if (formData.priority === 'HIGH') {
      if (!formData.headline.ne.trim()) {
        errors.headline = { 
          ...errors.headline, 
          ne: getTranslation('news.errors.criticalContentNepali', 'Nepali translation required for high priority news')
        }
      }
      if (formData.content.en.trim() && !formData.content.ne.trim()) {
        errors.content = { 
          ne: getTranslation('news.errors.criticalContentNepali', 'Nepali translation required for high priority news')
        }
      }
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      showToastError(getTranslation('news.errors.validationFailed', 'Please fix the validation errors'))
      return
    }

    try {
      setSubmitting(true)

      const submitData = {
        headline: formData.headline,
        priority: formData.priority,
        language: formData.language,
        isActive: formData.isActive,
        publishedAt: formData.publishedAt,
        ...(formData.content.en.trim() || formData.content.ne.trim() ? { 
          content: formData.content
        } : {}),
        ...(formData.summary.en.trim() || formData.summary.ne.trim() ? { 
          summary: formData.summary
        } : {}),
        ...(formData.link.trim() && { link: formData.link.trim() })
      }

      if (editingItem) {
        // Update existing item
        const response = await adminNewsService.updateItem(editingItem._id, submitData)
        
        if (response.success && response.data) {
          setItems(items.map(item => 
            item._id === editingItem._id ? response.data! : item
          ))
          showToastSuccess(getTranslation('news.success.updated', 'News item updated successfully'))
        } else {
          showToastError(response.message || getTranslation('news.errors.updateFailed', 'Failed to update news item'))
        }
      } else {
        // Create new item
        const response = await adminNewsService.createItem(submitData)
        
        if (response.success && response.data) {
          setItems([response.data, ...items])
          showToastSuccess(getTranslation('news.success.created', 'News item created successfully'))
        } else {
          showToastError(response.message || getTranslation('news.errors.createFailed', 'Failed to create news item'))
        }
      }

      // Reset form and close modal
      setFormData({
        headline: { en: '', ne: '' },
        content: { en: '', ne: '' },
        summary: { en: '', ne: '' },
        link: '',
        priority: 'NORMAL',
        language: 'en',
        isActive: true,
        publishedAt: new Date().toISOString().slice(0, 16),
        useRichText: false
      })
      setFormErrors({})
      setShowCreateModal(false)
      setEditingItem(null)
    } catch (err) {
      showToastError(getTranslation('news.errors.saveFailed', 'Failed to save news item'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (item: NewsItemAdmin) => {
    setEditingItem(item)
    
    // Handle multilingual format
    const headlineData: MultilingualText = item.headline as MultilingualText || { en: '', ne: '' }
    const contentData: MultilingualText = item.content as MultilingualText || { en: '', ne: '' }
    const summaryData: MultilingualText = (item as any).summary as MultilingualText || { en: '', ne: '' }
    
    setFormData({
      headline: headlineData,
      content: contentData,
      summary: summaryData,
      link: item.link || '',
      priority: item.priority,
      language: (item.language as 'en' | 'ne') || 'en',
      isActive: item.isActive,
      publishedAt: new Date(item.publishedAt).toISOString().slice(0, 16),
      useRichText: false
    })
    setFormErrors({})
    setShowCreateModal(true)
  }

  const handleDelete = async (item: NewsItemAdmin) => {
    const headlineText = (item.headline as MultilingualText)?.en || 'this news item'
    
    if (!confirm(`Are you sure you want to delete "${headlineText}"?`)) {
      return
    }

    try {
      const response = await adminNewsService.deleteItem(item._id)
      
      if (response.success) {
        setItems(items.filter(i => i._id !== item._id))
        showToastSuccess('News item deleted successfully')
      } else {
        showToastError(response.message || 'Failed to delete news item')
      }
    } catch (err) {
      showToastError('Failed to delete news item')
    }
  }

  const handleToggleActive = async (item: NewsItemAdmin) => {
    try {
      const response = await adminNewsService.updateItem(item._id, {
        isActive: !item.isActive
      })
      
      if (response.success && response.data) {
        setItems(items.map(i => 
          i._id === item._id ? response.data! : i
        ))
        showToastSuccess(
          `News item ${!item.isActive ? 'activated' : 'deactivated'} successfully`
        )
      } else {
        showToastError(response.message || 'Failed to update news item')
      }
    } catch (err) {
      showToastError('Failed to update news item')
    }
  }

  const closeModal = () => {
    setShowCreateModal(false)
    setEditingItem(null)
    setFormData({
      headline: { en: '', ne: '' },
      content: { en: '', ne: '' },
      summary: { en: '', ne: '' },
      link: '',
      priority: 'NORMAL',
      language: 'en',
      isActive: true,
      publishedAt: new Date().toISOString().slice(0, 16),
      useRichText: false
    })
    setFormErrors({})
  }

  const getPriorityConfig = (priority: string) => {
    return NEWS_PRIORITIES.find(p => p.value === priority) || NEWS_PRIORITIES[1]
  }

  const getPriorityStyles = (priority: string) => {
    const config = getPriorityConfig(priority)
    switch (config.color) {
      case 'red':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'blue':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'gray':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const isScheduled = (publishedAt: string) => {
    return new Date(publishedAt) > new Date()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <ErrorDisplay 
        message={error}
        onRetry={loadItems}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-blue-600 text-lg">ℹ️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              News Ticker Management
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>News items are displayed in the header ticker, sorted by priority (High → Normal → Low) and then by published date.</p>
              <p className="mt-1">You can schedule news items for future publication and manage multiple languages.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Priority Filter */}
          <select
            value={filter.priority}
            onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Priorities</option>
            {NEWS_PRIORITIES.map(priority => (
              <option key={priority.value} value={priority.value}>
                {priority.icon} {priority.label}
              </option>
            ))}
          </select>

          {/* Language Filter */}
          <select
            value={filter.language}
            onChange={(e) => setFilter({ ...filter, language: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filter.isActive}
            onChange={(e) => setFilter({ ...filter, isActive: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Add News Item
        </Button>
      </div>

      {/* News Items */}
      {items.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <span className="text-4xl mb-4 block">📰</span>
            <p className="text-lg font-medium">No news items found</p>
            <p className="text-sm">Create your first news item to get started</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const priorityConfig = getPriorityConfig(item.priority)
            const scheduled = isScheduled(item.publishedAt)
            
            return (
              <div
                key={item._id}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* Priority Icon */}
                  <div className="flex-shrink-0 mt-1">
                    <span className="text-2xl">{priorityConfig.icon}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`
                        px-2 py-1 text-xs rounded-full border
                        ${getPriorityStyles(item.priority)}
                      `}>
                        {priorityConfig.label}
                      </span>
                      <span className={`
                        px-2 py-1 text-xs rounded-full
                        ${item.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                        }
                      `}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {scheduled && (
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                          Scheduled
                        </span>
                      )}
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {LANGUAGES.find(l => l.code === item.language)?.name || item.language}
                      </span>
                      {item.link && (
                        <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                          🔗 Has Link
                        </span>
                      )}
                    </div>
                    
                    <h3 className="font-medium text-gray-900 mb-2">
                      {(item.headline as MultilingualText)?.en || 'Untitled News Item'}
                      {(item.headline as MultilingualText)?.ne && (
                        <span className="ml-2 text-sm text-green-600">
                          ✓ {getTranslation('common.bilingual', 'Bilingual')}
                        </span>
                      )}
                    </h3>
                    
                    {item.content && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {(item.content as MultilingualText)?.en || ''}
                      </p>
                    )}

                    <div className="text-xs text-gray-500">
                      Published: {new Date(item.publishedAt).toLocaleString()} • 
                      Created: {new Date(item.createdAt).toLocaleString()}
                      {item.creator && (
                        <> • By: {item.creator.profile.name}</>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(item)}
                      className={`
                        px-3 py-1 text-xs rounded-md transition-colors
                        ${item.isActive
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }
                      `}
                    >
                      {item.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleEdit(item)}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={closeModal}
        title={editingItem ? 'Edit News Item' : 'Add News Item'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <MultilingualInputField
            label={`${getTranslation('news.form.headline', 'Headline')} *`}
            value={formData.headline}
            onChange={(value) => setFormData({ ...formData, headline: value })}
            error={formErrors.headline}
            placeholder={getTranslation('news.form.headlinePlaceholder', 'Enter news headline')}
            maxLength={200}
            required
          />

          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="useRichText"
              checked={formData.useRichText}
              onChange={(e) => setFormData({ ...formData, useRichText: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="useRichText" className="ml-2 block text-sm text-gray-700">
              {getTranslation('news.form.useRichText', 'Use rich text editor (for formatted content)')}
            </label>
          </div>

          {formData.useRichText ? (
            <MultilingualRichTextEditor
              label={getTranslation('news.form.content', 'Content (Optional)')}
              value={formData.content}
              onChange={(value) => setFormData({ ...formData, content: value })}
              error={formErrors.content}
              placeholder={getTranslation('news.form.contentPlaceholder', 'Enter detailed content (optional)')}
              minHeight="200px"
            />
          ) : (
            <MultilingualTextareaField
              label={getTranslation('news.form.content', 'Content (Optional)')}
              value={formData.content}
              onChange={(value) => setFormData({ ...formData, content: value })}
              error={formErrors.content}
              placeholder={getTranslation('news.form.contentPlaceholder', 'Enter detailed content (optional)')}
              rows={3}
            />
          )}

          {formData.useRichText ? (
            <MultilingualRichTextEditor
              label={getTranslation('news.form.summary', 'Summary (Optional)')}
              value={formData.summary}
              onChange={(value) => setFormData({ ...formData, summary: value })}
              error={formErrors.summary}
              placeholder={getTranslation('news.form.summaryPlaceholder', 'Enter brief summary (optional)')}
              minHeight="120px"
            />
          ) : (
            <MultilingualTextareaField
              label={getTranslation('news.form.summary', 'Summary (Optional)')}
              value={formData.summary}
              onChange={(value) => setFormData({ ...formData, summary: value })}
              error={formErrors.summary}
              placeholder={getTranslation('news.form.summaryPlaceholder', 'Enter brief summary (optional)')}
              rows={2}
            />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getTranslation('news.form.externalLink', 'External Link (Optional)')}
            </label>
            <input
              type="url"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/full-article"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {getTranslation('news.form.priority', 'Priority')}
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {NEWS_PRIORITIES.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.icon} {priority.label}
                  </option>
                ))}
              </select>
              {formData.priority === 'HIGH' && (
                <p className="text-xs text-orange-600 mt-1">
                  ⚠️ {getTranslation('news.form.criticalContentWarning', 'High priority news requires Nepali translation')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {getTranslation('news.form.primaryLanguage', 'Primary Language')}
              </label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value as 'en' | 'ne' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getTranslation('news.form.publishDate', 'Publish Date & Time')}
            </label>
            <input
              type="datetime-local"
              value={formData.publishedAt}
              onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="text-xs text-gray-500 mt-1">
              {getTranslation('news.form.scheduleHelp', 'Set a future date to schedule publication')}
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              {getTranslation('news.form.active', 'Active (visible in news ticker)')}
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={closeModal}
              variant="outline"
              disabled={submitting}
            >
              {getTranslation('common.cancel', 'Cancel')}
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submitting ? getTranslation('common.saving', 'Saving...') : (editingItem ? getTranslation('common.update', 'Update') : getTranslation('common.create', 'Create'))}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default NewsManagement