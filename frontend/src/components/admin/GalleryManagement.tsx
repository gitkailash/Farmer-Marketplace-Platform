import React, { useState, useEffect } from 'react'
import { adminGalleryService, GalleryItemAdmin } from '../../services/contentService'
import { LoadingSpinner, ErrorDisplay, Button, Modal } from '../UI'
import { MultilingualInputField, MultilingualTextareaField } from '../UI/MultilingualInput'
import { useToastContext } from '../../contexts/ToastProvider'
import { useI18n } from '../../contexts/I18nProvider'
import { getLocalizedText, getLanguageIndicator } from '../../utils/multilingual'

interface GalleryFormData {
  title: {
    en: string
    ne: string
  }
  description: {
    en: string
    ne: string
  }
  imageUrl: string
  category: {
    en: string
    ne: string
  }
  isActive: boolean
}

const GALLERY_CATEGORIES = [
  {
    en: 'Featured Products',
    ne: 'विशेष उत्पादनहरू'
  },
  {
    en: 'Farm Life',
    ne: 'खेती जीवन'
  },
  {
    en: 'Community Events',
    ne: 'सामुदायिक कार्यक्रमहरू'
  },
  {
    en: 'Seasonal Highlights',
    ne: 'मौसमी विशेषताहरू'
  },
  {
    en: 'Success Stories',
    ne: 'सफलताका कथाहरू'
  },
  {
    en: 'Educational',
    ne: 'शैक्षिक'
  },
  {
    en: 'Other',
    ne: 'अन्य'
  }
]

const GalleryManagement: React.FC = () => {
  const [items, setItems] = useState<GalleryItemAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingItem, setEditingItem] = useState<GalleryItemAdmin | null>(null)
  const [formData, setFormData] = useState<GalleryFormData>({
    title: { en: '', ne: '' },
    description: { en: '', ne: '' },
    imageUrl: '',
    category: { en: 'Featured Products', ne: 'विशेष उत्पादनहरू' },
    isActive: true
  })
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState<{
    category: string
    isActive: string
  }>({
    category: '',
    isActive: ''
  })
  const [draggedItem, setDraggedItem] = useState<GalleryItemAdmin | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const { success: showToastSuccess, error: showToastError } = useToastContext()
  const { language } = useI18n()

  useEffect(() => {
    loadItems()
  }, [filter])

  const loadItems = async () => {
    try {
      setLoading(true)
      setError(null)

      const params: any = {
        sortBy: 'order',
        sortOrder: 'asc' as const,
        limit: 100
      }

      if (filter.category) params.category = filter.category
      if (filter.isActive) params.isActive = filter.isActive === 'true'

      const response = await adminGalleryService.getAllItems(params)
      
      if (response.success && response.data) {
        setItems(response.data)
      } else {
        setError(response.message || 'Failed to load gallery items')
      }
    } catch (err) {
      console.error('Failed to load gallery items:', err)
      setError('Failed to load gallery items')
    } finally {
      setLoading(false)
    }
  }

  const handleDragStart = (e: React.DragEvent, item: GalleryItemAdmin) => {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    setDragOverIndex(null)

    if (!draggedItem) return

    const sourceIndex = items.findIndex(item => item._id === draggedItem._id)
    if (sourceIndex === targetIndex) return

    // Reorder items locally
    const reorderedItems = Array.from(items)
    const [removed] = reorderedItems.splice(sourceIndex, 1)
    reorderedItems.splice(targetIndex, 0, removed)

    // Update order values
    const updatedItems = reorderedItems.map((item, index) => ({
      ...item,
      order: index
    }))

    setItems(updatedItems)
    setDraggedItem(null)

    try {
      // Send reorder request to backend
      const reorderData = updatedItems.map((item, index) => ({
        id: item._id,
        order: index
      }))

      const response = await adminGalleryService.reorderItems(reorderData)
      
      if (response.success) {
        showToastSuccess('Gallery items reordered successfully')
      } else {
        // Revert on failure
        setItems(items)
        showToastError(response.message || 'Failed to reorder items')
      }
    } catch (err) {
      // Revert on failure
      setItems(items)
      showToastError('Failed to reorder items')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.en.trim() || !formData.imageUrl.trim()) {
      showToastError('Please fill in all required fields')
      return
    }

    try {
      setSubmitting(true)

      // Prepare data for API - only include non-empty fields
      const apiData: any = {
        title: {
          en: formData.title.en.trim()
        },
        imageUrl: formData.imageUrl.trim(),
        category: {
          en: formData.category.en
        },
        isActive: formData.isActive
      }

      // Add Nepali title if provided
      if (formData.title.ne.trim()) {
        apiData.title.ne = formData.title.ne.trim()
      }

      // Add description if provided
      if (formData.description.en.trim() || formData.description.ne.trim()) {
        apiData.description = {}
        if (formData.description.en.trim()) {
          apiData.description.en = formData.description.en.trim()
        }
        if (formData.description.ne.trim()) {
          apiData.description.ne = formData.description.ne.trim()
        }
      }

      // Add Nepali category if provided
      if (formData.category.ne.trim()) {
        apiData.category.ne = formData.category.ne.trim()
      }

      if (editingItem) {
        // Update existing item
        const response = await adminGalleryService.updateItem(editingItem._id, apiData)
        
        if (response.success && response.data) {
          setItems(items.map(item => 
            item._id === editingItem._id ? response.data! : item
          ))
          showToastSuccess('Gallery item updated successfully')
        } else {
          showToastError(response.message || 'Failed to update gallery item')
        }
      } else {
        // Create new item
        const response = await adminGalleryService.createItem(apiData)
        
        if (response.success && response.data) {
          setItems([...items, response.data])
          showToastSuccess('Gallery item created successfully')
        } else {
          showToastError(response.message || 'Failed to create gallery item')
        }
      }

      // Reset form and close modal
      setFormData({
        title: { en: '', ne: '' },
        description: { en: '', ne: '' },
        imageUrl: '',
        category: { en: 'Featured Products', ne: 'विशेष उत्पादनहरू' },
        isActive: true
      })
      setShowCreateModal(false)
      setEditingItem(null)
    } catch (err) {
      showToastError('Failed to save gallery item')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (item: GalleryItemAdmin) => {
    setEditingItem(item)
    
    // Handle both legacy string and new multilingual format
    const title = typeof item.title === 'string' 
      ? { en: item.title, ne: '' }
      : { en: item.title.en || '', ne: item.title.ne || '' }
    
    const description = item.description
      ? typeof item.description === 'string'
        ? { en: item.description, ne: '' }
        : { en: item.description.en || '', ne: item.description.ne || '' }
      : { en: '', ne: '' }
    
    const category = typeof item.category === 'string'
      ? { en: item.category, ne: '' }
      : { en: item.category.en || '', ne: item.category.ne || '' }
    
    setFormData({
      title,
      description,
      imageUrl: item.imageUrl,
      category,
      isActive: item.isActive
    })
    setShowCreateModal(true)
  }

  const handleDelete = async (item: GalleryItemAdmin) => {
    if (!confirm(`Are you sure you want to delete "${item.title}"?`)) {
      return
    }

    try {
      const response = await adminGalleryService.deleteItem(item._id)
      
      if (response.success) {
        setItems(items.filter(i => i._id !== item._id))
        showToastSuccess('Gallery item deleted successfully')
      } else {
        showToastError(response.message || 'Failed to delete gallery item')
      }
    } catch (err) {
      showToastError('Failed to delete gallery item')
    }
  }

  const handleToggleActive = async (item: GalleryItemAdmin) => {
    try {
      const response = await adminGalleryService.updateItem(item._id, {
        isActive: !item.isActive
      })
      
      if (response.success && response.data) {
        setItems(items.map(i => 
          i._id === item._id ? response.data! : i
        ))
        showToastSuccess(
          `Gallery item ${!item.isActive ? 'activated' : 'deactivated'} successfully`
        )
      } else {
        showToastError(response.message || 'Failed to update gallery item')
      }
    } catch (err) {
      showToastError('Failed to update gallery item')
    }
  }

  const closeModal = () => {
    setShowCreateModal(false)
    setEditingItem(null)
    setFormData({
      title: { en: '', ne: '' },
      description: { en: '', ne: '' },
      imageUrl: '',
      category: { en: 'Featured Products', ne: 'विशेष उत्पादनहरू' },
      isActive: true
    })
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
              Gallery Management
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>Drag and drop items to reorder them. The order here determines the display order in the homepage gallery.</p>
              <p className="mt-1">Only active items will be visible to visitors.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Category Filter */}
          <select
            value={filter.category}
            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {GALLERY_CATEGORIES.map(category => (
              <option key={category.en} value={category.en}>
                {getLocalizedText(category, language) || category.en}
              </option>
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
          Add Gallery Item
        </Button>
      </div>

      {/* Gallery Items */}
      {items.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <span className="text-4xl mb-4 block">🖼️</span>
            <p className="text-lg font-medium">No gallery items found</p>
            <p className="text-sm">Create your first gallery item to get started</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => {
            // Get localized content for display with fallbacks
            const localizedTitle = getLocalizedText(item?.title, language) || 'Gallery Item'
            const localizedCategory = getLocalizedText(item?.category, language) || 'Uncategorized'
            const titleIndicator = getLanguageIndicator(item?.title, language)
            
            return (
              <div
                key={item._id}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                className={`
                  bg-white border border-gray-200 rounded-lg p-4 transition-all cursor-move
                  ${dragOverIndex === index ? 'border-blue-500 bg-blue-50' : 'shadow-sm hover:shadow-md'}
                  ${draggedItem?._id === item._id ? 'opacity-50' : ''}
                `}
              >
                <div className="flex items-center gap-4">
                  {/* Drag Handle */}
                  <div className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                    </svg>
                  </div>

                  {/* Image Preview */}
                  <div className="flex-shrink-0">
                    <img
                      src={item.imageUrl}
                      alt={localizedTitle}
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNiAyMEgzOFYzMkgyNlYyMFoiIGZpbGw9IiM5QjlCQTAiLz4KPHA+'
                      }}
                    />
                  </div>

                  {/* Item Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {localizedTitle}
                      </h3>
                      {titleIndicator.show && (
                        <span 
                          className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full"
                          title={`Content available in ${titleIndicator.language === 'en' ? 'English' : 'Nepali'} only`}
                        >
                          {titleIndicator.language === 'en' ? 'EN' : 'नेपाली'}
                        </span>
                      )}
                      <span className={`
                        px-2 py-1 text-xs rounded-full
                        ${item.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                        }
                      `}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Category: {localizedCategory}
                    </p>
                    <p className="text-xs text-gray-500">
                      Order: {item.order} • Created: {new Date(item.createdAt).toLocaleDateString()}
                    </p>
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
        title={editingItem ? 'Edit Gallery Item' : 'Add Gallery Item'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <MultilingualInputField
            label="Title *"
            value={formData.title}
            onChange={(value) => setFormData({ ...formData, title: value })}
            placeholder="Enter gallery item title"
            required
          />

          <MultilingualTextareaField
            label="Description"
            value={formData.description}
            onChange={(value) => setFormData({ ...formData, description: value })}
            placeholder="Enter gallery item description"
            rows={3}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image URL *
            </label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/image.jpg"
              required
            />
            {formData.imageUrl && (
              <div className="mt-2">
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="w-32 h-24 object-cover rounded-md border border-gray-200"
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
              Category
            </label>
            <select
              value={formData.category.en}
              onChange={(e) => {
                const selectedCategory = GALLERY_CATEGORIES.find(cat => cat.en === e.target.value)
                if (selectedCategory) {
                  setFormData({ 
                    ...formData, 
                    category: { 
                      en: selectedCategory.en, 
                      ne: selectedCategory.ne 
                    } 
                  })
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {GALLERY_CATEGORIES.map(category => (
                <option key={category.en} value={category.en}>
                  {getLocalizedText(category, language) || category.en}
                </option>
              ))}
            </select>
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
              Active (visible on homepage)
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
              {submitting ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default GalleryManagement