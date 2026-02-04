import { Router } from 'express';
import multer from 'multer';
import { TranslationController } from '../controllers/translationController';
import { authenticate } from '../middleware/auth';
import { validateTranslationData, validateUpdateTranslationData, validateContentData } from '../validators/translationValidators';

const router = Router();
const translationController = new TranslationController();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || 
        file.mimetype === 'text/csv' || 
        file.originalname.endsWith('.json') || 
        file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only JSON and CSV files are allowed'));
    }
  }
});

// Translation key management routes

/**
 * @swagger
 * /translations/keys:
 *   get:
 *     summary: Get translation keys
 *     description: Get all translation keys with optional filtering (admin only)
 *     tags: [Translations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: namespace
 *         schema:
 *           type: string
 *         description: Filter by namespace
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [en, ne]
 *         description: Filter by language
 *       - in: query
 *         name: incomplete
 *         schema:
 *           type: boolean
 *         description: Show only incomplete translations
 *     responses:
 *       200:
 *         description: Translation keys retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/keys', authenticate, translationController.getTranslationKeys.bind(translationController));

/**
 * @swagger
 * /translations/validate:
 *   get:
 *     summary: Validate translation completeness
 *     description: Validate completeness of translations (admin only)
 *     tags: [Translations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: namespace
 *         schema:
 *           type: string
 *         description: Validate specific namespace
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [en, ne]
 *         description: Validate specific language
 *     responses:
 *       200:
 *         description: Validation results retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/validate', authenticate, translationController.validateCompleteness.bind(translationController));

/**
 * @swagger
 * /translations/export:
 *   get:
 *     summary: Export translations
 *     description: Export translations in various formats (admin only)
 *     tags: [Translations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *         description: Export format
 *       - in: query
 *         name: namespace
 *         schema:
 *           type: string
 *         description: Export specific namespace
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [en, ne]
 *         description: Export specific language
 *     responses:
 *       200:
 *         description: Translations exported successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/export', authenticate, translationController.exportTranslations.bind(translationController));

/**
 * @swagger
 * /translations/import:
 *   post:
 *     summary: Import translations
 *     description: Import translations from file (admin only)
 *     tags: [Translations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: JSON or CSV file containing translations
 *               overwrite:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to overwrite existing translations
 *     responses:
 *       200:
 *         description: Translations imported successfully
 *       400:
 *         description: Invalid file format or data
 *       401:
 *         description: Unauthorized
 */
router.post('/import', authenticate, upload.single('file'), translationController.importTranslations.bind(translationController));

/**
 * @swagger
 * /translations:
 *   get:
 *     summary: Get translations
 *     description: Get translations for a specific language
 *     tags: [Translations]
 *     parameters:
 *       - in: query
 *         name: language
 *         required: true
 *         schema:
 *           type: string
 *           enum: [en, ne]
 *         description: Language code
 *       - in: query
 *         name: namespace
 *         schema:
 *           type: string
 *         description: Filter by namespace
 *     responses:
 *       200:
 *         description: Translations retrieved successfully
 *   post:
 *     summary: Create translation
 *     description: Create a new translation (admin only)
 *     tags: [Translations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *               - namespace
 *               - translations
 *             properties:
 *               key:
 *                 type: string
 *                 example: welcome_message
 *               namespace:
 *                 type: string
 *                 example: common
 *               translations:
 *                 type: object
 *                 properties:
 *                   en:
 *                     type: string
 *                     example: Welcome to our platform
 *                   ne:
 *                     type: string
 *                     example: हाम्रो प्लेटफर्ममा स्वागत छ
 *     responses:
 *       201:
 *         description: Translation created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.get('/', translationController.getTranslations.bind(translationController));
router.post('/', authenticate, validateTranslationData, translationController.createTranslation.bind(translationController));

/**
 * @swagger
 * /translations/{key}:
 *   put:
 *     summary: Update translation
 *     description: Update an existing translation (admin only)
 *     tags: [Translations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Translation key
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               translations:
 *                 type: object
 *                 properties:
 *                   en:
 *                     type: string
 *                   ne:
 *                     type: string
 *     responses:
 *       200:
 *         description: Translation updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Translation not found
 *   delete:
 *     summary: Delete translation
 *     description: Delete a translation (admin only)
 *     tags: [Translations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Translation key
 *     responses:
 *       200:
 *         description: Translation deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Translation not found
 */
router.put('/:key', authenticate, validateUpdateTranslationData, translationController.updateTranslation.bind(translationController));
router.delete('/:key', authenticate, translationController.deleteTranslation.bind(translationController));

// Multilingual content management routes

/**
 * @swagger
 * /translations/content:
 *   post:
 *     summary: Create multilingual content
 *     description: Create multilingual content (admin only)
 *     tags: [Translations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentType
 *               - content
 *             properties:
 *               contentType:
 *                 type: string
 *                 example: product
 *               content:
 *                 type: object
 *                 properties:
 *                   en:
 *                     type: object
 *                   ne:
 *                     type: object
 *     responses:
 *       201:
 *         description: Multilingual content created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/content', authenticate, validateContentData, translationController.createMultilingualContent.bind(translationController));

/**
 * @swagger
 * /translations/content/{id}:
 *   put:
 *     summary: Update multilingual content
 *     description: Update multilingual content (admin only)
 *     tags: [Translations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Content ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: object
 *                 properties:
 *                   en:
 *                     type: object
 *                   ne:
 *                     type: object
 *     responses:
 *       200:
 *         description: Multilingual content updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Content not found
 */
router.put('/content/:id', authenticate, validateContentData, translationController.updateMultilingualContent.bind(translationController));

/**
 * @swagger
 * /translations/content/search:
 *   get:
 *     summary: Search multilingual content
 *     description: Search multilingual content
 *     tags: [Translations]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: contentType
 *         schema:
 *           type: string
 *         description: Content type filter
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [en, ne]
 *         description: Language preference
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 */
router.get('/content/search', translationController.searchMultilingualContent.bind(translationController));

/**
 * @swagger
 * /translations/content/{contentType}/{id}:
 *   get:
 *     summary: Get localized content
 *     description: Get localized content by type and ID
 *     tags: [Translations]
 *     parameters:
 *       - in: path
 *         name: contentType
 *         required: true
 *         schema:
 *           type: string
 *         description: Content type
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Content ID
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [en, ne]
 *           default: en
 *         description: Language preference
 *     responses:
 *       200:
 *         description: Localized content retrieved successfully
 *       404:
 *         description: Content not found
 */
router.get('/content/:contentType/:id', translationController.getLocalizedContent.bind(translationController));

// Version control routes

/**
 * @swagger
 * /translations/{key}/history:
 *   get:
 *     summary: Get translation history
 *     description: Get version history for a translation key (admin only)
 *     tags: [Translations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Translation key
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of history entries to return
 *     responses:
 *       200:
 *         description: Translation history retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Translation not found
 */
router.get('/:key/history', authenticate, translationController.getTranslationHistory.bind(translationController));

/**
 * @swagger
 * /translations/changes/recent:
 *   get:
 *     summary: Get recent changes
 *     description: Get recent translation changes (admin only)
 *     tags: [Translations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of recent changes to return
 *       - in: query
 *         name: namespace
 *         schema:
 *           type: string
 *         description: Filter by namespace
 *     responses:
 *       200:
 *         description: Recent changes retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/changes/recent', authenticate, translationController.getRecentChanges.bind(translationController));

/**
 * @swagger
 * /translations/{key}/rollback:
 *   post:
 *     summary: Rollback translation
 *     description: Rollback translation to a previous version (admin only)
 *     tags: [Translations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Translation key
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - versionId
 *             properties:
 *               versionId:
 *                 type: string
 *                 description: Version ID to rollback to
 *     responses:
 *       200:
 *         description: Translation rolled back successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Translation or version not found
 */
router.post('/:key/rollback', authenticate, translationController.rollbackTranslation.bind(translationController));

/**
 * @swagger
 * /translations/{key}/compare:
 *   get:
 *     summary: Compare translation versions
 *     description: Compare different versions of a translation (admin only)
 *     tags: [Translations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Translation key
 *       - in: query
 *         name: version1
 *         required: true
 *         schema:
 *           type: string
 *         description: First version ID
 *       - in: query
 *         name: version2
 *         required: true
 *         schema:
 *           type: string
 *         description: Second version ID
 *     responses:
 *       200:
 *         description: Version comparison retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Translation or versions not found
 */
router.get('/:key/compare', authenticate, translationController.compareVersions.bind(translationController));

export default router;