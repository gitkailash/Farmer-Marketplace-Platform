#!/bin/bash

set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Installing Alertmanager - Email Alerts                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$EUID" -ne 0 ]; then echo -e "${RED}❌ Please run as root${NC}"; exit 1; fi

# Get Gmail App Password
echo -e "${YELLOW}📧 Email Alert Configuration${NC}"
echo ""
echo -e "${YELLOW}You need a Gmail App Password to send email alerts.${NC}"
echo -e "${YELLOW}Get it from: https://myaccount.google.com/apppasswords${NC}"
echo ""
read -p "Enter your Gmail address [me01kls@gmail.com]: " GMAIL_USER
GMAIL_USER=${GMAIL_USER:-me01kls@gmail.com}
read -sp "Enter Gmail App Password (16 characters): " GMAIL_PASSWORD
echo ""

if [ -z "$GMAIL_PASSWORD" ]; then
    echo -e "${RED}❌ Gmail App Password is required${NC}"
    exit 1
fi

ALERTMANAGER_VERSION="0.26.0"
cd /tmp
wget -q https://github.com/prometheus/alertmanager/releases/download/v${ALERTMANAGER_VERSION}/alertmanager-${ALERTMANAGER_VERSION}.linux-amd64.tar.gz
tar -xzf alertmanager-${ALERTMANAGER_VERSION}.linux-amd64.tar.gz

mkdir -p /opt/alertmanager
cp alertmanager-${ALERTMANAGER_VERSION}.linux-amd64/alertmanager /opt/alertmanager/
cp alertmanager-${ALERTMANAGER_VERSION}.linux-amd64/amtool /opt/alertmanager/

mkdir -p /etc/alertmanager /var/lib/alertmanager

cat > /etc/alertmanager/alertmanager.yml <<EOF
global:
  resolve_timeout: 5m
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: '${GMAIL_USER}'
  smtp_auth_username: '${GMAIL_USER}'
  smtp_auth_password: '${GMAIL_PASSWORD}'
  smtp_require_tls: true

route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'email-notifications'
  routes:
    - match:
        severity: critical
      receiver: 'email-notifications'
      continue: true
    - match:
        severity: warning
      receiver: 'email-notifications'
      continue: true

receivers:
  - name: 'email-notifications'
    email_configs:
      - to: '${GMAIL_USER}'
        headers:
          Subject: '🚨 Farmer Marketplace Alert: {{ .GroupLabels.alertname }}'
        html: |
          <h2>Alert: {{ .GroupLabels.alertname }}</h2>
          <p><strong>Severity:</strong> {{ .CommonLabels.severity }}</p>
          <p><strong>Summary:</strong> {{ .CommonAnnotations.summary }}</p>
          <p><strong>Description:</strong> {{ .CommonAnnotations.description }}</p>
          <p><strong>Time:</strong> {{ .StartsAt }}</p>
          <hr>
          <p><small>Farmer Marketplace Monitoring System</small></p>

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'instance']
EOF

cat > /etc/systemd/system/alertmanager.service <<EOF
[Unit]
Description=Alertmanager
After=network.target

[Service]
Type=simple
User=root
ExecStart=/opt/alertmanager/alertmanager \\
  --config.file=/etc/alertmanager/alertmanager.yml \\
  --storage.path=/var/lib/alertmanager/ \\
  --web.listen-address=0.0.0.0:9093

Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable alertmanager
systemctl start alertmanager
sleep 2

if systemctl is-active --quiet alertmanager; then
    echo -e "${GREEN}✅ Alertmanager is running${NC}"
else
    echo -e "${RED}❌ Alertmanager failed to start${NC}"
    exit 1
fi

ufw allow 9093/tcp comment 'Alertmanager'
rm -rf /tmp/alertmanager-${ALERTMANAGER_VERSION}*

echo ""
echo -e "${GREEN}✅ Alertmanager installed!${NC}"
echo -e "${GREEN}📧 Email alerts will be sent to: ${GMAIL_USER}${NC}"
echo ""
echo -e "${YELLOW}📝 Test alert:${NC}"
echo "   curl -X POST http://localhost:9093/api/v1/alerts -d '[{\"labels\":{\"alertname\":\"TestAlert\",\"severity\":\"warning\"},\"annotations\":{\"summary\":\"Test Alert\",\"description\":\"This is a test\"}}]'"
echo ""
echo -e "${YELLOW}📝 Next: bash 07-configure-backend-metrics.sh${NC}"
