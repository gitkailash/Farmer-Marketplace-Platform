import React, { useState, useEffect } from 'react';
import { Layout, LoadingSpinner, ErrorDisplay, Button } from '../components/UI';
import { MessageNotificationBadge } from '../components/Messaging';
import { useAuth } from '../contexts/AuthProvider';
import { useAppTranslation } from '../contexts/I18nProvider';
import { useNavigate, Link } from 'react-router-dom';
import { messageService } from '../services/messageService';
import { reviewService } from '../services/reviewService';
import { orderService } from '../services/orderService';
import { Box, CheckCircle, FileText, Star, Package, MessageCircle, Clock } from 'lucide-react';


interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  unreadMessages: number;
  pendingReviews: number;
  totalReviews: number;
}

export const BuyerDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { t } = useAppTranslation('buyer');
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    unreadMessages: 0,
    pendingReviews: 0,
    totalReviews: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Load dashboard stats
  useEffect(() => {
    if (user?.role === 'BUYER') {
      loadDashboardStats();
    }
  }, [user]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const [ordersResponse, messagesResponse, reviewsResponse] = await Promise.all([
        orderService.getMyOrders(),
        messageService.getUnreadCount(),
        reviewService.getMyReviews('given') // Get reviews I've written
      ]);

      const orders = ordersResponse.success ? ordersResponse.data || [] : [];
      const unreadCount = messagesResponse.success ? messagesResponse.data?.count || 0 : 0;
      const myReviews = reviewsResponse.success ? reviewsResponse.data || [] : [];

      // Calculate pending reviews by comparing completed orders with existing reviews
      const completedOrders = orders.filter(order => order.status === 'COMPLETED');
      const reviewedOrderIds = new Set(myReviews.map(review => review.orderId));
      const pendingReviewsCount = completedOrders.filter(order => !reviewedOrderIds.has(order._id)).length;

      setStats({
        totalOrders: orders.length,
        pendingOrders: orders.filter(order => order.status === 'PENDING').length,
        completedOrders: completedOrders.length,
        unreadMessages: unreadCount,
        pendingReviews: pendingReviewsCount,
        totalReviews: myReviews.length
      });
    } catch (err: any) {
      setError(err.message || t('dashboard.errorLoading', 'Failed to load dashboard data'));
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || user?.role !== 'BUYER') {
    return null; // Will redirect in useEffect
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t('dashboard.welcome', 'Welcome back, {{name}}! 👋').replace('{{name}}', user?.profile?.name || 'Buyer')}
          </h1>
          <p className="mt-2 text-gray-600">
            {t('dashboard.subtitle', "Here's what's happening with your orders and messages")}
          </p>
        </div>

        {/* Error State */}
        {error && (
          <ErrorDisplay 
            message={error}
            onRetry={loadDashboardStats}
            className="mb-8"
          />
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title={t('stats.totalOrders', 'Total Orders')}
            value={stats.totalOrders}
            icon={<Package className="h-5 w-5" />}
            color="blue"
            link="/orders"
          />
          <StatCard
            title={t('stats.pendingOrders', 'Pending Orders')}
            value={stats.pendingOrders}
            icon={<Clock className="h-5 w-5" />}
            color="yellow"
            link="/orders"
            badge={stats.pendingOrders > 0}
          />
          <StatCard
            title={t('stats.completedOrders', 'Completed Orders')}
            value={stats.completedOrders}
            icon={<CheckCircle className="h-5 w-5" />}
            color="green"
            link="/orders"
          />
          <StatCard
            title={t('stats.unreadMessages', 'Unread Messages')}
            value={stats.unreadMessages}
            icon={<MessageCircle className="h-5 w-5" />}
            color="purple"
            link="/messages"
            badge={stats.unreadMessages > 0}
          />
          <StatCard
            title={t('stats.pendingReviews', 'Pending Reviews')}
            value={stats.pendingReviews}
            icon={<Star className="h-5 w-5" />}
            color="orange"
            link="/reviews"
            badge={stats.pendingReviews > 0}
          />
          <StatCard
            title={t('stats.totalReviews', 'Total Reviews')}
            value={stats.totalReviews}
            icon={<FileText className="h-5 w-5" />}
            color="indigo"
            link="/reviews"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('quickActions.title', 'Quick Actions')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={() => navigate('/products')}
              variant="primary"
              icon={<Box className="h-4 w-4" />}
              className="w-full"
            >
              {t('quickActions.browseProducts', 'Browse Products')}
            </Button>
            <Button
              onClick={() => navigate('/orders')}
              variant="outline"
              icon={<Package className="h-4 w-4" />}
              className="w-full"
            >
              {t('quickActions.viewOrders', 'View Orders')}
            </Button>
            <Button
              onClick={() => navigate('/messages')}
              variant="outline"
              icon={<MessageCircle className="h-4 w-4" />}
              className="w-full relative"
            >
              {t('quickActions.messages', 'Messages')}
              {stats.unreadMessages > 0 && (
                <MessageNotificationBadge className="absolute -top-2 -right-2" />
              )}
            </Button>
            <Button
              onClick={() => navigate('/reviews')}
              variant="outline"
              icon={<Star className="h-4 w-4" />}
              className="w-full"
            >
              {t('quickActions.myReviews', 'My Reviews')}
            </Button>
          </div>
        </div>

        {/* Notifications & Alerts */}
        {(stats.pendingOrders > 0 || stats.unreadMessages > 0 || stats.pendingReviews > 0) && (
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              {t('notifications.title', '📢 Action Required')}
            </h3>
            <div className="space-y-2 text-blue-800">
              {stats.pendingOrders > 0 && (
                <div className="flex items-center justify-between">
                  <span>{t('notifications.pendingOrdersText', 'You have {{count}} pending order{{count, plural, one {} other {s}}}').replace('{{count}}', stats.pendingOrders.toString())}</span>
                  <Link to="/orders" className="text-blue-600 hover:text-blue-800 font-medium">
                    {t('notifications.viewOrders', 'View Orders →')}
                  </Link>
                </div>
              )}
              {stats.unreadMessages > 0 && (
                <div className="flex items-center justify-between">
                  <span>{t('notifications.unreadMessagesText', 'You have {{count}} unread message{{count, plural, one {} other {s}}}').replace('{{count}}', stats.unreadMessages.toString())}</span>
                  <Link to="/messages" className="text-blue-600 hover:text-blue-800 font-medium">
                    {t('notifications.readMessages', 'Read Messages →')}
                  </Link>
                </div>
              )}
              {stats.pendingReviews > 0 && (
                <div className="flex items-center justify-between">
                  <span>{t('notifications.pendingReviewsText', 'You can write {{count}} review{{count, plural, one {} other {s}}}').replace('{{count}}', stats.pendingReviews.toString())}</span>
                  <Link to="/reviews" className="text-blue-600 hover:text-blue-800 font-medium">
                    {t('notifications.writeReviews', 'Write Reviews →')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tips for Buyers */}
        <div className="bg-green-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-3">
            {t('tips.title', '💡 Tips for Better Shopping')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
            <div>
              <h4 className="font-medium mb-2">{t('tips.beforeOrdering.title', 'Before Ordering:')}</h4>
              <ul className="space-y-1 text-green-700">
                <li>{t('tips.beforeOrdering.messageFarmers', '• Message farmers about product freshness')}</li>
                <li>{t('tips.beforeOrdering.askBulkPricing', '• Ask about bulk pricing for larger quantities')}</li>
                <li>{t('tips.beforeOrdering.confirmDelivery', '• Confirm delivery options and timing')}</li>
                <li>{t('tips.beforeOrdering.checkRatings', '• Check farmer ratings and reviews')}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">{t('tips.afterReceiving.title', 'After Receiving:')}</h4>
              <ul className="space-y-1 text-green-700">
                <li>{t('tips.afterReceiving.leaveReviews', '• Leave honest reviews to help other buyers')}</li>
                <li>{t('tips.afterReceiving.rateExperience', '• Rate your experience with the farmer')}</li>
                <li>{t('tips.afterReceiving.reportIssues', '• Report any issues through messages')}</li>
                <li>{t('tips.afterReceiving.considerReordering', '• Consider reordering from good farmers')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

// Stat Card Component
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'yellow' | 'green' | 'purple' | 'orange' | 'indigo';
  link: string;
  badge?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, link, badge = false }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  };

  return (
    <Link
      to={link}
      className={`block p-6 rounded-lg border-2 transition-all duration-200 hover:shadow-md relative ${colorClasses[color]}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className="text-3xl opacity-75">{icon}</div>
      </div>
      
      {badge && value > 0 && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full"></div>
      )}
    </Link>
  );
};

export default BuyerDashboard;