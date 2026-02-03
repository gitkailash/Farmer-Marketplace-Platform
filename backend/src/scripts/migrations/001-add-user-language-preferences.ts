import mongoose from 'mongoose';
import { User } from '../../models/User';
import { database } from '../../config/database';

/**
 * Migration script to add language preferences to existing users
 * This script adds default language preferences to all existing users
 * who don't have these fields set.
 */

interface MigrationResult {
  success: boolean;
  usersUpdated: number;
  errors: string[];
}

export async function migrateUserLanguagePreferences(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    usersUpdated: 0,
    errors: []
  };

  try {
    console.log('Starting user language preferences migration...');

    // Find all users who don't have language preferences set
    const usersToUpdate = await User.find({
      $or: [
        { language: { $exists: false } },
        { localePreferences: { $exists: false } },
        { lastLanguageUpdate: { $exists: false } }
      ]
    });

    console.log(`Found ${usersToUpdate.length} users to update`);

    if (usersToUpdate.length === 0) {
      console.log('No users need migration');
      result.success = true;
      return result;
    }

    // Update users in batches to avoid memory issues
    const batchSize = 100;
    let updatedCount = 0;

    for (let i = 0; i < usersToUpdate.length; i += batchSize) {
      const batch = usersToUpdate.slice(i, i + batchSize);
      
      try {
        // Use bulkWrite for efficient batch updates
        const bulkOps = batch.map(user => ({
          updateOne: {
            filter: { _id: user._id },
            update: {
              $set: {
                language: user.language || 'en', // Default to English
                localePreferences: user.localePreferences || {
                  dateFormat: 'DD/MM/YYYY',
                  timeFormat: '24h',
                  numberFormat: '1,234.56',
                  currency: 'NPR'
                },
                lastLanguageUpdate: user.lastLanguageUpdate || new Date()
              }
            }
          }
        }));

        const batchResult = await User.bulkWrite(bulkOps);
        updatedCount += batchResult.modifiedCount;
        
        console.log(`Updated batch ${Math.floor(i / batchSize) + 1}: ${batchResult.modifiedCount} users`);
      } catch (batchError) {
        const errorMsg = `Error updating batch ${Math.floor(i / batchSize) + 1}: ${batchError}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
      }
    }

    result.usersUpdated = updatedCount;
    result.success = result.errors.length === 0;

    console.log(`Migration completed. Updated ${updatedCount} users.`);
    
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

// Script execution when run directly
if (require.main === module) {
  async function runMigration() {
    try {
      // Connect to database
      await database.connect();
      console.log('Connected to database');

      // Run migration
      const result = await migrateUserLanguagePreferences();

      if (result.success) {
        console.log(`✅ Migration successful! Updated ${result.usersUpdated} users.`);
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