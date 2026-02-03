import React, { useState } from 'react';
import { MessageList, MessageThread } from '../components/Messaging';
import { ReviewList } from '../components/Reviews';
import { MessageThread as MessageThreadType } from '../services/messageService';
import { DashboardLayout } from '../components/UI';
import { useAuth } from '../contexts/AuthProvider';
import { useMessageNotifications } from '../hooks/useNotifications';

export const MessagesAndReviews: React.FC = () => {
  useMessageNotifications(); // Set up message polling
  const [activeTab, setActiveTab] = useState<'messages' | 'reviews'>('messages');
  const [selectedThread, setSelectedThread] = useState<MessageThreadType | null>(null);

  const handleSelectThread = (thread: MessageThreadType) => {
    setSelectedThread(thread);
  };

  const handleCloseThread = () => {
    setSelectedThread(null);
  };

  const tabs = [
    { id: 'messages', label: 'Messages', icon: '💬' },
    { id: 'reviews', label: 'My Reviews', icon: '⭐' }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Messages & Reviews
          </h1>
          <p className="mt-2 text-gray-600">
            Communicate with farmers and manage your reviews
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'messages' | 'reviews')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'messages' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Message List */}
            <div className="lg:col-span-1">
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
                <div className="bg-white rounded-lg shadow-sm border h-96 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-4">💬</div>
                    <p className="text-lg font-medium mb-2">Select a conversation</p>
                    <p className="text-sm">Choose a message thread to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="max-w-4xl">
            <ReviewList
              type="my-reviews"
              title="Reviews I've Written"
              emptyMessage="You haven't written any reviews yet. Complete some orders and share your experience with farmers!"
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MessagesAndReviews;