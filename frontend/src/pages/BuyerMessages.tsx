import React, { useState, useEffect } from 'react';
import { MessageList, MessageThread } from '../components/Messaging';
import { MessageThread as MessageThreadType, messageService } from '../services/messageService';
import { Layout, LoadingSpinner, ErrorDisplay, Button } from '../components/UI';
import { useAuth } from '../contexts/AuthProvider';
import { useAppTranslation } from '../contexts/I18nProvider';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { MessageCircle } from 'lucide-react';


export const BuyerMessages: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { t } = useAppTranslation('buyer');
  const navigate = useNavigate();
  const [selectedThread, setSelectedThread] = useState<MessageThreadType | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated or not a buyer
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'BUYER') {
      navigate('/dashboard');
      return;
    }
  }, [isAuthenticated, user, navigate]);

  // Load unread message count
  useEffect(() => {
    if (user?.role === 'BUYER') {
      loadUnreadCount();
    }
  }, [user]);

  const loadUnreadCount = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await messageService.getUnreadCount();
      
      if (response.success && response.data) {
        setUnreadCount(response.data.count);
      }
    } catch (err: any) {
      setError(err.message || t('messages.errorLoading', 'Failed to load message count'));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectThread = (thread: MessageThreadType) => {
    setSelectedThread(thread);
    // Mark messages as read when thread is selected
    if (thread.unreadCount > 0) {
      messageService.markAsRead(thread.participantId).then(() => {
        loadUnreadCount(); // Refresh unread count
      });
    }
  };

  const handleCloseThread = () => {
    setSelectedThread(null);
  };

  if (!isAuthenticated || user?.role !== 'BUYER') {
    return null; // Will redirect in useEffect
  }

  if (loading && unreadCount === 0) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('messages.title', 'Messages')}
                {unreadCount > 0 && (
                  <span className="ml-3 inline-flex items-center justify-center px-3 py-1 text-sm font-bold leading-none text-white bg-red-600 rounded-full">
                    {t('messages.newCount', '{{count}} new').replace('{{count}}', unreadCount.toString())}
                  </span>
                )}
              </h1>
              <p className="mt-2 text-gray-600">
                {t('messages.subtitle', 'Communicate with farmers about products and orders')}
              </p>
            </div>
            <Button
              onClick={() => navigate('/products')}
              variant="outline"
              icon={<ShoppingCart className="h-6 w-6" />}
            >
              {t('messages.browseProducts', 'Browse Products')}
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <ErrorDisplay 
            message={error}
            onRetry={loadUnreadCount}
            className="mb-8"
          />
        )}

        {/* Messages Interface */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 h-[600px]">
            {/* Message List */}
            <div className="lg:col-span-1 border-r border-gray-200">
              <MessageList
                onSelectThread={handleSelectThread}
                selectedThreadId={selectedThread?.participantId}
              />
            </div>

            {/* Message Thread */}
            <div className="lg:col-span-2">
              {selectedThread ? (
                <MessageThread
                  participantId={selectedThread.participantId}
                  participantName={selectedThread.participantName}
                  participantRole={selectedThread.participantRole}
                  onClose={handleCloseThread}
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50">
                  <div className="text-center text-gray-500 max-w-md">
                    <div className="text-6xl mb-4">
                      <MessageCircle className="h-4 w-4" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">{t('messages.selectConversation', 'Select a conversation')}</h3>
                    <p className="text-sm mb-6">
                      {t('messages.selectConversationDesc', 'Choose a message thread to start chatting with farmers about their products')}
                    </p>
                    <div className="space-y-3">
                      <Button
                        onClick={() => navigate('/products')}
                        variant="primary"
                        icon={<ShoppingCart className="h-6 w-6" />}
                      >
                        {t('messages.browseProducts', 'Browse Products')}
                      </Button>
                      <p className="text-xs text-gray-400">
                        {t('messages.contactFromProducts', 'Contact farmers directly from product pages')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            {t('messages.messagingTips', '💡 Messaging Tips')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-1">{t('messages.beforeOrdering.title', 'Before ordering:')}</h4>
              <ul className="space-y-1 text-blue-700">
                <li>{t('messages.beforeOrdering.freshness', '• Ask about product freshness and harvest dates')}</li>
                <li>{t('messages.beforeOrdering.bulkPricing', '• Inquire about bulk pricing for larger quantities')}</li>
                <li>{t('messages.beforeOrdering.delivery', '• Confirm delivery options and timing')}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-1">{t('messages.etiquette.title', 'Communication etiquette:')}</h4>
              <ul className="space-y-1 text-blue-700">
                <li>{t('messages.etiquette.polite', '• Be polite and respectful in all messages')}</li>
                <li>{t('messages.etiquette.details', '• Provide clear details about your requirements')}</li>
                <li>{t('messages.etiquette.respond', '• Respond promptly to farmer inquiries')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BuyerMessages;