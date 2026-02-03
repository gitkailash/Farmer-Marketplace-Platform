import React, { useState, useEffect } from 'react';
import { messageService } from '../../services/messageService';
import { useAuth } from '../../contexts/AuthProvider';

interface MessageNotificationBadgeProps {
  className?: string;
  showCount?: boolean;
}

export const MessageNotificationBadge: React.FC<MessageNotificationBadgeProps> = ({
  className = '',
  showCount = true
}) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'BUYER') {
      loadUnreadCount();
      
      // Set up periodic refresh every 2 minutes (reduced frequency to prevent message handler violations)
      const interval = setInterval(loadUnreadCount, 120000); // Changed from 30000 to 120000 (2 minutes)
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadUnreadCount = async () => {
    try {
      setLoading(true);
      const response = await messageService.getUnreadCount();
      
      if (response.success && response.data) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.warn('Failed to load unread message count:', error);
    } finally {
      setLoading(false);
    }
  };

  if (unreadCount === 0) {
    return null;
  }

  return (
    <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full ${className}`}>
      {showCount ? unreadCount : ''}
    </span>
  );
};

export default MessageNotificationBadge;