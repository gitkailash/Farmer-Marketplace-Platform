import { Review } from '../types/api';

/**
 * Processed review data with consistent structure
 */
export interface ProcessedReview extends Review {
  // Ensure all fields have fallback values
  reviewerName: string;
  revieweeName: string;
  formattedDate: string;
  isValidDate: boolean;
  hasValidRating: boolean;
  hasValidComment: boolean;
}

/**
 * Review summary data with statistics
 */
export interface ReviewSummary {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Array<{
    stars: number;
    count: number;
    percentage: number;
  }>;
  approvedCount: number;
  pendingCount: number;
}

/**
 * Options for processing review data
 */
export interface ProcessingOptions {
  includeUnapproved?: boolean;
  fallbackReviewerName?: string;
  fallbackRevieweeName?: string;
  validateDates?: boolean;
  logInconsistencies?: boolean;
}

/**
 * Default processing options
 */
const DEFAULT_OPTIONS: ProcessingOptions = {
  includeUnapproved: true,
  fallbackReviewerName: 'Anonymous User',
  fallbackRevieweeName: 'Unknown',
  validateDates: true,
  logInconsistencies: true,
};

/**
 * Safely extracts user ID from string or object reference
 */
export const extractUserId = (userRef: any): string => {
  if (typeof userRef === 'string') {
    return userRef;
  }
  
  if (userRef && typeof userRef === 'object') {
    return userRef._id || userRef.id || '';
  }
  
  return '';
};

/**
 * Safely extracts user name from user reference
 */
export const extractUserName = (userRef: any, fallback: string = 'Anonymous User'): string => {
  // Handle direct string name
  if (typeof userRef === 'string') {
    return userRef;
  }
  
  // Handle object with profile
  if (userRef && typeof userRef === 'object') {
    // Try profile.name first
    if (userRef.profile && userRef.profile.name) {
      return userRef.profile.name;
    }
    
    // Try direct name property
    if (userRef.name) {
      return userRef.name;
    }
    
    // Try email as fallback
    if (userRef.email) {
      return userRef.email.split('@')[0]; // Use part before @ as name
    }
  }
  
  return fallback;
};

/**
 * Validates and formats date string
 */
export const processReviewDate = (dateValue: any): { formattedDate: string; isValidDate: boolean } => {
  if (!dateValue) {
    return {
      formattedDate: 'Date unavailable',
      isValidDate: false,
    };
  }
  
  try {
    const date = new Date(dateValue);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return {
        formattedDate: 'Invalid date',
        isValidDate: false,
      };
    }
    
    // Check if date is reasonable (not too far in past/future)
    const now = new Date();
    const yearsDiff = Math.abs(now.getFullYear() - date.getFullYear());
    
    if (yearsDiff > 10) {
      return {
        formattedDate: 'Date unavailable',
        isValidDate: false,
      };
    }
    
    return {
      formattedDate: date.toLocaleDateString([], {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      isValidDate: true,
    };
  } catch (error) {
    return {
      formattedDate: 'Date unavailable',
      isValidDate: false,
    };
  }
};

/**
 * Validates rating value
 */
export const validateRating = (rating: any): { rating: number; isValid: boolean } => {
  const numRating = Number(rating);
  
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    return { rating: 0, isValid: false };
  }
  
  return { rating: Math.round(numRating), isValid: true };
};

/**
 * Validates comment content
 */
export const validateComment = (comment: any): { comment: string; isValid: boolean } => {
  if (typeof comment !== 'string') {
    return { comment: '', isValid: false };
  }
  
  const trimmedComment = comment.trim();
  
  if (trimmedComment.length === 0) {
    return { comment: '', isValid: false };
  }
  
  return { comment: trimmedComment, isValid: true };
};

/**
 * Processes a single review object to ensure consistent structure
 */
export const processSingleReview = (
  rawReview: any,
  options: ProcessingOptions = {}
): ProcessedReview | null => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Validate basic structure
  if (!rawReview || typeof rawReview !== 'object') {
    if (opts.logInconsistencies) {
      console.warn('Invalid review object:', rawReview);
    }
    return null;
  }
  
  // Extract and validate ID
  const reviewId = rawReview._id || rawReview.id;
  if (!reviewId) {
    if (opts.logInconsistencies) {
      console.warn('Review missing ID:', rawReview);
    }
    return null;
  }
  
  // Process user references
  const reviewerId = extractUserId(rawReview.reviewerId);
  const revieweeId = extractUserId(rawReview.revieweeId);
  
  // Extract user names with fallbacks
  const reviewerName = extractUserName(
    rawReview.reviewer || rawReview.reviewerId,
    opts.fallbackReviewerName
  );
  const revieweeName = extractUserName(
    rawReview.reviewee || rawReview.revieweeId,
    opts.fallbackRevieweeName
  );
  
  // Process date
  const { formattedDate, isValidDate } = processReviewDate(rawReview.createdAt);
  
  // Validate rating
  const { rating, isValid: hasValidRating } = validateRating(rawReview.rating);
  
  // Validate comment
  const { comment, isValid: hasValidComment } = validateComment(rawReview.comment);
  
  // Log inconsistencies if enabled
  if (opts.logInconsistencies) {
    const issues: string[] = [];
    
    if (!reviewerId) issues.push('missing reviewerId');
    if (!revieweeId) issues.push('missing revieweeId');
    if (!isValidDate) issues.push('invalid date');
    if (!hasValidRating) issues.push('invalid rating');
    if (!hasValidComment) issues.push('invalid comment');
    
    if (issues.length > 0) {
      console.warn(`Review ${reviewId} has issues:`, issues.join(', '));
    }
  }
  
  // Create processed review
  const processedReview: ProcessedReview = {
    _id: reviewId,
    orderId: rawReview.orderId || '',
    reviewerId,
    revieweeId,
    reviewerType: rawReview.reviewerType || 'BUYER',
    rating,
    comment,
    isApproved: Boolean(rawReview.isApproved),
    moderatedBy: rawReview.moderatedBy || undefined,
    createdAt: rawReview.createdAt || new Date().toISOString(),
    
    // Processed user references
    reviewer: rawReview.reviewer || (typeof rawReview.reviewerId === 'object' ? rawReview.reviewerId : undefined),
    reviewee: rawReview.reviewee || (typeof rawReview.revieweeId === 'object' ? rawReview.revieweeId : undefined),
    order: rawReview.order || undefined,
    
    // Additional processed fields
    reviewerName,
    revieweeName,
    formattedDate,
    isValidDate,
    hasValidRating,
    hasValidComment,
  };
  
  return processedReview;
};

/**
 * Processes an array of review objects
 */
export const processReviewArray = (
  rawReviews: any,
  options: ProcessingOptions = {}
): ProcessedReview[] => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Validate input
  if (!Array.isArray(rawReviews)) {
    if (opts.logInconsistencies) {
      console.warn('Expected reviews array, got:', typeof rawReviews);
    }
    return [];
  }
  
  // Process each review
  const processedReviews: ProcessedReview[] = [];
  
  for (const rawReview of rawReviews) {
    const processed = processSingleReview(rawReview, opts);
    
    if (processed) {
      // Filter by approval status if needed
      if (!opts.includeUnapproved && !processed.isApproved) {
        continue;
      }
      
      processedReviews.push(processed);
    }
  }
  
  return processedReviews;
};

/**
 * Calculates review summary statistics
 */
export const calculateReviewSummary = (reviews: ProcessedReview[]): ReviewSummary => {
  const totalReviews = reviews.length;
  
  if (totalReviews === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: [1, 2, 3, 4, 5].map(stars => ({
        stars,
        count: 0,
        percentage: 0,
      })),
      approvedCount: 0,
      pendingCount: 0,
    };
  }
  
  // Calculate average rating (only from valid ratings)
  const validRatings = reviews.filter(r => r.hasValidRating && r.rating > 0);
  const totalRating = validRatings.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = validRatings.length > 0 ? totalRating / validRatings.length : 0;
  
  // Calculate rating distribution
  const ratingDistribution = [1, 2, 3, 4, 5].map(stars => {
    const count = reviews.filter(review => review.rating === stars).length;
    const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
    
    return {
      stars,
      count,
      percentage,
    };
  });
  
  // Count approval status
  const approvedCount = reviews.filter(r => r.isApproved).length;
  const pendingCount = totalReviews - approvedCount;
  
  return {
    totalReviews,
    averageRating,
    ratingDistribution,
    approvedCount,
    pendingCount,
  };
};

/**
 * Processes review data and returns both reviews and summary
 */
export const processReviewData = (
  rawReviews: any,
  options: ProcessingOptions = {}
): { reviews: ProcessedReview[]; summary: ReviewSummary } => {
  const reviews = processReviewArray(rawReviews, options);
  const summary = calculateReviewSummary(reviews);
  
  return { reviews, summary };
};

/**
 * Utility to check if a review can be displayed safely
 */
export const canDisplayReview = (review: ProcessedReview): boolean => {
  return (
    Boolean(review._id) &&
    Boolean(review.reviewerName) &&
    review.hasValidRating &&
    review.hasValidComment &&
    review.comment.length > 0
  );
};

/**
 * Utility to get display-safe review data
 */
export const getDisplaySafeReviews = (reviews: ProcessedReview[]): ProcessedReview[] => {
  return reviews.filter(canDisplayReview);
};

/**
 * Utility to handle malformed review data gracefully
 */
export const handleMalformedReviewData = (data: any): { reviews: ProcessedReview[]; errors: string[] } => {
  const errors: string[] = [];
  
  try {
    // Handle various response formats
    let reviewsData: any;
    
    if (Array.isArray(data)) {
      reviewsData = data;
    } else if (data && data.reviews && Array.isArray(data.reviews)) {
      reviewsData = data.reviews;
    } else if (data && data.data && Array.isArray(data.data)) {
      reviewsData = data.data;
    } else if (data && data.data && data.data.reviews && Array.isArray(data.data.reviews)) {
      reviewsData = data.data.reviews;
    } else {
      errors.push('Unable to extract reviews array from response');
      return { reviews: [], errors };
    }
    
    const reviews = processReviewArray(reviewsData, {
      logInconsistencies: true,
      includeUnapproved: true,
    });
    
    return { reviews, errors };
  } catch (error) {
    errors.push(`Error processing review data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { reviews: [], errors };
  }
};