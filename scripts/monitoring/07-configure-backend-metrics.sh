#!/bin/bash

set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Configuring Backend Metrics                              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

APP_DIR="/opt/farmer-marketplace"

echo -e "${YELLOW}📦 Installing prom-client...${NC}"
cd $APP_DIR/backend
npm install prom-client

echo -e "${YELLOW}📝 Creating metrics endpoint...${NC}"
cat > $APP_DIR/backend/src/metrics.ts <<'EOF'
import { Request, Response } from 'express';
import client from 'prom-client';

// Create a Registry
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

export const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

export const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

// Register custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeConnections);

// Metrics endpoint
export const metricsHandler = async (req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};

export { register };
EOF

echo -e "${GREEN}✅ Metrics configuration created${NC}"
echo ""
echo -e "${YELLOW}📝 Add this to your backend/src/app.ts:${NC}"
echo ""
echo "import { metricsHandler } from './metrics';"
echo "app.get('/metrics', metricsHandler);"
echo ""
echo -e "${YELLOW}🔨 Rebuild backend:${NC}"
echo "cd $APP_DIR/backend && npm run build && pm2 restart farmer-marketplace-backend"
echo ""
echo -e "${YELLOW}📝 Next: bash 08-import-dashboards.sh${NC}"
