import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAppTranslation } from '../../contexts/I18nProvider'
import { BarChart2, Package, Clipboard, MessageCircle, Star } from 'lucide-react';


const FarmerTabNavigation: React.FC = () => {
  const location = useLocation()
  const { t } = useAppTranslation('farmer')

  const navigationItems = [
    {
      name: t('navigation.overview', 'Overview'),
      href: '/farmer',
      icon: <BarChart2 className="text-xl" />,
      shortName: t('navigation.home', 'Home')
    },
    {
      name: t('navigation.products', 'Products'),
      href: '/farmer/products',
      icon: <Package className="text-xl" />,
      shortName: t('navigation.products', 'Products')
    },
    {
      name: t('navigation.orders', 'Orders'),
      href: '/farmer/orders',
      icon: <Clipboard className="text-xl" />,
      shortName: t('navigation.orders', 'Orders')
    },
    {
      name: t('navigation.messages', 'Messages'),
      href: '/farmer/messages',
      icon: <MessageCircle className="text-xl" />,
      shortName: t('navigation.messages', 'Messages')
    },
    {
      name: t('navigation.reviews', 'Reviews'),
      href: '/farmer/reviews',
      icon: <Star className="text-xl" />,
      shortName: t('navigation.reviews', 'Reviews')
    }
  ]

  return (
    <div className="lg:hidden bg-white border-b border-gray-200 sticky top-20 z-40 safe-area-padding">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <nav className="flex space-x-2 overflow-x-auto py-3 smooth-scroll">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href === '/farmer' && location.pathname === '/farmer/')
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive: navIsActive }) => {
                  const active = isActive || navIsActive
                  return `flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-2xl text-sm font-medium transition-colors duration-200 touch-friendly min-w-[80px] ${
                    active
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`
                }}
              >
                <span className="text-2xl mb-1 sm:text-xl">{item.icon}</span>
                <span className="whitespace-nowrap text-xs">{item.shortName}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

export default FarmerTabNavigation