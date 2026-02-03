import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import { notificationPollingService } from '../services/notificationIntegration';

/**
 * Component that initializes notification services when user is authenticated
 * This component doesn't render anything but sets up notification polling
 */
export const NotificationInitializer: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    // Start notification polling for authenticated users
    const stopPolling = notificationPollingService.startPolling();

    // In a production environment, you would also:
    // 1. Connect to WebSocket for real-time notifications
    // 2. Set up push notification service worker
    // 3. Handle notification permissions

    console.log('Notification services initialized for user:', user.email);

    // Cleanup function
    return () => {
      stopPolling();
      console.log('Notification services stopped');
    };
  }, [isAuthenticated, user]);

  // This component doesn't render anything
  return null;
};