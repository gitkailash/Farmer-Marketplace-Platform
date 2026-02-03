import React, { useState } from 'react'
import AdminDashboardLayout from '../../components/Layout/AdminDashboardLayout'
import { GalleryManagement, MayorMessageManagement, NewsManagement } from '../../components/admin'

type ContentTab = 'gallery' | 'mayor' | 'news'

const AdminContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ContentTab>('gallery')

  const tabs = [
    {
      id: 'gallery' as ContentTab,
      name: 'Gallery',
      icon: '🖼️',
      description: 'Manage homepage gallery images'
    },
    {
      id: 'mayor' as ContentTab,
      name: 'Mayor Message',
      icon: '📢',
      description: 'Configure scrolling mayor messages'
    },
    {
      id: 'news' as ContentTab,
      name: 'News Ticker',
      icon: '📰',
      description: 'Manage news headlines and priorities'
    }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'gallery':
        return <GalleryManagement />
      case 'mayor':
        return <MayorMessageManagement />
      case 'news':
        return <NewsManagement />
      default:
        return null
    }
  }

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Content Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage gallery, mayor messages, and news ticker content
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="mr-2 text-lg">{tab.icon}</span>
                  <div className="text-left">
                    <div>{tab.name}</div>
                    <div className="text-xs text-gray-400 font-normal">
                      {tab.description}
                    </div>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  )
}

export default AdminContent