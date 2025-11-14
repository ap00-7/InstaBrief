# Railway Server-Sent Events (SSE) Fix Documentation

## Problem Summary
The `/api/documents/upload` endpoint was experiencing timeout issues on Railway due to long-running AI processing. The initial event streaming implementation wasn't working on Railway's infrastructure, resulting in empty responses or 502 errors.

## Root Causes
1. **Railway Proxy Buffering**: Railway's nginx proxy was buffering responses, preventing SSE events from reaching the client
2. **Insufficient Keepalives**: Keepalive messages were sent every 2 seconds, which wasn't frequent enough
3. **Missing Headers**: Critical headers to disable buffering were not set
4. **Timeout Issues**: No proper timeout handling for long-running AI operations
5. **Limited Error Handling**: Errors weren't properly communicated through the event stream

## Solution Implemented

### 1. Enhanced SSE Headers
Added critical headers to prevent buffering on Railway:

```python
headers={
    "Cache-Control": "no-cache",           # Prevent caching
    "Connection": "keep-alive",            # Keep connection alive
    "X-Accel-Buffering": "no",            # Disable nginx buffering (Railway)
    "Content-Type": "text/event-stream",   # Proper SSE content type
}
```

### 2. Frequent Keepalive Messages
- Reduced keepalive interval from 2 seconds to **1 second**
- Send proper SSE comment format: `: keepalive {count}\n\n`
- These are ignored by EventSource clients but keep the connection alive

### 3. Progress Tracking
Instead of just keepalives, the stream now sends progress updates every 5 seconds:

```json
{
  "status": "processing",
  "progress": 50,
  "message": "Generating AI summary...",
  "elapsed_time": 25
}
```

This provides better user experience and helps debug issues.

### 4. Generous Timeouts
Increased timeouts to handle Railway's slower processing:
- File processing: **120 seconds** (2 minutes)
- AI summarization: **180 seconds** (3 minutes)
- Keepalive interval: **1 second**

### 5. Comprehensive Error Handling
Every processing step now has proper try-catch blocks with:
- Timeout handling using `asyncio.wait_for()`
- Fallback mechanisms (e.g., fallback summarization if AI fails)
- Detailed error messages sent through the stream
- Full error traces in server logs

### 6. ThreadPoolExecutor for Blocking Operations
AI operations (which use blocking libraries like Sumy/NLTK) are wrapped in ThreadPoolExecutor to prevent blocking the async event loop:

```python
with ThreadPoolExecutor(max_workers=1) as executor:
    future = executor.submit(summarizer.generate_summary, text, max_length)
    result = await asyncio.wait_for(asyncio.wrap_future(future), timeout=180)
```

## API Usage

### Endpoint: `POST /api/documents/upload`

**Request (multipart/form-data):**
- `file`: Document file (PDF, DOCX, TXT, or PPTX)
- `summary_type`: "extractive" or "abstractive" (default: "extractive")
- `summary_length`: 10-100 (percentage, default: 10)
- `target_language`: Language code (default: "en")

**Response (Server-Sent Events):**

The endpoint returns a stream of events. Your client should use EventSource or similar:

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('summary_length', '50');
formData.append('target_language', 'en');

const eventSource = new EventSource('/api/documents/upload', {
  method: 'POST',
  body: formData
});

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.status === 'processing') {
    // Update progress UI
    console.log(`Progress: ${data.progress}% - ${data.message}`);
  } else if (data.status === 'success') {
    // Processing complete!
    console.log('Document processed:', data);
    console.log('Summary:', data.summary);
    eventSource.close();
  } else if (data.status === 'error') {
    // Handle error
    console.error('Error:', data.error);
    eventSource.close();
  }
};

eventSource.onerror = (error) => {
  console.error('Stream error:', error);
  eventSource.close();
};
```

**Example Progress Events:**

```json
// Event 1: Initial
{"status": "processing", "progress": 0, "message": "Starting document processing..."}

// Event 2: File reading
{"status": "processing", "progress": 15, "message": "Extracting text from document..."}

// Event 3: AI processing
{"status": "processing", "progress": 50, "message": "Generating AI summary...", "elapsed_time": 25}

// Final Event: Success
{
  "status": "success",
  "progress": 100,
  "message": "Document processed successfully!",
  "processing_time": 45,
  "id": "uuid-here",
  "title": "document.pdf",
  "summary": {
    "extractive": "...",
    "abstractive": "..."
  },
  "tags": ["Business", "Analysis"],
  ...
}
```

**Error Event:**

```json
{
  "status": "error",
  "error": "AI summarization timed out after 180s",
  "message": "An error occurred during document processing. Please try again...",
  "detail": "..."
}
```

## Testing

### 1. Test Stream Endpoint
Use the test endpoint to verify SSE streaming works on Railway:

```bash
curl -N https://your-railway-app.up.railway.app/api/documents/test-stream
```

You should see 10 messages streaming over 10 seconds.

### 2. Test Document Upload

```bash
curl -N -X POST \
  -F "file=@test.pdf" \
  -F "summary_length=50" \
  https://your-railway-app.up.railway.app/api/documents/upload
```

You should see progress updates followed by the final result.

### 3. Browser Testing
Open `/api/documents/test-stream` in your browser - you should see events streaming in real-time.

## AI Model Information

The API uses the following AI libraries for document summarization:

1. **Sumy Library**: 
   - TextRank algorithm for extractive summarization
   - LSA (Latent Semantic Analysis) as fallback
   - These are statistical NLP methods, not neural networks

2. **NLTK**: 
   - Natural language processing toolkit
   - Used for tokenization and sentence splitting

3. **WordNinja** (optional):
   - AI-based word segmentation for fixing text extraction issues

4. **Multilingual Summarizer** (optional):
   - Custom multilingual summarization service
   - Falls back to basic extractive if unavailable

### Processing Flow:

```
1. Upload Document → Extract text (PyMuPDF/PyPDF2/python-docx/python-pptx)
2. Clean Text → Fix ligatures, spacing issues
3. Generate Summary → Sumy TextRank (extractive)
4. Optional: Generate Abstractive → Multilingual AI (if available)
5. Extract Keywords → KeywordExtractor service
6. Generate Tags → Filename + content analysis
7. Save Document → Storage service
8. Return Result → Complete document metadata
```

## Deployment Checklist for Railway

- [x] Set proper SSE headers
- [x] Implement keepalive mechanism (1 second interval)
- [x] Add progress tracking
- [x] Set generous timeouts (120s file, 180s AI)
- [x] Wrap blocking operations in ThreadPoolExecutor
- [x] Add comprehensive error handling
- [x] Test streaming with `/test-stream` endpoint
- [ ] Monitor Railway logs during production use
- [ ] Consider adding retry mechanism on client side
- [ ] Set up monitoring/alerting for timeout issues

## Common Issues and Solutions

### Issue: Events not received on Railway
**Solution**: Ensure `X-Accel-Buffering: no` header is set. This disables nginx buffering.

### Issue: 502 Bad Gateway errors
**Solution**: Increase timeouts. Current settings: 120s for file processing, 180s for AI.

### Issue: Connection drops during processing
**Solution**: Keepalive messages are sent every 1 second. Ensure client doesn't timeout the connection.

### Issue: Empty response body
**Solution**: Verify streaming headers are properly set and events are UTF-8 encoded.

### Issue: AI processing too slow
**Solution**: Consider these options:
1. Reduce document size (current limit: 50,000 chars)
2. Use `summary_length` parameter to request shorter summaries
3. Use extractive-only summarization (faster than abstractive)

## Performance Optimization Tips

1. **Document Size**: Limit uploads to reasonable sizes (currently 50KB text content)
2. **Summary Length**: Lower percentages (10-30%) process much faster
3. **Caching**: Consider caching summaries for frequently accessed documents
4. **Queue System**: For very large documents, consider a job queue (Celery/Redis)
5. **CDN**: Serve static assets through Railway's CDN

## Monitoring

Monitor these metrics in Railway:
- Response times for `/upload` endpoint
- Number of timeout errors
- Average processing time
- Memory usage during AI operations
- Connection duration

## Support

If issues persist:
1. Check Railway logs: `railway logs`
2. Test locally first to isolate Railway-specific issues
3. Use `/test-stream` endpoint to verify SSE works
4. Check Railway's service status
5. Verify all required Python packages are installed

## Technical Details

**Libraries Used:**
- FastAPI: Web framework
- Sumy: Text summarization
- NLTK: Natural language processing
- PyMuPDF (fitz): PDF text extraction
- python-docx: Word document processing
- python-pptx: PowerPoint processing

**Python Version**: 3.8+
**Deployment**: Railway (with nginx proxy)
**Architecture**: Async/await with ThreadPoolExecutor for blocking operations

