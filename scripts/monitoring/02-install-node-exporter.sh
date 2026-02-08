#!/bin/bash

################################################################################
# Script 2: Install Node Exporter
# Purpose: Install Node Exporter for system metrics (CPU, RAM, Disk, Network)
# Run as: sudo bash 02-install-node-exporter.sh
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Installing Node Exporter - System Metrics               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root (use sudo)${NC}"
    exit 1
fi

# Variables
NODE_EXPORTER_VERSION="1.7.0"
NODE_EXPORTER_USER="node_exporter"

# Create user
echo -e "${YELLOW}👤 Creating node_exporter user...${NC}"
id -u $NODE_EXPORTER_USER &>/dev/null || useradd --no-create-home --shell /bin/false $NODE_EXPORTER_USER

# Download
echo -e "${YELLOW}📥 Downloading Node Exporter ${NODE_EXPORTER_VERSION}...${NC}"
cd /tmp
wget -q https://github.com/prometheus/node_exporter/releases/download/v${NODE_EXPORTER_VERSION}/node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64.tar.gz
tar -xzf node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64.tar.gz

# Install
echo -e "${YELLOW}📂 Installing...${NC}"
cp node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64/node_exporter /usr/local/bin/
chown $NODE_EXPORTER_USER:$NODE_EXPORTER_USER /usr/local/bin/node_exporter

# Create systemd service
echo -e "${YELLOW}🔧 Creating systemd service...${NC}"
cat > /etc/systemd/system/node_exporter.service <<EOF
[Unit]
Description=Node Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=$NODE_EXPORTER_USER
Group=$NODE_EXPORTER_USER
Type=simple
ExecStart=/usr/local/bin/node_exporter

Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Start service
systemctl daemon-reload
systemctl enable node_exporter
systemctl start node_exporter

sleep 2

if systemctl is-active --quiet node_exporter; then
    echo -e "${GREEN}✅ Node Exporter is running${NC}"
else
    echo -e "${RED}❌ Node Exporter failed to start${NC}"
    exit 1
fi

# Cleanup
rm -rf /tmp/node_exporter-${NODE_EXPORTER_VERSION}*

# Allow port
ufw allow 9100/tcp comment 'Node Exporter'

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ✅ Node Exporter Installed Successfully!                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📊 Metrics Available:${NC}"
echo "   URL: http://localhost:9100/metrics"
echo ""
echo -e "${GREEN}🔧 Useful Commands:${NC}"
echo "   Status: sudo systemctl status node_exporter"
echo "   Restart: sudo systemctl restart node_exporter"
echo ""
echo -e "${YELLOW}📝 Next Step:${NC}"
echo "   Run: sudo bash 03-install-grafana.sh"
echo ""
