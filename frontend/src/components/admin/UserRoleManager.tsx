import React, { useState } from 'react'
import { adminService, AdminUser } from '../../services/adminService'
import { Button, Modal } from '../UI'
import { AlertTriangle } from 'lucide-react';


interface UserRoleManagerProps {
  user: AdminUser
  onRoleChange?: (userId: string, newRole: string) => void
  className?: string
}

const UserRoleManager: React.FC<UserRoleManagerProps> = ({ 
  user, 
  onRoleChange,
  className = '' 
}) => {
  const [showModal, setShowModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'VISITOR' | 'BUYER' | 'FARMER' | 'ADMIN'>(user.role)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const roles = [
    { value: 'BUYER', label: 'Buyer', description: 'Can browse and purchase products' },
    { value: 'FARMER', label: 'Farmer', description: 'Can sell products and manage inventory' },
    { value: 'ADMIN', label: 'Administrator', description: 'Full system access and moderation' }
  ]

  const handleRoleChange = async () => {
    if (selectedRole === user.role) {
      setShowModal(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await adminService.updateUser(user._id, {
        role: selectedRole
      })

      if (response.success) {
        setShowModal(false)
        onRoleChange?.(user._id, selectedRole)
      } else {
        setError(response.message || 'Failed to update user role')
      }
    } catch (err) {
      console.error('Failed to update user role:', err)
      setError('Failed to update user role')
    } finally {
      setLoading(false)
    }
  }

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

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <div>
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
            {user.role}
          </span>
          {user.farmerProfile?.isVerified && (
            <span className="ml-2 text-green-500 text-sm">✓ Verified</span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowModal(true)}
        >
          Change Role
        </Button>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Change User Role"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-blue-500 text-lg">ℹ️</span>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800">
                  Changing User Role
                </h4>
                <p className="mt-1 text-sm text-blue-700">
                  You are about to change the role for <strong>{user.profile.name}</strong> ({user.email}).
                  This will immediately affect their access permissions and available features.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select New Role
            </label>
            <div className="space-y-3">
              {roles.map((role) => (
                <label key={role.value} className="flex items-start">
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={selectedRole === role.value}
                    onChange={(e) => setSelectedRole(e.target.value as 'VISITOR' | 'BUYER' | 'FARMER' | 'ADMIN')}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="flex items-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(role.value)}`}>
                        {role.label}
                      </span>
                      {role.value === user.role && (
                        <span className="ml-2 text-sm text-gray-500">(Current)</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {selectedRole !== user.role && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-amber-500 text-lg">
                    <AlertTriangle size={24} />
                  </span>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-amber-800">
                    Role Change Impact
                  </h4>
                  <div className="mt-1 text-sm text-amber-700">
                    {selectedRole === 'ADMIN' && (
                      <p>User will gain full administrative access including user management and content moderation.</p>
                    )}
                    {selectedRole === 'FARMER' && user.role !== 'FARMER' && (
                      <p>User will be able to create and manage products. A farmer profile will be created automatically.</p>
                    )}
                    {selectedRole === 'BUYER' && user.role === 'FARMER' && (
                      <p>User will lose access to product management. Their farmer profile will remain but be inactive.</p>
                    )}
                    {selectedRole === 'BUYER' && user.role === 'ADMIN' && (
                      <p>User will lose administrative access and only be able to browse and purchase products.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-500 text-lg">❌</span>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-red-800">
                    Error
                  </h4>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRoleChange}
              loading={loading}
              disabled={loading || selectedRole === user.role}
            >
              {loading ? 'Updating...' : 'Update Role'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default UserRoleManager