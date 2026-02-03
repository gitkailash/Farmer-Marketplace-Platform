import * as fc from 'fast-check';
import mongoose from 'mongoose';
import { GalleryItem, MayorMessage, NewsItem, NewsPriority, User, UserRole } from '../../models';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from '../../test/setup';

// **Feature: farmer-marketplace-platform, Property 21: Gallery Content Management**
// **Feature: farmer-marketplace-platform, Property 22: Mayor Message Configuration**
// **Feature: farmer-marketplace-platform, Property 23: News Ticker Navigation**
// **Feature: farmer-marketplace-platform, Property 24: Multilingual News Support**

describe('Content Management Property Tests', () => {
  let adminUser: any;

  beforeAll(async () => {
    await setupTestDatabase();
    
    // Create admin user for tests
    adminUser = new User({
      email: 'admin@test.com',
      password: 'hashedpassword',
      role: UserRole.ADMIN,
      profile: {
        name: 'Test Admin'
      }
    });
    await adminUser.save();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
    
    // Recreate admin user for each test
    adminUser = new User({
      email: 'admin@test.com',
      password: 'hashedpassword',
      role: UserRole.ADMIN,
      profile: {
        name: 'Test Admin'
      }
    });
    await adminUser.save();
  });

  // Property 21: Gallery Content Management
  it('Property 21: Gallery Content Management - For any administrator, they should be able to create, update, delete, and reorder gallery items', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 2, maxLength: 200 }),
          imageUrl: fc.webUrl().map(url => `${url}.jpg`),
          category: fc.constantFrom(
            'Featured Products',
            'Farm Life', 
            'Community Events',
            'Seasonal Highlights',
            'Success Stories',
            'Educational',
            'Other'
          ),
          order: fc.integer({ min: 0, max: 9999 }),
          isActive: fc.boolean()
        }),
        async (galleryData) => {
          // Test CREATE operation
          const galleryItem = new GalleryItem({
            ...galleryData,
            createdBy: adminUser._id
          });
          await galleryItem.save();
          
          expect(galleryItem._id).toBeDefined();
          expect(galleryItem.title).toBe(galleryData.title);
          expect(galleryItem.createdBy.toString()).toBe(adminUser._id.toString());
          
          // Test UPDATE operation
          const updatedTitle = `Updated ${galleryData.title}`;
          galleryItem.title = updatedTitle;
          await galleryItem.save();
          
          const updatedItem = await GalleryItem.findById(galleryItem._id);
          expect(updatedItem?.title).toBe(updatedTitle);
          
          // Test REORDER operation
          const newOrder = galleryData.order + 1;
          galleryItem.order = newOrder;
          await galleryItem.save();
          
          const reorderedItem = await GalleryItem.findById(galleryItem._id);
          expect(reorderedItem?.order).toBe(newOrder);
          
          // Test DELETE operation
          await GalleryItem.findByIdAndDelete(galleryItem._id);
          const deletedItem = await GalleryItem.findById(galleryItem._id);
          expect(deletedItem).toBeNull();
        }
      ),
      { numRuns: 10 }
    );
  });

  // Property 22: Mayor Message Configuration
  it('Property 22: Mayor Message Configuration - For any mayor message, administrators should be able to configure text, optional image, scrolling speed, and active status', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          text: fc.string({ minLength: 5, maxLength: 1000 }),
          imageUrl: fc.option(fc.webUrl().map(url => `${url}.jpg`)),
          scrollSpeed: fc.integer({ min: 10, max: 500 }),
          isActive: fc.boolean()
        }),
        async (mayorData) => {
          // Test CREATE with configuration
          const mayorMessage = new MayorMessage({
            ...mayorData,
            createdBy: adminUser._id
          });
          await mayorMessage.save();
          
          expect(mayorMessage.text).toBe(mayorData.text);
          expect(mayorMessage.scrollSpeed).toBe(mayorData.scrollSpeed);
          expect(mayorMessage.isActive).toBe(mayorData.isActive);
          
          if (mayorData.imageUrl) {
            expect(mayorMessage.imageUrl).toBe(mayorData.imageUrl);
          }
          
          // Test UPDATE configuration
          const newScrollSpeed = mayorData.scrollSpeed === 10 ? 50 : mayorData.scrollSpeed - 10;
          mayorMessage.scrollSpeed = newScrollSpeed;
          await mayorMessage.save();
          
          const updatedMessage = await MayorMessage.findById(mayorMessage._id);
          expect(updatedMessage?.scrollSpeed).toBe(newScrollSpeed);
          
          // Test image configuration
          if (mayorData.imageUrl) {
            mayorMessage.imageUrl = null;
            await mayorMessage.save();
            
            const messageWithoutImage = await MayorMessage.findById(mayorMessage._id);
            expect(messageWithoutImage?.imageUrl).toBeNull();
          }
          
          // Test active status configuration
          const newActiveStatus = !mayorData.isActive;
          mayorMessage.isActive = newActiveStatus;
          await mayorMessage.save();
          
          const statusUpdatedMessage = await MayorMessage.findById(mayorMessage._id);
          expect(statusUpdatedMessage?.isActive).toBe(newActiveStatus);
        }
      ),
      { numRuns: 10 }
    );
  });

  // Property 23: News Ticker Navigation
  it('Property 23: News Ticker Navigation - For any news headline with a configured link, clicking it should navigate to the correct URL', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          headline: fc.string({ minLength: 5, maxLength: 200 }),
          link: fc.option(fc.webUrl()),
          priority: fc.constantFrom(NewsPriority.LOW, NewsPriority.NORMAL, NewsPriority.HIGH),
          language: fc.constantFrom('en', 'es', 'fr', 'pt', 'de'),
          isActive: fc.boolean()
        }),
        async (newsData) => {
          const newsItem = new NewsItem({
            ...newsData,
            createdBy: adminUser._id
          });
          await newsItem.save();
          
          expect(newsItem.headline).toBe(newsData.headline);
          
          // Test link configuration
          if (newsData.link) {
            expect(newsItem.link).toBe(newsData.link);
            
            // Simulate navigation by verifying link is valid URL
            const url = new URL(newsItem.link!);
            expect(url.protocol).toMatch(/^https?:$/);
            expect(url.hostname).toBeTruthy();
          }
          
          // Test that news items can be retrieved for ticker display
          const tickerNews = await NewsItem.find({
            isActive: true,
            language: newsData.language
          }).select('headline link priority publishedAt');
          
          if (newsData.isActive) {
            const foundItem = tickerNews.find(item => 
              item.headline === newsData.headline
            );
            expect(foundItem).toBeTruthy();
            
            if (newsData.link) {
              expect(foundItem?.link).toBe(newsData.link);
            }
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  // Property 24: Multilingual News Support
  it('Property 24: Multilingual News Support - For any news item, it should support storage and retrieval of content in different languages', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            headline: fc.string({ minLength: 5, maxLength: 200 }),
            content: fc.option(fc.string({ minLength: 10, maxLength: 1000 })),
            language: fc.constantFrom('en', 'es', 'fr', 'pt', 'de', 'it', 'nl', 'zh', 'ja'),
            priority: fc.constantFrom(NewsPriority.LOW, NewsPriority.NORMAL, NewsPriority.HIGH),
            isActive: fc.boolean()
          }),
          { minLength: 2, maxLength: 10 }
        ),
        async (newsItems) => {
          // Create news items in different languages
          const createdItems = [];
          
          for (const newsData of newsItems) {
            const newsItem = new NewsItem({
              ...newsData,
              createdBy: adminUser._id
            });
            await newsItem.save();
            createdItems.push(newsItem);
          }
          
          // Test language-specific retrieval
          const languages = [...new Set(newsItems.map(item => item.language))];
          
          for (const language of languages) {
            const languageSpecificNews = await NewsItem.find({
              language: language,
              isActive: true
            });
            
            const expectedCount = newsItems.filter(item => 
              item.language === language && item.isActive
            ).length;
            
            expect(languageSpecificNews.length).toBe(expectedCount);
            
            // Verify all returned items have correct language
            languageSpecificNews.forEach(item => {
              expect(item.language).toBe(language);
            });
          }
          
          // Test that different languages can coexist
          if (languages.length > 1) {
            const allActiveNews = await NewsItem.find({ isActive: true });
            const languageGroups = new Set(allActiveNews.map(item => item.language));
            
            expect(languageGroups.size).toBeGreaterThan(1);
          }
          
          // Test language validation
          for (const item of createdItems) {
            expect(['en', 'es', 'fr', 'pt', 'de', 'it', 'nl', 'pl', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi', 'sw']).toContain(item.language);
          }
        }
      ),
      { numRuns: 5 } // Reduced runs due to complexity of creating multiple items
    );
  });
});