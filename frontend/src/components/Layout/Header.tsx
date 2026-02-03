import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthProvider'
import { useAppTranslation } from '../../contexts/I18nProvider'
import { NotificationBell, LanguageSwitcher } from '../UI'
import { CartButton } from '../Cart'
import { Home, Tractor, LogIn, ShoppingCart, Box, FileText, Users, LogOut, BarChart2, Package, UserPlus, Settings } from 'lucide-react'

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Get appropriate translation namespace based on user role
  const getTranslationNamespace = () => {
    if (!isAuthenticated || !user) return 'common'
    switch (user.role) {
      case 'FARMER': return 'farmer'
      case 'BUYER': return 'buyer'  
      case 'ADMIN': return 'admin'
      default: return 'common'
    }
  }

  const { t } = useAppTranslation(getTranslationNamespace())

  const handleLogout = async () => {
    await logout()
    navigate('/')
    setIsMobileMenuOpen(false)
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  // Navigation items based on user role
const getNavigationItems = () => {
  if (!isAuthenticated || !user) {
    return [
      { name: 'Explore Products', href: '/products', icon: <ShoppingCart className="text-xl" /> },
      { name: 'Login', href: '/login', icon: <LogIn className="text-xl" /> },
      { name: 'Register', href: '/register', icon: <UserPlus className="text-xl" /> },
    ]
  }

  const commonItems = [
    { name: t('header.dashboard', 'Dashboard'), href: '/dashboard', icon: <Home className="text-xl" /> },
    // { name: 'Messages', href: '/messages', icon: <MessageSquare className="text-xl" /> },
  ]

  switch (user.role) {
    case 'BUYER':
      return [
        ...commonItems,
        { name: t('header.products', 'Products'), href: '/products', icon: <ShoppingCart className="text-xl" /> },
        { name: t('header.myOrders', 'My Orders'), href: '/orders', icon: <Box className="text-xl" /> },
        // Cart is handled separately with CartButton component
      ]
    case 'FARMER':
      return [
        ...commonItems,
        { name: t('header.myProducts', 'My Products'), href: '/farmer/products', icon: <Package className="text-xl" /> },
        { name: t('header.orders', 'Orders'), href: '/farmer/orders', icon: <Box className="text-xl" /> },
        // { name: t('header.messages', 'Messages'), href: '/farmer/messages', icon: <MessageSquare className="text-xl" /> },
        // { name: t('header.reviews', 'Reviews'), href: '/farmer/reviews', icon: <Star className="text-xl" /> },
      ]
    case 'ADMIN':
      return [
        { name: 'Dashboard', href: '/admin', icon: <Home className="text-xl" /> },
        { name: 'Users', href: '/admin/users', icon: <Users className="text-xl" /> },
        { name: 'Content', href: '/admin/content', icon: <FileText className="text-xl" /> },
        { name: 'Analytics', href: '/admin/analytics', icon: <BarChart2 className="text-xl" /> },
      ]
    default:
      return commonItems
  }
}


  const navigationItems = getNavigationItems()

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 safe-area-padding">
        <div className="flex justify-between items-center h-20 sm:h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link 
              to="/" 
              className="flex items-center space-x-3 touch-friendly keyboard-nav"
              onClick={closeMobileMenu}
              aria-label="Farmer Market - Go to homepage"
            >
              <span className="text-3xl sm:text-2xl" aria-hidden="true">
                <Tractor className="text-green-600" />
              </span>
              <span className="text-2xl sm:text-xl font-bold text-primary-600">
                Farmer Market
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav 
            id="navigation"
            className="hidden md:flex items-center space-x-2" 
            role="navigation"
            aria-label="Main navigation"
          >
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors duration-200 touch-friendly keyboard-nav"
                aria-label={`${item.name} - ${item.icon}`}
              >
                <span className="text-xl" aria-hidden="true">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}

            {/* Cart Button for Buyers - Desktop */}
            {isAuthenticated && user?.role === 'BUYER' && (
              <CartButton 
                variant="text" 
                showDropdown={true}
                className="ml-2"
              />
            )}

            {/* Language Switcher for non-authenticated users */}
            {!isAuthenticated && (
              <div className="ml-4 pl-4 border-l border-gray-200">
                <LanguageSwitcher 
                  variant="dropdown" 
                  size="sm" 
                  showFlags={true}
                  showLabels={false}
                />
              </div>
            )}

            {isAuthenticated && (
              <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-gray-200">
                <LanguageSwitcher 
                  variant="dropdown" 
                  size="sm" 
                  showFlags={true}
                  showLabels={false}
                  className="mr-2"
                />
                <NotificationBell />
                {/* <Link
                  to="/settings"
                  className="flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors duration-200 touch-friendly keyboard-nav"
                  aria-label="Settings"
                >
                  <span className="text-xl" aria-hidden="true">
                    <Settings className="text-xl" />
                  </span>
                  <span className="hidden lg:block">Settings</span>
                </Link> */}
                <span className="text-xs text-gray-600 hidden lg:block" aria-live="polite">
                  {t('header.signedInAs', 'Hi, {{name}}').replace('{{name}}', user?.profile?.name || user?.email || '')}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200 touch-friendly keyboard-nav"
                  aria-label="Logout from your account"
                >
                  <span className="text-xl" aria-hidden="true">
                    <LogOut className="text-2xl" />
                  </span>
                  <span>{t('header.logout', 'Logout')}</span>
                </button>
              </div>
            )}
          </nav>


          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-3 rounded-xl text-gray-700 hover:text-primary-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 touch-friendly keyboard-nav"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMobileMenuOpen ? t('header.closeMenu', 'Close main menu') : t('header.openMenu', 'Open main menu')}
            >
              {isMobileMenuOpen ? (
                <svg className="block h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <nav 
            className="px-4 pt-4 pb-6 space-y-2 bg-white border-t border-gray-200 safe-area-padding"
            role="navigation"
            aria-label="Mobile navigation"
          >
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={closeMobileMenu}
                className="mobile-nav-item flex items-center space-x-4 px-4 py-4 rounded-xl text-lg font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors duration-200 keyboard-nav"
                aria-label={`${item.name} - ${item.icon}`}
              >
                <span className="text-2xl" aria-hidden="true">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}

            {/* Cart Button for Buyers - Mobile (prioritizes cart page) */}
            {isAuthenticated && user?.role === 'BUYER' && (
              <CartButton 
                variant="full" 
                showDropdown={false}
                className="mt-2"
              />
            )}

            {/* Language Switcher - Mobile */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="px-4 py-2">
                <p className="text-sm font-medium text-gray-700 mb-2">{t('header.language', 'Language / भाषा')}</p>
                <LanguageSwitcher 
                  variant="buttons" 
                  size="md" 
                  showFlags={true}
                  showLabels={true}
                  className="w-full"
                />
              </div>
            </div>
            
            {isAuthenticated && (
              <div className="border-t border-gray-200 pt-6 mt-6" role="region" aria-label="User account">
                <div className="px-4 py-3">
                  <p className="text-lg text-gray-600">
                    {t('header.signedInAs', 'Signed in as {{name}}').replace('{{name}}', user?.profile?.name || user?.email || '')}
                  </p>
                  <p className="text-base text-gray-500 capitalize">
                    {t('header.accountType', '{{role}} account').replace('{{role}}', user?.role?.toLowerCase() || '')}
                  </p>
                </div>
                <Link
                  to="/settings"
                  onClick={closeMobileMenu}
                  className="mobile-nav-item flex items-center space-x-4 w-full px-4 py-4 rounded-xl text-lg font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors duration-200 keyboard-nav"
                  aria-label="Settings"
                >
                  <span className="flex items-center space-x-2">
                    <Settings className="text-2xl" />
                    <span>{t('header.settings', 'Settings')}</span>
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="mobile-nav-item flex items-center space-x-4 w-full px-4 py-4 rounded-xl text-lg font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200 keyboard-nav"
                  aria-label="Logout from your account"
                >
                  <span className="flex items-center space-x-2">
                    <LogOut className="text-2xl" />
                    <span>{t('header.logout', 'Logout')}</span>
                  </span>
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

export default Header