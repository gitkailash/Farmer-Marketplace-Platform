#!/bin/bash

################################################################################
# Script 3: Setup MongoDB Database
# Purpose: Configure MongoDB, create database, indexes, and admin user
# Run as: bash 03-setup-database.sh
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Farmer Marketplace - Database Setup                     ║${NC}"
echo -e "${BLUE}║   Step 3: Configuring MongoDB                             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
APP_DIR="/opt/farmer-marketplace"
DB_NAME="farmer-marketplace"

# Load environment variables
if [ -f "$APP_DIR/backend/.env" ]; then
    export $(cat $APP_DIR/backend/.env | grep -v '^#' | xargs)
fi

# Check MongoDB status
echo -e "${YELLOW}🔍 Checking MongoDB status...${NC}"
if ! systemctl is-active --quiet mongod; then
    echo -e "${RED}❌ MongoDB is not running${NC}"
    echo -e "${YELLOW}   Starting MongoDB...${NC}"
    sudo systemctl start mongod
    sleep 3
fi

if systemctl is-active --quiet mongod; then
    echo -e "${GREEN}✅ MongoDB is running${NC}"
else
    echo -e "${RED}❌ Failed to start MongoDB${NC}"
    exit 1
fi

# Test MongoDB connection
echo -e "${YELLOW}🔌 Testing MongoDB connection...${NC}"
if mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ MongoDB connection successful${NC}"
else
    echo -e "${RED}❌ Cannot connect to MongoDB${NC}"
    exit 1
fi

# Create database and indexes
echo -e "${YELLOW}🗄️  Creating database and indexes...${NC}"

mongosh <<EOF
use $DB_NAME;

print('📊 Creating indexes for optimal performance...');

// User indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ createdAt: -1 });
print('✅ User indexes created');

// Farmer indexes
db.farmers.createIndex({ userId: 1 }, { unique: true });
db.farmers.createIndex({ 'location.district': 1 });
db.farmers.createIndex({ 'location.municipality': 1 });
db.farmers.createIndex({ rating: -1 });
print('✅ Farmer indexes created');

// Product indexes for search and filtering
db.products.createIndex({ 'name.en': 'text', 'name.ne': 'text', 'description.en': 'text', 'description.ne': 'text' });
db.products.createIndex({ 'category.en': 1, status: 1 });
db.products.createIndex({ farmerId: 1, status: 1 });
db.products.createIndex({ status: 1, createdAt: -1 });
db.products.createIndex({ price: 1 });
print('✅ Product indexes created');

// Order indexes for queries
db.orders.createIndex({ buyerId: 1, createdAt: -1 });
db.orders.createIndex({ farmerId: 1, status: 1 });
db.orders.createIndex({ status: 1, createdAt: -1 });
db.orders.createIndex({ createdAt: -1 });
print('✅ Order indexes created');

// Review indexes for farmer ratings
db.reviews.createIndex({ revieweeId: 1, isApproved: 1 });
db.reviews.createIndex({ reviewerId: 1 });
db.reviews.createIndex({ orderId: 1, reviewerType: 1 }, { unique: true });
db.reviews.createIndex({ isApproved: 1, createdAt: -1 });
print('✅ Review indexes created');

// Message indexes for conversations
db.messages.createIndex({ senderId: 1, receiverId: 1, createdAt: -1 });
db.messages.createIndex({ receiverId: 1, isRead: 1 });
db.messages.createIndex({ createdAt: -1 });
print('✅ Message indexes created');

// Content management indexes
db.galleryitems.createIndex({ category: 1, order: 1 });
db.galleryitems.createIndex({ isActive: 1, order: 1 });
print('✅ Gallery indexes created');

db.mayormessages.createIndex({ isActive: 1, updatedAt: -1 });
print('✅ Mayor message indexes created');

db.newsitems.createIndex({ isActive: 1, priority: -1, publishedAt: -1 });
db.newsitems.createIndex({ 'headline.en': 1, isActive: 1 });
db.newsitems.createIndex({ 'headline.ne': 1, isActive: 1 });
print('✅ News indexes created');

// Translation indexes
db.translationkeys.createIndex({ key: 1, namespace: 1 }, { unique: true });
db.translationkeys.createIndex({ namespace: 1 });
print('✅ Translation indexes created');

print('');
print('✅ All indexes created successfully!');
print('📊 Database: $DB_NAME');
EOF

echo -e "${GREEN}✅ Database and indexes created${NC}"

# Show database statistics
echo ""
echo -e "${YELLOW}📊 Database Statistics:${NC}"
mongosh $DB_NAME --quiet --eval "
    var stats = db.stats();
    print('   Database: ' + stats.db);
    print('   Collections: ' + stats.collections);
    print('   Indexes: ' + stats.indexes);
    print('   Data Size: ' + (stats.dataSize / 1024 / 1024).toFixed(2) + ' MB');
    print('   Storage Size: ' + (stats.storageSize / 1024 / 1024).toFixed(2) + ' MB');
"

# Create admin user
echo ""
echo -e "${YELLOW}👤 Creating admin user...${NC}"
echo -e "${YELLOW}   You will be prompted to enter admin details${NC}"
echo ""

cd $APP_DIR/backend
node scripts/create-admin.ts || {
    echo -e "${YELLOW}⚠️  Admin creation script not found or failed${NC}"
    echo -e "${YELLOW}   You can create admin user later using:${NC}"
    echo -e "${YELLOW}   cd $APP_DIR/backend && node scripts/create-admin.ts${NC}"
}

cd $APP_DIR

# Configure MongoDB for production
echo ""
echo -e "${YELLOW}🔐 Configuring MongoDB for production...${NC}"

# Backup original config
sudo cp /etc/mongod.conf /etc/mongod.conf.backup

# Update MongoDB configuration
sudo tee /etc/mongod.conf > /dev/null <<EOF
# MongoDB Configuration File

# Where and how to store data
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true

# Where to write logging data
systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

# Network interfaces
net:
  port: 27017
  bindIp: 127.0.0.1

# Process management
processManagement:
  timeZoneInfo: /usr/share/zoneinfo

# Security (uncomment after setting up authentication)
# security:
#   authorization: enabled
EOF

echo -e "${GREEN}✅ MongoDB configuration updated${NC}"

# Restart MongoDB
echo -e "${YELLOW}🔄 Restarting MongoDB...${NC}"
sudo systemctl restart mongod
sleep 3

if systemctl is-active --quiet mongod; then
    echo -e "${GREEN}✅ MongoDB restarted successfully${NC}"
else
    echo -e "${RED}❌ MongoDB failed to restart${NC}"
    echo -e "${YELLOW}   Restoring backup configuration...${NC}"
    sudo cp /etc/mongod.conf.backup /etc/mongod.conf
    sudo systemctl restart mongod
    exit 1
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ✅ Database Setup Completed Successfully!                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📋 Database Summary:${NC}"
echo "   ✅ MongoDB: Running"
echo "   ✅ Database: $DB_NAME"
echo "   ✅ Indexes: Created"
echo "   ✅ Admin User: Created (if successful)"
echo "   ✅ Configuration: Updated"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "   1. Verify admin user was created"
echo "   2. Run script 4: bash 04-configure-nginx.sh"
echo ""
