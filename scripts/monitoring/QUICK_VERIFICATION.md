# ✅ Quick Monitoring Verification Guide

**Your monitoring stack is installed! Now verify everything is working.**

---

## 🎯 **Step 1: Check Services are Running**

SSH into your EC2 server and run:

```bash
sudo systemctl status prometheus node_exporter grafana-server loki promtail alertmanager
```

**All should show:** `active (running)` in green ✅

**If any service is not running:**
```bash
sudo systemctl start SERVICE_NAME
sudo systemctl enable SERVICE_NAME
```

---

## 🎯 **Step 2: Check PM2 Backend (IMPORTANT!)**

```bash
pm2 list
```

**You should see:**
```
┌─────┬────────────────────────────┬─────────┬─────────┐
│ id  │ name                       │ status  │ restart │
├─────┼────────────────────────────┼─────────┼─────────┤
│ 0   │ farmer-marketplace-backend │ online  │ 0       │
└─────┴────────────────────────────┴─────────┴─────────┘
```

**If not running:**
```bash
cd /opt/farmer-marketplace
pm2 start ecosystem.config.js
pm2 save
```

---

## 🎯 **Step 3: Verify Prometheus is Collecting Data**

### **Open in browser:**
```
http://100.49.247.47:9090
```

### **Check Targets:**
1. Click **"Status"** in top menu
2. Click **"Targets"**
3. You should see:

```
✅ prometheus (1/1 up)
✅ node (1/1 up)
✅ backend (1/1 up)  ← Only if PM2 is running
```

**If any show DOWN:**
- Check if service is running (Step 1)
- Wait 1-2 minutes and refresh
- Check logs: `sudo journalctl -u SERVICE_NAME -f`

---

## 🎯 **Step 4: Test Your First Prometheus Query**

### **In Prometheus (http://100.49.247.47:9090):**

1. Go to **"Graph"** tab (default page)
2. In the query box, paste:
   ```
   100 - (avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
   ```
3. Click **"Execute"** button
4. Click **"Graph"** tab (next to Table)

**You should see:** A line graph showing CPU usage %

**What it means:**
- Line below 50% = Good ✅
- Line 50-80% = Moderate 🟡
- Line above 80% = High 🔴

### **Try More Queries:**

**Memory Usage %:**
```
(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100
```

**Disk Usage %:**
```
(node_filesystem_size_bytes{mountpoint="/"} - node_filesystem_free_bytes{mountpoint="/"}) / node_filesystem_size_bytes{mountpoint="/"} * 100
```

**System Load:**
```
node_load1
```

---

## 🎯 **Step 5: Access Grafana (Your Main Dashboard)**

### **Open in browser:**
```
http://100.49.247.47:3000
```

### **First Login:**
- **Username:** `admin`
- **Password:** `admin`
- You'll be asked to change password → Choose a strong one!

---

## 🎯 **Step 6: Import Node Exporter Dashboard**

**This is your main system monitoring dashboard!**

1. Click the **"+"** icon on left sidebar
2. Click **"Import dashboard"**
3. In "Import via grafana.com" box, enter: **1860**
4. Click **"Load"**
5. Select **"Prometheus"** as data source
6. Click **"Import"**

**You'll see:**
- 📊 CPU usage graphs
- 📊 Memory usage graphs
- 📊 Disk usage graphs
- 📊 Network traffic
- 📊 System load
- 📊 And much more!

**This is your main dashboard - bookmark it!**

---

## 🎯 **Step 7: Check Alertmanager**

### **Open in browser:**
```
http://100.49.247.47:9093
```

**You should see:**
- No active alerts (all green) ✅
- If you see alerts, they'll be listed here

**Email alerts are configured to:** me01kls@gmail.com

---

## 🎯 **Step 8: View Logs in Grafana**

1. In Grafana, click **"Explore"** (compass icon) on left sidebar
2. Select **"Loki"** from dropdown at top
3. Click **"Log browser"** button
4. Select a log source:
   - `{job="backend"}` - Backend logs
   - `{job="nginx"}` - Nginx logs
   - `{job="pm2"}` - PM2 logs

**Search for errors:**
```
{job="backend"} |= "error"
```

---

## ✅ **Verification Checklist**

Run through this checklist:

```
□ All monitoring services are running (Step 1)
□ PM2 backend is running (Step 2)
□ Prometheus targets are all UP (Step 3)
□ CPU query works in Prometheus (Step 4)
□ Can login to Grafana (Step 5)
□ Node Exporter dashboard imported (Step 6)
□ Alertmanager is accessible (Step 7)
□ Can view logs in Loki (Step 8)
```

**All checked? You're ready! 🎉**

---

## 📚 **What to Read Next**

Now that everything is verified, read these guides in order:

### **1. BEGINNER_GUIDE.md** (Start here!)
- Complete walkthrough of all tools
- How to use Grafana
- How to search logs
- How to understand alerts
- Daily monitoring routine

### **2. PROMETHEUS_GUIDE.md**
- How to analyze Prometheus
- Essential queries to try
- What to look for in graphs
- Troubleshooting with Prometheus

### **3. CHEAT_SHEET.md**
- Quick reference for daily tasks
- Useful queries
- Quick fixes
- Emergency commands

**Location:** `scripts/monitoring/`

---

## 🎯 **Your Daily Routine (5 minutes)**

Once everything is verified, your daily routine is simple:

```
1. Open Grafana: http://100.49.247.47:3000
2. Check Node Exporter dashboard
3. Verify: CPU < 80%, Memory < 85%, Disk < 85%
4. Check Alertmanager: http://100.49.247.47:9093
5. No active alerts? You're good! ☕
```

---

## 🆘 **Common Issues**

### **"No data" in Grafana:**
- Wait 1-2 minutes for data to collect
- Check Prometheus targets (Step 3)
- Verify services are running (Step 1)

### **Backend target is DOWN:**
- Check PM2: `pm2 list`
- Start backend: `pm2 start ecosystem.config.js`
- Check logs: `pm2 logs farmer-marketplace-backend`

### **Can't access Grafana:**
- Check service: `sudo systemctl status grafana-server`
- Restart: `sudo systemctl restart grafana-server`
- Check firewall: `sudo ufw status | grep 3000`

---

## 🎉 **You're All Set!**

Your monitoring stack is ready. Follow the steps above to verify everything, then read the guides to learn how to use it effectively.

**Remember:**
- Prometheus = Raw data and queries
- Grafana = Beautiful dashboards
- Loki = Log search
- Alertmanager = Email alerts

**Start with:** Grafana Node Exporter dashboard - it has everything you need!

---

**Happy Monitoring! 📊🎯**
