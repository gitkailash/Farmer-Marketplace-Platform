import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { User, UserRole, Product, Order, Review, Farmer, Message } from '../models';
import mongoose from 'mongoose';

// Admin request interfaces
interface UserManagementQuery {
  role?: UserRole;
  search?: string;
  district?: string;
  isVerified?: string;
  dateStart?: string;
  dateEnd?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'email' | 'profile.name' | 'lastActive';
  sortOrder?: 'asc' | 'desc';
}

interface UpdateUserRequest {
  role?: UserRole;
  profile?: {
    name?: string;
    phone?: string;
    address?: string;
  };
}

interface ModerationQuery {
  type?: 'reviews' | 'products' | 'messages';
  status?: string;
  page?: number;
  limit?: number;
}

interface AnalyticsQuery {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
}

// Extended Request interfaces
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
    email: string;
  };
}

interface UserManagementRequest extends AuthenticatedRequest {
  query: UserManagementQuery & { [key: string]: any };
}

interface UpdateUserAuthRequest extends AuthenticatedRequest {
  body: UpdateUserRequest;
  params: {
    id: string;
  };
}

interface ModerationRequest extends AuthenticatedRequest {
  query: ModerationQuery & { [key: string]: any };
}

interface AnalyticsRequest extends AuthenticatedRequest {
  query: AnalyticsQuery & { [key: string]: any };
}

/**
 * Get all users with filtering and pagination
 * GET /api/admin/users
 * Requires: ADMIN role
 */
export const getUsers = async (req: UserManagementRequest, res: Response): Promise<void> => {
  try {
    const {
      role,
      search,
      district,
      isVerified,
      dateStart,
      dateEnd,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query: any = {};

    // Role filter
    if (role && Object.values(UserRole).includes(role)) {
      query.role = role;
    }

    // Search filter (email or name)
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { 'profile.name': { $regex: search, $options: 'i' } },
        { 'profile.phone': { $regex: search, $options: 'i' } }
      ];
    }

    // Date range filter
    if (dateStart || dateEnd) {
      query.createdAt = {};
      if (dateStart) {
        query.createdAt.$gte = new Date(dateStart);
      }
      if (dateEnd) {
        query.createdAt.$lte = new Date(dateEnd);
      }
    }

    // Pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password') // Exclude password field
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query)
    ]);

    // Get farmer data for farmer users
    const userIds = users.map(user => user._id);
    const farmers = await Farmer.find({ userId: { $in: userIds } }).lean();
    const farmerMap = new Map(farmers.map(f => [f.userId.toString(), f]));

    // Get user statistics for all users
    const userStats = await Promise.all(
      users.map(async (user) => {
        const stats = await getUserStatistics(user._id);
        return { userId: user._id.toString(), stats };
      })
    );
    const statsMap = new Map(userStats.map(s => [s.userId, s.stats]));

    // Enhance user data with farmer information and statistics
    let enhancedUsers = users.map(user => ({
      ...user,
      farmerProfile: user.role === UserRole.FARMER ? farmerMap.get(user._id.toString()) : undefined,
      statistics: statsMap.get(user._id.toString())
    }));

    // Apply district filter (post-query since it's in farmer profile)
    if (district && district.trim()) {
      enhancedUsers = enhancedUsers.filter(user => 
        user.farmerProfile?.location?.district?.toLowerCase().includes(district.toLowerCase())
      );
    }

    // Apply verification filter (post-query since it's in farmer profile)
    if (isVerified && (isVerified === 'true' || isVerified === 'false')) {
      const verifiedFilter = isVerified === 'true';
      enhancedUsers = enhancedUsers.filter(user => 
        user.role === UserRole.FARMER && user.farmerProfile?.isVerified === verifiedFilter
      );
    }

    // Recalculate pagination if filters were applied post-query
    const filteredTotal = enhancedUsers.length;
    const totalPages = Math.ceil(filteredTotal / limitNum);

    res.json({
      success: true,
      data: enhancedUsers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredTotal,
        pages: totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get a single user by ID
 * GET /api/admin/users/:id
 * Requires: ADMIN role
 */
export const getUserById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
      return;
    }

    const user = await User.findById(id).select('-password').lean();
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Get farmer profile if user is a farmer
    let farmerProfile = null;
    if (user.role === UserRole.FARMER) {
      farmerProfile = await Farmer.findOne({ userId: user._id }).lean();
    }

    // Get user statistics
    const stats = await getUserStatistics(user._id);

    res.json({
      success: true,
      data: {
        ...user,
        farmerProfile,
        statistics: stats
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Update a user
 * PUT /api/admin/users/:id
 * Requires: ADMIN role
 */
export const updateUser = async (req: UpdateUserAuthRequest, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const { id } = req.params;
    const updateData = req.body;

    // Validate ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
      return;
    }

    // Find user
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Prevent admin from changing their own role
    if (user._id.toString() === req.user?.userId && updateData.role && updateData.role !== user.role) {
      res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      });
      return;
    }

    // Update user
    Object.assign(user, updateData);
    await user.save();

    // Remove password from response
    const userResponse = user.toJSON();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Delete a user
 * DELETE /api/admin/users/:id
 * Requires: ADMIN role
 */
export const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
      return;
    }

    // Prevent admin from deleting themselves
    if (id === req.user?.userId) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
      return;
    }

    // Find user
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Delete related data
    await Promise.all([
      // Delete farmer profile if exists
      Farmer.deleteOne({ userId: user._id }),
      // Delete user's products
      Product.deleteMany({ farmerId: { $in: await Farmer.find({ userId: user._id }).distinct('_id') } }),
      // Delete user's orders
      Order.deleteMany({ $or: [{ buyerId: user._id }, { farmerId: { $in: await Farmer.find({ userId: user._id }).distinct('_id') } }] }),
      // Delete user's reviews
      Review.deleteMany({ $or: [{ reviewerId: user._id }, { revieweeId: user._id }] }),
      // Delete user's messages
      Message.deleteMany({ $or: [{ senderId: user._id }, { receiverId: user._id }] })
    ]);

    // Delete user
    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'User and all related data deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get moderation queue
 * GET /api/admin/moderation
 * Requires: ADMIN role
 */
export const getModerationQueue = async (req: ModerationRequest, res: Response): Promise<void> => {
  try {
    const {
      type = 'reviews',
      status = 'pending',
      page = 1,
      limit = 20
    } = req.query;

    // Pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    let data: any[] = [];
    let total = 0;

    switch (type) {
      case 'reviews':
        const reviewQuery = status === 'pending' 
          ? { isApproved: false, moderatedBy: { $exists: false } }
          : status === 'approved'
          ? { isApproved: true }
          : { isApproved: false, moderatedBy: { $exists: true } };

        [data, total] = await Promise.all([
          Review.find(reviewQuery)
            .populate('reviewer', 'profile.name email')
            .populate('reviewee', 'profile.name email')
            .populate('order', 'createdAt totalAmount')
            .populate('moderator', 'profile.name')
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limitNum)
            .lean(),
          Review.countDocuments(reviewQuery)
        ]);
        break;

      case 'products':
        const productQuery = status === 'pending'
          ? { status: 'DRAFT' }
          : status === 'published'
          ? { status: 'PUBLISHED' }
          : { status: 'INACTIVE' };

        [data, total] = await Promise.all([
          Product.find(productQuery)
            .populate('farmer', 'location rating reviewCount')
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limitNum)
            .lean(),
          Product.countDocuments(productQuery)
        ]);
        break;

      case 'messages':
        const messageQuery = status === 'pending'
          ? { moderationFlag: 'PENDING' }
          : status === 'approved'
          ? { moderationFlag: 'APPROVED' }
          : { moderationFlag: 'REJECTED' };

        [data, total] = await Promise.all([
          Message.find(messageQuery)
            .populate('sender', 'profile.name email')
            .populate('receiver', 'profile.name email')
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limitNum)
            .lean(),
          Message.countDocuments(messageQuery)
        ]);
        break;

      default:
        res.status(400).json({
          success: false,
          message: 'Invalid moderation type. Must be "reviews", "products", or "messages"'
        });
        return;
    }

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        type,
        status,
        items: data
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Get moderation queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch moderation queue',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get analytics and reporting data
 * GET /api/admin/analytics
 * Requires: ADMIN role
 */
export const getAnalytics = async (req: AnalyticsRequest, res: Response): Promise<void> => {
  try {
    const {
      startDate,
      endDate,
      groupBy = 'day'
    } = req.query;

    const analyticsData = await getAnalyticsData({ 
      startDate: startDate as string | undefined, 
      endDate: endDate as string | undefined, 
      groupBy 
    });

    res.json({
      success: true,
      data: analyticsData
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get audit logs
 * GET /api/admin/audit-logs
 * Requires: ADMIN role
 */
export const getAuditLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      action,
      userId,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    // Note: This is a placeholder implementation
    // In a real application, you would have an audit log collection
    // For now, we'll return recent moderation actions from reviews
    
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate as string);
    }

    const query: any = {
      moderatedBy: { $exists: true }
    };

    if (Object.keys(dateFilter).length > 0) {
      query.moderatedAt = dateFilter;
    }

    if (userId && mongoose.Types.ObjectId.isValid(userId as string)) {
      query.moderatedBy = new mongoose.Types.ObjectId(userId as string);
    }

    const [auditLogs, total] = await Promise.all([
      Review.find(query)
        .populate('moderator', 'profile.name email')
        .populate('reviewer', 'profile.name')
        .populate('reviewee', 'profile.name')
        .select('isApproved moderatedBy moderatedAt reviewer reviewee rating comment')
        .sort({ moderatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Review.countDocuments(query)
    ]);

    // Transform to audit log format
    const transformedLogs = auditLogs.map((log: any) => ({
      id: log._id,
      action: log.isApproved ? 'APPROVE_REVIEW' : 'REJECT_REVIEW',
      performedBy: log.moderator,
      targetType: 'REVIEW',
      targetId: log._id,
      details: {
        reviewer: log.reviewer?.profile?.name,
        reviewee: log.reviewee?.profile?.name,
        rating: log.rating
      },
      timestamp: log.moderatedAt,
      createdAt: log.moderatedAt
    }));

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: transformedLogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Export analytics data
 * GET /api/admin/analytics/export
 * Requires: ADMIN role
 */
export const exportAnalytics = async (req: AnalyticsRequest, res: Response): Promise<void> => {
  try {
    const {
      format = 'json',
      startDate,
      endDate,
      groupBy = 'day'
    } = req.query;

    // Get analytics data
    const analyticsData = await getAnalyticsData({ 
      startDate: startDate as string | undefined, 
      endDate: endDate as string | undefined, 
      groupBy 
    });

    if (format === 'csv') {
      // Generate CSV
      let csvContent = 'Metric,Total,Recent\n';
      csvContent += `Users,${analyticsData.overview.users.total},${analyticsData.overview.users.recent}\n`;
      csvContent += `Farmers,${analyticsData.overview.users.farmers},-\n`;
      csvContent += `Buyers,${analyticsData.overview.users.buyers},-\n`;
      csvContent += `Products,${analyticsData.overview.products.total},${analyticsData.overview.products.recent}\n`;
      csvContent += `Published Products,${analyticsData.overview.products.published},-\n`;
      csvContent += `Orders,${analyticsData.overview.orders.total},${analyticsData.overview.orders.recent}\n`;
      csvContent += `Completed Orders,${analyticsData.overview.orders.completed},-\n`;
      csvContent += `Reviews,${analyticsData.overview.reviews.total},${analyticsData.overview.reviews.recent}\n`;
      csvContent += `Approved Reviews,${analyticsData.overview.reviews.approved},-\n`;
      csvContent += `Total Revenue,${analyticsData.overview.revenue.total},-\n`;
      csvContent += `Average Order Value,${analyticsData.overview.revenue.average},-\n`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvContent);
    } else {
      // Return JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${new Date().toISOString().split('T')[0]}.json`);
      res.json(analyticsData);
    }
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export analytics data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Export audit logs
 * GET /api/admin/audit-logs/export
 * Requires: ADMIN role
 */
export const exportAuditLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      format = 'json',
      startDate,
      endDate,
      action,
      userId
    } = req.query;

    // Build query
    const query: any = {
      moderatedBy: { $exists: true }
    };

    // Date filter
    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string);
      query.moderatedAt = dateFilter;
    }

    if (userId && mongoose.Types.ObjectId.isValid(userId as string)) {
      query.moderatedBy = new mongoose.Types.ObjectId(userId as string);
    }

    // Get all audit logs (no pagination for export)
    const auditLogs = await Review.find(query)
      .populate('moderator', 'profile.name email')
      .populate('reviewer', 'profile.name')
      .populate('reviewee', 'profile.name')
      .select('isApproved moderatedBy moderatedAt reviewer reviewee rating comment')
      .sort({ moderatedAt: -1 })
      .lean();

    // Transform to audit log format
    const transformedLogs = auditLogs.map((log: any) => ({
      id: log._id,
      action: log.isApproved ? 'APPROVE_REVIEW' : 'REJECT_REVIEW',
      performedBy: log.moderator,
      targetType: 'REVIEW',
      targetId: log._id,
      details: {
        reviewer: log.reviewer?.profile?.name,
        reviewee: log.reviewee?.profile?.name,
        rating: log.rating
      },
      timestamp: log.moderatedAt,
      createdAt: log.moderatedAt
    }));

    if (format === 'csv') {
      // Generate CSV
      let csvContent = 'Date,Action,Performed By,Target Type,Target ID,Details\n';
      transformedLogs.forEach((log: any) => {
        const details = JSON.stringify(log.details).replace(/"/g, '""');
        csvContent += `${log.timestamp},${log.action},${log.performedBy.profile.name},${log.targetType},${log.targetId},"${details}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvContent);
    } else {
      // Return JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.json`);
      res.json(transformedLogs);
    }
  } catch (error) {
    console.error('Export audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export audit logs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Helper function to get analytics data (extracted for reuse)
async function getAnalyticsData(params: { startDate?: string | undefined; endDate?: string | undefined; groupBy?: string }) {
  const { startDate, endDate, groupBy = 'day' } = params;

  // Build date filter
  const dateFilter: any = {};
  if (startDate) {
    dateFilter.$gte = new Date(startDate);
  }
  if (endDate) {
    dateFilter.$lte = new Date(endDate);
  }

  const hasDateFilter = Object.keys(dateFilter).length > 0;
  const createdAtFilter = hasDateFilter ? { createdAt: dateFilter } : {};

  // Get basic counts
  const [
    totalUsers,
    totalFarmers,
    totalBuyers,
    totalProducts,
    publishedProducts,
    totalOrders,
    completedOrders,
    totalReviews,
    approvedReviews,
    totalMessages
  ] = await Promise.all([
    User.countDocuments(hasDateFilter ? createdAtFilter : {}),
    User.countDocuments({ role: UserRole.FARMER, ...(hasDateFilter ? createdAtFilter : {}) }),
    User.countDocuments({ role: UserRole.BUYER, ...(hasDateFilter ? createdAtFilter : {}) }),
    Product.countDocuments(hasDateFilter ? createdAtFilter : {}),
    Product.countDocuments({ status: 'PUBLISHED', ...(hasDateFilter ? createdAtFilter : {}) }),
    Order.countDocuments(hasDateFilter ? createdAtFilter : {}),
    Order.countDocuments({ status: 'COMPLETED', ...(hasDateFilter ? createdAtFilter : {}) }),
    Review.countDocuments(hasDateFilter ? createdAtFilter : {}),
    Review.countDocuments({ isApproved: true, ...(hasDateFilter ? createdAtFilter : {}) }),
    Message.countDocuments(hasDateFilter ? createdAtFilter : {})
  ]);

  // Get revenue data
  const revenueData = await Order.aggregate([
    {
      $match: {
        status: 'COMPLETED',
        ...(hasDateFilter ? createdAtFilter : {})
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
        averageOrderValue: { $avg: '$totalAmount' }
      }
    }
  ]);

  const revenue = revenueData[0] || { totalRevenue: 0, averageOrderValue: 0 };

  // Get top farmers
  const topFarmers = await Farmer.find()
    .populate('userId', 'profile.name email')
    .sort({ rating: -1, reviewCount: -1 })
    .limit(10)
    .lean();

  // Get recent activity (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentActivity = await Promise.all([
    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Product.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Order.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Review.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })
  ]);

  // Get time-series data if date filter is applied
  let timeSeriesData = null;
  if (hasDateFilter && groupBy) {
    const groupFormat = getGroupFormat(groupBy);
    
    timeSeriesData = await Order.aggregate([
      {
        $match: createdAtFilter
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupFormat,
              date: '$createdAt'
            }
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
  }

  return {
    overview: {
      users: {
        total: totalUsers,
        farmers: totalFarmers,
        buyers: totalBuyers,
        recent: recentActivity[0]
      },
      products: {
        total: totalProducts,
        published: publishedProducts,
        recent: recentActivity[1]
      },
      orders: {
        total: totalOrders,
        completed: completedOrders,
        recent: recentActivity[2]
      },
      reviews: {
        total: totalReviews,
        approved: approvedReviews,
        recent: recentActivity[3]
      },
      messages: {
        total: totalMessages
      },
      revenue: {
        total: revenue.totalRevenue,
        average: revenue.averageOrderValue
      }
    },
    topFarmers,
    timeSeriesData,
    generatedAt: new Date().toISOString()
  };
}

// Helper functions

/**
 * Get user statistics
 */
async function getUserStatistics(userId: mongoose.Types.ObjectId): Promise<any> {
  try {
    const user = await User.findById(userId);
    if (!user) return {};

    const stats: any = {
      joinDate: user.createdAt,
      lastActive: user.updatedAt
    };

    if (user.role === UserRole.FARMER) {
      const farmer = await Farmer.findOne({ userId });
      if (farmer) {
        const [productCount, orderCount, reviewCount] = await Promise.all([
          Product.countDocuments({ farmerId: farmer._id }),
          Order.countDocuments({ farmerId: farmer._id }),
          Review.countDocuments({ revieweeId: userId, isApproved: true })
        ]);

        stats.farmer = {
          productCount,
          orderCount,
          reviewCount,
          rating: farmer.rating,
          isVerified: farmer.isVerified
        };
      }
    } else if (user.role === UserRole.BUYER) {
      const [orderCount, reviewCount] = await Promise.all([
        Order.countDocuments({ buyerId: userId }),
        Review.countDocuments({ reviewerId: userId })
      ]);

      stats.buyer = {
        orderCount,
        reviewCount
      };
    }

    return stats;
  } catch (error) {
    console.error('Get user statistics error:', error);
    return {};
  }
}

/**
 * Get date group format for aggregation
 */
function getGroupFormat(groupBy: string): string {
  switch (groupBy) {
    case 'day':
      return '%Y-%m-%d';
    case 'week':
      return '%Y-%U';
    case 'month':
      return '%Y-%m';
    default:
      return '%Y-%m-%d';
  }
}