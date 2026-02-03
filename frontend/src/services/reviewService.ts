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

  // Update a review (admin only - moderate)
  moderateReview: async (reviewId: string, action: 'approve' | 'reject'): Promise<ApiResponse<Review>> => {
    return apiPut<Review>(`/reviews/${reviewId}/moderate`, { action });
  },

  // Get pending reviews (admin only)
  getPendingReviews: async (page = 1, limit = 20): Promise<ApiResponse<Review[]>> => {
    return apiGet<Review[]>(`/reviews/pending?page=${page}&limit=${limit}`);
  },
};