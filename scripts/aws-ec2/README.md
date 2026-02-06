# AWS EC2 Deployment Guide - Farmer Marketplace Platform

Complete step-by-step deployment guide for deploying the Farmer Marketplace Platform on AWS EC2 using PM2 + Nginx (no Docker).

## 📋 Prerequisites

### AWS EC2 Instance Requirements
- **Instance Type**: t2.micro (1 vCPU, 1GB RAM) - Free Tier eligible
- **OS**: Ubuntu 22.04 LTS (64-bit)
- **Storage**: 20GB EBS volume (minimum)
- **Security Group**: Open ports 22 (SSH), 80 (HTTP), 443 (HTTPS)

### Local Requirements
- SSH key pair for EC2 access
- GitHub repository access
- Basic knowledge of Linux commands

## 🚀 Quick Start

### Step 1: Connect to EC2 Instance
```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

### Step 2: Download Deployment Scripts
```bash
# Clone the repository
git clone https://github.com/gitkailash/Farmer-Marketplace-Platform.git
cd Farmer-Marketplace-Platform/scripts/aws-ec2

# Make scripts executable
chmod +x *.sh
```

### Step 3: Run Scripts in Order
```bash
# 1. Initial setup (installs Node.js, MongoDB, Nginx, PM2)
sudo bash 01-initial-setup.sh

# 2. Exit root and switch to ubuntu user
exit

# 3. Clone and build application
bash 02-clone-and-build.sh

# 4. Configure environment files
nano /opt/farmer-marketplace/backend/.env
nano /opt/farmer-marketplace/frontend/.env

# 5. Setup database
bash 03-setup-database.sh

# 6. Configure Nginx
sudo bash 04-configure-nginx.sh

# 7. Start application
bash 05-start-application.sh
```

## 📝 Detailed Script Documentation

### Script 1: Initial Setup (`01-initial-setup.sh`)
**Purpose**: Install all required dependencies on fresh Ubuntu EC2 instance

**What it does**:
- Updates system packages
- Installs Node.js 18.x and npm
- Installs PM2 process manager
- Installs MongoDB 7.0
- Installs Nginx web server
- Configures firewall (UFW)
- Installs fail2ban for SSH protection
- Creates application directories

**Run as**: `sudo bash 01-initial-setup.sh`

**Duration**: ~5-10 minutes

**Output**:
- ✅ Node.js, npm, PM2 installed
- ✅ MongoDB running on port 27017
- ✅ Nginx running on port 80
- ✅ Firewall configured
- ✅ Application directory: `/opt/farmer-marketplace`

---

### Script 2: Clone and Build (`02-clone-and-build.sh`)
**Purpose**: Clone GitHub repository and build frontend/backend

**What it does**:
- Clones repository from GitHub
- Creates `.env` files from examples
- Installs backend dependencies
- Builds backend TypeScript to JavaScript
- Installs frontend dependencies
- Builds frontend for production
- Sets proper permissions

**Run as**: `bash 02-clone-and-build.sh`

**Duration**: ~5-10 minutes (depends on internet speed)

**Important**: After running this script, you MUST edit the environment files:

**Backend `.env` (`/opt/farmer-marketplace/backend/.env`)**:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/farmer-marketplace
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

**Frontend `.env` (`/opt/farmer-marketplace/frontend/.env`)**:
```env
VITE_API_URL=http://YOUR_EC2_IP/api
```

---

### Script 3: Setup Database (`03-setup-database.sh`)
**Purpose**: Configure MongoDB, create database, indexes, and admin user

**What it does**:
- Verifies MongoDB is running
- Creates database and collections
- Creates optimized indexes for:
  - Users, Farmers, Products
  - Orders, Reviews, Messages
  - Gallery, Mayor Messages, News
  - Translations
- Runs admin user creation script
- Configures MongoDB for production
- Shows database statistics

**Run as**: `bash 03-setup-database.sh`

**Duration**: ~2-3 minutes

**Output**:
- ✅ Database created with indexes
- ✅ Admin user created (you'll be prompted for details)
- ✅ MongoDB configured for production

---

### Script 4: Configure Nginx (`04-configure-nginx.sh`)
**Purpose**: Setup Nginx as reverse proxy for frontend and backend

**What it does**:
- Creates Nginx configuration
- Sets up reverse proxy for backend API
- Configures static file serving for frontend
- Enables gzip compression
- Sets up rate limiting
- Configures security headers
- Sets up log rotation

**Run as**: `sudo bash 04-configure-nginx.sh`

**Duration**: ~1 minute

**Configuration**:
- Frontend: Served from `/opt/farmer-marketplace/frontend/dist`
- Backend API: Proxied to `http://127.0.0.1:5000`
- Logs: `/var/log/nginx/farmer-marketplace-*.log`

**Output**:
- ✅ Nginx configured and running
- ✅ Frontend accessible on port 80
- ✅ Backend API proxied to `/api`

---

### Script 5: Start Application (`05-start-application.sh`)
**Purpose**: Start backend with PM2 process manager

**What it does**:
- Stops any existing PM2 processes
- Creates PM2 ecosystem configuration
- Starts backend with PM2
- Runs health check
- Saves PM2 process list
- Shows application status and logs

**Run as**: `bash 05-start-application.sh`

**Duration**: ~1 minute

**Output**:
- ✅ Backend running with PM2
- ✅ Auto-restart enabled
- ✅ Health check passed

**Access Points**:
- Frontend: `http://YOUR_EC2_IP`
- Backend API: `http://YOUR_EC2_IP/api`
- API Docs: `http://YOUR_EC2_IP/api/docs/ui`
- Health Check: `http://YOUR_EC2_IP/health`

---

### Script 6: Update Application (`06-update-application.sh`)
**Purpose**: Pull latest code, rebuild, and restart application

**What it does**:
- Shows current version
- Backs up environment files
- Pulls latest code from GitHub
- Rebuilds backend and frontend
- Restarts backend with PM2
- Reloads Nginx
- Runs health check

**Run as**: `bash 06-update-application.sh [branch]`

**Examples**:
```bash
# Update from master branch (default)
bash 06-update-application.sh

# Update from specific branch
bash 06-update-application.sh develop
```

**Duration**: ~5-10 minutes

**Output**:
- ✅ Code updated
- ✅ Backend and frontend rebuilt
- ✅ Application restarted

---

### Script 7: Backup and Restore (`07-backup-restore.sh`)
**Purpose**: Backup MongoDB database or restore from backup

**What it does**:
- **Backup**: Creates compressed database backup
- **Restore**: Restores database from backup
- **List**: Shows all available backups

**Run as**: `bash 07-backup-restore.sh [backup|restore|list]`

**Examples**:
```bash
# Create a backup
bash 07-backup-restore.sh backup

# List all backups
bash 07-backup-restore.sh list

# Restore from backup (interactive)
bash 07-backup-restore.sh restore
```

**Backup Location**: `/opt/farmer-marketplace/backups/`

**Features**:
- Automatic compression
- Keeps last 7 backups
- Safety backup before restore
- Interactive restore selection

---

### Script 8: Setup SSL (`08-setup-ssl.sh`) - OPTIONAL
**Purpose**: Install SSL certificate for HTTPS (requires domain name)

**⚠️ IMPORTANT**: You MUST have a domain name first! SSL cannot be installed on IP addresses.

**What it does**:
- Installs Certbot (Let's Encrypt client)
- Verifies domain points to your server
- Obtains free SSL certificate
- Configures Nginx for HTTPS
- Sets up automatic certificate renewal
- Updates frontend .env with HTTPS URL

**Run as**: `sudo bash 08-setup-ssl.sh yourdomain.com`

**Prerequisites**:
1. Own a domain name (buy from Namecheap, GoDaddy, or get free from Freenom)
2. Configure DNS A record to point to your EC2 IP
3. Wait 5-10 minutes for DNS propagation
4. Ensure port 80 and 443 are open in security group

**Examples**:
```bash
# Setup SSL for your domain
sudo bash 08-setup-ssl.sh farmermarket.com

# Setup SSL with custom email
sudo bash 08-setup-ssl.sh farmermarket.com admin@farmermarket.com
```

**Duration**: ~2-3 minutes

**Output**:
- ✅ SSL certificate installed
- ✅ HTTPS enabled
- ✅ HTTP → HTTPS redirect
- ✅ Auto-renewal configured

**After SSL setup, rebuild frontend**:
```bash
cd /opt/farmer-marketplace/frontend
npm run clean
npx vite build --mode production
sudo systemctl reload nginx
```

**Access Points After SSL**:
- Frontend: `https://yourdomain.com`
- Backend API: `https://yourdomain.com/api`
- API Docs: `https://yourdomain.com/api/docs/ui`

---

# List all backups
bash 07-backup-restore.sh list

# Restore from backup (interactive)
bash 07-backup-restore.sh restore
```

**Backup Location**: `/opt/farmer-marketplace/backups/`

**Features**:
- Automatic compression
- Keeps last 7 backups
- Safety backup before restore
- Interactive restore selection

---

## 🔧 Post-Deployment Configuration

### 1. Create Admin User
If not created during database setup:
```bash
cd /opt/farmer-marketplace/backend
node scripts/create-admin.ts
```

### 2. Configure Environment Variables
Edit backend `.env`:
```bash
nano /opt/farmer-marketplace/backend/.env
```

Edit frontend `.env`:
```bash
nano /opt/farmer-marketplace/frontend/.env
```

### 3. Test Application
```bash
# Check backend health
curl http://localhost:5000/health

# Check frontend
curl http://YOUR_EC2_IP

# Check API docs
curl http://YOUR_EC2_IP/api/docs/ui
```

## 📊 Monitoring and Maintenance

### PM2 Commands
```bash
# View all processes
pm2 list

# View logs
pm2 logs farmer-marketplace-backend

# Monitor in real-time
pm2 monit

# Restart application
pm2 restart farmer-marketplace-backend

# Stop application
pm2 stop farmer-marketplace-backend

# View detailed info
pm2 info farmer-marketplace-backend
```

### Nginx Commands
```bash
# Check status
sudo systemctl status nginx

# Reload configuration
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# Test configuration
sudo nginx -t

# View logs
sudo tail -f /var/log/nginx/farmer-marketplace-access.log
sudo tail -f /var/log/nginx/farmer-marketplace-error.log
```

### MongoDB Commands
```bash
# Check status
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod

# Connect to database
mongosh farmer-marketplace

# View database stats
mongosh farmer-marketplace --eval "db.stats()"
```

### System Monitoring
```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
htop

# Check running processes
ps aux | grep node
```

## 🔄 Regular Maintenance Tasks

### Daily
- Monitor application logs: `pm2 logs`
- Check disk space: `df -h`

### Weekly
- Create database backup: `bash 07-backup-restore.sh backup`
- Review error logs: `sudo tail -100 /var/log/nginx/farmer-marketplace-error.log`

### Monthly
- Update system packages: `sudo apt update && sudo apt upgrade`
- Review and clean old logs
- Check security updates

## 🐛 Troubleshooting

### Application Won't Start
```bash
# Check PM2 logs
pm2 logs farmer-marketplace-backend --lines 50

# Check if port 5000 is in use
sudo lsof -i :5000

# Restart application
pm2 restart farmer-marketplace-backend
```

### MongoDB Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -50 /var/log/mongodb/mongod.log

# Restart MongoDB
sudo systemctl restart mongod
```

### Nginx Issues
```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -50 /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### Frontend Not Loading
```bash
# Check if frontend is built
ls -la /opt/farmer-marketplace/frontend/dist

# Rebuild frontend
cd /opt/farmer-marketplace/frontend
npm run build

# Reload Nginx
sudo systemctl reload nginx
```

### Out of Memory
```bash
# Check memory usage
free -h

# Restart application to free memory
pm2 restart farmer-marketplace-backend

# Consider upgrading to t2.small (2GB RAM)
```

## 💰 Cost Optimization Tips

1. **Use Free Tier**: t2.micro is free for first 12 months
2. **Stop when not in use**: Stop EC2 instance during non-business hours
3. **Use Reserved Instances**: Save up to 75% for long-term usage
4. **Monitor data transfer**: Minimize outbound data transfer
5. **Use CloudWatch alarms**: Set up billing alerts

## 🔐 Security Best Practices

1. **Keep system updated**:
   ```bash
   sudo apt update && sudo apt upgrade
   ```

2. **Use strong passwords**: For admin user and database

3. **Enable MongoDB authentication** (optional):
   ```bash
   # Edit MongoDB config
   sudo nano /etc/mongod.conf
   # Uncomment security section
   ```

4. **Regular backups**: Run daily backups

5. **Monitor logs**: Check for suspicious activity

6. **Use SSH keys only**: Disable password authentication

7. **Keep firewall enabled**: UFW is configured by scripts

## 📞 Support

For issues or questions:
- GitHub Issues: https://github.com/gitkailash/Farmer-Marketplace-Platform/issues
- Developer: Kailash Yadav

## 📄 License

See LICENSE file in repository root.

---

**Last Updated**: February 2026
**Version**: 1.0.0
