import React, { useState, useEffect } from 'react'
import { 
  LoadingSpinner, 
  ErrorDisplay, 
  EmptyState, 
  Button, 
  PrimaryButton, 
  SecondaryButton, 
  DangerButton,
  Modal,
  ConfirmModal,
  useToast,
  InputField,
  LanguageIndicator
} from '../../components/UI'
import { productService, ProductCreateRequest } from '../../services/productService'
import { Product } from '../../types/api'
import ProductForm from './components/ProductForm'
import { useI18n, useAppTranslation } from '../../contexts/I18nProvider'
import { getLocalizedText, getLanguageIndicator, getLocalizedCategory } from '../../utils/multilingual'

interface ProductUpdateRequest extends Partial<ProductCreateRequest> {
  status?: Product['status']
}

interface BulkUpdateData {
  productIds: string[]
  action: 'publish' | 'unpublish' | 'delete' | 'updateStock'
  stockValue?: number
}

// Product Card Component
interface ProductCardProps {
  product: Product
  isSelected: boolean
  onToggleSelect: () => void
  onEdit: () => void
  onDelete: () => void
  onPublish: () => void
  onUpdateInventory: () => void
  getStatusBadge: (status: Product['status']) => string
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  onPublish,
  onUpdateInventory,
  getStatusBadge
}) => {
  const { language } = useI18n()
  const { t } = useAppTranslation('farmer')
  
  // Get localized content with fallbacks
  const localizedName = getLocalizedText(product?.name, language) || 'Product Name Not Available'
  const localizedDescription = getLocalizedText(product?.description, language) || 'Description not available'
  const localizedCategory = getLocalizedCategory(product?.category, language) || 'Uncategorized'
  
  // Get language indicators for partial translations
  const nameIndicator = getLanguageIndicator(product?.name, language)
  const descriptionIndicator = getLanguageIndicator(product?.description, language)

  return (
    <div className={`bg-white rounded-lg shadow-sm border overflow-hidden transition-all ${
      isSelected ? 'border-primary-300 ring-2 ring-primary-100' : 'border-gray-200'
    }`}>
      {/* Selection Checkbox */}
      <div className="p-3 border-b border-gray-100">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-600">{t('products.card.select', 'Select')}</span>
        </label>
      </div>

      {/* Product Image */}
      <div className="aspect-w-16 aspect-h-9 bg-gray-100">
        {product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={localizedName}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-48 text-gray-400">
            <span className="text-4xl">📦</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start gap-2 flex-1">
            <h3 className={`text-lg font-semibold text-gray-900 truncate flex-1 ${language === 'ne' ? 'font-nepali' : ''}`}>
              {localizedName}
            </h3>
            {nameIndicator.show && nameIndicator.language && (
              <LanguageIndicator language={nameIndicator.language} size="sm" />
            )}
          </div>
          <span className={getStatusBadge(product.status)}>
            {t(`products.status.${product.status.toLowerCase()}`, product.status)}
          </span>
        </div>

        <div className="flex items-start gap-2 mb-3">
          <p className={`text-gray-600 text-sm line-clamp-2 flex-1 ${language === 'ne' ? 'font-nepali' : ''}`}>
            {localizedDescription}
          </p>
          {descriptionIndicator.show && descriptionIndicator.language && (
            <LanguageIndicator language={descriptionIndicator.language} size="sm" />
          )}
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t('products.card.price', 'Price:')}</span>
            <span className="font-medium">₨{product.price}/{product.unit}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t('products.card.stock', 'Stock:')}</span>
            <div className="flex items-center gap-2">
              <span className={`font-medium ${product.stock <= 10 ? 'text-red-600' : 'text-green-600'}`}>
                {product.stock} {product.unit}s
              </span>
              <button
                onClick={onUpdateInventory}
                className="text-xs text-primary-600 hover:text-primary-700 underline"
                title="Update inventory"
              >
                {t('products.card.update', 'Update')}
              </button>
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t('products.card.category', 'Category:')}</span>
            <span className={`font-medium ${language === 'ne' ? 'font-nepali' : ''}`}>
              {localizedCategory}
            </span>
          </div>
        </div>

        {/* Low Stock Warning */}
        {product.stock <= 10 && (
          <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-xs text-yellow-800 flex items-center gap-1">
              <span>⚠️</span>
              {t('products.card.lowStockWarning', 'Low stock warning')}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <SecondaryButton
              size="sm"
              onClick={onEdit}
              className="flex-1"
            >
              {t('products.card.edit', 'Edit')}
            </SecondaryButton>
            
            {product.status === 'DRAFT' && (
              <Button
                variant="success"
                size="sm"
                onClick={onPublish}
                className="flex-1"
              >
                {t('products.card.publish', 'Publish')}
              </Button>
            )}
          </div>
          
          <DangerButton
            size="sm"
            onClick={onDelete}
            className="w-full"
          >
            {t('products.card.delete', 'Delete')}
          </DangerButton>
        </div>
      </div>
    </div>
  )
}

const FarmerProducts: React.FC = () => {
  const { success, error: showError } = useToast()
  const { t } = useAppTranslation('farmer')
  const { language } = useI18n()
  
  // State management
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean
    product: Product | null
  }>({ isOpen: false, product: null })
  
  // Bulk operations state
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [bulkActionModal, setBulkActionModal] = useState<{
    isOpen: boolean
    action: BulkUpdateData['action'] | null
  }>({ isOpen: false, action: null })
  const [bulkStockValue, setBulkStockValue] = useState<string>('')
  
  // Inventory tracking state
  const [inventoryModal, setInventoryModal] = useState<{
    isOpen: boolean
    product: Product | null
  }>({ isOpen: false, product: null })
  const [newStockValue, setNewStockValue] = useState<string>('')
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | Product['status']>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Load farmer's products
  const loadProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await productService.getFarmerProducts()
      if (response.success && response.data) {
        setProducts(response.data)
      } else {
        setError(response.message || 'Failed to load products')
      }
    } catch (err) {
      setError('Failed to load products')
      console.error('Error loading products:', err)
    } finally {
      setLoading(false)
    }
  }

  // Load products on component mount
  useEffect(() => {
    loadProducts()
  }, [])

  // Handle product creation
  const handleCreateProduct = async (productData: ProductCreateRequest) => {
    try {
      const response = await productService.createProduct(productData)
      if (response.success && response.data) {
        setProducts(prev => [...prev, response.data!])
        setIsFormModalOpen(false)
        success(t('products.messages.created', 'Product created successfully'))
      } else {
        throw new Error(response.message || 'Failed to create product')
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to create product')
    }
  }

  // Handle product update
  const handleUpdateProduct = async (productData: ProductUpdateRequest) => {
    if (!editingProduct) return

    try {
      const response = await productService.updateProduct(editingProduct._id, productData)
      if (response.success && response.data) {
        setProducts(prev => 
          prev.map(p => p._id === editingProduct._id ? response.data! : p)
        )
        setEditingProduct(null)
        setIsFormModalOpen(false)
        success(t('products.messages.updated', 'Product updated successfully'))
      } else {
        throw new Error(response.message || 'Failed to update product')
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update product')
    }
  }

  // Handle product deletion
  const handleDeleteProduct = async (product: Product) => {
    try {
      const response = await productService.deleteProduct(product._id)
      if (response.success) {
        setProducts(prev => prev.filter(p => p._id !== product._id))
        success(t('products.messages.deleted', 'Product deleted successfully'))
      } else {
        throw new Error(response.message || 'Failed to delete product')
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete product')
    }
  }

  // Handle product publishing
  const handlePublishProduct = async (product: Product) => {
    try {
      const response = await productService.publishProduct(product._id)
      if (response.success && response.data) {
        setProducts(prev => 
          prev.map(p => p._id === product._id ? response.data! : p)
        )
        success(t('products.messages.published', 'Product published successfully'))
      } else {
        throw new Error(response.message || 'Failed to publish product')
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to publish product')
    }
  }

  // Handle inventory update
  const handleUpdateInventory = async (product: Product, newStock: number) => {
    try {
      const response = await productService.updateProduct(product._id, { stock: newStock })
      if (response.success && response.data) {
        setProducts(prev => 
          prev.map(p => p._id === product._id ? response.data! : p)
        )
        success(t('products.messages.inventoryUpdated', 'Inventory updated successfully'))
        setInventoryModal({ isOpen: false, product: null })
        setNewStockValue('')
      } else {
        throw new Error(response.message || 'Failed to update inventory')
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update inventory')
    }
  }

  // Handle bulk operations
  const handleBulkAction = async (action: BulkUpdateData['action']) => {
    if (selectedProducts.size === 0) {
      showError(t('products.messages.selectProductsFirst', 'Please select products first'))
      return
    }

    setBulkActionModal({ isOpen: true, action })
  }

  const executeBulkAction = async () => {
    const { action } = bulkActionModal
    if (!action || selectedProducts.size === 0) return

    try {
      const productIds = Array.from(selectedProducts)
      
      switch (action) {
        case 'publish':
          for (const id of productIds) {
            await productService.publishProduct(id)
          }
          success(t('products.messages.bulkPublished', { count: productIds.length }))
          break
          
        case 'unpublish':
          for (const id of productIds) {
            await productService.updateProduct(id, { status: 'INACTIVE' } as ProductUpdateRequest)
          }
          success(t('products.messages.bulkUnpublished', { count: productIds.length }))
          break
          
        case 'delete':
          for (const id of productIds) {
            await productService.deleteProduct(id)
          }
          success(t('products.messages.bulkDeleted', { count: productIds.length }))
          break
          
        case 'updateStock':
          const stockValue = parseInt(bulkStockValue)
          if (isNaN(stockValue) || stockValue < 0) {
            showError(t('products.messages.validStockValue', 'Please enter a valid stock value'))
            return
          }
          
          for (const id of productIds) {
            await productService.updateProduct(id, { stock: stockValue })
          }
          success(t('products.messages.bulkStockUpdated', { count: productIds.length }))
          break
      }
      
      // Reload products and clear selection
      await loadProducts()
      setSelectedProducts(new Set())
      setBulkActionModal({ isOpen: false, action: null })
      setBulkStockValue('')
      
    } catch (err) {
      showError(err instanceof Error ? err.message : t('products.messages.bulkOperationFailed', 'Bulk operation failed'))
    }
  }

  // Selection handlers
  const toggleProductSelection = (productId: string) => {
    const newSelection = new Set(selectedProducts)
    if (newSelection.has(productId)) {
      newSelection.delete(productId)
    } else {
      newSelection.add(productId)
    }
    setSelectedProducts(newSelection)
  }

  const selectAllProducts = () => {
    const filteredProductIds = filteredProducts.map(p => p._id)
    setSelectedProducts(new Set(filteredProductIds))
  }

  const clearSelection = () => {
    setSelectedProducts(new Set())
  }

  // Open edit modal
  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setIsFormModalOpen(true)
  }

  // Close form modal
  const closeFormModal = () => {
    setIsFormModalOpen(false)
    setEditingProduct(null)
  }

  // Open delete confirmation
  const openDeleteConfirm = (product: Product) => {
    setDeleteConfirmModal({ isOpen: true, product })
  }

  // Close delete confirmation
  const closeDeleteConfirm = () => {
    setDeleteConfirmModal({ isOpen: false, product: null })
  }

  // Confirm deletion
  const confirmDelete = () => {
    if (deleteConfirmModal.product) {
      handleDeleteProduct(deleteConfirmModal.product)
    }
    closeDeleteConfirm()
  }

  // Open inventory modal
  const openInventoryModal = (product: Product) => {
    setInventoryModal({ isOpen: true, product })
    setNewStockValue(product.stock.toString())
  }

  // Get status badge styling
  const getStatusBadge = (status: Product['status']) => {
    const styles = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PUBLISHED: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-red-100 text-red-800'
    }
    return `px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`
  }

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesStatus = statusFilter === 'ALL' || product.status === statusFilter
    const matchesSearch = searchQuery === '' || 
      (getLocalizedText(product?.name, language) || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (getLocalizedCategory(product?.category, language) || '').toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <ErrorDisplay 
        message={error}
        onRetry={loadProducts}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('products.title', 'My Products')}</h1>
          <p className="text-gray-600">{t('products.subtitle', 'Manage your product listings and inventory')}</p>
        </div>
        
        <PrimaryButton
          onClick={() => setIsFormModalOpen(true)}
          icon="+"
        >
          {t('products.addNew', 'Add New Product')}
        </PrimaryButton>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <InputField
              name="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('products.searchPlaceholder', 'Search products by name or category...')}
              icon="🔍"
            />
          </div>
          
          {/* Status Filter */}
          <div className="flex gap-2">
            {(['ALL', 'PUBLISHED', 'DRAFT', 'INACTIVE'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'ALL' ? t('products.filters.all', 'All') : t(`products.filters.${status.toLowerCase()}`, status)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-900">
                {t('products.bulkActions.selected', { count: selectedProducts.size })}
              </span>
              <button
                onClick={clearSelection}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                {t('products.bulkActions.clearSelection', 'Clear selection')}
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <SecondaryButton
                size="sm"
                onClick={() => handleBulkAction('publish')}
              >
                {t('products.bulkActions.publishSelected', 'Publish Selected')}
              </SecondaryButton>
              <SecondaryButton
                size="sm"
                onClick={() => handleBulkAction('unpublish')}
              >
                {t('products.bulkActions.unpublishSelected', 'Unpublish Selected')}
              </SecondaryButton>
              <SecondaryButton
                size="sm"
                onClick={() => handleBulkAction('updateStock')}
              >
                {t('products.bulkActions.updateStock', 'Update Stock')}
              </SecondaryButton>
              <DangerButton
                size="sm"
                onClick={() => handleBulkAction('delete')}
              >
                {t('products.bulkActions.deleteSelected', 'Delete Selected')}
              </DangerButton>
            </div>
          </div>
        </div>
      )}

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          icon="📦"
          title={searchQuery || statusFilter !== 'ALL' ? t('products.empty.filtered', 'No products found') : t('products.empty.title', 'No products yet')}
          description={
            searchQuery || statusFilter !== 'ALL'
              ? t('products.empty.filteredDesc', 'Try adjusting your search or filter criteria')
              : t('products.empty.description', 'Start by adding your first product to the marketplace')
          }
          actionLabel={searchQuery || statusFilter !== 'ALL' ? t('products.empty.clearFilters', 'Clear Filters') : t('products.empty.action', 'Add Your First Product')}
          onAction={() => {
            if (searchQuery || statusFilter !== 'ALL') {
              setSearchQuery('')
              setStatusFilter('ALL')
            } else {
              setIsFormModalOpen(true)
            }
          }}
        />
      ) : (
        <div className="space-y-4">
          {/* Select All */}
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
              onChange={(e) => {
                if (e.target.checked) {
                  selectAllProducts()
                } else {
                  clearSelection()
                }
              }}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">
              {t('products.selectAll', { count: filteredProducts.length })}
            </span>
          </div>
          
          {/* Products Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                isSelected={selectedProducts.has(product._id)}
                onToggleSelect={() => toggleProductSelection(product._id)}
                onEdit={() => openEditModal(product)}
                onDelete={() => openDeleteConfirm(product)}
                onPublish={() => handlePublishProduct(product)}
                onUpdateInventory={() => openInventoryModal(product)}
                getStatusBadge={getStatusBadge}
              />
            ))}
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        title={editingProduct ? t('products.modals.editProduct', 'Edit Product') : t('products.modals.addProduct', 'Add New Product')}
        size="lg"
      >
        <ProductForm
          product={editingProduct}
          onSubmit={editingProduct ? 
            (data) => handleUpdateProduct(data) : 
            (data) => handleCreateProduct(data)
          }
          onCancel={closeFormModal}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmModal.isOpen}
        onClose={closeDeleteConfirm}
        onConfirm={confirmDelete}
        title={t('products.modals.deleteProduct', 'Delete Product')}
        message={t('products.modals.deleteConfirm', { name: deleteConfirmModal.product?.name })}
        confirmLabel={t('products.card.delete', 'Delete')}
        type="danger"
      />

      {/* Inventory Update Modal */}
      <Modal
        isOpen={inventoryModal.isOpen}
        onClose={() => setInventoryModal({ isOpen: false, product: null })}
        title={t('products.modals.updateInventory', 'Update Inventory')}
        size="sm"
      >
        {inventoryModal.product && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">{getLocalizedText(inventoryModal.product?.name, language) || 'Product Name Not Available'}</h3>
              <p className="text-sm text-gray-600">
                {t('products.modals.currentStock', { stock: inventoryModal.product.stock, unit: inventoryModal.product.unit })}
              </p>
            </div>
            
            <InputField
              label={t('products.modals.newStockQuantity', 'New Stock Quantity')}
              name="newStock"
              type="number"
              min="0"
              value={newStockValue}
              onChange={(e) => setNewStockValue(e.target.value)}
              placeholder={t('products.modals.enterNewStock', 'Enter new stock quantity')}
            />
            
            <div className="flex gap-3 pt-4">
              <SecondaryButton
                onClick={() => setInventoryModal({ isOpen: false, product: null })}
                className="flex-1"
              >
                {t('products.modals.cancel', 'Cancel')}
              </SecondaryButton>
              <PrimaryButton
                onClick={() => {
                  const stock = parseInt(newStockValue)
                  if (!isNaN(stock) && stock >= 0) {
                    handleUpdateInventory(inventoryModal.product!, stock)
                  }
                }}
                className="flex-1"
              >
                {t('products.modals.updateStock', 'Update Stock')}
              </PrimaryButton>
            </div>
          </div>
        )}
      </Modal>

      {/* Bulk Action Confirmation Modal */}
      <Modal
        isOpen={bulkActionModal.isOpen}
        onClose={() => setBulkActionModal({ isOpen: false, action: null })}
        title={t('products.modals.bulkAction', 'Confirm Bulk Action')}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            {t('products.modals.bulkConfirm', { action: bulkActionModal.action, count: selectedProducts.size })}
          </p>
          
          {bulkActionModal.action === 'updateStock' && (
            <InputField
              label={t('products.modals.bulkStockLabel', 'New Stock Quantity')}
              name="bulkStock"
              type="number"
              min="0"
              value={bulkStockValue}
              onChange={(e) => setBulkStockValue(e.target.value)}
              placeholder={t('products.modals.bulkStockPlaceholder', 'Enter stock quantity for all selected products')}
            />
          )}
          
          <div className="flex gap-3 pt-4">
            <SecondaryButton
              onClick={() => setBulkActionModal({ isOpen: false, action: null })}
              className="flex-1"
            >
              {t('products.modals.cancel', 'Cancel')}
            </SecondaryButton>
            <PrimaryButton
              onClick={executeBulkAction}
              className="flex-1"
            >
              {t('products.modals.confirm', 'Confirm')}
            </PrimaryButton>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default FarmerProducts