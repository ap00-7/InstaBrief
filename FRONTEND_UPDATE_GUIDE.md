# Frontend Update Guide - Multi-Part SSE Response

## Why This Change?

Railway was truncating the large final response when sent as a single SSE event. By splitting the response into multiple smaller events, we ensure all data reaches the client reliably.

## New Response Format

### Event Sequence

Instead of one large `success` event, you now receive **5 separate events**:

#### 1. Processing Events (multiple, as before)
```json
{
  "status": "processing",
  "progress": 50,
  "message": "Generating AI summary...",
  "elapsed_time": 25
}
```

#### 2. Completion Signal (new)
```json
{
  "status": "complete",
  "progress": 100,
  "message": "Processing finished, sending results...",
  "processing_time": 45
}
```

#### 3. Metadata Event (new)
```json
{
  "status": "success",
  "type": "metadata",
  "id": "uuid-here",
  "title": "document.pdf",
  "original_filename": "document.pdf",
  "file_size": 102400,
  "file_type": ".pdf",
  "created_at": "2024-11-14T10:30:00",
  "processing_time": 45
}
```

#### 4. Summary Event (new)
```json
{
  "status": "success",
  "type": "summary",
  "summary": {
    "extractive": "Long summary text...",
    "abstractive": "Long summary text..."
  }
}
```

#### 5. Additional Data Event (new)
```json
{
  "status": "success",
  "type": "additional",
  "tags": ["Business", "Analysis", "Report"],
  "content": "First 500 characters of document..."
}
```

#### 6. Done Signal (new)
```json
{
  "status": "done",
  "message": "Document processed successfully!",
  "id": "uuid-here"
}
```

## Frontend Code Update

### Option 1: React/Vue/Angular (Recommended)

```javascript
async function uploadDocument(file, summaryLength = 50, targetLanguage = 'en') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('summary_length', summaryLength);
  formData.append('target_language', targetLanguage);

  const response = await fetch('/api/documents/upload', {
    method: 'POST',
    body: formData
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  // Accumulate results from multiple events
  let result = {};

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data:')) {
        const data = JSON.parse(line.substring(5).trim());
        
        // Handle different event types
        switch (data.status) {
          case 'processing':
            // Update progress UI
            onProgress(data.progress, data.message);
            break;
            
          case 'complete':
            // Processing done, waiting for data
            onProgress(100, data.message);
            break;
            
          case 'success':
            // Accumulate data based on type
            if (data.type === 'metadata') {
              result = { ...result, ...data };
            } else if (data.type === 'summary') {
              result.summary = data.summary;
            } else if (data.type === 'additional') {
              result.tags = data.tags;
              result.content = data.content;
            }
            break;
            
          case 'done':
            // All data received - display results
            onComplete(result);
            return result;
            
          case 'error':
            onError(data.error || data.message);
            throw new Error(data.error);
        }
      }
    }
  }
  
  return result;
}

// Usage
uploadDocument(fileInput.files[0], 50, 'en')
  .then(result => {
    console.log('Upload successful:', result);
    console.log('Summary:', result.summary);
    console.log('Tags:', result.tags);
  })
  .catch(error => {
    console.error('Upload failed:', error);
  });
```

### Option 2: EventSource API (Alternative)

**Note**: EventSource doesn't work with POST by default, but you can use a workaround or the Fetch API approach above.

### Option 3: Simple State Management

```javascript
class DocumentUploader {
  constructor() {
    this.result = {};
    this.onProgressCallback = null;
    this.onCompleteCallback = null;
    this.onErrorCallback = null;
  }

  onProgress(callback) {
    this.onProgressCallback = callback;
    return this;
  }

  onComplete(callback) {
    this.onCompleteCallback = callback;
    return this;
  }

  onError(callback) {
    this.onErrorCallback = callback;
    return this;
  }

  async upload(file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('summary_length', options.summaryLength || 50);
    formData.append('target_language', options.targetLanguage || 'en');

    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      body: formData
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data:')) {
          await this.handleEvent(JSON.parse(line.substring(5).trim()));
        }
      }
    }

    return this.result;
  }

  async handleEvent(data) {
    switch (data.status) {
      case 'processing':
        if (this.onProgressCallback) {
          this.onProgressCallback(data.progress, data.message);
        }
        break;

      case 'complete':
        if (this.onProgressCallback) {
          this.onProgressCallback(100, data.message);
        }
        break;

      case 'success':
        // Accumulate results
        if (data.type === 'metadata') {
          Object.assign(this.result, data);
        } else if (data.type === 'summary') {
          this.result.summary = data.summary;
        } else if (data.type === 'additional') {
          this.result.tags = data.tags;
          this.result.content = data.content;
        }
        break;

      case 'done':
        if (this.onCompleteCallback) {
          this.onCompleteCallback(this.result);
        }
        break;

      case 'error':
        if (this.onErrorCallback) {
          this.onErrorCallback(data.error || data.message);
        }
        throw new Error(data.error);
    }
  }
}

// Usage
const uploader = new DocumentUploader();

uploader
  .onProgress((progress, message) => {
    console.log(`${progress}%: ${message}`);
    updateProgressBar(progress);
  })
  .onComplete((result) => {
    console.log('Upload complete:', result);
    displayResults(result);
  })
  .onError((error) => {
    console.error('Upload error:', error);
    showErrorMessage(error);
  });

await uploader.upload(file, { summaryLength: 50, targetLanguage: 'en' });
```

## React Hook Example

```javascript
import { useState, useCallback } from 'react';

function useDocumentUpload() {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const upload = useCallback(async (file, options = {}) => {
    setIsUploading(true);
    setError(null);
    setResult(null);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('summary_length', options.summaryLength || 50);
    formData.append('target_language', options.targetLanguage || 'en');

    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedResult = {};

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = JSON.parse(line.substring(5).trim());

            if (data.status === 'processing') {
              setProgress(data.progress);
              setMessage(data.message);
            } else if (data.status === 'complete') {
              setProgress(100);
              setMessage(data.message);
            } else if (data.status === 'success') {
              if (data.type === 'metadata') {
                accumulatedResult = { ...accumulatedResult, ...data };
              } else if (data.type === 'summary') {
                accumulatedResult.summary = data.summary;
              } else if (data.type === 'additional') {
                accumulatedResult.tags = data.tags;
                accumulatedResult.content = data.content;
              }
            } else if (data.status === 'done') {
              setResult(accumulatedResult);
              setMessage(data.message);
            } else if (data.status === 'error') {
              throw new Error(data.error);
            }
          }
        }
      }
    } catch (err) {
      setError(err.message);
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  }, []);

  return { upload, progress, message, result, error, isUploading };
}

// Usage in component
function DocumentUploadComponent() {
  const { upload, progress, message, result, error, isUploading } = useDocumentUpload();

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await upload(file, { summaryLength: 50, targetLanguage: 'en' });
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileSelect} disabled={isUploading} />
      
      {isUploading && (
        <div>
          <progress value={progress} max="100" />
          <p>{message}</p>
        </div>
      )}
      
      {error && <div className="error">{error}</div>}
      
      {result && (
        <div>
          <h3>{result.title}</h3>
          <p>{result.summary?.extractive}</p>
          <div>
            {result.tags?.map(tag => <span key={tag}>{tag}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}
```

## Testing the Update

### 1. Use the Test HTML Page
Open `test_upload_sse.html` - it's already updated to handle the new format.

### 2. Check Browser Console
You should see logs like:
```
✓ Received metadata
✓ Received summary (3421 bytes)
✓ Received tags and content
✓ All data received, displaying results...
```

### 3. Verify EventStream Tab
In browser DevTools > Network > EventStream, you should see:
- Multiple keepalive messages
- `status: "complete"` event
- `status: "success", type: "metadata"` event
- `status: "success", type: "summary"` event
- `status: "success", type: "additional"` event
- `status: "done"` event

## Backward Compatibility

**Important**: The old single-event format is **not sent anymore**. All clients must be updated to handle the multi-part format.

## Benefits

1. ✅ **Reliable on Railway** - No more truncated responses
2. ✅ **Progress visibility** - Client knows when data is coming
3. ✅ **Partial updates** - Can display metadata before summary arrives
4. ✅ **Better error handling** - Errors can occur at any stage
5. ✅ **Scalable** - Can add more data types without breaking existing code

## Common Issues

### Issue: Not receiving summary
**Check**: Are you accumulating the `result` object across multiple events?

**Solution**: Use a state variable or object that persists across event iterations.

### Issue: Displaying results too early
**Check**: Are you waiting for the `status: "done"` event?

**Solution**: Only call `onComplete()` or display results when you receive `status: "done"`.

### Issue: Progress stuck at 100%
**Check**: The `complete` status means processing is done, but data is still being sent.

**Solution**: Show a message like "Receiving results..." between `complete` and `done`.

## Migration Checklist

- [ ] Update frontend code to accumulate results from multiple events
- [ ] Handle `status: "complete"` (processing done)
- [ ] Handle `status: "success"` with `type: "metadata"`
- [ ] Handle `status: "success"` with `type: "summary"`
- [ ] Handle `status: "success"` with `type: "additional"`
- [ ] Handle `status: "done"` (all data received)
- [ ] Test with the provided HTML test page
- [ ] Test with your actual frontend application
- [ ] Deploy frontend updates
- [ ] Monitor for any issues

## Support

If you encounter issues:
1. Check browser console for error messages
2. Check Network tab > EventStream for received events
3. Use `test_upload_sse.html` to verify API is working
4. Check Railway logs for backend errors

---

**Last Updated**: November 14, 2024
**Breaking Change**: Yes - clients must update to handle multi-part responses

