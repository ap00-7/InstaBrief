# Audio Troubleshooting Guide

## Issue: Audio Not Playing in Document Modal

### Quick Diagnosis

**Step 1: Check Browser Console**
1. Open document modal
2. Press F12 → Console tab
3. Click play button
4. Look for error messages

### Common Issues & Solutions

#### Issue 1: Browser Autoplay Policy
**Symptoms:**
- First click doesn't work
- Error: "NotAllowedError" in console
- Alert: "Audio playback was blocked"

**Solution:**
Click the play button a second time. Browsers require user interaction before allowing audio.

**Permanent Fix:**
Add this to your browser:
- Chrome: chrome://flags/#autoplay-policy → Set to "No user gesture required"
- Firefox: about:config → media.autoplay.default → Set to 0

---

#### Issue 2: Backend TTS API Failure
**Symptoms:**
- Console shows: "Backend TTS Error"
- Status code other than 200
- Falls back to browser TTS

**Solution:**
1. Check if API container is running:
```bash
docker ps | grep api
```

2. Check API logs:
```bash
docker logs instabrief-api --tail 50
```

3. Test TTS endpoint manually:
```bash
curl -X POST http://localhost:8000/api/documents/text-to-speech \
  -H "Content-Type: application/json" \
  -d '{"text":"test","language":"en"}' \
  -o test.mp3
```

---

#### Issue 3: CORS Error
**Symptoms:**
- Console: "Access to XMLHttpRequest blocked by CORS policy"
- API calls fail from frontend

**Solution:**
Update backend CORS settings in `app/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

#### Issue 4: Empty Audio Data
**Symptoms:**
- Console: "Received empty audio data from server"
- API returns 0 bytes

**Solution:**
gTTS might be having issues. Check:
1. Internet connection (gTTS needs internet)
2. API container has network access
3. Try different language

---

#### Issue 5: Audio Format Not Supported
**Symptoms:**
- Audio file created but won't play
- Browser can't decode audio

**Solution:**
Check supported formats:
```javascript
// In browser console:
var audio = new Audio();
console.log(audio.canPlayType('audio/mpeg')); // Should return "probably" or "maybe"
```

---

### Force Browser TTS Only

If backend TTS keeps failing, you can disable it:

**Edit Dashboard.jsx:**
```javascript
const handlePlayAudio = async () => {
  if (isPlayingAudio) {
    speechSynthesis.cancel();
    setIsPlayingAudio(false);
    return;
  }

  // Skip backend TTS, use browser only
  playWithSpeechSynthesis();
};
```

---

### Test Audio in Isolation

**Create a simple HTML test file:**
```html
<!DOCTYPE html>
<html>
<head><title>Audio Test</title></head>
<body>
  <button onclick="testBackendAudio()">Test Backend Audio</button>
  <button onclick="testBrowserAudio()">Test Browser Audio</button>
  
  <script>
    async function testBackendAudio() {
      const response = await fetch('http://localhost:8000/api/documents/text-to-speech', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({text: 'Hello world', language: 'en'})
      });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await audio.play();
    }
    
    function testBrowserAudio() {
      const utterance = new SpeechSynthesisUtterance('Hello world');
      speechSynthesis.speak(utterance);
    }
  </script>
</body>
</html>
```

Save as `audio_test.html` and open in browser.

---

### Debug Logs to Look For

**Good Logs (Working):**
```
Backend TTS Request: { language: 'en', textLength: 1234 }
Calling TTS API endpoint: /documents/text-to-speech
TTS API Response received: { status: 200, dataSize: 45678 }
Audio play() called successfully
Audio started playing
```

**Bad Logs (Not Working):**
```
Backend TTS Error: AxiosError
Error details: { status: 404, message: "Not Found" }
Backend TTS failed, falling back to browser
```

---

### Contact Support

If none of these solutions work:
1. Export console logs (right-click → Save as)
2. Export network tab (F12 → Network → Export HAR)
3. Run: `docker logs instabrief-api > api.log`
4. Send all three files

---

## Language-Specific Issues

### English (en-US) - Should always work
- Uses browser TTS as primary
- gTTS as secondary

### Spanish (es-ES) - Check gTTS
- Requires internet for gTTS
- Browser support varies

### Other Languages
- May require specific voice packs
- Check browser support: speechSynthesis.getVoices()

---

## Performance Tips

1. **Long texts** - Summary is automatically truncated to 10,000 chars
2. **Multiple languages** - Browser caches voices
3. **Slow playback** - Adjust speech rate in code (currently 0.9)

---

## Still Not Working?

**Last Resort:**
Use the fallback text display and let users read instead of listen. Audio is a nice-to-have feature, not required for core functionality.
