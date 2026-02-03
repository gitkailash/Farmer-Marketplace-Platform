// MongoDB initialization script for Farmer Marketplace Platform

// Switch to the application database
db = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE || 'farmer-marketplace');

// Create application user with read/write permissions
db.createUser({
  user: process.env.MONGO_APP_USERNAME || 'app_user',
  pwd: process.env.MONGO_APP_PASSWORD || 'app_password',
  roles: [
    {
      role: 'readWrite',
      db: process.env.MONGO_INITDB_DATABASE || 'farmer-marketplace'
    }
  ]
});

// Create indexes for better performance
print('Creating database indexes...');

// User indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ createdAt: -1 });

// Farmer indexes
db.farmers.createIndex({ userId: 1 }, { unique: true });
db.farmers.createIndex({ 'location.district': 1 });
db.farmers.createIndex({ 'location.municipality': 1 });
db.farmers.createIndex({ rating: -1 });

// Product indexes for search and filtering
db.products.createIndex({ name: 'text', description: 'text' });
db.products.createIndex({ category: 1, status: 1 });
db.products.createIndex({ farmerId: 1, status: 1 });
db.products.createIndex({ status: 1, createdAt: -1 });
db.products.createIndex({ price: 1 });

// Order indexes for queries
db.orders.createIndex({ buyerId: 1, createdAt: -1 });
db.orders.createIndex({ farmerId: 1, status: 1 });
db.orders.createIndex({ status: 1, createdAt: -1 });
db.orders.createIndex({ createdAt: -1 });

// Review indexes for farmer ratings
db.reviews.createIndex({ revieweeId: 1, isApproved: 1 });
db.reviews.createIndex({ reviewerId: 1 });
db.reviews.createIndex({ orderId: 1, reviewerType: 1 }, { unique: true });
db.reviews.createIndex({ isApproved: 1, createdAt: -1 });

// Message indexes for conversations
db.messages.createIndex({ senderId: 1, receiverId: 1, createdAt: -1 });
db.messages.createIndex({ receiverId: 1, isRead: 1 });
db.messages.createIndex({ createdAt: -1 });

// Content management indexes
db.galleryitems.createIndex({ category: 1, order: 1 });
db.galleryitems.createIndex({ isActive: 1, order: 1 });

db.mayorMessages.createIndex({ isActive: 1, updatedAt: -1 });

db.newsitems.createIndex({ isActive: 1, priority: -1, publishedAt: -1 });
db.newsitems.createIndex({ language: 1, isActive: 1 });

print('Database initialization completed successfully!');
print('Indexes created for optimal performance.');