import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../../app';
import { TranslationKey } from '../../models/TranslationKey';
import { User } from '../../models/User';
import jwt from 'jsonwebtoken';

// Mock the config to avoid loading environment variables
jest.mock('../../config/environment', () => ({
  config: {
    JWT_SECRET: 'test-jwt-secret-that-is-at-least-32-characters-long-for-validation',
    NODE_ENV: 'test'
  }
}));

describe('Translation Management API Endpoints', () => {
  let mongoServer: MongoMemoryServer;
  let app: any;
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri);
    
    // Create the app after database connection
    app = createApp();
    
    // Create a test user for authentication
    const testUser = new User({
      email: 'test@example.com',
      password: 'hashedpassword',
      firstName: 'Test',
      lastName: 'User',
      role: 'admin',
      language: 'en'
    });
    const savedUser = await testUser.save();
    testUserId = savedUser._id.toString();

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUserId, email: 'test@example.com', role: 'admin' },
      'test-jwt-secret-that-is-at-least-32-characters-long-for-validation',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Clean up test data and close connections
    try {
      await TranslationKey.deleteMany({});
      await User.deleteMany({});
      await mongoose.connection.close();
      await mongoServer.stop();
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }, 30000);

  beforeEach(async () => {
    // Clean up translation keys before each test
    await TranslationKey.deleteMany({});
  });

  describe('GET /api/translations/translations', () => {
    it('should get translations for English language', async () => {
      // Create test translation
      await TranslationKey.create({
        key: 'common.test',
        namespace: 'common',
        translations: { en: 'Test', ne: 'परीक्षण' },
        isRequired: false,
        updatedBy: testUserId
      });

      const response = await request(app)
        .get('/api/translations/translations?language=en&namespace=common')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.language).toBe('en');
      expect(response.body.data.namespace).toBe('common');
      expect(response.body.data.translations.common.test).toBe('Test');
    });

    it('should return 400 for invalid language', async () => {
      const response = await request(app)
        .get('/api/translations/translations?language=invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Language parameter is required');
    });
  });

  describe('GET /api/translations/translation-keys', () => {
    it('should get translation keys with pagination', async () => {
      // Create test translations
      await TranslationKey.create([
        {
          key: 'common.test1',
          namespace: 'common',
          translations: { en: 'Test 1', ne: 'परीक्षण १' },
          isRequired: false,
          updatedBy: testUserId
        },
        {
          key: 'common.test2',
          namespace: 'common',
          translations: { en: 'Test 2' },
          isRequired: true,
          updatedBy: testUserId
        }
      ]);

      const response = await request(app)
        .get('/api/translations/translation-keys?namespace=common&page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.keys).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.totalPages).toBe(1);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/translations/translation-keys')
        .expect(401);

      expect(response.body.error).toBe('Authentication required');
    });
  });

  describe('POST /api/translations/translation-keys', () => {
    it('should create a new translation key', async () => {
      const translationData = {
        key: 'common.buttons.save',
        namespace: 'common',
        translations: {
          en: 'Save',
          ne: 'सेभ गर्नुहोस्'
        },
        context: 'Button text for save action',
        isRequired: true
      };

      const response = await request(app)
        .post('/api/translations/translation-keys')
        .set('Authorization', `Bearer ${authToken}`)
        .send(translationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.key).toBe('common.buttons.save');
      expect(response.body.data.translations.en).toBe('Save');
      expect(response.body.data.translations.ne).toBe('सेभ गर्नुहोस्');
    });

    it('should return 401 without authentication', async () => {
      const translationData = {
        key: 'common.test',
        namespace: 'common',
        translations: { en: 'Test' }
      };

      const response = await request(app)
        .post('/api/translations/translation-keys')
        .send(translationData)
        .expect(401);

      expect(response.body.error).toBe('Authentication required');
    });

    it('should return 400 for invalid translation key format', async () => {
      const translationData = {
        key: 'invalid-key-format',
        namespace: 'common',
        translations: { en: 'Test' }
      };

      const response = await request(app)
        .post('/api/translations/translation-keys')
        .set('Authorization', `Bearer ${authToken}`)
        .send(translationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('PUT /api/translations/translation-keys/:key', () => {
    it('should update an existing translation key', async () => {
      // Create initial translation
      await TranslationKey.create({
        key: 'common.buttons.edit',
        namespace: 'common',
        translations: { en: 'Edit' },
        isRequired: false,
        updatedBy: testUserId
      });

      const updateData = {
        translations: {
          en: 'Edit Item',
          ne: 'सम्पादन गर्नुहोस्'
        },
        context: 'Button text for edit action'
      };

      const response = await request(app)
        .put('/api/translations/translation-keys/common.buttons.edit')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.translations.en).toBe('Edit Item');
      expect(response.body.data.translations.ne).toBe('सम्पादन गर्नुहोस्');
    });

    it('should return 404 for non-existent translation key', async () => {
      const updateData = {
        translations: { en: 'Updated' }
      };

      const response = await request(app)
        .put('/api/translations/translation-keys/nonexistent.key')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('GET /api/translations/translations/validate', () => {
    it('should validate translation completeness', async () => {
      // Create test translations with mixed completeness
      await TranslationKey.create([
        {
          key: 'common.complete',
          namespace: 'common',
          translations: { en: 'Complete', ne: 'पूर्ण' },
          isRequired: false,
          updatedBy: testUserId
        },
        {
          key: 'common.incomplete',
          namespace: 'common',
          translations: { en: 'Incomplete' },
          isRequired: false,
          updatedBy: testUserId
        }
      ]);

      const response = await request(app)
        .get('/api/translations/translations/validate?namespace=common')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.namespace).toBe('common');
      expect(response.body.data.completeness).toBe(50); // 1 out of 2 complete
      expect(response.body.data.totalKeys).toBe(2);
      expect(response.body.data.missingKeys).toContain('common.incomplete');
    });
  });

  describe('GET /api/translations/translations/export', () => {
    it('should export translations in JSON format', async () => {
      // Create test translation
      await TranslationKey.create({
        key: 'common.export.test',
        namespace: 'common',
        translations: { en: 'Export Test', ne: 'निर्यात परीक्षण' },
        context: 'Test for export functionality',
        isRequired: true,
        updatedBy: testUserId
      });

      const response = await request(app)
        .get('/api/translations/translations/export?format=json')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['content-disposition']).toContain('attachment');
      
      const exportData = JSON.parse(response.text);
      expect(exportData.translations).toHaveLength(1);
      expect(exportData.translations[0].key).toBe('common.export.test');
      expect(exportData.translations[0].en).toBe('Export Test');
      expect(exportData.translations[0].ne).toBe('निर्यात परीक्षण');
    });

    it('should export translations in CSV format', async () => {
      // Create test translation
      await TranslationKey.create({
        key: 'common.csv.test',
        namespace: 'common',
        translations: { en: 'CSV Test', ne: 'CSV परीक्षण' },
        isRequired: false,
        updatedBy: testUserId
      });

      const response = await request(app)
        .get('/api/translations/translations/export?format=csv')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.text).toContain('key,namespace,en,ne,context,isRequired');
      expect(response.text).toContain('common.csv.test');
      expect(response.text).toContain('CSV Test');
    });
  });

  describe('DELETE /api/translations/translation-keys/:key', () => {
    it('should delete an existing translation key', async () => {
      // Create translation to delete
      await TranslationKey.create({
        key: 'common.delete.test',
        namespace: 'common',
        translations: { en: 'Delete Test' },
        isRequired: false,
        updatedBy: testUserId
      });

      const response = await request(app)
        .delete('/api/translations/translation-keys/common.delete.test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Translation deleted successfully');

      // Verify deletion
      const deletedTranslation = await TranslationKey.findOne({ key: 'common.delete.test' });
      expect(deletedTranslation).toBeNull();
    });

    it('should return 404 for non-existent translation key', async () => {
      const response = await request(app)
        .delete('/api/translations/translation-keys/nonexistent.key')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('POST /api/translations/translations/import', () => {
    it('should import translations from JSON file', async () => {
      const importData = {
        exportDate: new Date().toISOString(),
        translations: [
          {
            key: 'common.import.test',
            namespace: 'common',
            en: 'Import Test',
            ne: 'आयात परीक्षण',
            context: 'Test for import functionality',
            isRequired: false
          }
        ]
      };

      const response = await request(app)
        .post('/api/translations/translations/import')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(JSON.stringify(importData)), 'test.json')
        .field('format', 'json')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.imported).toBe(1);
      expect(response.body.data.errors).toHaveLength(0);

      // Verify import
      const importedTranslation = await TranslationKey.findOne({ key: 'common.import.test' });
      expect(importedTranslation).toBeTruthy();
      expect(importedTranslation?.translations.en).toBe('Import Test');
      expect(importedTranslation?.translations.ne).toBe('आयात परीक्षण');
    });

    it('should require authentication for import', async () => {
      const response = await request(app)
        .post('/api/translations/translations/import')
        .attach('file', Buffer.from('{}'), 'test.json')
        .expect(401);

      expect(response.body.error).toBe('Authentication required');
    });

    it('should return 400 when no file is provided', async () => {
      const response = await request(app)
        .post('/api/translations/translations/import')
        .set('Authorization', `Bearer ${authToken}`)
        .field('format', 'json')
        .expect(400);

      expect(response.body.error).toBe('File is required for import');
    });
  });
});