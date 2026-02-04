# 🚀 Production Deployment Guide

[![AWS](https://img.shields.io/badge/AWS-EC2-FF9900?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/ec2/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![Nginx](https://img.shields.io/badge/Nginx-1.20+-009639?logo=nginx&logoColor=white)](https://nginx.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![SSL](https://img.shields.io/badge/SSL-Let's%20Encrypt-003A70?logo=letsencrypt&logoColor=white)](https://letsencrypt.org/)
[![Ubuntu](https://img.shields.io/badge/Ubuntu-20.04+-E95420?logo=ubuntu&logoColor=white)](https://ubuntu.com/)
[![GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?logo=github-actions&logoColor=white)](https://github.com/features/actions)
[![Security](https://img.shields.io/badge/Security-Hardened-red)](docs/DEPLOYMENT.md#security-hardening)

Complete guide for deploying the Farmer Marketplace Platform to AWS EC2 with Docker, Nginx, and MongoDB.

## 📋 Prerequisites

### AWS Requirements
- [AWS Account](https://aws.amazon.com/account/) with EC2 access
- [AWS EC2 Instance](https://aws.amazon.com/ec2/) (t3.medium or larger recommended)
- [Ubuntu 20.04 LTS](https://ubuntu.com/download/server) or newer
- [AWS Security Groups](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_SecurityGroups.html) configured for ports 80, 443, 22
- [Elastic IP Address](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/elastic-ip-addresses-eip.html) (recommended)
- Domain name with [Route 53](https://aws.amazon.com/route53/) or external DNS configured (optional)

### Local Requirements
- [AWS CLI](https://aws.amazon.com/cli/) configured (optional)
- [SSH Key Pair](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html) for EC2 access
- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) knowledge

## 🖥️ EC2 Instance Setup

### 1. Launch EC2 Instance

**Instance Specifications:**
```bash
Instance Type: t3.medium (2 vCPU, 4 GB RAM)
Storage: 20 GB GP3 SSD (minimum)
OS: Ubuntu 20.04 LTS
Security Group: Allow ports 22, 80, 443, 5000 (temporary)
```

**Launch via AWS Console:**
1. Navigate to [EC2 Console](https://console.aws.amazon.com/ec2/)
2. Click "Launch Instance"
3. Select Ubuntu Server 20.04 LTS (HVM)
4. Choose t3.medium instance type
5. Configure security group with required ports
6. Select or create key pair
7. Launch instance

### 2. Connect to Instance
```bash
# Connect via SSH
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system packages
sudo apt update && sudo apt upgrade -y
```

### 3. Install Docker & Docker Compose

**Install Docker CE:**
```bash
# Install Docker using official script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker ubuntu

# Verify Docker installation
docker --version
```

**Install Docker Compose:**
```bash
# Install Docker Compose v2
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version

# Logout and login again for group changes
exit
ssh -i your-key.pem ubuntu@your-ec2-ip
```

**References:**
- [Docker Installation Guide](https://docs.docker.com/engine/install/ubuntu/)
- [Docker Compose Installation](https://docs.docker.com/compose/install/)

### 4. Install Additional Tools
```bash
# Install essential packages
sudo apt install -y git nginx htop curl wget unzip certbot python3-certbot-nginx

# Install Node.js 18 LTS (for local scripts)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installations
git --version
nginx -v
node --version
npm --version
```

**References:**
- [Git Installation](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Node.js Installation](https://nodejs.org/en/download/package-manager/)

## 📁 Application Deployment

### 1. Clone Repository
```bash
# Create application directory
sudo mkdir -p /opt/farmer-marketplace
sudo chown ubuntu:ubuntu /opt/farmer-marketplace
cd /opt/farmer-marketplace

# Clone repository (replace with your repository URL)
git clone https://github.com/your-username/farmer-marketplace-platform.git .

# Set up directory permissions
sudo chown -R ubuntu:ubuntu /opt/farmer-marketplace
```

### 2. Configure Environment Variables

**Create Production Environment File:**
```bash
# Copy production template
cp .env.production .env

# Edit environment variables
nano .env
```

**Required Environment Variables:**
```env
# Database Configuration
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your-super-secure-password-here
MONGO_DB_NAME=farmer-marketplace

# JWT Configuration (generate with: openssl rand -base64 32)
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters-long
JWT_EXPIRES_IN=7d

# Security Configuration
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://your-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=30

# Logging
LOG_LEVEL=info
ENABLE_RESPONSE_CACHE=true

# Node Environment
NODE_ENV=production
```

**Configure Frontend Environment:**
```bash
# Create frontend environment file
cd frontend
cp .env.example .env

# Edit frontend environment
nano .env
```

**Frontend Environment:**
```env
VITE_API_URL=https://api.your-domain.com
VITE_NODE_ENV=production
```

### 3. Build and Deploy
```bash
# Return to root directory
cd /opt/farmer-marketplace

# Build and start services
docker-compose -f docker-compose.prod.yml up -d --build

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs to ensure everything started correctly
docker-compose -f docker-compose.prod.yml logs -f
```

**References:**
- [Docker Compose Production Guide](https://docs.docker.com/compose/production/)
- [Environment Variables Best Practices](https://12factor.net/config)

## 🌐 Nginx Configuration

### 1. Configure Nginx as Reverse Proxy

**Remove Default Configuration:**
```bash
sudo rm /etc/nginx/sites-enabled/default
```

**Create Application Configuration:**
```bash
sudo nano /etc/nginx/sites-available/farmer-marketplace
```

**Nginx Configuration:**
```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

# Frontend (React App)
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Serve React app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Backend API
server {
    listen 80;
    server_name api.your-domain.com;
    
    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # API endpoints with rate limiting
    location / {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Stricter rate limiting for auth endpoints
    location ~* ^/api/auth/(login|register) {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check endpoint (no rate limiting)
    location /health {
        proxy_pass http://localhost:5000/health;
        access_log off;
    }
}
```

### 2. Enable Configuration
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/farmer-marketplace /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

**References:**
- [Nginx Configuration Guide](https://nginx.org/en/docs/beginners_guide.html)
- [Nginx Security Headers](https://nginx.org/en/docs/http/ngx_http_headers_module.html)
- [Nginx Rate Limiting](https://nginx.org/en/docs/http/ngx_http_limit_req_module.html)

## 🔒 SSL Certificate Setup (Let's Encrypt)

### 1. Install and Configure Certbot
```bash
# Install Certbot for Nginx
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificates
sudo certbot --nginx -d your-domain.com -d www.your-domain.com -d api.your-domain.com

# Follow the interactive prompts:
# - Enter email address for notifications
# - Agree to terms of service
# - Choose whether to share email with EFF
# - Select redirect option (recommended: redirect HTTP to HTTPS)
```

### 2. Test Automatic Renewal
```bash
# Test certificate renewal
sudo certbot renew --dry-run

# Check renewal timer
sudo systemctl status certbot.timer

# View certificate details
sudo certbot certificates
```

### 3. Configure Automatic Renewal
```bash
# Certbot automatically creates a systemd timer
# Verify it's enabled
sudo systemctl list-timers | grep certbot

# Manual renewal command (if needed)
sudo certbot renew --quiet
```

**References:**
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Certbot User Guide](https://certbot.eff.org/instructions?ws=nginx&os=ubuntu-20)

## 🗄️ Database Setup & Management

### 1. Database Initialization
```bash
# Wait for MongoDB to be ready
docker-compose -f docker-compose.prod.yml logs mongodb

# Check MongoDB health
docker-compose -f docker-compose.prod.yml exec mongodb mongosh --eval "db.adminCommand('ping')"

# Run database migrations
docker-compose -f docker-compose.prod.yml exec backend npm run migrate

# Import initial translations
docker-compose -f docker-compose.prod.yml exec backend node production-translation-import.js
```

### 2. Create Admin User
```bash
# Create initial admin user
docker-compose -f docker-compose.prod.yml exec backend node scripts/create-admin.ts

# Or use the quick setup script
docker-compose -f docker-compose.prod.yml exec backend node scripts/quick-admin.ts
```

### 3. Setup Automated Backups
```bash
# Create backup directory
sudo mkdir -p /opt/farmer-marketplace/backups

# Create backup script
sudo nano /opt/farmer-marketplace/scripts/backup-db.sh
```

**Backup Script:**
```bash
#!/bin/bash
set -e

# Configuration
BACKUP_DIR="/opt/farmer-marketplace/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="farmer-marketplace-backup-$DATE.gz"
COMPOSE_FILE="/opt/farmer-marketplace/docker-compose.prod.yml"

# Load environment variables
source /opt/farmer-marketplace/.env

# Create backup directory
mkdir -p $BACKUP_DIR

# Create MongoDB backup
echo "Starting backup at $(date)"
docker-compose -f $COMPOSE_FILE exec -T mongodb mongodump \
    --authenticationDatabase admin \
    --username $MONGO_ROOT_USERNAME \
    --password $MONGO_ROOT_PASSWORD \
    --gzip \
    --archive > $BACKUP_DIR/$BACKUP_FILE

# Verify backup was created
if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    echo "✅ Backup completed successfully: $BACKUP_FILE"
    echo "📁 Backup size: $(du -h $BACKUP_DIR/$BACKUP_FILE | cut -f1)"
else
    echo "❌ Backup failed!"
    exit 1
fi

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
echo "🧹 Cleaned up old backups (keeping last 7 days)"

# Optional: Upload to S3 (uncomment if using AWS S3)
# aws s3 cp $BACKUP_DIR/$BACKUP_FILE s3://your-backup-bucket/farmer-marketplace/

echo "Backup process completed at $(date)"
```

```bash
# Make script executable
chmod +x /opt/farmer-marketplace/scripts/backup-db.sh

# Test backup script
/opt/farmer-marketplace/scripts/backup-db.sh

# Add to crontab for daily backups at 2 AM
crontab -e
# Add line: 0 2 * * * /opt/farmer-marketplace/scripts/backup-db.sh >> /var/log/backup.log 2>&1
```

**References:**
- [MongoDB Backup Methods](https://docs.mongodb.com/manual/core/backups/)
- [Cron Job Tutorial](https://crontab.guru/)

## 📊 Monitoring & Logging

### 1. Setup System Monitoring
```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs ncdu

# Install Docker monitoring
docker run -d \
  --name=cadvisor \
  --restart=unless-stopped \
  --volume=/:/rootfs:ro \
  --volume=/var/run:/var/run:ro \
  --volume=/sys:/sys:ro \
  --volume=/var/lib/docker/:/var/lib/docker:ro \
  --volume=/dev/disk/:/dev/disk:ro \
  --publish=8080:8080 \
  --detach=true \
  gcr.io/cadvisor/cadvisor:latest
```

### 2. Configure Log Rotation
```bash
# Configure log rotation for Docker containers
sudo nano /etc/logrotate.d/docker-containers
```

**Log Rotation Configuration:**
```
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=10M
    missingok
    delaycompress
    copytruncate
    create 644 root root
}
```

### 3. Application Health Monitoring
```bash
# Create health check script
nano /opt/farmer-marketplace/scripts/health-check.sh
```

**Health Check Script:**
```bash
#!/bin/bash
set -e

# Configuration
API_URL="http://localhost:5000/health"
FRONTEND_URL="http://localhost:3000"
COMPOSE_FILE="/opt/farmer-marketplace/docker-compose.prod.yml"
LOG_FILE="/var/log/health-check.log"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# Check API health
log "Checking API health..."
if curl -f -s --max-time 10 $API_URL > /dev/null; then
    log "✅ API is healthy"
    API_HEALTHY=true
else
    log "❌ API is down - attempting restart"
    cd /opt/farmer-marketplace
    docker-compose -f $COMPOSE_FILE restart backend
    sleep 30
    if curl -f -s --max-time 10 $API_URL > /dev/null; then
        log "✅ API recovered after restart"
        API_HEALTHY=true
    else
        log "❌ API still down after restart"
        API_HEALTHY=false
    fi
fi

# Check frontend
log "Checking Frontend health..."
if curl -f -s --max-time 10 $FRONTEND_URL > /dev/null; then
    log "✅ Frontend is healthy"
    FRONTEND_HEALTHY=true
else
    log "❌ Frontend is down - attempting restart"
    cd /opt/farmer-marketplace
    docker-compose -f $COMPOSE_FILE restart frontend
    sleep 30
    if curl -f -s --max-time 10 $FRONTEND_URL > /dev/null; then
        log "✅ Frontend recovered after restart"
        FRONTEND_HEALTHY=true
    else
        log "❌ Frontend still down after restart"
        FRONTEND_HEALTHY=false
    fi
fi

# Check MongoDB
log "Checking MongoDB health..."
if docker-compose -f $COMPOSE_FILE exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    log "✅ MongoDB is healthy"
    MONGO_HEALTHY=true
else
    log "❌ MongoDB is down"
    MONGO_HEALTHY=false
fi

# Overall health status
if [ "$API_HEALTHY" = true ] && [ "$FRONTEND_HEALTHY" = true ] && [ "$MONGO_HEALTHY" = true ]; then
    log "🎉 All services are healthy"
    exit 0
else
    log "⚠️  Some services are unhealthy"
    exit 1
fi
```

```bash
# Make executable
chmod +x /opt/farmer-marketplace/scripts/health-check.sh

# Test health check
/opt/farmer-marketplace/scripts/health-check.sh

# Add to crontab for monitoring every 5 minutes
crontab -e
# Add line: */5 * * * * /opt/farmer-marketplace/scripts/health-check.sh
```

### 4. Setup Log Aggregation
```bash
# Create log viewing script
nano /opt/farmer-marketplace/scripts/view-logs.sh
```

**Log Viewing Script:**
```bash
#!/bin/bash

# Function to show usage
show_usage() {
    echo "Usage: $0 [service] [lines]"
    echo "Services: backend, frontend, mongodb, nginx, all"
    echo "Lines: number of lines to show (default: 100)"
    echo ""
    echo "Examples:"
    echo "  $0 backend 50    # Show last 50 lines of backend logs"
    echo "  $0 all          # Show logs from all services"
    echo "  $0 nginx        # Show Nginx logs"
}

SERVICE=${1:-all}
LINES=${2:-100}
COMPOSE_FILE="/opt/farmer-marketplace/docker-compose.prod.yml"

case $SERVICE in
    backend)
        echo "=== Backend Logs ==="
        docker-compose -f $COMPOSE_FILE logs --tail=$LINES backend
        ;;
    frontend)
        echo "=== Frontend Logs ==="
        docker-compose -f $COMPOSE_FILE logs --tail=$LINES frontend
        ;;
    mongodb)
        echo "=== MongoDB Logs ==="
        docker-compose -f $COMPOSE_FILE logs --tail=$LINES mongodb
        ;;
    nginx)
        echo "=== Nginx Access Logs ==="
        sudo tail -n $LINES /var/log/nginx/access.log
        echo ""
        echo "=== Nginx Error Logs ==="
        sudo tail -n $LINES /var/log/nginx/error.log
        ;;
    all)
        echo "=== All Application Logs ==="
        docker-compose -f $COMPOSE_FILE logs --tail=$LINES
        echo ""
        echo "=== Nginx Logs ==="
        sudo tail -n 20 /var/log/nginx/error.log
        ;;
    *)
        show_usage
        exit 1
        ;;
esac
```

```bash
# Make executable
chmod +x /opt/farmer-marketplace/scripts/view-logs.sh

# Create alias for easy access
echo "alias logs='/opt/farmer-marketplace/scripts/view-logs.sh'" >> ~/.bashrc
source ~/.bashrc
```

**References:**
- [Docker Logging Best Practices](https://docs.docker.com/config/containers/logging/)
- [System Monitoring with htop](https://htop.dev/)
- [cAdvisor Container Monitoring](https://github.com/google/cadvisor)

## 🔄 Deployment Updates & CI/CD

### 1. Manual Update Process
```bash
# Create update script
nano /opt/farmer-marketplace/scripts/update-app.sh
```

**Update Script:**
```bash
#!/bin/bash
set -e

COMPOSE_FILE="/opt/farmer-marketplace/docker-compose.prod.yml"
BACKUP_SCRIPT="/opt/farmer-marketplace/scripts/backup-db.sh"

echo "🚀 Starting application update..."

# Change to application directory
cd /opt/farmer-marketplace

# Create backup before update
echo "📦 Creating backup before update..."
$BACKUP_SCRIPT

# Pull latest changes
echo "📥 Pulling latest changes..."
git fetch origin
git pull origin main

# Build new images
echo "🔨 Building new images..."
docker-compose -f $COMPOSE_FILE build --no-cache

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose -f $COMPOSE_FILE run --rm backend npm run migrate

# Update services with zero downtime
echo "🔄 Updating services..."

# Scale up backend instances
docker-compose -f $COMPOSE_FILE up -d --scale backend=3

# Wait for new instances to be healthy
sleep 30

# Update frontend
docker-compose -f $COMPOSE_FILE up -d frontend

# Scale back to normal
docker-compose -f $COMPOSE_FILE up -d --scale backend=2

# Clean up old images
echo "🧹 Cleaning up old images..."
docker image prune -f

# Health check
echo "🏥 Running health check..."
sleep 10
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ Update completed successfully!"
else
    echo "❌ Health check failed after update"
    exit 1
fi

echo "🎉 Application update completed!"
```

```bash
# Make executable
chmod +x /opt/farmer-marketplace/scripts/update-app.sh
```

### 2. GitHub Actions Setup

**Create GitHub Actions Directory:**
```bash
mkdir -p .github/workflows
```

**Backend Deployment Workflow:**
```yaml
# .github/workflows/deploy-backend.yml
name: Deploy Backend to EC2

on:
  push:
    branches: [ main ]
    paths: [ 'backend/**' ]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:7.0
        env:
          MONGO_INITDB_ROOT_USERNAME: admin
          MONGO_INITDB_ROOT_PASSWORD: password
        ports:
          - 27017:27017
        options: >-
          --health-cmd "echo 'db.runCommand(\"ping\").ok' | mongosh localhost:27017/test --quiet"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: backend/package-lock.json
    
    - name: Install dependencies
      run: |
        cd backend
        npm ci
    
    - name: Run linting
      run: |
        cd backend
        npm run lint
    
    - name: Run tests
      run: |
        cd backend
        npm run test:ci
      env:
        MONGODB_TEST_URI: mongodb://admin:password@localhost:27017/test?authSource=admin
        JWT_SECRET: test-jwt-secret-for-testing-only-minimum-32-characters
        NODE_ENV: test
    
    - name: Build application
      run: |
        cd backend
        npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to EC2
      uses: appleboy/ssh-action@v1.0.0
      with:
        host: ${{ secrets.EC2_HOST }}
        username: ${{ secrets.EC2_USERNAME }}
        key: ${{ secrets.EC2_PRIVATE_KEY }}
        script: |
          cd /opt/farmer-marketplace
          
          # Pull latest changes
          git pull origin main
          
          # Run update script
          ./scripts/update-app.sh
          
          echo "✅ Backend deployment completed successfully!"
```

**Frontend Deployment Workflow:**
```yaml
# .github/workflows/deploy-frontend.yml
name: Deploy Frontend to EC2

on:
  push:
    branches: [ main ]
    paths: [ 'frontend/**' ]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
    
    - name: Install dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Run linting
      run: |
        cd frontend
        npm run lint
    
    - name: Run type checking
      run: |
        cd frontend
        npm run type-check
    
    - name: Run tests
      run: |
        cd frontend
        npm run test
    
    - name: Build application
      run: |
        cd frontend
        npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to EC2
      uses: appleboy/ssh-action@v1.0.0
      with:
        host: ${{ secrets.EC2_HOST }}
        username: ${{ secrets.EC2_USERNAME }}
        key: ${{ secrets.EC2_PRIVATE_KEY }}
        script: |
          cd /opt/farmer-marketplace
          
          # Pull latest changes
          git pull origin main
          
          # Rebuild and restart frontend
          docker-compose -f docker-compose.prod.yml build frontend
          docker-compose -f docker-compose.prod.yml up -d frontend
          
          # Health check
          sleep 10
          curl -f http://localhost:3000 || exit 1
          
          echo "✅ Frontend deployment completed successfully!"
```

**Required GitHub Secrets:**
- `EC2_HOST`: Your EC2 instance public IP or domain
- `EC2_USERNAME`: SSH username (usually `ubuntu`)
- `EC2_PRIVATE_KEY`: Your EC2 private key content

**References:**
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [SSH Action for GitHub Actions](https://github.com/appleboy/ssh-action)

## 🛡️ Security Hardening

### 1. Firewall Configuration
```bash
# Install and configure UFW (Uncomplicated Firewall)
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (be careful not to lock yourself out)
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw --force enable

# Check status
sudo ufw status verbose
```

### 2. Fail2Ban Setup
```bash
# Install Fail2Ban
sudo apt install -y fail2ban

# Create custom configuration
sudo nano /etc/fail2ban/jail.local
```

**Fail2Ban Configuration:**
```ini
[DEFAULT]
# Ban time in seconds (1 hour)
bantime = 3600

# Time window for counting failures (10 minutes)
findtime = 600

# Number of failures before ban
maxretry = 3

# Email notifications (optional)
destemail = admin@your-domain.com
sendername = Fail2Ban
mta = sendmail

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-botsearch]
enabled = true
filter = nginx-botsearch
logpath = /var/log/nginx/access.log
maxretry = 2
```

```bash
# Start and enable Fail2Ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# Check status
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

### 3. System Updates and Security
```bash
# Enable automatic security updates
sudo apt install -y unattended-upgrades apt-listchanges

# Configure automatic updates
sudo dpkg-reconfigure -plow unattended-upgrades

# Configure update settings
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades
```

**Unattended Upgrades Configuration:**
```bash
// Automatically upgrade packages from these origins
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}";
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};

// Automatically reboot if required
Unattended-Upgrade::Automatic-Reboot "false";

// Email notifications
Unattended-Upgrade::Mail "admin@your-domain.com";
```

### 4. SSH Hardening
```bash
# Backup SSH configuration
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Edit SSH configuration
sudo nano /etc/ssh/sshd_config
```

**SSH Security Settings:**
```bash
# Change default port (optional but recommended)
Port 2222

# Disable root login
PermitRootLogin no

# Use key-based authentication only
PasswordAuthentication no
PubkeyAuthentication yes

# Limit login attempts
MaxAuthTries 3
MaxStartups 3

# Disable empty passwords
PermitEmptyPasswords no

# Use strong ciphers
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com,aes256-ctr,aes192-ctr,aes128-ctr
```

```bash
# Test SSH configuration
sudo sshd -t

# Restart SSH service
sudo systemctl restart sshd

# Update UFW if port changed
sudo ufw allow 2222/tcp
sudo ufw delete allow ssh
```

**References:**
- [UFW Documentation](https://help.ubuntu.com/community/UFW)
- [Fail2Ban Documentation](https://github.com/fail2ban/fail2ban)
- [SSH Security Best Practices](https://www.ssh.com/academy/ssh/sshd_config)

## 🚨 Troubleshooting

### Common Issues and Solutions

#### 1. MongoDB Connection Issues
```bash
# Check MongoDB container status
docker-compose -f docker-compose.prod.yml ps mongodb

# View MongoDB logs
docker-compose -f docker-compose.prod.yml logs mongodb

# Test MongoDB connection
docker-compose -f docker-compose.prod.yml exec mongodb mongosh -u admin -p

# Check MongoDB disk space
df -h
docker system df

# Restart MongoDB
docker-compose -f docker-compose.prod.yml restart mongodb
```

#### 2. Backend API Issues
```bash
# Check backend container status
docker-compose -f docker-compose.prod.yml ps backend

# View backend logs
docker-compose -f docker-compose.prod.yml logs backend --tail=100

# Check health endpoint
curl -v http://localhost:5000/health

# Check environment variables
docker-compose -f docker-compose.prod.yml exec backend env | grep -E "(NODE_ENV|MONGODB_URI|JWT_SECRET)"

# Restart backend
docker-compose -f docker-compose.prod.yml restart backend
```

#### 3. Frontend Issues
```bash
# Check frontend container status
docker-compose -f docker-compose.prod.yml ps frontend

# View frontend logs
docker-compose -f docker-compose.prod.yml logs frontend --tail=100

# Test frontend accessibility
curl -v http://localhost:3000

# Check build issues
docker-compose -f docker-compose.prod.yml build frontend --no-cache

# Restart frontend
docker-compose -f docker-compose.prod.yml restart frontend
```

#### 4. Nginx Issues
```bash
# Check Nginx status
sudo systemctl status nginx

# Test Nginx configuration
sudo nginx -t

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log

# View Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Restart Nginx
sudo systemctl restart nginx
```

#### 5. SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Test certificate renewal
sudo certbot renew --dry-run

# Check certificate expiration
openssl x509 -in /etc/letsencrypt/live/your-domain.com/cert.pem -text -noout | grep "Not After"

# Force certificate renewal
sudo certbot renew --force-renewal
```

#### 6. Disk Space Issues
```bash
# Check disk usage
df -h

# Check Docker disk usage
docker system df

# Clean up Docker resources
docker system prune -a

# Clean up old log files
sudo journalctl --vacuum-time=7d

# Check largest directories
sudo du -h --max-depth=1 / | sort -hr
```

### Performance Optimization

#### 1. Database Optimization
```bash
# Run database optimization script
docker-compose -f docker-compose.prod.yml exec backend npm run optimize-db

# Check database indexes
docker-compose -f docker-compose.prod.yml exec mongodb mongosh -u admin -p
# In MongoDB shell:
# use farmer-marketplace
# db.products.getIndexes()
# db.users.getIndexes()
```

#### 2. Application Performance
```bash
# Monitor container resources
docker stats

# Check application metrics
curl http://localhost:5000/health

# Monitor system resources
htop
iotop
```

#### 3. Nginx Optimization
Add to Nginx configuration:
```nginx
# Worker processes
worker_processes auto;
worker_connections 1024;

# Gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

# Caching
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
```

**References:**
- [Docker Troubleshooting Guide](https://docs.docker.com/config/daemon/troubleshoot/)
- [MongoDB Troubleshooting](https://docs.mongodb.com/manual/faq/diagnostics/)
- [Nginx Troubleshooting](https://nginx.org/en/docs/debugging_log.html)

## 📞 Support & Maintenance

### Regular Maintenance Checklist

**Weekly Tasks:**
- [ ] Check system resources (CPU, memory, disk)
- [ ] Review application logs for errors
- [ ] Verify backup completion
- [ ] Check SSL certificate status
- [ ] Monitor application performance

**Monthly Tasks:**
- [ ] Update system packages
- [ ] Review security logs
- [ ] Test backup restoration
- [ ] Update application dependencies
- [ ] Review and rotate logs

**Quarterly Tasks:**
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Disaster recovery testing
- [ ] Documentation updates
- [ ] Capacity planning review

### Emergency Response

**Service Down Procedure:**
1. Check service status: `docker-compose ps`
2. Review logs: `docker-compose logs [service]`
3. Restart service: `docker-compose restart [service]`
4. If persistent, restore from backup
5. Contact development team

**Security Incident Response:**
1. Isolate affected systems
2. Review security logs: `sudo fail2ban-client status`
3. Check for unauthorized access: `sudo last`
4. Update security measures
5. Document incident

### Contact Information
- **System Administrator**: admin@your-domain.com
- **Development Team**: dev@your-domain.com
- **Emergency Contact**: +1-XXX-XXX-XXXX

### Useful Resources
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [Docker Documentation](https://docs.docker.com/)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Ubuntu Server Guide](https://ubuntu.com/server/docs)

---

**🎉 Congratulations! Your Farmer Marketplace Platform is now deployed and ready for production use.**

For additional support, please refer to the [main documentation](../README.md) or contact the development team.