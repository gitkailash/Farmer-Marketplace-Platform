import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import AdminDashboardLayout from '../../components/Layout/AdminDashboardLayout'
import { adminService, AdminUser } from '../../services/adminService'
import { LoadingSpinner, ErrorDisplay, Button, Modal } from '../../components/UI'
import UserActivityMonitor from '../../components/admin/UserActivityMonitor'

const AdminUserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Load user details
  const loadUser = async () => {
    if (!id) return

    try {
      setLoading(true)
      setError(null)

      const response = await adminService.getUserById(id)
      
      if (response.success && response.data) {
        setUser(response.data)
      } else {
        setError(response.message || 'Failed to load user details')
      }
    } catch (err) {
      console.error('Failed to load user:', err)
      setError('Failed to load user details')
    } finally {
      setLoading(false)
    }
  }

  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!user) return

    try {
      setDeleteLoading(true)
      const response = await adminService.deleteUser(user._id)
      
      if (response.success) {
        navigate('/admin/users', { 
          state: { message: `User ${user.profile.name} has been deleted successfully.` }
        })
      } else {
        setError(response.message || 'Failed to delete user')
      }
    } catch (err) {
      console.error('Failed to delete user:', err)
      setError('Failed to delete user')
    } finally {
      setDeleteLoading(false)
      setShowDeleteModal(false)
    }
  }

  useEffect(() => {
    loadUser()
  }, [id])

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800'
      case 'FARMER':
        return 'bg-green-100 text-green-800'
      case 'BUYER':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </AdminDashboardLayout>
    )
  }

  if (error || !user) {
    return (
      <AdminDashboardLayout>
        <ErrorDisplay 
          message={error || 'User not found'}
          onRetry={() => loadUser()}
        />
      </AdminDashboardLayout>
    )
  }

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                to="/admin/users"
                className="text-gray-400 hover:text-gray-600 mr-4"
              >
                ← Back to Users
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.profile.name}
                </h1>
                <p className="text-gray-600 mt-1">
                  User Details and Activity
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to={`/admin/users/${user._id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Edit User
              </Link>
              <Button
                variant="danger"
                onClick={() => setShowDeleteModal(true)}
              >
                Delete User
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Profile */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center">
                <div className="mx-auto h-24 w-24 rounded-full bg-gray-300 flex items-center justify-center mb-4">
                  <span className="text-2xl font-medium text-gray-700">
                    {user.profile.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {user.profile.name}
                </h2>
                <p className="text-gray-600 mb-4">{user.email}</p>
                
                <div className="flex justify-center mb-4">
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                  {user.farmerProfile?.isVerified && (
                    <span className="ml-2 text-green-500 text-lg">✓ Verified</span>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">User ID</dt>
                    <dd className="text-sm text-gray-900 font-mono">{user._id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Joined</dt>
                    <dd className="text-sm text-gray-900">{formatDate(user.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                    <dd className="text-sm text-gray-900">{formatDate(user.updatedAt)}</dd>
                  </div>
                  {user.statistics && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Last Active</dt>
                      <dd className="text-sm text-gray-900">{formatDate(user.statistics.lastActive)}</dd>
                    </div>
                  )}
                  {user.profile.phone && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Phone</dt>
                      <dd className="text-sm text-gray-900">{user.profile.phone}</dd>
                    </div>
                  )}
                  {user.profile.address && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Address</dt>
                      <dd className="text-sm text-gray-900">{user.profile.address}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* Farmer Profile */}
            {user.farmerProfile && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Farmer Profile
                </h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Location</dt>
                    <dd className="text-sm text-gray-900">
                      {user.farmerProfile.location.district}, {user.farmerProfile.location.municipality}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Rating</dt>
                    <dd className="text-sm text-gray-900">
                      <div className="flex items-center">
                        <span className="text-yellow-500 mr-1">⭐</span>
                        <span className="font-medium">{user.farmerProfile.rating.toFixed(1)}</span>
                        <span className="text-gray-500 ml-2">
                          ({user.farmerProfile.reviewCount} reviews)
                        </span>
                      </div>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Verification Status</dt>
                    <dd className="text-sm">
                      {user.farmerProfile.isVerified ? (
                        <span className="text-green-600 font-medium">✓ Verified</span>
                      ) : (
                        <span className="text-yellow-600 font-medium">⚠ Not Verified</span>
                      )}
                    </dd>
                  </div>
                  {user.farmerProfile.location.coordinates && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Coordinates</dt>
                      <dd className="text-sm text-gray-900 font-mono">
                        {user.farmerProfile.location.coordinates[1]}, {user.farmerProfile.location.coordinates[0]}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </div>

          {/* Activity and Statistics */}
          <div className="lg:col-span-2">
            {user.statistics && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Farmer Statistics */}
                {user.statistics.farmer && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Farmer Activity
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {user.statistics.farmer.productCount}
                        </div>
                        <div className="text-sm text-gray-600">Products</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {user.statistics.farmer.orderCount}
                        </div>
                        <div className="text-sm text-gray-600">Orders</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {user.statistics.farmer.reviewCount}
                        </div>
                        <div className="text-sm text-gray-600">Reviews</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {user.statistics.farmer.rating.toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-600">Rating</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Buyer Statistics */}
                {user.statistics.buyer && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Buyer Activity
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {user.statistics.buyer.orderCount}
                        </div>
                        <div className="text-sm text-gray-600">Orders Placed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {user.statistics.buyer.reviewCount}
                        </div>
                        <div className="text-sm text-gray-600">Reviews Given</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Account Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Account Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Profile Details</h4>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Full Name:</dt>
                      <dd className="text-sm text-gray-900">{user.profile.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Email:</dt>
                      <dd className="text-sm text-gray-900">{user.email}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Role:</dt>
                      <dd className="text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                      </dd>
                    </div>
                    {user.profile.phone && (
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Phone:</dt>
                        <dd className="text-sm text-gray-900">{user.profile.phone}</dd>
                      </div>
                    )}
                  </dl>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Account Status</h4>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Account Created:</dt>
                      <dd className="text-sm text-gray-900">{formatDate(user.createdAt)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Last Updated:</dt>
                      <dd className="text-sm text-gray-900">{formatDate(user.updatedAt)}</dd>
                    </div>
                    {user.statistics && (
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Last Active:</dt>
                        <dd className="text-sm text-gray-900">{formatDate(user.statistics.lastActive)}</dd>
                      </div>
                    )}
                    {user.farmerProfile && (
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Verification:</dt>
                        <dd className="text-sm">
                          {user.farmerProfile.isVerified ? (
                            <span className="text-green-600 font-medium">✓ Verified</span>
                          ) : (
                            <span className="text-yellow-600 font-medium">⚠ Pending</span>
                          )}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  to={`/admin/users/${user._id}/edit`}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  ✏️ Edit Profile
                </Link>
                {user.role === 'FARMER' && (
                  <Link
                    to={`/admin/moderation?type=products&farmerId=${user._id}`}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    🌾 View Products
                  </Link>
                )}
                <Link
                  to={`/admin/moderation?type=reviews&userId=${user._id}`}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  ⭐ View Reviews
                </Link>
              </div>
            </div>

            {/* User Activity Monitor */}
            <UserActivityMonitor userId={user._id} className="mt-6" />
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete User"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{user.profile.name}</strong>? 
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

export default AdminUserDetail