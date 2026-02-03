#!/bin/bash

# Database restore script for Farmer Marketplace Platform
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"
DB_NAME=${MONGO_DB_NAME:-farmer-marketplace}
CONTAINER_NAME=${2:-farmer-marketplace-db}
BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Usage: $0 <backup_file> [container_name]${NC}"
    echo -e "${YELLOW}Available backups:${NC}"
    ls -la $BACKUP_DIR/backup_${DB_NAME}_*.tar.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

echo -e "${GREEN}🔄 Starting database restore...${NC}"

# Check if backup file exists
if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Backup file '$BACKUP_DIR/$BACKUP_FILE' not found${NC}"
    exit 1
fi

# Check if MongoDB container is running
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo -e "${RED}❌ MongoDB container '$CONTAINER_NAME' is not running${NC}"
    exit 1
fi

# Extract backup
echo -e "${YELLOW}📦 Extracting backup...${NC}"
cd $BACKUP_DIR
tar -xzf $BACKUP_FILE
EXTRACTED_DIR=$(tar -tzf $BACKUP_FILE | head -1 | cut -f1 -d"/")
cd ..

# Copy backup to container
echo -e "${YELLOW}📋 Copying backup to container...${NC}"
docker cp $BACKUP_DIR/$EXTRACTED_DIR $CONTAINER_NAME:/backups/

# Confirm restore operation
echo -e "${YELLOW}⚠️ This will replace all data in database '$DB_NAME'. Are you sure? (y/N)${NC}"
read -r response
if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "${YELLOW}❌ Restore cancelled${NC}"
    rm -rf $BACKUP_DIR/$EXTRACTED_DIR
    exit 0
fi

# Drop existing database
echo -e "${YELLOW}🗑️ Dropping existing database...${NC}"
docker exec $CONTAINER_NAME mongosh --eval "db.getSiblingDB('$DB_NAME').dropDatabase()"

# Restore database
echo -e "${YELLOW}🔄 Restoring database...${NC}"
docker exec $CONTAINER_NAME mongorestore --db $DB_NAME /backups/$EXTRACTED_DIR/$DB_NAME

# Clean up
echo -e "${YELLOW}🧹 Cleaning up...${NC}"
docker exec $CONTAINER_NAME rm -rf /backups/$EXTRACTED_DIR
rm -rf $BACKUP_DIR/$EXTRACTED_DIR

echo -e "${GREEN}✅ Database restore completed successfully!${NC}"
echo -e "${GREEN}📊 Database '$DB_NAME' has been restored from '$BACKUP_FILE'${NC}"