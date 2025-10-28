# InstaBrief Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables
Create a `.env.production` file with:

```env
# Backend
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/instabrief
SECRET_KEY=your-super-secret-key-here-min-32-chars
CORS_ORIGINS=https://your-frontend-domain.com

# Frontend
VITE_API_URL=https://your-backend-domain.com/api

# Optional: External APIs
GOOGLE_TRANSLATE_API_KEY=your-key-here
```

### 2. Security Hardening

**Backend (app/main.py)**:
- [ ] Enable CORS only for your frontend domain
- [ ] Set secure SECRET_KEY (use: `openssl rand -hex 32`)
- [ ] Enable HTTPS only
- [ ] Add rate limiting
- [ ] Remove debug endpoints
- [ ] Set up proper authentication

**Frontend**:
- [ ] Remove console.logs in production
- [ ] Enable production build optimizations
- [ ] Set up CSP headers

### 3. Database Setup

**MongoDB Atlas (Recommended)**:
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create free M0 cluster or paid cluster
3. Add IP whitelist (0.0.0.0/0 for cloud or specific IPs)
4. Create database user
5. Get connection string
6. Update MONGODB_URI in environment

### 4. Performance Optimizations

**Backend**:
```python
# Add to main.py
from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add caching
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
```

**Frontend**:
```bash
# Build with optimizations
npm run build
```

### 5. Monitoring & Logging

**Recommended Tools**:
- Sentry (Error tracking)
- LogRocket (Session replay)
- Google Analytics
- Uptime Robot (Monitoring)

---

## Deployment Options

### Option 1: DigitalOcean (Recommended for Most Cases)

#### Step 1: Create Droplet
```bash
# Choose: Ubuntu 22.04, 4GB RAM, $24/month
# Enable: Monitoring, IPv6, User data
```

#### Step 2: Setup Server
```bash
# SSH into droplet
ssh root@your-droplet-ip

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt-get update
apt-get install docker-compose-plugin

# Install Nginx
apt-get install nginx certbot python3-certbot-nginx
```

#### Step 3: Clone & Configure
```bash
# Clone repository
git clone https://github.com/yourusername/InstaBrief.git
cd InstaBrief

# Create production env file
nano .env.production
# Add your environment variables

# Update docker-compose for production
nano docker-compose.prod.yml
```

#### Step 4: Configure Nginx
```nginx
# /etc/nginx/sites-available/instabrief

server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/instabrief /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Get SSL certificates
certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

#### Step 5: Deploy
```bash
# Build and start services
docker compose -f docker-compose.prod.yml up -d --build

# Check logs
docker compose logs -f

# Set up auto-start on reboot
systemctl enable docker
```

#### Step 6: CI/CD with GitHub Actions
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to DigitalOcean

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.DROPLET_IP }}
          username: root
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /root/InstaBrief
            git pull origin main
            docker compose -f docker-compose.prod.yml up -d --build
```

---

### Option 2: Railway.app (Fastest)

#### Step 1: Prepare Repository
```bash
# Create railway.json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### Step 2: Deploy
1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway auto-detects docker-compose
5. Add environment variables in dashboard
6. Deploy!

#### Step 3: Add Domain
1. Go to project settings
2. Add custom domain or use Railway domain
3. SSL is automatic

---

### Option 3: AWS (Enterprise Grade)

#### Architecture:
```
Route 53 (DNS)
  ↓
CloudFront (CDN) → S3 (Frontend)
  ↓
ALB (Load Balancer)
  ↓
ECS Fargate (Backend Containers)
  ↓
MongoDB Atlas / DocumentDB
```

#### Deployment Steps:
1. **Frontend**: Build and upload to S3, configure CloudFront
2. **Backend**: Push to ECR, deploy to ECS Fargate
3. **Database**: Set up MongoDB Atlas or DocumentDB
4. **Networking**: Configure VPC, Security Groups, ALB

---

## Production docker-compose.yml

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  api:
    build: .
    container_name: instabrief-api-prod
    restart: always
    environment:
      - MONGODB_URI=${MONGODB_URI}
      - SECRET_KEY=${SECRET_KEY}
      - ENVIRONMENT=production
    ports:
      - "8000:8000"
    depends_on:
      - mongo
    networks:
      - instabrief-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: instabrief-frontend-prod
    restart: always
    environment:
      - VITE_API_URL=${VITE_API_URL}
    ports:
      - "5173:80"
    networks:
      - instabrief-network

  mongo:
    image: mongo:latest
    container_name: instabrief-mongo-prod
    restart: always
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_USERNAME}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}
    volumes:
      - mongo-data-prod:/data/db
    networks:
      - instabrief-network
    ports:
      - "27017:27017"

networks:
  instabrief-network:
    driver: bridge

volumes:
  mongo-data-prod:
```

---

## Cost Comparison

| Platform | Frontend | Backend | Database | Total/Month |
|----------|----------|---------|----------|-------------|
| **Railway.app** | Included | $10-20 | Atlas Free | $10-20 |
| **Render** | $7 | $7-25 | Atlas Free | $14-32 |
| **DigitalOcean** | $5 | $24 | $15 | $44 |
| **AWS** | $5 | $30-50 | $57 | $92-112 |
| **Vercel + Railway** | Free | $10-20 | Atlas Free | $10-20 |

---

## Monitoring Setup

### 1. Add Health Checks
```python
# app/main.py
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "database": await check_db_connection()
    }
```

### 2. Set Up Sentry (Error Tracking)
```bash
pip install sentry-sdk[fastapi]
```

```python
import sentry_sdk
sentry_sdk.init(dsn="your-sentry-dsn")
```

### 3. Add Analytics
```jsx
// Frontend - Google Analytics
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
```

---

## Recommended: Quick Start with Railway + Vercel

**Total Cost: $0-15/month**

### Backend (Railway):
```bash
# Push to GitHub
git push origin main

# On Railway:
1. Import from GitHub
2. Add environment variables
3. Deploy (automatic)
```

### Frontend (Vercel):
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

This gives you:
- ✅ Auto-deployments on git push
- ✅ Free SSL certificates
- ✅ Global CDN
- ✅ Preview deployments
- ✅ Easy rollbacks

---

## Need Help?

Common issues and solutions:
1. **Out of memory**: Upgrade server or optimize ML models
2. **Slow performance**: Add Redis caching, CDN
3. **Database errors**: Check connection string, whitelist IPs
4. **CORS errors**: Update CORS_ORIGINS in backend

For production support, consider:
- AWS Support Plan
- MongoDB Atlas Support
- Hiring DevOps consultant
