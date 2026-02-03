import { Router } from 'express';
import { register, login, getProfile, refreshToken, updateLanguagePreferences, updateProfile } from '../controllers/authController';
import { validateRegister, validateLogin } from '../validators/authValidators';
import { authenticate } from '../middleware/auth';
import { handleValidationErrors, sanitizeInput } from '../middleware/validation';

const router = Router();

// Apply sanitization middleware to all routes
router.use(sanitizeInput);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Register a new user as either a buyer or farmer
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - role
 *               - profile
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: User password (minimum 6 characters)
 *                 example: securePassword123
 *               role:
 *                 type: string
 *                 enum: [BUYER, FARMER]
 *                 description: User role in the system
 *                 example: BUYER
 *               profile:
 *                 type: object
 *                 required:
 *                   - name
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: User full name
 *                     example: John Doe
 *                   phone:
 *                     type: string
 *                     description: User phone number
 *                     example: +1234567890
 *                   address:
 *                     type: string
 *                     description: User address
 *                     example: 123 Main St, City, State 12345
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         token:
 *                           type: string
 *                           description: JWT authentication token
 *                           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.post('/register', validateRegister, handleValidationErrors, register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user and receive JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 description: User password
 *                 example: securePassword123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         token:
 *                           type: string
 *                           description: JWT authentication token
 *                           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.post('/login', validateLogin, handleValidationErrors, login);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the profile information of the currently authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get('/profile', authenticate, getProfile);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user info (alias for profile)
 *     description: Retrieve the current authenticated user information (same as /profile)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User info retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get('/me', authenticate, getProfile);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh JWT token
 *     description: Generate a new JWT token for the authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         token:
 *                           type: string
 *                           description: New JWT authentication token
 *                           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.post('/refresh', authenticate, refreshToken);

/**
 * @swagger
 * /auth/language-preferences:
 *   patch:
 *     summary: Update user language and locale preferences
 *     description: Update the language and locale formatting preferences for the authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               language:
 *                 type: string
 *                 enum: [en, ne]
 *                 description: Preferred language
 *                 example: ne
 *               localePreferences:
 *                 type: object
 *                 properties:
 *                   dateFormat:
 *                     type: string
 *                     enum: [DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, DD-MM-YYYY]
 *                     description: Date format preference
 *                     example: DD/MM/YYYY
 *                   timeFormat:
 *                     type: string
 *                     enum: [12h, 24h]
 *                     description: Time format preference
 *                     example: 24h
 *                   numberFormat:
 *                     type: string
 *                     enum: [1,234.56, 1.234,56, 1 234,56, 1234.56]
 *                     description: Number format preference
 *                     example: 1,234.56
 *                   currency:
 *                     type: string
 *                     enum: [NPR, USD, EUR]
 *                     description: Currency preference
 *                     example: NPR
 *     responses:
 *       200:
 *         description: Language preferences updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         language:
 *                           type: string
 *                           example: ne
 *                         localePreferences:
 *                           type: object
 *                           properties:
 *                             dateFormat:
 *                               type: string
 *                               example: DD/MM/YYYY
 *                             timeFormat:
 *                               type: string
 *                               example: 24h
 *                             numberFormat:
 *                               type: string
 *                               example: 1,234.56
 *                             currency:
 *                               type: string
 *                               example: NPR
 *       400:
 *         description: Invalid language or preferences
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.patch('/language-preferences', authenticate, updateLanguagePreferences);

/**
 * @swagger
 * /auth/profile:
 *   patch:
 *     summary: Update user profile
 *     description: Update the profile information, language, and locale preferences for the authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profile:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: User's full name
 *                     example: John Doe
 *                   phone:
 *                     type: string
 *                     description: User's phone number
 *                     example: +977-9841234567
 *                   address:
 *                     type: string
 *                     description: User's address
 *                     example: Kathmandu, Nepal
 *               language:
 *                 type: string
 *                 enum: [en, ne]
 *                 description: Preferred language
 *                 example: ne
 *               localePreferences:
 *                 type: object
 *                 properties:
 *                   dateFormat:
 *                     type: string
 *                     enum: [DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, DD-MM-YYYY]
 *                     description: Date format preference
 *                     example: DD/MM/YYYY
 *                   timeFormat:
 *                     type: string
 *                     enum: [12h, 24h]
 *                     description: Time format preference
 *                     example: 24h
 *                   numberFormat:
 *                     type: string
 *                     enum: [1,234.56, 1.234,56, 1 234,56, 1234.56]
 *                     description: Number format preference
 *                     example: 1,234.56
 *                   currency:
 *                     type: string
 *                     enum: [NPR, USD, EUR]
 *                     description: Currency preference
 *                     example: NPR
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.patch('/profile', authenticate, updateProfile);

export default router;