import mongoose from 'mongoose';
import { database } from '../../config/database';

/**
 * Migration script to add database indexes for multilingual content queries
 * This script creates optimized indexes for efficient multilingual content retrieval
 */

interface IndexResult {
  success: boolean;
  indexesCreated: number;
  errors: string[];
}

interface IndexSpec {
  key: Record<string, 1 | -1 | 'text'>;
  name: string;
  options?: Record<string, any>;
}

export async function addMultilingualIndexes(): Promise<IndexResult> {
  const result: IndexResult = {
    success: false,
    indexesCreated: 0,
    errors: []
  };

  try {
    console.log('Starting multilingual indexes creation...');

    const db = mongoose.connection.db;

    // Define indexes to create
    const indexOperations: Array<{
      collection: string;
      indexes: IndexSpec[];
    }> = [
      // User collection indexes
      {
        collection: 'users',
        indexes: [
          { key: { language: 1 }, name: 'language_1' },
          { key: { lastLanguageUpdate: -1 }, name: 'lastLanguageUpdate_-1' }
        ]
      },
      
      // Product collection indexes
      {
        collection: 'products',
        indexes: [
          { key: { 'name.en': 1, status: 1 }, name: 'name_en_1_status_1' },
          { key: { 'name.ne': 1, status: 1 }, name: 'name_ne_1_status_1' },
          { key: { 'category.en': 1, status: 1, price: 1 }, name: 'category_en_1_status_1_price_1' },
          { 
            key: { 
              'name.en': 'text', 
              'description.en': 'text', 
              'name.ne': 'text', 
              'description.ne': 'text' 
            }, 
            name: 'multilingual_text_search',
            options: { 
              weights: { 
                'name.en': 10, 
                'name.ne': 10, 
                'description.en': 5, 
                'description.ne': 5 
              } 
            }
          }
        ]
      },
      
      // News collection indexes
      {
        collection: 'newsitems',
        indexes: [
          { key: { language: 1, isActive: 1, publishedAt: -1 }, name: 'language_1_isActive_1_publishedAt_-1' },
          { 
            key: { 
              'headline.en': 'text', 
              'content.en': 'text', 
              'headline.ne': 'text', 
              'content.ne': 'text' 
            }, 
            name: 'news_multilingual_text_search',
            options: { 
              weights: { 
                'headline.en': 10, 
                'headline.ne': 10, 
                'content.en': 5, 
                'content.ne': 5 
              } 
            }
          }
        ]
      },
      
      // Gallery collection indexes
      {
        collection: 'galleryitems',
        indexes: [
          { key: { 'category.en': 1, isActive: 1 }, name: 'category_en_1_isActive_1' },
          { 
            key: { 
              'title.en': 'text', 
              'description.en': 'text', 
              'title.ne': 'text', 
              'description.ne': 'text' 
            }, 
            name: 'gallery_multilingual_text_search',
            options: { 
              weights: { 
                'title.en': 10, 
                'title.ne': 10, 
                'description.en': 5, 
                'description.ne': 5 
              } 
            }
          }
        ]
      },
      
      // Translation keys collection indexes
      {
        collection: 'translationkeys',
        indexes: [
          { key: { key: 1 }, name: 'key_1_unique', options: { unique: true } },
          { key: { namespace: 1, key: 1 }, name: 'namespace_1_key_1' },
          { key: { namespace: 1, isRequired: 1 }, name: 'namespace_1_isRequired_1' },
          { key: { lastUpdated: -1 }, name: 'lastUpdated_-1' },
          { key: { updatedBy: 1, lastUpdated: -1 }, name: 'updatedBy_1_lastUpdated_-1' },
          { key: { isRequired: 1, 'translations.ne': 1 }, name: 'isRequired_1_translations_ne_1' },
          { 
            key: { 
              'translations.en': 'text', 
              'translations.ne': 'text' 
            }, 
            name: 'translations_text_search'
          }
        ]
      }
    ];

    // Create indexes for each collection
    for (const operation of indexOperations) {
      try {
        console.log(`Creating indexes for ${operation.collection}...`);
        
        const collection = db.collection(operation.collection);
        
        for (const indexSpec of operation.indexes) {
          try {
            // Check if index already exists
            const existingIndexes = await collection.indexes();
            const indexExists = existingIndexes.some(idx => idx.name === indexSpec.name);
            
            if (indexExists) {
              console.log(`  - Index ${indexSpec.name} already exists, skipping`);
              continue;
            }
            
            // Create the index with proper typing
            await collection.createIndex(indexSpec.key as any, {
              name: indexSpec.name,
              background: true, // Create in background to avoid blocking
              ...indexSpec.options
            });
            
            result.indexesCreated++;
            console.log(`  - Created index: ${indexSpec.name}`);
            
          } catch (indexError) {
            const errorMsg = `Error creating index ${indexSpec.name} on ${operation.collection}: ${indexError instanceof Error ? indexError.message : String(indexError)}`;
            console.error(`  - ${errorMsg}`);
            result.errors.push(errorMsg);
          }
        }
        
      } catch (collectionError) {
        const errorMsg = `Error processing collection ${operation.collection}: ${collectionError instanceof Error ? collectionError.message : String(collectionError)}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
      }
    }

    result.success = result.errors.length === 0;

    console.log(`Index creation completed:`);
    console.log(`- Indexes created: ${result.indexesCreated}`);
    
    if (result.errors.length > 0) {
      console.error(`Index creation completed with ${result.errors.length} errors:`);
      result.errors.forEach(error => console.error(`- ${error}`));
    }

    return result;

  } catch (error) {
    const errorMsg = `Index creation failed: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMsg);
    result.errors.push(errorMsg);
    return result;
  }
}

// Helper function to drop old indexes that are no longer needed
export async function dropOldIndexes(): Promise<{ dropped: number; errors: string[] }> {
  const result: { dropped: number; errors: string[] } = { dropped: 0, errors: [] };
  
  try {
    console.log('Dropping old indexes...');
    
    const db = mongoose.connection.db;
    
    // Define old indexes to drop
    const indexesToDrop: Array<{
      collection: string;
      indexes: string[];
    }> = [
      { collection: 'products', indexes: ['name_text_description_text'] },
      { collection: 'newsitems', indexes: ['headline_text_content_text'] },
      { collection: 'galleryitems', indexes: ['title_text'] }
    ];
    
    for (const operation of indexesToDrop) {
      try {
        const collection = db.collection(operation.collection);
        const existingIndexes = await collection.indexes();
        
        for (const indexName of operation.indexes) {
          const indexExists = existingIndexes.some(idx => idx.name === indexName);
          
          if (indexExists) {
            try {
              await collection.dropIndex(indexName);
              result.dropped++;
              console.log(`  - Dropped old index: ${indexName} from ${operation.collection}`);
            } catch (dropError) {
              const errorMsg = `Error dropping index ${indexName} from ${operation.collection}: ${dropError instanceof Error ? dropError.message : String(dropError)}`;
              console.error(`  - ${errorMsg}`);
              result.errors.push(errorMsg);
            }
          }
        }
        
      } catch (collectionError) {
        const errorMsg = `Error processing collection ${operation.collection} for index dropping: ${collectionError instanceof Error ? collectionError.message : String(collectionError)}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
      }
    }
    
  } catch (error) {
    const errorMsg = `Error dropping old indexes: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMsg);
    result.errors.push(errorMsg);
  }
  
  return result;
}

// Script execution when run directly
if (require.main === module) {
  async function runIndexMigration() {
    try {
      // Connect to database
      await database.connect();
      console.log('Connected to database');

      // Drop old indexes first
      const dropResult = await dropOldIndexes();
      console.log(`Dropped ${dropResult.dropped} old indexes`);
      
      if (dropResult.errors.length > 0) {
        console.warn('Some old indexes could not be dropped (this is usually fine):');
        dropResult.errors.forEach(error => console.warn(`- ${error}`));
      }

      // Create new indexes
      const result = await addMultilingualIndexes();

      if (result.success) {
        console.log(`✅ Index migration successful! Created ${result.indexesCreated} indexes.`);
        process.exit(0);
      } else {
        console.error(`❌ Index migration failed with ${result.errors.length} errors.`);
        result.errors.forEach(error => console.error(`- ${error}`));
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Index migration script failed:', error);
      process.exit(1);
    } finally {
      // Close database connection
      await mongoose.connection.close();
    }
  }

  runIndexMigration();
}