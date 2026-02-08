# ⚡ Quick Installation Guide

## 🚀 One-Command Installation

Run all scripts in sequence:

```bash
cd /opt/farmer-marketplace/scripts/monitoring

# Run all installations
sudo bash 01-install-prometheus.sh && \
sudo bash 02-install-node-exporter.sh && \
sudo bash 03-install-grafana.sh && \
sudo bash 04-install-loki.sh && \
sudo bash 05-install-promtail.sh && \
sudo bash 06-install-alertmanager.sh && \
bash 07-configure-backend-metrics.sh && \
bash 08-import-dashboards.sh
```

**Total Time**: ~30 minutes

---

## 📧 Before You Start

### Get Gmail App Password:
1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" and generate password
3. Copy the 16-character password
4. Use it when prompted by script 06

---

## ✅ After Installation

### 1. Access Grafana
```
URL: http://YOUR_EC2_IP:3000
Login: admin / admin
```

### 2. Change Admin Password
- You'll be prompted on first login
- Choose a strong password

### 3. Verify Prometheus Targets
```
URL: http://YOUR_EC2_IP:9090/targets
```
All targets should show "UP" status

### 4. Test Email Alert
```bash
curl -X POST http://localhost:9093/api/v1/alerts -d '[{
  "labels": {
    "alertname": "TestAlert",
    "severity": "warning"
  },
  "annotations": {
    "summary": "Test Alert",
    "description": "This is a test email alert"
  }
}]'
```

Check your email: me01kls@gmail.com

---

## 🎨 Grafana Dashboards

### Pre-installed:
1. **Node Exporter Full** - System metrics
2. **Prometheus Stats** - Prometheus metrics

### To Add More:
1. Go to Grafana → Dashboards → Import
2. Enter dashboard ID from https://grafana.com/grafana/dashboards/
3. Popular IDs:
   - `1860` - Node Exporter Full
   - `3662` - Prometheus 2.0 Overview
   - `13639` - Loki Dashboard

---

## 🔍 Quick Health Check

```bash
# Check all services
sudo systemctl status prometheus node_exporter grafana-server loki promtail alertmanager

# Check if metrics are being collected
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'

# Check if logs are being collected
curl http://localhost:3100/loki/api/v1/label | jq
```

---

## 🚨 Common Issues

### Port Already in Use
```bash
# Check what's using the port
sudo lsof -i :3000  # Grafana
sudo lsof -i :9090  # Prometheus
sudo lsof -i :3100  # Loki

# Kill the process
sudo kill -9 PID
```

### Service Won't Start
```bash
# Check logs
sudo journalctl -u SERVICE_NAME -n 50

# Common fixes
sudo systemctl daemon-reload
sudo systemctl restart SERVICE_NAME
```

### Email Alerts Not Working
```bash
# Check Alertmanager logs
sudo journalctl -u alertmanager -f

# Verify Gmail App Password
# Make sure 2FA is enabled on Gmail
# Regenerate App Password if needed
```

---

## 📊 What You're Monitoring

✅ **System**: CPU, RAM, Disk, Network  
✅ **Application**: API requests, errors, response times  
✅ **Database**: MongoDB connections, queries  
✅ **Logs**: Backend, PM2, Nginx, System  
✅ **Alerts**: Email notifications for critical issues  

---

## 🎯 Next Steps

1. ✅ Install monitoring stack
2. ✅ Configure email alerts
3. ✅ Import dashboards
4. 📊 Create custom dashboards
5. 🔔 Fine-tune alert thresholds
6. 📈 Monitor for 24 hours
7. 🎨 Customize to your needs

---

**Need Help?** Check `README.md` for detailed documentation.
