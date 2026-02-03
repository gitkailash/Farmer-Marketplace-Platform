/**
 * Database Optimization Service for Multilingual Content
 * Handles compound indexes, query optimization, and caching for multilingual data
 */

import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { NewsItem } from '../models/News';
import { User } from '../models/User';
import { TranslationKey } from '../models/TranslationKey';

interface QueryCacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

interface OptimizationStats {
  indexesCreated: number;
  cacheHits: number;
  cacheMisses: number;
  queryOptimizations: number;
}

class DatabaseOptimizationService {
  private queryCache = new Map<string, QueryCacheEntry>();
  private stats: OptimizationStats = {
    indexesCreated: 0,
    cacheHits: 0,
    cacheMisses: 0,
    queryOptimizations: 0
  };

  /**
   * Initialize all multilingual database optimizations
   */
  async initializeOptimizations(): Promise<void> {
    console.log('Initializing database optimizations for multilingual content...');
    
    try {
      await this.createCompoundIndexes();
      await this.optimizeExistingIndexes();
      console.log('Database optimizations completed successfully');
    } catch (error) {
      console.error('Failed to initialize database optimizations:', error);
      throw error;
    }
  }

  /**
   * Create compound indexes for multilingual queries
   */
  private async createCompoundIndexes(): Promise<void> {
    console.log('Creating compound indexes for multilingual content...');

    // Product compound indexes
    await this.createProductIndexes();
    
    // News compound indexes
    await this.createNewsIndexes();
    
    // User language preference indexes
    await this.createUserIndexes();
    
    // Translation key indexes
    await this.createTranslationIndexes();
    
    console.log(`Created ${this.stats.indexesCreated} compound indexes`);
  }

  /**
   * Create optimized indexes for Product model
   */
  private async createProductIndexes(): Promise<void> {
    const productCollection = Product.collection;

    // Language-specific product browsing
    await productCollection.createIndex(
      { 
        'status': 1, 
        'category.en': 1, 
        'name.en': 1 
      },
      { 
        name: 'product_en_browse',
        background: true 
      }
    );

    await productCollection.createIndex(
      { 
        'status': 1, 
        'category.ne': 1, 
        'name.ne': 1 
      },
      { 
        name: 'product_ne_browse',
        background: true,
        sparse: true // Only index documents with Nepali content
      }
    );

    // Multilingual search with farmer and status
    await productCollection.createIndex(
      {
        'farmerId': 1,
        'status': 1,
        'name.en': 'text',
        'description.en': 'text',
        'name.ne': 'text',
        'description.ne': 'text'
      },
      {
        name: 'product_multilingual_search',
        background: true,
        weights: {
          'name.en': 10,
          'name.ne': 10,
          'description.en': 5,
          'description.ne': 5
        }
      }
    );

    // Price range queries with language preference
    await productCollection.createIndex(
      {
        'status': 1,
        'category.en': 1,
        'price': 1,
        'createdAt': -1
      },
      {
        name: 'product_price_range_en',
        background: true
      }
    );

    // Stock availability with multilingual support
    await productCollection.createIndex(
      {
        'status': 1,
        'stock': 1,
        'name.en': 1,
        'name.ne': 1
      },
      {
        name: 'product_stock_availability',
        background: true
      }
    );

    this.stats.indexesCreated += 5;
  }

  /**
   * Create optimized indexes for News model
   */
  private async createNewsIndexes(): Promise<void> {
    const newsCollection = NewsItem.collection;

    // Language-specific news browsing
    await newsCollection.createIndex(
      {
        'language': 1,
        'isActive': 1,
        'priority': -1,
        'publishedAt': -1
      },
      {
        name: 'news_language_priority',
        background: true
      }
    );

    // Multilingual news search
    await newsCollection.createIndex(
      {
        'isActive': 1,
        'headline.en': 'text',
        'content.en': 'text',
        'headline.ne': 'text',
        'content.ne': 'text'
      },
      {
        name: 'news_multilingual_search',
        background: true,
        weights: {
          'headline.en': 10,
          'headline.ne': 10,
          'content.en': 5,
          'content.ne': 5
        }
      }
    );

    // Admin news management
    await newsCollection.createIndex(
      {
        'createdBy': 1,
        'language': 1,
        'createdAt': -1
      },
      {
        name: 'news_admin_management',
        background: true
      }
    );

    this.stats.indexesCreated += 3;
  }

  /**
   * Create optimized indexes for User model
   */
  private async createUserIndexes(): Promise<void> {
    const userCollection = User.collection;

    // User language preferences
    await userCollection.createIndex(
      {
        'language': 1,
        'role': 1,
        'isActive': 1
      },
      {
        name: 'user_language_role',
        background: true
      }
    );

    // User locale preferences
    await userCollection.createIndex(
      {
        'localePreferences.dateFormat': 1,
        'language': 1
      },
      {
        name: 'user_locale_preferences',
        background: true,
        sparse: true
      }
    );

    this.stats.indexesCreated += 2;
  }

  /**
   * Create optimized indexes for Translation model
   */
  private async createTranslationIndexes(): Promise<void> {
    const translationCollection = TranslationKey.collection;

    // Translation key lookup
    await translationCollection.createIndex(
      {
        'namespace': 1,
        'key': 1
      },
      {
        name: 'translation_key_lookup',
        background: true,
        unique: true
      }
    );

    // Translation completeness queries
    await translationCollection.createIndex(
      {
        'namespace': 1,
        'isRequired': 1,
        'translations.ne': 1
      },
      {
        name: 'translation_completeness',
        background: true,
        sparse: true
      }
    );

    // Translation management
    await translationCollection.createIndex(
      {
        'updatedBy': 1,
        'lastUpdated': -1
      },
      {
        name: 'translation_management',
        background: true
      }
    );

    this.stats.indexesCreated += 3;
  }

  /**
   * Optimize existing indexes by analyzing usage patterns
   */
  private async optimizeExistingIndexes(): Promise<void> {
    console.log('Optimizing existing indexes...');

    // Get index information
    const collections = [Product, NewsItem, User, TranslationKey];
    
    for (const model of collections) {
      try {
        // List all indexes for the collection
        const indexes = await model.collection.listIndexes().toArray();
        console.log(`Index info for ${model.modelName}:`, indexes.length, 'indexes');
        
        // Log index names and keys for monitoring
        indexes.forEach(index => {
          console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
        });
        
        // Get collection stats
        const collectionStats = await model.collection.stats();
        console.log(`Collection stats for ${model.modelName}:`, {
          documents: collectionStats.count,
          avgObjSize: collectionStats.avgObjSize,
          totalIndexSize: collectionStats.totalIndexSize
        });
        
      } catch (error) {
        console.warn(`Could not get index info for ${model.modelName}:`, error);
      }
    }
  }

  /**
   * Optimized query for multilingual product search
   */
  async searchProducts(
    query: string,
    language: 'en' | 'ne' = 'en',
    filters: {
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      farmerId?: string;
      limit?: number;
      skip?: number;
    } = {}
  ): Promise<any[]> {
    const cacheKey = `products:${JSON.stringify({ query, language, filters })}`;
    
    // Check cache first
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      this.stats.cacheHits++;
      return cached;
    }

    this.stats.cacheMisses++;

    // Build optimized aggregation pipeline
    const pipeline: any[] = [
      // Match active products first (uses index)
      {
        $match: {
          status: 'PUBLISHED',
          stock: { $gt: 0 }
        }
      }
    ];

    // Add category filter if specified
    if (filters.category) {
      pipeline.push({
        $match: {
          [`category.${language}`]: filters.category
        }
      });
    }

    // Add price range filter if specified
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      const priceMatch: any = {};
      if (filters.minPrice !== undefined) priceMatch.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) priceMatch.$lte = filters.maxPrice;
      
      pipeline.push({
        $match: {
          price: priceMatch
        }
      });
    }

    // Add farmer filter if specified
    if (filters.farmerId) {
      pipeline.push({
        $match: {
          farmerId: new mongoose.Types.ObjectId(filters.farmerId)
        }
      });
    }

    // Add text search if query provided
    if (query) {
      pipeline.unshift({
        $match: {
          $text: {
            $search: query,
            $language: language === 'ne' ? 'none' : 'english' // MongoDB doesn't support Nepali language
          }
        }
      });

      // Add text score for sorting
      pipeline.push({
        $addFields: {
          score: { $meta: 'textScore' }
        }
      });
    }

    // Add localized fields
    pipeline.push({
      $addFields: {
        localizedName: {
          $cond: {
            if: { $and: [{ $eq: [language, 'ne'] }, { $ne: [`$name.ne`, null] }] },
            then: '$name.ne',
            else: '$name.en'
          }
        },
        localizedDescription: {
          $cond: {
            if: { $and: [{ $eq: [language, 'ne'] }, { $ne: [`$description.ne`, null] }] },
            then: '$description.ne',
            else: '$description.en'
          }
        },
        localizedCategory: {
          $cond: {
            if: { $and: [{ $eq: [language, 'ne'] }, { $ne: [`$category.ne`, null] }] },
            then: '$category.ne',
            else: '$category.en'
          }
        }
      }
    });

    // Sort by relevance or date
    if (query) {
      pipeline.push({
        $sort: {
          score: { $meta: 'textScore' },
          createdAt: -1
        }
      });
    } else {
      pipeline.push({
        $sort: {
          createdAt: -1
        }
      });
    }

    // Add pagination
    if (filters.skip) {
      pipeline.push({ $skip: filters.skip });
    }
    
    pipeline.push({ $limit: filters.limit || 20 });

    // Execute optimized query
    const results = await Product.aggregate(pipeline);
    
    // Cache results for 5 minutes
    this.setCachedResult(cacheKey, results, 5 * 60 * 1000);
    
    this.stats.queryOptimizations++;
    return results;
  }

  /**
   * Optimized query for multilingual news search
   */
  async searchNews(
    query: string,
    language: 'en' | 'ne' = 'en',
    filters: {
      priority?: string;
      limit?: number;
      skip?: number;
    } = {}
  ): Promise<any[]> {
    const cacheKey = `news:${JSON.stringify({ query, language, filters })}`;
    
    // Check cache first
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      this.stats.cacheHits++;
      return cached;
    }

    this.stats.cacheMisses++;

    // Build optimized aggregation pipeline
    const pipeline: any[] = [
      // Match active news first (uses index)
      {
        $match: {
          isActive: true,
          publishedAt: { $lte: new Date() }
        }
      }
    ];

    // Add priority filter if specified
    if (filters.priority) {
      pipeline.push({
        $match: {
          priority: filters.priority
        }
      });
    }

    // Add text search if query provided
    if (query) {
      pipeline.unshift({
        $match: {
          $text: {
            $search: query,
            $language: language === 'ne' ? 'none' : 'english'
          }
        }
      });

      // Add text score for sorting
      pipeline.push({
        $addFields: {
          score: { $meta: 'textScore' }
        }
      });
    }

    // Add localized fields
    pipeline.push({
      $addFields: {
        localizedHeadline: {
          $cond: {
            if: { $and: [{ $eq: [language, 'ne'] }, { $ne: [`$headline.ne`, null] }] },
            then: '$headline.ne',
            else: '$headline.en'
          }
        },
        localizedContent: {
          $cond: {
            if: { $and: [{ $eq: [language, 'ne'] }, { $ne: [`$content.ne`, null] }] },
            then: '$content.ne',
            else: '$content.en'
          }
        },
        localizedSummary: {
          $cond: {
            if: { $and: [{ $eq: [language, 'ne'] }, { $ne: [`$summary.ne`, null] }] },
            then: '$summary.ne',
            else: '$summary.en'
          }
        }
      }
    });

    // Sort by priority and relevance
    if (query) {
      pipeline.push({
        $sort: {
          priority: -1,
          score: { $meta: 'textScore' },
          publishedAt: -1
        }
      });
    } else {
      pipeline.push({
        $sort: {
          priority: -1,
          publishedAt: -1
        }
      });
    }

    // Add pagination
    if (filters.skip) {
      pipeline.push({ $skip: filters.skip });
    }
    
    pipeline.push({ $limit: filters.limit || 10 });

    // Execute optimized query
    const results = await NewsItem.aggregate(pipeline);
    
    // Cache results for 10 minutes
    this.setCachedResult(cacheKey, results, 10 * 60 * 1000);
    
    this.stats.queryOptimizations++;
    return results;
  }

  /**
   * Get translation completeness statistics
   */
  async getTranslationCompleteness(namespace?: string): Promise<any> {
    const cacheKey = `translation-completeness:${namespace || 'all'}`;
    
    // Check cache first
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      this.stats.cacheHits++;
      return cached;
    }

    this.stats.cacheMisses++;

    // Build aggregation pipeline
    const pipeline: any[] = [];

    // Filter by namespace if specified
    if (namespace) {
      pipeline.push({
        $match: { namespace }
      });
    }

    // Calculate completeness statistics
    pipeline.push(
      {
        $group: {
          _id: '$namespace',
          totalKeys: { $sum: 1 },
          requiredKeys: {
            $sum: {
              $cond: ['$isRequired', 1, 0]
            }
          },
          translatedKeys: {
            $sum: {
              $cond: [{ $ne: ['$translations.ne', null] }, 1, 0]
            }
          },
          requiredTranslatedKeys: {
            $sum: {
              $cond: [
                {
                  $and: [
                    '$isRequired',
                    { $ne: ['$translations.ne', null] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $addFields: {
          completeness: {
            $multiply: [
              { $divide: ['$translatedKeys', '$totalKeys'] },
              100
            ]
          },
          requiredCompleteness: {
            $multiply: [
              { $divide: ['$requiredTranslatedKeys', '$requiredKeys'] },
              100
            ]
          }
        }
      }
    );

    // Execute query
    const results = await TranslationKey.aggregate(pipeline);
    
    // Cache results for 30 minutes
    this.setCachedResult(cacheKey, results, 30 * 60 * 1000);
    
    this.stats.queryOptimizations++;
    return results;
  }

  /**
   * Cache management methods
   */
  private getCachedResult(key: string): any | null {
    const entry = this.queryCache.get(key);
    if (!entry) return null;

    // Check if cache entry is expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.queryCache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCachedResult(key: string, data: any, ttl: number): void {
    this.queryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    // Clean up expired entries periodically
    if (this.queryCache.size > 1000) {
      this.cleanupCache();
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.queryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.queryCache.delete(key);
      }
    }
  }

  /**
   * Clear all cached results
   */
  clearCache(): void {
    this.queryCache.clear();
    console.log('Query cache cleared');
  }

  /**
   * Get optimization statistics
   */
  getStats(): OptimizationStats & { cacheSize: number } {
    return {
      ...this.stats,
      cacheSize: this.queryCache.size
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      indexesCreated: 0,
      cacheHits: 0,
      cacheMisses: 0,
      queryOptimizations: 0
    };
  }
}

// Create singleton instance
export const databaseOptimizationService = new DatabaseOptimizationService();

export default databaseOptimizationService;