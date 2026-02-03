import React, { useState, useEffect } from 'react';
import { Review } from '../../types/api';
import { InputField, TextareaField, Button, FormGroup, FormActions } from '../UI';

interface ReviewEditFormProps {
  review: Review;
  onSubmit: (reviewData: { rating: number; comment: string }) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

export const ReviewEditForm: React.FC<ReviewEditFormProps> = ({
  review,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [rating, setRating] = useState<number>(review.rating);
  const [comment, setComment] = useState(review.comment);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  useEffect(() => {
    const changed = rating !== review.rating || comment !== review.comment;
    setHasChanges(changed);
  }, [rating, comment, review.rating, review.comment]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (rating === 0) {
      newErrors.rating = 'Please select a rating';
    }

    if (!comment.trim()) {
      newErrors.comment = 'Please write a comment';
    } else if (comment.trim().length < 10) {
      newErrors.comment = 'Comment must be at least 10 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !hasChanges) return;

    try {
      await onSubmit({
        rating,
        comment: comment.trim()
      });
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  const renderStars = () => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="text-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
            disabled={loading}
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
              {rating} star{rating !== 1 ? 's' : ''}
              {rating === 1 && ' - Poor'}
              {rating === 2 && ' - Fair'}
              {rating === 3 && ' - Good'}
              {rating === 4 && ' - Very Good'}
              {rating === 5 && ' - Excellent'}
            </>
          )}
        </span>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Edit Your Review
        </h3>
        <p className="text-sm text-gray-600">
          Update your rating and feedback. Changes will need admin approval before being published.
        </p>
      </div>

      <FormGroup>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating *
          </label>
          {renderStars()}
          {errors.rating && (
            <p className="text-sm text-red-600 mt-1">{errors.rating}</p>
          )}
        </div>

        <TextareaField
          label="Your Review"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your updated thoughts about this experience..."
          rows={4}
          required
          error={errors.comment}
          helpText="Minimum 10 characters. Be honest and constructive in your feedback."
        />
      </FormGroup>

      {!hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <p className="text-sm text-yellow-800">
            💡 Make changes to your rating or comment to update your review.
          </p>
        </div>
      )}

      <FormActions>
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={loading || !hasChanges || rating === 0 || !comment.trim()}
        >
          {loading ? 'Updating...' : 'Update Review'}
        </Button>
      </FormActions>
    </form>
  );
};

export default ReviewEditForm;