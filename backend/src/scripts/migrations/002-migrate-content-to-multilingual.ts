import mongoose from 'mongoose';
import { Product } from '../../models/Product';
import { NewsItem } from '../../models/News';
import { GalleryItem } from '../../models/Gallery';
import { database } from '../../config/database';

/**
 * Migration script to convert existing content to multilingual format
 * This script migrates existing English content to the new multilingual schema
 * while preserving all existing data.
 */

interface MigrationResult {
  success: boolean;
  productsUpdated: number;
  newsUpdated: number;
  galleryUpdated: number;
  errors: string[];
}

export async function migrateContentToMultilingual(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    productsUpdated: 0,
    newsUpdated: 0,
    galleryUpdated: 0,
    errors: []
  };

  try {
    console.log('Starting content multilingual migration...');

    // Migrate Products
    console.log('Migrating products...');
    const productsResult = await migrateProducts();
    result.productsUpdated = productsResult.updated;
    result.errors.push(...productsResult.errors);

    // Migrate News Items
    console.log('Migrating news items...');
    const newsResult = await migrateNews();
    result.newsUpdated = newsResult.updated;
    result.errors.push(...newsResult.errors);

    // Migrate Gallery Items
    console.log('Migrating gallery items...');
    const galleryResult = await migrateGallery();
    result.galleryUpdated = galleryResult.updated;
    result.errors.push(...galleryResult.errors);

    result.success = result.errors.length === 0;

    console.log(`Migration completed:`);
    console.log(`- Products updated: ${result.productsUpdated}`);
    console.log(`- News items updated: ${result.newsUpdated}`);
    console.log(`- Gallery items updated: ${result.galleryUpdated}`);
    
    if (result.errors.length > 0) {
      console.error(`Migration completed with ${result.errors.length} errors:`);
      result.errors.forEach(error => console.error(`- ${error}`));
    }

    return result;

  } catch (error) {
    const errorMsg = `Migration failed: ${error}`;
    console.error(errorMsg);
    result.errors.push(errorMsg);
    return result;
  }
}

async function migrateProducts(): Promise<{ updated: number; errors: string[] }> {
  const errors: string[] = [];
  let updated = 0;

  try {
    // Find products that need migration (have old string fields)
    const productsToMigrate = await mongoose.connection.db.collection('products').find({
      $or: [
        { 'name.en': { $exists: false } }, // Old string format
        { 'description.en': { $exists: false } }
      ]
    }).toArray();

    console.log(`Found ${productsToMigrate.length} products to migrate`);

    if (productsToMigrate.length === 0) {
      return { updated: 0, errors: [] };
    }

    // Migrate in batches
    const batchSize = 50;
    for (let i = 0; i < productsToMigrate.length; i += batchSize) {
      const batch = productsToMigrate.slice(i, i + batchSize);
      
      try {
        const bulkOps = batch.map(product => {
          const updateDoc: any = {};
          
          // Migrate name field
          if (typeof product.name === 'string') {
            updateDoc.name = {
              en: product.name,
              _lastUpdated: { en: new Date() }
            };
          }
          
          // Migrate description field
          if (typeof product.description === 'string') {
            updateDoc.description = {
              en: product.description,
              _lastUpdated: { en: new Date() }
            };
          }
          
          // Migrate category field
          if (typeof product.category === 'string') {
            updateDoc.category = {
              en: product.category
            };
          }

          return {
            updateOne: {
              filter: { _id: product._id },
              update: { $set: updateDoc }
            }
          };
        });

        const batchResult = await mongoose.connection.db.collection('products').bulkWrite(bulkOps);
        updated += batchResult.modifiedCount;
        
        console.log(`Migrated products batch ${Math.floor(i / batchSize) + 1}: ${batchResult.modifiedCount} products`);
      } catch (batchError) {
        const errorMsg = `Error migrating products batch ${Math.floor(i / batchSize) + 1}: ${batchError}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

  } catch (error) {
    const errorMsg = `Error migrating products: ${error}`;
    console.error(errorMsg);
    errors.push(errorMsg);
  }

  return { updated, errors };
}

async function migrateNews(): Promise<{ updated: number; errors: string[] }> {
  const errors: string[] = [];
  let updated = 0;

  try {
    // Find news items that need migration
    const newsToMigrate = await mongoose.connection.db.collection('newsitems').find({
      $or: [
        { 'headline.en': { $exists: false } },
        { 'content.en': { $exists: false } }
      ]
    }).toArray();

    console.log(`Found ${newsToMigrate.length} news items to migrate`);

    if (newsToMigrate.length === 0) {
      return { updated: 0, errors: [] };
    }

    // Migrate in batches
    const batchSize = 50;
    for (let i = 0; i < newsToMigrate.length; i += batchSize) {
      const batch = newsToMigrate.slice(i, i + batchSize);
      
      try {
        const bulkOps = batch.map(news => {
          const updateDoc: any = {};
          
          // Migrate headline field
          if (typeof news.headline === 'string') {
            updateDoc.headline = {
              en: news.headline,
              _lastUpdated: { en: new Date() }
            };
          }
          
          // Migrate content field
          if (typeof news.content === 'string') {
            updateDoc.content = {
              en: news.content,
              _lastUpdated: { en: new Date() }
            };
          }

          // Ensure language field is set correctly
          if (!news.language || !['en', 'ne'].includes(news.language)) {
            updateDoc.language = 'en';
          }

          return {
            updateOne: {
              filter: { _id: news._id },
              update: { $set: updateDoc }
            }
          };
        });

        const batchResult = await mongoose.connection.db.collection('newsitems').bulkWrite(bulkOps);
        updated += batchResult.modifiedCount;
        
        console.log(`Migrated news batch ${Math.floor(i / batchSize) + 1}: ${batchResult.modifiedCount} news items`);
      } catch (batchError) {
        const errorMsg = `Error migrating news batch ${Math.floor(i / batchSize) + 1}: ${batchError}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

  } catch (error) {
    const errorMsg = `Error migrating news: ${error}`;
    console.error(errorMsg);
    errors.push(errorMsg);
  }

  return { updated, errors };
}

async function migrateGallery(): Promise<{ updated: number; errors: string[] }> {
  const errors: string[] = [];
  let updated = 0;

  try {
    // Find gallery items that need migration
    const galleryToMigrate = await mongoose.connection.db.collection('galleryitems').find({
      $or: [
        { 'title.en': { $exists: false } },
        { 'category.en': { $exists: false } }
      ]
    }).toArray();

    console.log(`Found ${galleryToMigrate.length} gallery items to migrate`);

    if (galleryToMigrate.length === 0) {
      return { updated: 0, errors: [] };
    }

    // Migrate in batches
    const batchSize = 50;
    for (let i = 0; i < galleryToMigrate.length; i += batchSize) {
      const batch = galleryToMigrate.slice(i, i + batchSize);
      
      try {
        const bulkOps = batch.map(gallery => {
          const updateDoc: any = {};
          
          // Migrate title field
          if (typeof gallery.title === 'string') {
            updateDoc.title = {
              en: gallery.title,
              _lastUpdated: { en: new Date() }
            };
          }
          
          // Migrate category field
          if (typeof gallery.category === 'string') {
            updateDoc.category = {
              en: gallery.category
            };
          }

          return {
            updateOne: {
              filter: { _id: gallery._id },
              update: { $set: updateDoc }
            }
          };
        });

        const batchResult = await mongoose.connection.db.collection('galleryitems').bulkWrite(bulkOps);
        updated += batchResult.modifiedCount;
        
        console.log(`Migrated gallery batch ${Math.floor(i / batchSize) + 1}: ${batchResult.modifiedCount} gallery items`);
      } catch (batchError) {
        const errorMsg = `Error migrating gallery batch ${Math.floor(i / batchSize) + 1}: ${batchError}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

  } catch (error) {
    const errorMsg = `Error migrating gallery: ${error}`;
    console.error(errorMsg);
    errors.push(errorMsg);
  }

  return { updated, errors };
}

// Script execution when run directly
if (require.main === module) {
  async function runMigration() {
    try {
      // Connect to database
      await database.connect();
      console.log('Connected to database');

      // Run migration
      const result = await migrateContentToMultilingual();

      if (result.success) {
        console.log(`✅ Migration successful!`);
        console.log(`Updated: ${result.productsUpdated} products, ${result.newsUpdated} news, ${result.galleryUpdated} gallery items`);
        process.exit(0);
      } else {
        console.error(`❌ Migration failed with ${result.errors.length} errors.`);
        result.errors.forEach(error => console.error(`- ${error}`));
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    } finally {
      // Close database connection
      await mongoose.connection.close();
    }
  }

  runMigration();
}