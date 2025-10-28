import requests
import json

# Check LibreTranslate languages
print("=== LibreTranslate Supported Languages ===")
try:
    response = requests.get('http://instabrief-translate:5000/languages')
    languages = response.json()
    
    print(f"Total languages: {len(languages)}")
    codes = [lang['code'] for lang in languages]
    print("Language codes:", codes)
    
    # Check for Indian languages specifically
    indian_languages = ['hi', 'bn', 'ta', 'te', 'kn', 'ml', 'mr', 'gu', 'pa', 'or', 'as', 'ur']
    print(f"\n=== Indian Language Support ===")
    for lang in indian_languages:
        supported = lang in codes
        print(f"{lang}: {'✅ Supported' if supported else '❌ Not supported'}")
        
    # Test Hindi translation
    if 'hi' in codes:
        print(f"\n=== Testing Hindi Translation ===")
        test_response = requests.post('http://instabrief-translate:5000/translate', json={
            'q': 'This is a test document summary.',
            'source': 'en',
            'target': 'hi',
            'format': 'text'
        })
        if test_response.ok:
            result = test_response.json()
            print(f"English: This is a test document summary.")
            print(f"Hindi: {result.get('translatedText', 'Failed')}")
        else:
            print(f"Hindi translation failed: {test_response.status_code}")
            
    # Test Bengali translation
    if 'bn' in codes:
        print(f"\n=== Testing Bengali Translation ===")
        test_response = requests.post('http://instabrief-translate:5000/translate', json={
            'q': 'This is a test document summary.',
            'source': 'en',
            'target': 'bn',
            'format': 'text'
        })
        if test_response.ok:
            result = test_response.json()
            print(f"English: This is a test document summary.")
            print(f"Bengali: {result.get('translatedText', 'Failed')}")
        else:
            print(f"Bengali translation failed: {test_response.status_code}")
            
except Exception as e:
    print(f"Error: {e}")
