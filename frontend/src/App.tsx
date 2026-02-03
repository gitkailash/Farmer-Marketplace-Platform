import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { useSelector, useDispatch } from 'react-redux'
import { store } from './store'
import { AuthProvider, useAuth } from './contexts/AuthProvider'
import { ToastProvider } from './contexts/ToastProvider'
import { I18nProvider, useI18n } from './contexts/I18nProvider'
import { NotificationInitializer } from './components/NotificationInitializer'
import ProtectedRoute, { PublicRoute } from './components/ProtectedRoute'
import { 
  Layout, 
  DashboardLayout, 
  AuthLayout, 
  PageErrorBoundary,
  SectionErrorBoundary,
  OfflineFallback
} from './components/UI'
import { Cart } from './components/Cart'
import { selectCartIsOpen, closeCart } from './store/slices/cartSlice'
import { selectIsRestoring } from './store/slices/authSlice'
import { setupGlobalErrorHandling } from './utils/errorHandling'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Checkout from './pages/Checkout'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import BuyerMessages from './pages/BuyerMessages'
import BuyerReviews from './pages/BuyerReviews'
import BuyerDashboard from './pages/BuyerDashboard'
import CartPage from './pages/CartPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminUserDetail from './pages/admin/AdminUserDetail'
import AdminUserEdit from './pages/admin/AdminUserEdit'
import AdminModeration from './pages/admin/AdminModeration'
import AdminContent from './pages/admin/AdminContent'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import AdminTranslations from './pages/admin/AdminTranslations'
import { MessagesAndReviews } from './pages/MessagesAndReviews'
import FarmerDashboard from './pages/FarmerDashboard'
import OrderReviewPage from './pages/OrderReviewPage'
import I18nTest from './pages/I18nTest'
import UserSettings from './pages/UserSettings'
import TranslatedDashboardExample from './components/examples/TranslatedDashboardExample'

import './index.css'

// Initialize global error handling
setupGlobalErrorHandling()

// Cart Modal Component - renders globally when cart is open
const GlobalCartModal = () => {
  const dispatch = useDispatch()
  const isCartOpen = useSelector(selectCartIsOpen)
  const { user } = useAuth()

  const handleCloseCart = () => {
    dispatch(closeCart())
  }

  // Only show cart modal for buyers
  if (!user || user.role !== 'BUYER') {
    return null
  }

  return (
    <Cart 
      isOpen={isCartOpen} 
      onClose={handleCloseCart} 
    />
  )
}


const DashboardPage = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const isRestoring = useSelector(selectIsRestoring)
  
  // Show loading while restoring authentication
  if (loading || isRestoring) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {isRestoring ? 'Restoring your session...' : 'Loading your dashboard...'}
          </p>
        </div>
      </div>
    )
  }
  
  // If authenticated but no user data yet, keep loading
  if (isAuthenticated && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user data...</p>
        </div>
      </div>
    )
  }
  
  // Render role-specific dashboard
  if (user?.role === 'BUYER') {
    return (
      <SectionErrorBoundary>
        <BuyerDashboard />
      </SectionErrorBoundary>
    );
  }
  
  if (user?.role === 'ADMIN') {
    return (
      <SectionErrorBoundary>
        <AdminDashboard />
      </SectionErrorBoundary>
    );
  }
  
  if (user?.role === 'FARMER') {
    return (
      <SectionErrorBoundary>
        <FarmerDashboard />
      </SectionErrorBoundary>
    );
  }
  
  // Fallback for unrecognized roles
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <SectionErrorBoundary>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Dashboard</h1>
          <p className="text-gray-600">Welcome to your dashboard!</p>
        </SectionErrorBoundary>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

// App Content Component - renders only when translations are ready
const AppContent = () => {
  const { isLoading, isReady } = useI18n();
  
  // Show loading screen while translations are loading
  if (isLoading || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading translations...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <ToastProvider>
        <NotificationInitializer />
        <PageErrorBoundary onError={(error: Error, errorInfo: any) => {
          console.error('Global error caught by React Error Boundary:', error, errorInfo)
        }}>
          <OfflineFallback>
            {/* Global Cart Modal */}
            <GlobalCartModal />
          
          <Routes>
            {/* Public routes */}
            <Route 
              path="/" 
              element={
                <SectionErrorBoundary>
                  <Home />
                </SectionErrorBoundary>
              } 
            />
            <Route 
              path="/products" 
              element={
                <SectionErrorBoundary>
                  <Products />
                </SectionErrorBoundary>
              } 
            />
            <Route 
              path="/products/:id" 
              element={
                <SectionErrorBoundary>
                  <ProductDetail />
                </SectionErrorBoundary>
              } 
            />
            
            {/* i18n Test Route - Development Only */}
            <Route 
              path="/i18n-test" 
              element={
                <SectionErrorBoundary>
                  <I18nTest />
                </SectionErrorBoundary>
              } 
            />
            
            {/* Dashboard Translation Example - Development Only */}
            <Route 
              path="/dashboard-example" 
              element={
                <SectionErrorBoundary>
                  <TranslatedDashboardExample />
                </SectionErrorBoundary>
              } 
            />
            
            {/* Auth routes - redirect if already authenticated */}
            <Route 
              path="/login" 
              element={
                <PublicRoute redirectTo="/dashboard">
                  <AuthLayout>
                    <SectionErrorBoundary>
                      <Login />
                    </SectionErrorBoundary>
                  </AuthLayout>
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute redirectTo="/dashboard">
                  <AuthLayout>
                    <SectionErrorBoundary>
                      <Register />
                    </SectionErrorBoundary>
                  </AuthLayout>
                </PublicRoute>
              } 
            />
            
            {/* Protected routes */}
            <Route 
              path="/dashboard" 
              element={<DashboardPage />} 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <SectionErrorBoundary>
                    <UserSettings />
                  </SectionErrorBoundary>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/cart" 
              element={
                <ProtectedRoute allowedRoles={['BUYER']}>
                  <SectionErrorBoundary>
                    <CartPage />
                  </SectionErrorBoundary>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/checkout" 
              element={
                <ProtectedRoute>
                  <SectionErrorBoundary>
                    <Checkout />
                  </SectionErrorBoundary>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/orders" 
              element={
                <ProtectedRoute>
                  <SectionErrorBoundary>
                    <Orders />
                  </SectionErrorBoundary>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/orders/:id" 
              element={
                <ProtectedRoute>
                  <SectionErrorBoundary>
                    <OrderDetail />
                  </SectionErrorBoundary>
                </ProtectedRoute>
              } 
            />
            {/* Order review route with enhanced protection */}
            <Route 
              path="/orders/:id/review" 
              element={
                <ProtectedRoute allowedRoles={['BUYER']} fallbackPath="/orders">
                  <SectionErrorBoundary>
                    <OrderReviewPage />
                  </SectionErrorBoundary>
                </ProtectedRoute>
              } 
            />
            {/* Enhanced buyer routes with proper fallbacks */}
            <Route 
              path="/messages" 
              element={
                <ProtectedRoute allowedRoles={['BUYER', 'FARMER']} fallbackPath="/dashboard">
                  <SectionErrorBoundary>
                    <BuyerMessages />
                  </SectionErrorBoundary>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reviews" 
              element={
                <ProtectedRoute allowedRoles={['BUYER']} fallbackPath="/dashboard">
                  <SectionErrorBoundary>
                    <BuyerReviews />
                  </SectionErrorBoundary>
                </ProtectedRoute>
              } 
            />
            
            {/* Enhanced admin routes with proper fallbacks */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']} fallbackPath="/dashboard">
                  <SectionErrorBoundary>
                    <AdminDashboard />
                  </SectionErrorBoundary>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']} fallbackPath="/admin">
                  <SectionErrorBoundary>
                    <AdminUsers />
                  </SectionErrorBoundary>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users/:id" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']} fallbackPath="/admin/users">
                  <SectionErrorBoundary>
                    <AdminUserDetail />
                  </SectionErrorBoundary>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users/:id/edit" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']} fallbackPath="/admin/users">
                  <SectionErrorBoundary>
                    <AdminUserEdit />
                  </SectionErrorBoundary>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/moderation" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']} fallbackPath="/admin">
                  <SectionErrorBoundary>
                    <AdminModeration />
                  </SectionErrorBoundary>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/content" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']} fallbackPath="/admin">
                  <SectionErrorBoundary>
                    <AdminContent />
                  </SectionErrorBoundary>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/analytics" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']} fallbackPath="/admin">
                  <SectionErrorBoundary>
                    <AdminAnalytics />
                  </SectionErrorBoundary>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/translations" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']} fallbackPath="/admin">
                  <SectionErrorBoundary>
                    <AdminTranslations />
                  </SectionErrorBoundary>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/messages-and-reviews" 
              element={
                <ProtectedRoute>
                  <SectionErrorBoundary>
                    <MessagesAndReviews />
                  </SectionErrorBoundary>
                </ProtectedRoute>
              } 
            />
            
            {/* Enhanced farmer routes with proper fallbacks */}
            <Route 
              path="/farmer/*" 
              element={
                <ProtectedRoute allowedRoles={['FARMER']} fallbackPath="/dashboard">
                  <SectionErrorBoundary>
                    <FarmerDashboard />
                  </SectionErrorBoundary>
                </ProtectedRoute>
              } 
            />
            {/* Catch all route */}
            <Route 
              path="*" 
              element={
                <Layout>
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center mobile-card bg-white p-8 rounded-2xl">
                      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                      <p className="text-gray-600 mb-4">Page not found</p>
                      <a href="/" className="btn-primary">Go Home</a>
                    </div>
                  </div>
                </Layout>
              } 
            />
          </Routes>
        </OfflineFallback>
      </PageErrorBoundary>
    </ToastProvider>
  </AuthProvider>
  );
};

function App() {
  return (
    <Provider store={store}>
      <Router>
        <I18nProvider>
          <AppContent />
        </I18nProvider>
      </Router>
    </Provider>
  )
}

export default App