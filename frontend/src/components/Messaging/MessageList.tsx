import React, { useState, useEffect } from 'react';
import { MessageThread as MessageThreadType } from '../../services/messageService';
import { messageService } from '../../services/messageService';
import { LoadingSpinner, ErrorDisplay, EmptyState } from '../UI';

interface MessageListProps {
  onSelectThread: (thread: MessageThreadType) => void;
  selectedThreadId?: string;
}

export const MessageList: React.FC<MessageListProps> = ({
  onSelectThread,
  selectedThreadId
}) => {
  const [threads, setThreads] = useState<MessageThreadType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMessageThreads();
  }, []);

  const loadMessageThreads = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await messageService.getMessageThreads();
      
      if (response.success && response.data) {
        setThreads(response.data);
      } else {
        setError(response.message || 'Failed to load messages');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const formatLastMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={loadMessageThreads} />;
  }

  if (threads.length === 0) {
    return (
      <EmptyState
        icon="💬"
        title="No Messages"
        description="You haven't started any conversations yet. Messages will appear here when you contact farmers or they contact you."
      />
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b bg-gray-50 rounded-t-lg">
        <h2 className="font-semibold text-gray-900">Messages</h2>
      </div>
      
      <div className="divide-y divide-gray-200">
        {threads.map((thread) => (
          <button
            key={thread.participantId}
            onClick={() => onSelectThread(thread)}
            className={`w-full p-4 text-left hover:bg-gray-50 transition-colors duration-200 ${
              selectedThreadId === thread.participantId ? 'bg-primary-50 border-r-2 border-primary-600' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="font-medium text-gray-900 truncate">
                    {thread.participantName}
                  </p>
                  <span className="text-xs text-gray-500 capitalize">
                    {thread.participantRole.toLowerCase()}
                  </span>
                  {thread.unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                      {thread.unreadCount}
                    </span>
                  )}
                </div>
                
                {thread.lastMessage && (
                  <p className="text-sm text-gray-600 truncate mt-1">
                    {thread.lastMessage.content}
                  </p>
                )}
              </div>
              
              {thread.lastMessage && (
                <p className="text-xs text-gray-500 ml-2 flex-shrink-0">
                  {formatLastMessageTime(thread.lastMessage.createdAt)}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};