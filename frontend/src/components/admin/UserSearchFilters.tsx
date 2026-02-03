import React, { useState } from 'react'
import { Button } from '../UI'

interface UserSearchFiltersProps {
  onSearch: (filters: UserSearchFilters) => void
  initialFilters?: Partial<UserSearchFilters>
  loading?: boolean
}

export interface UserSearchFilters {
  search: string
  role: string
  district: string
  isVerified: string
  dateRange: {
    start: string
    end: string
  }
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

const UserSearchFilters: React.FC<UserSearchFiltersProps> = ({
  onSearch,
  initialFilters = {},
  loading = false
}) => {
  const [filters, setFilters] = useState<UserSearchFilters>({
    search: initialFilters.search || '',
    role: initialFilters.role || '',
    district: initialFilters.district || '',
    isVerified: initialFilters.isVerified || '',
    dateRange: {
      start: initialFilters.dateRange?.start || '',
      end: initialFilters.dateRange?.end || ''
    },
    sortBy: initialFilters.sortBy || 'createdAt',
    sortOrder: initialFilters.sortOrder || 'desc'
  })

  const [showAdvanced, setShowAdvanced] = useState(false)

  // Nepal districts for location filtering
  const nepalDistricts = [
    'Kathmandu', 'Lalitpur', 'Bhaktapur', 'Chitwan', 'Kaski', 'Rupandehi',
    'Morang', 'Sunsari', 'Jhapa', 'Banke', 'Kailali', 'Dang', 'Parsa',
    'Bara', 'Rautahat', 'Sarlahi', 'Mahottari', 'Dhanusha', 'Siraha',
    'Saptari', 'Udayapur', 'Khotang', 'Bhojpur', 'Dhankuta', 'Terhathum',
    'Sankhuwasabha', 'Taplejung', 'Panchthar', 'Ilam', 'Solukhumbu',
    'Okhaldhunga', 'Ramechhap', 'Dolakha', 'Sindhupalchok', 'Kavrepalanchok',
    'Nuwakot', 'Rasuwa', 'Dhading', 'Makwanpur', 'Sindhuli', 'Gorkha',
    'Lamjung', 'Tanahu', 'Syangja', 'Parbat', 'Baglung', 'Myagdi',
    'Mustang', 'Manang', 'Nawalpur', 'Palpa', 'Gulmi', 'Arghakhanchi',
    'Kapilvastu', 'Dang', 'Pyuthan', 'Rolpa', 'Rukum East', 'Rukum West',
    'Salyan', 'Surkhet', 'Dailekh', 'Jajarkot', 'Dolpa', 'Jumla',
    'Kalikot', 'Mugu', 'Humla', 'Bajura', 'Bajhang', 'Achham',
    'Doti', 'Kailali', 'Kanchanpur', 'Dadeldhura', 'Baitadi', 'Darchula'
  ].sort()

  const handleFilterChange = (key: keyof UserSearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleDateRangeChange = (key: 'start' | 'end', value: string) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [key]: value
      }
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(filters)
  }

  const handleReset = () => {
    const resetFilters: UserSearchFilters = {
      search: '',
      role: '',
      district: '',
      isVerified: '',
      dateRange: { start: '', end: '' },
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }
    setFilters(resetFilters)
    onSearch(resetFilters)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Users
            </label>
            <input
              type="text"
              id="search"
              placeholder="Name, email, or phone..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Role Filter */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              User Role
            </label>
            <select
              id="role"
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Administrator</option>
              <option value="FARMER">Farmer</option>
              <option value="BUYER">Buyer</option>
            </select>
          </div>

          {/* Sort Options */}
          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              id="sort"
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-')
                handleFilterChange('sortBy', field)
                handleFilterChange('sortOrder', order as 'asc' | 'desc')
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="profile.name-asc">Name A-Z</option>
              <option value="profile.name-desc">Name Z-A</option>
              <option value="email-asc">Email A-Z</option>
              <option value="email-desc">Email Z-A</option>
              <option value="lastActive-desc">Recently Active</option>
              <option value="lastActive-asc">Least Active</option>
            </select>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
          >
            {showAdvanced ? '▼' : '▶'} Advanced Filters
          </button>
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
            >
              Reset
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={loading}
            >
              Search
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* District Filter */}
              <div>
                <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
                  District (Farmers)
                </label>
                <select
                  id="district"
                  value={filters.district}
                  onChange={(e) => handleFilterChange('district', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Districts</option>
                  {nepalDistricts.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>

              {/* Verification Status */}
              <div>
                <label htmlFor="isVerified" className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Status
                </label>
                <select
                  id="isVerified"
                  value={filters.isVerified}
                  onChange={(e) => handleFilterChange('isVerified', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Users</option>
                  <option value="true">Verified Farmers</option>
                  <option value="false">Unverified Farmers</option>
                </select>
              </div>

              {/* Date Range Start */}
              <div>
                <label htmlFor="dateStart" className="block text-sm font-medium text-gray-700 mb-1">
                  Joined After
                </label>
                <input
                  type="date"
                  id="dateStart"
                  value={filters.dateRange.start}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Date Range End */}
              <div>
                <label htmlFor="dateEnd" className="block text-sm font-medium text-gray-700 mb-1">
                  Joined Before
                </label>
                <input
                  type="date"
                  id="dateEnd"
                  value={filters.dateRange.end}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filter Summary */}
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                <strong>Active Filters:</strong>{' '}
                {[
                  filters.search && `Search: "${filters.search}"`,
                  filters.role && `Role: ${filters.role}`,
                  filters.district && `District: ${filters.district}`,
                  filters.isVerified && `Verification: ${filters.isVerified === 'true' ? 'Verified' : 'Unverified'}`,
                  filters.dateRange.start && `After: ${filters.dateRange.start}`,
                  filters.dateRange.end && `Before: ${filters.dateRange.end}`
                ].filter(Boolean).join(', ') || 'None'}
              </p>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

export default UserSearchFilters