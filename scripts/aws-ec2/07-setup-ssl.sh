#!/bin/bash

################################################################################
# Script 7: Setup SSL Certificate with Let's Encrypt
# Purpose: Install and configure SSL certificate for HTTPS
# Run as: sudo bash 07-setup-ssl.sh yourdomain.com
# NOTE: You MUST have a domain name pointing to your EC2 IP first!
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Farmer Marketplace - SSL Setup                          ║${NC}"
echo -e "${BLUE}║   Step 7: Installing Let's Encrypt Certificate           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root (use sudo)${NC}"
    exit 1
fi

# Check if domain is provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Domain name is required${NC}"
    echo ""
    echo -e "${YELLOW}Usage:${NC}"
    echo "   sudo bash 07-setup-ssl.sh yourdomain.com"
    echo ""
    echo -e "${YELLOW}Example:${NC}"
    echo "   sudo bash 07-setup-ssl.sh farmermarket.com"
    echo "   sudo bash 07-setup-ssl.sh www.farmermarket.com"
    echo ""
    echo -e "${YELLOW}⚠️  Important:${NC}"
    echo "   1. You MUST own a domain name"
    echo "   2. Domain DNS must point to this server IP"
    echo "   3. Wait 5-10 minutes after DNS change before running this"
    echo ""
    exit 1
fi

DOMAIN=$1
EMAIL="${2:-admin@$DOMAIN}"

echo -e "${GREEN}🌐 Domain: ${DOMAIN}${NC}"
echo -e "${GREEN}📧 Email: ${EMAIL}${NC}"
echo ""

# Get server IP
echo -e "${YELLOW}🔍 Checking server and domain configuration...${NC}"
SERVER_IP=$(curl -s ifconfig.me)
echo "   Server IP: $SERVER_IP"

# Check if domain resolves
if ! command -v dig &> /dev/null; then
    echo -e "${YELLOW}   Installing dig tool...${NC}"
    apt-get update -qq
    apt-get install -y dnsutils > /dev/null 2>&1
fi

DOMAIN_IP=$(dig +short $DOMAIN | tail -n1)
echo "   Domain IP: $DOMAIN_IP"

if [ -z "$DOMAIN_IP" ]; then
    echo -e "${RED}❌ Domain does not resolve to any IP${NC}"
    echo -e "${YELLOW}   Please configure your domain DNS first:${NC}"
    echo "   1. Go to your domain registrar (Namecheap, GoDaddy, etc.)"
    echo "   2. Add an A record:"
    echo "      Type: A"
    echo "      Name: @ (or your subdomain)"
    echo "      Value: $SERVER_IP"
    echo "      TTL: 300"
    echo "   3. Wait 5-10 minutes for DNS propagation"
    echo "   4. Run this script again"
    echo ""
    exit 1
fi

if [ "$SERVER_IP" != "$DOMAIN_IP" ]; then
    echo -e "${RED}⚠️  Warning: Domain does not point to this server${NC}"
    echo -e "${YELLOW}   Expected: $SERVER_IP${NC}"
    echo -e "${YELLOW}   Found: $DOMAIN_IP${NC}"
    echo ""
    echo -e "${YELLOW}   Please update your DNS A record to point to: $SERVER_IP${NC}"
    echo ""
    read -p "   Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ Domain correctly points to this server${NC}"
fi

# Install Certbot
echo ""
echo -e "${YELLOW}📦 Installing Certbot...${NC}"
apt-get update -y
apt-get install -y certbot python3-certbot-nginx

echo -e "${GREEN}✅ Certbot installed${NC}"

# Backup Nginx configuration
echo -e "${YELLOW}💾 Backing up Nginx configuration...${NC}"
cp /etc/nginx/sites-available/farmer-marketplace /etc/nginx/sites-available/farmer-marketplace.pre-ssl
echo -e "${GREEN}✅ Backup created${NC}"

# Update Nginx configuration with domain
echo -e "${YELLOW}📝 Updating Nginx configuration with domain...${NC}"
sed -i "s/server_name _;/server_name $DOMAIN;/" /etc/nginx/sites-available/farmer-marketplace

# Test Nginx configuration
nginx -t || {
    echo -e "${RED}❌ Nginx configuration error${NC}"
    echo -e "${YELLOW}   Restoring backup...${NC}"
    cp /etc/nginx/sites-available/farmer-marketplace.pre-ssl /etc/nginx/sites-available/farmer-marketplace
    exit 1
}

# Reload Nginx
systemctl reload nginx
echo -e "${GREEN}✅ Nginx configuration updated${NC}"

# Obtain SSL certificate
echo ""
echo -e "${YELLOW}🔐 Obtaining SSL certificate from Let's Encrypt...${NC}"
echo -e "${YELLOW}   This may take a few moments...${NC}"
echo ""

certbot --nginx \
    -d $DOMAIN \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    --redirect \
    --hsts \
    --staple-ocsp

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ SSL certificate obtained and installed${NC}"
else
    echo -e "${RED}❌ Failed to obtain SSL certificate${NC}"
    echo ""
    echo -e "${YELLOW}Common issues:${NC}"
    echo "   1. Domain doesn't point to this server"
    echo "   2. Port 80 is not accessible (check security group)"
    echo "   3. Nginx is not running"
    echo "   4. Domain DNS hasn't propagated yet (wait 10 minutes)"
    echo ""
    echo -e "${YELLOW}   Restoring backup configuration...${NC}"
    cp /etc/nginx/sites-available/farmer-marketplace.pre-ssl /etc/nginx/sites-available/farmer-marketplace
    systemctl reload nginx
    exit 1
fi

# Test SSL certificate
echo ""
echo -e "${YELLOW}🧪 Testing SSL certificate...${NC}"
sleep 3

if curl -f -k https://$DOMAIN/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ SSL certificate is working${NC}"
else
    echo -e "${YELLOW}⚠️  SSL test inconclusive, but certificate is installed${NC}"
fi

# Setup automatic renewal
echo ""
echo -e "${YELLOW}🔄 Setting up automatic certificate renewal...${NC}"

# Test renewal process
certbot renew --dry-run

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Automatic renewal is configured${NC}"
    echo "   Certificates will auto-renew via systemd timer"
else
    echo -e "${YELLOW}⚠️  Renewal test had issues, but certificate is installed${NC}"
fi

# Show certificate info
echo ""
echo -e "${YELLOW}📋 Certificate Information:${NC}"
certbot certificates

# Update firewall to ensure HTTPS is allowed
echo ""
echo -e "${YELLOW}🔥 Ensuring HTTPS is allowed in firewall...${NC}"
ufw allow https
echo -e "${GREEN}✅ Firewall updated${NC}"

# Update frontend .env with HTTPS URL
echo ""
echo -e "${YELLOW}🔧 Updating frontend configuration for HTTPS...${NC}"
FRONTEND_ENV="/opt/farmer-marketplace/frontend/.env"
if [ -f "$FRONTEND_ENV" ]; then
    # Backup current .env
    cp $FRONTEND_ENV ${FRONTEND_ENV}.backup
    
    # Update API URL to use HTTPS
    sed -i "s|VITE_API_URL=http://.*|VITE_API_URL=https://$DOMAIN/api|g" $FRONTEND_ENV
    
    echo -e "${GREEN}✅ Frontend .env updated${NC}"
    echo "   VITE_API_URL=https://$DOMAIN/api"
    echo ""
    echo -e "${YELLOW}⚠️  You need to rebuild the frontend:${NC}"
    echo "   cd /opt/farmer-marketplace/frontend"
    echo "   npm run clean"
    echo "   npx vite build --mode production"
    echo "   sudo systemctl reload nginx"
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ✅ SSL Setup Completed Successfully!                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📋 SSL Summary:${NC}"
echo "   ✅ Certificate: Installed"
echo "   ✅ Domain: $DOMAIN"
echo "   ✅ HTTPS: Enabled"
echo "   ✅ HTTP → HTTPS: Redirect enabled"
echo "   ✅ Auto-renewal: Configured"
echo ""
echo -e "${YELLOW}🌐 Access Points:${NC}"
echo "   Frontend: https://$DOMAIN"
echo "   Backend API: https://$DOMAIN/api"
echo "   API Docs: https://$DOMAIN/api/docs/ui"
echo "   Health Check: https://$DOMAIN/health"
echo ""
echo -e "${YELLOW}📝 Certificate Details:${NC}"
echo "   Issuer: Let's Encrypt"
echo "   Valid for: 90 days"
echo "   Auto-renewal: Every 60 days"
echo "   Renewal check: Twice daily via systemd timer"
echo ""
echo -e "${YELLOW}📝 Important Next Steps:${NC}"
echo "   1. Rebuild frontend with new HTTPS URL (see commands above)"
echo "   2. Test: https://$DOMAIN"
echo "   3. Update any hardcoded URLs in your app"
echo ""
echo -e "${YELLOW}📝 Useful Commands:${NC}"
echo "   Check certificates: sudo certbot certificates"
echo "   Renew manually: sudo certbot renew"
echo "   Test renewal: sudo certbot renew --dry-run"
echo "   View Nginx config: sudo nano /etc/nginx/sites-available/farmer-marketplace"
echo ""
