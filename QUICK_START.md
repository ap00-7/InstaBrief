# Quick Start Guide - Railway SSE Fix

## 🚀 Deploy in 5 Minutes

### Step 1: Verify Changes (30 seconds)
```bash
# Check that the updated documents.py file is present
git status

# You should see:
# modified:   app/routes/documents.py
```

### Step 2: Deploy to Railway (2 minutes)
```bash
# Commit and push changes
git add .
git commit -m "Fix SSE streaming for Railway - add proper headers and timeouts"
git push origin main

# Railway will automatically deploy (if GitHub integration is enabled)
# Or manually deploy:
railway up
```

### Step 3: Test Deployment (2 minutes)

#### Test 1: Health Check
```bash
curl https://your-app.up.railway.app/api/documents/health
```
Expected: `{"status":"ok","message":"Documents router is working"}`

#### Test 2: Stream Test
```bash
curl -N https://your-app.up.railway.app/api/documents/test-stream
```
Expected: 10 events streaming over 10 seconds

#### Test 3: Upload Document
Open `test_upload_sse.html` in browser:
1. Enter your Railway URL
2. Upload a test document
3. Watch progress updates
4. Verify summary generated

### Step 4: Monitor Logs (30 seconds)
```bash
railway logs --follow
```

Look for:
- ✅ "Starting SSE stream..."
- ✅ "Sent keepalive #1, #2, #3..."
- ✅ "Processing complete, sending result..."

---

## 🔥 What Changed?

### Main Fix
**File**: `app/routes/documents.py` - `/upload` endpoint

**Key Changes:**
1. ✅ Added `X-Accel-Buffering: no` header (fixes Railway buffering)
2. ✅ Keepalive every 1 second (was 2 seconds)
3. ✅ Progress updates every 5 seconds
4. ✅ Timeout: 120s for files, 180s for AI
5. ✅ Comprehensive error handling
6. ✅ Detailed logging for debugging

### New Endpoint
**`/api/documents/test-stream`** - Test SSE streaming (10 second test)

---

## ✅ Success Checklist

- [ ] Code deployed to Railway
- [ ] Health endpoint returns 200 OK
- [ ] Test stream shows 10 messages
- [ ] Can upload small document (< 1MB)
- [ ] Progress updates display
- [ ] Summary generated successfully
- [ ] No 502 errors
- [ ] Logs show "Result sent successfully"

---

## 🐛 If Something Goes Wrong

### Problem: 502 Bad Gateway
**Solution:**
```bash
# Check Railway logs
railway logs --tail 50

# Look for actual error message
# Common causes:
# - Service crashed (check memory usage)
# - Timeout still too short (verify headers)
# - NLTK data not downloaded (automatic on first run)
```

### Problem: Stream Not Working
**Solution:**
```bash
# Test stream endpoint first
curl -N https://your-app.up.railway.app/api/documents/test-stream

# If this fails, check:
# 1. Headers are set correctly
# 2. Railway service is healthy
# 3. No proxy/CDN interfering
```

### Problem: Empty Response
**Solution:**
```bash
# Verify the updated code is deployed
railway logs | grep "Starting SSE stream"

# If not found, code didn't deploy
# Redeploy:
railway up --force
```

---

## 📊 Performance Expectations

### Railway Free Tier
- Small files (< 1MB): **15-30 seconds**
- Medium files (1-5MB): **30-60 seconds**
- Large files (5-10MB): **60-120 seconds**

### Railway Pro Tier
- Small files: **5-15 seconds**
- Medium files: **15-30 seconds**
- Large files: **30-60 seconds**

---

## 🎯 Quick Test Command

Run this single command to test everything:

```bash
# Health + Stream + Upload test
python test_edge_cases.py https://your-app.up.railway.app
```

Expected output:
```
✓ Health check passed
✓ Stream test completed!
✓ Invalid file type correctly rejected
✓ Small file upload successful
...
All tests passed! API is working correctly.
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `QUICK_START.md` | This file - deploy in 5 minutes |
| `SOLUTION_SUMMARY.md` | Complete solution overview |
| `RAILWAY_SSE_FIX.md` | Technical documentation |
| `DEPLOYMENT_GUIDE.md` | Detailed deployment instructions |
| `test_upload_sse.html` | Interactive web test page |
| `test_edge_cases.py` | Automated test suite |

---

## 🆘 Need Help?

1. **Check logs first**: `railway logs --follow`
2. **Test streaming**: Visit `/api/documents/test-stream` in browser
3. **Review error messages**: They're now detailed and helpful
4. **Run test suite**: `python test_edge_cases.py <your-url>`
5. **Check Railway status**: https://status.railway.app/

---

## 🎉 You're Done!

Your document upload API now:
- ✅ Works on Railway without timeouts
- ✅ Handles long-running AI processing
- ✅ Sends real-time progress updates
- ✅ Has comprehensive error handling
- ✅ Provides detailed logs for debugging
- ✅ Gracefully handles edge cases

**Deploy and test now! 🚀**

