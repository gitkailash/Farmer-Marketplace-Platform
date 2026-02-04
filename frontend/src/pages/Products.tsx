import React, { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Layout, LoadingSpinner, ErrorDisplay, EmptyState, LanguageIndicator } from '../components/UI'
import { productService, type ProductFilters } from '../services/productService'
import { Product } from '../types/api'
import { useI18n, useAppTranslation } from '../contexts/I18nProvider'
import { getLocalizedText, getLanguageIndicator, getLocalizedCategory } from '../utils/multilingual'

const CATEGORIES = [
  'All',
  'Vegetables',
  'Fruits',
  'Grains',
  'Dairy',
  'Meat',
  'Herbs',
  'Spices',
  'Nuts',
  'Seeds',
  'Other'
]

const Products: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  })

  const { language } = useI18n()
  const { t } = useAppTranslation('products')

  // Filter state
  const [filters, setFilters] = useState<ProductFilters>({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    status: 'PUBLISHED'
  })

  const loadProducts = useCallback(async (page = 1) => {
    try {
      setLoading(true)
      setError(null)

      const response = await productService.getProducts(filters, page, pagination.limit)
      
      if (response.success && response.data) {
        setProducts(response.data)
        setPagination(response.pagination || pagination)
      } else {
        throw new Error(response.message || 'Failed to load products')
      }
    } catch (err) {
      console.error('Failed to load products:', err)
      setError(err instanceof Error ? err.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [filters, pagination.limit])

  // Load products when filters change
  useEffect(() => {
    loadProducts(1)
  }, [filters])

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (filters.search) params.set('search', filters.search)
    if (filters.category && filters.category !== 'All') params.set('category', filters.category)
    if (filters.minPrice) params.set('minPrice', filters.minPrice.toString())
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString())
    
    setSearchParams(params)
  }, [filters, setSearchParams])

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }))
  }

  const handleCategoryChange = (category: string) => {
    setFilters(prev => ({ 
      ...prev, 
      category: category === 'All' ? '' : category 
    }))
  }

  const handlePriceFilterChange = (minPrice?: number, maxPrice?: number) => {
    setFilters(prev => ({ ...prev, minPrice, maxPrice }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      minPrice: undefined,
      maxPrice: undefined,
      status: 'PUBLISHED'
    })
  }

  const handlePageChange = (page: number) => {
    loadProducts(page)
    setPagination(prev => ({ ...prev, page }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading && products.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold text-gray-900 mb-2 ${language === 'ne' ? 'font-nepali' : ''}`}>
            {(t('title') as string) || 'Explore Products'}
          </h1>
          <p className={`text-gray-600 ${language === 'ne' ? 'font-nepali' : ''}`}>
            {(t('subtitle') as string) || 'Discover fresh produce from local farmers'}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          {/* Search Bar */}
          <div className="mb-6">
            <label htmlFor="search" className={`block text-sm font-medium text-gray-700 mb-2 ${language === 'ne' ? 'font-nepali' : ''}`}>
              {(t('search.label') as string) || 'Search Products'}
            </label>
            <div className="relative">
              <input
                type="text"
                id="search"
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={(t('search.placeholder') as string) || 'Search by product name or description...'}
                className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg ${language === 'ne' ? 'font-nepali' : ''}`}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 text-xl">🔍</span>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="mb-6">
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${language === 'ne' ? 'font-nepali' : ''}`}>
              {(t('category.label') as string) || 'Category'}
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${language === 'ne' ? 'font-nepali' : ''} ${
                    (category === 'All' && !filters.category) || filters.category === category
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {language === 'ne' ? ((t(`categories.${category.toLowerCase()}`) as string) || category) : category}
                </button>
              ))}
            </div>
          </div>

          {/* Price Filter */}
          {/* <div className="mb-6">
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${language === 'ne' ? 'font-nepali' : ''}`}>
              {(t('price.label') as string) || 'Price Range'}
            </label>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="number"
                  placeholder={(t('price.minPlaceholder') as string) || 'Min price'}
                  value={filters.minPrice || ''}
                  onChange={(e) => handlePriceFilterChange(
                    e.target.value ? Number(e.target.value) : undefined,
                    filters.maxPrice
                  )}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${language === 'ne' ? 'font-nepali' : ''}`}
                />
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  placeholder={(t('price.maxPlaceholder') as string) || 'Max price'}
                  value={filters.maxPrice || ''}
                  onChange={(e) => handlePriceFilterChange(
                    filters.minPrice,
                    e.target.value ? Number(e.target.value) : undefined
                  )}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${language === 'ne' ? 'font-nepali' : ''}`}
                />
              </div>
            </div>
          </div> */}

          {/* Clear Filters */}
          <div className="flex justify-between items-center">
            <button
              onClick={clearFilters}
              className={`text-sm text-gray-500 hover:text-gray-700 ${language === 'ne' ? 'font-nepali' : ''}`}
            >
              {(t('filters.clear') as string) || 'Clear all filters'}
            </button>
            <div className={`text-sm text-gray-500 ${language === 'ne' ? 'font-nepali' : ''}`}>
              {(t('results.count', { count: pagination.total }) as string) || `${pagination.total} products found`}
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <ErrorDisplay 
            message={error}
            onRetry={() => loadProducts(pagination.page)}
            className="mb-8"
          />
        )}

        {/* Products Grid */}
        {products.length === 0 && !loading ? (
          <EmptyState
            icon="🛒"
            title={(t('empty.title') as string) || 'No products found'}
            description={(t('empty.description') as string) || 'Try adjusting your search criteria or browse different categories.'}
            onAction={clearFilters}
            actionLabel={(t('empty.action') as string) || 'Clear Filters'}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {/* Loading more products */}
            {loading && products.length > 0 && (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className={`px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${language === 'ne' ? 'font-nepali' : ''}`}
                >
                  {(t('pagination.previous') as string) || 'Previous'}
                </button>
                
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg ${
                      page === pagination.page
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className={`px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${language === 'ne' ? 'font-nepali' : ''}`}
                >
                  {(t('pagination.next') as string) || 'Next'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

// Product Card Component
interface ProductCardProps {
  product: Product
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { language } = useI18n()
  
  // Get localized content with fallbacks
  const localizedName = getLocalizedText(product?.name, language) || 'Product Name Not Available'
  const localizedDescription = getLocalizedText(product?.description, language) || 'Description not available'
  const localizedCategory = getLocalizedCategory(product?.category, language) || 'Uncategorized'
  
  // Get language indicators for partial translations
  const nameIndicator = getLanguageIndicator(product?.name, language)
  const descriptionIndicator = getLanguageIndicator(product?.description, language)

  return (
    <Link
      to={`/products/${product._id}`}
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 group"
    >
      <div className="relative bg-gray-200 h-48 overflow-hidden">
        <img
          src={product.images[0] || '/placeholder-product.jpg'}
          alt={localizedName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCA2MEgxMjBWMTAwSDgwVjYwWiIgZmlsbD0iIzlCOUJBMCIvPgo8cGF0aCBkPSJNOTAgODBIMTEwVjEyMEg5MFY4MFoiIGZpbGw9IiM5QjlCQTAiLz4KPC9zdmc+Cg=='
          }}
        />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <h3 className={`font-semibold text-gray-900 truncate flex-1 ${language === 'ne' ? 'font-nepali' : ''}`}>
            {localizedName}
          </h3>
          {nameIndicator.show && nameIndicator.language && (
            <LanguageIndicator language={nameIndicator.language} size="sm" className="ml-2 flex-shrink-0" />
          )}
        </div>
        
        <div className="flex items-start justify-between mb-2">
          <p className={`text-sm text-gray-600 overflow-hidden flex-1 ${language === 'ne' ? 'font-nepali' : ''}`} 
             style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {localizedDescription}
          </p>
          {descriptionIndicator.show && descriptionIndicator.language && (
            <LanguageIndicator language={descriptionIndicator.language} size="sm" className="ml-2 flex-shrink-0" />
          )}
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-bold text-primary-600">
            ₨{product.price}/{product.unit}
          </span>
          <span className="text-sm text-gray-500">
            Stock: {product.stock}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span className={`bg-gray-100 px-2 py-1 rounded-full text-xs ${language === 'ne' ? 'font-nepali' : ''}`}>
            {localizedCategory}
          </span>
          <span>
            by {product.farmer?.userId?.profile?.name || `Farmer #${product.farmerId.slice(-8)}`}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default Products