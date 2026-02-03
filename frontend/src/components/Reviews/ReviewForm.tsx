import React, { useState, useEffect } from 'react';
import { ReviewCreateRequest, reviewService } from '../../services/reviewService';
import { TextareaField, Button, FormGroup, FormActions, ReviewFormNavigation } from '../UI';
import { useAppTranslation } from '../../contexts/I18nProvider';
import useNavigation from '../../hooks/useNavigation';

interface ReviewFormProps {
  orderId: string;
  revieweeId: string;
  revieweeName: string;
  reviewerType: 'BUYER' | 'FARMER';
  onSubmit: (reviewData: ReviewCreateRequest) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

interface FormErrors {
  rating?: string;
  comment?: string;
  submit?: string;
  network?: string;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  orderId,
  revieweeId,
  revieweeName,
  reviewerType,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const { t } = useAppTranslation('reviews');
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDuplicateCheck, setIsDuplicateCheck] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { navigateBack } = useNavigation();

  // Check for duplicate reviews on component mount
  useEffect(() => {
    const checkForDuplicateReview = async () => {
      try {
        setIsDuplicateCheck(true);
        // Get reviews written by current user to check for duplicates
        const response = await reviewService.getMyReviews('given');

        if (response.success && response.data) {
          const existingReview = response.data.find(
            review => review.orderId === orderId && review.revieweeId === revieweeId
          );

          if (existingReview) {
            setErrors(prev => ({
              ...prev,
              submit: t('form.errors.duplicate')
            }));
          }
        }
      } catch (error) {
        console.error('Error checking for duplicate review:', error);
        // Don't block the form if we can't check for duplicates
      } finally {
        setIsDuplicateCheck(false);
      }
    };

    checkForDuplicateReview();
  }, [orderId, revieweeId]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Rating validation
    if (rating === 0) {
      newErrors.rating = t('form.rating.required');
    } else if (rating < 1 || rating > 5) {
      newErrors.rating = t('form.rating.invalid');
    }

    // Comment validation
    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      newErrors.comment = t('form.comment.required');
    } else if (trimmedComment.length < 10) {
      newErrors.comment = t('form.comment.minLength');
    } else if (trimmedComment.length > 1000) {
      newErrors.comment = t('form.comment.maxLength');
    }

    // Check for inappropriate content (basic validation)
    const inappropriateWords = ['spam', 'fake', 'scam']; // This would be more comprehensive in production
    const hasInappropriateContent = inappropriateWords.some(word => 
      trimmedComment.toLowerCase().includes(word)
    );
    
    if (hasInappropriateContent) {
      newErrors.comment = t('form.comment.inappropriate');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRetry = () => {
    setErrors(prev => ({ ...prev, network: undefined, submit: undefined }));
    setRetryCount(prev => prev + 1);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      navigateBack(`/orders/${orderId}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors(prev => ({ ...prev, submit: undefined, network: undefined }));

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Check if already submitting
    if (isSubmitting || loading) {
      return;
    }

    const reviewData: ReviewCreateRequest = {
      orderId,
      revieweeId,
      reviewerType,
      rating,
      comment: comment.trim()
    };

    try {
      setIsSubmitting(true);
      await onSubmit(reviewData);
    } catch (error: any) {
      console.error('Review submission error:', error);
      
      // Handle different types of errors
      if (error.message?.includes('network') || error.message?.includes('Network')) {
        setErrors(prev => ({
          ...prev,
          network: t('form.errors.network')
        }));
      } else if (error.message?.includes('duplicate') || error.message?.includes('already reviewed')) {
        setErrors(prev => ({
          ...prev,
          submit: t('form.errors.duplicate')
        }));
      } else if (error.message?.includes('validation')) {
        setErrors(prev => ({
          ...prev,
          submit: t('form.errors.validation')
        }));
      } else if (error.message?.includes('server') || error.status >= 500) {
        setErrors(prev => ({
          ...prev,
          submit: t('form.errors.server')
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          submit: error.message || t('form.errors.generic')
        }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    const isDisabled = loading || isSubmitting || isDuplicateCheck;
    
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !isDisabled && setRating(star)}
            onMouseEnter={() => !isDisabled && setHoveredRating(star)}
            onMouseLeave={() => !isDisabled && setHoveredRating(0)}
            className={`text-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 rounded transition-all duration-150 ${
              isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110'
            }`}
            disabled={isDisabled}
            aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
          >
            <span
              className={`${
                star <= (hoveredRating || rating)
                  ? 'text-yellow-400'
                  : 'text-gray-300'
              } transition-colors duration-150`}
            >
              ★
            </span>
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {rating > 0 && (
            <>
              {t('form.rating.stars', { count: rating })}
              {rating === 1 && ` - ${t('form.rating.poor')}`}
              {rating === 2 && ` - ${t('form.rating.fair')}`}
              {rating === 3 && ` - ${t('form.rating.good')}`}
              {rating === 4 && ` - ${t('form.rating.veryGood')}`}
              {rating === 5 && ` - ${t('form.rating.excellent')}`}
            </>
          )}
        </span>
      </div>
    );
  };

  const isFormDisabled = loading || isSubmitting || isDuplicateCheck;
  const hasErrors = Object.keys(errors).length > 0;
  const canSubmit = rating > 0 && comment.trim().length >= 10 && !hasErrors && !isFormDisabled;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t('form.title', { revieweeName })}
        </h3>
        <p className="text-sm text-gray-600">
          {t('form.subtitle', { reviewerType })}
        </p>
      </div>

      {/* Loading state for duplicate check */}
      {isDuplicateCheck && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-blue-700">{t('form.checkingExisting')}</span>
          </div>
        </div>
      )}

      {/* Error messages */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-red-700">{errors.submit}</span>
          </div>
        </div>
      )}

      {errors.network && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-yellow-700">{errors.network}</span>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleRetry}
              className="ml-4"
            >
              {t('form.actions.retry')}
            </Button>
          </div>
        </div>
      )}

      <FormGroup>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('form.rating.label')}
          </label>
          {renderStars()}
          {errors.rating && (
            <p className="text-sm text-red-600 mt-1" role="alert">{errors.rating}</p>
          )}
        </div>

        <TextareaField
          label={t('form.comment.label')}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('form.comment.placeholder', { revieweeName })}
          rows={4}
          required
          error={errors.comment}
          helpText={t('form.comment.helpText', { count: comment.trim().length })}
          disabled={isFormDisabled}
          maxLength={1000}
        />
      </FormGroup>

      <FormActions>
        <Button
          type="button"
          variant="secondary"
          onClick={handleCancel}
          disabled={isFormDisabled}
        >
          {onCancel ? t('form.actions.cancel') : t('form.actions.backToOrder')}
        </Button>
        <Button
          type="submit"
          disabled={!canSubmit}
          className={isSubmitting ? 'relative' : ''}
        >
          {isSubmitting && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            </div>
          )}
          <span className={isSubmitting ? 'opacity-0' : ''}>
            {isSubmitting ? t('form.actions.submitting') : t('form.actions.submit')}
          </span>
        </Button>
      </FormActions>

      {/* Retry information */}
      {retryCount > 0 && (
        <div className="text-xs text-gray-500 text-center">
          {t('form.retryAttempt', { count: retryCount })}
        </div>
      )}
    </form>
  );
};