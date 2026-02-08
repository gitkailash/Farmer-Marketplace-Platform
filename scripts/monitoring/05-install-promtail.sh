#!/bin/bash

set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Installing Promtail - Log Shipping                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$EUID" -ne 0 ]; then echo -e "${RED}❌ Please run as root${NC}"; exit 1; fi

PROMTAIL_VERSION="2.9.3"
cd /tmp
wget -q https://github.com/grafana/loki/releases/download/v${PROMTAIL_VERSION}/promtail-linux-amd64.zip
unzip -q promtail-linux-amd64.zip
chmod +x promtail-linux-amd64
mv promtail-linux-amd64 /usr/local/bin/promtail

mkdir -p /etc/promtail
cat > /etc/promtail/config.yml <<'EOF'
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://localhost:3100/loki/api/v1/push

scrape_configs:
  # Backend application logs
  - job_name: backend
    static_configs:
      - targets:
          - localhost
        labels:
          job: backend
          __path__: /opt/farmer-marketplace/logs/backend-*.log

  # PM2 logs
  - job_name: pm2
    static_configs:
      - targets:
          - localhost
        labels:
          job: pm2
          __path__: /root/.pm2/logs/*.log

  # Nginx logs
  - job_name: nginx
    static_configs:
      - targets:
          - localhost
        labels:
          job: nginx
          __path__: /var/log/nginx/*.log

  # System logs
  - job_name: syslog
    static_configs:
      - targets:
          - localhost
        labels:
          job: syslog
          __path__: /var/log/syslog
EOF

cat > /etc/systemd/system/promtail.service <<EOF
[Unit]
Description=Promtail Log Shipper
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/promtail -config.file=/etc/promtail/config.yml
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable promtail
systemctl start promtail
sleep 2

if systemctl is-active --quiet promtail; then
    echo -e "${GREEN}✅ Promtail is running${NC}"
else
    echo -e "${RED}❌ Promtail failed to start${NC}"
    exit 1
fi

rm -f /tmp/promtail-linux-amd64.zip

echo -e "${GREEN}✅ Promtail installed! Next: sudo bash 06-install-alertmanager.sh${NC}"
