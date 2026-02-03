import React, { useState } from 'react';
import { Button, InputField, TextareaField, Modal } from '../UI';
import { adminNotificationService } from '../../services/notificationIntegration';
import { useToast } from '../UI/Toast';
import { AlertTriangle } from 'lucide-react';

interface SystemAnnouncementPanelProps {
  className?: string;
}

export const SystemAnnouncementPanel: React.FC<SystemAnnouncementPanelProps> = ({
  className = ''
}) => {
  const { success, error: showError } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !message.trim()) {
      showError('Please fill in both title and message');
      return;
    }

    try {
      setSending(true);
      
      // Send system announcement
      adminNotificationService.sendSystemAnnouncement(title.trim(), message.trim());
      
      // Reset form
      setTitle('');
      setMessage('');
      setShowModal(false);
      
      success('System announcement sent successfully!');
    } catch (err) {
      console.error('Failed to send announcement:', err);
      showError('Failed to send system announcement');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            System Announcements
          </h3>
          <p className="text-sm text-gray-600">
            Send important notifications to all users
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          variant="primary"
          icon="📢"
        >
          Send Announcement
        </Button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <span className="text-yellow-600 text-lg mr-3">
             <AlertTriangle size={24} />
          </span>
          <div>
            <h4 className="text-sm font-medium text-yellow-800">
              Important Notice
            </h4>
            <p className="text-sm text-yellow-700 mt-1">
              System announcements will be sent to all active users. Use this feature responsibly 
              for important platform updates, maintenance notices, or critical information.
            </p>
          </div>
        </div>
      </div>

      {/* Announcement Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Send System Announcement"
        size="md"
      >
        <form onSubmit={handleSendAnnouncement} className="space-y-4">
          <InputField
            label="Announcement Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter announcement title..."
            required
            maxLength={100}
            helpText="Keep the title concise and clear (max 100 characters)"
          />

          <TextareaField
            label="Announcement Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your announcement message..."
            rows={4}
            required
            maxLength={500}
            helpText="Provide clear and actionable information (max 500 characters)"
          />

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <span className="text-blue-600 text-lg mr-3">ℹ️</span>
              <div>
                <h4 className="text-sm font-medium text-blue-800">
                  Preview
                </h4>
                <p className="text-sm text-blue-700 mt-1">
                  <strong>{title || 'Announcement Title'}</strong>
                  <br />
                  {message || 'Your announcement message will appear here...'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!title.trim() || !message.trim() || sending}
            >
              {sending ? 'Sending...' : 'Send Announcement'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};