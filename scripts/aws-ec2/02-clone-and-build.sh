#!/bin/bash

################################################################################
# Script 2: Clone Repository and Build Application
# Purpose: Clone your GitHub repo and build frontend/backend
# Run as: bash 02-clone-and-build.sh
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Farmer Marketplace - Clone & Build                      ║${NC}"
echo -e "${BLUE}║   Step 2: Cloning Repository and Building                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
APP_DIR="/opt/farmer-marketplace"
REPO_URL="https://github.com/gitkailash/Farmer-Marketplace-Platform.git"
BRANCH="master"

# Check if running as ubuntu user
if [ "$USER" != "ubuntu" ]; then
    echo -e "${YELLOW}⚠️  Warning: Not running as ubuntu user${NC}"
    echo -e "${YELLOW}   Current user: $USER${NC}"
fi

# Navigate to application directory
cd $APP_DIR

# Check if repository already exists
if [ -d ".git" ]; then
    echo -e "${YELLOW}📦 Repository already exists, pulling latest changes...${NC}"
    git fetch origin
    git reset --hard origin/$BRANCH
    git pull origin $BRANCH
    echo -e "${GREEN}✅ Repository updated${NC}"
else
    echo -e "${YELLOW}📥 Cloning repository...${NC}"
    git clone -b $BRANCH $REPO_URL .
    echo -e "${GREEN}✅ Repository cloned${NC}"
fi

# Show current commit
CURRENT_COMMIT=$(git rev-parse --short HEAD)
COMMIT_MESSAGE=$(git log -1 --pretty=%B)
echo -e "${GREEN}📌 Current commit: ${CURRENT_COMMIT}${NC}"
echo -e "${GREEN}   Message: ${COMMIT_MESSAGE}${NC}"
echo ""

# Build Backend
echo -e "${YELLOW}🔨 Building Backend...${NC}"
cd $APP_DIR/backend

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found, creating from .env.example...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Please edit backend/.env with your configuration${NC}"
        echo -e "${YELLOW}   Required: JWT_SECRET, MONGODB_URI${NC}"
    else
        echo -e "${RED}❌ .env.example not found${NC}"
        exit 1
    fi
fi

echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
# Install all dependencies (including dev) for build process
npm install --no-workspaces

echo -e "${YELLOW}🔨 Building backend...${NC}"
npm run build

if [ -d "dist" ]; then
    echo -e "${GREEN}✅ Backend built successfully${NC}"
    echo "   Output: backend/dist/"
else
    echo -e "${RED}❌ Backend build failed${NC}"
    exit 1
fi

# Build Frontend
echo -e "${YELLOW}🔨 Building Frontend...${NC}"
cd $APP_DIR/frontend

# EC2 IP Configuration
EC2_IP="100.49.247.47"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found, creating from .env.example...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        
        # Auto-configure with EC2 IP
        echo -e "${YELLOW}🔧 Auto-configuring with EC2 IP: $EC2_IP${NC}"
        sed -i "s|VITE_API_URL=http://localhost:5000/api|VITE_API_URL=http://$EC2_IP/api|g" .env
        sed -i "s|VITE_NODE_ENV=development|VITE_NODE_ENV=production|g" .env
        sed -i "s|VITE_ENABLE_DEBUG=true|VITE_ENABLE_DEBUG=false|g" .env
        
        echo -e "${GREEN}✅ Frontend .env configured with:${NC}"
        echo "   VITE_API_URL=http://$EC2_IP/api"
        echo ""
        echo -e "${YELLOW}💡 To change IP later, edit: frontend/.env${NC}"
    else
        echo -e "${RED}❌ .env.example not found${NC}"
        exit 1
    fi
fi

echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
# Install directly in frontend folder, ignoring workspace
npm install --legacy-peer-deps --no-workspaces

echo -e "${YELLOW}🔨 Building frontend for production...${NC}"
# Skip type-check and build directly with vite
npm run clean || true
npx vite build --mode production

if [ -d "dist" ]; then
    echo -e "${GREEN}✅ Frontend built successfully${NC}"
    echo "   Output: frontend/dist/"
    
    # Show build size
    BUILD_SIZE=$(du -sh dist | cut -f1)
    echo "   Size: ${BUILD_SIZE}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

# Create necessary directories
echo -e "${YELLOW}📁 Creating necessary directories...${NC}"
cd $APP_DIR
mkdir -p logs
mkdir -p backups
mkdir -p uploads
echo -e "${GREEN}✅ Directories created${NC}"

# Set permissions
echo -e "${YELLOW}🔐 Setting permissions...${NC}"
chown -R ubuntu:ubuntu $APP_DIR
chmod -R 755 $APP_DIR
echo -e "${GREEN}✅ Permissions set${NC}"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ✅ Clone & Build Completed Successfully!                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📋 Build Summary:${NC}"
echo "   ✅ Repository: Cloned/Updated"
echo "   ✅ Backend: Built (dist/)"
echo "   ✅ Frontend: Built (dist/)"
echo "   ✅ Directories: Created"
echo "   ✅ Permissions: Set"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "   1. Edit configuration files:"
echo "      - backend/.env (JWT_SECRET, MONGODB_URI)"
echo "      - frontend/.env (VITE_API_URL)"
echo "   2. Run script 3: bash 03-setup-database.sh"
echo ""
