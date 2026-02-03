import React, { useState, useEffect } from 'react';
import { FarmerRating as FarmerRatingType } from '../../services/reviewService';
import { reviewService } from '../../services/reviewService';
import { LoadingSpinner } from '../UI';

interface FarmerRatingProps {
  farmerId: string;
  showDetails?: boolean;
  className?: string;
}

export const FarmerRating: React.FC<FarmerRatingProps> = ({
  farmerId,
  showDetails = true,
  className = ''
}) => {
  const [rating, setRating] = useState<FarmerRatingType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRating();
  }, [farmerId]);

  const loadRating = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reviewService.getFarmerRating(farmerId);
      
      if (response.success && response.data) {
        setRating(response.data);
      } else {
        setError(response.message || 'Failed to load rating');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load rating');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${
              star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`flex items-center ${className}`}>
        <LoadingSpinner size="sm" />
        <span className="ml-2 text-sm text-gray-500">Loading rating...</span>
      </div>
    );
  }

  if (error || !rating) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        No rating available
      </div>
    );
  }

  if (rating.reviewCount === 0) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        No reviews yet
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {renderStars(rating.averageRating)}
      
      {showDetails && (
        <div className="text-sm text-gray-600">
          <span className="font-medium">
            {rating.averageRating.toFixed(1)}
          </span>
          <span className="mx-1">•</span>
          <span>
            {rating.reviewCount} review{rating.reviewCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
};