import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../../types/api';
import { notificationAwareMessageService } from '../../services/notificationIntegration';
import { messageService } from '../../services/messageService';
import { useAuth } from '../../contexts/AuthProvider';
import { InputField, LoadingSpinner, ErrorDisplay } from '../UI';
import Button from '../UI/Button';
import { useToast } from '../UI/Toast';
import { useNotifications } from '../../hooks/useNotifications';

interface MessageThreadProps {
  participantId: string;
  participantName: string;
  participantRole: 'BUYER' | 'FARMER';
  onClose?: () => void;
}

interface ConversationStats {
  totalMessages: number;
  englishMessages: number;
  nepaliMessages: number;
  mixedLanguage: boolean;
}

export const MessageThread: React.FC<MessageThreadProps> = ({
  participantId,
  participantName,
  participantRole,
  onClose
}) => {
  const { user } = useAuth();
  const { error: showError } = useToast();
  const { notifyNewMessage } = useNotifications();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageLanguage, setMessageLanguage] = useState<'en' | 'ne'>('en');
  const [conversationStats, setConversationStats] = useState<ConversationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousMessageCount = useRef<number>(0);

  // Load conversation on mount
  useEffect(() => {
    loadConversation();
    markAsRead();
  }, [participantId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (newMessage.trim()) {
      const detectedLanguage = messageService.detectLanguage(newMessage);
      setMessageLanguage(detectedLanguage);
    }
  }, [newMessage]);
  useEffect(() => {
    scrollToBottom();
    
    // Check for new messages from other party and create notifications
    if (messages.length > previousMessageCount.current && previousMessageCount.current > 0) {
      const newMessages = messages.slice(previousMessageCount.current);
      const messagesFromOtherParty = newMessages.filter(msg => msg.senderId !== user?._id);
      
      // Create notifications for new messages from the other party
      messagesFromOtherParty.forEach(message => {
        notifyNewMessage(participantName, message.content, message.senderId);
      });
    }
    
    previousMessageCount.current = messages.length;
  }, [messages, participantName, notifyNewMessage, user?._id]);

  const loadConversation = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationAwareMessageService.getConversation(participantId);
      
      if (response.success && response.data) {
        setMessages(response.data);
        
        // Extract conversation stats if available
        if ((response as any).conversation?.languageStats) {
          setConversationStats((response as any).conversation.languageStats);
        }
      } else {
        setError(response.message || 'Failed to load messages');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await notificationAwareMessageService.markAsRead(participantId);
    } catch (err) {
      // Silent fail for read status
      console.warn('Failed to mark messages as read:', err);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      setError(null);
      
      const response = await notificationAwareMessageService.sendMessage({
        receiverId: participantId,
        content: newMessage.trim(),
        language: messageLanguage
      });

      if (response.success && response.data) {
        setMessages(prev => [...prev, response.data!]);
        setNewMessage('');
      } else {
        const errorMsg = response.message || 'Failed to send message';
        setError(errorMsg);
        showError(errorMsg, 'Message Failed');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to send message';
      setError(errorMsg);
      showError(errorMsg, 'Message Failed');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getLanguageIndicator = (language: 'en' | 'ne') => {
    return language === 'ne' ? '🇳🇵' : '🇺🇸';
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{participantName}</h3>
          <div className="flex items-center space-x-2">
            <p className="text-sm text-gray-600 capitalize">{participantRole.toLowerCase()}</p>
            {conversationStats && conversationStats.mixedLanguage && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                <span className="mr-1">🌐</span>
                Mixed Languages
              </span>
            )}
          </div>
          {conversationStats && (
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-gray-500">
                {conversationStats.englishMessages} EN, {conversationStats.nepaliMessages} NE
              </span>
            </div>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
            aria-label="Close conversation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
        {error && (
          <ErrorDisplay message={error} onRetry={loadConversation} />
        )}
        
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderId === user?._id;
            
            return (
              <div
                key={message._id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwnMessage
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <p className="text-sm flex-1">{message.content}</p>
                    {message.language && (
                      <span className="ml-2 text-xs opacity-75" title={getLanguageLabel(message.language)}>
                        {getLanguageIndicator(message.language)}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-xs mt-1 ${
                      isOwnMessage ? 'text-primary-100' : 'text-gray-500'
                    }`}
                  >
                    {formatMessageTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={sendMessage} className="p-4 border-t bg-gray-50 rounded-b-lg">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-xs text-gray-600">Language:</span>
          <div className="flex items-center space-x-1">
            <span className="text-sm">{getLanguageIndicator(messageLanguage)}</span>
            <span className="text-xs text-gray-600">{getLanguageLabel(messageLanguage)}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessageLanguage(messageLanguage === 'en' ? 'ne' : 'en')}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Switch
          </button>
        </div>
        <div className="flex space-x-2">
          <InputField
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Type your message in ${getLanguageLabel(messageLanguage)}...`}
            className="flex-1"
            disabled={sending}
            style={{ 
              fontFamily: messageLanguage === 'ne' ? '"Noto Sans Devanagari", sans-serif' : 'inherit'
            }}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-6"
          >
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </form>
    </div>
  );
};