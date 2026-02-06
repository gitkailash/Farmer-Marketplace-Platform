# 🌐 IP Configuration Guide

**Your EC2 Public IP**: `100.49.247.47`

## 📍 Where is the IP Used?

### 1. Frontend Environment File (AUTOMATIC)
**File**: `/opt/farmer-marketplace/frontend/.env`

The IP is **automatically configured** when you run `02-clone-and-build.sh`.

**Configuration**:
```env
VITE_API_URL=http://100.49.247.47/api
```

This tells the frontend where to find the backend API.

---

## ✅ Automatic Configuration

When you run the deployment scripts, the IP is **automatically set** in:

### Script: `02-clone-and-build.sh`
- Automatically creates `frontend/.env` from `.env.example`
- Sets `VITE_API_URL=http://100.49.247.47/api`
- Sets `VITE_NODE_ENV=production`
- Disables debug mode

**You don't need to manually edit anything!**

---

## 🔧 Manual Configuration (If Needed)

If you need to change the IP later (e.g., EC2 IP changed):

### Option 1: Edit Frontend .env Directly
```bash
nano /opt/farmer-marketplace/frontend/.env
```

Change:
```env
VITE_API_URL=http://100.49.247.47/api
```

Then rebuild frontend:
```bash
cd /opt/farmer-marketplace/frontend
npm run build
sudo systemctl reload nginx
```

### Option 2: Use Helper Script
```bash
cd /opt/farmer-marketplace/scripts/aws-ec2
nano configure-frontend-env.sh  # Update EC2_IP variable
bash configure-frontend-env.sh
```

Then rebuild:
```bash
cd /opt/farmer-marketplace/frontend
npm run build
sudo systemctl reload nginx
```

---

## 🚫 Where IP is NOT Needed

### Backend Configuration
The backend doesn't need the EC2 IP because:
- It listens on `localhost:5000`
- Nginx proxies external requests to it
- MongoDB is on `localhost:27017`

**Backend .env** only needs:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/farmer-marketplace
JWT_SECRET=your-secret-key
```

### Nginx Configuration
Nginx doesn't need the IP because:
- It listens on all interfaces (`0.0.0.0:80`)
- It proxies to `localhost:5000`
- Works with any IP or domain

---

## 🔄 If EC2 IP Changes

AWS EC2 IPs can change when you stop/start the instance. If your IP changes:

### Step 1: Get New IP
```bash
curl ifconfig.me
```

### Step 2: Update Frontend .env
```bash
nano /opt/farmer-marketplace/frontend/.env
```

Change to new IP:
```env
VITE_API_URL=http://NEW_IP/api
```

### Step 3: Rebuild Frontend
```bash
cd /opt/farmer-marketplace/frontend
npm run build
sudo systemctl reload nginx
```

### Step 4: Update Documentation
Update these files with new IP:
- `scripts/aws-ec2/02-clone-and-build.sh` (line with `EC2_IP=`)
- `scripts/aws-ec2/configure-frontend-env.sh` (line with `EC2_IP=`)
- `scripts/aws-ec2/DEPLOYMENT_CHECKLIST.md`
- `scripts/aws-ec2/COMMANDS.md`

---

## 💡 Pro Tip: Use Elastic IP

To avoid IP changes, use AWS Elastic IP (free if attached to running instance):

1. Go to AWS Console → EC2 → Elastic IPs
2. Allocate new Elastic IP
3. Associate with your EC2 instance
4. Update frontend .env with Elastic IP
5. Rebuild frontend

**Benefits**:
- IP never changes
- Free when attached to running instance
- Can move between instances

---

## 🧪 Testing IP Configuration

### Test from EC2 Server
```bash
# Check frontend .env
cat /opt/farmer-marketplace/frontend/.env | grep VITE_API_URL

# Should show: VITE_API_URL=http://100.49.247.47/api
```

### Test from Browser
1. Open: `http://100.49.247.47`
2. Open browser console (F12)
3. Check Network tab
4. API calls should go to: `http://100.49.247.47/api/...`

### Test API Directly
```bash
# From your computer
curl http://100.49.247.47/api/products
curl http://100.49.247.47/health
```

---

## 📋 Quick Reference

| Component | Needs IP? | Configuration |
|-----------|-----------|---------------|
| Frontend .env | ✅ YES | `VITE_API_URL=http://100.49.247.47/api` |
| Backend .env | ❌ NO | Uses `localhost` |
| Nginx config | ❌ NO | Listens on all IPs |
| MongoDB | ❌ NO | Uses `localhost` |
| Deployment scripts | ✅ YES | Auto-configured in script |

---

## 🎯 Summary

**The IP is only needed in ONE place**: `frontend/.env`

**It's automatically configured** when you run `02-clone-and-build.sh`

**You only need to manually change it if**:
- EC2 IP changes
- You want to use a different IP/domain
- You're troubleshooting connection issues

---

**Current Configuration**:
- EC2 IP: `100.49.247.47`
- Frontend URL: `http://100.49.247.47`
- API URL: `http://100.49.247.47/api`
- Auto-configured: ✅ Yes
