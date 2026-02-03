import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Layout, LoadingSpinner, ErrorDisplay, Button, CallFarmerButton, LanguageIndicator } from '../components/UI'
import { productService } from '../services/productService'
import { Product } from '../types/api'
import { useAuth } from '../contexts/AuthProvider'
import { useToastContext } from '../contexts/ToastProvider'
import { useI18n, useAppTranslation } from '../contexts/I18nProvider'
import { getLocalizedText, getLanguageIndicator, getLocalizedCategory } from '../utils/multilingual'
import { addToCart, clearCart } from '../store/slices/cartSlice'
import { ShoppingCart, Zap } from 'lucide-react';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user, isAuthenticated } = useAuth()
  const { success: showSuccess, error: showError } = useToastContext()
  const { language } = useI18n()
  const { t } = useAppTranslation('products')
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    if (!id) {
      navigate('/products')
      return
    }

    const loadProduct = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await productService.getProduct(id)
        
        if (response.success && response.data) {
          const productData = response.data
          
          // Validate that the product has the required multilingual structure
          if (!productData.name || typeof productData.name !== 'object') {
            console.warn('Product missing multilingual name structure:', productData)
            // Create a fallback structure if needed
            if (typeof productData.name === 'string') {
              productData.name = { en: productData.name }
            } else {
              productData.name = { en: 'Product Name Not Available' }
            }
          }
          
          if (!productData.description || typeof productData.description !== 'object') {
            console.warn('Product missing multilingual description structure:', productData)
            // Create a fallback structure if needed
            if (typeof productData.description === 'string') {
              productData.description = { en: productData.description }
            } else {
              productData.description = { en: 'Description not available' }
            }
          }
          
          if (!productData.category || typeof productData.category !== 'object') {
            console.warn('Product missing multilingual category structure:', productData)
            // Create a fallback structure if needed
            if (typeof productData.category === 'string') {
              productData.category = { en: productData.category }
            } else {
              productData.category = { en: 'Uncategorized' }
            }
          }
          
          setProduct(productData)
        } else {
          throw new Error(response.message || 'Product not found')
        }
      } catch (err) {
        console.error('Failed to load product:', err)
        setError(err instanceof Error ? err.message : 'Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [id, navigate])

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (user?.role !== 'BUYER') {
      showError((t('errors.buyerOnly') as string) || 'Only buyers can add products to cart')
      return
    }

    if (!product) return

    try {
      setAddingToCart(true)

      // Get localized product name for cart
      const localizedName = getLocalizedText(product.name, language)

      const cartItem = {
        productId: product._id,
        name: localizedName,
        price: product.price,
        unit: product.unit,
        quantity: quantity,
        stock: product.stock,
        image: product.images[0],
        farmerId: product.farmerId
      }

      dispatch(addToCart(cartItem))
      showSuccess((t('cart.added', { quantity, unit: product.unit, name: localizedName }) as string) || `Added ${quantity} ${product.unit} of ${localizedName} to cart!`)
    } catch (err) {
      console.error('Failed to add to cart:', err)
      showError((t('errors.addToCart') as string) || 'Failed to add item to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (user?.role !== 'BUYER') {
      showError((t('errors.buyerOnly') as string) || 'Only buyers can purchase products')
      return
    }

    if (!product) return

    try {
      setAddingToCart(true)

      // Clear cart and add only this item
      dispatch(clearCart())
      
      // Get localized product name for cart
      const localizedName = getLocalizedText(product.name, language)
      
      const cartItem = {
        productId: product._id,
        name: localizedName,
        price: product.price,
        unit: product.unit,
        quantity: quantity,
        stock: product.stock,
        image: product.images[0],
        farmerId: product.farmerId
      }

      dispatch(addToCart(cartItem))
      
      // Navigate directly to checkout
      navigate('/checkout')
    } catch (err) {
      console.error('Failed to buy now:', err)
      showError((t('errors.buyNow') as string) || 'Failed to proceed to checkout')
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ErrorDisplay 
            message={error || ((t('errors.notFound') as string) || 'Product not found')}
            onRetry={() => window.location.reload()}
          />
        </div>
      </Layout>
    )
  }

  const maxQuantity = Math.min(product.stock, 99)
  const isOutOfStock = product.stock === 0
  
  // Get localized content with fallbacks
  const localizedName = getLocalizedText(product?.name, language) || 'Product Name Not Available'
  const localizedDescription = getLocalizedText(product?.description, language) || 'Description not available'
  const localizedCategory = getLocalizedCategory(product?.category, language) || 'Uncategorized'
  
  // Get language indicators for partial translations
  const nameIndicator = getLanguageIndicator(product?.name, language)
  const descriptionIndicator = getLanguageIndicator(product?.description, language)

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link to="/" className={`text-gray-500 hover:text-gray-700 ${language === 'ne' ? 'font-nepali' : ''}`}>
                {(t('breadcrumb.home') as string) || 'Home'}
              </Link>
            </li>
            <li>
              <span className="text-gray-400">/</span>
            </li>
            <li>
              <Link to="/products" className={`text-gray-500 hover:text-gray-700 ${language === 'ne' ? 'font-nepali' : ''}`}>
                {(t('breadcrumb.products') as string) || 'Products'}
              </Link>
            </li>
            <li>
              <span className="text-gray-400">/</span>
            </li>
            <li>
              <span className={`text-gray-900 font-medium truncate ${language === 'ne' ? 'font-nepali' : ''}`}>
                {localizedName}
              </span>
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative bg-gray-200 rounded-lg overflow-hidden h-96">
              <img
                src={product.images[selectedImageIndex] || '/placeholder-product.jpg'}
                alt={localizedName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCA2MEgxMjBWMTAwSDgwVjYwWiIgZmlsbD0iIzlCOUJBMCIvPgo8cGF0aCBkPSJNOTAgODBIMTEwVjEyMEg5MFY4MFoiIGZpbGw9IiM5QjlCQTAiLz4KPC9zdmc+Cg=='
                }}
              />
            </div>

            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      index === selectedImageIndex
                        ? 'border-primary-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${localizedName} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className={`text-3xl font-bold text-gray-900 flex-1 ${language === 'ne' ? 'font-nepali' : ''}`}>
                  {localizedName}
                </h1>
                {nameIndicator.show && nameIndicator.language && (
                  <LanguageIndicator language={nameIndicator.language} size="md" className="ml-4 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center space-x-4 mb-4">
                <span className="text-2xl font-bold text-primary-600">
                  ₨{product.price}/{product.unit}
                </span>
                <span className={`bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-700 ${language === 'ne' ? 'font-nepali' : ''}`}>
                  {localizedCategory}
                </span>
              </div>
              <div className="flex items-start justify-between">
                <p className={`text-gray-600 text-lg leading-relaxed flex-1 ${language === 'ne' ? 'font-nepali' : ''}`}>
                  {localizedDescription}
                </p>
                {descriptionIndicator.show && descriptionIndicator.language && (
                  <LanguageIndicator language={descriptionIndicator.language} size="md" className="ml-4 flex-shrink-0" />
                )}
              </div>
            </div>

            {/* Stock Status */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className={`text-sm font-medium text-gray-700 ${language === 'ne' ? 'font-nepali' : ''}`}>
                  {(t('availability.label') as string) || 'Availability:'}
                </span>
                <span className={`text-sm font-medium ${
                  isOutOfStock ? 'text-red-600' : 'text-green-600'
                } ${language === 'ne' ? 'font-nepali' : ''}`}>
                  {isOutOfStock 
                    ? ((t('availability.outOfStock') as string) || 'Out of Stock')
                    : ((t('availability.inStock', { stock: product.stock, unit: product.unit }) as string) || `${product.stock} ${product.unit} available`)
                  }
                </span>
              </div>

              {/* Quantity Selector */}
              {!isOutOfStock && (
                <div className="flex items-center space-x-4 mb-6">
                  <label htmlFor="quantity" className={`text-sm font-medium text-gray-700 ${language === 'ne' ? 'font-nepali' : ''}`}>
                    {(t('quantity.label') as string) || 'Quantity:'}
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="px-3 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      id="quantity"
                      min="1"
                      max={maxQuantity}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-16 px-2 py-2 text-center border-0 focus:ring-0"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                      disabled={quantity >= maxQuantity}
                      className="px-3 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                  <span className={`text-sm text-gray-500 ${language === 'ne' ? 'font-nepali' : ''}`}>
                    {product.unit}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {!isOutOfStock && (
                  <>
                    <Button
                      onClick={handleAddToCart}
                      variant="primary"
                      size="lg"
                      fullWidth
                      disabled={addingToCart}
                    >
                      {addingToCart ? (
                        <span className="flex items-center gap-2">
                          <LoadingSpinner size="sm" />
                          {(t('buttons.adding') as string) || 'Adding...'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <ShoppingCart className="h-5 w-5" />
                          {(t('buttons.addToCart') as string) || 'Add to Cart'}
                        </span>
                      )}
                    </Button>
                    <Button
                      onClick={handleBuyNow}
                      variant="secondary"
                      size="lg"
                      fullWidth
                      disabled={addingToCart}
                    >
                      {addingToCart ? (
                        <span className="flex items-center gap-2">
                          <LoadingSpinner size="sm" />
                          {(t('buttons.processing') as string) || 'Processing...'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Zap className="h-5 w-5" />
                          {(t('buttons.buyNow') as string) || 'Buy Now'}
                        </span>
                      )}
                    </Button>
                  </>
                )}
                <CallFarmerButton
                  farmerId={product.farmerId}
                  farmerName={product.farmer?.userId?.profile?.name || `Farmer #${product.farmerId.slice(-8)}`}
                  farmerPhone={product.farmer?.userId?.profile?.phone}
                  variant="outline"
                  size="lg"
                  className="w-full"
                />
              </div>
            </div>

            {/* Farmer Info */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className={`text-lg font-semibold text-gray-900 mb-3 ${language === 'ne' ? 'font-nepali' : ''}`}>
                {(t('farmer.title') as string) || 'About the Farmer'}
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  {/* Farmer ID */}
                  <div className="flex items-center justify-between">
                    <span className={`font-medium text-gray-700 ${language === 'ne' ? 'font-nepali' : ''}`}>
                      {(t('farmer.id') as string) || 'Farmer ID:'}
                    </span>
                    <span className={`text-gray-900 ${language === 'ne' ? 'font-nepali' : ''}`}>
                      #{product.farmerId.slice(-8)}
                    </span>
                  </div>

                  {/* Farmer Name */}
                  {product.farmer?.userId?.profile?.name && (
                    <div className="flex items-center justify-between">
                      <span className={`font-medium text-gray-700 ${language === 'ne' ? 'font-nepali' : ''}`}>
                        {(t('farmer.name') as string) || 'Farmer Name:'}
                      </span>
                      <span className={`text-gray-900 ${language === 'ne' ? 'font-nepali' : ''}`}>
                        {product.farmer.userId.profile.name}
                      </span>
                    </div>
                  )}

                  {/* Address */}
                  {(product.farmer?.location || product.farmer?.userId?.profile?.address) && (
                    <div className="flex items-start justify-between">
                      <span className={`font-medium text-gray-700 ${language === 'ne' ? 'font-nepali' : ''}`}>
                        {(t('farmer.address') as string) || 'Address:'}
                      </span>
                      <div className={`text-right text-gray-900 ${language === 'ne' ? 'font-nepali' : ''}`}>
                        {product.farmer?.userId?.profile?.address && (
                          <div>{product.farmer.userId.profile.address}</div>
                        )}
                        {product.farmer?.location && (
                          <div className="text-sm text-gray-600">
                            {product.farmer.location.municipality}, {product.farmer.location.district}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Phone Number */}
                  {product.farmer?.userId?.profile?.phone && (
                    <div className="flex items-center justify-between">
                      <span className={`font-medium text-gray-700 ${language === 'ne' ? 'font-nepali' : ''}`}>
                        {(t('farmer.phone') as string) || 'Phone Number:'}
                      </span>
                      <span className={`text-gray-900 font-mono ${language === 'ne' ? 'font-nepali' : ''}`}>
                        {product.farmer.userId.profile.phone}
                      </span>
                    </div>
                  )}

                  {/* Rating */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <span className={`font-medium text-gray-700 ${language === 'ne' ? 'font-nepali' : ''}`}>
                      {(t('farmer.rating') as string) || 'Rating:'}
                    </span>
                    <div className={`flex items-center text-sm text-gray-600 ${language === 'ne' ? 'font-nepali' : ''}`}>
                      <span className="mr-1">⭐</span>
                      <span>
                        {product.farmer?.rating ? 
                          `${product.farmer.rating.toFixed(1)} (${(t('farmer.reviewsCount', { count: product.farmer.reviewCount }) as string) || `${product.farmer.reviewCount} reviews`})` :
                          ((t('farmer.ratingNote') as string) || 'Rating available after purchase')
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <p className={`text-sm text-gray-600 ${language === 'ne' ? 'font-nepali' : ''}`}>
                    {(t('farmer.description') as string) || 'This product is sold directly by a verified local farmer. Contact them for more information about farming practices, harvest dates, and bulk orders.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className={`text-lg font-semibold text-gray-900 mb-3 ${language === 'ne' ? 'font-nepali' : ''}`}>
                {(t('details.title') as string) || 'Product Details'}
              </h3>
              <dl className="grid grid-cols-1 gap-3">
                <div className="flex justify-between">
                  <dt className={`text-sm text-gray-600 ${language === 'ne' ? 'font-nepali' : ''}`}>
                    {(t('details.category') as string) || 'Category:'}
                  </dt>
                  <dd className={`text-sm font-medium text-gray-900 ${language === 'ne' ? 'font-nepali' : ''}`}>
                    {localizedCategory}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className={`text-sm text-gray-600 ${language === 'ne' ? 'font-nepali' : ''}`}>
                    {(t('details.unit') as string) || 'Unit:'}
                  </dt>
                  <dd className={`text-sm font-medium text-gray-900 ${language === 'ne' ? 'font-nepali' : ''}`}>
                    {product.unit}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className={`text-sm text-gray-600 ${language === 'ne' ? 'font-nepali' : ''}`}>
                    {(t('details.listed') as string) || 'Listed:'}
                  </dt>
                  <dd className={`text-sm font-medium text-gray-900 ${language === 'ne' ? 'font-nepali' : ''}`}>
                    {new Date(product.createdAt).toLocaleDateString()}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className={`text-sm text-gray-600 ${language === 'ne' ? 'font-nepali' : ''}`}>
                    {(t('details.updated') as string) || 'Last Updated:'}
                  </dt>
                  <dd className={`text-sm font-medium text-gray-900 ${language === 'ne' ? 'font-nepali' : ''}`}>
                    {new Date(product.updatedAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        <div className="mt-16 border-t border-gray-200 pt-16">
          <h2 className={`text-2xl font-bold text-gray-900 mb-8 ${language === 'ne' ? 'font-nepali' : ''}`}>
            {(t('related.title') as string) || 'More from this category'}
          </h2>
          <div className="text-center py-8">
            <p className={`text-gray-600 mb-4 ${language === 'ne' ? 'font-nepali' : ''}`}>
              {(t('related.comingSoon') as string) || 'Related products functionality will be implemented in future updates.'}
            </p>
            <Link to="/products" className={`btn-primary ${language === 'ne' ? 'font-nepali' : ''}`}>
              {(t('related.browseAll') as string) || 'Browse All Products'}
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default ProductDetail