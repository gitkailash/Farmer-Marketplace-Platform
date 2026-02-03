import React, { useState, useEffect, useCallback } from 'react'
import { 
  translationService, 
  TranslationKey, 
  ValidationReport, 
  CreateTranslationRequest,
  UpdateTranslationRequest 
} from '../../services/translationService'
import { LoadingSpinner, ErrorDisplay, Button, Modal } from '../UI'
import TranslationImportModal from './TranslationImportModal'
import { useToastContext } from '../../contexts/ToastProvider'
import { 
  Languages, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Upload, 
  Search, 
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'

const NAMESPACES = [
  'common',
  'auth', 
  'products',
  'admin',
  'navigation',
  'forms',
  'errors',
  'messages',
  'notifications',
  'gallery',
  'news',
  'reviews',
  'orders',
  'dashboard',
  'buyer',
  'farmer'
] as const

type Namespace = typeof NAMESPACES[number]

interface TranslationFormData {
  key: string
  namespace: Namespace
  translations: {
    en: string
    ne: string
  }
  context: string
  isRequired: boolean
}

const TranslationManagement: React.FC = () => {
  const { success: showSuccess, error: showError } = useToastContext()
  const [translationKeys, setTranslationKeys] = useState<TranslationKey[]>([])
  const [validationReports, setValidationReports] = useState<Record<string, ValidationReport>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters and pagination
  const [selectedNamespace, setSelectedNamespace] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalKeys, setTotalKeys] = useState(0)
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingKey, setEditingKey] = useState<TranslationKey | null>(null)
  
  // Form states
  const [formData, setFormData] = useState<TranslationFormData>({
    key: '',
    namespace: 'common',
    translations: { en: '', ne: '' },
    context: '',
    isRequired: false
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Load translation keys
  const loadTranslationKeys = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await translationService.getTranslationKeys({
        namespace: selectedNamespace || undefined,
        page: currentPage,
        limit: 50
      })
      
      if (response.success && response.data) {
        setTranslationKeys(response.data.keys)
        setTotalPages(response.data.totalPages)
        setTotalKeys(response.data.total)
      } else {
        setError(response.message || 'Failed to load translation keys')
      }
    } catch (err) {
      console.error('Failed to load translation keys:', err)
      setError('Failed to load translation keys')
    } finally {
      setLoading(false)
    }
  }, [selectedNamespace, currentPage])

  // Load validation reports
  const loadValidationReports = useCallback(async () => {
    try {
      const reports: Record<string, ValidationReport> = {}
      
      // Load overall report
      const overallResponse = await translationService.validateCompleteness()
      if (overallResponse.success && overallResponse.data) {
        reports['all'] = overallResponse.data
      }
      
      // Load namespace-specific reports
      for (const namespace of NAMESPACES) {
        const response = await translationService.validateCompleteness(namespace)
        if (response.success && response.data) {
          reports[namespace] = response.data
        }
      }
      
      setValidationReports(reports)
    } catch (err) {
      console.error('Failed to load validation reports:', err)
    }
  }, [])

  useEffect(() => {
    loadTranslationKeys()
  }, [loadTranslationKeys])

  useEffect(() => {
    loadValidationReports()
  }, [loadValidationReports])

  // Filter keys based on search term
  const filteredKeys = translationKeys.filter(key => 
    key.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    key.translations.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (key.translations.ne && key.translations.ne.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors({})
    setSubmitting(true)

    // Client-side validation
    const errors: Record<string, string> = {}
    
    if (!editingKey) {
      // Only validate key and namespace for new translations
      if (!formData.key || formData.key.trim() === '') {
        errors.key = 'Translation key is required'
      } else if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/.test(formData.key)) {
        errors.key = 'Key must follow format: namespace.section.item (lowercase, underscores allowed)'
      }
      
      if (!formData.namespace || formData.namespace.trim() === '') {
        errors.namespace = 'Namespace is required'
      }
    }
    
    if (!formData.translations.en || formData.translations.en.trim() === '') {
      errors.en = 'English translation is required'
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      setSubmitting(false)
      return
    }

    try {
      if (editingKey) {
        // Update existing translation - only send updatable fields
        const updateData: UpdateTranslationRequest = {
          translations: {
            en: formData.translations.en.trim(),
            ne: formData.translations.ne.trim() || undefined
          },
          context: formData.context?.trim() || undefined,
          isRequired: formData.isRequired
        }
        
        const response = await translationService.updateTranslation(editingKey.key, updateData)
        if (response.success) {
          showSuccess('Translation updated successfully!')
          setShowEditModal(false)
          setEditingKey(null)
          await loadTranslationKeys()
          await loadValidationReports()
        } else {
          setFormErrors({ general: response.message || 'Failed to update translation' })
        }
      } else {
        // Create new translation
        const createData: CreateTranslationRequest = {
          key: formData.key.trim(),
          namespace: formData.namespace.trim(),
          translations: {
            en: formData.translations.en.trim(),
            ne: formData.translations.ne.trim() || undefined
          },
          context: formData.context?.trim() || undefined,
          isRequired: formData.isRequired
        }
        
        const response = await translationService.createTranslation(createData)
        if (response.success) {
          showSuccess('Translation created successfully!')
          setShowCreateModal(false)
          resetForm()
          await loadTranslationKeys()
          await loadValidationReports()
        } else {
          setFormErrors({ general: response.message || 'Failed to create translation' })
        }
      }
    } catch (err) {
      console.error('Form submission error:', err)
      setFormErrors({ general: 'An unexpected error occurred' })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle delete
  const handleDelete = async (key: string) => {
    if (!confirm('Are you sure you want to delete this translation key?')) {
      return
    }

    try {
      const response = await translationService.deleteTranslation(key)
      if (response.success) {
        showSuccess('Translation deleted successfully!')
        await loadTranslationKeys()
        await loadValidationReports()
      } else {
        showError(response.message || 'Failed to delete translation')
      }
    } catch (err) {
      console.error('Delete error:', err)
      showError('Failed to delete translation')
    }
  }

  // Handle export
  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const blob = await translationService.exportTranslations(format)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `translations_${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      showSuccess(`Translations exported successfully as ${format.toUpperCase()}!`)
    } catch (err) {
      console.error('Export error:', err)
      showError('Failed to export translations')
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      key: '',
      namespace: 'common',
      translations: { en: '', ne: '' },
      context: '',
      isRequired: false
    })
    setFormErrors({})
  }

  // Open edit modal
  const openEditModal = (key: TranslationKey) => {
    setEditingKey(key)
    setFormData({
      key: key.key,
      namespace: key.namespace as Namespace,
      translations: {
        en: key.translations.en,
        ne: key.translations.ne || ''
      },
      context: key.context || '',
      isRequired: key.isRequired
    })
    setFormErrors({})
    setShowEditModal(true)
  }

  // Get completeness color
  const getCompletenessColor = (completeness: number) => {
    if (completeness >= 90) return 'text-green-600'
    if (completeness >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading && translationKeys.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error && translationKeys.length === 0) {
    return (
      <ErrorDisplay 
        message={error}
        onRetry={loadTranslationKeys}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Languages className="text-blue-600" size={24} />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Translation Management
            </h2>
            <p className="text-sm text-gray-600">
              Manage translation keys and monitor completeness
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('json')}
            className="flex items-center space-x-1"
          >
            <Download size={16} />
            <span>Export JSON</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            className="flex items-center space-x-1"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImportModal(true)}
            className="flex items-center space-x-1"
          >
            <Upload size={16} />
            <span>Import</span>
          </Button>
          <Button
            onClick={() => {
              resetForm()
              setShowCreateModal(true)
            }}
            className="flex items-center space-x-1"
          >
            <Plus size={16} />
            <span>Add Translation</span>
          </Button>
        </div>
      </div>

      {/* Completeness Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Completeness */}
        {validationReports['all'] && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">Overall</h3>
              <CheckCircle 
                className={getCompletenessColor(validationReports['all'].completeness)} 
                size={20} 
              />
            </div>
            <div className="text-2xl font-bold mb-1">
              <span className={getCompletenessColor(validationReports['all'].completeness)}>
                {validationReports['all'].completeness.toFixed(1)}%
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {validationReports['all'].totalKeys - validationReports['all'].missingKeys.length} of {validationReports['all'].totalKeys} complete
            </div>
          </div>
        )}

        {/* Top 3 namespace completeness */}
        {NAMESPACES.slice(0, 3).map(namespace => {
          const report = validationReports[namespace]
          if (!report) return null
          
          return (
            <div key={namespace} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900 capitalize">{namespace}</h3>
                <CheckCircle 
                  className={getCompletenessColor(report.completeness)} 
                  size={20} 
                />
              </div>
              <div className="text-2xl font-bold mb-1">
                <span className={getCompletenessColor(report.completeness)}>
                  {report.completeness.toFixed(1)}%
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {report.totalKeys - report.missingKeys.length} of {report.totalKeys} complete
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search translation keys..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={selectedNamespace}
              onChange={(e) => {
                setSelectedNamespace(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Namespaces</option>
              {NAMESPACES.map(namespace => (
                <option key={namespace} value={namespace} className="capitalize">
                  {namespace}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Translation Keys Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Translation Keys
            </h3>
            <div className="text-sm text-gray-600">
              Showing {filteredKeys.length} of {totalKeys} keys
            </div>
          </div>
        </div>

        {filteredKeys.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Languages className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No translation keys found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedNamespace 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first translation key.'
              }
            </p>
            {!searchTerm && !selectedNamespace && (
              <Button
                onClick={() => {
                  resetForm()
                  setShowCreateModal(true)
                }}
                className="flex items-center space-x-1"
              >
                <Plus size={16} />
                <span>Add Translation</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    English
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nepali
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredKeys.map((key) => (
                  <tr key={key._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {key.key}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {key.namespace}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {key.translations.en}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {key.translations.ne ? (
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {key.translations.ne}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">
                          Not translated
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {key.translations.ne ? (
                          <CheckCircle className="text-green-500" size={16} />
                        ) : (
                          <AlertCircle className="text-yellow-500" size={16} />
                        )}
                        {key.isRequired && (
                          <span title="Required translation">
                            <Info className="text-blue-500" size={16} />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditModal(key)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(key.key)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false)
          setShowEditModal(false)
          setEditingKey(null)
          resetForm()
        }}
        title={editingKey ? 'Edit Translation' : 'Create Translation'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formErrors.general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="text-sm text-red-600">{formErrors.general}</div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Translation Key
            </label>
            <input
              type="text"
              value={formData.key}
              onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
              disabled={!!editingKey}
              placeholder="e.g., common.buttons.save_product"
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 ${
                formErrors.key ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            />
            {formErrors.key && (
              <div className="text-sm text-red-600 mt-1">{formErrors.key}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Namespace
            </label>
            <select
              value={formData.namespace}
              onChange={(e) => setFormData(prev => ({ ...prev, namespace: e.target.value as Namespace }))}
              disabled={!!editingKey}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 ${
                formErrors.namespace ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            >
              {NAMESPACES.map(namespace => (
                <option key={namespace} value={namespace} className="capitalize">
                  {namespace}
                </option>
              ))}
            </select>
            {formErrors.namespace && (
              <div className="text-sm text-red-600 mt-1">{formErrors.namespace}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              English Translation
            </label>
            <textarea
              value={formData.translations.en}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                translations: { ...prev.translations, en: e.target.value }
              }))}
              placeholder="Enter English translation..."
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                formErrors.en ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            />
            {formErrors.en && (
              <div className="text-sm text-red-600 mt-1">{formErrors.en}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nepali Translation
            </label>
            <textarea
              value={formData.translations.ne}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                translations: { ...prev.translations, ne: e.target.value }
              }))}
              placeholder="Enter Nepali translation..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ fontFamily: 'Noto Sans Devanagari, sans-serif' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Context (Optional)
            </label>
            <input
              type="text"
              value={formData.context}
              onChange={(e) => setFormData(prev => ({ ...prev, context: e.target.value }))}
              placeholder="Additional context for translators..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isRequired"
              checked={formData.isRequired}
              onChange={(e) => setFormData(prev => ({ ...prev, isRequired: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isRequired" className="ml-2 block text-sm text-gray-700">
              Required translation
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreateModal(false)
                setShowEditModal(false)
                setEditingKey(null)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <LoadingSpinner size="sm" />
              ) : (
                editingKey ? 'Update Translation' : 'Create Translation'
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Import Modal */}
      <TranslationImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={async () => {
          showSuccess('Translations imported successfully!')
          await loadTranslationKeys()
          await loadValidationReports()
        }}
      />
    </div>
  )
}

export default TranslationManagement