#!/bin/bash

################################################################################
# Script 6: Update/Redeploy Application
# Purpose: Pull latest code, rebuild, and restart application
# Run as: bash 06-update-application.sh
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Farmer Marketplace - Update Application                 ║${NC}"
echo -e "${BLUE}║   Step 6: Pulling Latest Code and Redeploying             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
APP_DIR="/opt/farmer-marketplace"
APP_NAME="farmer-marketplace-backend"
BRANCH="${1:-master}"

echo -e "${GREEN}📌 Branch: ${BRANCH}${NC}"
echo ""

# Navigate to application directory
cd $APP_DIR

# Show current version
echo -e "${YELLOW}📊 Current Version:${NC}"
CURRENT_COMMIT=$(git rev-parse --short HEAD)
CURRENT_MESSAGE=$(git log -1 --pretty=%B)
echo "   Commit: $CURRENT_COMMIT"
echo "   Message: $CURRENT_MESSAGE"
echo ""

# Backup current .env files
echo -e "${YELLOW}💾 Backing up environment files...${NC}"
cp backend/.env backend/.env.backup 2>/dev/null || echo "   No backend .env to backup"
cp frontend/.env frontend/.env.backup 2>/dev/null || echo "   No frontend .env to backup"
echo -e "${GREEN}✅ Environment files backed up${NC}"

# Pull latest code
echo -e "${YELLOW}📥 Pulling latest code from GitHub...${NC}"
git fetch origin
git reset --hard origin/$BRANCH
git pull origin $BRANCH

# Show new version
NEW_COMMIT=$(git rev-parse --short HEAD)
NEW_MESSAGE=$(git log -1 --pretty=%B)
echo -e "${GREEN}✅ Code updated${NC}"
echo "   New Commit: $NEW_COMMIT"
echo "   Message: $NEW_MESSAGE"
echo ""

if [ "$CURRENT_COMMIT" == "$NEW_COMMIT" ]; then
    echo -e "${YELLOW}ℹ️  No new changes detected${NC}"
    read -p "   Continue with rebuild anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Update cancelled${NC}"
        exit 0
    fi
fi

# Restore .env files
echo -e "${YELLOW}🔄 Restoring environment files...${NC}"
cp backend/.env.backup backend/.env 2>/dev/null || echo "   No backend .env backup to restore"
cp frontend/.env.backup frontend/.env 2>/dev/null || echo "   No frontend .env backup to restore"
echo -e "${GREEN}✅ Environment files restored${NC}"

# Rebuild Backend
echo -e "${YELLOW}🔨 Rebuilding Backend...${NC}"
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd $APP_DIR
npm install --workspace=backend --omit=dev

echo -e "${YELLOW}🔨 Building backend...${NC}"
cd $APP_DIR/backend
npm run build

if [ -d "dist" ]; then
    echo -e "${GREEN}✅ Backend rebuilt successfully${NC}"
else
    echo -e "${RED}❌ Backend build failed${NC}"
    exit 1
fi

# Rebuild Frontend
echo -e "${YELLOW}🔨 Rebuilding Frontend...${NC}"
echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
cd $APP_DIR
npm install --workspace=frontend

echo -e "${YELLOW}🔨 Building frontend for production...${NC}"
cd $APP_DIR/frontend
npm run build

if [ -d "dist" ]; then
    echo -e "${GREEN}✅ Frontend rebuilt successfully${NC}"
    BUILD_SIZE=$(du -sh dist | cut -f1)
    echo "   Size: ${BUILD_SIZE}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

# Restart backend with PM2
echo -e "${YELLOW}🔄 Restarting backend with PM2...${NC}"
cd $APP_DIR/backend
pm2 restart $APP_NAME

# Wait for application to restart
echo -e "${YELLOW}⏳ Waiting for application to restart...${NC}"
sleep 5

# Check if application is running
if pm2 list | grep -q "$APP_NAME.*online"; then
    echo -e "${GREEN}✅ Application restarted successfully${NC}"
else
    echo -e "${RED}❌ Application failed to restart${NC}"
    echo -e "${YELLOW}   Checking logs...${NC}"
    pm2 logs $APP_NAME --lines 20 --nostream
    exit 1
fi

# Health check
echo -e "${YELLOW}🏥 Running health check...${NC}"
sleep 3

if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend health check passed${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    echo -e "${YELLOW}   Application may still be starting...${NC}"
fi

# Reload Nginx to ensure latest frontend is served
echo -e "${YELLOW}🔄 Reloading Nginx...${NC}"
sudo systemctl reload nginx
echo -e "${GREEN}✅ Nginx reloaded${NC}"

# Clean up old backups
echo -e "${YELLOW}🧹 Cleaning up...${NC}"
rm -f backend/.env.backup frontend/.env.backup
echo -e "${GREEN}✅ Cleanup completed${NC}"

# Show PM2 status
echo ""
echo -e "${YELLOW}📊 PM2 Process Status:${NC}"
pm2 list

# Show recent logs
echo ""
echo -e "${YELLOW}📜 Recent Logs (last 10 lines):${NC}"
pm2 logs $APP_NAME --lines 10 --nostream

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ✅ Application Updated Successfully!                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📋 Update Summary:${NC}"
echo "   ✅ Code: Updated from $CURRENT_COMMIT to $NEW_COMMIT"
echo "   ✅ Backend: Rebuilt and restarted"
echo "   ✅ Frontend: Rebuilt"
echo "   ✅ Nginx: Reloaded"
echo "   ✅ Status: Running"
echo ""
echo -e "${YELLOW}📝 Useful Commands:${NC}"
echo "   View logs: pm2 logs $APP_NAME"
echo "   Monitor: pm2 monit"
echo "   Restart: pm2 restart $APP_NAME"
echo ""
