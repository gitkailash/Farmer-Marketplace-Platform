import { Router } from 'express';
import { authenticate, requireAdmin, optionalAuthenticate } from '../middleware/auth';
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
 * @swagger
 * /content/gallery:
 *   post:
 *     summary: Create gallery item
 *     description: Create a new gallery item (admin only)
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - imageUrl
 *             properties:
 *               title:
 *                 type: object
 *                 properties:
 *                   en:
 *                     type: string
 *                     example: Beautiful Farm Landscape
 *                   ne:
 *                     type: string
 *                     example: सुन्दर खेत दृश्य
 *               description:
 *                 type: object
 *                 properties:
 *                   en:
 *                     type: string
 *                     example: A beautiful view of our organic farm
 *                   ne:
 *                     type: string
 *                     example: हाम्रो जैविक खेतको सुन्दर दृश्य
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com/farm-image.jpg
 *               category:
 *                 type: string
 *                 example: farm
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Gallery item created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *   get:
 *     summary: Get gallery items
 *     description: Get all gallery items with optional filtering
 *     tags: [Content]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Gallery items retrieved successfully
 */
router.post('/gallery', 
  authenticate, 
  requireAdmin, 
  validateGalleryItem,
  handleValidationErrors,
  createGalleryItem
);

router.get('/gallery', getGalleryItems);

/**
 * @swagger
 * /content/gallery/{id}:
 *   get:
 *     summary: Get gallery item by ID
 *     description: Get a single gallery item by ID
 *     tags: [Content]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Gallery item ID
 *     responses:
 *       200:
 *         description: Gallery item retrieved successfully
 *       404:
 *         description: Gallery item not found
 *   put:
 *     summary: Update gallery item
 *     description: Update a gallery item (admin only)
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Gallery item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: object
 *                 properties:
 *                   en:
 *                     type: string
 *                   ne:
 *                     type: string
 *               description:
 *                 type: object
 *                 properties:
 *                   en:
 *                     type: string
 *                   ne:
 *                     type: string
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *               category:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Gallery item updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Gallery item not found
 *   delete:
 *     summary: Delete gallery item
 *     description: Delete a gallery item (admin only)
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Gallery item ID
 *     responses:
 *       200:
 *         description: Gallery item deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Gallery item not found
 */
router.get('/gallery/:id', getGalleryItemById);

router.put('/gallery/:id', 
  authenticate, 
  requireAdmin, 
  validateGalleryUpdate,
  handleValidationErrors,
  updateGalleryItem
);

router.delete('/gallery/:id', 
  authenticate, 
  requireAdmin, 
  deleteGalleryItem
);

/**
 * @swagger
 * /content/gallery/reorder:
 *   put:
 *     summary: Reorder gallery items
 *     description: Reorder gallery items (admin only)
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemIds
 *             properties:
 *               itemIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of gallery item IDs in new order
 *     responses:
 *       200:
 *         description: Gallery items reordered successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
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
 * @swagger
 * /content/mayor:
 *   post:
 *     summary: Create mayor message
 *     description: Create a new mayor message (admin only)
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *             properties:
 *               title:
 *                 type: object
 *                 properties:
 *                   en:
 *                     type: string
 *                     example: Welcome Message from Mayor
 *                   ne:
 *                     type: string
 *                     example: मेयरको स्वागत सन्देश
 *               message:
 *                 type: object
 *                 properties:
 *                   en:
 *                     type: string
 *                     example: Welcome to our farmer marketplace platform
 *                   ne:
 *                     type: string
 *                     example: हाम्रो किसान बजार प्लेटफर्ममा स्वागत छ
 *               priority:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 default: 5
 *                 description: Message priority (1-10)
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *                 description: Message valid from date
 *               validTo:
 *                 type: string
 *                 format: date-time
 *                 description: Message valid until date
 *     responses:
 *       201:
 *         description: Mayor message created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *   get:
 *     summary: Get mayor messages
 *     description: Get all mayor messages with filtering
 *     tags: [Content]
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Mayor messages retrieved successfully
 */
router.post('/mayor', 
  authenticate, 
  requireAdmin, 
  validateMayorMessage,
  handleValidationErrors,
  createMayorMessage
);

router.get('/mayor', optionalAuthenticate, getMayorMessages);

/**
 * @swagger
 * /content/mayor/active:
 *   get:
 *     summary: Get active mayor message
 *     description: Get the current active mayor message
 *     tags: [Content]
 *     responses:
 *       200:
 *         description: Active mayor message retrieved successfully
 *       404:
 *         description: No active mayor message found
 */
router.get('/mayor/active', getActiveMayorMessage);

/**
 * @swagger
 * /content/mayor/{id}:
 *   get:
 *     summary: Get mayor message by ID
 *     description: Get a single mayor message by ID (admin only)
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Mayor message ID
 *     responses:
 *       200:
 *         description: Mayor message retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Mayor message not found
 *   put:
 *     summary: Update mayor message
 *     description: Update a mayor message (admin only)
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Mayor message ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: object
 *                 properties:
 *                   en:
 *                     type: string
 *                   ne:
 *                     type: string
 *               message:
 *                 type: object
 *                 properties:
 *                   en:
 *                     type: string
 *                   ne:
 *                     type: string
 *               priority:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *               isActive:
 *                 type: boolean
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *               validTo:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Mayor message updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Mayor message not found
 *   delete:
 *     summary: Delete mayor message
 *     description: Delete a mayor message (admin only)
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Mayor message ID
 *     responses:
 *       200:
 *         description: Mayor message deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Mayor message not found
 */
router.get('/mayor/:id', 
  authenticate, 
  requireAdmin, 
  getMayorMessageById
);

router.put('/mayor/:id', 
  authenticate, 
  requireAdmin, 
  validateMayorUpdate,
  handleValidationErrors,
  updateMayorMessage
);

router.delete('/mayor/:id', 
  authenticate, 
  requireAdmin, 
  deleteMayorMessage
);

// =============================================================================
// NEWS TICKER ROUTES
// =============================================================================

/**
 * @swagger
 * /content/news:
 *   post:
 *     summary: Create news item
 *     description: Create a new news item (admin only)
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - headline
 *               - link
 *             properties:
 *               headline:
 *                 type: object
 *                 properties:
 *                   en:
 *                     type: string
 *                     example: New Agricultural Policy Announced
 *                   ne:
 *                     type: string
 *                     example: नयाँ कृषि नीति घोषणा
 *               link:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com/news/agricultural-policy
 *               priority:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 default: 5
 *                 description: News priority (1-10)
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               publishedAt:
 *                 type: string
 *                 format: date-time
 *                 description: Publication date
 *     responses:
 *       201:
 *         description: News item created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *   get:
 *     summary: Get news items
 *     description: Get all news items with filtering
 *     tags: [Content]
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [en, ne]
 *         description: Filter by language
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: News items retrieved successfully
 */
router.post('/news', 
  authenticate, 
  requireAdmin, 
  validateNewsItem,
  handleValidationErrors,
  createNewsItem
);

router.get('/news', getNewsItems);

/**
 * @swagger
 * /content/news/ticker:
 *   get:
 *     summary: Get ticker news
 *     description: Get active news items for ticker display
 *     tags: [Content]
 *     parameters:
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [en, ne]
 *           default: en
 *         description: Language preference
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of news items to return
 *     responses:
 *       200:
 *         description: Ticker news retrieved successfully
 */
router.get('/news/ticker', getTickerNews);

/**
 * @swagger
 * /content/news/{id}:
 *   get:
 *     summary: Get news item by ID
 *     description: Get a single news item by ID
 *     tags: [Content]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: News item ID
 *     responses:
 *       200:
 *         description: News item retrieved successfully
 *       404:
 *         description: News item not found
 *   put:
 *     summary: Update news item
 *     description: Update a news item (admin only)
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: News item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               headline:
 *                 type: object
 *                 properties:
 *                   en:
 *                     type: string
 *                   ne:
 *                     type: string
 *               link:
 *                 type: string
 *                 format: uri
 *               priority:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *               isActive:
 *                 type: boolean
 *               publishedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: News item updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: News item not found
 *   delete:
 *     summary: Delete news item
 *     description: Delete a news item (admin only)
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: News item ID
 *     responses:
 *       200:
 *         description: News item deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: News item not found
 */
router.get('/news/:id', getNewsItemById);

router.put('/news/:id', 
  authenticate, 
  requireAdmin, 
  validateNewsUpdate,
  handleValidationErrors,
  updateNewsItem
);

router.delete('/news/:id', 
  authenticate, 
  requireAdmin, 
  deleteNewsItem
);

export default router;