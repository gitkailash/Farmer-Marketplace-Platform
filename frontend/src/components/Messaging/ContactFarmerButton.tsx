import React, { useState } from 'react';
import { messageService } from '../../services/messageService';
import { Button, Modal } from '../UI';
import { useAuth } from '../../contexts/AuthProvider';
import { useToastContext } from '../../contexts/ToastProvider';

interface ContactFarmerButtonProps {
  farmerId: string;
  farmerName: string;
  productName?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const ContactFarmerButton: React.FC<ContactFarmerButtonProps> = ({
  farmerId,
  farmerName,
  productName,
  className = '',
  variant = 'outline',
  size = 'md'
}) => {
  const { user } = useAuth();
  const { success, error: showError } = useToastContext();
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Don't show button if user is not a buyer or is the farmer themselves
  if (!user || user.role !== 'BUYER' || String(user._id) === String(farmerId)) {
    return null;
  }

  const handleOpenModal = () => {
    // Pre-fill message if product name is provided
    if (productName) {
      setMessage(`Hi ${farmerName}, I'm interested in your ${productName}. Could you tell me more about it?`);
    } else {
      setMessage(`Hi ${farmerName}, I'd like to know more about your products.`);
    }
    setShowModal(true);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || sending) return;

    try {
      setSending(true);
      const response = await messageService.sendMessage({
        receiverId: farmerId,
        content: message.trim()
      });

      if (response.success) {
        success(`Your message has been sent to ${farmerName}.`);
        setShowModal(false);
        setMessage('');
      } else {
        throw new Error(response.message || 'Failed to send message');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleOpenModal}
        className={className}
      >
        💬 Contact Farmer
      </Button>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Message ${farmerName}`}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Send a message to {farmerName} about their products or ask any questions you have.
          </p>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Your Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Write your message to ${farmerName}...`}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowModal(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || sending}
            >
              {sending ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};