import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { handleValidationErrors, sanitizeInput } from '../middleware/validation';

// Gallery controllers
import {
  createGalleryItem,
  getGalleryItems,
  getGalleryItemById,
  updateGalleryItem,
  deleteGalleryItem,
  reorderGalleryItems
} from '../controllers/galleryController';

// Mayor message controllers
import {
  createMayorMessage,
  getMayorMessages,
  getActiveMayorMessage,
  getMayorMessageById,
  updateMayorMessage,
  deleteMayorMessage
} from '../controllers/mayorController';

// News controllers
import {
  createNewsItem,
  getNewsItems,
  getTickerNews,
  getNewsItemById,
  updateNewsItem,
  deleteNewsItem
} from '../controllers/newsController';

// Validation middleware
import {
  validateGalleryItem, 
  validateGalleryUpdate,
  validateMayorMessage, 
  validateMayorUpdate,
  validateNewsItem, 
  validateNewsUpdate 
} from '../validators/contentValidators';

const router = Router();

// Apply sanitization middleware to all routes
router.use(sanitizeInput);

// =============================================================================
// GALLERY ROUTES
// =============================================================================

/**
 * @route   POST /api/content/gallery
 * @desc    Create a new gallery item
 * @access  Admin only
 */
router.post('/gallery', 
  authenticate, 
  requireAdmin, 
  validateGalleryItem,
  handleValidationErrors,
  createGalleryItem
);

/**
 * @route   GET /api/content/gallery
 * @desc    Get all gallery items with filtering and pagination
 * @access  Public (active items only for non-admin)
 */
router.get('/gallery', getGalleryItems);

/**
 * @route   GET /api/content/gallery/:id
 * @desc    Get a single gallery item by ID
 * @access  Public (active items only for non-admin)
 */
router.get('/gallery/:id', getGalleryItemById);

/**
 * @route   PUT /api/content/gallery/:id
 * @desc    Update a gallery item
 * @access  Admin only
 */
router.put('/gallery/:id', 
  authenticate, 
  requireAdmin, 
  validateGalleryUpdate,
  handleValidationErrors,
  updateGalleryItem
);

/**
 * @route   DELETE /api/content/gallery/:id
 * @desc    Delete a gallery item
 * @access  Admin only
 */
router.delete('/gallery/:id', 
  authenticate, 
  requireAdmin, 
  deleteGalleryItem
);

/**
 * @route   PUT /api/content/gallery/reorder
 * @desc    Reorder gallery items
 * @access  Admin only
 */
router.put('/gallery/reorder', 
  authenticate, 
  requireAdmin, 
  reorderGalleryItems
);

// =============================================================================
// MAYOR MESSAGE ROUTES
// =============================================================================

/**
 * @route   POST /api/content/mayor
 * @desc    Create a new mayor message
 * @access  Admin only
 */
router.post('/mayor', 
  authenticate, 
  requireAdmin, 
  validateMayorMessage,
  handleValidationErrors,
  createMayorMessage
);

/**
 * @route   GET /api/content/mayor
 * @desc    Get all mayor messages with filtering and pagination
 * @access  Admin only (for listing), Public for active message
 */
router.get('/mayor', getMayorMessages);

/**
 * @route   GET /api/content/mayor/active
 * @desc    Get the current active mayor message
 * @access  Public
 */
router.get('/mayor/active', getActiveMayorMessage);

/**
 * @route   GET /api/content/mayor/:id
 * @desc    Get a single mayor message by ID
 * @access  Admin only
 */
router.get('/mayor/:id', 
  authenticate, 
  requireAdmin, 
  getMayorMessageById
);

/**
 * @route   PUT /api/content/mayor/:id
 * @desc    Update a mayor message
 * @access  Admin only
 */
router.put('/mayor/:id', 
  authenticate, 
  requireAdmin, 
  validateMayorUpdate,
  handleValidationErrors,
  updateMayorMessage
);

/**
 * @route   DELETE /api/content/mayor/:id
 * @desc    Delete a mayor message
 * @access  Admin only
 */
router.delete('/mayor/:id', 
  authenticate, 
  requireAdmin, 
  deleteMayorMessage
);

// =============================================================================
// NEWS TICKER ROUTES
// =============================================================================

/**
 * @route   POST /api/content/news
 * @desc    Create a new news item
 * @access  Admin only
 */
router.post('/news', 
  authenticate, 
  requireAdmin, 
  validateNewsItem,
  handleValidationErrors,
  createNewsItem
);

/**
 * @route   GET /api/content/news
 * @desc    Get all news items with filtering and pagination
 * @access  Public (active items only for non-admin)
 */
router.get('/news', getNewsItems);

/**
 * @route   GET /api/content/news/ticker
 * @desc    Get active news items for ticker display
 * @access  Public
 */
router.get('/news/ticker', getTickerNews);

/**
 * @route   GET /api/content/news/:id
 * @desc    Get a single news item by ID
 * @access  Public (active items only for non-admin)
 */
router.get('/news/:id', getNewsItemById);

/**
 * @route   PUT /api/content/news/:id
 * @desc    Update a news item
 * @access  Admin only
 */
router.put('/news/:id', 
  authenticate, 
  requireAdmin, 
  validateNewsUpdate,
  handleValidationErrors,
  updateNewsItem
);

/**
 * @route   DELETE /api/content/news/:id
 * @desc    Delete a news item
 * @access  Admin only
 */
router.delete('/news/:id', 
  authenticate, 
  requireAdmin, 
  deleteNewsItem
);

export default router;