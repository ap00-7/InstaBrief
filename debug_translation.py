import requests
import json

print("=== Debug Translation API ===")

# Test Google Translate directly
try:
    print("Testing Google Translate API...")
    test_text = "This is a test."
    google_url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q={requests.utils.quote(test_text)}"
    response = requests.get(google_url, timeout=15)
    print(f"Google API status: {response.status_code}")
    if response.ok:
        result = response.json()
        print(f"Google API result: {result}")
        if result and result[0] and result[0][0] and result[0][0][0]:
            translated_text = ''.join([item[0] for item in result[0] if item[0]])
            print(f"Google translation: {translated_text}")
    else:
        print(f"Google API failed: {response.text}")
except Exception as e:
    print(f"Google API error: {e}")

print()

# Test MyMemory API directly  
try:
    print("Testing MyMemory API...")
    mymemory_url = "https://api.mymemory.translated.net/get"
    params = {
        "q": "This is a test.",
        "langpair": "en|hi"
    }
    response = requests.get(mymemory_url, params=params, timeout=15)
    print(f"MyMemory API status: {response.status_code}")
    if response.ok:
        result = response.json()
        print(f"MyMemory API result: {result}")
        if result.get("responseStatus") == 200:
            translated_text = result.get("responseData", {}).get("translatedText", "")
            print(f"MyMemory translation: {translated_text}")
    else:
        print(f"MyMemory API failed: {response.text}")
except Exception as e:
    print(f"MyMemory API error: {e}")

print()

# Test the backend translation function directly
try:
    print("Testing backend translation function...")
    from app.routes.documents import translate_text, TranslationRequest
    
    # Create a translation request
    request = TranslationRequest(
        text="This is a test.",
        target_language="hi",
        source_language="en"
    )
    
    # Call the translation function
    result = translate_text(request)
    print(f"Backend translation result: {result}")
    
except Exception as e:
    print(f"Backend translation error: {e}")
    import traceback
    traceback.print_exc()
