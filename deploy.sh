#!/bin/bash

# InstaBrief Deployment Script
# Usage: ./deploy.sh [environment]
# Example: ./deploy.sh production

set -e

ENVIRONMENT=${1:-production}
PROJECT_NAME="instabrief"

echo "🚀 Deploying InstaBrief to $ENVIRONMENT environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
    export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)
    print_success "Loaded environment variables from .env.$ENVIRONMENT"
else
    print_warning "No .env.$ENVIRONMENT file found. Using default values."
fi

# Ask for confirmation
read -p "Are you sure you want to deploy to $ENVIRONMENT? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Deployment cancelled."
    exit 1
fi

# Backup current deployment (if exists)
if [ -d "backups" ]; then
    mkdir -p backups
fi

BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S).tar.gz"
if docker compose -f docker-compose.prod.yml ps &> /dev/null; then
    print_warning "Creating backup..."
    docker compose -f docker-compose.prod.yml exec -T mongo mongodump --archive > "backups/$BACKUP_NAME" || true
    print_success "Backup created: backups/$BACKUP_NAME"
fi

# Pull latest code
if [ -d ".git" ]; then
    print_warning "Pulling latest code..."
    git pull origin main
    print_success "Code updated"
fi

# Build images
print_warning "Building Docker images..."
if [ "$ENVIRONMENT" == "production" ]; then
    docker compose -f docker-compose.prod.yml build --no-cache
else
    docker compose build --no-cache
fi
print_success "Images built successfully"

# Stop existing containers
print_warning "Stopping existing containers..."
if [ "$ENVIRONMENT" == "production" ]; then
    docker compose -f docker-compose.prod.yml down
else
    docker compose down
fi
print_success "Containers stopped"

# Start new containers
print_warning "Starting new containers..."
if [ "$ENVIRONMENT" == "production" ]; then
    docker compose -f docker-compose.prod.yml up -d
else
    docker compose up -d
fi
print_success "Containers started"

# Wait for services to be healthy
print_warning "Waiting for services to be healthy..."
sleep 10

# Health check
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:8000/health &> /dev/null; then
        print_success "Backend is healthy!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT+1))
    echo "Waiting for backend to be ready... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    print_error "Backend failed to start. Check logs with: docker compose logs api"
    exit 1
fi

# Frontend health check
if curl -f http://localhost:5173 &> /dev/null; then
    print_success "Frontend is healthy!"
else
    print_warning "Frontend might not be ready yet. Check logs with: docker compose logs frontend"
fi

# Clean up old images
print_warning "Cleaning up old Docker images..."
docker image prune -af
print_success "Cleanup complete"

# Display running containers
echo ""
echo "📦 Running containers:"
if [ "$ENVIRONMENT" == "production" ]; then
    docker compose -f docker-compose.prod.yml ps
else
    docker compose ps
fi

# Display logs
echo ""
echo "📋 Recent logs:"
if [ "$ENVIRONMENT" == "production" ]; then
    docker compose -f docker-compose.prod.yml logs --tail=20
else
    docker compose logs --tail=20
fi

# Success message
echo ""
print_success "🎉 Deployment completed successfully!"
echo ""
echo "Access your application at:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo "To view logs: docker compose logs -f"
echo "To stop:      docker compose down"
echo ""

# Optional: Send notification
if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✅ InstaBrief deployed to $ENVIRONMENT environment successfully!\"}" \
        "$SLACK_WEBHOOK_URL"
fi
