import mongoose from 'mongoose';
import { database } from '../../config/database';
import { migrateUserLanguagePreferences } from './001-add-user-language-preferences';
import { migrateContentToMultilingual } from './002-migrate-content-to-multilingual';
import { addMultilingualIndexes, dropOldIndexes } from './003-add-multilingual-indexes';

/**
 * Master migration script that runs all multilingual migrations in order
 * This script ensures all database changes are applied correctly and safely
 */

interface MasterMigrationResult {
  success: boolean;
  migrationsRun: string[];
  totalUsersUpdated: number;
  totalContentUpdated: number;
  totalIndexesCreated: number;
  errors: string[];
}

export async function runAllMigrations(): Promise<MasterMigrationResult> {
  const result: MasterMigrationResult = {
    success: false,
    migrationsRun: [],
    totalUsersUpdated: 0,
    totalContentUpdated: 0,
    totalIndexesCreated: 0,
    errors: []
  };

  try {
    console.log('🚀 Starting complete multilingual migration...');
    console.log('=====================================');

    // Migration 1: Add user language preferences
    console.log('\n📝 Step 1: Adding user language preferences...');
    try {
      const userMigrationResult = await migrateUserLanguagePreferences();
      result.migrationsRun.push('001-add-user-language-preferences');
      result.totalUsersUpdated = userMigrationResult.usersUpdated;
      
      if (!userMigrationResult.success) {
        result.errors.push(...userMigrationResult.errors);
        console.error('❌ User migration failed');
      } else {
        console.log(`✅ User migration completed: ${userMigrationResult.usersUpdated} users updated`);
      }
    } catch (error) {
      const errorMsg = `User migration failed: ${error}`;
      console.error(`❌ ${errorMsg}`);
      result.errors.push(errorMsg);
    }

    // Migration 2: Convert content to multilingual format
    console.log('\n🔄 Step 2: Converting content to multilingual format...');
    try {
      const contentMigrationResult = await migrateContentToMultilingual();
      result.migrationsRun.push('002-migrate-content-to-multilingual');
      result.totalContentUpdated = 
        contentMigrationResult.productsUpdated + 
        contentMigrationResult.newsUpdated + 
        contentMigrationResult.galleryUpdated;
      
      if (!contentMigrationResult.success) {
        result.errors.push(...contentMigrationResult.errors);
        console.error('❌ Content migration failed');
      } else {
        console.log(`✅ Content migration completed:`);
        console.log(`   - Products: ${contentMigrationResult.productsUpdated}`);
        console.log(`   - News: ${contentMigrationResult.newsUpdated}`);
        console.log(`   - Gallery: ${contentMigrationResult.galleryUpdated}`);
      }
    } catch (error) {
      const errorMsg = `Content migration failed: ${error}`;
      console.error(`❌ ${errorMsg}`);
      result.errors.push(errorMsg);
    }

    // Migration 3: Drop old indexes and create new multilingual indexes
    console.log('\n🗂️  Step 3: Updating database indexes...');
    try {
      // First drop old indexes
      const dropResult = await dropOldIndexes();
      if (dropResult.errors.length > 0) {
        console.warn('⚠️  Some old indexes could not be dropped (this is usually fine):');
        dropResult.errors.forEach(error => console.warn(`   - ${error}`));
      } else {
        console.log(`✅ Dropped ${dropResult.dropped} old indexes`);
      }

      // Then create new indexes
      const indexMigrationResult = await addMultilingualIndexes();
      result.migrationsRun.push('003-add-multilingual-indexes');
      result.totalIndexesCreated = indexMigrationResult.indexesCreated;
      
      if (!indexMigrationResult.success) {
        result.errors.push(...indexMigrationResult.errors);
        console.error('❌ Index migration failed');
      } else {
        console.log(`✅ Index migration completed: ${indexMigrationResult.indexesCreated} indexes created`);
      }
    } catch (error) {
      const errorMsg = `Index migration failed: ${error}`;
      console.error(`❌ ${errorMsg}`);
      result.errors.push(errorMsg);
    }

    // Determine overall success
    result.success = result.errors.length === 0;

    // Final summary
    console.log('\n=====================================');
    console.log('📊 Migration Summary:');
    console.log(`   - Migrations run: ${result.migrationsRun.length}`);
    console.log(`   - Users updated: ${result.totalUsersUpdated}`);
    console.log(`   - Content items updated: ${result.totalContentUpdated}`);
    console.log(`   - Indexes created: ${result.totalIndexesCreated}`);
    console.log(`   - Errors: ${result.errors.length}`);

    if (result.success) {
      console.log('\n🎉 All migrations completed successfully!');
      console.log('Your database is now ready for multilingual support.');
    } else {
      console.log('\n⚠️  Migrations completed with some errors:');
      result.errors.forEach(error => console.error(`   - ${error}`));
      console.log('\nPlease review the errors above and run individual migrations if needed.');
    }

    return result;

  } catch (error) {
    const errorMsg = `Master migration failed: ${error}`;
    console.error(`❌ ${errorMsg}`);
    result.errors.push(errorMsg);
    return result;
  }
}

// Helper function to check migration status
export async function checkMigrationStatus(): Promise<void> {
  try {
    console.log('🔍 Checking migration status...');
    
    const db = mongoose.connection.db;
    
    // Check user schema
    const sampleUser = await db.collection('users').findOne({});
    const hasUserLanguage = sampleUser && 'language' in sampleUser;
    console.log(`   - User language preferences: ${hasUserLanguage ? '✅ Migrated' : '❌ Not migrated'}`);
    
    // Check product schema
    const sampleProduct = await db.collection('products').findOne({});
    const hasMultilingualProduct = sampleProduct && sampleProduct.name && typeof sampleProduct.name === 'object' && 'en' in sampleProduct.name;
    console.log(`   - Product multilingual schema: ${hasMultilingualProduct ? '✅ Migrated' : '❌ Not migrated'}`);
    
    // Check news schema
    const sampleNews = await db.collection('newsitems').findOne({});
    const hasMultilingualNews = sampleNews && sampleNews.headline && typeof sampleNews.headline === 'object' && 'en' in sampleNews.headline;
    console.log(`   - News multilingual schema: ${hasMultilingualNews ? '✅ Migrated' : '❌ Not migrated'}`);
    
    // Check gallery schema
    const sampleGallery = await db.collection('galleryitems').findOne({});
    const hasMultilingualGallery = sampleGallery && sampleGallery.title && typeof sampleGallery.title === 'object' && 'en' in sampleGallery.title;
    console.log(`   - Gallery multilingual schema: ${hasMultilingualGallery ? '✅ Migrated' : '❌ Not migrated'}`);
    
    // Check translation keys collection
    const translationKeysCount = await db.collection('translationkeys').countDocuments();
    console.log(`   - Translation keys collection: ${translationKeysCount > 0 ? `✅ ${translationKeysCount} keys` : '⚠️  Empty (normal for new setup)'}`);
    
    // Check indexes
    const productIndexes = await db.collection('products').indexes();
    const hasMultilingualIndexes = productIndexes.some(idx => idx.name && idx.name.includes('multilingual'));
    console.log(`   - Multilingual indexes: ${hasMultilingualIndexes ? '✅ Created' : '❌ Not created'}`);
    
  } catch (error) {
    console.error('❌ Error checking migration status:', error);
  }
}

// Script execution when run directly
if (require.main === module) {
  async function runMasterMigration() {
    try {
      // Connect to database
      await database.connect();
      console.log('🔌 Connected to database');

      // Check current status
      await checkMigrationStatus();

      // Ask for confirmation
      console.log('\n⚠️  This will modify your database schema and data.');
      console.log('Make sure you have a backup before proceeding.');
      
      // In a real scenario, you might want to add a confirmation prompt here
      // For now, we'll proceed automatically
      
      // Run all migrations
      const result = await runAllMigrations();

      // Final status check
      console.log('\n🔍 Final migration status:');
      await checkMigrationStatus();

      if (result.success) {
        console.log('\n🎉 All migrations completed successfully!');
        process.exit(0);
      } else {
        console.error('\n❌ Migrations completed with errors. Please review the output above.');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Master migration script failed:', error);
      process.exit(1);
    } finally {
      // Close database connection
      await mongoose.connection.close();
    }
  }

  runMasterMigration();
}