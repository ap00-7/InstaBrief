import requests
import json

print("=== Detailed Backend Translation Test ===")

# Test the backend translation API with detailed logging
test_data = {
    'text': 'This is a test document summary.',
    'target_language': 'hi',
    'source_language': 'en'
}

try:
    print(f"Sending request to backend API...")
    print(f"Request data: {test_data}")
    
    response = requests.post(
        'http://localhost:8000/api/documents/translate', 
        json=test_data,
        timeout=30
    )
    
    print(f"Response status code: {response.status_code}")
    print(f"Response headers: {dict(response.headers)}")
    print(f"Response text: {response.text}")
    
    if response.ok:
        try:
            result = response.json()
            print(f"Response JSON: {result}")
        except json.JSONDecodeError as e:
            print(f"Failed to parse JSON: {e}")
    else:
        print(f"Request failed with status {response.status_code}")
        
except Exception as e:
    print(f"Request error: {e}")

print()

# Also test the Google Translate API directly to make sure it works
print("=== Direct Google Translate Test ===")
try:
    import urllib.parse
    test_text = "This is a test document summary."
    google_url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q={urllib.parse.quote(test_text)}"
    
    print(f"Google URL: {google_url}")
    response = requests.get(google_url, timeout=15)
    
    print(f"Google response status: {response.status_code}")
    if response.ok:
        result = response.json()
        if result and result[0] and result[0][0] and result[0][0][0]:
            translated_text = ''.join([item[0] for item in result[0] if item[0]])
            print(f"Google translation: {translated_text}")
        else:
            print(f"Google response format issue: {result}")
    else:
        print(f"Google API failed: {response.text}")
        
except Exception as e:
    print(f"Google API error: {e}")
