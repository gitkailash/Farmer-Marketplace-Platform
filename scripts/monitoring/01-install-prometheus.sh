#!/bin/bash

################################################################################
# Script 1: Install Prometheus
# Purpose: Install and configure Prometheus for metrics collection
# Run as: sudo bash 01-install-prometheus.sh
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Installing Prometheus - Metrics Collection              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root (use sudo)${NC}"
    exit 1
fi

# Variables
PROMETHEUS_VERSION="2.48.0"
PROMETHEUS_USER="prometheus"
PROMETHEUS_DIR="/opt/prometheus"

# Create prometheus user
echo -e "${YELLOW}👤 Creating prometheus user...${NC}"
id -u $PROMETHEUS_USER &>/dev/null || useradd --no-create-home --shell /bin/false $PROMETHEUS_USER
echo -e "${GREEN}✅ User created${NC}"

# Download Prometheus
echo -e "${YELLOW}📥 Downloading Prometheus ${PROMETHEUS_VERSION}...${NC}"
cd /tmp
wget -q https://github.com/prometheus/prometheus/releases/download/v${PROMETHEUS_VERSION}/prometheus-${PROMETHEUS_VERSION}.linux-amd64.tar.gz
echo -e "${GREEN}✅ Downloaded${NC}"

# Extract
echo -e "${YELLOW}📦 Extracting...${NC}"
tar -xzf prometheus-${PROMETHEUS_VERSION}.linux-amd64.tar.gz

# Install
echo -e "${YELLOW}📂 Installing to ${PROMETHEUS_DIR}...${NC}"
mkdir -p $PROMETHEUS_DIR
cp prometheus-${PROMETHEUS_VERSION}.linux-amd64/prometheus $PROMETHEUS_DIR/
cp prometheus-${PROMETHEUS_VERSION}.linux-amd64/promtool $PROMETHEUS_DIR/
cp -r prometheus-${PROMETHEUS_VERSION}.linux-amd64/consoles $PROMETHEUS_DIR/
cp -r prometheus-${PROMETHEUS_VERSION}.linux-amd64/console_libraries $PROMETHEUS_DIR/

# Create directories
mkdir -p /etc/prometheus
mkdir -p /var/lib/prometheus

# Create configuration
echo -e "${YELLOW}📝 Creating Prometheus configuration...${NC}"
cat > /etc/prometheus/prometheus.yml <<'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    monitor: 'farmer-marketplace'
    environment: 'production'

# Alertmanager configuration
alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - localhost:9093

# Load rules
rule_files:
  - "alerts.yml"

# Scrape configurations
scrape_configs:
  # Prometheus itself
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # Node Exporter (System metrics)
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']

  # Backend API metrics
  - job_name: 'backend'
    static_configs:
      - targets: ['localhost:5000']
    metrics_path: '/metrics'
EOF

# Create alert rules
cat > /etc/prometheus/alerts.yml <<'EOF'
groups:
  - name: system_alerts
    interval: 30s
    rules:
      # High CPU usage
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.instance }}"
          description: "CPU usage is above 80% for 10 minutes (current: {{ $value | humanize }}%)"

      - alert: CriticalCPUUsage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 90
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Critical CPU usage on {{ $labels.instance }}"
          description: "CPU usage is above 90% (current: {{ $value | humanize }}%)"

      # High Memory usage
      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 85
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"
          description: "Memory usage is above 85% (current: {{ $value | humanize }}%)"

      - alert: CriticalMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 95
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Critical memory usage on {{ $labels.instance }}"
          description: "Memory usage is above 95% (current: {{ $value | humanize }}%)"

      # High Disk usage
      - alert: HighDiskUsage
        expr: (node_filesystem_size_bytes{mountpoint="/"} - node_filesystem_free_bytes{mountpoint="/"}) / node_filesystem_size_bytes{mountpoint="/"} * 100 > 85
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High disk usage on {{ $labels.instance }}"
          description: "Disk usage is above 85% (current: {{ $value | humanize }}%)"

      - alert: CriticalDiskUsage
        expr: (node_filesystem_size_bytes{mountpoint="/"} - node_filesystem_free_bytes{mountpoint="/"}) / node_filesystem_size_bytes{mountpoint="/"} * 100 > 90
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Critical disk usage on {{ $labels.instance }}"
          description: "Disk usage is above 90% (current: {{ $value | humanize }}%)"

  - name: service_alerts
    interval: 30s
    rules:
      # Service down
      - alert: ServiceDown
        expr: up == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.job }} is down"
          description: "{{ $labels.instance }} of job {{ $labels.job }} has been down for more than 2 minutes"

      # High API error rate
      - alert: HighAPIErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High API error rate"
          description: "API error rate is above 5%"

      # Slow API response
      - alert: SlowAPIResponse
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Slow API response time"
          description: "95th percentile response time is above 2 seconds"
EOF

# Set permissions
chown -R $PROMETHEUS_USER:$PROMETHEUS_USER $PROMETHEUS_DIR
chown -R $PROMETHEUS_USER:$PROMETHEUS_USER /etc/prometheus
chown -R $PROMETHEUS_USER:$PROMETHEUS_USER /var/lib/prometheus

# Create systemd service
echo -e "${YELLOW}🔧 Creating systemd service...${NC}"
cat > /etc/systemd/system/prometheus.service <<EOF
[Unit]
Description=Prometheus Monitoring System
Documentation=https://prometheus.io/docs/
Wants=network-online.target
After=network-online.target

[Service]
User=$PROMETHEUS_USER
Group=$PROMETHEUS_USER
Type=simple
ExecStart=$PROMETHEUS_DIR/prometheus \\
  --config.file=/etc/prometheus/prometheus.yml \\
  --storage.tsdb.path=/var/lib/prometheus/ \\
  --web.console.templates=$PROMETHEUS_DIR/consoles \\
  --web.console.libraries=$PROMETHEUS_DIR/console_libraries \\
  --web.listen-address=0.0.0.0:9090 \\
  --storage.tsdb.retention.time=15d

Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and start Prometheus
systemctl daemon-reload
systemctl enable prometheus
systemctl start prometheus

# Wait for service to start
sleep 3

# Check if running
if systemctl is-active --quiet prometheus; then
    echo -e "${GREEN}✅ Prometheus is running${NC}"
else
    echo -e "${RED}❌ Prometheus failed to start${NC}"
    echo -e "${YELLOW}Check logs: sudo journalctl -u prometheus -n 50${NC}"
    exit 1
fi

# Cleanup
rm -rf /tmp/prometheus-${PROMETHEUS_VERSION}.linux-amd64*

# Allow port in firewall
ufw allow 9090/tcp comment 'Prometheus'

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ✅ Prometheus Installed Successfully!                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📊 Access Prometheus:${NC}"
echo "   URL: http://$(curl -s ifconfig.me):9090"
echo ""
echo -e "${GREEN}📝 Configuration:${NC}"
echo "   Config: /etc/prometheus/prometheus.yml"
echo "   Alerts: /etc/prometheus/alerts.yml"
echo "   Data: /var/lib/prometheus/"
echo ""
echo -e "${GREEN}🔧 Useful Commands:${NC}"
echo "   Status: sudo systemctl status prometheus"
echo "   Restart: sudo systemctl restart prometheus"
echo "   Logs: sudo journalctl -u prometheus -f"
echo ""
echo -e "${YELLOW}📝 Next Step:${NC}"
echo "   Run: sudo bash 02-install-node-exporter.sh"
echo ""
