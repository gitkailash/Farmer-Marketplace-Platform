# 🚀 Quick Start Guide - EC2 Deployment

## One-Time Setup (Run Once)

### 1. Connect to EC2
```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

### 2. Clone Repository
```bash
git clone https://github.com/gitkailash/Farmer-Marketplace-Platform.git
cd Farmer-Marketplace-Platform/scripts/aws-ec2
chmod +x *.sh
```

### 3. Run Setup Scripts (In Order)
```bash
# Step 1: Install dependencies (as root)
sudo bash 01-initial-setup.sh

# Step 2: Exit root, then clone and build
exit
bash 02-clone-and-build.sh

# Step 3: Edit environment files
nano /opt/farmer-marketplace/backend/.env
# Set: JWT_SECRET, MONGODB_URI

nano /opt/farmer-marketplace/frontend/.env
# Set: VITE_API_URL=http://YOUR_EC2_IP/api

# Step 4: Setup database
bash 03-setup-database.sh

# Step 5: Configure Nginx (as root)
sudo bash 04-configure-nginx.sh

# Step 6: Start application
bash 05-start-application.sh
```

### 4. Access Your Application
- **Frontend**: http://YOUR_EC2_IP
- **API Docs**: http://YOUR_EC2_IP/api/docs/ui
- **Health Check**: http://YOUR_EC2_IP/health

---

## Daily Operations

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

### View Logs
```bash
pm2 logs farmer-marketplace-backend
```

### Restart Application
```bash
pm2 restart farmer-marketplace-backend
```

---

## Common Issues

### Application Not Starting?
```bash
pm2 logs farmer-marketplace-backend --lines 50
pm2 restart farmer-marketplace-backend
```

### MongoDB Not Running?
```bash
sudo systemctl status mongod
sudo systemctl restart mongod
```

### Frontend Not Loading?
```bash
sudo systemctl reload nginx
```

---

## Important Files

- **Backend .env**: `/opt/farmer-marketplace/backend/.env`
- **Frontend .env**: `/opt/farmer-marketplace/frontend/.env`
- **Nginx Config**: `/etc/nginx/sites-available/farmer-marketplace`
- **PM2 Config**: `/opt/farmer-marketplace/backend/ecosystem.config.js`
- **Logs**: `/var/log/farmer-marketplace/`
- **Backups**: `/opt/farmer-marketplace/backups/`

---

## Useful Commands

```bash
# PM2
pm2 list                    # List all processes
pm2 logs                    # View logs
pm2 monit                   # Monitor in real-time
pm2 restart all             # Restart all processes

# Nginx
sudo systemctl status nginx # Check status
sudo systemctl reload nginx # Reload config
sudo nginx -t               # Test config

# MongoDB
sudo systemctl status mongod # Check status
mongosh farmer-marketplace   # Connect to DB

# System
df -h                       # Check disk space
free -h                     # Check memory
htop                        # Monitor resources
```

---

**Need Help?** Check `README.md` for detailed documentation.
