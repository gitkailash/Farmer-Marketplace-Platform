# 📋 Monitoring Cheat Sheet

Quick reference for daily monitoring tasks.

---

## 🌐 **Access URLs**

```
Grafana:       http://100.49.247.47:3000  (admin/your-password)
Prometheus:    http://100.49.247.47:9090
Alertmanager:  http://100.49.247.47:9093
```

---

## 🎯 **Daily 5-Minute Check**

```
1. Open Grafana → Node Exporter Dashboard
2. Check: CPU < 80% ✅  Memory < 85% ✅  Disk < 85% ✅
3. Open Alertmanager → No active alerts ✅
4. Check email → No alert emails ✅
```

**All green? You're good to go! ☕**

---

## 📊 **Dashboard IDs to Import**

```
1860  - Node Exporter Full (System metrics) ⭐ MUST HAVE
3662  - Prometheus Stats
13639 - Loki Dashboard (Logs)
7362  - MongoDB Exporter
```

**How to import:**
Grafana → + → Import → Enter ID → Load → Select Prometheus → Import

---

## 🔍 **Useful Log Queries**

```
Backend errors:
{job="backend"} |= "error"

Nginx errors:
{job="nginx"} |= "error"

Find specific user:
{job="backend"} |= "user@email.com"

API calls:
{job="nginx"} |= "/api/"

Last 5 minutes:
{job="backend"} [5m]
```

---

## 📈 **Useful Prometheus Queries**

```
API Requests/sec:
rate(http_requests_total[5m])

Error Rate %:
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100

Response Time (95th):
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

CPU Usage %:
100 - (avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

Memory Usage %:
(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100

Disk Usage %:
(node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes * 100
```

---

## 🚨 **Alert Thresholds**

```
🔴 CRITICAL (Fix NOW):
   CPU > 90%
   Memory > 95%
   Disk > 90%
   Service Down
   API Error Rate > 5%

🟡 WARNING (Check Soon):
   CPU > 80%
   Memory > 85%
   Disk > 85%
   API Response > 2s
```

---

## 🔧 **Quick Fixes**

### **High CPU:**
```bash
pm2 restart farmer-marketplace-backend
```

### **High Memory:**
```bash
pm2 restart farmer-marketplace-backend
# Or upgrade to t2.small
```

### **High Disk:**
```bash
# Clean logs
sudo journalctl --vacuum-time=7d

# Clean old backups
cd /opt/farmer-marketplace/backups
ls -t | tail -n +4 | xargs rm
```

### **Service Down:**
```bash
# Check status
sudo systemctl status SERVICE_NAME

# Restart
sudo systemctl restart SERVICE_NAME
```

---

## 🛠️ **Service Management**

```bash
# Check all monitoring services
sudo systemctl status prometheus node_exporter grafana-server loki promtail alertmanager

# Restart a service
sudo systemctl restart SERVICE_NAME

# View logs
sudo journalctl -u SERVICE_NAME -f

# PM2 commands
pm2 list
pm2 logs farmer-marketplace-backend
pm2 restart farmer-marketplace-backend
```

---

## 📧 **Email Alerts**

**Configured for:** me01kls@gmail.com

**Test alert:**
```bash
curl -X POST http://localhost:9093/api/v1/alerts -d '[{
  "labels": {"alertname": "TestAlert", "severity": "warning"},
  "annotations": {"summary": "Test", "description": "Test alert"}
}]'
```

---

## 🎨 **Grafana Tips**

```
Add Panel:        Dashboard → Add → Visualization
Time Range:       Top right corner → Select range
Refresh:          Top right → Auto-refresh dropdown
Share Dashboard:  Dashboard → Share → Snapshot
Export Dashboard: Dashboard → Settings → JSON Model
```

---

## 🔍 **Troubleshooting**

### **No Data in Grafana:**
```bash
# Check Prometheus targets
http://100.49.247.47:9090/targets
# All should show "UP"

# Check if services are running
sudo systemctl status prometheus node_exporter
```

### **Can't Access Grafana:**
```bash
# Check if running
sudo systemctl status grafana-server

# Check firewall
sudo ufw status | grep 3000

# Reset password
sudo grafana-cli admin reset-admin-password newpassword
```

### **No Email Alerts:**
```bash
# Check Alertmanager
sudo journalctl -u alertmanager -f

# Verify config
cat /etc/alertmanager/alertmanager.yml

# Test SMTP
telnet smtp.gmail.com 587
```

---

## 📱 **Mobile Access**

```
1. Open phone browser
2. Go to: http://100.49.247.47:3000
3. Login
4. Bookmark for quick access
```

---

## 🎯 **Best Practices**

```
✅ Check dashboards daily (5 min)
✅ Review logs weekly (15 min)
✅ Test alerts monthly
✅ Keep disk usage < 80%
✅ Backup Grafana dashboards
✅ Document custom queries
✅ Set up mobile access
```

---

## 📊 **Healthy System Values**

```
CPU:           < 50% (normal), < 80% (acceptable)
Memory:        < 70% (normal), < 85% (acceptable)
Disk:          < 70% (normal), < 85% (acceptable)
Load Average:  < 1.0 (for 1 CPU)
API Response:  < 500ms (fast), < 2s (acceptable)
Error Rate:    < 1% (good), < 5% (acceptable)
```

---

## 🆘 **Emergency Contacts**

```
Developer:     Kailash Yadav
Email:         me01kls@gmail.com
Documentation: /opt/farmer-marketplace/scripts/monitoring/
```

---

## 📚 **Learn More**

```
Grafana Docs:     https://grafana.com/docs/
Prometheus Docs:  https://prometheus.io/docs/
Loki Docs:        https://grafana.com/docs/loki/
PromQL Tutorial:  https://prometheus.io/docs/prometheus/latest/querying/basics/
```

---

**Print this and keep it handy! 📋✨**
