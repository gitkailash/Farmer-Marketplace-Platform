import React, { useState } from 'react'
import { Button, Modal } from '../UI'

interface ContentFlagButtonProps {
  contentType: 'review' | 'product' | 'message'
  contentId: string
  onFlag: (contentId: string, reason: string) => Promise<void>
  className?: string
}

const ContentFlagButton: React.FC<ContentFlagButtonProps> = ({
  contentType,
  contentId,
  onFlag,
  className = ''
}) => {
  const [showModal, setShowModal] = useState(false)
  const [selectedReason, setSelectedReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [loading, setLoading] = useState(false)

  const flagReasons = [
    'Inappropriate content',
    'Spam or misleading information',
    'Harassment or abuse',
    'Fake or fraudulent content',
    'Copyright violation',
    'Other (specify below)'
  ]

  const handleFlag = async () => {
    const reason = selectedReason === 'Other (specify below)' ? customReason : selectedReason
    
    if (!reason.trim()) {
      return
    }

    try {
      setLoading(true)
      await onFlag(contentId, reason)
      setShowModal(false)
      setSelectedReason('')
      setCustomReason('')
    } catch (error) {
      console.error('Failed to flag content:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setShowModal(true)}
        className={`text-red-600 hover:text-red-700 hover:bg-red-50 ${className}`}
      >
        🚩 Flag
      </Button>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Flag ${contentType}`}
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Why are you flagging this {contentType}? This will help moderators review it appropriately.
          </p>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Reason for flagging:
            </label>
            {flagReasons.map((reason) => (
              <label key={reason} className="flex items-center">
                <input
                  type="radio"
                  name="flagReason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">{reason}</span>
              </label>
            ))}
          </div>

          {selectedReason === 'Other (specify below)' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please specify:
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Describe the issue..."
              />
            </div>
          )}

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
              onClick={handleFlag}
              loading={loading}
              disabled={!selectedReason || (selectedReason === 'Other (specify below)' && !customReason.trim())}
            >
              Flag Content
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default ContentFlagButton