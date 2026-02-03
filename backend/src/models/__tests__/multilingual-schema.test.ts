import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../User';
import { Product } from '../Product';
import { NewsItem } from '../News';
import { GalleryItem } from '../Gallery';
import { TranslationKey } from '../TranslationKey';
import { createMultilingualField } from '../types/multilingual';

describe('Multilingual Schema Tests', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key]?.deleteMany({});
    }
  });

  describe('User Schema with Language Preferences', () => {
    it('should create user with default language preferences', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'BUYER',
        profile: {
          name: 'Test User'
        }
      };

      const user = new User(userData);
      await user.save();

      expect(user.language).toBe('en');
      expect(user.localePreferences).toMatchObject({
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        numberFormat: '1,234.56',
        currency: 'NPR'
      });
      expect(user.lastLanguageUpdate).toBeDefined();
    });

    it('should create user with Nepali language preference', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'BUYER',
        language: 'ne',
        profile: {
          name: 'Test User'
        }
      };

      const user = new User(userData);
      await user.save();

      expect(user.language).toBe('ne');
    });
  });

  describe('Product Schema with Multilingual Fields', () => {
    it('should create product with multilingual name and description', async () => {
      const productData = {
        farmerId: new mongoose.Types.ObjectId(),
        name: createMultilingualField('Organic Tomatoes', 'जैविक टमाटर'),
        description: createMultilingualField(
          'Fresh organic tomatoes grown without pesticides',
          'कीटनाशक बिना उत्पादित ताजा जैविक टमाटर'
        ),
        category: {
          en: 'Vegetables',
          ne: 'तरकारी'
        },
        price: 50,
        unit: 'kg',
        stock: 100
      };

      const product = new Product(productData);
      await product.save();

      expect(product.name.en).toBe('Organic Tomatoes');
      expect(product.name.ne).toBe('जैविक टमाटर');
      expect(product.description.en).toBe('Fresh organic tomatoes grown without pesticides');
      expect(product.description.ne).toBe('कीटनाशक बिना उत्पादित ताजा जैविक टमाटर');
      expect(product.category.en).toBe('Vegetables');
      expect(product.category.ne).toBe('तरकारी');
    });

    it('should get localized product name', async () => {
      const productData = {
        farmerId: new mongoose.Types.ObjectId(),
        name: createMultilingualField('Organic Tomatoes', 'जैविक टमाटर'),
        description: createMultilingualField('Fresh organic tomatoes'),
        category: { en: 'Vegetables' },
        price: 50,
        unit: 'kg',
        stock: 100
      };

      const product = new Product(productData);
      await product.save();

      expect(product.getLocalizedName('en')).toBe('Organic Tomatoes');
      expect(product.getLocalizedName('ne')).toBe('जैविक टमाटर');
    });
  });

  describe('News Schema with Multilingual Fields', () => {
    it('should create news with multilingual headline and content', async () => {
      const newsData = {
        headline: createMultilingualField(
          'New Agricultural Policy Announced',
          'नयाँ कृषि नीति घोषणा'
        ),
        content: createMultilingualField(
          'The government has announced a new agricultural policy to support farmers.',
          'सरकारले किसानहरूलाई सहयोग गर्न नयाँ कृषि नीति घोषणा गरेको छ।'
        ),
        language: 'en',
        createdBy: new mongoose.Types.ObjectId()
      };

      const news = new NewsItem(newsData);
      await news.save();

      expect(news.headline.en).toBe('New Agricultural Policy Announced');
      expect(news.headline.ne).toBe('नयाँ कृषि नीति घोषणा');
      expect(news.getLocalizedHeadline('ne')).toBe('नयाँ कृषि नीति घोषणा');
      expect(news.hasTranslation('ne')).toBe(true);
    });
  });

  describe('Gallery Schema with Multilingual Fields', () => {
    it('should create gallery item with multilingual title', async () => {
      const galleryData = {
        title: createMultilingualField('Harvest Season', 'फसल काट्ने मौसम'),
        imageUrl: 'https://example.com/image.jpg',
        category: {
          en: 'Farm Life',
          ne: 'खेती जीवन'
        },
        order: 1,
        createdBy: new mongoose.Types.ObjectId()
      };

      const gallery = new GalleryItem(galleryData);
      await gallery.save();

      expect(gallery.title.en).toBe('Harvest Season');
      expect(gallery.title.ne).toBe('फसल काट्ने मौसम');
      expect(gallery.getLocalizedTitle('ne')).toBe('फसल काट्ने मौसम');
      expect(gallery.getLocalizedCategory('ne')).toBe('खेती जीवन');
    });
  });

  describe('TranslationKey Schema', () => {
    it('should create translation key with English and Nepali translations', async () => {
      const translationData = {
        key: 'common.buttons.save',
        namespace: 'common',
        translations: {
          en: 'Save',
          ne: 'सेभ गर्नुहोस्'
        },
        isRequired: true,
        updatedBy: new mongoose.Types.ObjectId()
      };

      const translation = new TranslationKey(translationData);
      await translation.save();

      expect(translation.key).toBe('common.buttons.save');
      expect(translation.namespace).toBe('common');
      expect(translation.translations.en).toBe('Save');
      expect(translation.translations.ne).toBe('सेभ गर्नुहोस्');
      expect(translation.hasTranslation('ne')).toBe(true);
      expect(translation.getCompleteness()).toBe(100);
    });

    it('should validate translation key format', async () => {
      const translationData = {
        key: 'invalid-key-format',
        namespace: 'common',
        translations: {
          en: 'Test'
        },
        updatedBy: new mongoose.Types.ObjectId()
      };

      const translation = new TranslationKey(translationData);
      
      await expect(translation.save()).rejects.toThrow();
    });
  });
});