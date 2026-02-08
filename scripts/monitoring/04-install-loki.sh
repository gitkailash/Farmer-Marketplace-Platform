#!/bin/bash

set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Installing Loki - Log Aggregation                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$EUID" -ne 0 ]; then echo -e "${RED}❌ Please run as root${NC}"; exit 1; fi

LOKI_VERSION="2.9.3"
cd /tmp
wget -q https://github.com/grafana/loki/releases/download/v${LOKI_VERSION}/loki-linux-amd64.zip
unzip -q loki-linux-amd64.zip
chmod +x loki-linux-amd64
mv loki-linux-amd64 /usr/local/bin/loki

mkdir -p /etc/loki /var/lib/loki
cat > /etc/loki/config.yml <<'EOF'
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    address: 127.0.0.1
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
  chunk_idle_period: 5m
  chunk_retain_period: 30s

schema_config:
  configs:
    - from: 2020-05-15
      store: boltdb
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 168h

storage_config:
  boltdb:
    directory: /var/lib/loki/index
  filesystem:
    directory: /var/lib/loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h

chunk_store_config:
  max_look_back_period: 0s

table_manager:
  retention_deletes_enabled: false
  retention_period: 0s
EOF

cat > /etc/systemd/system/loki.service <<EOF
[Unit]
Description=Loki Log Aggregation System
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/loki -config.file=/etc/loki/config.yml
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable loki
systemctl start loki
sleep 2

if systemctl is-active --quiet loki; then
    echo -e "${GREEN}✅ Loki is running${NC}"
else
    echo -e "${RED}❌ Loki failed to start${NC}"
    exit 1
fi

ufw allow 3100/tcp comment 'Loki'
rm -f /tmp/loki-linux-amd64.zip

echo -e "${GREEN}✅ Loki installed! Next: sudo bash 05-install-promtail.sh${NC}"
