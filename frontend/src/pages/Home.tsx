import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/UI'
import { Gallery, type GalleryItem } from '../components/Gallery'
import { MayorMessage, type MayorMessageData } from '../components/MayorMessage'
import { NewsTicker, type NewsItem } from '../components/NewsTicker'

import { 
  galleryService, 
  mayorService, 
  newsService, 
  featuredProductsService,
  type Product 
} from '../services/contentService'
import { useAuth } from '../contexts/AuthProvider'
import { useAppTranslation } from '../contexts/I18nProvider'
import { getLocalizedText } from '../utils/multilingual'
import { ShoppingCart, AlertTriangle, HomeIcon, Star, Tractor, Leaf, Headphones, Mail, Phone, MessageCircle, Download, Users, TrendingUp, Calendar, User, ArrowRight, ChevronRight} from 'lucide-react';


const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuth()
  const { t, isReady, isLoading } = useAppTranslation('home')
  const { language } = useAppTranslation('common')

  // Helper function to ensure translation returns a string
  const getTranslation = useCallback((key: string, fallback: string): string => {
    if (!isReady || isLoading) {
      return fallback; // Return fallback immediately if not ready
    }
    
    const result = t(key, fallback)
    return typeof result === 'string' ? result : fallback
  }, [t, isReady, isLoading])
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])
  const [mayorMessage, setMayorMessage] = useState<MayorMessageData | null>(null)
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load all content in parallel with user's language preference
        const [gallery, mayor, news, products] = await Promise.all([
          galleryService.getActiveItems(language),
          mayorService.getActiveMessage(language),
          newsService.getActiveNews(language),
          featuredProductsService.getFeaturedProducts(8)
        ])

        setGalleryItems(gallery)
        setMayorMessage(mayor)
        setNewsItems(news)
        setFeaturedProducts(products)
      } catch (err) {
        console.error('Failed to load homepage content:', err)
        setError('Failed to load content. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    loadContent()
  }, [language]) // Re-load content when language changes

  const handleNewsClick = (item: NewsItem) => {
    // Handle news item click - could navigate to full article page
    console.log('News item clicked:', item)
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('messages.loading')}</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">
              <AlertTriangle size={24} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('messages.error')}</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              {t('ui.retry')}
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout className="bg-gray-50">
      {/* News Ticker - Fixed right after header */}
      <NewsTicker 
        items={newsItems}
        onHeadlineClick={handleNewsClick}
        className="fixed top-10 sm:top-0 left-0 right-0 z-40"
      />

      {/* Mayor Message - Fixed right after news ticker */}
      <MayorMessage 
        message={mayorMessage}
        className="fixed top-0 sm:top-0 left-0 right-0 z-30"
      />

      {/* Main Content */}
      <div className="pt-0"> {/* Reduced top padding */}

        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-green-600 to-green-800 py-8 sm:py-12">
          {/* Background Image Overlay */}
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Side - Nepal Government/Gaupalika Logo */}
              <div className="lg:col-span-3 flex justify-center lg:justify-start">
                <div className="group relative">
                  {/* Decorative background glow */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400/20 to-red-400/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                  
                  <div className="relative bg-white/15 backdrop-blur-lg rounded-2xl p-8 sm:p-10 lg:p-12 border-2 border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
                    <div className="text-center">
                      <div className="mb-3 relative">
                        <img
                          src="https://gorkhamun.gov.np/sites/gorkhamun.gov.np/files/field/image/87529732_202672434266258_451609600651689984_n.jpg"
                          alt="Nepal Government - Gaupalika"
                          className="w-full h-full object-cover rounded-xl"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            // Enhanced fallback with Nepal emblem design
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9Ijc1IiBjeT0iNzUiIHI9IjcwIiBmaWxsPSIjRkZGRkZGIiBzdHJva2U9IiNEQzE0M0MiIHN0cm9rZS13aWR0aD0iNCIvPgo8Y2lyY2xlIGN4PSI3NSIgY3k9Ijc1IiByPSI1NSIgZmlsbD0iI0RDMTQzQyIvPgo8cG9seWdvbiBwb2ludHM9Ijc1LDM11LDU1IDEwNSw1NSA5MCw3MCA5NSw5MCA3NSw4MCA1NSw5MCA2MCw3MCA0NSw1NSA2NSw1NSIgZmlsbD0iI0ZGRkZGRiIvPgo8Y2lyY2xlIGN4PSI3NSIgY3k9IjEwNSIgcj0iOCIgZmlsbD0iI0ZGRkZGRiIvPgo8dGV4dCB4PSI3NSIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjRENFNDNDIj5HQVVQQU1JS0E8L3RleHQ+Cjwvc3ZnPg=='
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-white text-sm sm:text-base font-bold tracking-wide">
                          🏛️ GAUPALIKA
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Center - Main Content */}
              <div className="lg:col-span-6 text-center text-white px-4">
                <div className="flex justify-center mb-6">
                  <div className="bg-white bg-opacity-20 rounded-full p-4 shadow-lg">
                    <Tractor className="w-14 h-14 sm:w-16 sm:h-16 text-white" />
                  </div>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-tight">
                  {getTranslation('hero.title', 'Farmer Marketplace')}
                </h1>
                <p className="text-lg sm:text-xl lg:text-2xl mb-8 max-w-2xl mx-auto opacity-90 leading-relaxed">
                  {getTranslation('hero.subtitle', 'Connect farmers directly with buyers for fresh, quality produce at fair prices.')}
                </p>
                
                {/* Call-to-Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  {!isAuthenticated ? (
                    <>
                      <Link 
                        to="/products" 
                        className="bg-white text-green-600 hover:bg-gray-100 w-full sm:w-auto text-center px-8 py-4 text-lg font-semibold rounded-full transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <ShoppingCart className="w-5 h-5 mr-2 inline" /> {getTranslation('hero.exploreProducts', 'Explore Products')}
                      </Link>
                      <Link 
                        to="/register" 
                        className="border-2 border-white text-white hover:bg-white hover:text-green-600 w-full sm:w-auto text-center px-8 py-4 text-lg font-semibold rounded-full transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <Leaf className="w-5 h-5 mr-2 inline" /> {getTranslation('hero.joinAsFarmer', 'Join as Farmer')}
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link 
                        to="/dashboard" 
                        className="bg-white text-green-600 hover:bg-gray-100 w-full sm:w-auto text-center px-8 py-4 text-lg font-semibold rounded-full transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                         <HomeIcon className="w-5 h-5 mr-2 inline" /> {t('navigation.dashboard')}
                      </Link>
                      {user?.role === 'BUYER' && (
                        <Link 
                          to="/products" 
                          className="border-2 border-white text-white hover:bg-white hover:text-green-600 w-full sm:w-auto text-center px-8 py-4 text-lg font-semibold rounded-full transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <ShoppingCart className="w-5 h-5 mr-2 inline" /> {t('navigation.products')}
                        </Link>
                      )}
                      {user?.role === 'FARMER' && (
                        <Link 
                          to="/farmer/products" 
                          className="border-2 border-white text-white hover:bg-white hover:text-green-600 w-full sm:w-auto text-center px-8 py-4 text-lg font-semibold rounded-full transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <Tractor className="w-5 h-5 mr-2 inline" /> {t('navigation.products')}
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Right Side - Mayor Image */}
              <div className="lg:col-span-3 flex justify-center lg:justify-end">
                <div className="group relative">
                  {/* Decorative background glow */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                  
                  <div className="relative bg-white/15 backdrop-blur-lg rounded-2xl p-8 sm:p-10 lg:p-12 border-2 border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
                    <div className="text-center">
                      <div className="mb-3 relative">
                        {mayorMessage?.imageUrl ? (
                          <img
                            src={mayorMessage.imageUrl}
                            alt="Mayor"
                            className="w-full h-full object-cover rounded-xl"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              // Simple fallback
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjUwIiByPSIyMCIgZmlsbD0iIzYzNjZGMSIvPgo8cGF0aCBkPSJNNzAgOTBjMC0xNSAxMy0yNSAzMC0yNXMzMCAxMCAzMCAyNSIgZmlsbD0iIzYzNjZGMSIvPgo8dGV4dCB4PSIxMDAiIHk9IjEzMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzYzNjZGMSI+TUFZT1I8L3RleHQ+Cjwvc3ZnPg=='
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-400/30 to-purple-400/30 flex items-center justify-center rounded-xl">
                            <User className="w-16 h-16 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-white text-sm sm:text-base font-bold tracking-wide">
                          MAYOR
                        </h3>
                        <p className="text-white/70 text-xs sm:text-sm">
                          Kathaari Gaupalika
                        </p>

                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products Section */}
        {featuredProducts.length > 0 && (
          <section className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                  {getTranslation('products.featured', 'Featured Products')}
                </h2>
                <p className="text-gray-600">
                  {getTranslation('products.featuredSubtitle', 'Fresh from local farmers to your table')}
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {featuredProducts.map((product) => (
                  <Link 
                    key={product._id}
                    to={`/products/${product._id}`}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 block cursor-pointer"
                  >
                    <div className="aspect-w-1 aspect-h-1 bg-gray-200">
                      <img
                        src={product.images[0] || '/placeholder-product.jpg'}
                        alt={getLocalizedText(product.name, language)}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCA2MEgxMjBWMTAwSDgwVjYwWiIgZmlsbD0iIzlCOUJBMCIvPgo8cGF0aCBkPSJNOTAgODBIMTEwVjEyMEg5MFY4MFoiIGZpbGw9IiM5QjlCQTAiLz4KPC9zdmc+Cg=='
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1 truncate">
                        {getLocalizedText(product.name, language)}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {getLocalizedText(product.description, language)}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary-600">
                          ${product.price}/{product.unit}
                        </span>
                        <div className="flex items-center text-sm text-gray-500">
                          <Star className="w-4 h-4 mr-1" />
                          <span>{product.farmer?.rating?.toFixed(1) || '0.0'}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        by {product.farmer?.userId?.profile?.name || 'Unknown Farmer'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              
              <div className="text-center">
                <Link 
                  to="/products" 
                  className="btn-primary inline-block px-8 py-3"
                >
                  {getTranslation('products.viewAll', 'View All Products')}
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Featured Categories Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                {getTranslation('categories.title', 'Shop by Category')}
              </h2>
              <p className="text-xl text-gray-600">
                {getTranslation('categories.subtitle', 'Fresh products directly from local farmers')}
              </p>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6 text-center">
                <div className="text-6xl mb-4">🥬</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{getTranslation('categories.vegetables.title', 'Vegetables & Fruits')}</h3>
                <p className="text-gray-600 text-sm mb-4">{getTranslation('categories.vegetables.description', 'Fresh seasonal produce')}</p>
                <Link to="/products?category=Vegetables" className="text-green-600 hover:text-green-700 font-medium">
                  {getTranslation('categories.browse', 'Browse')} <ChevronRight className="w-4 h-4 inline ml-1" />
                </Link>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6 text-center">
                <div className="text-6xl mb-4">🥛</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{getTranslation('categories.dairy.title', 'Dairy Products')}</h3>
                <p className="text-gray-600 text-sm mb-4">{getTranslation('categories.dairy.description', 'Fresh milk, cheese & more')}</p>
                <Link to="/products?category=Dairy" className="text-green-600 hover:text-green-700 font-medium">
                  {getTranslation('categories.browse', 'Browse')} <ChevronRight className="w-4 h-4 inline ml-1" />
                </Link>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6 text-center">
                <div className="text-6xl mb-4">🌾</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{getTranslation('categories.grains.title', 'Grains & Cereals')}</h3>
                <p className="text-gray-600 text-sm mb-4">{getTranslation('categories.grains.description', 'Rice, wheat, lentils')}</p>
                <Link to="/products?category=Grains" className="text-green-600 hover:text-green-700 font-medium">
                  {getTranslation('categories.browse', 'Browse')} <ChevronRight className="w-4 h-4 inline ml-1" />
                </Link>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6 text-center">
                <div className="text-6xl mb-4">🌿</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{getTranslation('categories.organic.title', 'Organic Products')}</h3>
                <p className="text-gray-600 text-sm mb-4">{getTranslation('categories.organic.description', 'Certified organic items')}</p>
                <Link to="/products?category=Other" className="text-green-600 hover:text-green-700 font-medium">
                  {getTranslation('categories.browse', 'Browse')} <ChevronRight className="w-4 h-4 inline ml-1" />
                </Link>
              </div>
            </div>
            
            {/* Additional Categories Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6 text-center">
                <div className="text-6xl mb-4">🌶️</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{getTranslation('categories.spices.title', 'Spices & Seasonings')}</h3>
                <p className="text-gray-600 text-sm mb-4">{getTranslation('categories.spices.description', 'Aromatic spices and seasonings')}</p>
                <Link to="/products?category=Spices" className="text-green-600 hover:text-green-700 font-medium">
                  {getTranslation('categories.browse', 'Browse')} <ChevronRight className="w-4 h-4 inline ml-1" />
                </Link>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6 text-center">
                <div className="text-6xl mb-4">🥜</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{getTranslation('categories.nuts.title', 'Nuts & Dry Fruits')}</h3>
                <p className="text-gray-600 text-sm mb-4">{getTranslation('categories.nuts.description', 'Premium nuts and dried fruits')}</p>
                <Link to="/products?category=Nuts" className="text-green-600 hover:text-green-700 font-medium">
                  {getTranslation('categories.browse', 'Browse')} <ChevronRight className="w-4 h-4 inline ml-1" />
                </Link>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6 text-center">
                <div className="text-6xl mb-4">🌱</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{getTranslation('categories.seeds.title', 'Seeds & Grains')}</h3>
                <p className="text-gray-600 text-sm mb-4">{getTranslation('categories.seeds.description', 'Quality seeds for planting and consumption')}</p>
                <Link to="/products?category=Seeds" className="text-green-600 hover:text-green-700 font-medium">
                  {getTranslation('categories.browse', 'Browse')} <ChevronRight className="w-4 h-4 inline ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                {getTranslation('gallery.title', 'Featured Gallery')}
              </h2>
              <p className="text-gray-600">
                {getTranslation('gallery.subtitle', 'Discover the beauty of local farming and fresh produce')}
              </p>
            </div>
            
            <Gallery 
              items={galleryItems}
              autoScrollSpeed={50}
              className="mb-8"
            />
          </div>
        </section>

        {/* Featured Categories Section */}
        

        {/* Statistics Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                {getTranslation('statistics.title', 'Market Impact')}
              </h2>
              <p className="text-xl text-gray-600">
                {getTranslation('statistics.subtitle', 'Growing together with our farming community')}
              </p>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">500+</div>
                <div className="text-gray-600">{getTranslation('statistics.activeFarmers', 'Active Farmers')}</div>
              </div>
              
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">2,000+</div>
                <div className="text-gray-600">{getTranslation('statistics.happyCustomers', 'Happy Customers')}</div>
              </div>
              
              <div className="text-center">
                <div className="bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-yellow-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">10,000+</div>
                <div className="text-gray-600">{getTranslation('statistics.productsSold', 'Products Sold')}</div>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">95%</div>
                <div className="text-gray-600">{getTranslation('statistics.customerSatisfaction', 'Customer Satisfaction')}</div>
              </div>
            </div>
          </div>
        </section>

        

        {/* Success Stories/Testimonials Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                {getTranslation('testimonials.title', 'Success Stories')}
              </h2>
              <p className="text-xl text-gray-600">
                {getTranslation('testimonials.subtitle', 'What our farmers and customers say about us')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Customer Testimonial */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    S
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900">{getTranslation('testimonials.customer1.name', 'Sita Sharma')}</h4>
                    <p className="text-gray-600 text-sm">{getTranslation('testimonials.customer1.location', 'Customer from Kathmandu')}</p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700">
                  "{getTranslation('testimonials.customer1.review', 'Fresh vegetables delivered right to my door! The quality is amazing and prices are very reasonable. Highly recommended!')}"
                </p>
              </div>
              
              {/* Farmer Success Story */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                    R
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900">{getTranslation('testimonials.farmer1.name', 'Ram Bahadur')}</h4>
                    <p className="text-gray-600 text-sm">{getTranslation('testimonials.farmer1.location', 'Farmer from Chitwan')}</p>
                  </div>
                </div>
                <div className="bg-green-100 rounded-lg p-3 mb-4">
                  <p className="text-green-800 font-semibold">{getTranslation('testimonials.incomeIncrease', 'Income increased by 40%')}</p>
                </div>
                <p className="text-gray-700">
                  "{getTranslation('testimonials.farmer1.review', 'Since joining this platform, I can sell directly to customers. No middleman, better prices, and steady income!')}"
                </p>
              </div>
              
              {/* Another Customer */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    A
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900">{getTranslation('testimonials.customer2.name', 'Anita Poudel')}</h4>
                    <p className="text-gray-600 text-sm">{getTranslation('testimonials.customer2.location', 'Customer from Pokhara')}</p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700">
                  "{getTranslation('testimonials.customer2.review', 'Love supporting local farmers! The app is easy to use and delivery is always on time. Great service!')}"
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Latest News/Blog Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                {getTranslation('news.title', 'Latest News & Updates')}
              </h2>
              <p className="text-xl text-gray-600">
                {getTranslation('news.subtitle', 'Stay informed about farming tips, market trends, and agricultural innovations')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Featured Article */}
              <div className="lg:col-span-2">
                <article className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                  <div className="aspect-w-16 aspect-h-9 bg-gradient-to-r from-green-400 to-green-600">
                    <div className="flex items-center justify-center text-white text-6xl">
                      🌾
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>January 10, 2025</span>
                      <span className="mx-2">•</span>
                      <User className="w-4 h-4 mr-2" />
                      <span>Agricultural Expert</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      Winter Farming: Best Practices for Cold Season Crops
                    </h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      Discover the most effective techniques for growing vegetables during winter months. 
                      Learn about soil preparation, crop selection, and protection methods that can help 
                      farmers maximize their yield even in challenging weather conditions.
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          Farming Tips
                        </span>
                        <span className="text-gray-500 text-sm">5 min read</span>
                      </div>
                      <Link to="/blog/winter-farming-practices" className="text-green-600 hover:text-green-700 font-medium flex items-center">
                        Read More <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    </div>
                  </div>
                </article>
              </div>

              {/* Side Articles */}
              <div className="space-y-6">
                {/* Article 1 */}
                <article className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                  <div className="aspect-w-16 aspect-h-9 bg-gradient-to-r from-blue-400 to-blue-600">
                    <div className="flex items-center justify-center text-white text-4xl">
                      📈
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center text-xs text-gray-500 mb-2">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>January 8, 2025</span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Market Prices: Vegetable Rates This Week
                    </h4>
                    <p className="text-gray-600 text-sm mb-3">
                      Weekly update on current market prices for major vegetables and seasonal produce.
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        Market Update
                      </span>
                      <Link to="/blog/weekly-market-prices" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        View Prices
                      </Link>
                    </div>
                  </div>
                </article>

                {/* Article 2 */}
                <article className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                  <div className="aspect-w-16 aspect-h-9 bg-gradient-to-r from-purple-400 to-purple-600">
                    <div className="flex items-center justify-center text-white text-4xl">
                      🌱
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center text-xs text-gray-500 mb-2">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>January 5, 2025</span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Organic Farming: Getting Started Guide
                    </h4>
                    <p className="text-gray-600 text-sm mb-3">
                      Complete beginner's guide to transitioning from conventional to organic farming methods.
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                        Organic
                      </span>
                      <Link to="/blog/organic-farming-guide" className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                        Learn More
                      </Link>
                    </div>
                  </div>
                </article>
              </div>
            </div>

            {/* Additional News Items */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* News Item 1 */}
              <article className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="text-3xl mb-4">🚜</div>
                <div className="flex items-center text-xs text-gray-500 mb-2">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span>January 3, 2025</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  New Agricultural Technology Trends
                </h4>
                <p className="text-gray-600 text-sm mb-3">
                  Explore the latest farming technologies that are revolutionizing agriculture.
                </p>
                <Link to="/blog/agri-tech-trends" className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center">
                  Read Article <ChevronRight className="w-3 h-3 ml-1" />
                </Link>
              </article>

              {/* News Item 2 */}
              <article className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="text-3xl mb-4">💧</div>
                <div className="flex items-center text-xs text-gray-500 mb-2">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span>December 30, 2024</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Water Conservation in Farming
                </h4>
                <p className="text-gray-600 text-sm mb-3">
                  Effective irrigation techniques to save water and improve crop yield.
                </p>
                <Link to="/blog/water-conservation" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
                  Learn More <ChevronRight className="w-3 h-3 ml-1" />
                </Link>
              </article>

              {/* News Item 3 */}
              <article className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="text-3xl mb-4">🌿</div>
                <div className="flex items-center text-xs text-gray-500 mb-2">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span>December 28, 2024</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Pest Control: Natural Methods
                </h4>
                <p className="text-gray-600 text-sm mb-3">
                  Chemical-free approaches to protect your crops from common pests.
                </p>
                <Link to="/blog/natural-pest-control" className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center">
                  Discover <ChevronRight className="w-3 h-3 ml-1" />
                </Link>
              </article>

              {/* News Item 4 */}
              <article className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="text-3xl mb-4">📊</div>
                <div className="flex items-center text-xs text-gray-500 mb-2">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span>December 25, 2024</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Seasonal Crop Planning Guide
                </h4>
                <p className="text-gray-600 text-sm mb-3">
                  Plan your crops according to seasons for maximum profitability.
                </p>
                <Link to="/blog/seasonal-crop-planning" className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center">
                  Plan Now <ChevronRight className="w-3 h-3 ml-1" />
                </Link>
              </article>
            </div>

            {/* View All Blog Posts Button */}
            <div className="text-center mt-12">
              <Link 
                to="/blog" 
                className="inline-flex items-center bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                View All Articles
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>

            
          </div>
        </section>

        {/* Mobile App Promotion Section */}
        <section className="py-16 bg-gradient-to-r from-green-600 to-green-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="text-white">
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                  {getTranslation('mobileApp.title', 'Get Our Mobile App')}
                </h2>
                <p className="text-xl mb-8 opacity-90">
                  {getTranslation('mobileApp.subtitle', 'Shop on the go with our mobile app. Available for iOS and Android devices.')}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <button className="bg-black text-white px-6 py-3 rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors">
                    <Download className="w-6 h-6 mr-3" />
                    <div className="text-left">
                      <div className="text-xs">{getTranslation('mobileApp.downloadOn', 'Download on the')}</div>
                      <div className="text-lg font-semibold">{getTranslation('mobileApp.appStore', 'App Store')}</div>
                    </div>
                  </button>
                  
                  <button className="bg-black text-white px-6 py-3 rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors">
                    <Download className="w-6 h-6 mr-3" />
                    <div className="text-left">
                      <div className="text-xs">{getTranslation('mobileApp.getItOn', 'Get it on')}</div>
                      <div className="text-lg font-semibold">{getTranslation('mobileApp.googlePlay', 'Google Play')}</div>
                    </div>
                  </button>
                </div>
                
                <div className="bg-white bg-opacity-20 rounded-lg p-4 inline-block">
                  <p className="text-sm mb-2">{getTranslation('mobileApp.scanQR', 'Scan QR Code to Download')}</p>
                  <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center">
                    <div className="text-4xl">📱</div>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-8xl mb-4">📱</div>
                <h3 className="text-2xl font-semibold text-white mb-4">
                  {getTranslation('mobileApp.features.title', 'Features in Mobile App')}
                </h3>
                <ul className="text-white space-y-2">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                    {getTranslation('mobileApp.features.easyBrowsing', 'Easy product browsing')}
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                    {getTranslation('mobileApp.features.oneClickOrdering', 'One-click ordering')}
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                    {getTranslation('mobileApp.features.orderTracking', 'Real-time order tracking')}
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                    {getTranslation('mobileApp.features.notifications', 'Push notifications')}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Service Areas Section */}
        {/* <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Service Areas
              </h2>
              <p className="text-xl text-gray-600">
                Currently serving these areas with plans to expand
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="bg-white rounded-xl p-8 shadow-sm">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-6">Current Service Areas</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-gray-700">Kathmandu</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-gray-700">Pokhara</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-gray-700">Chitwan</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-gray-700">Lalitpur</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-gray-700">Bhaktapur</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-gray-700">Butwal</span>
                    </div>
                  </div>
                  
                  <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Coming Soon</h4>
                    <p className="text-blue-700 text-sm">
                      Expanding to Dharan, Biratnagar, Nepalgunj, and more cities. 
                      <Link to="/notify" className="underline ml-1">Get notified</Link>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-8xl mb-6">🗺️</div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  Growing Across Nepal
                </h3>
                <p className="text-gray-600 mb-6">
                  We're expanding our network to serve more farmers and customers across the country.
                </p>
                <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
                  Request Service in Your Area
                </button>
              </div>
            </div>
          </div>
        </section> */}

        {/* Special Offers Section */}
        {/* <section className="py-16 bg-yellow-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Special Offers
              </h2>
              <p className="text-xl text-gray-600">
                Save more on fresh produce with our current deals
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-yellow-200">
                <div className="text-center">
                  <div className="text-4xl mb-4">🎁</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">First Order Discount</h3>
                  <div className="text-3xl font-bold text-yellow-600 mb-4">20% OFF</div>
                  <p className="text-gray-600 mb-4">Get 20% off on your first order. Use code: WELCOME20</p>
                  <button className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600 transition-colors">
                    Claim Offer
                  </button>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-green-200">
                <div className="text-center">
                  <div className="text-4xl mb-4">🌱</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Seasonal Special</h3>
                  <div className="text-3xl font-bold text-green-600 mb-4">Buy 2 Get 1</div>
                  <p className="text-gray-600 mb-4">On all seasonal vegetables. Limited time offer!</p>
                  <button className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors">
                    Shop Now
                  </button>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-blue-200">
                <div className="text-center">
                  <div className="text-4xl mb-4">📦</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Bulk Orders</h3>
                  <div className="text-3xl font-bold text-blue-600 mb-4">15% OFF</div>
                  <p className="text-gray-600 mb-4">Orders above Rs. 2000 get 15% discount automatically</p>
                  <button className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                    Order Bulk
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section> */}

        {/* Contact/Support Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                {getTranslation('contact.title', 'Need Help?')}
              </h2>
              <p className="text-xl text-gray-600">
                {getTranslation('contact.subtitle', 'We\'re here to support you every step of the way')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{getTranslation('contact.callUs.title', 'Call Us')}</h3>
                <p className="text-gray-600 mb-2">{getTranslation('contact.callUs.phone', '+977-1-4567890')}</p>
                <p className="text-sm text-gray-500">{getTranslation('contact.callUs.hours', 'Mon-Fri 9AM-6PM')}</p>
              </div>
              
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{getTranslation('contact.emailUs.title', 'Email Us')}</h3>
                <p className="text-gray-600 mb-2">{getTranslation('contact.emailUs.email', 'support@farmermarket.com')}</p>
                <p className="text-sm text-gray-500">{getTranslation('contact.emailUs.response', '24/7 Response')}</p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{getTranslation('contact.whatsapp.title', 'WhatsApp')}</h3>
                <p className="text-gray-600 mb-2">{getTranslation('contact.whatsapp.phone', '+977-98-12345678')}</p>
                <p className="text-sm text-gray-500">{getTranslation('contact.whatsapp.description', 'Quick Support')}</p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Headphones className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{getTranslation('contact.liveChat.title', 'Live Chat')}</h3>
                <p className="text-gray-600 mb-2">{getTranslation('contact.liveChat.availability', 'Available on website')}</p>
                <p className="text-sm text-gray-500">{getTranslation('contact.liveChat.description', 'Instant Help')}</p>
              </div>
            </div>
            
          </div>
        </section>

        

      </div>
    </Layout>
  )
}

export default Home