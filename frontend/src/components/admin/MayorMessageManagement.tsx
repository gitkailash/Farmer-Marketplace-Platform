import React, { useState, useEffect } from 'react'
import { adminMayorService, MayorMessageAdmin } from '../../services/contentService'
import { LoadingSpinner, ErrorDisplay, Button, Modal } from '../UI'
import { MultilingualTextareaField } from '../UI/MultilingualInput'
import { MultilingualRichTextEditor } from '../UI/MultilingualRichTextEditor'
import { useToastContext } from '../../contexts/ToastProvider'
import { useAppTranslation } from '../../contexts/I18nProvider'

interface MultilingualText {
  en: string
  ne: string
}

interface MayorMessageFormData {
  text: MultilingualText
  imageUrl: string
  scrollSpeed: number
  isActive: boolean
  useRichText: boolean
}

const MayorMessageManagement: React.FC = () => {
  const [messages, setMessages] = useState<MayorMessageAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingMessage, setEditingMessage] = useState<MayorMessageAdmin | null>(null)
  const [formData, setFormData] = useState<MayorMessageFormData>({
    text: { en: '', ne: '' },
    imageUrl: '',
    scrollSpeed: 50,
    isActive: false,
    useRichText: false
  })
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState<{
    isActive: string
  }>({
    isActive: ''
  })
  const [formErrors, setFormErrors] = useState<{
    text?: { en?: string; ne?: string }
  }>({})

  const { success: showToastSuccess, error: showToastError } = useToastContext()
  const { t } = useAppTranslation('admin')

  // Helper function to safely get translation string
  const getTranslation = (key: string, fallback: string): string => {
    const translation = t(key)
    return typeof translation === 'string' ? translation : fallback
  }

  useEffect(() => {
    loadMessages()
  }, [filter])

  const loadMessages = async () => {
    try {
      setLoading(true)
      setError(null)

      const params: any = {
        sortBy: 'updatedAt',
        sortOrder: 'desc' as const,
        limit: 50
      }

      if (filter.isActive) params.isActive = filter.isActive === 'true'

      const response = await adminMayorService.getAllMessages(params)
      
      if (response.success && response.data) {
        setMessages(response.data)
      } else {
        setError(response.message || 'Failed to load mayor messages')
      }
    } catch (err) {
      console.error('Failed to load mayor messages:', err)
      setError('Failed to load mayor messages')
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
    
    if (!formData.text.en.trim()) {
      errors.text = { en: getTranslation('mayor.errors.textRequired', 'English message text is required') }
    }

    // For mayor messages, we should encourage bilingual content but not require it
    // However, if this is marked as critical content, require both languages
    if (formData.isActive && !formData.text.ne.trim() && formData.text.en.trim()) {
      // Show warning but don't block - mayor messages are often time-sensitive
      console.warn('Active mayor message without Nepali translation')
    }

    if (formData.scrollSpeed < 10 || formData.scrollSpeed > 500) {
      showToastError(getTranslation('mayor.errors.scrollSpeedRange', 'Scroll speed must be between 10 and 500 pixels per second'))
      return
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      showToastError(getTranslation('mayor.errors.validationFailed', 'Please fix the validation errors'))
      return
    }

    try {
      setSubmitting(true)

      const submitData = {
        text: formData.text,
        scrollSpeed: formData.scrollSpeed,
        isActive: formData.isActive,
        ...(formData.imageUrl.trim() && { imageUrl: formData.imageUrl.trim() })
      }

      if (editingMessage) {
        // Update existing message
        const response = await adminMayorService.updateMessage(editingMessage._id, submitData)
        
        if (response.success && response.data) {
          setMessages(messages.map(msg => 
            msg._id === editingMessage._id ? response.data! : msg
          ))
          showToastSuccess(getTranslation('mayor.success.updated', 'Mayor message updated successfully'))
        } else {
          showToastError(response.message || getTranslation('mayor.errors.updateFailed', 'Failed to update mayor message'))
        }
      } else {
        // Create new message
        const response = await adminMayorService.createMessage(submitData)
        
        if (response.success && response.data) {
          setMessages([response.data, ...messages])
          showToastSuccess(getTranslation('mayor.success.created', 'Mayor message created successfully'))
        } else {
          showToastError(response.message || getTranslation('mayor.errors.createFailed', 'Failed to create mayor message'))
        }
      }

      // Reset form and close modal
      setFormData({
        text: { en: '', ne: '' },
        imageUrl: '',
        scrollSpeed: 50,
        isActive: false,
        useRichText: false
      })
      setFormErrors({})
      setShowCreateModal(false)
      setEditingMessage(null)
    } catch (err) {
      showToastError(getTranslation('mayor.errors.saveFailed', 'Failed to save mayor message'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (message: MayorMessageAdmin) => {
    setEditingMessage(message)
    
    // Handle multilingual format
    const textData: MultilingualText = message.text as MultilingualText || { en: '', ne: '' }
    
    setFormData({
      text: textData,
      imageUrl: message.imageUrl || '',
      scrollSpeed: message.scrollSpeed,
      isActive: message.isActive,
      useRichText: false
    })
    setFormErrors({})
    setShowCreateModal(true)
  }

  const handleDelete = async (message: MayorMessageAdmin) => {
    if (!confirm(`Are you sure you want to delete this mayor message?`)) {
      return
    }

    try {
      const response = await adminMayorService.deleteMessage(message._id)
      
      if (response.success) {
        setMessages(messages.filter(msg => msg._id !== message._id))
        showToastSuccess('Mayor message deleted successfully')
      } else {
        showToastError(response.message || 'Failed to delete mayor message')
      }
    } catch (err) {
      showToastError('Failed to delete mayor message')
    }
  }

  const handleToggleActive = async (message: MayorMessageAdmin) => {
    try {
      const response = await adminMayorService.updateMessage(message._id, {
        isActive: !message.isActive
      })
      
      if (response.success && response.data) {
        setMessages(messages.map(msg => 
          msg._id === message._id ? response.data! : msg
        ))
        showToastSuccess(
          `Mayor message ${!message.isActive ? 'activated' : 'deactivated'} successfully`
        )
      } else {
        showToastError(response.message || 'Failed to update mayor message')
      }
    } catch (err) {
      showToastError('Failed to update mayor message')
    }
  }

  const closeModal = () => {
    setShowCreateModal(false)
    setEditingMessage(null)
    setFormData({
      text: { en: '', ne: '' },
      imageUrl: '',
      scrollSpeed: 50,
      isActive: false,
      useRichText: false
    })
    setFormErrors({})
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
        onRetry={loadMessages}
      />
    )
  }

  const activeMessage = messages.find(msg => msg.isActive)

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
              Mayor Message Configuration
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>Only one mayor message can be active at a time. When you activate a message, all others will be automatically deactivated.</p>
              <p className="mt-1">The active message will scroll continuously on the homepage with the configured speed.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Active Message */}
      {activeMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-800 mb-2">
                📢 Currently Active Message
              </h3>
              <div className="bg-blue-600 text-white rounded-lg p-3 overflow-hidden">
                <div className="flex items-center">
                  {activeMessage.imageUrl && (
                    <img
                      src={activeMessage.imageUrl}
                      alt="Mayor"
                      className="w-8 h-8 rounded-full object-cover border border-white/20 mr-3"
                    />
                  )}
                  <div className="text-sm">
                    📢 {(activeMessage.text as MultilingualText)?.en || activeMessage.text}
                  </div>
                </div>
              </div>
              <p className="text-xs text-green-700 mt-2">
                Speed: {activeMessage.scrollSpeed} px/s • Updated: {new Date(activeMessage.updatedAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => handleEdit(activeMessage)}
              className="ml-4 px-3 py-1 text-xs bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors"
            >
              Edit
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Status Filter */}
          <select
            value={filter.isActive}
            onChange={(e) => setFilter({ ...filter, isActive: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Messages</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Create Mayor Message
        </Button>
      </div>

      {/* Messages List */}
      {messages.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <span className="text-4xl mb-4 block">📢</span>
            <p className="text-lg font-medium">No mayor messages found</p>
            <p className="text-sm">Create your first mayor message to get started</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message._id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* Message Preview */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`
                      px-2 py-1 text-xs rounded-full
                      ${message.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                      }
                    `}>
                      {message.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-xs text-gray-500">
                      Speed: {message.scrollSpeed} px/s
                    </span>
                  </div>
                  
                  <div className="bg-gray-100 rounded-lg p-3 mb-3">
                    <div className="flex items-center text-sm">
                      {message.imageUrl && (
                        <img
                          src={message.imageUrl}
                          alt="Mayor"
                          className="w-6 h-6 rounded-full object-cover border border-gray-300 mr-2"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      )}
                      <span className="text-gray-700">
                        📢 {(message.text as MultilingualText)?.en || message.text}
                        {(message.text as MultilingualText)?.ne && (
                          <span className="ml-2 text-sm text-green-600">
                            ✓ {getTranslation('common.bilingual', 'Bilingual')}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Created: {new Date(message.createdAt).toLocaleString()} • 
                    Updated: {new Date(message.updatedAt).toLocaleString()}
                    {message.creator && (
                      <> • By: {message.creator.profile.name}</>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(message)}
                    className={`
                      px-3 py-1 text-xs rounded-md transition-colors
                      ${message.isActive
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }
                    `}
                  >
                    {message.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleEdit(message)}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(message)}
                    className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={closeModal}
        title={editingMessage ? 'Edit Mayor Message' : 'Create Mayor Message'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="useRichText"
              checked={formData.useRichText}
              onChange={(e) => setFormData({ ...formData, useRichText: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="useRichText" className="ml-2 block text-sm text-gray-700">
              {getTranslation('mayor.form.useRichText', 'Use rich text editor (for formatted content)')}
              {/* Debug: {JSON.stringify({ key: 'mayor.form.useRichText', value: t('mayor.form.useRichText'), language })} */}
            </label>
          </div>

          {formData.useRichText ? (
            <MultilingualRichTextEditor
              label={`${getTranslation('mayor.form.messageText', 'Message Text')} *`}
              value={formData.text}
              onChange={(value) => setFormData({ ...formData, text: value })}
              error={formErrors.text}
              placeholder={getTranslation('mayor.form.messagePlaceholder', 'Enter the mayor\'s message...')}
              required
              minHeight="150px"
            />
          ) : (
            <MultilingualTextareaField
              label={`${getTranslation('mayor.form.messageText', 'Message Text')} *`}
              value={formData.text}
              onChange={(value) => setFormData({ ...formData, text: value })}
              error={formErrors.text}
              placeholder={getTranslation('mayor.form.messagePlaceholder', 'Enter the mayor\'s message...')}
              rows={3}
              maxLength={1000}
              required
            />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mayor Image URL (Optional)
            </label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/mayor-photo.jpg"
            />
            {formData.imageUrl && (
              <div className="mt-2">
                <img
                  src={formData.imageUrl}
                  alt="Mayor preview"
                  className="w-16 h-16 object-cover rounded-full border border-gray-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scroll Speed (pixels per second)
            </label>
            <input
              type="number"
              min="10"
              max="500"
              value={formData.scrollSpeed}
              onChange={(e) => setFormData({ ...formData, scrollSpeed: parseInt(e.target.value) || 50 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="text-xs text-gray-500 mt-1">
              Recommended: 30-80 px/s for readability
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
              Activate this message (will deactivate others)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={closeModal}
              variant="outline"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submitting ? 'Saving...' : (editingMessage ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default MayorMessageManagement