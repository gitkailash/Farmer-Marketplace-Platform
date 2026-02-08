#!/bin/bash

################################################################################
# Script 3: Install Grafana
# Purpose: Install Grafana for visualization and dashboards
# Run as: sudo bash 03-install-grafana.sh
################################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Installing Grafana - Dashboards & Visualization         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root (use sudo)${NC}"
    exit 1
fi

# Add Grafana repository
echo -e "${YELLOW}📦 Adding Grafana repository...${NC}"
apt-get install -y apt-transport-https software-properties-common wget
mkdir -p /etc/apt/keyrings/
wget -q -O - https://apt.grafana.com/gpg.key | gpg --dearmor | tee /etc/apt/keyrings/grafana.gpg > /dev/null
echo "deb [signed-by=/etc/apt/keyrings/grafana.gpg] https://apt.grafana.com stable main" | tee /etc/apt/sources.list.d/grafana.list

# Install Grafana
echo -e "${YELLOW}📥 Installing Grafana...${NC}"
apt-get update
apt-get install -y grafana

# Start Grafana
echo -e "${YELLOW}🚀 Starting Grafana...${NC}"
systemctl daemon-reload
systemctl enable grafana-server
systemctl start grafana-server

sleep 3

if systemctl is-active --quiet grafana-server; then
    echo -e "${GREEN}✅ Grafana is running${NC}"
else
    echo -e "${RED}❌ Grafana failed to start${NC}"
    exit 1
fi

# Allow port
ufw allow 3000/tcp comment 'Grafana'

# Configure Prometheus datasource
echo -e "${YELLOW}📝 Configuring Prometheus datasource...${NC}"
cat > /etc/grafana/provisioning/datasources/prometheus.yml <<EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://localhost:9090
    isDefault: true
    editable: true
EOF

# Configure Loki datasource (will be added after Loki installation)
cat > /etc/grafana/provisioning/datasources/loki.yml <<EOF
apiVersion: 1

datasources:
  - name: Loki
    type: loki
    access: proxy
    url: http://localhost:3100
    editable: true
EOF

# Restart to apply datasources
systemctl restart grafana-server

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ✅ Grafana Installed Successfully!                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📊 Access Grafana:${NC}"
echo "   URL: http://$(curl -s ifconfig.me):3000"
echo "   Default Login: admin / admin"
echo "   (You'll be prompted to change password on first login)"
echo ""
echo -e "${GREEN}🔧 Useful Commands:${NC}"
echo "   Status: sudo systemctl status grafana-server"
echo "   Restart: sudo systemctl restart grafana-server"
echo "   Logs: sudo journalctl -u grafana-server -f"
echo ""
echo -e "${YELLOW}📝 Next Step:${NC}"
echo "   Run: sudo bash 04-install-loki.sh"
echo ""
