#!/bin/bash

################################################################################
# Helper Script: Configure Frontend Environment
# Purpose: Automatically configure frontend .env with EC2 IP
# Run as: bash configure-frontend-env.sh
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Configure Frontend Environment                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
APP_DIR="/opt/farmer-marketplace"
FRONTEND_ENV="$APP_DIR/frontend/.env"
EC2_IP="100.49.247.47"

echo -e "${YELLOW}📝 Configuring frontend .env file...${NC}"
echo "   EC2 IP: $EC2_IP"
echo "   File: $FRONTEND_ENV"
echo ""

# Check if .env.example exists
if [ ! -f "$APP_DIR/frontend/.env.example" ]; then
    echo -e "${RED}❌ .env.example not found${NC}"
    exit 1
fi

# Create .env from .env.example
cp "$APP_DIR/frontend/.env.example" "$FRONTEND_ENV"

# Update VITE_API_URL with EC2 IP
sed -i "s|VITE_API_URL=http://localhost:5000/api|VITE_API_URL=http://$EC2_IP/api|g" "$FRONTEND_ENV"

# Set production environment
sed -i "s|VITE_NODE_ENV=development|VITE_NODE_ENV=production|g" "$FRONTEND_ENV"

# Disable debug in production
sed -i "s|VITE_ENABLE_DEBUG=true|VITE_ENABLE_DEBUG=false|g" "$FRONTEND_ENV"

echo -e "${GREEN}✅ Frontend .env configured${NC}"
echo ""

# Show the configuration
echo -e "${YELLOW}📋 Configuration:${NC}"
grep "VITE_API_URL" "$FRONTEND_ENV"
grep "VITE_NODE_ENV" "$FRONTEND_ENV"
grep "VITE_ENABLE_DEBUG" "$FRONTEND_ENV"

echo ""
echo -e "${GREEN}✅ Configuration complete!${NC}"
echo ""
echo -e "${YELLOW}📝 To manually edit:${NC}"
echo "   nano $FRONTEND_ENV"
echo ""
