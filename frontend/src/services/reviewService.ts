import { apiGet, apiPost, apiPut, apiDelete } from './api';
import { Review, ApiResponse, PaginatedResponse } from '../types/api';

export interface ReviewCreateRequest {
  orderId: string;
  revieweeId: string;
  reviewerType: 'BUYER' | 'FARMER';
  rating: number;
  comment: string;
}

export interface FarmerRating {
  farmerId: string;
  farmerName: string;
  averageRating: number;
  reviewCount: number;
}

export interface FarmerReviewsResponse {
  reviews: Review[];
  summary: {
    totalReviews: number;
    averageRating: number;
    ratingDistribution: Array<{
      stars: number;
      count: number;
    }>;
  };
}

export const reviewService = {
  // Submit a new review
  submitReview: async (reviewData: ReviewCreateRequest): Promise<ApiResponse<Review>> => {
    return apiPost<Review>('/reviews', reviewData);
  },

  // Get reviews for a specific farmer (public reviews)
  getFarmerReviews: async (farmerId: string): Promise<ApiResponse<FarmerReviewsResponse>> => {
    return apiGet<FarmerReviewsResponse>(`/reviews/farmer/${farmerId}`);
  },

  // Get farmer rating summary
  getFarmerRating: async (farmerId: string): Promise<ApiResponse<FarmerRating>> => {
    const response = await apiGet<FarmerReviewsResponse>(`/reviews/farmer/${farmerId}`);
    if (response.success && response.data) {
      // Transform the response to match FarmerRating interface
      return {
        success: true,
        data: {
          farmerId,
          farmerName: '', // This would need to be populated from farmer data
          averageRating: response.data.summary.averageRating,
          reviewCount: response.data.summary.totalReviews
        }
      };
    }
    return response as ApiResponse<FarmerRating>;
  },

  // Get reviews written by current user
  getMyReviews: async (type: 'given' | 'received' = 'given'): Promise<ApiResponse<Review[]>> => {
    return apiGet<Review[]>(`/reviews/my-reviews?type=${type}`);
  },

  // Get all reviews with pagination and filters
  getReviews: async (filters?: {
    revieweeId?: string;
    reviewerId?: string;
    reviewerType?: 'BUYER' | 'FARMER';
    isApproved?: boolean;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Review[]>> => {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    return apiGet<Review[]>(`/reviews?${queryParams.toString()}`);
  },

  // Get a single review by ID
  getReviewById: async (reviewId: string): Promise<ApiResponse<Review>> => {
    return apiGet<Review>(`/reviews/${reviewId}`);
  },

  // Update a review (only by reviewer and only if not approved)
  updateReview: async (reviewId: string, updateData: { rating: number; comment: string }): Promise<ApiResponse<Review>> => {
    return apiPut<Review>(`/reviews/${reviewId}`, updateData);
  },

  // Update a review (admin only - moderate)
  moderateReview: async (reviewId: string, action: 'approve' | 'reject'): Promise<ApiResponse<Review>> => {
    return apiPut<Review>(`/reviews/${reviewId}/moderate`, { action });
  },

  // Get pending reviews (admin only)
  getPendingReviews: async (page = 1, limit = 20): Promise<ApiResponse<Review[]>> => {
    return apiGet<Review[]>(`/reviews/pending?page=${page}&limit=${limit}`);
  },

  // Check if user can review an order
  canReviewOrder: async (orderId: string): Promise<ApiResponse<{ canReview: boolean; reason?: string }>> => {
    return apiGet<{ canReview: boolean; reason?: string }>(`/reviews/can-review/${orderId}`);
  },

  // Get review for a specific order (if exists)
  getOrderReview: async (orderId: string): Promise<ApiResponse<Review>> => {
    return apiGet<Review>(`/reviews/order/${orderId}`);
  },
};