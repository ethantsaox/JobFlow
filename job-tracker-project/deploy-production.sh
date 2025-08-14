#!/bin/bash
# JobFlow Production Deployment Script

set -e  # Exit on any error

echo "🚀 Starting JobFlow Production Deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if required files exist
echo "📋 Checking prerequisites..."

if [ ! -f "backend/.env.production" ]; then
    echo -e "${RED}❌ backend/.env.production not found!${NC}"
    echo "Please copy backend/.env.production.template to backend/.env.production and configure it"
    exit 1
fi

if [ ! -f "frontend/.env.production" ]; then
    echo -e "${RED}❌ frontend/.env.production not found!${NC}"
    echo "Please check frontend/.env.production configuration"
    exit 1
fi

if [ ! -f "docker-compose.production.yml" ]; then
    echo -e "${RED}❌ docker-compose.production.yml not found!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All required files found${NC}"

# Create necessary directories
echo "📁 Creating required directories..."
mkdir -p database-backups
mkdir -p ssl-certs
mkdir -p logs

# Generate secure keys if they don't exist
echo "🔐 Checking security configuration..."

# Source the production environment to check values
source backend/.env.production

if [[ "$JWT_SECRET_KEY" == *"your-super-secure-jwt-key"* ]]; then
    echo -e "${YELLOW}⚠️  Generating secure JWT secret key...${NC}"
    NEW_JWT_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
    sed -i.bak "s/JWT_SECRET_KEY=.*/JWT_SECRET_KEY=$NEW_JWT_KEY/" backend/.env.production
    echo -e "${GREEN}✅ JWT secret key generated${NC}"
fi

if [[ "$EXTENSION_SECRET" == *"your-super-secure-extension-key"* ]]; then
    echo -e "${YELLOW}⚠️  Generating secure extension secret...${NC}"
    NEW_EXT_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
    sed -i.bak "s/EXTENSION_SECRET=.*/EXTENSION_SECRET=$NEW_EXT_SECRET/" backend/.env.production
    echo -e "${GREEN}✅ Extension secret generated${NC}"
fi

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"

# Build and start production services
echo "🐳 Building and starting production services..."

# Stop any existing containers
docker-compose -f docker-compose.production.yml down

# Build images
echo "🔨 Building production images..."
docker-compose -f docker-compose.production.yml build --no-cache

# Start services
echo "🚀 Starting production services..."
docker-compose -f docker-compose.production.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Check health
echo "🏥 Checking service health..."

if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    echo "Backend logs:"
    docker-compose -f docker-compose.production.yml logs backend
    exit 1
fi

if curl -f http://localhost:80/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend health check failed, but may still be starting${NC}"
fi

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose -f docker-compose.production.yml exec backend python scripts/run_production_migrations.py

echo -e "${GREEN}🎉 Production deployment completed successfully!${NC}"
echo ""
echo "📊 Service Status:"
docker-compose -f docker-compose.production.yml ps

echo ""
echo "🔗 Access your application:"
echo "  Frontend: http://localhost"
echo "  Backend API: http://localhost:8000"
echo "  Health Check: http://localhost:8000/health"
echo "  API Metrics: http://localhost:8000/metrics"

echo ""
echo "📝 Next Steps:"
echo "  1. Configure your domain name and SSL certificates"
echo "  2. Set up your reverse proxy (nginx)"
echo "  3. Configure monitoring and alerting"
echo "  4. Set up automated backups"

echo ""
echo -e "${GREEN}🚀 JobFlow is now running in production mode!${NC}"