# InstaBrief Railway Deployment Guide

## Pre-Deployment Checklist

### 1. Required Python Packages
Ensure your `requirements.txt` includes all necessary packages:

```txt
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
python-multipart>=0.0.6
pydantic>=2.0.0
sumy>=0.11.0
nltk>=3.8.1
PyMuPDF>=1.23.0
pypdf>=3.17.0
python-docx>=1.1.0
python-pptx>=0.6.23
requests>=2.31.0
```

### 2. Railway Environment Variables
Set these in your Railway project settings:

```bash
# Required
ENVIRONMENT=production
PYTHONUNBUFFERED=1

# Optional (adjust based on your needs)
MAX_UPLOAD_SIZE=10485760  # 10MB
ALLOWED_ORIGINS=https://your-frontend.com,https://another-frontend.com
```

### 3. Railway Configuration
Create `railway.json` (optional but recommended):

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT --timeout-keep-alive 300",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

### 4. Procfile (Alternative)
If not using `railway.json`, create a `Procfile`:

```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT --timeout-keep-alive 300 --timeout-graceful-shutdown 30
```

## Deployment Steps

### Step 1: Push to Git Repository
```bash
git add .
git commit -m "Fix SSE streaming for Railway deployment"
git push origin main
```

### Step 2: Deploy to Railway
If using Railway CLI:
```bash
railway login
railway link  # Link to your existing project
railway up    # Deploy
```

Or use Railway's GitHub integration for automatic deployments.

### Step 3: Verify Deployment

#### 3.1 Health Check
```bash
curl https://your-app.up.railway.app/health
```

Expected response:
```json
{"status": "ok"}
```

#### 3.2 Test SSE Stream
```bash
curl -N https://your-app.up.railway.app/api/documents/test-stream
```

You should see events streaming in real-time.

#### 3.3 Test Document Upload
Use the provided HTML test page:
1. Open `test_upload_sse.html` in a browser
2. Set API URL to your Railway deployment
3. Upload a test document
4. Watch the progress updates

### Step 4: Monitor Logs
```bash
railway logs --follow
```

Look for:
- ✅ "Starting SSE stream..."
- ✅ "Sent keepalive #X"
- ✅ "Processing complete, sending result..."
- ❌ Any ERROR messages

## Common Deployment Issues

### Issue 1: "Module not found" errors
**Cause**: Missing dependencies in `requirements.txt`
**Solution**: 
```bash
pip freeze > requirements.txt
git add requirements.txt
git commit -m "Update dependencies"
git push
```

### Issue 2: Railway timeout (502 errors)
**Cause**: Request taking longer than Railway's timeout
**Solution**: Already fixed with SSE streaming! If still happening:
1. Check Railway logs for actual error
2. Verify SSE headers are set correctly
3. Test with `/test-stream` endpoint

### Issue 3: NLTK data not found
**Cause**: NLTK data not downloaded in Railway environment
**Solution**: The code automatically downloads NLTK data on first run. Check logs for:
```
Warning: Failed to download NLTK punkt data
```

If you see this, create a `nltk_download.py` script:
```python
import nltk
nltk.download('punkt')
nltk.download('punkt_tab')
```

Run during build in `railway.json`:
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pip install -r requirements.txt && python nltk_download.py"
  }
}
```

### Issue 4: Slow AI processing
**Cause**: Railway's free tier has limited CPU/memory
**Solution**:
1. Upgrade to Railway Pro for better performance
2. Reduce document size limit (currently 50KB text)
3. Use lower summary_length percentages
4. Consider adding Redis queue for background processing

### Issue 5: CORS errors
**Cause**: Frontend not in allowed origins
**Solution**: Update CORS settings in `app/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend.com",
        "http://localhost:3000",  # For local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Performance Optimization for Railway

### 1. Enable Railway's CDN
For static assets, enable Railway's CDN in project settings.

### 2. Database Connection Pooling
If using a database (MongoDB, PostgreSQL), enable connection pooling:

```python
# For MongoDB
from motor.motor_asyncio import AsyncIOMotorClient

client = AsyncIOMotorClient(
    MONGODB_URL,
    maxPoolSize=10,
    minPoolSize=1,
    maxIdleTimeMS=45000,
    serverSelectionTimeoutMS=5000,
)
```

### 3. Implement Caching
Cache summarization results:

```python
from functools import lru_cache

@lru_cache(maxsize=100)
def get_cached_summary(text_hash, max_length):
    # Generate summary
    pass
```

### 4. Add Request Rate Limiting
Protect against abuse:

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/documents/upload")
@limiter.limit("10/minute")
async def upload_document(...):
    ...
```

## Monitoring and Debugging

### 1. Railway Metrics
Monitor in Railway dashboard:
- CPU usage
- Memory usage
- Response time
- Error rate

### 2. Application Logs
The updated code includes extensive logging:
```python
print(f"Step 1: Extracting text from {file_ext} file...")
print(f"Text extracted successfully: {len(text_content)} characters")
print(f"Sent keepalive #{keepalive_count}")
```

View in Railway:
```bash
railway logs --follow
```

### 3. Error Tracking
Consider adding error tracking service:
- Sentry
- Rollbar
- Bugsnag

Example with Sentry:
```python
import sentry_sdk

sentry_sdk.init(
    dsn="your-sentry-dsn",
    environment="production",
)
```

## Scaling Considerations

### When to Scale Up

1. **Consistent 502 errors** despite SSE fix → Need more CPU/memory
2. **High request volume** → Add more instances or upgrade plan
3. **Slow AI processing** → Consider GPU instances or separate AI service
4. **Database slowdowns** → Upgrade database tier or add read replicas

### Horizontal Scaling

Railway supports automatic horizontal scaling:
1. Go to project settings
2. Enable autoscaling
3. Set min/max instances
4. Configure CPU/memory triggers

### Alternative Architecture

For very high loads, consider:

```
Client → Railway (FastAPI) → Redis Queue → Background Workers → AI Service
```

This decouples the API from heavy AI processing.

## Security Best Practices

### 1. File Upload Validation
Already implemented:
- File type validation (PDF, DOCX, TXT, PPTX only)
- File size limits
- Content sanitization

### 2. Rate Limiting
Add to prevent abuse:
```python
@limiter.limit("20/minute")
async def upload_document(...):
```

### 3. Authentication
If not already implemented, add JWT authentication:
```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer

security = HTTPBearer()

async def verify_token(credentials = Depends(security)):
    # Verify JWT token
    pass
```

### 4. Environment Variables
Never commit sensitive data. Use Railway environment variables:
- API keys
- Database URLs
- Secret keys

## Testing in Production

### 1. Manual Testing Checklist
- [ ] Health endpoint responds
- [ ] Test stream endpoint works
- [ ] Can upload small PDF (< 1MB)
- [ ] Can upload medium PDF (1-5MB)
- [ ] Progress updates display correctly
- [ ] Summary generated successfully
- [ ] Tags extracted correctly
- [ ] Error handling works (try invalid file)

### 2. Automated Testing
Create a test script:

```python
import requests

def test_upload():
    url = "https://your-app.up.railway.app/api/documents/upload"
    files = {"file": open("test.pdf", "rb")}
    data = {"summary_length": 50}
    
    response = requests.post(url, files=files, data=data, stream=True)
    
    for line in response.iter_lines():
        if line:
            print(line.decode('utf-8'))

if __name__ == "__main__":
    test_upload()
```

### 3. Load Testing
Use tools like:
- Apache Bench (ab)
- wrk
- Locust

Example with ab:
```bash
ab -n 10 -c 2 -p test.pdf -T multipart/form-data \
   https://your-app.up.railway.app/api/documents/upload
```

## Rollback Plan

If deployment fails:

### Via Railway Dashboard
1. Go to Deployments tab
2. Find previous successful deployment
3. Click "Redeploy"

### Via Git
```bash
git revert HEAD
git push origin main
```

### Via Railway CLI
```bash
railway rollback
```

## Support Resources

- **Railway Documentation**: https://docs.railway.app/
- **FastAPI SSE Guide**: https://fastapi.tiangolo.com/advanced/custom-response/
- **Railway Discord**: https://discord.gg/railway
- **GitHub Issues**: Report bugs in your repository

## Post-Deployment

### 1. Update Frontend
Update your frontend to handle the new SSE response format:

```javascript
const eventSource = new EventSource('/api/documents/upload');

eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.status === 'processing') {
        updateProgressBar(data.progress);
        showMessage(data.message);
    } else if (data.status === 'success') {
        displayResults(data);
        eventSource.close();
    } else if (data.status === 'error') {
        showError(data.error);
        eventSource.close();
    }
};
```

### 2. Documentation
Update API documentation with:
- New response format
- Progress update structure
- Error handling examples

### 3. Monitoring Setup
Set up alerts for:
- High error rate (> 5%)
- Slow responses (> 60s)
- High memory usage (> 80%)
- Failed health checks

## Success Criteria

Deployment is successful when:
- ✅ Health endpoint returns 200 OK
- ✅ Test stream shows 10 messages over 10 seconds
- ✅ Document upload completes with progress updates
- ✅ No 502 errors for uploads under 5 minutes
- ✅ Error messages are clear and helpful
- ✅ Railway logs show no critical errors

---

**Last Updated**: November 2024
**Tested On**: Railway (nixpacks builder)
**Python Version**: 3.11+

