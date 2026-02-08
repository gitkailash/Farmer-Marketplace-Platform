# 🔍 Monitoring Stack Setup Guide

Complete free monitoring solution for Farmer Marketplace Platform using Prometheus, Grafana, Loki, and Alertmanager.

## 📊 Stack Overview

```
┌─────────────────────────────────────────────────────────┐
│  Monitoring Stack Components                            │
├─────────────────────────────────────────────────────────┤
│  ✅ Prometheus (Port 9090) - Metrics Collection         │
│  ✅ Grafana (Port 3000) - Dashboards & Visualization    │
│  ✅ Loki (Port 3100) - Log Aggregation                  │
│  ✅ Promtail - Log Shipping                             │
│  ✅ Node Exporter (Port 9100) - System Metrics          │
│  ✅ Alertmanager (Port 9093) - Email Alerts             │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Ubuntu 22.04 EC2 instance
- At least 2GB RAM (t2.small recommended)
- Root/sudo access
- Gmail account for email alerts

### Installation Order

Run these scripts in order:

```bash
# 1. Install Prometheus (Metrics collection)
sudo bash 01-install-prometheus.sh

# 2. Install Node Exporter (System metrics)
sudo bash 02-install-node-exporter.sh

# 3. Install Grafana (Dashboards)
sudo bash 03-install-grafana.sh

# 4. Install Loki (Log aggregation)
sudo bash 04-install-loki.sh

# 5. Install Promtail (Log shipping)
sudo bash 05-install-promtail.sh

# 6. Install Alertmanager (Email alerts)
sudo bash 06-install-alertmanager.sh

# 7. Configure backend metrics
bash 07-configure-backend-metrics.sh

# 8. Import Grafana dashboards
bash 08-import-dashboards.sh
```

**Total Setup Time**: ~30 minutes

---

## 📧 Email Alert Configuration

Before running script 6, you need Gmail App Password:

1. Go to: https://myaccount.google.com/apppasswords
2. Create app password for "Mail"
3. Copy the 16-character password
4. Use it when prompted by script 06

**Alert Email**: me01kls@gmail.com

---

## 🌐 Access URLs

After installation:

- **Grafana**: http://YOUR_EC2_IP:3000
  - Default login: admin / admin (change on first login)
  
- **Prometheus**: http://YOUR_EC2_IP:9090
  
- **Alertmanager**: http://YOUR_EC2_IP:9093

---

## 📊 What You'll Monitor

### System Metrics
- ✅ CPU usage (%)
- ✅ Memory usage (%)
- ✅ Disk usage (%)
- ✅ Network I/O
- ✅ Load average

### Application Metrics
- ✅ HTTP requests/second
- ✅ Response time (p50, p95, p99)
- ✅ Error rate (%)
- ✅ Active connections
- ✅ API endpoint performance

### Database Metrics
- ✅ MongoDB connections
- ✅ Query performance
- ✅ Operations/second

### Business Metrics
- ✅ Total users
- ✅ Total products
- ✅ Total orders
- ✅ Orders per hour

### Logs
- ✅ Backend application logs
- ✅ PM2 process logs
- ✅ Nginx access/error logs
- ✅ System logs

---

## 🚨 Alert Rules

You'll receive email alerts for:

### Critical (Immediate)
- 🔴 Service down (any component)
- 🔴 CPU > 90% for 5 minutes
- 🔴 Memory > 95%
- 🔴 Disk > 90%
- 🔴 API error rate > 5%

### Warning (15 min delay)
- 🟡 CPU > 80% for 10 minutes
- 🟡 Memory > 85%
- 🟡 Disk > 85%
- 🟡 API response time > 2 seconds
- 🟡 High database connections

---

## 🎨 Pre-built Dashboards

### 1. System Overview
- CPU, Memory, Disk, Network graphs
- System load and uptime
- Process list

### 2. Application Performance
- Request rate and response time
- Error rate and status codes
- Top endpoints by traffic
- Active users

### 3. Database Monitoring
- Connection pool usage
- Query performance
- Operations per second
- Slow queries

### 4. Business Metrics
- User registrations over time
- Products added
- Orders created
- Revenue trends

### 5. Logs Dashboard
- Real-time log streaming
- Error log filtering
- Log search and analysis

---

## 🔧 Useful Commands

### Prometheus
```bash
# Status
sudo systemctl status prometheus

# Restart
sudo systemctl restart prometheus

# Logs
sudo journalctl -u prometheus -f

# Check config
/opt/prometheus/promtool check config /etc/prometheus/prometheus.yml
```

### Grafana
```bash
# Status
sudo systemctl status grafana-server

# Restart
sudo systemctl restart grafana-server

# Logs
sudo journalctl -u grafana-server -f

# Reset admin password
sudo grafana-cli admin reset-admin-password newpassword
```

### Loki
```bash
# Status
sudo systemctl status loki

# Restart
sudo systemctl restart loki

# Logs
sudo journalctl -u loki -f
```

### Alertmanager
```bash
# Status
sudo systemctl status alertmanager

# Restart
sudo systemctl restart alertmanager

# Test email
curl -X POST http://localhost:9093/api/v1/alerts -d '[{"labels":{"alertname":"TestAlert"}}]'
```

---

## 🔍 Troubleshooting

### Prometheus not scraping metrics
```bash
# Check targets
curl http://localhost:9090/api/v1/targets

# Check if services are running
sudo systemctl status node_exporter
sudo systemctl status prometheus
```

### Grafana can't connect to Prometheus
```bash
# Test Prometheus from Grafana server
curl http://localhost:9090/api/v1/query?query=up

# Check Grafana logs
sudo journalctl -u grafana-server -n 100
```

### Not receiving email alerts
```bash
# Check Alertmanager logs
sudo journalctl -u alertmanager -f

# Test SMTP connection
telnet smtp.gmail.com 587

# Verify alertmanager config
/opt/alertmanager/amtool check-config /etc/alertmanager/alertmanager.yml
```

### High resource usage
```bash
# Check Prometheus storage
du -sh /var/lib/prometheus

# Reduce retention (default 15 days)
# Edit /etc/systemd/system/prometheus.service
# Add: --storage.tsdb.retention.time=7d

# Restart
sudo systemctl daemon-reload
sudo systemctl restart prometheus
```

---

## 📈 Resource Usage

Expected resource consumption:

| Component | CPU | RAM | Disk |
|-----------|-----|-----|------|
| Prometheus | 5-10% | 200MB | 1GB/day |
| Grafana | 2-5% | 100MB | 50MB |
| Loki | 3-8% | 150MB | 500MB/day |
| Promtail | 1-2% | 50MB | Minimal |
| Node Exporter | <1% | 20MB | Minimal |
| Alertmanager | <1% | 30MB | Minimal |
| **Total** | **15-25%** | **~550MB** | **~1.5GB/day** |

**Recommendation**: Use t2.small (2GB RAM) or add swap space on t2.micro

---

## 🔐 Security Best Practices

### 1. Firewall Rules
```bash
# Only allow monitoring ports from your IP
sudo ufw allow from YOUR_IP to any port 3000  # Grafana
sudo ufw allow from YOUR_IP to any port 9090  # Prometheus
sudo ufw allow from YOUR_IP to any port 9093  # Alertmanager
```

### 2. Change Default Passwords
- Grafana: Change admin password on first login
- Add authentication to Prometheus (optional)

### 3. Use HTTPS
- Setup SSL for Grafana (optional, see script 09)

---

## 📚 Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/)
- [PromQL Tutorial](https://prometheus.io/docs/prometheus/latest/querying/basics/)

---

## 🆘 Support

If you encounter issues:
1. Check logs: `sudo journalctl -u SERVICE_NAME -f`
2. Verify service status: `sudo systemctl status SERVICE_NAME`
3. Check firewall: `sudo ufw status`
4. Review configuration files in `/etc/`

---

**Created by**: Kailash Yadav  
**Project**: Farmer Marketplace Platform  
**Date**: February 2026
