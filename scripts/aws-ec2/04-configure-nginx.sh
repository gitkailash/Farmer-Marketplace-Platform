#!/bin/bash

################################################################################
# Script 4: Configure Nginx
# Purpose: Setup Nginx as reverse proxy for frontend and backend
# Run as: sudo bash 04-configure-nginx.sh
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Farmer Marketplace - Nginx Configuration                ║${NC}"
echo -e "${BLUE}║   Step 4: Setting up Reverse Proxy                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root (use sudo)${NC}"
    exit 1
fi

# Configuration
APP_DIR="/opt/farmer-marketplace"
DOMAIN="${1:-_}"  # Use _ for IP-based access, or provide domain name

if [ "$DOMAIN" != "_" ]; then
    echo -e "${GREEN}🌐 Configuring for domain: ${DOMAIN}${NC}"
else
    echo -e "${YELLOW}🌐 Configuring for IP-based access${NC}"
    echo -e "${YELLOW}   To use domain, run: sudo bash 04-configure-nginx.sh yourdomain.com${NC}"
fi

# Backup existing Nginx config
echo -e "${YELLOW}💾 Backing up existing Nginx configuration...${NC}"
if [ -f "/etc/nginx/sites-available/default" ]; then
    cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup
    echo -e "${GREEN}✅ Backup created: /etc/nginx/sites-available/default.backup${NC}"
fi

# Create Nginx configuration
echo -e "${YELLOW}📝 Creating Nginx configuration...${NC}"

cat > /etc/nginx/sites-available/farmer-marketplace <<EOF
# Farmer Marketplace Platform - Nginx Configuration

# Rate limiting zones
limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=auth_limit:10m rate=5r/s;

# Upstream backend server
upstream backend_server {
    server 127.0.0.1:5000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

# HTTP Server
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Logging
    access_log /var/log/nginx/farmer-marketplace-access.log;
    error_log /var/log/nginx/farmer-marketplace-error.log warn;

    # Client body size limit (for file uploads)
    client_max_body_size 10M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # API routes with rate limiting
    location /api/auth {
        limit_req zone=auth_limit burst=10 nodelay;
        
        proxy_pass http://backend_server;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://backend_server;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint (no rate limiting)
    location /health {
        proxy_pass http://backend_server/health;
        access_log off;
    }

    # Frontend static files
    location / {
        root $APP_DIR/frontend/dist;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Don't cache HTML files
        location ~* \.html$ {
            expires -1;
            add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
        }
    }

    # Security: Prevent access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Security: Block common attack patterns
    location ~* \.(php|asp|aspx|jsp)$ {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Hide nginx version
    server_tokens off;
}
EOF

echo -e "${GREEN}✅ Nginx configuration created${NC}"

# Enable the site
echo -e "${YELLOW}🔗 Enabling site configuration...${NC}"
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/farmer-marketplace /etc/nginx/sites-enabled/

# Test Nginx configuration
echo -e "${YELLOW}🧪 Testing Nginx configuration...${NC}"
if nginx -t; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
else
    echo -e "${RED}❌ Nginx configuration has errors${NC}"
    echo -e "${YELLOW}   Restoring backup...${NC}"
    cp /etc/nginx/sites-available/default.backup /etc/nginx/sites-available/default
    exit 1
fi

# Reload Nginx
echo -e "${YELLOW}🔄 Reloading Nginx...${NC}"
systemctl reload nginx

if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx reloaded successfully${NC}"
else
    echo -e "${RED}❌ Nginx failed to reload${NC}"
    exit 1
fi

# Create log rotation configuration
echo -e "${YELLOW}📋 Configuring log rotation...${NC}"
cat > /etc/logrotate.d/farmer-marketplace <<EOF
/var/log/nginx/farmer-marketplace-*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 \$(cat /var/run/nginx.pid)
        fi
    endscript
}
EOF

echo -e "${GREEN}✅ Log rotation configured${NC}"

# Show Nginx status
echo ""
echo -e "${YELLOW}📊 Nginx Status:${NC}"
systemctl status nginx --no-pager | head -n 10

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ✅ Nginx Configuration Completed Successfully!           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📋 Nginx Summary:${NC}"
echo "   ✅ Configuration: Created"
echo "   ✅ Site: Enabled"
echo "   ✅ Status: Running"
echo "   ✅ Log Rotation: Configured"
echo ""
echo -e "${YELLOW}📝 Configuration Details:${NC}"
echo "   Frontend: Served from $APP_DIR/frontend/dist"
echo "   Backend API: Proxied to http://127.0.0.1:5000"
echo "   Logs: /var/log/nginx/farmer-marketplace-*.log"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "   1. Run script 5: bash 05-start-application.sh"
echo ""
