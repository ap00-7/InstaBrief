# Deploying InstaBrief to Vercel

## 🎯 Deployment Strategy

Since InstaBrief has both frontend (React) and backend (FastAPI), we'll use a **hybrid approach**:

```
Frontend → Vercel (Free)
Backend  → Railway/Render (Free tier available)
Database → MongoDB Atlas (Free M0 tier)
```

**Why this approach?**
- ✅ Vercel excels at frontend hosting (free, fast, global CDN)
- ✅ FastAPI needs a Python runtime (Vercel Serverless Functions have limitations)
- ✅ MongoDB Atlas provides free cloud database
- ✅ Total cost: $0-10/month

---

## 📋 Prerequisites

1. **GitHub Account** - Your code must be on GitHub
2. **Vercel Account** - Sign up at https://vercel.com
3. **MongoDB Atlas Account** - Sign up at https://mongodb.com/cloud/atlas
4. **Railway/Render Account** - For backend hosting

---

## 🔧 Step-by-Step Deployment

### **Step 1: Prepare Your Repository**

#### 1.1 Push to GitHub
```bash
cd "C:\Users\Akash Paul\OneDrive\Desktop\InstaBrief\InstaBrief"

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Prepare for Vercel deployment"

# Create GitHub repo and push
# (Create repo on GitHub first, then:)
git remote add origin https://github.com/YOUR_USERNAME/InstaBrief.git
git branch -M main
git push -u origin main
```

#### 1.2 Create Frontend Environment File

Create `frontend/.env.production`:
```env
VITE_API_URL=https://your-backend.railway.app
```

---

### **Step 2: Deploy Backend to Railway** ⚡

Railway is perfect for FastAPI and includes free tier.

#### 2.1 Sign Up
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project"

#### 2.2 Deploy Backend
1. Click "Deploy from GitHub repo"
2. Select your `InstaBrief` repository
3. Railway will auto-detect Docker
4. Add environment variables:
   ```
   MONGODB_URI=your-mongodb-atlas-uri
   SECRET_KEY=your-secret-key-here
   CORS_ORIGINS=https://your-frontend.vercel.app
   ENVIRONMENT=production
   ```

#### 2.3 Get Backend URL
1. Go to your Railway project
2. Click on the service
3. Go to "Settings" → "Networking"
4. Copy the public URL (e.g., `https://instabrief-production.up.railway.app`)
5. **Save this URL** - you'll need it for frontend

---

### **Step 3: Setup MongoDB Atlas** 🍃

#### 3.1 Create Cluster
1. Go to https://mongodb.com/cloud/atlas
2. Sign up / Log in
3. Click "Build a Database"
4. Choose **FREE M0** tier
5. Select your region (closest to your users)
6. Name your cluster: `instabrief-cluster`

#### 3.2 Create Database User
1. Go to "Database Access"
2. Click "Add New Database User"
3. Create username and password
4. Grant "Read and write to any database"
5. **Save credentials securely**

#### 3.3 Configure Network Access
1. Go to "Network Access"
2. Click "Add IP Address"
3. Choose "Allow Access from Anywhere" (0.0.0.0/0)
4. Or add Railway's IP addresses

#### 3.4 Get Connection String
1. Go to "Database" → Click "Connect"
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your actual password
5. Replace `myFirstDatabase` with `instabrief`

Example:
```
mongodb+srv://username:password@cluster.mongodb.net/instabrief?retryWrites=true&w=majority
```

#### 3.5 Update Railway
1. Go back to Railway
2. Add environment variable:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/instabrief
   ```

---

### **Step 4: Deploy Frontend to Vercel** 🔺

#### 4.1 Update Frontend Configuration

Create `frontend/vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### 4.2 Update API URL

Create `frontend/.env.production`:
```env
VITE_API_URL=https://your-backend.railway.app
```

Replace with your actual Railway backend URL from Step 2.3.

#### 4.3 Deploy to Vercel

**Option A: Via Vercel Dashboard**
1. Go to https://vercel.com/new
2. Click "Import Project"
3. Select your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variables:
   ```
   VITE_API_URL=https://your-backend.railway.app
   ```
6. Click "Deploy"

**Option B: Via Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend
cd frontend

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name? instabrief
# - Directory? ./
# - Override settings? No

# Deploy to production
vercel --prod
```

#### 4.4 Get Frontend URL
Vercel will provide a URL like:
```
https://instabrief.vercel.app
```

---

### **Step 5: Update CORS Settings** 🔒

#### 5.1 Update Backend CORS
Go to Railway → Your Project → Variables

Update `CORS_ORIGINS`:
```
CORS_ORIGINS=https://instabrief.vercel.app,https://www.instabrief.vercel.app
```

#### 5.2 Redeploy Backend
Railway will automatically redeploy with new settings.

---

### **Step 6: Custom Domain (Optional)** 🌐

#### 6.1 Add Domain to Vercel
1. Go to Vercel Dashboard → Your Project
2. Click "Settings" → "Domains"
3. Add your custom domain (e.g., `instabrief.com`)
4. Follow DNS configuration instructions
5. Vercel provides free SSL certificates

#### 6.2 Update CORS
Add your custom domain to Railway's CORS_ORIGINS:
```
CORS_ORIGINS=https://instabrief.com,https://www.instabrief.com,https://instabrief.vercel.app
```

---

## 🧪 Testing Your Deployment

### Test Checklist

1. **Frontend Loads**
   - Visit your Vercel URL
   - Check console for errors (F12)

2. **Backend Connection**
   - Try uploading a document
   - Check if summaries generate

3. **Database Connection**
   - Documents should save
   - History should persist

4. **API Calls**
   - Open Network tab (F12)
   - Check API calls go to Railway URL

### Common Issues

#### Issue 1: CORS Error
```
Error: Access to XMLHttpRequest blocked by CORS policy
```

**Solution**: Update `CORS_ORIGINS` in Railway to include your Vercel URL.

#### Issue 2: API Not Found
```
Error: Failed to fetch
```

**Solution**: Check `VITE_API_URL` in Vercel environment variables.

#### Issue 3: MongoDB Connection Failed
```
Error: MongoServerError
```

**Solution**: 
- Check MongoDB Atlas IP whitelist
- Verify connection string format
- Ensure password is URL-encoded

---

## 💰 Cost Breakdown

| Service | Free Tier | Paid Plan Starts |
|---------|-----------|------------------|
| **Vercel** | ✅ 100GB bandwidth/month | $20/month (Pro) |
| **Railway** | ✅ $5 credit/month | $5/month (pay-as-you-go) |
| **MongoDB Atlas** | ✅ 512MB storage | $9/month (M2) |
| **Total** | **$0-5/month** | $34/month |

**Free tier is sufficient for:**
- Academic projects
- Portfolio demos
- Small-scale apps (< 1000 users)

---

## 📁 Project Structure for Vercel

```
InstaBrief/
├── frontend/              # Deploys to Vercel
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   ├── vercel.json       # Vercel config
│   └── .env.production   # Production env vars
├── app/                  # Deploys to Railway
├── requirements.txt      # Railway uses this
├── Dockerfile           # Railway uses this
└── docker-compose.yml   # Not used in production
```

---

## 🚀 Continuous Deployment

### Automatic Deployments

**Vercel**: Auto-deploys on git push to `main` branch
**Railway**: Auto-deploys on git push to `main` branch

### Setup

1. **Vercel**:
   - Already configured after initial deploy
   - Push to GitHub → Automatic deployment

2. **Railway**:
   - Go to Settings → "Connect to GitHub"
   - Select branch to deploy from (`main`)
   - Enable auto-deploy

### Deploy Specific Branches

**Preview Deployments** (Vercel):
- Every PR gets a preview URL
- Test before merging to main

**Branch Deployments** (Railway):
- Create separate services for dev/staging
- Each service deploys from different branch

---

## 🔧 Alternative: Deploy Backend to Render

If you prefer Render over Railway:

### Render Setup

1. Go to https://render.com
2. Click "New" → "Web Service"
3. Connect GitHub repository
4. Configure:
   ```
   Name: instabrief-api
   Runtime: Docker
   Branch: main
   Instance Type: Free
   ```
5. Add environment variables (same as Railway)
6. Deploy

**Render Free Tier**:
- Spins down after 15 minutes of inactivity
- Takes ~30 seconds to wake up
- 750 hours/month free

---

## 🎯 Alternative: Vercel Serverless Functions

**⚠️ Advanced Option**: Convert FastAPI to Vercel Serverless Functions

### Limitations
- Cold starts (slower first request)
- 10-second execution limit (not suitable for long AI tasks)
- Limited Python packages (many ML libraries too large)
- More complex setup

### When to Use
- Simple API endpoints only
- No heavy AI processing
- Quick responses required

### Not Recommended for InstaBrief Because
- ❌ AI models are too large for serverless
- ❌ Document processing takes > 10 seconds
- ❌ Complex dependencies (PyTorch, Transformers)

**Verdict**: Use Railway/Render for backend instead.

---

## 📝 Environment Variables Checklist

### Backend (Railway/Render)
```env
MONGODB_URI=mongodb+srv://...
SECRET_KEY=your-secret-key-32-chars-min
CORS_ORIGINS=https://your-frontend.vercel.app
ENVIRONMENT=production
```

### Frontend (Vercel)
```env
VITE_API_URL=https://your-backend.railway.app
```

---

## 🔒 Security Best Practices

1. **Secrets Management**
   - Never commit `.env` files
   - Use Vercel/Railway environment variables UI
   - Rotate SECRET_KEY regularly

2. **CORS Configuration**
   - Only allow your specific domains
   - Don't use wildcard (`*`) in production

3. **MongoDB**
   - Use strong passwords
   - Enable IP whitelisting when possible
   - Enable MongoDB authentication

4. **HTTPS**
   - Vercel provides automatic HTTPS
   - Railway provides automatic HTTPS
   - Never use HTTP in production

---

## 📊 Monitoring

### Vercel Analytics
1. Go to Vercel Dashboard → Your Project
2. Enable "Analytics" tab
3. View traffic, performance metrics

### Railway Logs
1. Go to Railway Dashboard → Your Service
2. Click "Logs" tab
3. Real-time log streaming

### MongoDB Monitoring
1. Go to MongoDB Atlas Dashboard
2. Click "Monitoring" tab
3. View connection stats, slow queries

---

## 🚨 Troubleshooting

### Build Failed on Vercel

**Check:**
1. `package.json` has correct build command
2. Node version compatibility
3. All dependencies installed
4. Build logs in Vercel dashboard

**Fix:**
```json
// frontend/package.json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### API Timeout on Railway

**Check:**
1. Cold start time (Railway free tier sleeps)
2. Database connection issues
3. Long-running requests

**Fix:**
- Upgrade to Railway Pro ($5/month)
- Or use Render with persistent instance

### Database Connection Error

**Check:**
1. MongoDB Atlas IP whitelist
2. Connection string format
3. Password special characters (URL encode)

**Fix:**
```bash
# URL encode password if it has special chars
# Example: password "p@ss#word" becomes "p%40ss%23word"
```

---

## 🎓 For Academic Submission

### What to Include

1. **Live URL**: https://your-project.vercel.app
2. **GitHub Repository**: Public or private with access
3. **Documentation**: README.md with setup instructions
4. **Demo Video**: Optional but recommended

### Demo Credentials

Create a demo account for professors:
```
Email: demo@instabrief.com
Password: Demo@123
```

Add this to your README.

---

## 📚 Next Steps

1. ✅ Deploy backend to Railway
2. ✅ Setup MongoDB Atlas
3. ✅ Deploy frontend to Vercel
4. ✅ Test all functionality
5. ⚠️ Monitor logs for issues
6. 🎯 Add custom domain (optional)
7. 📊 Enable analytics (optional)

---

## 💡 Tips for Success

1. **Test Locally First**
   ```bash
   # Test with production API
   cd frontend
   VITE_API_URL=https://your-backend.railway.app npm run dev
   ```

2. **Use Preview Deployments**
   - Test changes before production
   - Every PR gets a preview URL

3. **Monitor Free Tier Limits**
   - Vercel: 100GB bandwidth/month
   - Railway: $5 credit/month
   - MongoDB: 512MB storage

4. **Optimize for Performance**
   - Compress images
   - Code splitting
   - Lazy loading

---

## 🔗 Useful Links

- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **MongoDB Atlas**: https://docs.atlas.mongodb.com
- **Vite Deployment**: https://vitejs.dev/guide/static-deploy

---

## ✅ Success Checklist

- [ ] Backend deployed to Railway
- [ ] MongoDB Atlas configured
- [ ] Frontend deployed to Vercel
- [ ] Environment variables set
- [ ] CORS configured
- [ ] Custom domain added (optional)
- [ ] All features tested
- [ ] Analytics enabled
- [ ] Demo credentials created
- [ ] README updated with live URL

---

*Deployment Guide - Last Updated: October 27, 2025*
