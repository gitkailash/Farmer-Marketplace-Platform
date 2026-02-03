import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { GalleryItem } from '../models';
import { UserRole } from '../models/User';
import { MultilingualField } from '../models/types/multilingual';
import mongoose from 'mongoose';

// Gallery request interfaces
interface CreateGalleryItemRequest {
  title: MultilingualField;
  description?: MultilingualField;
  imageUrl: string;
  category: {
    en: string;
    ne?: string;
  };
  order?: number;
  isActive?: boolean;
}

interface UpdateGalleryItemRequest extends Partial<CreateGalleryItemRequest> {}

interface GallerySearchQuery {
  category?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'title' | 'order' | 'createdAt' | 'category';
  sortOrder?: 'asc' | 'desc';
  language?: 'en' | 'ne';
}

// Extended Request interfaces
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
    email: string;
  };
}

interface CreateGalleryAuthRequest extends AuthenticatedRequest {
  body: CreateGalleryItemRequest;
}

interface UpdateGalleryAuthRequest extends AuthenticatedRequest {
  body: UpdateGalleryItemRequest;
  params: {
    id: string;
  };
}

interface GallerySearchRequest extends Request {
  query: GallerySearchQuery & { [key: string]: any };
}

/**
 * Create a new gallery item
 * POST /api/content/gallery
 * Requires: ADMIN role
 */
export const createGalleryItem = async (req: CreateGalleryAuthRequest, res: Response): Promise<void> => {
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

    // Get next order number if not provided
    let { order } = req.body;
    if (order === undefined) {
      const maxOrderItem = await GalleryItem.findOne().sort({ order: -1 });
      order = maxOrderItem ? maxOrderItem.order + 1 : 0;
    }

    // Create gallery item
    const galleryItemData = {
      ...req.body,
      order,
      createdBy: new mongoose.Types.ObjectId(userId)
    };

    const galleryItem = new GalleryItem(galleryItemData);
    await galleryItem.save();

    // Populate creator data for response
    await galleryItem.populate('creator', 'profile.name email');

    res.status(201).json({
      success: true,
      message: 'Gallery item created successfully',
      data: galleryItem
    });
  } catch (error) {
    console.error('Create gallery item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create gallery item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get all gallery items with filtering
 * GET /api/content/gallery
 * Public endpoint (shows only active items for non-admin users)
 */
export const getGalleryItems = async (req: GallerySearchRequest, res: Response): Promise<void> => {
  try {
    const {
      category,
      isActive,
      page = 1,
      limit = 20,
      sortBy = 'order',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const query: any = {};

    // Category filter - support both string and multilingual category
    if (category) {
      query.$or = [
        { 'category.en': { $regex: category, $options: 'i' } },
        { 'category.ne': { $regex: category, $options: 'i' } }
      ];
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
    const [galleryItems, total] = await Promise.all([
      GalleryItem.find(query)
        .populate('creator', 'profile.name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      GalleryItem.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: galleryItems,
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
    console.error('Get gallery items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gallery items',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get a single gallery item by ID
 * GET /api/content/gallery/:id
 * Public endpoint for active items, admin for all items
 */
export const getGalleryItemById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid gallery item ID'
      });
      return;
    }

    const galleryItem = await GalleryItem.findById(id)
      .populate('creator', 'profile.name email');

    if (!galleryItem) {
      res.status(404).json({
        success: false,
        message: 'Gallery item not found'
      });
      return;
    }

    // Check if user can view this item
    const user = (req as AuthenticatedRequest).user;
    const canView = galleryItem.isActive || user?.role === UserRole.ADMIN;

    if (!canView) {
      res.status(404).json({
        success: false,
        message: 'Gallery item not found'
      });
      return;
    }

    res.json({
      success: true,
      data: galleryItem
    });
  } catch (error) {
    console.error('Get gallery item by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gallery item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Update a gallery item
 * PUT /api/content/gallery/:id
 * Requires: ADMIN role
 */
export const updateGalleryItem = async (req: UpdateGalleryAuthRequest, res: Response): Promise<void> => {
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
        message: 'Invalid gallery item ID'
      });
      return;
    }

    // Find gallery item
    const galleryItem = await GalleryItem.findById(id);
    if (!galleryItem) {
      res.status(404).json({
        success: false,
        message: 'Gallery item not found'
      });
      return;
    }

    // Update gallery item
    Object.assign(galleryItem, req.body);
    await galleryItem.save();

    // Populate creator data for response
    await galleryItem.populate('creator', 'profile.name email');

    res.json({
      success: true,
      message: 'Gallery item updated successfully',
      data: galleryItem
    });
  } catch (error) {
    console.error('Update gallery item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update gallery item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Delete a gallery item
 * DELETE /api/content/gallery/:id
 * Requires: ADMIN role
 */
export const deleteGalleryItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
        message: 'Invalid gallery item ID'
      });
      return;
    }

    // Find and delete gallery item
    const galleryItem = await GalleryItem.findByIdAndDelete(id);
    if (!galleryItem) {
      res.status(404).json({
        success: false,
        message: 'Gallery item not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Gallery item deleted successfully'
    });
  } catch (error) {
    console.error('Delete gallery item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete gallery item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Reorder gallery items
 * PUT /api/content/gallery/reorder
 * Requires: ADMIN role
 */
export const reorderGalleryItems = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { items } = req.body; // Array of { id, order } objects

    if (!Array.isArray(items)) {
      res.status(400).json({
        success: false,
        message: 'Items must be an array'
      });
      return;
    }

    // Validate all items
    for (const item of items) {
      if (!item.id || !mongoose.Types.ObjectId.isValid(item.id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid item ID in reorder request'
        });
        return;
      }
      if (typeof item.order !== 'number' || item.order < 0) {
        res.status(400).json({
          success: false,
          message: 'Invalid order value in reorder request'
        });
        return;
      }
    }

    // Update all items in a transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      for (const item of items) {
        await GalleryItem.findByIdAndUpdate(
          item.id,
          { order: item.order },
          { session }
        );
      }

      await session.commitTransaction();
      
      res.json({
        success: true,
        message: 'Gallery items reordered successfully'
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Reorder gallery items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder gallery items',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};