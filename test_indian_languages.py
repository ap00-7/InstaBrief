#!/usr/bin/env python3
import requests
import json

# Test Indian languages translation
indian_languages = {
    'hi': 'Hindi',
    'bn': 'Bengali', 
    'ta': 'Tamil',
    'te': 'Telugu',
    'kn': 'Kannada',
    'ml': 'Malayalam',
    'mr': 'Marathi',
    'gu': 'Gujarati',
    'pa': 'Punjabi',
    'or': 'Odia',
    'as': 'Assamese',
    'ur': 'Urdu'
}

test_text = "This is a test document summary about artificial intelligence and machine learning."

print("=== Testing Indian Language Translation ===")
print(f"Test text: {test_text}")
print()

# Test backend API translation endpoint
for lang_code, lang_name in indian_languages.items():
    try:
        print(f"Testing {lang_name} ({lang_code})...")
        
        # Test backend API
        response = requests.post('http://localhost:8000/api/documents/translate', json={
            'text': test_text,
            'target_language': lang_code,
            'source_language': 'en'
        }, timeout=30)
        
        if response.ok:
            result = response.json()
            translated_text = result.get('translated_text', 'No translation')
            print(f"✅ {lang_name}: {translated_text[:100]}...")
        else:
            print(f"❌ {lang_name}: API error {response.status_code}")
            
    except Exception as e:
        print(f"❌ {lang_name}: Error - {str(e)}")
    
    print()

print("=== Testing Google Translate API directly ===")
# Test Google Translate API directly for a few languages
test_languages = ['hi', 'bn', 'ta', 'te']

for lang_code in test_languages:
    try:
        lang_name = indian_languages[lang_code]
        print(f"Testing Google Translate for {lang_name} ({lang_code})...")
        
        google_url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl={lang_code}&dt=t&q={requests.utils.quote(test_text)}"
        response = requests.get(google_url, timeout=15)
        
        if response.ok:
            result = response.json()
            if result and result[0] and result[0][0] and result[0][0][0]:
                translated_text = ''.join([item[0] for item in result[0] if item[0]])
                print(f"✅ Google {lang_name}: {translated_text[:100]}...")
            else:
                print(f"❌ Google {lang_name}: Invalid response format")
        else:
            print(f"❌ Google {lang_name}: HTTP error {response.status_code}")
            
    except Exception as e:
        print(f"❌ Google {lang_name}: Error - {str(e)}")
    
    print()

print("=== Testing MyMemory API directly ===")
# Test MyMemory API directly
for lang_code in test_languages:
    try:
        lang_name = indian_languages[lang_code]
        print(f"Testing MyMemory for {lang_name} ({lang_code})...")
        
        mymemory_url = "https://api.mymemory.translated.net/get"
        params = {
            "q": test_text,
            "langpair": f"en|{lang_code}"
        }
        response = requests.get(mymemory_url, params=params, timeout=15)
        
        if response.ok:
            result = response.json()
            if result.get("responseStatus") == 200:
                translated_text = result.get("responseData", {}).get("translatedText", "")
                if translated_text:
                    print(f"✅ MyMemory {lang_name}: {translated_text[:100]}...")
                else:
                    print(f"❌ MyMemory {lang_name}: Empty translation")
            else:
                print(f"❌ MyMemory {lang_name}: API error status {result.get('responseStatus')}")
        else:
            print(f"❌ MyMemory {lang_name}: HTTP error {response.status_code}")
            
    except Exception as e:
        print(f"❌ MyMemory {lang_name}: Error - {str(e)}")
    
    print()
