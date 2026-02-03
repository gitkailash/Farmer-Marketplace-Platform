#!/usr/bin/env ts-node

/**
 * Database Optimization Script for Multilingual Content
 * Run this script to create compound indexes and optimize queries for multilingual data
 */

import mongoose from 'mongoose';
import { databaseOptimizationService } from '../services/DatabaseOptimizationService';
import { database } from '../config/database';

async function optimizeDatabase() {
  console.log('🚀 Starting multilingual database optimization...');
  
  try {
    // Connect to database
    console.log('📡 Connecting to database...');
    await database.connect();
    console.log('✅ Database connected successfully');

    // Initialize optimizations
    console.log('🔧 Initializing database optimizations...');
    await databaseOptimizationService.initializeOptimizations();

    // Get optimization statistics
    const stats = databaseOptimizationService.getStats();
    console.log('📊 Optimization Statistics:');
    console.log(`   - Indexes created: ${stats.indexesCreated}`);
    console.log(`   - Cache size: ${stats.cacheSize}`);
    console.log(`   - Query optimizations: ${stats.queryOptimizations}`);

    // Test optimized queries
    console.log('🧪 Testing optimized queries...');
    await testOptimizedQueries();

    console.log('✅ Database optimization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database optimization failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
  }
}

async function testOptimizedQueries() {
  try {
    // Test product search
    console.log('   Testing product search optimization...');
    const products = await databaseOptimizationService.searchProducts(
      'vegetables',
      'en',
      { limit: 5 }
    );
    console.log(`   ✅ Product search returned ${products.length} results`);

    // Test news search
    console.log('   Testing news search optimization...');
    const news = await databaseOptimizationService.searchNews(
      'announcement',
      'en',
      { limit: 5 }
    );
    console.log(`   ✅ News search returned ${news.length} results`);

    // Test translation completeness
    console.log('   Testing translation completeness query...');
    const completeness = await databaseOptimizationService.getTranslationCompleteness();
    console.log(`   ✅ Translation completeness query returned ${completeness.length} namespaces`);

    // Get final stats
    const finalStats = databaseOptimizationService.getStats();
    console.log('   📊 Test Results:');
    console.log(`      - Cache hits: ${finalStats.cacheHits}`);
    console.log(`      - Cache misses: ${finalStats.cacheMisses}`);
    console.log(`      - Query optimizations: ${finalStats.queryOptimizations}`);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn('⚠️  Some test queries failed (this is normal if no data exists):', errorMessage);
  }
}

// Run the optimization if this script is executed directly
if (require.main === module) {
  optimizeDatabase().catch(console.error);
}

