import React, { useState, useEffect } from 'react';
import { Layout, LoadingSpinner, ErrorDisplay, EmptyState, Button, Modal } from '../components/UI';
import { ConfirmModal } from '../components/UI/Modal';
import { ReviewForm, ReviewEditForm } from '../components/Reviews';
import { useAuth } from '../contexts/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/UI/Toast';
import { reviewService, ReviewCreateRequest } from '../services/reviewService';
import { orderService } from '../services/orderService';
import { Order, Review } from '../types/api';

interface PendingReview {
  order: Order;
  canReview: boolean;
  reason?: string;
}

export const BuyerReviews: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState<'my-reviews' | 'pending'>('my-reviews');
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [myReviews, setMyReviews] = useState<Review[]>([]);

  // Redirect if not authenticated or not a buyer
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'BUYER') {
      navigate('/dashboard');
      return;
    }
  }, [isAuthenticated, user, navigate]);

  // Load pending reviews and my reviews
  useEffect(() => {
    if (user?.role === 'BUYER') {
      loadPendingReviews();
      loadMyReviews();
    }
  }, [user]);

  const loadMyReviews = async () => {
    try {
      const response = await reviewService.getMyReviews();
      if (response.success && response.data) {
        setMyReviews(response.data);
      }
    } catch (err: any) {
      console.warn('Failed to load my reviews:', err);
    }
  };

  const loadPendingReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get completed orders
      const ordersResponse = await orderService.getMyOrders();
      if (!ordersResponse.success || !ordersResponse.data) {
        throw new Error('Failed to load orders');
      }

      const completedOrders = ordersResponse.data.filter(order => order.status === 'COMPLETED');
      
      // Check which orders can be reviewed
      const pendingReviewsData: PendingReview[] = [];
      
      for (const order of completedOrders) {
        try {
          const canReviewResponse = await reviewService.canReviewOrder(order._id);
          if (canReviewResponse.success && canReviewResponse.data) {
            pendingReviewsData.push({
              order,
              canReview: canReviewResponse.data.canReview,
              reason: canReviewResponse.data.reason
            });
          }
        } catch (err) {
          // Skip this order if we can't check review status
          console.warn(`Failed to check review status for order ${order._id}:`, err);
        }
      }
      
      setPendingReviews(pendingReviewsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load pending reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleStartReview = (order: Order) => {
    setSelectedOrder(order);
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (reviewData: ReviewCreateRequest) => {
    try {
      setSubmittingReview(true);
      const response = await reviewService.submitReview(reviewData);
      
      if (response.success) {
        success('Review submitted successfully! It will be visible after admin approval.', 'Review Submitted');
        setShowReviewModal(false);
        setSelectedOrder(null);
        loadPendingReviews(); // Refresh pending reviews
        loadMyReviews(); // Refresh my reviews
      } else {
        throw new Error(response.message || 'Failed to submit review');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to submit review', 'Review Failed');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCloseReviewModal = () => {
    setShowReviewModal(false);
    setSelectedOrder(null);
  };

  const handleEditReview = (review: Review) => {
    setSelectedReview(review);
    setShowEditModal(true);
  };

  const handleUpdateReview = async (updateData: { rating: number; comment: string }) => {
    if (!selectedReview) return;

    try {
      setSubmittingReview(true);
      // Note: This would require an update review API endpoint
      // For now, we'll show a message that editing is not yet implemented
      showError('Review editing is not yet implemented in the backend API', 'Feature Not Available');
    } catch (err: any) {
      showError(err.message || 'Failed to update review', 'Update Failed');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedReview(null);
  };

  const handleDeleteReview = (review: Review) => {
    setSelectedReview(review);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedReview) return;

    try {
      setSubmittingReview(true);
      // Note: This would require a delete review API endpoint
      // For now, we'll show a message that deletion is not yet implemented
      showError('Review deletion is not yet implemented in the backend API', 'Feature Not Available');
    } catch (err: any) {
      showError(err.message || 'Failed to delete review', 'Delete Failed');
    } finally {
      setSubmittingReview(false);
      setShowDeleteModal(false);
      setSelectedReview(null);
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedReview(null);
  };

  if (!isAuthenticated || user?.role !== 'BUYER') {
    return null; // Will redirect in useEffect
  }

  const tabs = [
    { id: 'my-reviews', label: 'My Reviews', icon: '⭐' },
    { id: 'pending', label: 'Pending Reviews', icon: '⏳', count: pendingReviews.filter(p => p.canReview).length }
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Reviews</h1>
              <p className="mt-2 text-gray-600">
                Manage your reviews and rate your experiences with farmers
              </p>
            </div>
            <Button
              onClick={() => navigate('/orders')}
              variant="outline"
              icon="📦"
            >
              View Orders
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'my-reviews' | 'pending')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Error State */}
        {error && (
          <ErrorDisplay 
            message={error}
            onRetry={loadPendingReviews}
            className="mb-8"
          />
        )}

        {/* Tab Content */}
        {activeTab === 'my-reviews' && (
          <div className="max-w-4xl">
            <div className="space-y-4">
              {myReviews.length === 0 ? (
                <EmptyState
                  icon="⭐"
                  title="No Reviews Yet"
                  description="You haven't written any reviews yet. Complete some orders and share your experience with farmers!"
                  actionLabel="Browse Products"
                  onAction={() => navigate('/products')}
                />
              ) : (
                myReviews.map((review) => (
                  <div key={review._id} className="bg-white rounded-lg border shadow-sm p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">👤</span>
                          <span className="text-sm font-medium text-gray-700">Your Review</span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            review.isApproved 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {review.isApproved ? 'Approved' : 'Pending Approval'}
                          </span>
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
                          <span>Review for Farmer #{review.revieweeId.slice(-8)}</span>
                          <span className="mx-2">•</span>
                          <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-gray-900 leading-relaxed">{review.comment}</p>
                    </div>

                    <div className="text-xs text-gray-500 border-t pt-2">
                      <div className="flex items-center justify-between">
                        <div>Order: #{review.orderId.slice(-8)}</div>
                        
                        {!review.isApproved && (
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditReview(review)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleDeleteReview(review)}
                            >
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {review.isApproved && (
                        <div className="text-yellow-600 text-xs mt-1">
                          ℹ️ Approved reviews cannot be edited or deleted
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="max-w-4xl">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <LoadingSpinner />
              </div>
            ) : pendingReviews.filter(p => p.canReview).length === 0 ? (
              <EmptyState
                icon="⭐"
                title="No Pending Reviews"
                description="You don't have any completed orders waiting for reviews. Complete some orders to start leaving reviews!"
                actionLabel="Browse Products"
                onAction={() => navigate('/products')}
              />
            ) : (
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    📝 Ready to Review
                  </h3>
                  <p className="text-blue-800 text-sm">
                    Share your experience with farmers to help other buyers make informed decisions. 
                    Your reviews will be published after admin approval.
                  </p>
                </div>

                <div className="space-y-4">
                  {pendingReviews
                    .filter(pendingReview => pendingReview.canReview)
                    .map((pendingReview) => (
                      <PendingReviewCard
                        key={pendingReview.order._id}
                        order={pendingReview.order}
                        onStartReview={() => handleStartReview(pendingReview.order)}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Review Modal */}
        <Modal
          isOpen={showReviewModal}
          onClose={handleCloseReviewModal}
          title="Write Review"
          size="lg"
        >
          {selectedOrder && (
            <ReviewForm
              orderId={selectedOrder._id}
              revieweeId={selectedOrder.farmerId}
              revieweeName={`Farmer #${selectedOrder.farmerId.slice(-8)}`}
              reviewerType="BUYER"
              onSubmit={handleSubmitReview}
              onCancel={handleCloseReviewModal}
              loading={submittingReview}
            />
          )}
        </Modal>

        {/* Edit Review Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          title="Edit Review"
          size="lg"
        >
          {selectedReview && (
            <ReviewEditForm
              review={selectedReview}
              onSubmit={handleUpdateReview}
              onCancel={handleCloseEditModal}
              loading={submittingReview}
            />
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
          title="Delete Review"
          message="Are you sure you want to delete this review? This action cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          type="danger"
        />
      </div>
    </Layout>
  );
};

// Pending Review Card Component
interface PendingReviewCardProps {
  order: Order;
  onStartReview: () => void;
}

const PendingReviewCard: React.FC<PendingReviewCardProps> = ({
  order,
  onStartReview
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4 mb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Order #{order._id.slice(-8)}
            </h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              ✅ Completed
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
            <div>
              <span className="font-medium">Farmer:</span>
              <span className="ml-2">#{order.farmerId.slice(-8)}</span>
            </div>
            <div>
              <span className="font-medium">Completed:</span>
              <span className="ml-2">{new Date(order.updatedAt).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="font-medium">Total:</span>
              <span className="ml-2 font-semibold text-primary-600">${order.totalAmount.toFixed(2)}</span>
            </div>
            <div>
              <span className="font-medium">Items:</span>
              <span className="ml-2">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Order Items:</h4>
            <div className="space-y-1">
              {order.items.slice(0, 3).map((item, index) => (
                <div key={index} className="text-sm text-gray-600">
                  Product #{item.productId.slice(-8)} - Qty: {item.quantity} @ ${item.priceAtTime.toFixed(2)}
                </div>
              ))}
              {order.items.length > 3 && (
                <div className="text-sm text-gray-500">
                  +{order.items.length - 3} more item{order.items.length - 3 !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="ml-6">
          <Button
            onClick={onStartReview}
            variant="primary"
            icon="⭐"
          >
            Write Review
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BuyerReviews;