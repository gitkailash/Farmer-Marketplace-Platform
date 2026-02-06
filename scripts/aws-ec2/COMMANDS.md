# 🎯 Quick Command Reference

**Your EC2 IP**: `100.49.247.47`

## 🔌 Connect to Server

```bash
ssh -i your-key.pem ubuntu@100.49.247.47
```

---

## 🚀 Deployment Commands (Run Once)

```bash
# 1. Initial setup (as root)
sudo bash 01-initial-setup.sh

# 2. Clone and build
bash 02-clone-and-build.sh

# 3. Edit environment files
nano /opt/farmer-marketplace/backend/.env
nano /opt/farmer-marketplace/frontend/.env

# 4. Setup database
bash 03-setup-database.sh

# 5. Configure Nginx
sudo bash 04-configure-nginx.sh

# 6. Start application
bash 05-start-application.sh
```

---

## 🔄 Daily Operations

### Update Application (After Git Push)
```bash
cd /opt/farmer-marketplace/scripts/aws-ec2
bash 06-update-application.sh
```

### Create Backup
```bash
cd /opt/farmer-marketplace/scripts/aws-ec2
bash 07-backup-restore.sh backup
```

### List Backups
```bash
bash 07-backup-restore.sh list
```

### Restore Backup
```bash
bash 07-backup-restore.sh restore
```

---

## 📊 Monitoring Commands

### PM2 (Backend Process Manager)
```bash
pm2 list                              # List all processes
pm2 logs farmer-marketplace-backend   # View logs
pm2 logs --lines 50                   # View last 50 lines
pm2 monit                             # Real-time monitoring
pm2 restart farmer-marketplace-backend # Restart backend
pm2 stop farmer-marketplace-backend   # Stop backend
pm2 start farmer-marketplace-backend  # Start backend
pm2 info farmer-marketplace-backend   # Detailed info
```

### Nginx (Web Server)
```bash
sudo systemctl status nginx           # Check status
sudo systemctl restart nginx          # Restart
sudo systemctl reload nginx           # Reload config
sudo nginx -t                         # Test configuration
sudo tail -f /var/log/nginx/farmer-marketplace-access.log  # Access logs
sudo tail -f /var/log/nginx/farmer-marketplace-error.log   # Error logs
```

### MongoDB (Database)
```bash
sudo systemctl status mongod          # Check status
sudo systemctl restart mongod         # Restart
mongosh farmer-marketplace            # Connect to database
mongosh farmer-marketplace --eval "db.stats()"  # Database stats
```

### System Monitoring
```bash
df -h                                 # Disk space
free -h                               # Memory usage
htop                                  # CPU/Memory monitor (press q to quit)
top                                   # Process monitor
ps aux | grep node                    # Node processes
sudo lsof -i :5000                    # Check port 5000
sudo lsof -i :80                      # Check port 80
```

---

## 🧪 Testing Commands

### Test from EC2 (SSH into server first)
```bash
# Health check
curl http://localhost:5000/health

# Frontend
curl http://localhost

# API
curl http://localhost:5000/api/products
```

### Test from Your Computer
```bash
# Health check
curl http://100.49.247.47/health

# Frontend
curl http://100.49.247.47

# API
curl http://100.49.247.47/api/products
```

### Test in Browser
```
Frontend:    http://100.49.247.47
API Docs:    http://100.49.247.47/api/docs/ui
Health:      http://100.49.247.47/health
```

---

## 🔧 Troubleshooting Commands

### Backend Issues
```bash
# View logs
pm2 logs farmer-marketplace-backend --lines 100

# Restart
pm2 restart farmer-marketplace-backend

# Check if running
pm2 list

# Check port
sudo lsof -i :5000
```

### Frontend Issues
```bash
# Check if built
ls -la /opt/farmer-marketplace/frontend/dist

# Rebuild
cd /opt/farmer-marketplace/frontend
npm run build

# Reload Nginx
sudo systemctl reload nginx
```

### Database Issues
```bash
# Check status
sudo systemctl status mongod

# Restart
sudo systemctl restart mongod

# Check logs
sudo tail -50 /var/log/mongodb/mongod.log

# Connect and test
mongosh farmer-marketplace --eval "db.users.countDocuments()"
```

### Nginx Issues
```bash
# Test config
sudo nginx -t

# Check logs
sudo tail -50 /var/log/nginx/error.log

# Restart
sudo systemctl restart nginx
```

---

## 📁 Important File Locations

```bash
# Application directory
cd /opt/farmer-marketplace

# Backend .env
nano /opt/farmer-marketplace/backend/.env

# Frontend .env
nano /opt/farmer-marketplace/frontend/.env

# Nginx config
sudo nano /etc/nginx/sites-available/farmer-marketplace

# PM2 config
nano /opt/farmer-marketplace/backend/ecosystem.config.js

# Logs
cd /var/log/farmer-marketplace

# Backups
cd /opt/farmer-marketplace/backups
```

---

## 🗄️ Database Commands

### Connect to Database
```bash
mongosh farmer-marketplace
```

### Inside MongoDB Shell
```javascript
// Show collections
show collections

// Count users
db.users.countDocuments()

// Count products
db.products.countDocuments()

// Find admin user
db.users.findOne({ role: 'admin' })

// Database stats
db.stats()

// Exit
exit
```

---

## 🔐 Security Commands

### Firewall (UFW)
```bash
sudo ufw status                       # Check firewall status
sudo ufw allow 80                     # Allow HTTP
sudo ufw allow 443                    # Allow HTTPS
sudo ufw allow 22                     # Allow SSH
```

### Check Open Ports
```bash
sudo netstat -tulpn | grep LISTEN
```

### Check Failed Login Attempts
```bash
sudo tail -50 /var/log/auth.log
```

---

## 🧹 Maintenance Commands

### Clean Up Disk Space
```bash
# Check disk usage
df -h

# Find large files
sudo du -h /opt/farmer-marketplace | sort -rh | head -20

# Clean npm cache
npm cache clean --force

# Clean old logs
sudo find /var/log -type f -name "*.log" -mtime +30 -delete

# Clean old backups (keeps last 7)
cd /opt/farmer-marketplace/backups
ls -t backup_*.tar.gz | tail -n +8 | xargs -r rm
```

### Update System
```bash
sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y
```

---

## 📦 Package Management

### Update Node Packages
```bash
cd /opt/farmer-marketplace/backend
npm outdated                          # Check outdated packages
npm update                            # Update packages

cd /opt/farmer-marketplace/frontend
npm outdated
npm update
```

### Update PM2
```bash
npm install -g pm2@latest
pm2 update
```

---

## 🔄 Git Commands

### Check Current Version
```bash
cd /opt/farmer-marketplace
git log -1                            # Last commit
git status                            # Current status
git branch                            # Current branch
```

### Manual Update
```bash
cd /opt/farmer-marketplace
git fetch origin
git pull origin master
```

---

## 💾 Backup Commands

### Manual Database Backup
```bash
# Create backup
mongodump --db=farmer-marketplace --out=/opt/farmer-marketplace/backups/manual_backup_$(date +%Y%m%d_%H%M%S)

# Compress backup
cd /opt/farmer-marketplace/backups
tar -czf manual_backup_$(date +%Y%m%d_%H%M%S).tar.gz manual_backup_*
```

### Manual Database Restore
```bash
# Extract backup
cd /opt/farmer-marketplace/backups
tar -xzf backup_YYYYMMDD_HHMMSS.tar.gz

# Restore
mongorestore --db=farmer-marketplace --drop backup_YYYYMMDD_HHMMSS/farmer-marketplace
```

---

## 🎯 One-Liner Commands

```bash
# Restart everything
pm2 restart all && sudo systemctl reload nginx

# Check all services
sudo systemctl status mongod nginx && pm2 list

# View all logs
pm2 logs --lines 20 && sudo tail -20 /var/log/nginx/farmer-marketplace-error.log

# Quick health check
curl http://localhost:5000/health && echo " - Backend OK" || echo " - Backend FAIL"

# Disk and memory check
df -h / && free -h
```

---

## 📞 Emergency Commands

### If Application is Down
```bash
# 1. Check what's running
pm2 list
sudo systemctl status nginx mongod

# 2. Restart everything
pm2 restart all
sudo systemctl restart nginx mongod

# 3. Check logs
pm2 logs --lines 50
sudo tail -50 /var/log/nginx/error.log
```

### If Out of Memory
```bash
# Check memory
free -h

# Restart PM2
pm2 restart all

# Clear cache
sync && echo 3 | sudo tee /proc/sys/vm/drop_caches
```

### If Out of Disk Space
```bash
# Check space
df -h

# Clean logs
sudo journalctl --vacuum-time=7d

# Clean old backups
cd /opt/farmer-marketplace/backups
ls -t backup_*.tar.gz | tail -n +4 | xargs -r rm
```

---

**Quick Access URLs**:
- Frontend: http://100.49.247.47
- API Docs: http://100.49.247.47/api/docs/ui
- Health: http://100.49.247.47/health
