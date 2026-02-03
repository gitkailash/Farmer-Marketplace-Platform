#!/bin/bash

# Database backup script for Farmer Marketplace Platform
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME=${MONGO_DB_NAME:-farmer-marketplace}
CONTAINER_NAME=${1:-farmer-marketplace-db}

echo -e "${GREEN}🗄️ Starting database backup...${NC}"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Check if MongoDB container is running
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo -e "${RED}❌ MongoDB container '$CONTAINER_NAME' is not running${NC}"
    exit 1
fi

# Create backup
echo -e "${YELLOW}📦 Creating backup of database '$DB_NAME'...${NC}"
docker exec $CONTAINER_NAME mongodump --db $DB_NAME --out /backups/backup_$DATE

# Copy backup from container to host
docker cp $CONTAINER_NAME:/backups/backup_$DATE $BACKUP_DIR/

# Compress backup
echo -e "${YELLOW}🗜️ Compressing backup...${NC}"
cd $BACKUP_DIR
tar -czf backup_${DB_NAME}_$DATE.tar.gz backup_$DATE/
rm -rf backup_$DATE/
cd ..

# Clean up old backups (keep last 7 days)
echo -e "${YELLOW}🧹 Cleaning up old backups...${NC}"
find $BACKUP_DIR -name "backup_${DB_NAME}_*.tar.gz" -mtime +7 -delete

echo -e "${GREEN}✅ Backup completed successfully!${NC}"
echo -e "${GREEN}📁 Backup saved as: ${BACKUP_DIR}/backup_${DB_NAME}_$DATE.tar.gz${NC}"

# Show backup size
BACKUP_SIZE=$(du -h "${BACKUP_DIR}/backup_${DB_NAME}_$DATE.tar.gz" | cut -f1)
echo -e "${GREEN}📊 Backup size: $BACKUP_SIZE${NC}"