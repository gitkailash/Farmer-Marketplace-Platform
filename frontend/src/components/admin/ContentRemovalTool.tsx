import React, { useState } from 'react'
import { Button, Modal } from '../UI'

interface ContentRemovalToolProps {
  contentType: 'review' | 'product' | 'message'
  contentId: string
  contentTitle?: string
  onRemove: (contentId: string, reason: string) => Promise<void>
  className?: string
}

const ContentRemovalTool: React.FC<ContentRemovalToolProps> = ({
  contentType,
  contentId,
  contentTitle,
  onRemove,
  className = ''
}) => {
  const [showModal, setShowModal] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const removalReasons = [
    'Violates community guidelines',
    'Spam or misleading content',
    'Inappropriate or offensive content',
    'Copyright infringement',
    'Fraudulent or fake content',
    'User requested removal',
    'Legal compliance',
    'Other policy violation'
  ]

  const handleRemove = async () => {
    if (!reason.trim()) {
      return
    }

    try {
      setLoading(true)
      await onRemove(contentId, reason)
      setShowModal(false)
      setReason('')
    } catch (error) {
      console.error('Failed to remove content:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="danger"
        size="sm"
        onClick={() => setShowModal(true)}
        className={className}
      >
        🗑️ Remove
      </Button>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Remove ${contentType}`}
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400 text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Warning: Content Removal
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    This action will permanently remove the {contentType} from the platform.
                    {contentTitle && (
                      <span className="block mt-1 font-medium">
                        "{contentTitle}"
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Reason for removal (required):
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a reason...</option>
              {removalReasons.map((removalReason) => (
                <option key={removalReason} value={removalReason}>
                  {removalReason}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowModal(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleRemove}
              loading={loading}
              disabled={!reason.trim()}
            >
              Remove {contentType}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default ContentRemovalTool