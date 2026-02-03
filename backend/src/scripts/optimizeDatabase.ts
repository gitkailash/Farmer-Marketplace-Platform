import mongoose from 'mongoose';
import { database } from '../config/database';
import { config } from '../config/environment';

// Database optimization script
class DatabaseOptimizer {
  
  async optimizeIndexes(): Promise<void> {
    console.log('🔍 Analyzing and optimizing database indexes...');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`\n📊 Analyzing collection: ${collectionName}`);
      
      // Get current indexes
      const indexes = await mongoose.connection.db.collection(collectionName).indexes();
      console.log(`Current indexes: ${indexes.length}`);
      
      // Get collection stats
      const stats = await mongoose.connection.db.collection(collectionName).stats();
      console.log(`Documents: ${stats.count}, Size: ${Math.round(stats.size / 1024 / 1024)}MB`);
      
      // Analyze index usage (requires MongoDB 3.2+)
      try {
        const indexStats = await mongoose.connection.db.collection(collectionName)
          .aggregate([{ $indexStats: {} }]).toArray();
        
        console.log('Index usage statistics:');
        indexStats.forEach(stat => {
          console.log(`  ${stat.name}: ${stat.accesses.ops} operations`);
        });
      } catch (error) {
        console.log('  Index statistics not available');
      }
    }
  }

  async createOptimalIndexes(): Promise<void> {
    console.log('\n🚀 Creating optimal indexes...');
    
    try {
      // User indexes
      await mongoose.connection.db.collection('users').createIndex(
        { email: 1 }, 
        { unique: true, background: true }
      );
      await mongoose.connection.db.collection('users').createIndex(
        { role: 1 }, 
        { background: true }
      );
      await mongoose.connection.db.collection('users').createIndex(
        { createdAt: -1 }, 
        { background: true }
      );

      // Farmer indexes
      await mongoose.connection.db.collection('farmers').createIndex(
        { userId: 1 }, 
        { unique: true, background: true }
      );
      await mongoose.connection.db.collection('farmers').createIndex(
        { 'location.district': 1, 'location.municipality': 1 }, 
        { background: true }
      );
      await mongoose.connection.db.collection('farmers').createIndex(
        { rating: -1 }, 
        { background: true }
      );

      // Product indexes for search and filtering
      await mongoose.connection.db.collection('products').createIndex(
        { name: 'text', description: 'text' }, 
        { background: true }
      );
      await mongoose.connection.db.collection('products').createIndex(
        { category: 1, status: 1, price: 1 }, 
        { background: true }
      );
      await mongoose.connection.db.collection('products').createIndex(
        { farmerId: 1, status: 1 }, 
        { background: true }
      );
      await mongoose.connection.db.collection('products').createIndex(
        { status: 1, createdAt: -1 }, 
        { background: true }
      );

      // Order indexes for queries
      await mongoose.connection.db.collection('orders').createIndex(
        { buyerId: 1, createdAt: -1 }, 
        { background: true }
      );
      await mongoose.connection.db.collection('orders').createIndex(
        { farmerId: 1, status: 1 }, 
        { background: true }
      );
      await mongoose.connection.db.collection('orders').createIndex(
        { status: 1, createdAt: -1 }, 
        { background: true }
      );

      // Review indexes for farmer ratings
      await mongoose.connection.db.collection('reviews').createIndex(
        { revieweeId: 1, isApproved: 1 }, 
        { background: true }
      );
      await mongoose.connection.db.collection('reviews').createIndex(
        { orderId: 1, reviewerType: 1 }, 
        { unique: true, background: true }
      );

      // Message indexes for conversations
      await mongoose.connection.db.collection('messages').createIndex(
        { senderId: 1, receiverId: 1, createdAt: -1 }, 
        { background: true }
      );
      await mongoose.connection.db.collection('messages').createIndex(
        { receiverId: 1, isRead: 1 }, 
        { background: true }
      );

      // Content management indexes
      await mongoose.connection.db.collection('galleryitems').createIndex(
        { isActive: 1, order: 1 }, 
        { background: true }
      );
      await mongoose.connection.db.collection('newsitems').createIndex(
        { isActive: 1, priority: -1, publishedAt: -1 }, 
        { background: true }
      );

      console.log('✅ Optimal indexes created successfully');
    } catch (error) {
      console.error('❌ Error creating indexes:', error);
    }
  }

  async analyzeSlowQueries(): Promise<void> {
    console.log('\n🐌 Analyzing slow queries...');
    
    try {
      // Enable profiling for slow operations (>100ms)
      await mongoose.connection.db.admin().command({
        profile: 2,
        slowms: 100
      });

      console.log('Profiling enabled for operations slower than 100ms');
      console.log('Run your application and check db.system.profile for slow queries');
      
      // Get current profiling status
      const profilingStatus = await mongoose.connection.db.admin().command({
        profile: -1
      });
      
      console.log('Current profiling level:', profilingStatus.was);
    } catch (error) {
      console.error('Error setting up profiling:', error);
    }
  }

  async optimizeCollections(): Promise<void> {
    console.log('\n🔧 Optimizing collections...');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (const collection of collections) {
      const collectionName = collection.name;
      
      try {
        // Compact collection to reclaim space
        await mongoose.connection.db.admin().command({
          compact: collectionName
        });
        
        console.log(`✅ Compacted collection: ${collectionName}`);
      } catch (error) {
        console.log(`⚠️  Could not compact ${collectionName}:`, (error as Error).message);
      }
    }
  }

  async generatePerformanceReport(): Promise<void> {
    console.log('\n📈 Generating performance report...');
    
    const collections = ['users', 'farmers', 'products', 'orders', 'reviews', 'messages'];
    const report: any = {
      timestamp: new Date().toISOString(),
      database: mongoose.connection.name,
      collections: {}
    };
    
    for (const collectionName of collections) {
      try {
        const stats = await mongoose.connection.db.collection(collectionName).stats();
        const indexes = await mongoose.connection.db.collection(collectionName).indexes();
        
        report.collections[collectionName] = {
          documents: stats.count,
          avgDocSize: Math.round(stats.avgObjSize || 0),
          totalSize: Math.round(stats.size / 1024 / 1024), // MB
          indexCount: indexes.length,
          indexSize: Math.round((stats.totalIndexSize || 0) / 1024 / 1024) // MB
        };
      } catch (error) {
        report.collections[collectionName] = { error: (error as Error).message };
      }
    }
    
    console.log('\n📊 Performance Report:');
    console.log(JSON.stringify(report, null, 2));
    
    // Save report to file
    const fs = require('fs');
    const path = require('path');
    const reportsDir = path.join(process.cwd(), 'reports');
    
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const reportFile = path.join(reportsDir, `performance-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    console.log(`📄 Report saved to: ${reportFile}`);
  }
}

// Main optimization function
async function optimizeDatabase(): Promise<void> {
  try {
    console.log('🚀 Starting database optimization...');
    
    await database.connect();
    
    const optimizer = new DatabaseOptimizer();
    
    // Run optimization steps
    await optimizer.analyzeSlowQueries();
    await optimizer.optimizeIndexes();
    await optimizer.createOptimalIndexes();
    await optimizer.optimizeCollections();
    await optimizer.generatePerformanceReport();
    
    console.log('\n✅ Database optimization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database optimization failed:', error);
    process.exit(1);
  } finally {
    await database.disconnect();
    process.exit(0);
  }
}

// Run optimization if this file is executed directly
if (require.main === module) {
  optimizeDatabase();
}

export { DatabaseOptimizer, optimizeDatabase };