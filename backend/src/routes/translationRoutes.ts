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
router.get('/keys', authenticate, translationController.getTranslationKeys.bind(translationController));
router.get('/validate', authenticate, translationController.validateCompleteness.bind(translationController));
router.get('/export', authenticate, translationController.exportTranslations.bind(translationController));
router.post('/import', authenticate, upload.single('file'), translationController.importTranslations.bind(translationController));
router.get('/', translationController.getTranslations.bind(translationController));
router.post('/', authenticate, validateTranslationData, translationController.createTranslation.bind(translationController));
router.put('/:key', authenticate, validateUpdateTranslationData, translationController.updateTranslation.bind(translationController));
router.delete('/:key', authenticate, translationController.deleteTranslation.bind(translationController));

// Multilingual content management routes
router.post('/content', authenticate, validateContentData, translationController.createMultilingualContent.bind(translationController));
router.put('/content/:id', authenticate, validateContentData, translationController.updateMultilingualContent.bind(translationController));
router.get('/content/search', translationController.searchMultilingualContent.bind(translationController));
router.get('/content/:contentType/:id', translationController.getLocalizedContent.bind(translationController));

// Version control routes
router.get('/:key/history', authenticate, translationController.getTranslationHistory.bind(translationController));
router.get('/changes/recent', authenticate, translationController.getRecentChanges.bind(translationController));
router.post('/:key/rollback', authenticate, translationController.rollbackTranslation.bind(translationController));
router.get('/:key/compare', authenticate, translationController.compareVersions.bind(translationController));

export default router;