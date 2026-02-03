import React, { useState, useEffect } from 'react';
import { Order, Review } from '../../types/api';
import { reviewService } from '../../services/reviewService';
import { ReviewCreateRequest } from '../../services/reviewService';
import { ReviewForm } from './ReviewForm';
import { ReviewCard } from './ReviewCard';
import { Button, Modal, LoadingSpinner, ErrorDisplay } from '../UI';
import { useAuth } from '../../contexts/AuthProvider';
import { useToastContext } from '../../contexts/ToastProvider';

interface OrderReviewSectionProps {
  order: Order;
  farmerName?: string;
  className?: string;
}

export const OrderReviewSection: React.FC<OrderReviewSectionProps> = ({
  order,
  farmerName = 'Farmer',
  className = ''
}) => {
  const { user } = useAuth();
  const { success, error: showError } = useToastContext();
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [canReviewReason, setCanReviewReason] = useState<string>('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkReviewStatus();
  }, [order._id]);

  const checkReviewStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user can review this order
      const canReviewResponse = await reviewService.canReviewOrder(order._id);
      if (canReviewResponse.success && canReviewResponse.data) {
        setCanReview(canReviewResponse.data.canReview);
        setCanReviewReason(canReviewResponse.data.reason || '');
      }

      // Check if review already exists
      const existingReviewResponse = await reviewService.getOrderReview(order._id);
      if (existingReviewResponse.success && existingReviewResponse.data) {
        setExistingReview(existingReviewResponse.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check review status');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (reviewData: ReviewCreateRequest) => {
    try {
      setSubmitting(true);
      const response = await reviewService.submitReview(reviewData);

      if (response.success && response.data) {
        setExistingReview(response.data);
        setShowReviewForm(false);
        setCanReview(false);
        success('Your review has been submitted and is pending approval.');
      } else {
        throw new Error(response.message || 'Failed to submit review');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to submit review');
      throw err; // Re-throw to let form handle it
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <ErrorDisplay message={error} onRetry={checkReviewStatus} />
      </div>
    );
  }

  // Don't show anything if user is not a buyer or if it's not their order
  if (user?.role !== 'BUYER' || String(order.buyerId) !== String(user._id)) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg border p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Review Your Experience
      </h3>

      {existingReview ? (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            You have reviewed this order:
          </p>
          <ReviewCard review={existingReview} showReviewer={false} />
        </div>
      ) : canReview ? (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Share your experience with {farmerName} to help other buyers make informed decisions.
          </p>
          <Button
            onClick={() => setShowReviewForm(true)}
            variant="primary"
          >
            ⭐ Write Review
          </Button>
        </div>
      ) : (
        <div className="text-sm text-gray-500">
          {canReviewReason || 'Review not available for this order.'}
        </div>
      )}

      {/* Review Form Modal */}
      <Modal
        isOpen={showReviewForm}
        onClose={() => setShowReviewForm(false)}
        title="Write Review"
        size="md"
      >
        <ReviewForm
          orderId={order._id}
          revieweeId={order.farmerId}
          revieweeName={farmerName}
          reviewerType="BUYER"
          onSubmit={handleSubmitReview}
          onCancel={() => setShowReviewForm(false)}
          loading={submitting}
        />
      </Modal>
    </div>
  );
};