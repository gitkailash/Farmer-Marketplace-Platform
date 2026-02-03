import mongoose, { Document, Schema } from 'mongoose';

// Review type enumeration
export enum ReviewerType {
  BUYER = 'BUYER',
  FARMER = 'FARMER'
}

// Review document interface
export interface IReview extends Document {
  _id: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  reviewerId: mongoose.Types.ObjectId;
  revieweeId: mongoose.Types.ObjectId;
  reviewerType: ReviewerType;
  rating: number;
  comment: string;
  isApproved: boolean;
  moderatedBy?: mongoose.Types.ObjectId;
  moderatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  canBeModerated(): boolean;
  approve(moderatorId: mongoose.Types.ObjectId): void;
  reject(moderatorId: mongoose.Types.ObjectId): void;
  
  // Virtual population
  order?: any;
  reviewer?: any;
  reviewee?: any;
  moderator?: any;
}

// Review schema definition
const reviewSchema = new Schema<IReview>({
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order ID is required'],
    index: true
  },
  reviewerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reviewer ID is required'],
    index: true
  },
  revieweeId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reviewee ID is required'],
    index: true
  },
  reviewerType: {
    type: String,
    enum: Object.values(ReviewerType),
    required: [true, 'Reviewer type is required'],
    index: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    validate: {
      validator: function(rating: number) {
        return Number.isInteger(rating) && rating >= 1 && rating <= 5;
      },
      message: 'Rating must be an integer between 1 and 5'
    }
  },
  comment: {
    type: String,
    required: [true, 'Comment is required'],
    trim: true,
    minlength: [10, 'Comment must be at least 10 characters long'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  isApproved: {
    type: Boolean,
    required: true,
    default: false,
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

// Indexes for performance and uniqueness
reviewSchema.index({ orderId: 1, reviewerId: 1, reviewerType: 1 }, { unique: true }); // One review per order per direction
reviewSchema.index({ revieweeId: 1, isApproved: 1 }); // For farmer rating calculations
reviewSchema.index({ reviewerId: 1, createdAt: -1 }); // For reviewer's review history
reviewSchema.index({ isApproved: 1, createdAt: -1 }); // For moderation queue
reviewSchema.index({ moderatedBy: 1, moderatedAt: -1 }); // For moderator activity tracking

// Virtual populate for order data
reviewSchema.virtual('order', {
  ref: 'Order',
  localField: 'orderId',
  foreignField: '_id',
  justOne: true
});

// Virtual populate for reviewer data
reviewSchema.virtual('reviewer', {
  ref: 'User',
  localField: 'reviewerId',
  foreignField: '_id',
  justOne: true
});

// Virtual populate for reviewee data
reviewSchema.virtual('reviewee', {
  ref: 'User',
  localField: 'revieweeId',
  foreignField: '_id',
  justOne: true
});

// Virtual populate for moderator data
reviewSchema.virtual('moderator', {
  ref: 'User',
  localField: 'moderatedBy',
  foreignField: '_id',
  justOne: true
});

// Instance method to check if review can be moderated
reviewSchema.methods.canBeModerated = function(): boolean {
  return !this.isApproved && !this.moderatedBy;
};

// Instance method to approve review
reviewSchema.methods.approve = function(moderatorId: mongoose.Types.ObjectId): void {
  if (this.isApproved) {
    throw new Error('Review is already approved');
  }
  
  this.isApproved = true;
  this.moderatedBy = moderatorId;
  this.moderatedAt = new Date();
};

// Instance method to reject review
reviewSchema.methods.reject = function(moderatorId: mongoose.Types.ObjectId): void {
  if (this.isApproved) {
    throw new Error('Cannot reject an approved review');
  }
  
  this.moderatedBy = moderatorId;
  this.moderatedAt = new Date();
  // Note: isApproved remains false for rejected reviews
};

// Pre-save middleware to validate business rules
reviewSchema.pre('save', async function(next) {
  try {
    // Ensure reviewer and reviewee are different
    if (this.reviewerId.equals(this.revieweeId)) {
      return next(new Error('Reviewer and reviewee cannot be the same'));
    }

    // Validate that the order exists and is completed
    if (this.isNew) {
      const Order = mongoose.model('Order');
      const order = await Order.findById(this.orderId);
      
      if (!order) {
        return next(new Error('Order not found'));
      }
      
      if (order.status !== 'COMPLETED') {
        return next(new Error('Reviews can only be created for completed orders'));
      }
      
      // Validate reviewer is part of the order
      // For BUYER: reviewerId should match order.buyerId (both are User IDs)
      // For FARMER: reviewerId should match the farmer's userId (need to look up farmer)
      let isValidReviewer = false;
      
      if (this.reviewerType === ReviewerType.BUYER) {
        // Buyer review - reviewerId should match buyerId
        if (order.buyerId.equals(this.reviewerId)) {
          isValidReviewer = true;
        }
      } else if (this.reviewerType === ReviewerType.FARMER) {
        // Farmer review - need to get farmer's userId
        const Farmer = mongoose.model('Farmer');
        const farmer = await Farmer.findById(order.farmerId);
        if (farmer && farmer.userId.equals(this.reviewerId)) {
          isValidReviewer = true;
        }
      }
      
      if (!isValidReviewer) {
        return next(new Error('Reviewer must be part of the order'));
      }
      
      // Validate reviewee is the other party in the order
      // For BUYER reviewing FARMER: revieweeId should be the farmer's userId
      // For FARMER reviewing BUYER: revieweeId should be the buyer's userId (buyerId is already a User ID)
      let isValidReviewee = false;
      
      if (this.reviewerType === ReviewerType.BUYER) {
        // Buyer is reviewing farmer - need to get farmer's userId
        const Farmer = mongoose.model('Farmer');
        const farmer = await Farmer.findById(order.farmerId);
        if (farmer && farmer.userId.equals(this.revieweeId)) {
          isValidReviewee = true;
        }
      } else if (this.reviewerType === ReviewerType.FARMER) {
        // Farmer is reviewing buyer - buyerId is already a User ID
        if (order.buyerId.equals(this.revieweeId)) {
          isValidReviewee = true;
        }
      }
      
      if (!isValidReviewee) {
        return next(new Error('Reviewee must be the other party in the order'));
      }
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Post-save middleware to update farmer ratings
reviewSchema.post('save', async function(doc) {
  try {
    // Only update ratings for approved farmer reviews
    if (doc.isApproved && doc.reviewerType === ReviewerType.BUYER) {
      await updateFarmerRating(doc.revieweeId);
    }
  } catch (error) {
    console.error('Error updating farmer rating:', error);
  }
});

// Post-findOneAndUpdate middleware to handle rating updates
reviewSchema.post('findOneAndUpdate', async function(doc) {
  try {
    if (doc && doc.reviewerType === ReviewerType.BUYER) {
      await updateFarmerRating(doc.revieweeId);
    }
  } catch (error) {
    console.error('Error updating farmer rating after update:', error);
  }
});

// Helper function to update farmer ratings
async function updateFarmerRating(farmerId: mongoose.Types.ObjectId): Promise<void> {
  try {
    const Review = mongoose.model('Review');
    const Farmer = mongoose.model('Farmer');
    
    // Calculate new rating from approved reviews
    const reviews = await Review.find({
      revieweeId: farmerId,
      reviewerType: ReviewerType.BUYER,
      isApproved: true
    });
    
    if (reviews.length === 0) {
      // No approved reviews, set default values
      await Farmer.findOneAndUpdate(
        { userId: farmerId },
        { 
          rating: 0,
          reviewCount: 0
        }
      );
      return;
    }
    
    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = Math.round((totalRating / reviews.length) * 10) / 10; // Round to 1 decimal place
    
    // Update farmer rating and review count
    await Farmer.findOneAndUpdate(
      { userId: farmerId },
      { 
        rating: averageRating,
        reviewCount: reviews.length
      }
    );
  } catch (error) {
    console.error('Error in updateFarmerRating:', error);
  }
}

// Static method to get reviews with visibility controls
reviewSchema.statics.getVisibleReviews = async function(
  query: any = {},
  userRole?: string,
  userId?: string
): Promise<IReview[]> {
  const baseQuery = { ...query };
  
  // Apply visibility rules
  if (userRole === 'ADMIN') {
    // Admins can see all reviews
  } else if (userRole === 'FARMER' && userId) {
    // Farmers can see approved farmer reviews (public) and all buyer reviews about them
    baseQuery.$or = [
      { reviewerType: ReviewerType.FARMER, isApproved: true },
      { revieweeId: new mongoose.Types.ObjectId(userId) }
    ];
  } else {
    // Public users can only see approved farmer reviews
    baseQuery.reviewerType = ReviewerType.FARMER;
    baseQuery.isApproved = true;
  }
  
  return this.find(baseQuery)
    .populate('reviewer', 'profile.name')
    .populate('reviewee', 'profile.name')
    .populate('order', 'createdAt totalAmount')
    .sort({ createdAt: -1 });
};

// Static method to check if user can review an order
reviewSchema.statics.canUserReviewOrder = async function(
  orderId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId,
  reviewerType: ReviewerType
): Promise<boolean> {
  try {
    // Check if review already exists
    const existingReview = await this.findOne({
      orderId,
      reviewerId: userId,
      reviewerType
    });
    
    if (existingReview) {
      return false; // Review already exists
    }
    
    // Check if order is completed
    const Order = mongoose.model('Order');
    const order = await Order.findById(orderId);
    
    if (!order || order.status !== 'COMPLETED') {
      return false; // Order not found or not completed
    }
    
    // Check if user is part of the order
    // For BUYER: userId should match order.buyerId
    // For FARMER: userId should match the farmer's userId (need to look up farmer)
    let isValidReviewer = false;
    
    if (reviewerType === ReviewerType.BUYER) {
      // Buyer review - userId should match buyerId
      if (order.buyerId.equals(userId)) {
        isValidReviewer = true;
      }
    } else if (reviewerType === ReviewerType.FARMER) {
      // Farmer review - need to get farmer's userId
      const Farmer = mongoose.model('Farmer');
      const farmer = await Farmer.findById(order.farmerId);
      if (farmer && farmer.userId.equals(userId)) {
        isValidReviewer = true;
      }
    }
    
    return isValidReviewer;
  } catch (error) {
    console.error('Error checking review eligibility:', error);
    return false;
  }
};

// Create and export the Review model
export const Review = mongoose.model<IReview>('Review', reviewSchema);