import React from 'react'
import Header from './Header'
import Footer from './Footer'
import { SkipLink } from '../UI/Accessibility'

interface LayoutProps {
  children: React.ReactNode
  showFooter?: boolean
  className?: string
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  showFooter = true, 
  className = '' 
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Skip Links for Accessibility */}
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <SkipLink href="#navigation">Skip to navigation</SkipLink>
      
      <Header />
      
      <main 
        id="main-content"
        className={`flex-1 ${className}`}
        role="main"
        tabIndex={-1}
      >
        {children}
      </main>
      
      {showFooter && <Footer />}
    </div>
  )
}

export default Layout

// Specialized layout components for different page types
export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Layout className="bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {children}
    </div>
  </Layout>
)

export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Layout showFooter={false} className="bg-gray-50">
    {children}
  </Layout>
)

export const FullWidthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Layout className="bg-white">
    {children}
  </Layout>
)

// Export farmer dashboard layout
export { default as FarmerDashboardLayout } from './FarmerDashboardLayout'
export { default as FarmerTabNavigation } from './FarmerTabNavigation'