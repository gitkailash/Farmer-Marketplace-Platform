# 🎓 Beginner's Guide to Monitoring

Complete guide for using Prometheus, Grafana, and Loki to monitor your Farmer Marketplace Platform.

---

## 📊 **Step 1: Access Grafana (Your Main Dashboard)**

### Open Grafana:
```
http://100.49.247.47:3000
```

### First Login:
- **Username**: `admin`
- **Password**: `admin`
- You'll be asked to change password - choose a strong one!

---

## 🎨 **Step 2: Import Pre-Built Dashboards**

### Import Node Exporter Dashboard (System Metrics):

1. **Click** the `+` icon on left sidebar
2. **Select** "Import dashboard"
3. **Enter Dashboard ID**: `1860`
4. **Click** "Load"
5. **Select** Prometheus as data source
6. **Click** "Import"

**What you'll see:**
- ✅ CPU usage graph
- ✅ Memory usage graph
- ✅ Disk usage graph
- ✅ Network traffic
- ✅ System load

### Import More Useful Dashboards:

**Prometheus Stats** (Dashboard ID: `3662`):
- Shows Prometheus performance
- Query statistics
- Storage usage

**Loki Dashboard** (Dashboard ID: `13639`):
- Log statistics
- Log volume over time
- Top log sources

**Note:** Since you're using MongoDB Atlas (cloud), you don't need a MongoDB dashboard here. Atlas has its own monitoring built-in.

---

## 📈 **Step 3: Understanding Your Main Dashboard**

### **System Overview Dashboard** (Node Exporter Full)

#### **Top Section - Quick Stats:**
```
┌─────────────────────────────────────────────────────┐
│  CPU Usage: 25%  │  Memory: 45%  │  Disk: 60%      │
│  Uptime: 5 days  │  Load: 0.5    │  Network: 2MB/s │
└─────────────────────────────────────────────────────┘
```

#### **What Each Metric Means:**

**CPU Usage:**
- 🟢 0-50% = Good (Normal)
- 🟡 50-80% = Moderate (Watch it)
- 🔴 80-100% = High (Problem!)

**Memory Usage:**
- 🟢 0-70% = Good
- 🟡 70-85% = Moderate
- 🔴 85-100% = High (Add more RAM or upgrade)

**Disk Usage:**
- 🟢 0-70% = Good
- 🟡 70-85% = Moderate (Clean up soon)
- 🔴 85-100% = Critical (Clean up NOW!)

**Load Average:**
- 🟢 < 1.0 = Good (for 1 CPU)
- 🟡 1.0-2.0 = Moderate
- 🔴 > 2.0 = High

---

## 🔍 **Step 4: View Logs (Loki)**

### Access Logs in Grafana:

1. **Click** "Explore" (compass icon) on left sidebar
2. **Select** "Loki" from dropdown at top
3. **Click** "Log browser" button
4. **Select** a log source:
   - `{job="backend"}` - Backend application logs
   - `{job="nginx"}` - Nginx web server logs
   - `{job="pm2"}` - PM2 process logs
   - `{job="syslog"}` - System logs

### **Search Logs:**

**Find errors:**
```
{job="backend"} |= "error"
```

**Find specific user:**
```
{job="backend"} |= "user@example.com"
```

**Find API calls:**
```
{job="nginx"} |= "/api/"
```

**Find slow queries:**
```
{job="backend"} |= "slow query"
```

### **Time Range:**
- Click the time picker (top right)
- Select: Last 5 minutes, Last 1 hour, Last 24 hours, etc.

---

## 🚨 **Step 5: Understanding Alerts**

### **Check Alert Status:**

1. Go to: `http://100.49.247.47:9093` (Alertmanager)
2. You'll see active alerts (if any)

### **Alert Colors:**

🔴 **Red (Critical):**
- Service is down
- CPU > 90%
- Memory > 95%
- Disk > 90%
- **Action**: Fix immediately!

🟡 **Yellow (Warning):**
- CPU > 80%
- Memory > 85%
- Disk > 85%
- **Action**: Investigate soon

🟢 **Green (OK):**
- Everything is normal
- **Action**: Relax! ☕

### **Email Alerts:**
You'll receive emails at **me01kls@gmail.com** when:
- Any service goes down
- CPU/Memory/Disk usage is high
- API error rate increases
- Response time is slow

---

## 📊 **Step 6: Create Your First Custom Dashboard**

### **Create Application Performance Dashboard:**

1. **Click** `+` → "Create Dashboard"
2. **Click** "Add visualization"
3. **Select** "Prometheus" data source
4. **Enter query**: `rate(http_requests_total[5m])`
5. **Set title**: "API Requests per Second"
6. **Click** "Apply"

### **Useful Queries for Your App:**

**Total API Requests:**
```
sum(rate(http_requests_total[5m]))
```

**API Error Rate:**
```
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100
```

**Response Time (95th percentile):**
```
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

**Active Connections:**
```
active_connections
```

---

## 🎯 **Step 7: Daily Monitoring Routine**

### **Morning Check (5 minutes):**

1. **Open Grafana**: `http://100.49.247.47:3000`
2. **Check Node Exporter Dashboard**:
   - ✅ CPU < 80%?
   - ✅ Memory < 85%?
   - ✅ Disk < 85%?
3. **Check Alerts**: `http://100.49.247.47:9093`
   - ✅ No active alerts?
4. **Check Email**: Any alert emails?

**If all green** → Everything is good! ✅

### **Weekly Check (15 minutes):**

1. **Review Logs**:
   - Any repeated errors?
   - Any unusual patterns?
2. **Check Disk Space Trend**:
   - Will you run out of space soon?
3. **Review Performance**:
   - Is API getting slower?
   - More errors than usual?

---

## 🔧 **Step 8: Common Tasks**

### **Task 1: Find Why Server is Slow**

1. **Open Node Exporter Dashboard**
2. **Check CPU graph** - Is it high?
3. **Check Memory graph** - Is it high?
4. **Check Disk I/O** - Is it high?
5. **Go to Logs** → Search for errors
6. **Check PM2 logs**: `{job="pm2"} |= "error"`

### **Task 2: Find API Errors**

1. **Go to Explore** → Select Loki
2. **Query**: `{job="backend"} |= "error" |= "api"`
3. **Look at timestamps** - When did errors start?
4. **Look at error messages** - What's the error?

### **Task 3: Check User Activity**

1. **Go to Explore** → Select Prometheus
2. **Query**: `rate(http_requests_total[5m])`
3. **See graph** - More users = higher line

### **Task 4: Monitor Database**

1. **Check backend logs**: `{job="backend"} |= "mongodb"`
2. **Look for**:
   - Connection errors
   - Slow queries
   - Timeout errors

---

## 📱 **Step 9: Mobile Access**

### **Access from Phone:**

1. Open browser on phone
2. Go to: `http://100.49.247.47:3000`
3. Login with your credentials
4. View dashboards (works on mobile!)

**Tip**: Bookmark it for quick access!

---

## 🎨 **Step 10: Customize Your Dashboard**

### **Add Your Business Metrics:**

**Total Users:**
```
count(users)
```

**Total Products:**
```
count(products)
```

**Orders Today:**
```
count(orders{created_at > "today"})
```

**Revenue Today:**
```
sum(orders{created_at > "today"}.total)
```

### **Create Panels:**

1. **Click** "Add panel"
2. **Select** visualization type:
   - **Graph** - For trends over time
   - **Stat** - For single numbers
   - **Gauge** - For percentages
   - **Table** - For lists
3. **Enter query**
4. **Customize colors and thresholds**
5. **Save dashboard**

---

## 🚨 **Step 11: What to Do When You Get an Alert**

### **Alert: "High CPU Usage"**

**Check:**
1. Go to Node Exporter dashboard
2. See which process is using CPU
3. Check backend logs for errors
4. Restart backend if needed: `pm2 restart farmer-marketplace-backend`

### **Alert: "Service Down"**

**Check:**
1. Which service? (Check alert email)
2. SSH into server
3. Check status: `sudo systemctl status SERVICE_NAME`
4. Restart: `sudo systemctl restart SERVICE_NAME`

### **Alert: "High Memory Usage"**

**Check:**
1. Go to Node Exporter dashboard
2. Check memory graph
3. Restart backend: `pm2 restart farmer-marketplace-backend`
4. If persists, upgrade to t2.small (2GB RAM)

### **Alert: "High Disk Usage"**

**Check:**
1. SSH into server
2. Check disk: `df -h`
3. Clean logs: `sudo journalctl --vacuum-time=7d`
4. Clean old backups: `cd /opt/farmer-marketplace/backups && ls -t | tail -n +4 | xargs rm`

---

## 📚 **Step 12: Learn More**

### **Grafana Basics:**
- **Panels**: Individual graphs/charts
- **Dashboards**: Collection of panels
- **Data Sources**: Where data comes from (Prometheus, Loki)
- **Queries**: How to ask for data

### **Prometheus Queries (PromQL):**
- `metric_name` - Get current value
- `rate(metric[5m])` - Rate of change over 5 minutes
- `sum(metric)` - Add up all values
- `avg(metric)` - Average value

### **Loki Queries (LogQL):**
- `{job="backend"}` - Get all backend logs
- `|= "error"` - Filter for "error"
- `|= "user@email.com"` - Filter for specific user
- `!= "debug"` - Exclude debug logs

---

## 🎯 **Quick Reference Card**

```
┌─────────────────────────────────────────────────────┐
│  MONITORING QUICK REFERENCE                         │
├─────────────────────────────────────────────────────┤
│  Grafana:       http://100.49.247.47:3000          │
│  Prometheus:    http://100.49.247.47:9090          │
│  Alertmanager:  http://100.49.247.47:9093          │
│                                                     │
│  Email Alerts:  me01kls@gmail.com                  │
│                                                     │
│  Good Values:                                       │
│    CPU:    < 80%                                    │
│    Memory: < 85%                                    │
│    Disk:   < 85%                                    │
│                                                     │
│  Daily Check:                                       │
│    1. Open Grafana                                  │
│    2. Check Node Exporter dashboard                 │
│    3. Check for alerts                              │
│    4. Check email                                   │
└─────────────────────────────────────────────────────┘
```

---

## 🆘 **Need Help?**

### **Common Questions:**

**Q: Dashboard shows "No data"?**
A: Wait 1-2 minutes for data to collect, or check if services are running

**Q: Can't login to Grafana?**
A: Default is admin/admin, reset with: `sudo grafana-cli admin reset-admin-password newpass`

**Q: Not receiving email alerts?**
A: Check Alertmanager logs: `sudo journalctl -u alertmanager -f`

**Q: Graphs are empty?**
A: Check Prometheus targets: `http://100.49.247.47:9090/targets` - all should be "UP"

---

## 🎉 **You're Ready!**

You now know how to:
- ✅ Access and use Grafana
- ✅ View system metrics
- ✅ Search logs
- ✅ Understand alerts
- ✅ Create custom dashboards
- ✅ Monitor your application
- ✅ Troubleshoot issues

**Start with**: Open Grafana and explore the Node Exporter dashboard!

---

**Happy Monitoring! 📊🎯**
