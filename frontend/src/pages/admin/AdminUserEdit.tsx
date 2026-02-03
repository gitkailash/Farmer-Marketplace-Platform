import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import AdminDashboardLayout from '../../components/Layout/AdminDashboardLayout'
import { adminService, AdminUser } from '../../services/adminService'
import { LoadingSpinner, ErrorDisplay, Button } from '../../components/UI'

const AdminUserEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    role: '',
    profile: {
      name: '',
      phone: '',
      address: ''
    }
  })

  // Load user details
  const loadUser = async () => {
    if (!id) return

    try {
      setLoading(true)
      setError(null)

      const response = await adminService.getUserById(id)
      
      if (response.success && response.data) {
        const userData = response.data
        setUser(userData)
        setFormData({
          role: userData.role,
          profile: {
            name: userData.profile.name,
            phone: userData.profile.phone || '',
            address: userData.profile.address || ''
          }
        })
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return

    try {
      setSaving(true)
      setError(null)

      // Prepare update data - only include changed fields
      const updateData: any = {}
      
      if (formData.role !== user.role) {
        updateData.role = formData.role
      }
      
      const profileChanges: any = {}
      if (formData.profile.name !== user.profile.name) {
        profileChanges.name = formData.profile.name
      }
      if (formData.profile.phone !== (user.profile.phone || '')) {
        profileChanges.phone = formData.profile.phone || undefined
      }
      if (formData.profile.address !== (user.profile.address || '')) {
        profileChanges.address = formData.profile.address || undefined
      }
      
      if (Object.keys(profileChanges).length > 0) {
        updateData.profile = profileChanges
      }

      // Only make API call if there are changes
      if (Object.keys(updateData).length === 0) {
        navigate(`/admin/users/${user._id}`, {
          state: { message: 'No changes were made.' }
        })
        return
      }

      const response = await adminService.updateUser(user._id, updateData)
      
      if (response.success) {
        navigate(`/admin/users/${user._id}`, {
          state: { message: 'User updated successfully.' }
        })
      } else {
        setError(response.message || 'Failed to update user')
      }
    } catch (err) {
      console.error('Failed to update user:', err)
      setError('Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('profile.')) {
      const profileField = field.replace('profile.', '')
      setFormData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          [profileField]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
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
                to={`/admin/users/${user._id}`}
                className="text-gray-400 hover:text-gray-600 mr-4"
              >
                ← Back to User Details
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Edit User: {user.profile.name}
                </h1>
                <p className="text-gray-600 mt-1">
                  Update user profile and role information
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                Current: {user.role}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Edit Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Profile Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.profile.name}
                      onChange={(e) => handleInputChange('profile.name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={user.email}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Email addresses cannot be changed
                    </p>
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.profile.phone}
                      onChange={(e) => handleInputChange('profile.phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                      User Role *
                    </label>
                    <select
                      id="role"
                      value={formData.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="BUYER">Buyer</option>
                      <option value="FARMER">Farmer</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                    {formData.role !== user.role && (
                      <p className="text-xs text-amber-600 mt-1">
                        ⚠ Changing user role will affect their access permissions
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    id="address"
                    value={formData.profile.address}
                    onChange={(e) => handleInputChange('profile.address', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Optional address information"
                  />
                </div>
              </div>

              {/* Farmer-specific Information */}
              {user.farmerProfile && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Farmer Profile Information
                  </h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <span className="text-blue-500 text-lg">ℹ️</span>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-blue-800">
                          Farmer-specific Information
                        </h4>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>Location: {user.farmerProfile.location.district}, {user.farmerProfile.location.municipality}</p>
                          <p>Rating: ⭐ {user.farmerProfile.rating.toFixed(1)} ({user.farmerProfile.reviewCount} reviews)</p>
                          <p>Verification Status: {user.farmerProfile.isVerified ? '✅ Verified' : '⚠️ Not Verified'}</p>
                        </div>
                        <p className="mt-2 text-xs text-blue-600">
                          Farmer-specific information cannot be edited from this interface. 
                          Use the farmer management tools for location and verification changes.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <p>Last updated: {formatDate(user.updatedAt)}</p>
                    <p className="mt-1">User ID: <span className="font-mono">{user._id}</span></p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Link
                      to={`/admin/users/${user._id}`}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </Link>
                    <Button
                      type="submit"
                      variant="primary"
                      loading={saving}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <span className="text-red-500 text-lg">❌</span>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-red-800">
                        Error updating user
                      </h4>
                      <p className="mt-1 text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* User Information Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                User Information
              </h3>
              <div className="text-center mb-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center mb-3">
                  <span className="text-xl font-medium text-gray-700">
                    {user.profile.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h4 className="text-lg font-medium text-gray-900">{user.profile.name}</h4>
                <p className="text-gray-600">{user.email}</p>
              </div>

              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Current Role</dt>
                  <dd className="text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Account Created</dt>
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
              </dl>

              {/* Activity Summary */}
              {user.statistics && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Activity Summary</h4>
                  <div className="space-y-2">
                    {user.statistics.farmer && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Products:</span>
                          <span className="font-medium">{user.statistics.farmer.productCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Orders:</span>
                          <span className="font-medium">{user.statistics.farmer.orderCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Reviews:</span>
                          <span className="font-medium">{user.statistics.farmer.reviewCount}</span>
                        </div>
                      </>
                    )}
                    {user.statistics.buyer && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Orders:</span>
                          <span className="font-medium">{user.statistics.buyer.orderCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Reviews:</span>
                          <span className="font-medium">{user.statistics.buyer.reviewCount}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Warning for Role Changes */}
              {formData.role !== user.role && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <span className="text-amber-500 text-sm">⚠️</span>
                      </div>
                      <div className="ml-2">
                        <h4 className="text-xs font-medium text-amber-800">
                          Role Change Warning
                        </h4>
                        <p className="mt-1 text-xs text-amber-700">
                          Changing from {user.role} to {formData.role} will immediately 
                          affect the user's access permissions and available features.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  )
}

export default AdminUserEdit