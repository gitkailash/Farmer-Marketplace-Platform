#!/bin/bash

# Farmer Marketplace Platform Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-development}
COMPOSE_FILE="docker-compose.yml"

if [ "$ENVIRONMENT" = "production" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
fi

echo -e "${GREEN}🚀 Starting deployment for ${ENVIRONMENT} environment${NC}"

# Check if required files exist
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found. Please create one based on .env.${ENVIRONMENT}${NC}"
    exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
    echo -e "${RED}❌ Docker compose file ${COMPOSE_FILE} not found${NC}"
    exit 1
fi

# Pre-deployment checks
echo -e "${YELLOW}🔍 Running pre-deployment checks...${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi

# Build and test backend
echo -e "${YELLOW}🔨 Building and testing backend...${NC}"
cd backend
npm ci
npm run lint
npm run test:ci
npm run build
cd ..

# Build and test frontend
echo -e "${YELLOW}🔨 Building and testing frontend...${NC}"
cd frontend
npm ci
npm run lint
npm run type-check
npm run build:prod

# Optimize and deploy translation assets
echo -e "${YELLOW}🌐 Optimizing and deploying translation assets...${NC}"
npm run translations:deploy

cd ..

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose -f $COMPOSE_FILE down

# Build new images
echo -e "${YELLOW}🏗️ Building Docker images...${NC}"
docker-compose -f $COMPOSE_FILE build --no-cache

# Start services
echo -e "${YELLOW}🚀 Starting services...${NC}"
docker-compose -f $COMPOSE_FILE up -d

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 30

# Health checks
echo -e "${YELLOW}🏥 Running health checks...${NC}"

# Check backend health
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    docker-compose -f $COMPOSE_FILE logs backend
    exit 1
fi

# Check frontend health
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is healthy${NC}"
else
    echo -e "${RED}❌ Frontend health check failed${NC}"
    docker-compose -f $COMPOSE_FILE logs frontend
    exit 1
fi

# Check database connection
if docker-compose -f $COMPOSE_FILE exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database is healthy${NC}"
else
    echo -e "${RED}❌ Database health check failed${NC}"
    docker-compose -f $COMPOSE_FILE logs mongodb
    exit 1
fi

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}📊 Application is running at:${NC}"
echo -e "${GREEN}   Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}   Backend API: http://localhost:5000/api${NC}"
echo -e "${GREEN}   API Documentation: http://localhost:5000/api/docs/ui${NC}"
echo -e "${GREEN}   Health Check: http://localhost:5000/health${NC}"

# Show running containers
echo -e "${YELLOW}📋 Running containers:${NC}"
docker-compose -f $COMPOSE_FILE ps