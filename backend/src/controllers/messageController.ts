import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Message, ModerationFlag, User, UserRole, Farmer } from '../models';
import mongoose from 'mongoose';

// Message request interfaces
interface SendMessageRequest {
  receiverId: string;
  content: string;
  language?: 'en' | 'ne'; // Optional language specification
}

interface ModerateMessageRequest {
  moderationFlag: ModerationFlag;
}

interface MessageSearchQuery {
  conversationWith?: string;
  moderationFlag?: ModerationFlag;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

// Extended Request interfaces
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
    email: string;
  };
}

interface SendMessageAuthRequest extends AuthenticatedRequest {
  body: SendMessageRequest;
}

interface ModerateMessageAuthRequest extends AuthenticatedRequest {
  body: ModerateMessageRequest;
  params: {
    id: string;
  };
}

interface MessageSearchRequest extends AuthenticatedRequest {
  query: MessageSearchQuery & { [key: string]: any };
}

/**
 * Send a message
 * POST /api/messages
 * Requires: BUYER or FARMER role
 */
export const sendMessage = async (req: SendMessageAuthRequest, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Only buyers and farmers can send messages
    if (userRole !== UserRole.BUYER && userRole !== UserRole.FARMER) {
      res.status(403).json({
        success: false,
        message: 'Only buyers and farmers can send messages'
      });
      return;
    }

    const { receiverId, content, language } = req.body;

    // Detect language if not provided
    const messageLanguage = language || detectLanguage(content);

    // Validate receiver exists and get their role
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
      return;
    }

    // Validate messaging restrictions: only buyer-farmer communication allowed
    const senderRole = userRole;
    const receiverRole = receiver.role;

    const isValidCommunication = 
      (senderRole === UserRole.BUYER && receiverRole === UserRole.FARMER) ||
      (senderRole === UserRole.FARMER && receiverRole === UserRole.BUYER);

    if (!isValidCommunication) {
      res.status(403).json({
        success: false,
        message: 'Messages can only be sent between buyers and farmers'
      });
      return;
    }

    // Create message
    const message = new Message({
      senderId: new mongoose.Types.ObjectId(userId),
      receiverId: new mongoose.Types.ObjectId(receiverId),
      content: content.trim(),
      language: messageLanguage,
      isRead: false
    });

    await message.save();

    // Populate message data for response
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'profile.name role')
      .populate('receiver', 'profile.name role');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: populatedMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get messages (conversations or moderation queue)
 * GET /api/messages
 * Requires: Authentication (buyers/farmers see their conversations, admins see moderation queue)
 */
export const getMessages = async (req: MessageSearchRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const {
      conversationWith,
      moderationFlag,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query based on user role and parameters
    let query: any = {};

    if (userRole === UserRole.ADMIN) {
      // Admin can see moderation queue or all messages
      if (moderationFlag) {
        query.moderationFlag = moderationFlag;
      } else if (moderationFlag === undefined) {
        // Show moderation queue by default for admins
        query.$or = [
          { moderationFlag: ModerationFlag.PENDING },
          { moderationFlag: { $exists: false } }
        ];
      }
      
      // Admin can also filter by conversation
      if (conversationWith && mongoose.Types.ObjectId.isValid(conversationWith)) {
        query.$or = [
          { senderId: new mongoose.Types.ObjectId(conversationWith) },
          { receiverId: new mongoose.Types.ObjectId(conversationWith) }
        ];
      }
    } else {
      // Buyers and farmers can only see their own conversations
      if (conversationWith && mongoose.Types.ObjectId.isValid(conversationWith)) {
        // Get specific conversation
        query.$or = [
          { 
            senderId: new mongoose.Types.ObjectId(userId), 
            receiverId: new mongoose.Types.ObjectId(conversationWith) 
          },
          { 
            senderId: new mongoose.Types.ObjectId(conversationWith), 
            receiverId: new mongoose.Types.ObjectId(userId) 
          }
        ];
      } else {
        // Get all messages for this user
        query.$or = [
          { senderId: new mongoose.Types.ObjectId(userId) },
          { receiverId: new mongoose.Types.ObjectId(userId) }
        ];
      }
    }

    // Pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [messages, total] = await Promise.all([
      Message.find(query)
        .populate('sender', 'profile.name role')
        .populate('receiver', 'profile.name role')
        .populate('moderator', 'profile.name')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Message.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: messages,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get conversation between current user and another user
 * GET /api/messages/conversation/:userId
 * Requires: BUYER or FARMER role
 */
export const getConversation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId: otherUserId } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Only buyers and farmers can access conversations
    if (userRole !== UserRole.BUYER && userRole !== UserRole.FARMER) {
      res.status(403).json({
        success: false,
        message: 'Only buyers and farmers can access conversations'
      });
      return;
    }

    // Validate other user ID
    if (!otherUserId || !mongoose.Types.ObjectId.isValid(otherUserId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
      return;
    }

    // Validate other user exists and check role compatibility
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Validate messaging restrictions
    const isValidCommunication = 
      (userRole === UserRole.BUYER && otherUser.role === UserRole.FARMER) ||
      (userRole === UserRole.FARMER && otherUser.role === UserRole.BUYER);

    if (!isValidCommunication) {
      res.status(403).json({
        success: false,
        message: 'Conversations are only allowed between buyers and farmers'
      });
      return;
    }

    // Get conversation using static method
    const messages = await (Message as any).getConversation(
      new mongoose.Types.ObjectId(userId),
      new mongoose.Types.ObjectId(otherUserId),
      50, // limit
      0   // skip
    );

    // Mark messages as read for the current user
    await (Message as any).markConversationAsRead(
      new mongoose.Types.ObjectId(userId),
      new mongoose.Types.ObjectId(otherUserId)
    );

    res.json({
      success: true,
      data: messages.reverse(), // Reverse to show oldest first in conversation view
      conversation: {
        participant: {
          id: otherUser._id,
          name: otherUser.profile.name,
          role: otherUser.role
        },
        languageStats: getConversationLanguageStats(messages)
      }
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Helper method to detect message language
 */
function detectLanguage(content: string): 'en' | 'ne' {
  // Simple language detection based on character sets
  // Devanagari script range: U+0900-U+097F
  const devanagariRegex = /[\u0900-\u097F]/;
  
  if (devanagariRegex.test(content)) {
    return 'ne';
  }
  
  return 'en'; // Default to English
}

/**
 * Helper method to get language statistics for a conversation
 */
function getConversationLanguageStats(messages: any[]): {
  totalMessages: number;
  englishMessages: number;
  nepaliMessages: number;
  mixedLanguage: boolean;
} {
  const stats = {
    totalMessages: messages.length,
    englishMessages: 0,
    nepaliMessages: 0,
    mixedLanguage: false
  };
  
  messages.forEach(message => {
    if (message.language === 'en') {
      stats.englishMessages++;
    } else if (message.language === 'ne') {
      stats.nepaliMessages++;
    }
  });
  
  stats.mixedLanguage = stats.englishMessages > 0 && stats.nepaliMessages > 0;
  
  return stats;
}

/**
 * Mark message as read
 * PUT /api/messages/:id/read
 * Requires: Authentication (receiver of the message)
 */
export const markMessageAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Validate message ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid message ID'
      });
      return;
    }

    const message = await Message.findById(id);
    if (!message) {
      res.status(404).json({
        success: false,
        message: 'Message not found'
      });
      return;
    }

    // Only the receiver can mark message as read
    if (message.receiverId.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: 'Only the receiver can mark message as read'
      });
      return;
    }

    message.markAsRead();
    await message.save();

    res.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark message as read',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get unread message count
 * GET /api/messages/unread/count
 * Requires: Authentication
 */
export const getUnreadCount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const count = await (Message as any).getUnreadCount(new mongoose.Types.ObjectId(userId));

    res.json({
      success: true,
      data: {
        unreadCount: count
      }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Moderate a message (Admin only)
 * PUT /api/messages/:id/moderate
 * Requires: ADMIN role
 */
export const moderateMessage = async (req: ModerateMessageAuthRequest, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const { id } = req.params;
    const { moderationFlag } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Only admins can moderate messages
    if (userRole !== UserRole.ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Only administrators can moderate messages'
      });
      return;
    }

    // Validate message ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid message ID'
      });
      return;
    }

    const message = await Message.findById(id);
    if (!message) {
      res.status(404).json({
        success: false,
        message: 'Message not found'
      });
      return;
    }

    // Check if message can be moderated
    if (!message.canBeModerated() && moderationFlag !== ModerationFlag.PENDING) {
      res.status(400).json({
        success: false,
        message: 'Message has already been moderated'
      });
      return;
    }

    // Moderate the message
    message.moderate(new mongoose.Types.ObjectId(userId), moderationFlag);
    await message.save();

    // Populate message data for response
    await message.populate([
      { path: 'sender', select: 'profile.name role' },
      { path: 'receiver', select: 'profile.name role' },
      { path: 'moderator', select: 'profile.name' }
    ]);

    res.json({
      success: true,
      message: 'Message moderated successfully',
      data: message
    });
  } catch (error) {
    console.error('Moderate message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to moderate message',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get moderation queue (Admin only)
 * GET /api/messages/moderation/queue
 * Requires: ADMIN role
 */
export const getModerationQueue = async (req: MessageSearchRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Only admins can access moderation queue
    if (userRole !== UserRole.ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Only administrators can access moderation queue'
      });
      return;
    }

    const {
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Get moderation queue using static method
    const messages = await (Message as any).getModerationQueue(limitNum, skip);
    
    // Get total count for pagination
    const total = await Message.countDocuments({
      $or: [
        { moderationFlag: ModerationFlag.PENDING },
        { moderationFlag: { $exists: false } }
      ]
    });

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: messages,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Get moderation queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch moderation queue',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get conversation list for current user
 * GET /api/messages/conversations
 * Requires: BUYER or FARMER role
 */
export const getConversationList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Only buyers and farmers can access conversations
    if (userRole !== UserRole.BUYER && userRole !== UserRole.FARMER) {
      res.status(403).json({
        success: false,
        message: 'Only buyers and farmers can access conversations'
      });
      return;
    }

    // Get unique conversation partners
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: new mongoose.Types.ObjectId(userId) },
            { receiverId: new mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $addFields: {
          partnerId: {
            $cond: {
              if: { $eq: ['$senderId', new mongoose.Types.ObjectId(userId)] },
              then: '$receiverId',
              else: '$senderId'
            }
          }
        }
      },
      {
        $group: {
          _id: '$partnerId',
          lastMessage: { $last: '$content' },
          lastMessageDate: { $last: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: {
                if: {
                  $and: [
                    { $eq: ['$receiverId', new mongoose.Types.ObjectId(userId)] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                then: 1,
                else: 0
              }
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'partner'
        }
      },
      {
        $unwind: '$partner'
      },
      {
        $project: {
          partnerId: '$_id',
          partnerName: '$partner.profile.name',
          partnerRole: '$partner.role',
          lastMessage: 1,
          lastMessageDate: 1,
          unreadCount: 1
        }
      },
      {
        $sort: { lastMessageDate: -1 }
      }
    ]);

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Get conversation list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation list',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};