# 🔍 Prometheus Analysis Guide

Simple guide to understand and use Prometheus for monitoring.

---

## 🌐 **Access Prometheus**

```
http://100.49.247.47:9090
```

---

## 📊 **Main Sections in Prometheus**

### **1. Graph Tab** (Main page)
- Where you write queries and see results
- Shows data as graphs or tables

### **2. Alerts Tab**
- Shows which alerts are active
- Shows alert rules

### **3. Status → Targets**
- **MOST IMPORTANT** - Check this first!
- Shows if Prometheus can collect data from services

---

## ✅ **Step 1: Check if Everything is Working**

### **Go to: Status → Targets**

You should see:

```
✅ prometheus (1/1 up)     - Prometheus itself
✅ node (1/1 up)           - System metrics (CPU, RAM, Disk)
✅ backend (1/1 up)        - Your application
```

**What each status means:**

🟢 **UP** = Working perfectly! Data is being collected  
🔴 **DOWN** = Problem! Not collecting data  
🟡 **UNKNOWN** = Just started, wait 1 minute  

**If anything shows DOWN:**
```bash
# Check if service is running
sudo systemctl status SERVICE_NAME

# Restart it
sudo systemctl restart SERVICE_NAME
```

---

## 📈 **Step 2: Your First Query**

### **Check CPU Usage:**

1. Go to **Graph** tab
2. In the query box, type:
   ```
   100 - (avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
   ```
3. Click **Execute**
4. Click **Graph** tab (next to Table)

**You'll see**: A line graph showing CPU usage over time

**What to look for:**
- 🟢 Line below 50% = Good
- 🟡 Line between 50-80% = Moderate
- 🔴 Line above 80% = High (investigate!)

---

## 🎯 **Step 3: Essential Queries to Try**

Copy these queries one by one into Prometheus:

### **1. Memory Usage %**
```
(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100
```
**Good**: < 85%  
**Bad**: > 90%

### **2. Disk Usage %**
```
(node_filesystem_size_bytes{mountpoint="/"} - node_filesystem_free_bytes{mountpoint="/"}) / node_filesystem_size_bytes{mountpoint="/"} * 100
```
**Good**: < 80%  
**Bad**: > 85%

### **3. System Load (1 minute)**
```
node_load1
```
**Good**: < 1.0 (for 1 CPU)  
**Bad**: > 2.0

### **4. Network Traffic (Received)**
```
rate(node_network_receive_bytes_total{device="eth0"}[5m])
```
**Shows**: Bytes per second coming in

### **5. Network Traffic (Sent)**
```
rate(node_network_transmit_bytes_total{device="eth0"}[5m])
```
**Shows**: Bytes per second going out

### **6. Disk Read Speed**
```
rate(node_disk_read_bytes_total[5m])
```
**Shows**: How fast disk is reading

### **7. Disk Write Speed**
```
rate(node_disk_written_bytes_total[5m])
```
**Shows**: How fast disk is writing

---

## 🔍 **Step 4: Analyzing Your Application**

### **Check if Backend is Running:**
```
up{job="backend"}
```
**Result:**
- `1` = Running ✅
- `0` = Down 🔴

### **API Request Rate:**
```
rate(http_requests_total[5m])
```
**Shows**: Requests per second  
**Higher = More users**

### **API Error Rate:**
```
sum(rate(http_requests_total{status=~"5.."}[5m]))
```
**Shows**: Errors per second  
**Should be**: Close to 0

### **Active Connections:**
```
active_connections
```
**Shows**: How many users connected right now

---

## 📊 **Step 5: Understanding the Graph**

### **Time Range (Top right):**
- Last 1 hour (default)
- Last 6 hours
- Last 24 hours
- Last 7 days

**Tip**: Start with 1 hour, then expand if needed

### **Graph vs Table:**
- **Graph**: See trends over time (line goes up/down)
- **Table**: See exact numbers right now

### **Multiple Lines:**
If you see multiple lines, each represents different data (like different CPU cores)

---

## 🎯 **Step 6: What to Look For**

### **Good Patterns:**

✅ **Steady lines** = Consistent performance  
✅ **Small waves** = Normal traffic variation  
✅ **Low values** = System not stressed  

### **Bad Patterns:**

🔴 **Sudden spikes** = Something happened (check logs!)  
🔴 **Constantly high** = System overloaded  
🔴 **Dropping to zero** = Service crashed  
🔴 **Sawtooth pattern** = Memory leak (restarts repeatedly)  

---

## 🚨 **Step 7: Check Alerts**

### **Go to: Alerts Tab**

You'll see alert rules like:
- HighCPUUsage
- HighMemoryUsage
- HighDiskUsage
- ServiceDown

**Alert States:**

🟢 **Inactive** = Everything OK  
🟡 **Pending** = Might trigger soon (watching)  
🔴 **Firing** = Alert is active! (you'll get email)  

**If alert is firing:**
1. Click on it to see details
2. Check what triggered it
3. Go to Grafana for visual analysis
4. Check logs in Loki
5. Fix the issue

---

## 📱 **Step 8: Daily Prometheus Check (2 minutes)**

### **Morning Routine:**

1. **Open**: `http://100.49.247.47:9090`

2. **Check Targets**: Status → Targets
   - All should be UP ✅

3. **Check Alerts**: Alerts tab
   - Should be all green (Inactive) ✅

4. **Quick CPU Check**: Run query:
   ```
   100 - (avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
   ```
   - Should be < 80% ✅

**All good? Done! ☕**

---

## 🔧 **Step 9: Troubleshooting with Prometheus**

### **Problem: Server is Slow**

**Check these queries:**

1. **CPU**:
   ```
   100 - (avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
   ```
   High? → CPU bottleneck

2. **Memory**:
   ```
   (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100
   ```
   High? → Memory bottleneck

3. **Disk I/O**:
   ```
   rate(node_disk_io_time_seconds_total[5m])
   ```
   High? → Disk bottleneck

4. **Network**:
   ```
   rate(node_network_receive_bytes_total[5m])
   ```
   Very high? → Network bottleneck

### **Problem: Application Errors**

**Check:**
```
rate(http_requests_total{status=~"5.."}[5m])
```
If high → Check backend logs in Loki

### **Problem: Service Down**

**Check:**
```
up
```
Shows which services are down (value = 0)

---

## 💡 **Step 10: Pro Tips**

### **Tip 1: Compare Time Periods**

Want to compare today vs yesterday?

1. Run query for last 24 hours
2. Look at same time yesterday
3. Compare the patterns

### **Tip 2: Use Range Selector**

In query, `[5m]` means "last 5 minutes"

You can change:
- `[1m]` = Last 1 minute (more detail)
- `[15m]` = Last 15 minutes (smoother)
- `[1h]` = Last 1 hour (very smooth)

### **Tip 3: Combine Queries**

Want total network traffic?
```
rate(node_network_receive_bytes_total[5m]) + rate(node_network_transmit_bytes_total[5m])
```

### **Tip 4: Filter by Label**

Only want specific CPU core?
```
node_cpu_seconds_total{cpu="0"}
```

---

## 📚 **Step 11: Common PromQL Functions**

### **rate()** - Rate of change
```
rate(metric[5m])
```
**Use for**: Counters (things that only go up)

### **irate()** - Instant rate
```
irate(metric[5m])
```
**Use for**: More sensitive to spikes

### **avg()** - Average
```
avg(metric)
```
**Use for**: Average across multiple items

### **sum()** - Total
```
sum(metric)
```
**Use for**: Add everything up

### **max()** - Maximum
```
max(metric)
```
**Use for**: Find highest value

### **min()** - Minimum
```
min(metric)
```
**Use for**: Find lowest value

---

## 🎯 **Quick Reference: What to Monitor**

```
┌─────────────────────────────────────────────────────┐
│  METRIC              │  QUERY                       │
├─────────────────────────────────────────────────────┤
│  CPU Usage %         │  100 - (avg(irate(node_cpu_  │
│                      │  seconds_total{mode="idle"}  │
│                      │  [5m])) * 100)               │
│                      │                              │
│  Memory Usage %      │  (node_memory_MemTotal_bytes │
│                      │  - node_memory_MemAvailable_ │
│                      │  bytes) / node_memory_Mem    │
│                      │  Total_bytes * 100           │
│                      │                              │
│  Disk Usage %        │  (node_filesystem_size_bytes │
│                      │  - node_filesystem_free_     │
│                      │  bytes) / node_filesystem_   │
│                      │  size_bytes * 100            │
│                      │                              │
│  Service Status      │  up                          │
│                      │                              │
│  API Requests/sec    │  rate(http_requests_total    │
│                      │  [5m])                       │
└─────────────────────────────────────────────────────┘
```

---

## 🆘 **Common Issues**

### **"No data points" error**
- Wait 1-2 minutes for data to collect
- Check if target is UP (Status → Targets)

### **Query returns nothing**
- Check metric name (case-sensitive!)
- Check if service is running
- Try simpler query first

### **Graph is flat/boring**
- Normal if system is idle
- Try shorter time range [1m] instead of [5m]
- Check during busy hours

---

## 🎓 **Learning Path**

**Week 1**: Learn basic queries (CPU, Memory, Disk)  
**Week 2**: Learn rate() and irate()  
**Week 3**: Learn aggregations (sum, avg, max)  
**Week 4**: Create custom queries for your app  

---

## 📖 **Want to Learn More?**

**Official PromQL Guide:**
https://prometheus.io/docs/prometheus/latest/querying/basics/

**Query Examples:**
https://prometheus.io/docs/prometheus/latest/querying/examples/

**Functions Reference:**
https://prometheus.io/docs/prometheus/latest/querying/functions/

---

## 🎯 **Summary: Your Daily Prometheus Workflow**

```
1. Open Prometheus (http://100.49.247.47:9090)
2. Check Status → Targets (all UP?)
3. Check Alerts (all green?)
4. Run CPU query (< 80%?)
5. Done! ✅

If something is wrong:
→ Check specific metric
→ Look at graph over time
→ Check logs in Loki
→ Fix the issue
```

---

**Remember**: Prometheus is just data. Grafana makes it pretty! 📊

**For visual analysis**: Use Grafana  
**For raw data & troubleshooting**: Use Prometheus  

---

**Happy Monitoring! 🎯📈**
