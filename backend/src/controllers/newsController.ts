import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { NewsItem, NewsPriority } from '../models';
import { UserRole } from '../models/User';
import mongoose from 'mongoose';

// News request interfaces
interface CreateNewsItemRequest {
  headline: {
    en: string;
    ne?: string;
  };
  content?: {
    en: string;
    ne?: string;
  };
  summary?: {
    en: string;
    ne?: string;
  };
  link?: string;
  priority?: NewsPriority;
  language?: string;
  isActive?: boolean;
  publishedAt?: Date;
}

interface UpdateNewsItemRequest extends Partial<CreateNewsItemRequest> {}

interface NewsSearchQuery {
  priority?: NewsPriority;
  language?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'headline' | 'priority' | 'publishedAt' | 'createdAt' | 'language';
  sortOrder?: 'asc' | 'desc';
}

// Extended Request interfaces
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
    email: string;
  };
}

interface CreateNewsAuthRequest extends AuthenticatedRequest {
  body: CreateNewsItemRequest;
}

interface UpdateNewsAuthRequest extends AuthenticatedRequest {
  body: UpdateNewsItemRequest;
  params: {
    id: string;
  };
}

interface NewsSearchRequest extends Request {
  query: NewsSearchQuery & { [key: string]: any };
}

/**
 * Create a new news item
 * POST /api/content/news
 * Requires: ADMIN role
 */
export const createNewsItem = async (req: CreateNewsAuthRequest, res: Response): Promise<void> => {
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

    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Create news item
    const newsItemData = {
      ...req.body,
      createdBy: new mongoose.Types.ObjectId(userId)
    };

    const newsItem = new NewsItem(newsItemData);
    await newsItem.save();

    // Populate creator data for response
    await newsItem.populate('creator', 'profile.name email');

    res.status(201).json({
      success: true,
      message: 'News item created successfully',
      data: newsItem
    });
  } catch (error) {
    console.error('Create news item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create news item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get all news items with filtering
 * GET /api/content/news
 * Public endpoint (shows only active items for non-admin users)
 */
export const getNewsItems = async (req: NewsSearchRequest, res: Response): Promise<void> => {
  try {
    const {
      priority,
      language,
      isActive,
      page = 1,
      limit = 20,
      sortBy = 'publishedAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query: any = {};

    // Priority filter
    if (priority && Object.values(NewsPriority).includes(priority as NewsPriority)) {
      query.priority = priority;
    }

    // Language filter - check if translations exist for the requested language
    if (language) {
      const lang = language.toLowerCase();
      if (lang === 'ne') {
        // For Nepali, check if Nepali translations exist in headline
        query['headline.ne'] = { $exists: true, $ne: null, $nin: ['', null] };
      } else {
        // For English (default), check if English translations exist in headline
        query['headline.en'] = { $exists: true, $ne: null, $nin: ['', null] };
      }
    }

    // Active filter - non-admin users can only see active items
    const user = (req as AuthenticatedRequest).user;
    if (user?.role === UserRole.ADMIN) {
      // Admin can see all items
      if (isActive !== undefined) {
        // Handle both boolean and string values from query parameters
        const activeValue = typeof isActive === 'string' ? isActive === 'true' : Boolean(isActive);
        query.isActive = activeValue;
      }
    } else {
      // Public access - only active items
      query.isActive = true;
    }

    // Pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [newsItems, total] = await Promise.all([
      NewsItem.find(query)
        .populate('creator', 'profile.name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      NewsItem.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: newsItems,
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
    console.error('Get news items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch news items',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get active news items for ticker display
 * GET /api/content/news/ticker
 * Public endpoint
 */
export const getTickerNews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { language = 'en', limit = 10 } = req.query;

    // Build query to check for available translations
    const query: any = { isActive: true };
    
    const lang = language.toString().toLowerCase();
    if (lang === 'ne') {
      // For Nepali, check if Nepali translations exist in headline
      query['headline.ne'] = { $exists: true, $ne: null, $nin: ['', null] };
    } else {
      // For English (default), check if English translations exist in headline
      query['headline.en'] = { $exists: true, $ne: null, $nin: ['', null] };
    }

    const newsItems = await NewsItem.find(query)
      .select('headline link priority publishedAt')
      .sort({ priority: -1, publishedAt: -1 })
      .limit(Math.min(50, Math.max(1, Number(limit))))
      .lean();

    res.json({
      success: true,
      data: newsItems
    });
  } catch (error) {
    console.error('Get ticker news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticker news',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get a single news item by ID
 * GET /api/content/news/:id
 * Public endpoint for active items, admin for all items
 */
export const getNewsItemById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid news item ID'
      });
      return;
    }

    const newsItem = await NewsItem.findById(id)
      .populate('creator', 'profile.name email');

    if (!newsItem) {
      res.status(404).json({
        success: false,
        message: 'News item not found'
      });
      return;
    }

    // Check if user can view this item
    const user = (req as AuthenticatedRequest).user;
    const canView = newsItem.isActive || user?.role === UserRole.ADMIN;

    if (!canView) {
      res.status(404).json({
        success: false,
        message: 'News item not found'
      });
      return;
    }

    res.json({
      success: true,
      data: newsItem
    });
  } catch (error) {
    console.error('Get news item by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch news item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Update a news item
 * PUT /api/content/news/:id
 * Requires: ADMIN role
 */
export const updateNewsItem = async (req: UpdateNewsAuthRequest, res: Response): Promise<void> => {
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
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Validate ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid news item ID'
      });
      return;
    }

    // Find news item
    const newsItem = await NewsItem.findById(id);
    if (!newsItem) {
      res.status(404).json({
        success: false,
        message: 'News item not found'
      });
      return;
    }

    // Update news item
    Object.assign(newsItem, req.body);
    await newsItem.save();

    // Populate creator data for response
    await newsItem.populate('creator', 'profile.name email');

    res.json({
      success: true,
      message: 'News item updated successfully',
      data: newsItem
    });
  } catch (error) {
    console.error('Update news item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update news item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Delete a news item
 * DELETE /api/content/news/:id
 * Requires: ADMIN role
 */
export const deleteNewsItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Validate ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid news item ID'
      });
      return;
    }

    // Find and delete news item
    const newsItem = await NewsItem.findByIdAndDelete(id);
    if (!newsItem) {
      res.status(404).json({
        success: false,
        message: 'News item not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'News item deleted successfully'
    });
  } catch (error) {
    console.error('Delete news item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete news item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};