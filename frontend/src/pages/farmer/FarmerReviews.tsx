 import React, { useState, useEffect, useCallback } from 'react'
import { ReviewList } from '../../components/Reviews'
import { LoadingSpinner, ErrorDisplay, EmptyState, FarmerBreadcrumb } from '../../components/UI'
import Button from '../../components/UI/Button'
import { reviewService } from '../../services/reviewService'
import { useAuth } from '../../contexts/AuthProvider'
import { 
  processReviewData, 
  handleMalformedReviewData,
  ProcessedReview,
  ReviewSummary,
  getDisplaySafeReviews
} from '../../utils/reviewDataProcessor'

interface ProcessedReviewData {
  reviews: ProcessedReview[]
  summary: ReviewSummary
}

const FarmerReviews: React.FC = () => {
  const { user, loading: authLoading } = useAuth()
  const [reviewData, setReviewData] = useState<ProcessedReviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'received' | 'written'>('received')
  const [retryCount, setRetryCount] = useState(0)
  const [processingErrors, setProcessingErrors] = useState<string[]>([])

  const loadFarmerReviews = useCallback(async (isRetry = false) => {
    try {
      // Check if user is authenticated
      if (!user?.id) {
        setError('User not authenticated')
        setLoading(false)
        return
      }

      setLoading(true)
      if (!isRetry) {
        setError(null)
        setRetryCount(0)
        setProcessingErrors([])
      }
      
      // Get reviews received by the current user (farmer)
      const response = await reviewService.getMyReviews('received')
      
      if (response.success && response.data !== undefined) {
        // The API returns reviews directly in response.data as an array
        const reviewsArray = Array.isArray(response.data) ? response.data : [];
        
        // Use robust review data processing
        const { reviews, errors } = handleMalformedReviewData(reviewsArray)
        
        if (errors.length > 0) {
          setProcessingErrors(errors)
          console.warn('Review data processing errors:', errors)
        }
        
        // Process the reviews and calculate summary
        const { reviews: processedReviews, summary } = processReviewData(reviews, {
          includeUnapproved: true,
          logInconsistencies: true,
          validateDates: true,
        })
        
        setReviewData({
          reviews: processedReviews,
          summary
        })
        setError(null)
      } else {
        const errorMessage = response.message || 'Failed to load reviews'
        setError(errorMessage)
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load reviews'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user?.id && !authLoading) {
      loadFarmerReviews()
    }
  }, [user, authLoading, loadFarmerReviews])

  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1)
    loadFarmerReviews(true)
  }, [loadFarmerReviews])

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-2xl ${
              star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            ★
          </span>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews & Ratings</h1>
          <p className="text-gray-600">View and manage customer reviews about your products and service</p>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600">Loading your reviews...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show error state with retry option
  if (error && !reviewData) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews & Ratings</h1>
          <p className="text-gray-600">View and manage customer reviews about your products and service</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <ErrorDisplay 
            message={error} 
            onRetry={handleRetry}
            retryText={retryCount > 0 ? `Retry (${retryCount})` : 'Retry'}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <FarmerBreadcrumb section="Reviews" />
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reviews & Ratings</h1>
        <p className="text-gray-600">View and manage customer reviews about your products and service</p>
      </div>

      {/* Rating Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Rating Overview</h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadFarmerReviews(true)}
            disabled={loading}
          >
            {loading ? '🔄 Loading...' : '🔄 Refresh'}
          </Button>
        </div>
        
        {error && reviewData ? (
          <div className="mb-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-yellow-400">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    {error} (Showing cached data)
                  </p>
                  <button
                    onClick={handleRetry}
                    className="text-sm text-yellow-800 underline hover:text-yellow-900"
                  >
                    Try refreshing
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        
        {processingErrors.length > 0 ? (
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
        ) : null}
        
        {reviewData && reviewData.summary.totalReviews > 0 ? (
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-1">
                {reviewData.summary.averageRating.toFixed(1)}
              </div>
              {renderStars(reviewData.summary.averageRating)}
              <p className="text-sm text-gray-600 mt-2">
                Based on {reviewData.summary.totalReviews} review{reviewData.summary.totalReviews !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="flex-1 space-y-2">
              {reviewData.summary.ratingDistribution.map((item) => {
                const percentage = item.percentage
                
                return (
                  <div key={item.stars} className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 w-8">{item.stars}★</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12">{item.count} ({item.percentage}%)</span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <EmptyState
            icon="⭐"
            title="No Reviews Yet"
            description="You haven't received any reviews yet. Complete some orders to start receiving customer feedback."
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={() => loadFarmerReviews(true)}
                disabled={loading}
              >
                {loading ? 'Checking...' : 'Check for Reviews'}
              </Button>
            }
          />
        )}
      </div>

      {/* Review Management Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('received')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'received'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span>📥</span>
                <span>Reviews About Me</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('written')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'written'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span>📝</span>
                <span>Reviews I've Written</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'received' ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Customer Reviews</h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => loadFarmerReviews(true)}
                  disabled={loading}
                >
                  {loading ? '🔄 Loading...' : '🔄 Refresh'}
                </Button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Reviews from buyers who have purchased your products. All reviews are moderated before being published.
              </p>
              
              {/* Custom review display using processed data */}
              {reviewData && reviewData.reviews.length > 0 ? (
                <div className="space-y-4">
                  {getDisplaySafeReviews(reviewData.reviews).map((review) => (
                    <div key={review._id} className="bg-gray-50 rounded-lg border p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-lg">👤</span>
                            <span className="text-sm font-medium text-gray-700">Customer Review</span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              review.isApproved 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {review.isApproved ? 'Approved' : 'Pending Approval'}
                            </span>
                            {!review.hasValidRating && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Invalid Rating
                              </span>
                            )}
                            {!review.isValidDate && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                Date Issue
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-lg ${
                                  star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                              >
                                ★
                              </span>
                            ))}
                            <span className="ml-2 text-sm text-gray-600">
                              ({review.rating}/5)
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-600 mb-3">
                            <span>
                              From: {review.reviewerName}
                            </span>
                            <span className="mx-2">•</span>
                            <span>
                              {review.formattedDate}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-gray-900 leading-relaxed">{review.comment}</p>
                      </div>

                      <div className="text-xs text-gray-500 border-t pt-2">
                        <div>Order: #{review.orderId.slice(-8)}</div>
                        <div className="text-gray-400 mt-1">
                          This review helps build trust in the marketplace community
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="⭐"
                  title="No Customer Reviews"
                  description="No customer reviews yet. Complete orders to start receiving reviews from buyers."
                />
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Reviews I've Written</h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => loadFarmerReviews(true)}
                  disabled={loading}
                >
                  {loading ? '🔄 Loading...' : '🔄 Refresh'}
                </Button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Reviews you've written about buyers after completing orders. Help build trust in the marketplace community.
              </p>
              
              {/* Use ReviewList for written reviews since we need different API call */}
              <ReviewList
                type="my-reviews"
                emptyMessage="You haven't written any reviews yet. After completing orders, you can review your buyers."
              />
            </div>
          )}
        </div>
      </div>

      {/* Review Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-blue-400 text-xl">💡</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Review Guidelines
            </h3>
            <div className="text-sm text-blue-700 mt-1">
              <ul className="list-disc list-inside space-y-1">
                <li>All reviews are moderated by administrators before publication</li>
                <li>Be honest and constructive in your feedback</li>
                <li>Focus on the transaction experience and communication</li>
                <li>Reviews help build trust and improve the marketplace for everyone</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Review Response Tips */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-green-400 text-xl">🌟</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              Building Your Reputation
            </h3>
            <div className="text-sm text-green-700 mt-1">
              <ul className="list-disc list-inside space-y-1">
                <li>Provide excellent customer service to earn positive reviews</li>
                <li>Communicate clearly about product availability and delivery</li>
                <li>Package products carefully and deliver on time</li>
                <li>Follow up with buyers to ensure satisfaction</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FarmerReviews