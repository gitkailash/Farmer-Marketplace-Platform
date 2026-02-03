import React, { useState, useEffect, useCallback } from 'react'
import { LoadingSpinner, ErrorDisplay, EmptyState } from '../../components/UI'
import Button from '../../components/UI/Button'
import { reviewService } from '../../services/reviewService'
import { useAuth } from '../../contexts/AuthProvider'
import { useAppTranslation } from '../../contexts/I18nProvider'
import { getProductFromOrderItem } from '../../utils/productUtils'
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
  const { t: tReviews } = useAppTranslation('reviews') // Use reviews translations for all review-related content
  const [reviewData, setReviewData] = useState<ProcessedReviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
          <h1 className="text-2xl font-bold text-gray-900">{tReviews('page.farmerTitle')}</h1>
          <p className="text-gray-600">{tReviews('page.farmerSubtitle')}</p>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600">{tReviews('status.loading')}</p>
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
          <h1 className="text-2xl font-bold text-gray-900">{tReviews('page.farmerTitle')}</h1>
          <p className="text-gray-600">{tReviews('page.farmerSubtitle')}</p>
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{tReviews('page.farmerTitle')}</h1>
        <p className="text-gray-600">{tReviews('page.farmerSubtitle')}</p>
      </div>

      {/* Rating Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{tReviews('farmer.overview.title')}</h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadFarmerReviews(true)}
            disabled={loading}
          >
            {loading ? tReviews('farmer.overview.loading') : tReviews('farmer.overview.refresh')}
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
                    {error} {tReviews('status.showingCachedData')}
                  </p>
                  <button
                    onClick={handleRetry}
                    className="text-sm text-yellow-800 underline hover:text-yellow-900"
                  >
                    {tReviews('status.tryRefreshing')}
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
                    {tReviews('status.processingErrors')}
                  </p>
                  <details className="mt-2">
                    <summary className="text-sm text-orange-800 cursor-pointer">{tReviews('status.viewDetails')}</summary>
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
                {tReviews('farmer.overview.averageRating', { count: reviewData.summary.totalReviews })}
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
            title={tReviews('farmer.overview.noReviews.title')}
            description={tReviews('farmer.overview.noReviews.description')}
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={() => loadFarmerReviews(true)}
                disabled={loading}
              >
                {loading ? tReviews('farmer.overview.noReviews.checking') : tReviews('farmer.overview.noReviews.action')}
              </Button>
            }
          />
        )}
      </div>

      {/* Customer Reviews Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">{tReviews('farmer.customerReviews.title')}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {tReviews('farmer.customerReviews.description')}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => loadFarmerReviews(true)}
              disabled={loading}
            >
              {loading ? tReviews('farmer.overview.loading') : tReviews('farmer.overview.refresh')}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Custom review display using processed data */}
          {reviewData && reviewData.reviews.length > 0 ? (
            <div className="space-y-4">
              {getDisplaySafeReviews(reviewData.reviews).map((review) => (
                <div key={review._id} className="bg-gray-50 rounded-lg border p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">👤</span>
                        <span className="text-sm font-medium text-gray-700">{tReviews('farmer.customerReviews.customerReview')}</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          review.isApproved 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {review.isApproved ? tReviews('myReviews.approved') : tReviews('myReviews.pendingApproval')}
                        </span>
                        {!review.hasValidRating && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {tReviews('farmer.customerReviews.invalidRating')}
                          </span>
                        )}
                        {!review.isValidDate && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            {tReviews('farmer.customerReviews.dateIssue')}
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
                          {tReviews('farmer.customerReviews.from')} {review.reviewerName}
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

                  {/* Product Information */}
                  {review.order?.items && review.order.items.length > 0 && (
                    <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">
                        {tReviews('farmer.customerReviews.productsReviewed')}
                      </h4>
                      <div className="space-y-1">
                        {review.order.items.map((item, index) => {
                          const product = getProductFromOrderItem(item);
                          return (
                            <div key={index} className="text-sm text-blue-800">
                              <span className="font-medium">
                                {product.name}
                              </span>
                              <span className="text-blue-600 ml-2">
                                × {item.quantity} {product.unit}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 border-t pt-2">
                    <div>Order: #{review.orderId.slice(-8)}</div>
                    <div className="text-gray-400 mt-1">
                      {tReviews('farmer.customerReviews.helpsBuildTrust')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="⭐"
              title={tReviews('farmer.customerReviews.empty.title')}
              description={tReviews('farmer.customerReviews.empty.description')}
            />
          )}
        </div>
      </div>

      {/* Review System Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-blue-400 text-xl">💡</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              {tReviews('farmer.systemInfo.title')}
            </h3>
            <div className="text-sm text-blue-700 mt-1">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>{tReviews('farmer.systemInfo.buyersReviewFarmers')}</strong></li>
                <li><strong>{tReviews('farmer.systemInfo.farmersReviewBuyers')}</strong></li>
                <li>{tReviews('farmer.systemInfo.moderated')}</li>
                <li>{tReviews('farmer.systemInfo.buildTrust')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Building Reputation Tips */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-green-400 text-xl">🌟</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              {tReviews('farmer.reputationTips.title')}
            </h3>
            <div className="text-sm text-green-700 mt-1">
              <ul className="list-disc list-inside space-y-1">
                <li>{tReviews('farmer.reputationTips.excellentService')}</li>
                <li>{tReviews('farmer.reputationTips.communicate')}</li>
                <li>{tReviews('farmer.reputationTips.package')}</li>
                <li>{tReviews('farmer.reputationTips.followUp')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FarmerReviews