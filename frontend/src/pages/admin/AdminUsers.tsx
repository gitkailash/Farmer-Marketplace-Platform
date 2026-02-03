import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AdminDashboardLayout from '../../components/Layout/AdminDashboardLayout'
import { adminService, AdminUser } from '../../services/adminService'
import { LoadingSpinner, ErrorDisplay, Button, Modal } from '../../components/UI'
import { PaginatedResponse } from '../../types/api'
import UserSearchFilters, { UserSearchFilters as FilterType } from '../../components/admin/UserSearchFilters'
import UserRoleManager from '../../components/admin/UserRoleManager'
import { Users } from 'lucide-react'

const AdminUsers: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [pagination, setPagination] = useState<PaginatedResponse<AdminUser>['pagination'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentFilters, setCurrentFilters] = useState<FilterType>({
    search: searchParams.get('search') || '',
    role: searchParams.get('role') || '',
    district: searchParams.get('district') || '',
    isVerified: searchParams.get('isVerified') || '',
    dateRange: {
      start: searchParams.get('dateStart') || '',
      end: searchParams.get('dateEnd') || ''
    },
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
  })
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const currentPage = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  // Load users
  const loadUsers = async (page: number = currentPage) => {
    try {
      setLoading(true)
      setError(null)

      const params: any = {
        page,
        limit,
        sortBy: currentFilters.sortBy,
        sortOrder: currentFilters.sortOrder
      }

      // Add filters if they have values
      if (currentFilters.search) params.search = currentFilters.search
      if (currentFilters.role) params.role = currentFilters.role
      if (currentFilters.district) params.district = currentFilters.district
      if (currentFilters.isVerified) params.isVerified = currentFilters.isVerified
      if (currentFilters.dateRange.start) params.dateStart = currentFilters.dateRange.start
      if (currentFilters.dateRange.end) params.dateEnd = currentFilters.dateRange.end

      const response = await adminService.getUsers(params)
      
      if (response.success && response.data && response.pagination) {
        setUsers(response.data)
        setPagination(response.pagination)
      } else {
        setError(response.message || 'Failed to load users')
      }
    } catch (err) {
      console.error('Failed to load users:', err)
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  // Handle search with new filters
  const handleSearch = (filters: FilterType) => {
    setCurrentFilters(filters)
    
    // Update URL params
    const newParams = new URLSearchParams()
    newParams.set('page', '1') // Reset to first page
    newParams.set('limit', limit.toString())
    
    if (filters.search) newParams.set('search', filters.search)
    if (filters.role) newParams.set('role', filters.role)
    if (filters.district) newParams.set('district', filters.district)
    if (filters.isVerified) newParams.set('isVerified', filters.isVerified)
    if (filters.dateRange.start) newParams.set('dateStart', filters.dateRange.start)
    if (filters.dateRange.end) newParams.set('dateEnd', filters.dateRange.end)
    if (filters.sortBy) newParams.set('sortBy', filters.sortBy)
    if (filters.sortOrder) newParams.set('sortOrder', filters.sortOrder)
    
    setSearchParams(newParams)
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('page', page.toString())
    setSearchParams(newParams)
  }

  // Handle sorting
  const handleSort = (field: string) => {
    const newOrder = field === currentFilters.sortBy && currentFilters.sortOrder === 'asc' ? 'desc' : 'asc'
    const newFilters = {
      ...currentFilters,
      sortBy: field,
      sortOrder: newOrder as 'asc' | 'desc'
    }
    handleSearch(newFilters)
  }

  // Handle user role change
  const handleRoleChange = (userId: string, newRole: string) => {
    // Update the user in the local state
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user._id === userId 
          ? { ...user, role: newRole as AdminUser['role'] }
          : user
      )
    )
  }
  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      setDeleteLoading(true)
      const response = await adminService.deleteUser(selectedUser._id)
      
      if (response.success) {
        setShowDeleteModal(false)
        setSelectedUser(null)
        // Reload users
        await loadUsers()
      } else {
        setError(response.message || 'Failed to delete user')
      }
    } catch (err) {
      console.error('Failed to delete user:', err)
      setError('Failed to delete user')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Load users when params change
  useEffect(() => {
    loadUsers()
  }, [searchParams])

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                User Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage users, roles, and permissions
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {pagination && (
                <span>
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} users
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <UserSearchFilters
          onSearch={handleSearch}
          initialFilters={currentFilters}
          loading={loading}
        />

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="p-6">
              <ErrorDisplay 
                message={error}
                onRetry={() => loadUsers()}
              />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="text-xl" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">
                {currentFilters.search || currentFilters.role 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No users have been registered yet.'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('profile.name')}
                      >
                        <div className="flex items-center">
                          User
                          {currentFilters.sortBy === 'profile.name' && (
                            <span className="ml-1">
                              {currentFilters.sortOrder === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('role')}
                      >
                        <div className="flex items-center">
                          Role
                          {currentFilters.sortBy === 'role' && (
                            <span className="ml-1">
                              {currentFilters.sortOrder === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Activity
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="flex items-center">
                          Joined
                          {currentFilters.sortBy === 'createdAt' && (
                            <span className="ml-1">
                              {currentFilters.sortOrder === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {user.profile.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.profile.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <UserRoleManager 
                            user={user}
                            onRoleChange={handleRoleChange}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.statistics ? (
                            <div className="space-y-1">
                              {user.statistics.farmer && (
                                <div className="text-xs text-gray-600">
                                  {user.statistics.farmer.productCount} products, {user.statistics.farmer.orderCount} orders
                                </div>
                              )}
                              {user.statistics.buyer && (
                                <div className="text-xs text-gray-600">
                                  {user.statistics.buyer.orderCount} orders, {user.statistics.buyer.reviewCount} reviews
                                </div>
                              )}
                              <div className="text-xs text-gray-500">
                                Last active: {formatDate(user.statistics.lastActive)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">No activity data</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              to={`/admin/users/${user._id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View
                            </Link>
                            <Link
                              to={`/admin/users/${user._id}/edit`}
                              className="text-green-600 hover:text-green-900"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => {
                                setSelectedUser(user)
                                setShowDeleteModal(true)
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden">
                {users.map((user) => (
                  <div key={user._id} className="border-b border-gray-200 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {user.profile.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {user.profile.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                          <div className="mt-1">
                            <UserRoleManager 
                              user={user}
                              onRoleChange={handleRoleChange}
                              className="inline-block"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Link
                          to={`/admin/users/${user._id}`}
                          className="text-blue-600 hover:text-blue-900 text-sm"
                        >
                          View
                        </Link>
                        <Link
                          to={`/admin/users/${user._id}/edit`}
                          className="text-green-600 hover:text-green-900 text-sm"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-gray-600">
                      Joined: {formatDate(user.createdAt)}
                    </div>
                    {user.statistics && (
                      <div className="mt-2 text-xs text-gray-600">
                        {user.statistics.farmer && (
                          <div>
                            {user.statistics.farmer.productCount} products, {user.statistics.farmer.orderCount} orders
                          </div>
                        )}
                        {user.statistics.buyer && (
                          <div>
                            {user.statistics.buyer.orderCount} orders, {user.statistics.buyer.reviewCount} reviews
                          </div>
                        )}
                        <div className="text-gray-500">
                          Last active: {formatDate(user.statistics.lastActive)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </Button>
                
                {/* Page numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const pageNum = Math.max(1, pagination.page - 2) + i
                    if (pageNum > pagination.pages) return null
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 text-sm rounded ${
                          pageNum === pagination.page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete User"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{selectedUser?.profile.name}</strong>? 
            This action will permanently delete the user and all their associated data including:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>User profile and account</li>
            <li>All products (if farmer)</li>
            <li>All orders and order history</li>
            <li>All reviews and ratings</li>
            <li>All messages and conversations</li>
          </ul>
          <p className="text-red-600 font-medium">
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteUser}
              loading={deleteLoading}
            >
              Delete User
            </Button>
          </div>
        </div>
      </Modal>
    </AdminDashboardLayout>
  )
}

export default AdminUsers