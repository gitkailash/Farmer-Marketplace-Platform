# 🚀 Deployment Checklist - Your EC2 Instance

**EC2 Public IP**: `100.49.247.47`

## ✅ Pre-Deployment Checklist

### AWS EC2 Security Group
Make sure these ports are open:
- [ ] Port 22 (SSH) - For connecting to server
- [ ] Port 80 (HTTP) - For web access
- [ ] Port 443 (HTTPS) - For future SSL (optional)

### Local Setup
- [ ] Have your SSH key ready (`.pem` file)
- [ ] GitHub repository is accessible
- [ ] You have the repository URL: `https://github.com/gitkailash/Farmer-Marketplace-Platform.git`

---

## 📝 Step-by-Step Deployment

### Step 1: Connect to EC2
```bash
ssh -i your-key.pem ubuntu@100.49.247.47
```

### Step 2: Download Scripts
```bash
git clone https://github.com/gitkailash/Farmer-Marketplace-Platform.git
cd Farmer-Marketplace-Platform/scripts/aws-ec2
chmod +x *.sh
```

### Step 3: Initial Setup (as root)
```bash
sudo bash 01-initial-setup.sh
```
**Duration**: ~5-10 minutes  
**What it does**: Installs Node.js, MongoDB, Nginx, PM2

**After completion**:
- [ ] Node.js installed
- [ ] MongoDB running
- [ ] Nginx running
- [ ] PM2 installed

### Step 4: Exit Root and Clone Repository
```bash
exit
cd Farmer-Marketplace-Platform/scripts/aws-ec2
bash 02-clone-and-build.sh
```
**Duration**: ~5-10 minutes  
**What it does**: Clones repo, builds frontend & backend

**After completion**:
- [ ] Repository cloned to `/opt/farmer-marketplace`
- [ ] Backend built (dist/ folder exists)
- [ ] Frontend built (dist/ folder exists)

### Step 5: Configure Environment Files

**Backend Configuration**:
```bash
nano /opt/farmer-marketplace/backend/.env
```

Update these values:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/farmer-marketplace
JWT_SECRET=change-this-to-a-very-long-random-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
```

**Frontend Configuration**:
```bash
nano /opt/farmer-marketplace/frontend/.env
```

Update this value:
```env
VITE_API_URL=http://100.49.247.47/api
```

**Checklist**:
- [ ] Backend .env configured
- [ ] Frontend .env configured with IP: `100.49.247.47`
- [ ] JWT_SECRET changed to secure random string

### Step 6: Setup Database
```bash
bash 03-setup-database.sh
```
**Duration**: ~2-3 minutes  
**What it does**: Creates database, indexes, admin user

**You'll be prompted to create admin user**:
- [ ] Admin email entered
- [ ] Admin password entered (remember this!)
- [ ] Admin name entered

### Step 7: Configure Nginx
```bash
sudo bash 04-configure-nginx.sh
```
**Duration**: ~1 minute  
**What it does**: Configures reverse proxy

**After completion**:
- [ ] Nginx configured
- [ ] Configuration tested successfully

### Step 8: Start Application
```bash
bash 05-start-application.sh
```
**Duration**: ~1 minute  
**What it does**: Starts backend with PM2

**After completion**:
- [ ] Backend running with PM2
- [ ] Health check passed

---

## 🌐 Access Your Application

After successful deployment, access these URLs:

### Frontend (Main Application)
```
http://100.49.247.47
```
- [ ] Frontend loads successfully
- [ ] Can see homepage

### API Documentation (Swagger)
```
http://100.49.247.47/api/docs/ui
```
- [ ] Swagger UI loads
- [ ] Can see all API endpoints

### Health Check
```
http://100.49.247.47/health
```
- [ ] Returns: `{"status":"healthy"}`

### Backend API
```
http://100.49.247.47/api
```
- [ ] API is accessible

---

## 🧪 Testing Checklist

### 1. Test Login
- [ ] Go to: `http://100.49.247.47/login`
- [ ] Login with admin credentials
- [ ] Successfully logged in

### 2. Test Admin Panel
- [ ] Access admin dashboard
- [ ] Can see admin features

### 3. Test API
```bash
# From your local machine or EC2
curl http://100.49.247.47/health
curl http://100.49.247.47/api/products
```
- [ ] Health endpoint works
- [ ] Products endpoint works

---

## 📊 Verify Services Running

SSH into your EC2 and run:

```bash
# Check PM2
pm2 list
# Should show: farmer-marketplace-backend (online)

# Check Nginx
sudo systemctl status nginx
# Should show: active (running)

# Check MongoDB
sudo systemctl status mongod
# Should show: active (running)

# Check application logs
pm2 logs farmer-marketplace-backend --lines 20
```

**Checklist**:
- [ ] PM2 process is online
- [ ] Nginx is active
- [ ] MongoDB is active
- [ ] No errors in logs

---

## 🔧 Post-Deployment Tasks

### 1. Create Database Backup
```bash
cd /opt/farmer-marketplace/scripts/aws-ec2
bash 07-backup-restore.sh backup
```
- [ ] First backup created

### 2. Test Backup/Restore
```bash
bash 07-backup-restore.sh list
```
- [ ] Can see backup listed

### 3. Save Important Information
Document these for your records:
- [ ] EC2 IP: `100.49.247.47`
- [ ] Admin email: _______________
- [ ] Admin password: _______________ (store securely!)
- [ ] SSH key location: _______________
- [ ] Deployment date: _______________

---

## 🔄 Future Updates

When you push new code to GitHub:

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@100.49.247.47

# Navigate to scripts
cd /opt/farmer-marketplace/scripts/aws-ec2

# Run update script
bash 06-update-application.sh
```

---

## 📱 Share with Clients

Once deployed, share these URLs with your clients:

**Application URL**:
```
http://100.49.247.47
```

**Admin Panel**:
```
http://100.49.247.47/login
(Use admin credentials)
```

**API Documentation**:
```
http://100.49.247.47/api/docs/ui
```

---

## 🐛 Troubleshooting

### Frontend Not Loading?
```bash
# Check Nginx
sudo systemctl status nginx
sudo systemctl reload nginx

# Check frontend build
ls -la /opt/farmer-marketplace/frontend/dist
```

### Backend Not Working?
```bash
# Check PM2
pm2 list
pm2 logs farmer-marketplace-backend

# Restart backend
pm2 restart farmer-marketplace-backend
```

### Database Issues?
```bash
# Check MongoDB
sudo systemctl status mongod
sudo systemctl restart mongod

# Check database
mongosh farmer-marketplace --eval "db.stats()"
```

### Can't Connect to EC2?
- Check security group has port 22 open
- Verify SSH key permissions: `chmod 400 your-key.pem`
- Verify IP hasn't changed (EC2 IPs can change on restart)

---

## 💰 Cost Tracking

**Monthly Costs** (Nepal pricing):
- EC2 t2.micro: $9.35/month (first year) → $25.85/month after
- Data transfer: ~$1-2/month
- **Total**: ~$10-27/month

**Your Pricing**:
- Charge client: $60/month
- Your profit: $33-50/month per client
- Margin: 56.9%

---

## 📞 Support

**Developer**: Kailash Yadav  
**Repository**: https://github.com/gitkailash/Farmer-Marketplace-Platform  
**Documentation**: See `README.md` in `scripts/aws-ec2/`

---

## ✅ Deployment Complete!

Once all checkboxes are marked:
- [ ] All services running
- [ ] Application accessible at `http://100.49.247.47`
- [ ] Admin user created and tested
- [ ] First backup created
- [ ] Documentation saved

**Congratulations! Your Farmer Marketplace Platform is live! 🎉**

---

**Deployment Date**: _______________  
**Deployed By**: Kailash Yadav  
**EC2 Instance**: 100.49.247.47
