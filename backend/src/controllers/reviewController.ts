import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Review, ReviewerType, Order, OrderStatus, User, UserRole, Farmer } from '../models';
import mongoose from 'mongoose';

// Review request interfaces
interface CreateReviewRequest {
  orderId: string;
  revieweeId: string;
  reviewerType: ReviewerType;
  rating: number;
  comment: string;
}

interface ModerateReviewRequest {
  action: 'approve' | 'reject';
}

interface ReviewSearchQuery {
  revieweeId?: string;
  reviewerId?: string;
  reviewerType?: ReviewerType;
  isApproved?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'rating' | 'moderatedAt';
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

interface CreateReviewAuthRequest extends AuthenticatedRequest {
  body: CreateReviewRequest;
}

interface ModerateReviewAuthRequest extends AuthenticatedRequest {
  body: ModerateReviewRequest;
  params: {
    id: string;
  };
}

interface ReviewSearchRequest extends AuthenticatedRequest {
  query: ReviewSearchQuery & { [key: string]: any };
}

/**
 * Create a new review
 * POST /api/reviews
 * Requires: BUYER or FARMER role
 */
export const createReview = async (req: CreateReviewAuthRequest, res: Response): Promise<void> => {
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

    // Verify user can create reviews
    if (userRole !== UserRole.BUYER && userRole !== UserRole.FARMER) {
      res.status(403).json({
        success: false,
        message: 'Only buyers and farmers can create reviews'
      });
      return;
    }

    const { orderId, revieweeId, reviewerType, rating, comment } = req.body;

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(orderId) || !mongoose.Types.ObjectId.isValid(revieweeId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid order ID or reviewee ID'
      });
      return;
    }

    // Validate reviewer type matches user role
    if ((userRole === UserRole.BUYER && reviewerType !== ReviewerType.BUYER) ||
        (userRole === UserRole.FARMER && reviewerType !== ReviewerType.FARMER)) {
      res.status(400).json({
        success: false,
        message: 'Reviewer type must match user role'
      });
      return;
    }

    // Check if user can review this order
    const canReview = await (Review as any).canUserReviewOrder(
      new mongoose.Types.ObjectId(orderId),
      new mongoose.Types.ObjectId(userId),
      reviewerType
    );

    if (!canReview) {
      res.status(400).json({
        success: false,
        message: 'You cannot review this order. Order may not be completed, review may already exist, or you may not be part of this order.'
      });
      return;
    }

    // Validate reviewee exists
    const reviewee = await User.findById(revieweeId);
    if (!reviewee) {
      res.status(404).json({
        success: false,
        message: 'Reviewee not found'
      });
      return;
    }

    // Create review
    const review = new Review({
      orderId: new mongoose.Types.ObjectId(orderId),
      reviewerId: new mongoose.Types.ObjectId(userId),
      revieweeId: new mongoose.Types.ObjectId(revieweeId),
      reviewerType,
      rating,
      comment,
      isApproved: false // Reviews require admin approval
    });

    await review.save();

    // Populate review data for response
    await review.populate([
      { path: 'reviewer', select: 'profile.name email' },
      { path: 'reviewee', select: 'profile.name email' },
      { path: 'order', select: 'createdAt totalAmount status' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Review created successfully and is pending approval',
      data: review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create review',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get reviews with filtering and pagination
 * GET /api/reviews
 * Public endpoint with visibility controls
 */
export const getReviews = async (req: ReviewSearchRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    const {
      revieweeId,
      reviewerId,
      reviewerType,
      isApproved,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build base query
    const query: any = {};

    if (revieweeId && mongoose.Types.ObjectId.isValid(revieweeId)) {
      query.revieweeId = new mongoose.Types.ObjectId(revieweeId);
    }

    if (reviewerId && mongoose.Types.ObjectId.isValid(reviewerId)) {
      query.reviewerId = new mongoose.Types.ObjectId(reviewerId);
    }

    if (reviewerType) {
      query.reviewerType = reviewerType;
    }

    // Apply approval filter based on user role and request
    if (userRole === UserRole.ADMIN) {
      // Admin can see all reviews, filter by isApproved if specified
      if (isApproved !== undefined) {
        const approvedValue = typeof isApproved === 'string' ? isApproved === 'true' : isApproved;
        query.isApproved = approvedValue;
      }
    } else {
      // Apply visibility rules for non-admin users
      if (userRole === UserRole.FARMER && userId) {
        // Farmers can see approved farmer reviews (public) and all buyer reviews about them
        const farmerQuery = {
          $or: [
            { reviewerType: ReviewerType.FARMER, isApproved: true },
            { revieweeId: new mongoose.Types.ObjectId(userId) }
          ]
        };
        
        // Combine with existing query
        if (Object.keys(query).length > 0) {
          query.$and = [query, farmerQuery];
        } else {
          Object.assign(query, farmerQuery);
        }
      } else {
        // Public users can only see approved farmer reviews
        query.reviewerType = ReviewerType.FARMER;
        query.isApproved = true;
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
    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('reviewer', 'profile.name')
        .populate('reviewee', 'profile.name')
        .populate('order', 'createdAt totalAmount')
        .populate('moderator', 'profile.name')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Review.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: reviews,
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
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get a single review by ID
 * GET /api/reviews/:id
 * Visibility controls apply
 */
export const getReviewById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // Validate ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid review ID'
      });
      return;
    }

    const review = await Review.findById(id)
      .populate('reviewer', 'profile.name email')
      .populate('reviewee', 'profile.name email')
      .populate('order', 'createdAt totalAmount status')
      .populate('moderator', 'profile.name');

    if (!review) {
      res.status(404).json({
        success: false,
        message: 'Review not found'
      });
      return;
    }

    // Check visibility permissions
    let canView = false;

    if (userRole === UserRole.ADMIN) {
      canView = true;
    } else if (review.reviewerType === ReviewerType.FARMER && review.isApproved) {
      // Approved farmer reviews are public
      canView = true;
    } else if (userRole === UserRole.FARMER && userId && review.revieweeId.toString() === userId) {
      // Farmers can see buyer reviews about them
      canView = true;
    } else if (userId && (review.reviewerId.toString() === userId || review.revieweeId.toString() === userId)) {
      // Users can see their own reviews
      canView = true;
    }

    if (!canView) {
      res.status(404).json({
        success: false,
        message: 'Review not found'
      });
      return;
    }

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Get review by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Moderate a review (approve or reject)
 * PUT /api/reviews/:id/moderate
 * Requires: ADMIN role
 */
export const moderateReview = async (req: ModerateReviewAuthRequest, res: Response): Promise<void> => {
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
    const { action } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Verify admin role
    if (userRole !== UserRole.ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Only administrators can moderate reviews'
      });
      return;
    }

    // Validate ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid review ID'
      });
      return;
    }

    const review = await Review.findById(id);
    if (!review) {
      res.status(404).json({
        success: false,
        message: 'Review not found'
      });
      return;
    }

    // Check if review can be moderated
    if (!review.canBeModerated() && action === 'approve') {
      res.status(400).json({
        success: false,
        message: 'Review has already been moderated'
      });
      return;
    }

    // Perform moderation action
    try {
      const moderatorId = new mongoose.Types.ObjectId(userId);
      
      if (action === 'approve') {
        review.approve(moderatorId);
      } else if (action === 'reject') {
        review.reject(moderatorId);
      } else {
        res.status(400).json({
          success: false,
          message: 'Invalid action. Must be "approve" or "reject"'
        });
        return;
      }

      await review.save();
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Moderation failed'
      });
      return;
    }

    // Populate review data for response
    await review.populate([
      { path: 'reviewer', select: 'profile.name email' },
      { path: 'reviewee', select: 'profile.name email' },
      { path: 'order', select: 'createdAt totalAmount status' },
      { path: 'moderator', select: 'profile.name' }
    ]);

    res.json({
      success: true,
      message: `Review ${action}d successfully`,
      data: review
    });
  } catch (error) {
    console.error('Moderate review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to moderate review',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get reviews for a specific farmer (public endpoint)
 * GET /api/reviews/farmer/:farmerId
 * Returns only approved farmer reviews
 */
export const getFarmerReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { farmerId } = req.params;
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Validate ObjectId
    if (!farmerId || !mongoose.Types.ObjectId.isValid(farmerId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid farmer ID'
      });
      return;
    }

    // Find farmer to get user ID
    const farmer = await Farmer.findById(farmerId);
    if (!farmer) {
      res.status(404).json({
        success: false,
        message: 'Farmer not found'
      });
      return;
    }

    // Build query for approved buyer reviews about this farmer
    const query = {
      revieweeId: farmer.userId,
      reviewerType: ReviewerType.BUYER,
      isApproved: true
    };

    // Pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('reviewer', 'profile.name')
        .populate('order', 'createdAt')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Review.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    // Calculate rating summary
    const ratingCounts: number[] = [0, 0, 0, 0, 0]; // Index 0 = 1 star, Index 4 = 5 stars
    reviews.forEach((review: any) => {
      const rating = review?.rating;
      if (rating && typeof rating === 'number' && rating >= 1 && rating <= 5) {
        const index = rating - 1;
        (ratingCounts as any)[index]++;
      }
    });

    res.json({
      success: true,
      data: {
        reviews,
        summary: {
          totalReviews: total,
          averageRating: farmer.rating,
          ratingDistribution: ratingCounts.map((count, index) => ({
            stars: index + 1,
            count
          }))
        }
      },
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
    console.error('Get farmer reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch farmer reviews',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get pending reviews for moderation
 * GET /api/reviews/pending
 * Requires: ADMIN role
 */
export const getPendingReviews = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    // Verify admin role
    if (userRole !== UserRole.ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Only administrators can view pending reviews'
      });
      return;
    }

    const { page = 1, limit = 20 } = req.query;

    // Pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Query for pending reviews (not approved and not moderated)
    const query = {
      isApproved: false,
      moderatedBy: { $exists: false }
    };

    // Execute query
    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('reviewer', 'profile.name email')
        .populate('reviewee', 'profile.name email')
        .populate('order', 'createdAt totalAmount')
        .sort({ createdAt: 1 }) // Oldest first for moderation queue
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Review.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: reviews,
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
    console.error('Get pending reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending reviews',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get user's review history
 * GET /api/reviews/my-reviews
 * Requires: Authentication
 */
export const getMyReviews = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    const { page = 1, limit = 20, type = 'given' } = req.query;

    // Pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build query based on type
    let query: any = {};
    
    if (type === 'given') {
      // Reviews given by the user
      query.reviewerId = new mongoose.Types.ObjectId(userId);
    } else if (type === 'received') {
      // Reviews received by the user
      query.revieweeId = new mongoose.Types.ObjectId(userId);
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid type. Must be "given" or "received"'
      });
      return;
    }

    // Execute query
    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('reviewer', 'profile.name')
        .populate('reviewee', 'profile.name')
        .populate('order', 'createdAt totalAmount')
        .populate('moderator', 'profile.name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Review.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: reviews,
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
    console.error('Get my reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user reviews',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};