import React from 'react'
import AdminDashboardLayout from '../../components/Layout/AdminDashboardLayout'
import { TranslationManagement } from '../../components/admin'

const AdminTranslations: React.FC = () => {
  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Translation Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage translation keys, monitor completeness, and import/export translations
              </p>
            </div>
          </div>
        </div>

        {/* Translation Management Component */}
        <TranslationManagement />
      </div>
    </AdminDashboardLayout>
  )
}

export default AdminTranslations