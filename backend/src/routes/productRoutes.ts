import { Router } from 'express';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsByFarmer,
  getMyProducts,
  getFeaturedProducts,
  searchProducts
} from '../controllers/productController';
import {
  authenticate,
  optionalAuthenticate,
  requireFarmer,
  requireFarmerOrAdmin
} from '../middleware/auth';
import { handleValidationErrors, sanitizeInput } from '../middleware/validation';
import { cacheMiddleware, invalidateCache } from '../middleware/cache';
import {
  validateCreateProduct,
  validateUpdateProduct,
  validateProductSearch,
  validateProductId,
  validateFarmerId
} from '../validators/productValidators';

const router = Router();

// Apply sanitization middleware to all routes
router.use(sanitizeInput);

// Routes

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     description: Create a new product (farmers only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - category
 *               - price
 *               - unit
 *               - stock
 *             properties:
 *               name:
 *                 type: string
 *                 description: Product name
 *                 example: Organic Tomatoes
 *               description:
 *                 type: string
 *                 description: Product description
 *                 example: Fresh organic tomatoes grown without pesticides
 *               category:
 *                 type: string
 *                 description: Product category
 *                 example: Vegetables
 *               price:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 description: Product price per unit
 *                 example: 4.99
 *               unit:
 *                 type: string
 *                 description: Unit of measurement
 *                 example: kg
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *                 description: Available stock quantity
 *                 example: 50
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *                 description: Array of product image URLs
 *                 example: ["https://example.com/tomato1.jpg"]
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Farmers only
 *   get:
 *     summary: Get all products
 *     description: Get all products with optional search and filtering
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for product name or description
 *         example: tomato
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by product category
 *         example: Vegetables
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *         example: 1.00
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *         example: 10.00
 *       - in: query
 *         name: farmerId
 *         schema:
 *           type: string
 *         description: Filter by farmer ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PUBLISHED, INACTIVE]
 *         description: Filter by product status (authenticated users only)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 */
router.post(
  '/',
  authenticate,
  requireFarmer,
  validateCreateProduct,
  handleValidationErrors,
  invalidateCache(['products']),
  createProduct
);

router.get(
  '/',
  optionalAuthenticate,
  validateProductSearch,
  handleValidationErrors,
  cacheMiddleware(300), // Cache for 5 minutes
  getProducts
);

/**
 * @swagger
 * /products/search:
 *   get:
 *     summary: Advanced multilingual product search
 *     description: Search products with enhanced multilingual capabilities
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for product name, description, or category
 *         example: tomato
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [en, ne, both]
 *           default: both
 *         description: Language preference for search
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by product category
 *         example: Vegetables
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *         example: 1.00
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *         example: 10.00
 *       - in: query
 *         name: farmerId
 *         schema:
 *           type: string
 *         description: Filter by farmer ID
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [relevance, name, price, createdAt]
 *           default: relevance
 *         description: Sort results by field
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *                     searchInfo:
 *                       type: object
 *                       properties:
 *                         query:
 *                           type: string
 *                         language:
 *                           type: string
 *                         preferredLanguage:
 *                           type: string
 *                         resultsFound:
 *                           type: integer
 */
router.get(
  '/search',
  validateProductSearch,
  handleValidationErrors,
  cacheMiddleware(300), // Cache for 5 minutes
  searchProducts
);

/**
 * @swagger
 * /products/featured:
 *   get:
 *     summary: Get featured products
 *     description: Get featured/popular products for homepage
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 8
 *         description: Number of featured products to return
 *     responses:
 *       200:
 *         description: Featured products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 */
router.get(
  '/featured',
  validateProductSearch,
  handleValidationErrors,
  cacheMiddleware(600), // Cache for 10 minutes
  getFeaturedProducts
);

/**
 * @swagger
 * /products/my-products:
 *   get:
 *     summary: Get current farmer's products
 *     description: Get all products belonging to the authenticated farmer
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PUBLISHED, INACTIVE]
 *         description: Filter by product status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Farmer products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Farmers only
 */
router.get(
  '/my-products',
  authenticate,
  requireFarmer,
  validateProductSearch,
  handleValidationErrors,
  cacheMiddleware(300), // Cache for 5 minutes
  getMyProducts
);

/**
 * @swagger
 * /products/farmer/{farmerId}:
 *   get:
 *     summary: Get products by farmer
 *     description: Get all products from a specific farmer
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: farmerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Farmer ID
 *         example: 64f1a2b3c4d5e6f7g8h9i0j3
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PUBLISHED, INACTIVE]
 *         description: Filter by product status (farmer owner only)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Farmer products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *       404:
 *         description: Farmer not found
 */
router.get(
  '/farmer/:farmerId',
  optionalAuthenticate,
  validateFarmerId,
  validateProductSearch,
  handleValidationErrors,
  cacheMiddleware(300), // Cache for 5 minutes
  getProductsByFarmer
);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get product by ID
 *     description: Get a single product by its ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *         example: 64f1a2b3c4d5e6f7g8h9i0j2
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *   put:
 *     summary: Update product
 *     description: Update a product (farmer owner or admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *         example: 64f1a2b3c4d5e6f7g8h9i0j2
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Product name
 *                 example: Organic Cherry Tomatoes
 *               description:
 *                 type: string
 *                 description: Product description
 *                 example: Sweet organic cherry tomatoes
 *               category:
 *                 type: string
 *                 description: Product category
 *                 example: Vegetables
 *               price:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 description: Product price per unit
 *                 example: 5.99
 *               unit:
 *                 type: string
 *                 description: Unit of measurement
 *                 example: kg
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *                 description: Available stock quantity
 *                 example: 30
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *                 description: Array of product image URLs
 *               status:
 *                 type: string
 *                 enum: [DRAFT, PUBLISHED, INACTIVE]
 *                 description: Product status
 *                 example: PUBLISHED
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not product owner or admin
 *       404:
 *         description: Product not found
 *   delete:
 *     summary: Delete product
 *     description: Delete a product (farmer owner or admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *         example: 64f1a2b3c4d5e6f7g8h9i0j2
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not product owner or admin
 *       404:
 *         description: Product not found
 */
router.get(
  '/:id',
  optionalAuthenticate,
  validateProductId,
  handleValidationErrors,
  cacheMiddleware(600), // Cache for 10 minutes
  getProductById
);

router.put(
  '/:id',
  authenticate,
  requireFarmerOrAdmin,
  validateProductId,
  validateUpdateProduct,
  handleValidationErrors,
  invalidateCache(['products']),
  updateProduct
);

router.delete(
  '/:id',
  authenticate,
  requireFarmerOrAdmin,
  validateProductId,
  handleValidationErrors,
  invalidateCache(['products']),
  deleteProduct
);

export default router;