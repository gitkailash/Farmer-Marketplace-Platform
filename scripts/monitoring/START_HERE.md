# 🚀 START HERE - Monitoring Quick Start

**Your monitoring is installed! Here's what to do in the next 10 minutes.**

---

## 📋 **3 Simple Steps to Get Started**

### **Step 1: Open Prometheus (2 minutes)**

```
http://100.49.247.47:9090
```

**What to do:**
1. Click **"Status"** → **"Targets"** in top menu
2. Check all services show **"UP"** ✅
3. If any show DOWN, wait 1 minute and refresh

**Screenshot what you should see:**
```
Endpoint                State    Last Scrape
prometheus              UP       2s ago
node                    UP       5s ago
backend                 UP       3s ago
```

---

### **Step 2: Open Grafana (5 minutes)**

```
http://100.49.247.47:3000
```

**Login:** admin / admin (change password when asked)

**Import your first dashboard:**
1. Click **"+"** icon (left sidebar)
2. Click **"Import dashboard"**
3. Type: **1860**
4. Click **"Load"**
5. Select **"Prometheus"**
6. Click **"Import"**

**🎉 You now have a complete system monitoring dashboard!**

**What you'll see:**
- CPU usage graph
- Memory usage graph
- Disk usage graph
- Network traffic
- System load
- And 20+ more metrics!

**Bookmark this dashboard - it's your main monitoring page!**

---

### **Step 3: Understand What You're Looking At (3 minutes)**

**In your Grafana dashboard, look for these key metrics:**

#### **CPU Usage:**
- 🟢 0-50% = Good (system is relaxed)
- 🟡 50-80% = Moderate (system is working)
- 🔴 80-100% = High (system is stressed!)

#### **Memory Usage:**
- 🟢 0-70% = Good
- 🟡 70-85% = Moderate
- 🔴 85-100% = High (might need more RAM)

#### **Disk Usage:**
- 🟢 0-70% = Good
- 🟡 70-85% = Moderate (clean up soon)
- 🔴 85-100% = Critical (clean up NOW!)

**If all metrics are green → Everything is perfect! ✅**

---

## 🎯 **What to Do Daily (5 minutes)**

Every morning, just:

1. Open Grafana: http://100.49.247.47:3000
2. Look at Node Exporter dashboard
3. Check: CPU, Memory, Disk all green?
4. Done! ☕

**That's it! If everything is green, your system is healthy.**

---

## 📚 **Want to Learn More?**

Read these guides in order:

1. **QUICK_VERIFICATION.md** - Verify everything is working
2. **BEGINNER_GUIDE.md** - Complete walkthrough
3. **PROMETHEUS_GUIDE.md** - How to analyze Prometheus
4. **CHEAT_SHEET.md** - Quick reference

**Location:** `scripts/monitoring/`

---

## 🆘 **Something Not Working?**

### **Can't access Grafana?**
```bash
sudo systemctl status grafana-server
sudo systemctl restart grafana-server
```

### **Prometheus targets showing DOWN?**
```bash
# Check if services are running
sudo systemctl status prometheus node_exporter

# Check PM2 backend
pm2 list
pm2 start ecosystem.config.js
```

### **No data in dashboards?**
- Wait 1-2 minutes for data to collect
- Refresh the page
- Check Prometheus targets are UP

---

## 🎉 **You're Ready!**

**Next steps:**
1. ✅ Complete Step 1, 2, 3 above (10 minutes)
2. ✅ Bookmark Grafana dashboard
3. ✅ Read BEGINNER_GUIDE.md when you have time
4. ✅ Check dashboard daily (5 minutes)

**That's all you need to start monitoring your application!**

---

## 📊 **Quick Access Links**

```
Grafana:       http://100.49.247.47:3000  (Your main dashboard)
Prometheus:    http://100.49.247.47:9090  (Raw data & queries)
Alertmanager:  http://100.49.247.47:9093  (Alerts)

Email Alerts:  me01kls@gmail.com
```

---

**Happy Monitoring! 🚀📊**

**Remember:** Grafana is your friend - it makes everything visual and easy to understand!
