import React from 'react';
import { Review } from '../../types/api';
import { ProcessedReview } from '../../utils/reviewDataProcessor';
import { Button } from '../UI';

interface ReviewCardProps {
  review: Review | ProcessedReview;
  showReviewee?: boolean;
  showReviewer?: boolean;
  showOrderInfo?: boolean;
  showActions?: boolean;
  onEdit?: (review: Review | ProcessedReview) => void;
  onDelete?: (review: Review | ProcessedReview) => void;
  className?: string;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  showReviewee = false,
  showReviewer = true,
  showOrderInfo = false,
  showActions = false,
  onEdit,
  onDelete,
  className = ''
}) => {
  const formatDate = (dateString: string) => {
    // Use processed date if available
    if ('formattedDate' in review && 'isValidDate' in review) {
      const processedReview = review as ProcessedReview;
      if (!processedReview.isValidDate) {
        return (
          <span className="text-orange-600">
            {processedReview.formattedDate}
          </span>
        );
      }
      return processedReview.formattedDate;
    }
    
    // Fallback to manual processing
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return <span className="text-orange-600">Date unavailable</span>;
      }
      return date.toLocaleDateString([], { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      console.warn('Invalid date format:', dateString);
      return <span className="text-orange-600">Date unavailable</span>;
    }
  };

  const renderStars = (rating: number) => {
    const validRating = Math.max(0, Math.min(5, Number(rating) || 0));
    const hasValidRating = 'hasValidRating' in review ? (review as ProcessedReview).hasValidRating : validRating > 0;
    
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${
              star <= validRating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            ★
          </span>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          ({validRating}/5)
        </span>
        {!hasValidRating && (
          <span className="ml-2 text-xs text-red-600">
            ⚠️ Invalid rating
          </span>
        )}
      </div>
    );
  };

  const getStatusBadge = () => {
    const badges = [];
    
    if (!review.isApproved) {
      badges.push(
        <span key="approval" className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Pending Approval
        </span>
      );
    } else {
      badges.push(
        <span key="approval" className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Approved
        </span>
      );
    }
    
    // Add data quality indicators for ProcessedReview
    if ('hasValidComment' in review) {
      const processedReview = review as ProcessedReview;
      
      if (!processedReview.hasValidComment) {
        badges.push(
          <span key="comment" className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Invalid Comment
          </span>
        );
      }
      
      if (!processedReview.isValidDate) {
        badges.push(
          <span key="date" className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            Date Issue
          </span>
        );
      }
    }
    
    return <div className="flex flex-wrap gap-1">{badges}</div>;
  };

  const getReviewTypeInfo = () => {
    if (review.reviewerType === 'BUYER') {
      return {
        icon: '👤',
        label: 'Customer Review',
        description: showReviewer ? 'Review from buyer' : 'Your review of this farmer'
      };
    } else {
      return {
        icon: '🌾',
        label: 'Farmer Review', 
        description: showReviewee ? 'Your review of this buyer' : (showReviewer ? 'Review from farmer' : 'Review of buyer')
      };
    }
  };

  const getReviewerName = () => {
    // Use processed name if available
    if ('reviewerName' in review) {
      return (review as ProcessedReview).reviewerName;
    }
    
    // Fallback to manual extraction
    if (review.reviewer?.profile?.name) {
      return review.reviewer.profile.name;
    }
    
    return 'Anonymous User';
  };

  const getRevieweeName = () => {
    // Use processed name if available
    if ('revieweeName' in review) {
      return (review as ProcessedReview).revieweeName;
    }
    
    // Fallback to manual extraction
    if (review.reviewee?.profile?.name) {
      return review.reviewee.profile.name;
    }
    
    return 'Unknown';
  };

  const getOrderId = () => {
    if (!review.orderId) return 'Unknown';
    return review.orderId.length > 8 ? review.orderId.slice(-8) : review.orderId;
  };

  const typeInfo = getReviewTypeInfo();

  return (
    <div className={`bg-white rounded-lg border shadow-sm p-4 hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">{typeInfo.icon}</span>
            <span className="text-sm font-medium text-gray-700">{typeInfo.label}</span>
            {getStatusBadge()}
          </div>
          
          {renderStars(review.rating)}
          
          <div className="mt-2 text-sm text-gray-600">
            <span>{typeInfo.description}</span>
            {showReviewer && (
              <>
                <span className="mx-2">•</span>
                <span>From: {getReviewerName()}</span>
              </>
            )}
            {showReviewee && (
              <>
                <span className="mx-2">•</span>
                <span>To: {getRevieweeName()}</span>
              </>
            )}
            <span className="mx-2">•</span>
            <span>{formatDate(review.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-gray-900 leading-relaxed">
          {review.comment || 'No comment provided'}
        </p>
      </div>

      {/* Order reference and additional info */}
      <div className="text-xs text-gray-500 border-t pt-2 space-y-1">
        <div className="flex items-center justify-between">
          <div>
            <div>Order: #{getOrderId()}</div>
            {showOrderInfo && (
              <div className="text-gray-400 mt-1">
                This review helps build trust in the marketplace community
              </div>
            )}
          </div>
          
          {/* Action buttons for review management */}
          {showActions && (
            <div className="flex items-center space-x-2">
              {onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(review)}
                  disabled={review.isApproved} // Can't edit approved reviews
                >
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onDelete(review)}
                  disabled={review.isApproved} // Can't delete approved reviews
                >
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
        
        {showActions && review.isApproved && (
          <div className="text-yellow-600 text-xs mt-1">
            ℹ️ Approved reviews cannot be edited or deleted
          </div>
        )}
      </div>
    </div>
  );
};