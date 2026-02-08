#!/bin/bash

set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Importing Grafana Dashboards                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

GRAFANA_URL="http://localhost:3000"
GRAFANA_USER="admin"

echo -e "${YELLOW}Enter Grafana admin password:${NC}"
read -sp "Password: " GRAFANA_PASSWORD
echo ""

# Test Grafana connection
if ! curl -s -u "$GRAFANA_USER:$GRAFANA_PASSWORD" "$GRAFANA_URL/api/health" > /dev/null; then
    echo -e "${RED}❌ Cannot connect to Grafana${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Connected to Grafana${NC}"
echo ""

# Import Node Exporter Full dashboard
echo -e "${YELLOW}📊 Importing Node Exporter Full dashboard...${NC}"
curl -s -u "$GRAFANA_USER:$GRAFANA_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{
    "dashboard": {
      "id": null,
      "uid": "rYdddlPWk",
      "title": "Node Exporter Full",
      "tags": ["prometheus", "node-exporter"],
      "timezone": "browser",
      "schemaVersion": 16,
      "version": 0
    },
    "folderId": 0,
    "overwrite": true
  }' \
  "$GRAFANA_URL/api/dashboards/import" > /dev/null

echo -e "${GREEN}✅ Dashboard imported${NC}"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ✅ Monitoring Stack Setup Complete!                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📊 Access Points:${NC}"
echo "   Grafana: http://$(curl -s ifconfig.me):3000"
echo "   Prometheus: http://$(curl -s ifconfig.me):9090"
echo "   Alertmanager: http://$(curl -s ifconfig.me):9093"
echo ""
echo -e "${GREEN}📧 Email Alerts:${NC}"
echo "   Configured to send to: me01kls@gmail.com"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "   1. Login to Grafana (admin / your-password)"
echo "   2. Explore pre-built dashboards"
echo "   3. Check Prometheus targets: http://YOUR_IP:9090/targets"
echo "   4. Test email alert (see README.md)"
echo ""
