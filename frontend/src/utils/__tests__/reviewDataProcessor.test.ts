import {
  extractUserId,
  extractUserName,
  processReviewDate,
  validateRating,
  validateComment,
  processSingleReview,
  processReviewArray,
  calculateReviewSummary,
  handleMalformedReviewData,
  canDisplayReview,
  getDisplaySafeReviews
} from '../reviewDataProcessor';

describe('reviewDataProcessor', () => {
  describe('extractUserId', () => {
    it('should extract ID from string', () => {
      expect(extractUserId('user123')).toBe('user123');
    });

    it('should extract ID from object with _id', () => {
      expect(extractUserId({ _id: 'user123' })).toBe('user123');
    });

    it('should extract ID from object with id', () => {
      expect(extractUserId({ id: 'user123' })).toBe('user123');
    });

    it('should return empty string for invalid input', () => {
      expect(extractUserId(null)).toBe('');
      expect(extractUserId(undefined)).toBe('');
      expect(extractUserId({})).toBe('');
    });
  });

  describe('extractUserName', () => {
    it('should extract name from profile', () => {
      const user = { profile: { name: 'John Doe' } };
      expect(extractUserName(user)).toBe('John Doe');
    });

    it('should extract name from direct name property', () => {
      const user = { name: 'Jane Smith' };
      expect(extractUserName(user)).toBe('Jane Smith');
    });

    it('should extract name from email', () => {
      const user = { email: 'test@example.com' };
      expect(extractUserName(user)).toBe('test');
    });

    it('should return fallback for invalid input', () => {
      expect(extractUserName(null)).toBe('Anonymous User');
      expect(extractUserName({})).toBe('Anonymous User');
      expect(extractUserName('', 'Custom Fallback')).toBe('Custom Fallback');
    });
  });

  describe('processReviewDate', () => {
    it('should format valid date', () => {
      const result = processReviewDate('2023-12-01T10:00:00Z');
      expect(result.isValidDate).toBe(true);
      expect(result.formattedDate).toContain('2023');
    });

    it('should handle invalid date', () => {
      const result = processReviewDate('invalid-date');
      expect(result.isValidDate).toBe(false);
      expect(result.formattedDate).toBe('Invalid date');
    });

    it('should handle missing date', () => {
      const result = processReviewDate(null);
      expect(result.isValidDate).toBe(false);
      expect(result.formattedDate).toBe('Date unavailable');
    });

    it('should handle unreasonable dates', () => {
      const result = processReviewDate('1900-01-01T00:00:00Z');
      expect(result.isValidDate).toBe(false);
      expect(result.formattedDate).toBe('Date unavailable');
    });
  });

  describe('validateRating', () => {
    it('should validate correct ratings', () => {
      expect(validateRating(5)).toEqual({ rating: 5, isValid: true });
      expect(validateRating('3')).toEqual({ rating: 3, isValid: true });
      expect(validateRating(4.7)).toEqual({ rating: 5, isValid: true }); // rounds
    });

    it('should reject invalid ratings', () => {
      expect(validateRating(0)).toEqual({ rating: 0, isValid: false });
      expect(validateRating(6)).toEqual({ rating: 0, isValid: false });
      expect(validateRating('invalid')).toEqual({ rating: 0, isValid: false });
      expect(validateRating(null)).toEqual({ rating: 0, isValid: false });
    });
  });

  describe('validateComment', () => {
    it('should validate non-empty comments', () => {
      expect(validateComment('Great service!')).toEqual({ 
        comment: 'Great service!', 
        isValid: true 
      });
    });

    it('should trim whitespace', () => {
      expect(validateComment('  Good  ')).toEqual({ 
        comment: 'Good', 
        isValid: true 
      });
    });

    it('should reject empty comments', () => {
      expect(validateComment('')).toEqual({ comment: '', isValid: false });
      expect(validateComment('   ')).toEqual({ comment: '', isValid: false });
      expect(validateComment(null)).toEqual({ comment: '', isValid: false });
    });
  });

  describe('processSingleReview', () => {
    const validReview = {
      _id: 'review123',
      orderId: 'order123',
      reviewerId: 'user123',
      revieweeId: 'farmer123',
      reviewerType: 'BUYER',
      rating: 5,
      comment: 'Excellent service!',
      isApproved: true,
      createdAt: '2023-12-01T10:00:00Z'
    };

    it('should process valid review', () => {
      const result = processSingleReview(validReview);
      expect(result).toBeTruthy();
      expect(result?._id).toBe('review123');
      expect(result?.hasValidRating).toBe(true);
      expect(result?.hasValidComment).toBe(true);
      expect(result?.isValidDate).toBe(true);
    });

    it('should handle missing ID', () => {
      const invalidReview = { ...validReview };
      delete invalidReview._id;
      const result = processSingleReview(invalidReview);
      expect(result).toBeNull();
    });

    it('should handle object references for user IDs', () => {
      const reviewWithObjectRefs = {
        ...validReview,
        reviewerId: { _id: 'user123', profile: { name: 'John Doe' } },
        revieweeId: { _id: 'farmer123', profile: { name: 'Jane Farm' } }
      };
      
      const result = processSingleReview(reviewWithObjectRefs);
      expect(result?.reviewerId).toBe('user123');
      expect(result?.revieweeId).toBe('farmer123');
      expect(result?.reviewerName).toBe('John Doe');
      expect(result?.revieweeName).toBe('Jane Farm');
    });
  });

  describe('handleMalformedReviewData', () => {
    it('should handle array input', () => {
      const reviews = [
        { _id: 'review1', rating: 5, comment: 'Good', reviewerId: 'user1', revieweeId: 'farmer1' }
      ];
      const result = handleMalformedReviewData(reviews);
      expect(result.reviews).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle nested data structures', () => {
      const data = {
        data: {
          reviews: [
            { _id: 'review1', rating: 5, comment: 'Good', reviewerId: 'user1', revieweeId: 'farmer1' }
          ]
        }
      };
      const result = handleMalformedReviewData(data);
      expect(result.reviews).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle invalid input gracefully', () => {
      const result = handleMalformedReviewData('invalid');
      expect(result.reviews).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('canDisplayReview', () => {
    const validProcessedReview = {
      _id: 'review123',
      orderId: 'order123',
      reviewerId: 'user123',
      revieweeId: 'farmer123',
      reviewerType: 'BUYER' as const,
      rating: 5,
      comment: 'Great!',
      isApproved: true,
      createdAt: '2023-12-01T10:00:00Z',
      reviewerName: 'John Doe',
      revieweeName: 'Jane Farm',
      formattedDate: 'December 1, 2023',
      isValidDate: true,
      hasValidRating: true,
      hasValidComment: true
    };

    it('should return true for valid review', () => {
      expect(canDisplayReview(validProcessedReview)).toBe(true);
    });

    it('should return false for review with missing ID', () => {
      const invalidReview = { ...validProcessedReview, _id: '' };
      expect(canDisplayReview(invalidReview)).toBe(false);
    });

    it('should return false for review with invalid rating', () => {
      const invalidReview = { ...validProcessedReview, hasValidRating: false };
      expect(canDisplayReview(invalidReview)).toBe(false);
    });

    it('should return false for review with empty comment', () => {
      const invalidReview = { ...validProcessedReview, comment: '' };
      expect(canDisplayReview(invalidReview)).toBe(false);
    });
  });
});