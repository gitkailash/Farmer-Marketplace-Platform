#!/bin/bash

################################################################################
# Script 5: Start Application with PM2
# Purpose: Start backend with PM2 process manager
# Run as: bash 05-start-application.sh
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Farmer Marketplace - Start Application                  ║${NC}"
echo -e "${BLUE}║   Step 5: Starting Backend with PM2                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
APP_DIR="/opt/farmer-marketplace"
APP_NAME="farmer-marketplace-backend"

# Navigate to backend directory
cd $APP_DIR/backend

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found in backend directory${NC}"
    echo -e "${YELLOW}   Please create .env file with required configuration${NC}"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Backend build not found (dist/ directory missing)${NC}"
    echo -e "${YELLOW}   Please run: npm run build${NC}"
    exit 1
fi

# Stop existing PM2 process if running
echo -e "${YELLOW}🛑 Stopping existing PM2 processes...${NC}"
pm2 stop $APP_NAME 2>/dev/null || echo "   No existing process found"
pm2 delete $APP_NAME 2>/dev/null || echo "   No existing process to delete"

# Create PM2 ecosystem file
echo -e "${YELLOW}📝 Creating PM2 ecosystem configuration...${NC}"

cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: '$APP_NAME',
    script: './dist/server.js',
    instances: 1,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    error_file: '$APP_DIR/logs/backend-error.log',
    out_file: '$APP_DIR/logs/backend-out.log',
    log_file: '$APP_DIR/logs/backend-combined.log',
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF

echo -e "${GREEN}✅ PM2 ecosystem configuration created${NC}"

# Start application with PM2
echo -e "${YELLOW}🚀 Starting application with PM2...${NC}"
pm2 start ecosystem.config.js

# Wait for application to start
echo -e "${YELLOW}⏳ Waiting for application to start...${NC}"
sleep 5

# Check if application is running
if pm2 list | grep -q "$APP_NAME.*online"; then
    echo -e "${GREEN}✅ Application started successfully${NC}"
else
    echo -e "${RED}❌ Application failed to start${NC}"
    echo -e "${YELLOW}   Checking logs...${NC}"
    pm2 logs $APP_NAME --lines 20 --nostream
    exit 1
fi

# Health check
echo -e "${YELLOW}🏥 Running health check...${NC}"
sleep 3

if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend health check passed${NC}"
    
    # Get health status
    HEALTH_STATUS=$(curl -s http://localhost:5000/health | jq -r '.status' 2>/dev/null || echo "healthy")
    echo "   Status: $HEALTH_STATUS"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    echo -e "${YELLOW}   Application may still be starting...${NC}"
fi

# Save PM2 process list
echo -e "${YELLOW}💾 Saving PM2 process list...${NC}"
pm2 save

# Show PM2 status
echo ""
echo -e "${YELLOW}📊 PM2 Process Status:${NC}"
pm2 list

# Show application info
echo ""
echo -e "${YELLOW}📋 Application Information:${NC}"
pm2 info $APP_NAME

# Show recent logs
echo ""
echo -e "${YELLOW}📜 Recent Logs (last 10 lines):${NC}"
pm2 logs $APP_NAME --lines 10 --nostream

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ✅ Application Started Successfully!                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📋 Application Summary:${NC}"
echo "   ✅ Backend: Running with PM2"
echo "   ✅ Process Name: $APP_NAME"
echo "   ✅ Port: 5000"
echo "   ✅ Mode: Cluster (1 instance)"
echo "   ✅ Auto Restart: Enabled"
echo ""
echo -e "${YELLOW}🌐 Access Points:${NC}"
echo "   Frontend: http://YOUR_EC2_IP"
echo "   Backend API: http://YOUR_EC2_IP/api"
echo "   API Docs: http://YOUR_EC2_IP/api/docs/ui"
echo "   Health Check: http://YOUR_EC2_IP/health"
echo ""
echo -e "${YELLOW}📝 Useful PM2 Commands:${NC}"
echo "   View logs: pm2 logs $APP_NAME"
echo "   Monitor: pm2 monit"
echo "   Restart: pm2 restart $APP_NAME"
echo "   Stop: pm2 stop $APP_NAME"
echo "   Status: pm2 status"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "   1. Test the application in your browser"
echo "   2. Create admin user if not done: cd backend && node scripts/create-admin.ts"
echo "   3. For SSL setup, run: bash 06-setup-ssl.sh yourdomain.com"
echo ""
