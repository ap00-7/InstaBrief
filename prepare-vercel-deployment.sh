#!/bin/bash

# InstaBrief - Vercel Deployment Preparation Script
# This script helps prepare your project for Vercel deployment

set -e

echo "🚀 Preparing InstaBrief for Vercel Deployment"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if we're in the right directory
if [ ! -f "requirements.txt" ]; then
    echo -e "${RED}Error: requirements.txt not found. Are you in the project root?${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Project root directory confirmed${NC}"

# Step 2: Check Git status
echo ""
echo "📦 Checking Git status..."
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}⚠ Git not initialized. Initializing...${NC}"
    git init
    echo -e "${GREEN}✓ Git initialized${NC}"
else
    echo -e "${GREEN}✓ Git already initialized${NC}"
fi

# Step 3: Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    echo ""
    echo "📝 Creating .gitignore..."
    cat > .gitignore << 'EOF'
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
.venv

# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*
dist/
dist-ssr/
*.local

# Environment
.env
.env.local
.env.production
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Docker
docker-compose.override.yml

# Test
coverage/
.pytest_cache/

# Build
build/
*.egg-info/

# Backups
backups/
*.bak
EOF
    echo -e "${GREEN}✓ .gitignore created${NC}"
fi

# Step 4: Check frontend configuration
echo ""
echo "🎨 Checking frontend configuration..."
if [ -f "frontend/vercel.json" ]; then
    echo -e "${GREEN}✓ vercel.json exists${NC}"
else
    echo -e "${YELLOW}⚠ vercel.json not found (this is okay, Vercel will auto-detect)${NC}"
fi

# Step 5: Check if Vercel CLI is installed
echo ""
echo "🔧 Checking for Vercel CLI..."
if command -v vercel &> /dev/null; then
    echo -e "${GREEN}✓ Vercel CLI installed$(NC}"
    VERCEL_VERSION=$(vercel --version)
    echo "  Version: $VERCEL_VERSION"
else
    echo -e "${YELLOW}⚠ Vercel CLI not installed${NC}"
    echo "  Install with: npm i -g vercel"
fi

# Step 6: Check if Railway CLI is installed
echo ""
echo "🚂 Checking for Railway CLI..."
if command -v railway &> /dev/null; then
    echo -e "${GREEN}✓ Railway CLI installed${NC}"
    RAILWAY_VERSION=$(railway version)
    echo "  Version: $RAILWAY_VERSION"
else
    echo -e "${YELLOW}⚠ Railway CLI not installed${NC}"
    echo "  Install with: npm i -g @railway/cli"
fi

# Step 7: Check environment files
echo ""
echo "🔐 Checking environment files..."
if [ -f "frontend/.env.production.example" ]; then
    echo -e "${GREEN}✓ frontend/.env.production.example exists${NC}"
else
    echo -e "${YELLOW}⚠ Creating frontend/.env.production.example...${NC}"
    mkdir -p frontend
    echo "VITE_API_URL=https://your-backend-url.railway.app" > frontend/.env.production.example
    echo -e "${GREEN}✓ Created${NC}"
fi

if [ -f ".env.production.example" ]; then
    echo -e "${GREEN}✓ .env.production.example exists${NC}"
else
    echo -e "${YELLOW}⚠ .env.production.example not found${NC}"
fi

# Step 8: Create deployment checklist
echo ""
echo "📋 Creating deployment checklist..."
cat > DEPLOYMENT_CHECKLIST.md << 'EOF'
# Deployment Checklist

## Before Deployment

- [ ] Code pushed to GitHub
- [ ] `.gitignore` configured
- [ ] No sensitive data in repository
- [ ] All tests passing locally

## Backend (Railway)

- [ ] Railway account created
- [ ] Project connected to GitHub
- [ ] Environment variables set:
  - [ ] `MONGODB_URI`
  - [ ] `SECRET_KEY`
  - [ ] `CORS_ORIGINS`
  - [ ] `ENVIRONMENT=production`
- [ ] Backend deployed successfully
- [ ] Backend URL obtained
- [ ] Health check passing: `curl https://your-backend.railway.app/health`

## Database (MongoDB Atlas)

- [ ] MongoDB Atlas account created
- [ ] Free M0 cluster created
- [ ] Database user created
- [ ] Network access configured (0.0.0.0/0 or specific IPs)
- [ ] Connection string obtained
- [ ] Connection string added to Railway

## Frontend (Vercel)

- [ ] Vercel account created
- [ ] Project imported from GitHub
- [ ] Root directory set to `frontend`
- [ ] Environment variables set:
  - [ ] `VITE_API_URL` (your Railway backend URL)
- [ ] Build successful
- [ ] Frontend URL obtained
- [ ] Frontend loads correctly

## Post-Deployment

- [ ] CORS updated in Railway with Vercel URL
- [ ] Test document upload
- [ ] Test document summarization
- [ ] Test multilingual features
- [ ] Test audio playback
- [ ] All features working

## Optional

- [ ] Custom domain added to Vercel
- [ ] Custom domain added to Railway
- [ ] Analytics enabled
- [ ] Monitoring set up
- [ ] Demo credentials created

## Verification URLs

- Frontend: https://your-project.vercel.app
- Backend: https://your-backend.railway.app
- API Docs: https://your-backend.railway.app/docs
- Health: https://your-backend.railway.app/health
EOF

echo -e "${GREEN}✓ Deployment checklist created: DEPLOYMENT_CHECKLIST.md${NC}"

# Step 9: Final summary
echo ""
echo "=============================================="
echo -e "${GREEN}✅ Preparation Complete!${NC}"
echo "=============================================="
echo ""
echo "📚 Next Steps:"
echo "1. Review DEPLOY_VERCEL.md for detailed instructions"
echo "2. Push your code to GitHub"
echo "3. Deploy backend to Railway"
echo "4. Setup MongoDB Atlas"
echo "5. Deploy frontend to Vercel"
echo ""
echo "🔗 Helpful Commands:"
echo "  git add ."
echo "  git commit -m 'Ready for deployment'"
echo "  git push origin main"
echo ""
echo "  cd frontend && vercel --prod"
echo ""
echo "📖 Full guide: See DEPLOY_VERCEL.md"
echo ""
