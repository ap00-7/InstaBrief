# InstaBrief Backend API Deployment Guide

## 🎯 Backend-Only FastAPI Deployment

Since you've separated the frontend, this guide focuses on deploying your FastAPI backend as a standalone API service.

## 🚀 Option 1: Railway.app (Recommended - 5 minutes)

### Prerequisites
1. GitHub account with your backend code pushed
2. MongoDB Atlas account (free tier available)

### Step 1: Set up MongoDB Atlas (Free)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account and cluster (M0 - Free tier)
3. Create database user with read/write permissions
4. Network Access: Add IP `0.0.0.0/0` (allow all) 
5. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/instabrief`

### Step 2: Deploy to Railway
1. Go to https://railway.app and sign up with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your InstaBrief backend repository
4. Railway auto-detects your `railway.toml` and `Dockerfile`

### Step 3: Set Environment Variables
In Railway dashboard → Variables tab, add:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/instabrief
SECRET_KEY=your-32-char-secret-key-here
JWT_SECRET=your-jwt-secret-key-here
ENVIRONMENT=production
CORS_ORIGINS=*
DATABASE_NAME=instabrief
PORT=8000
```

### Step 4: Generate Secure Keys
```bash
# Generate SECRET_KEY (32 characters)
python -c "import secrets; print(secrets.token_hex(32))"

# Generate JWT_SECRET (32 characters)
python -c "import secrets; print(secrets.token_hex(32))"
```

### Step 5: Deploy & Test
1. Railway automatically builds and deploys
2. Get your API URL: `https://your-project-name.railway.app`
3. Test endpoints:
   - `GET /health` - Health check
   - `GET /docs` - Interactive API docs
   - `GET /` - API info

## 🚀 Option 2: Render.com (Alternative)

1. Go to https://render.com and sign up
2. Click "New" → "Web Service"
3. Connect your GitHub repo
4. Configure:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Environment**: Add same variables as Railway
5. Deploy!

## 🚀 Option 3: DigitalOcean App Platform

1. Go to DigitalOcean → App Platform
2. Create app from GitHub repo
3. Configure:
   - **Type**: Web Service
   - **Build Command**: `pip install -r requirements.txt`
   - **Run Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables
5. Deploy!

## 🐳 Local Testing with Docker

### Backend-only Docker Compose:
```bash
# Use the backend-only compose file
docker compose -f docker-compose.backend.yml up -d --build

# Test endpoints
curl http://localhost:8000/health
curl http://localhost:8000/docs
curl http://localhost:8000/
```

### Quick local test without Docker:
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run locally
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 🔗 Frontend Integration

Once your backend is deployed:
1. Your frontend repo can call: `https://your-api-domain.com/api/`
2. Update CORS_ORIGINS with your frontend domain
3. Use the `/docs` endpoint for API documentation

## 💰 Cost Comparison

| Platform | Cost/Month | Free Tier | Best For |
|----------|------------|-----------|----------|
| **Railway** | $5-10 | 500 hours | Easiest setup |
| **Render** | $7+ | 750 hours | Good performance |
| **DigitalOcean** | $12+ | $200 credit | More control |
| **Heroku** | $7+ | None | Simple apps |

## 🔧 Troubleshooting

### Common Issues:
1. **Build fails**: Check Python 3.11 in Dockerfile
2. **Database connection**: Verify MongoDB Atlas URI and IP whitelist
3. **Memory issues**: Upgrade plan or optimize ML models
4. **CORS errors**: Update CORS_ORIGINS with frontend domain
5. **Port issues**: Ensure app binds to `0.0.0.0:$PORT`

### Debug Commands:
```bash
# Check Railway logs
railway logs

# Check Docker logs
docker compose logs -f api

# Test health endpoint
curl https://your-app.railway.app/health
```

## 🎯 Production Checklist
- [ ] MongoDB Atlas cluster created and configured
- [ ] Environment variables set in deployment platform
- [ ] Secret keys generated (32+ characters each)
- [ ] CORS configured for your frontend domain
- [ ] Health check endpoint working (`/health`)
- [ ] API documentation accessible (`/docs`)
- [ ] Custom domain configured (optional)
- [ ] Error monitoring setup (optional: Sentry)

## 🚀 Ready to Deploy!

Your FastAPI backend is now ready for production deployment. Choose Railway.app for the quickest setup, or any other platform based on your needs.

**Your API will be available at**: `https://your-project-name.platform.app`

**Key endpoints**:
- `GET /` - API information
- `GET /health` - Health check
- `GET /docs` - Interactive API documentation
- `POST /api/auth/*` - Authentication endpoints
- `POST /api/articles/*` - Article management
- `POST /api/summarize/*` - Text summarization

🎉 **Your InstaBrief API is production-ready!**
