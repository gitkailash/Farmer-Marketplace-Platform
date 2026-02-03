import React, { useState, useEffect, useCallback } from 'react';
import { reviewService } from '../../services/reviewService';
import { ReviewCard } from './ReviewCard';
import { LoadingSpinner, ErrorDisplay, EmptyState } from '../UI';
import { 
  processReviewArray, 
  handleMalformedReviewData,
  ProcessedReview,
  getDisplaySafeReviews
} from '../../utils/reviewDataProcessor';

interface ReviewListProps {
  type: 'my-reviews' | 'received-reviews' | 'farmer-reviews';
  farmerId?: string; // Required for farmer-reviews type
  title?: string;
  emptyMessage?: string;
  className?: string;
  reviews?: ProcessedReview[]; // Allow passing pre-loaded reviews
  loading?: boolean; // Allow external loading state
  error?: string | null; // Allow external error state
  onRetry?: () => void; // Allow external retry handler
}

export const ReviewList: React.FC<ReviewListProps> = ({
  type,
  farmerId,
  title,
  emptyMessage,
  className = '',
  reviews: externalReviews,
  loading: externalLoading,
  error: externalError,
  onRetry: externalOnRetry
}) => {
  const [reviews, setReviews] = useState<ProcessedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [processingErrors, setProcessingErrors] = useState<string[]>([]);

  // Use external state if provided, otherwise use internal state
  const currentReviews = externalReviews !== undefined ? externalReviews : reviews;
  const currentLoading = externalLoading !== undefined ? externalLoading : loading;
  const currentError = externalError !== undefined ? externalError : error;

  useEffect(() => {
    // Only load reviews if external data is not provided
    if (externalReviews === undefined) {
      loadReviews();
    } else {
      setLoading(false);
    }
  }, [type, farmerId, externalReviews]);

  const processReviewData = useCallback((rawReviews: any[]): ProcessedReview[] => {
    const { reviews, errors } = handleMalformedReviewData(rawReviews)
    
    if (errors.length > 0) {
      setProcessingErrors(errors)
      console.warn('Review data processing errors:', errors)
    }
    
    return processReviewArray(reviews, {
      includeUnapproved: true,
      logInconsistencies: true,
      validateDates: true,
    })
  }, [])

  const loadReviews = useCallback(async (isRetry = false) => {
    try {
      setLoading(true);
      if (!isRetry) {
        setError(null);
        setRetryCount(0);
        setProcessingErrors([]);
      }
      
      let response;
      switch (type) {
        case 'my-reviews':
          response = await reviewService.getMyReviews('given');
          break;
        case 'received-reviews':
          response = await reviewService.getMyReviews('received');
          break;
        case 'farmer-reviews':
          if (!farmerId) {
            throw new Error('Farmer ID is required for farmer reviews');
          }
          // For now, we'll use the received reviews approach
          // In a real implementation, you'd need to modify this
          response = await reviewService.getMyReviews('received');
          break;
        default:
          throw new Error('Invalid review type');
      }
      
      if (response.success && response.data) {
        const processedReviews = processReviewData(response.data);
        setReviews(processedReviews);
        setError(null);
      } else {
        const errorMessage = response.message || 'Failed to load reviews';
        setError(errorMessage);
        console.error('Review loading failed:', errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load reviews';
      setError(errorMessage);
      console.error('Review loading error:', err);
    } finally {
      setLoading(false);
    }
  }, [type, farmerId, processReviewData]);

  const handleRetry = useCallback(() => {
    if (externalOnRetry) {
      externalOnRetry();
    } else {
      setRetryCount(prev => prev + 1);
      loadReviews(true);
    }
  }, [externalOnRetry, loadReviews]);

  const getDefaultTitle = () => {
    switch (type) {
      case 'my-reviews':
        return 'My Reviews';
      case 'received-reviews':
        return 'Reviews About Me';
      case 'farmer-reviews':
        return 'Customer Reviews';
      default:
        return 'Reviews';
    }
  };

  const getDefaultEmptyMessage = () => {
    switch (type) {
      case 'my-reviews':
        return 'You haven\'t written any reviews yet. Reviews will appear here after you complete orders.';
      case 'received-reviews':
        return 'No reviews received yet. Complete some orders to start receiving reviews.';
      case 'farmer-reviews':
        return 'This farmer hasn\'t received any reviews yet.';
      default:
        return 'No reviews available.';
    }
  };

  if (currentLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-2 text-sm text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  if (currentError) {
    return (
      <ErrorDisplay 
        message={currentError} 
        onRetry={handleRetry}
        retryText={retryCount > 0 ? `Retry (${retryCount})` : 'Retry'}
      />
    );
  }

  return (
    <div className={className}>
      {title && (
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {title || getDefaultTitle()}
        </h2>
      )}
      
      {processingErrors.length > 0 && (
        <div className="mb-4">
          <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-orange-400">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-orange-700">
                  Some review data had formatting issues but was processed successfully
                </p>
                <details className="mt-2">
                  <summary className="text-sm text-orange-800 cursor-pointer">View details</summary>
                  <ul className="text-xs text-orange-600 mt-1 list-disc list-inside">
                    {processingErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </details>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {currentReviews.length === 0 ? (
        <EmptyState
          icon="⭐"
          title="No Reviews"
          description={emptyMessage || getDefaultEmptyMessage()}
        />
      ) : (
        <div className="space-y-4">
          {getDisplaySafeReviews(currentReviews).map((review) => (
            <ReviewCard
              key={review._id}
              review={review}
              showReviewee={type === 'my-reviews'}
              showReviewer={type !== 'my-reviews'}
              showOrderInfo={type === 'received-reviews'}
            />
          ))}
        </div>
      )}
    </div>
  );
};