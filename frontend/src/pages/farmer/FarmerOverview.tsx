import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { LoadingSpinner, ErrorDisplay, EmptyState, PrimaryButton, SecondaryButton } from '../../components/UI'
import { productService } from '../../services/productService'
import { Product } from '../../types/api'
import { useAuth } from '../../contexts/AuthProvider'
import { useAppTranslation } from '../../contexts/I18nProvider'
import { getLocalizedText } from '../../utils/multilingual'
import { Box, CheckCircle, FileText, DollarSign, Star, AlertTriangle, Clipboard, Package, MessageCircle } from 'lucide-react';

const FarmerOverview: React.FC = () => {
  const { user } = useAuth()
  const { t, language, isReady, isLoading } = useAppTranslation('farmer')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Helper function to ensure translation returns a string
  const getTranslation = useCallback((key: string, fallback: string): string => {
    if (!isReady || isLoading) {
      return fallback; // Return fallback immediately if not ready
    }
    
    const result = t(key, fallback)
    return typeof result === 'string' ? result : fallback
  }, [t, isReady, isLoading])

  // Load farmer's products summary
  const loadProductsSummary = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await productService.getFarmerProducts()
      if (response.success && response.data) {
        setProducts(response.data)
      } else {
        setError(response.message || getTranslation('dashboard.loading', 'Failed to load products'))
      }
    } catch (err) {
      setError(getTranslation('dashboard.loading', 'Failed to load products'))
      console.error('Error loading products:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProductsSummary()
  }, [])

  // Calculate statistics
  const stats = {
    totalProducts: products.length,
    publishedProducts: products.filter(p => p.status === 'PUBLISHED').length,
    draftProducts: products.filter(p => p.status === 'DRAFT').length,
    lowStockProducts: products.filter(p => p.stock <= 10).length,
    totalValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0)
  }

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
        onRetry={loadProductsSummary}
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {getTranslation('dashboard.welcome', 'Welcome back, {{name}}! 👋').replace('{{name}}', user?.profile.name || '')}
        </h1>
        <p className="text-gray-600">
          {getTranslation('dashboard.overview', "Here's an overview of your farming business on the marketplace.")}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Box className="text-green-600 text-lg" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{getTranslation('stats.totalProducts', 'Total Products')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-green-600 text-lg" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{getTranslation('stats.publishedProducts', 'Published')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.publishedProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FileText className="text-yellow-600 text-lg" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{getTranslation('stats.draftProducts', 'Drafts')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.draftProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-purple-600 text-lg" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{getTranslation('stats.inventoryValue', 'Inventory Value')}</p>
              <p className="text-2xl font-bold text-gray-900">${stats.totalValue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{getTranslation('quickActions.title', 'Quick Actions')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/farmer/products">
            <PrimaryButton fullWidth icon={<Package />}>
              {getTranslation('quickActions.manageProducts', 'Manage Products')}
            </PrimaryButton>
          </Link>
          
          <Link to="/farmer/orders">
            <SecondaryButton fullWidth icon={<Clipboard />}>
              {getTranslation('quickActions.viewOrders', 'View Orders')}
            </SecondaryButton>
          </Link>
          
          <Link to="/farmer/messages">
            <SecondaryButton fullWidth icon={<MessageCircle />}>
              {getTranslation('quickActions.messages', 'Messages')}
            </SecondaryButton>
          </Link>
          
          <Link to="/farmer/reviews">
            <SecondaryButton fullWidth icon={<Star />}>
              {getTranslation('quickActions.checkReviews', 'Check Reviews')}
            </SecondaryButton>
          </Link>
        </div>
      </div>

      {/* Recent Products */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{getTranslation('recentProducts.title', 'Recent Products')}</h2>
          <Link 
            to="/farmer/products"
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            {getTranslation('recentProducts.viewAll', 'View All →')}
          </Link>
        </div>

        {products.length === 0 ? (
          <EmptyState
            icon={<Package />}
            title={getTranslation('recentProducts.noProducts', 'No products yet')}
            description={getTranslation('recentProducts.addFirst', 'Start by adding your first product to the marketplace')}
            actionLabel={getTranslation('recentProducts.addFirstAction', 'Add Your First Product')}
            onAction={() => window.location.href = '/farmer/products'}
          />
        ) : (
          <div className="space-y-4">
            {products.slice(0, 5).map((product) => (
              <div
                key={product._id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    {product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={getLocalizedText(product.name, language)}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                       <Package className="text-gray-400 text-lg" />
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900">{getLocalizedText(product.name, language)}</h3>
                    <p className="text-sm text-gray-500">
                      ${product.price}/{product.unit} • {product.stock} {getTranslation('recentProducts.inStock', 'in stock')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    product.status === 'PUBLISHED' 
                      ? 'bg-green-100 text-green-800'
                      : product.status === 'DRAFT'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {getTranslation(`products.status.${product.status.toLowerCase()}`, product.status)}
                  </span>
                  
                  {product.stock <= 10 && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                      {getTranslation('recentProducts.lowStock', 'Low Stock')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alerts */}
      {stats.lowStockProducts > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="text-yellow-400 text-xl" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                {getTranslation('alerts.lowStock.title', 'Low Stock Alert')}
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                {getTranslation('alerts.lowStock.message', 'You have {{count}} product{{count, plural, one {} other {s}}} with low stock (10 or fewer units).').replace('{{count}}', stats.lowStockProducts.toString())}
                <Link 
                  to="/farmer/products" 
                  className="font-medium underline ml-1"
                >
                  {getTranslation('alerts.lowStock.action', 'Update inventory →')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FarmerOverview
