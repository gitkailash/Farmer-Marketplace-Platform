import mongoose, { Document, Schema } from 'mongoose';

// Moderation flag enumeration
export enum ModerationFlag {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

// Message document interface
export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  content: string;
  language: 'en' | 'ne'; // Language the message was written in
  isRead: boolean;
  moderationFlag?: ModerationFlag;
  moderatedBy?: mongoose.Types.ObjectId;
  moderatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  markAsRead(): void;
  canBeModerated(): boolean;
  moderate(adminId: mongoose.Types.ObjectId, flag: ModerationFlag): void;
  getDisplayContent(preferredLanguage?: 'en' | 'ne'): string;
  
  // Virtual population
  sender?: any;
  receiver?: any;
  moderator?: any;
}

// Message schema definition
const messageSchema = new Schema<IMessage>({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender ID is required'],
    index: true
  },
  receiverId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Receiver ID is required'],
    index: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    minlength: [1, 'Message content cannot be empty'],
    maxlength: [2000, 'Message content cannot exceed 2000 characters']
  },
  language: {
    type: String,
    enum: ['en', 'ne'],
    required: [true, 'Message language is required'],
    default: 'en',
    index: true
  },
  isRead: {
    type: Boolean,
    required: true,
    default: false,
    index: true
  },
  moderationFlag: {
    type: String,
    enum: Object.values(ModerationFlag),
    index: true
  },
  moderatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  moderatedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance and queries
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 }); // Conversation history
messageSchema.index({ receiverId: 1, isRead: 1 }); // Unread messages
messageSchema.index({ moderationFlag: 1, createdAt: -1 }); // Admin moderation queue
messageSchema.index({ createdAt: -1 }); // Recent messages
messageSchema.index({ senderId: 1, createdAt: -1 }); // Sender's message history
messageSchema.index({ receiverId: 1, createdAt: -1 }); // Receiver's message history

// Virtual populate for sender data
messageSchema.virtual('sender', {
  ref: 'User',
  localField: 'senderId',
  foreignField: '_id',
  justOne: true
});

// Virtual populate for receiver data
messageSchema.virtual('receiver', {
  ref: 'User',
  localField: 'receiverId',
  foreignField: '_id',
  justOne: true
});

// Virtual populate for moderator data
messageSchema.virtual('moderator', {
  ref: 'User',
  localField: 'moderatedBy',
  foreignField: '_id',
  justOne: true
});

// Instance method to get display content based on language preference
messageSchema.methods.getDisplayContent = function(preferredLanguage?: 'en' | 'ne'): string {
  // Always return the original content as messages preserve their original language
  return this.content;
};

// Instance method to mark message as read
messageSchema.methods.markAsRead = function(): void {
  this.isRead = true;
};

// Instance method to check if message can be moderated
messageSchema.methods.canBeModerated = function(): boolean {
  return !this.moderationFlag || this.moderationFlag === ModerationFlag.PENDING;
};

// Instance method to moderate message
messageSchema.methods.moderate = function(adminId: mongoose.Types.ObjectId, flag: ModerationFlag): void {
  if (!this.canBeModerated() && flag !== ModerationFlag.PENDING) {
    throw new Error('Message has already been moderated');
  }
  
  this.moderationFlag = flag;
  this.moderatedBy = adminId;
  this.moderatedAt = new Date();
};

// Pre-save middleware to validate business rules
messageSchema.pre('save', function(next) {
  try {
    // Ensure sender and receiver are different
    if (this.senderId.equals(this.receiverId)) {
      return next(new Error('Sender and receiver cannot be the same'));
    }

    // Validate moderation data consistency
    if (this.moderationFlag && !this.moderatedBy) {
      return next(new Error('Moderated messages must have a moderator'));
    }

    if (this.moderatedBy && !this.moderationFlag) {
      return next(new Error('Messages with moderator must have moderation flag'));
    }

    // Set moderation timestamp if flag is set but timestamp is missing
    if (this.moderationFlag && !this.moderatedAt) {
      this.moderatedAt = new Date();
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Static method to get conversation between two users
messageSchema.statics.getConversation = function(
  userId1: mongoose.Types.ObjectId, 
  userId2: mongoose.Types.ObjectId,
  limit: number = 50,
  skip: number = 0
) {
  return this.find({
    $or: [
      { senderId: userId1, receiverId: userId2 },
      { senderId: userId2, receiverId: userId1 }
    ]
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(skip)
  .populate('sender', 'profile.name role')
  .populate('receiver', 'profile.name role');
};

// Static method to get unread message count for a user
messageSchema.statics.getUnreadCount = function(userId: mongoose.Types.ObjectId) {
  return this.countDocuments({
    receiverId: userId,
    isRead: false
  });
};

// Static method to mark conversation as read
messageSchema.statics.markConversationAsRead = function(
  receiverId: mongoose.Types.ObjectId,
  senderId: mongoose.Types.ObjectId
) {
  return this.updateMany(
    {
      receiverId: receiverId,
      senderId: senderId,
      isRead: false
    },
    {
      $set: { isRead: true }
    }
  );
};

// Static method to get messages requiring moderation
messageSchema.statics.getModerationQueue = function(limit: number = 50, skip: number = 0) {
  return this.find({
    $or: [
      { moderationFlag: ModerationFlag.PENDING },
      { moderationFlag: { $exists: false } }
    ]
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(skip)
  .populate('sender', 'profile.name role')
  .populate('receiver', 'profile.name role');
};

// Create and export the Message model
export const Message = mongoose.model<IMessage>('Message', messageSchema);