import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { MayorMessage } from '../models';
import { UserRole } from '../models/User';
import mongoose from 'mongoose';

// Mayor message request interfaces
interface CreateMayorMessageRequest {
  text: {
    en: string;
    ne?: string;
  };
  imageUrl?: string;
  scrollSpeed?: number;
  isActive?: boolean;
}

interface UpdateMayorMessageRequest extends Partial<CreateMayorMessageRequest> {}

interface MayorMessageSearchQuery {
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'text' | 'scrollSpeed' | 'createdAt' | 'updatedAt';
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

interface CreateMayorAuthRequest extends AuthenticatedRequest {
  body: CreateMayorMessageRequest;
}

interface UpdateMayorAuthRequest extends AuthenticatedRequest {
  body: UpdateMayorMessageRequest;
  params: {
    id: string;
  };
}

interface MayorSearchRequest extends Request {
  query: MayorMessageSearchQuery & { [key: string]: any };
}

/**
 * Create a new mayor message
 * POST /api/content/mayor
 * Requires: ADMIN role
 */
export const createMayorMessage = async (req: CreateMayorAuthRequest, res: Response): Promise<void> => {
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

    // Create mayor message
    const mayorMessageData = {
      ...req.body,
      createdBy: new mongoose.Types.ObjectId(userId)
    };

    const mayorMessage = new MayorMessage(mayorMessageData);
    await mayorMessage.save();

    // Populate creator data for response
    await mayorMessage.populate('creator', 'profile.name email');

    res.status(201).json({
      success: true,
      message: 'Mayor message created successfully',
      data: mayorMessage
    });
  } catch (error) {
    console.error('Create mayor message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create mayor message',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get all mayor messages with filtering
 * GET /api/content/mayor
 * Public endpoint (shows only active message for non-admin users)
 */
export const getMayorMessages = async (req: MayorSearchRequest, res: Response): Promise<void> => {
  try {
    const {
      isActive,
      page = 1,
      limit = 20,
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query: any = {};

    // Active filter - non-admin users can only see active message
    const user = (req as AuthenticatedRequest).user;
    if (user?.role === UserRole.ADMIN) {
      // Admin can see all messages
      if (isActive !== undefined) {
        // Handle both boolean and string values from query parameters
        let activeValue: boolean;
        if (typeof isActive === 'string') {
          activeValue = (isActive as string).toLowerCase() === 'true';
        } else {
          activeValue = Boolean(isActive);
        }
        query.isActive = activeValue;
      }
    } else {
      // Public access - only active message
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
    const [mayorMessages, total] = await Promise.all([
      MayorMessage.find(query)
        .populate('creator', 'profile.name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      MayorMessage.countDocuments(query)
    ]);

    // Debug: Log the actual results
    console.log(`DEBUG: Query executed - Found ${mayorMessages.length} messages, Total count: ${total}`);
    console.log(`DEBUG: Query was:`, JSON.stringify(query));
    console.log(`DEBUG: Sort options:`, JSON.stringify(sortOptions));
    console.log(`DEBUG: Skip: ${skip}, Limit: ${limitNum}`);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: mayorMessages,
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
    console.error('Get mayor messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mayor messages',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get the current active mayor message
 * GET /api/content/mayor/active
 * Public endpoint
 */
export const getActiveMayorMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const mayorMessage = await MayorMessage.findOne({ isActive: true })
      .populate('creator', 'profile.name email')
      .lean();

    if (!mayorMessage) {
      res.status(404).json({
        success: false,
        message: 'No active mayor message found'
      });
      return;
    }

    res.json({
      success: true,
      data: mayorMessage
    });
  } catch (error) {
    console.error('Get active mayor message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active mayor message',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get a single mayor message by ID
 * GET /api/content/mayor/:id
 * Admin only
 */
export const getMayorMessageById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid mayor message ID'
      });
      return;
    }

    const mayorMessage = await MayorMessage.findById(id)
      .populate('creator', 'profile.name email');

    if (!mayorMessage) {
      res.status(404).json({
        success: false,
        message: 'Mayor message not found'
      });
      return;
    }

    res.json({
      success: true,
      data: mayorMessage
    });
  } catch (error) {
    console.error('Get mayor message by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mayor message',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Update a mayor message
 * PUT /api/content/mayor/:id
 * Requires: ADMIN role
 */
export const updateMayorMessage = async (req: UpdateMayorAuthRequest, res: Response): Promise<void> => {
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
        message: 'Invalid mayor message ID'
      });
      return;
    }

    // Find mayor message
    const mayorMessage = await MayorMessage.findById(id);
    if (!mayorMessage) {
      res.status(404).json({
        success: false,
        message: 'Mayor message not found'
      });
      return;
    }

    // Update mayor message
    Object.assign(mayorMessage, req.body);
    await mayorMessage.save();

    // Populate creator data for response
    await mayorMessage.populate('creator', 'profile.name email');

    res.json({
      success: true,
      message: 'Mayor message updated successfully',
      data: mayorMessage
    });
  } catch (error) {
    console.error('Update mayor message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update mayor message',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Delete a mayor message
 * DELETE /api/content/mayor/:id
 * Requires: ADMIN role
 */
export const deleteMayorMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
        message: 'Invalid mayor message ID'
      });
      return;
    }

    // Find and delete mayor message
    const mayorMessage = await MayorMessage.findByIdAndDelete(id);
    if (!mayorMessage) {
      res.status(404).json({
        success: false,
        message: 'Mayor message not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Mayor message deleted successfully'
    });
  } catch (error) {
    console.error('Delete mayor message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete mayor message',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};