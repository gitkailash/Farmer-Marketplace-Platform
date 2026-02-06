#!/bin/bash

################################################################################
# Script 7: Backup and Restore Database
# Purpose: Backup MongoDB database or restore from backup
# Run as: bash 07-backup-restore.sh [backup|restore]
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/opt/farmer-marketplace"
BACKUP_DIR="$APP_DIR/backups"
DB_NAME="farmer-marketplace"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Function to show usage
show_usage() {
    echo "Usage: bash 07-backup-restore.sh [backup|restore|list]"
    echo ""
    echo "Commands:"
    echo "  backup   - Create a new database backup"
    echo "  restore  - Restore database from a backup"
    echo "  list     - List all available backups"
    echo ""
    echo "Examples:"
    echo "  bash 07-backup-restore.sh backup"
    echo "  bash 07-backup-restore.sh restore"
    echo "  bash 07-backup-restore.sh list"
}

# Function to create backup
create_backup() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   Farmer Marketplace - Database Backup                    ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Create backup directory if it doesn't exist
    mkdir -p $BACKUP_DIR

    BACKUP_NAME="backup_${TIMESTAMP}"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

    echo -e "${YELLOW}💾 Creating database backup...${NC}"
    echo "   Database: $DB_NAME"
    echo "   Backup: $BACKUP_NAME"
    echo ""

    # Check MongoDB status
    if ! systemctl is-active --quiet mongod; then
        echo -e "${RED}❌ MongoDB is not running${NC}"
        exit 1
    fi

    # Create backup using mongodump
    mongodump \
        --db=$DB_NAME \
        --out=$BACKUP_PATH \
        --quiet

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database backup created${NC}"
        
        # Compress backup
        echo -e "${YELLOW}🗜️  Compressing backup...${NC}"
        cd $BACKUP_DIR
        tar -czf "${BACKUP_NAME}.tar.gz" $BACKUP_NAME
        rm -rf $BACKUP_NAME
        
        BACKUP_SIZE=$(du -sh "${BACKUP_NAME}.tar.gz" | cut -f1)
        echo -e "${GREEN}✅ Backup compressed${NC}"
        echo "   Size: $BACKUP_SIZE"
        echo "   Location: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
        
        # Keep only last 7 backups
        echo -e "${YELLOW}🧹 Cleaning old backups (keeping last 7)...${NC}"
        ls -t $BACKUP_DIR/backup_*.tar.gz | tail -n +8 | xargs -r rm
        
        BACKUP_COUNT=$(ls -1 $BACKUP_DIR/backup_*.tar.gz 2>/dev/null | wc -l)
        echo -e "${GREEN}✅ Cleanup completed${NC}"
        echo "   Total backups: $BACKUP_COUNT"
    else
        echo -e "${RED}❌ Backup failed${NC}"
        exit 1
    fi

    echo ""
    echo -e "${GREEN}✅ Backup completed successfully!${NC}"
    echo ""
}

# Function to list backups
list_backups() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   Available Database Backups                              ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR/backup_*.tar.gz 2>/dev/null)" ]; then
        echo -e "${YELLOW}No backups found${NC}"
        echo ""
        return
    fi

    echo -e "${YELLOW}Available backups:${NC}"
    echo ""
    
    i=1
    for backup in $(ls -t $BACKUP_DIR/backup_*.tar.gz); do
        BACKUP_NAME=$(basename $backup .tar.gz)
        BACKUP_DATE=$(echo $BACKUP_NAME | sed 's/backup_//' | sed 's/_/ /')
        BACKUP_SIZE=$(du -sh $backup | cut -f1)
        BACKUP_TIME=$(stat -c %y $backup | cut -d'.' -f1)
        
        echo -e "${GREEN}[$i]${NC} $BACKUP_NAME"
        echo "    Date: $BACKUP_DATE"
        echo "    Size: $BACKUP_SIZE"
        echo "    Created: $BACKUP_TIME"
        echo ""
        
        i=$((i+1))
    done
}

# Function to restore backup
restore_backup() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   Farmer Marketplace - Database Restore                   ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Check if backups exist
    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR/backup_*.tar.gz 2>/dev/null)" ]; then
        echo -e "${RED}❌ No backups found${NC}"
        exit 1
    fi

    # List available backups
    list_backups

    # Select backup to restore
    echo -e "${YELLOW}Select backup to restore:${NC}"
    
    backups=($(ls -t $BACKUP_DIR/backup_*.tar.gz))
    backup_count=${#backups[@]}
    
    read -p "Enter backup number (1-$backup_count) or 'q' to quit: " selection
    
    if [ "$selection" == "q" ]; then
        echo -e "${YELLOW}Restore cancelled${NC}"
        exit 0
    fi
    
    if ! [[ "$selection" =~ ^[0-9]+$ ]] || [ "$selection" -lt 1 ] || [ "$selection" -gt "$backup_count" ]; then
        echo -e "${RED}❌ Invalid selection${NC}"
        exit 1
    fi
    
    SELECTED_BACKUP=${backups[$((selection-1))]}
    BACKUP_NAME=$(basename $SELECTED_BACKUP .tar.gz)
    
    echo ""
    echo -e "${YELLOW}⚠️  WARNING: This will replace the current database!${NC}"
    echo -e "${YELLOW}   Selected backup: $BACKUP_NAME${NC}"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " confirmation
    
    if [ "$confirmation" != "yes" ]; then
        echo -e "${YELLOW}Restore cancelled${NC}"
        exit 0
    fi

    # Create a backup of current database before restore
    echo ""
    echo -e "${YELLOW}💾 Creating safety backup of current database...${NC}"
    SAFETY_BACKUP="$BACKUP_DIR/pre_restore_${TIMESTAMP}"
    mongodump --db=$DB_NAME --out=$SAFETY_BACKUP --quiet
    echo -e "${GREEN}✅ Safety backup created: pre_restore_${TIMESTAMP}${NC}"

    # Extract backup
    echo -e "${YELLOW}📦 Extracting backup...${NC}"
    TEMP_DIR="$BACKUP_DIR/temp_restore_$$"
    mkdir -p $TEMP_DIR
    tar -xzf $SELECTED_BACKUP -C $TEMP_DIR
    echo -e "${GREEN}✅ Backup extracted${NC}"

    # Check MongoDB status
    if ! systemctl is-active --quiet mongod; then
        echo -e "${RED}❌ MongoDB is not running${NC}"
        rm -rf $TEMP_DIR
        exit 1
    fi

    # Stop backend before restore
    echo -e "${YELLOW}🛑 Stopping backend application...${NC}"
    pm2 stop farmer-marketplace-backend 2>/dev/null || echo "   Backend not running"

    # Restore database
    echo -e "${YELLOW}🔄 Restoring database...${NC}"
    mongorestore \
        --db=$DB_NAME \
        --drop \
        $TEMP_DIR/$BACKUP_NAME/$DB_NAME \
        --quiet

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database restored successfully${NC}"
    else
        echo -e "${RED}❌ Restore failed${NC}"
        echo -e "${YELLOW}   Attempting to restore safety backup...${NC}"
        mongorestore --db=$DB_NAME --drop $SAFETY_BACKUP/$DB_NAME --quiet
        rm -rf $TEMP_DIR
        exit 1
    fi

    # Clean up
    rm -rf $TEMP_DIR

    # Start backend
    echo -e "${YELLOW}🚀 Starting backend application...${NC}"
    pm2 start farmer-marketplace-backend
    sleep 3

    if pm2 list | grep -q "farmer-marketplace-backend.*online"; then
        echo -e "${GREEN}✅ Backend started successfully${NC}"
    else
        echo -e "${RED}❌ Backend failed to start${NC}"
    fi

    echo ""
    echo -e "${GREEN}✅ Restore completed successfully!${NC}"
    echo ""
    echo -e "${YELLOW}📝 Note: Safety backup saved as: pre_restore_${TIMESTAMP}${NC}"
    echo ""
}

# Main script
case "$1" in
    backup)
        create_backup
        ;;
    restore)
        restore_backup
        ;;
    list)
        list_backups
        ;;
    *)
        show_usage
        exit 1
        ;;
esac
