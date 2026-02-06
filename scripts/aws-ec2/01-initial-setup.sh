#!/bin/bash

################################################################################
# Script 1: Initial EC2 Setup
# Purpose: Install all required dependencies on fresh Ubuntu EC2 instance
# Run as: sudo bash 01-initial-setup.sh
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Farmer Marketplace - Initial EC2 Setup                  ║${NC}"
echo -e "${BLUE}║   Step 1: Installing Dependencies                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root (use sudo)${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 System Information:${NC}"
echo "   OS: $(lsb_release -d | cut -f2)"
echo "   Kernel: $(uname -r)"
echo "   Architecture: $(uname -m)"
echo ""

# Update system
echo -e "${YELLOW}🔄 Updating system packages...${NC}"
apt-get update -y
apt-get upgrade -y

# Install essential tools
echo -e "${YELLOW}🛠️  Installing essential tools...${NC}"
apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    fail2ban

echo -e "${GREEN}✅ Essential tools installed${NC}"

# Install Node.js 18.x
echo -e "${YELLOW}📦 Installing Node.js 18.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verify Node.js installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
echo -e "${GREEN}✅ Node.js ${NODE_VERSION} installed${NC}"
echo -e "${GREEN}✅ npm ${NPM_VERSION} installed${NC}"

# Install PM2 globally
echo -e "${YELLOW}🔧 Installing PM2 process manager...${NC}"
npm install -g pm2
pm2 startup systemd -u ubuntu --hp /home/ubuntu
echo -e "${GREEN}✅ PM2 installed and configured${NC}"

# Install MongoDB 7.0
echo -e "${YELLOW}🗄️  Installing MongoDB 7.0...${NC}"
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
    gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
    tee /etc/apt/sources.list.d/mongodb-org-7.0.list

apt-get update -y
apt-get install -y mongodb-org

# Start and enable MongoDB
systemctl start mongod
systemctl enable mongod

# Verify MongoDB installation
sleep 5
if systemctl is-active --quiet mongod; then
    MONGO_VERSION=$(mongod --version | head -n 1)
    echo -e "${GREEN}✅ MongoDB installed and running${NC}"
    echo "   Version: ${MONGO_VERSION}"
else
    echo -e "${RED}❌ MongoDB failed to start${NC}"
    exit 1
fi

# Install Nginx
echo -e "${YELLOW}🌐 Installing Nginx...${NC}"
apt-get install -y nginx

# Start and enable Nginx
systemctl start nginx
systemctl enable nginx

# Verify Nginx installation
if systemctl is-active --quiet nginx; then
    NGINX_VERSION=$(nginx -v 2>&1 | cut -d'/' -f2)
    echo -e "${GREEN}✅ Nginx ${NGINX_VERSION} installed and running${NC}"
else
    echo -e "${RED}❌ Nginx failed to start${NC}"
    exit 1
fi

# Configure firewall
echo -e "${YELLOW}🔥 Configuring firewall (UFW)...${NC}"
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw allow 5000/tcp  # Backend API (temporary, will be proxied)
echo -e "${GREEN}✅ Firewall configured${NC}"

# Configure fail2ban for SSH protection
echo -e "${YELLOW}🛡️  Configuring fail2ban...${NC}"
systemctl start fail2ban
systemctl enable fail2ban
echo -e "${GREEN}✅ fail2ban configured${NC}"

# Create application directory
echo -e "${YELLOW}📁 Creating application directory...${NC}"
mkdir -p /opt/farmer-marketplace
chown -R ubuntu:ubuntu /opt/farmer-marketplace
echo -e "${GREEN}✅ Application directory created: /opt/farmer-marketplace${NC}"

# Create logs directory
mkdir -p /var/log/farmer-marketplace
chown -R ubuntu:ubuntu /var/log/farmer-marketplace
echo -e "${GREEN}✅ Logs directory created: /var/log/farmer-marketplace${NC}"

# Install additional useful tools
echo -e "${YELLOW}🔧 Installing additional tools...${NC}"
apt-get install -y \
    htop \
    ncdu \
    tree \
    vim \
    nano \
    zip \
    unzip

echo -e "${GREEN}✅ Additional tools installed${NC}"

# Clean up
echo -e "${YELLOW}🧹 Cleaning up...${NC}"
apt-get autoremove -y
apt-get clean

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ✅ Initial Setup Completed Successfully!                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📋 Installed Components:${NC}"
echo "   ✅ Node.js: ${NODE_VERSION}"
echo "   ✅ npm: ${NPM_VERSION}"
echo "   ✅ PM2: $(pm2 --version)"
echo "   ✅ MongoDB: Running"
echo "   ✅ Nginx: Running"
echo "   ✅ Firewall: Configured"
echo "   ✅ fail2ban: Running"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "   1. Exit root and switch to ubuntu user: exit"
echo "   2. Run script 2: bash 02-clone-and-build.sh"
echo ""
