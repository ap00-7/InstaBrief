#!/usr/bin/env python3
import requests
import json

try:
    # Check LibreTranslate languages
    print("=== LibreTranslate Supported Languages ===")
    response = requests.get('http://localhost:5001/languages')
    languages = response.json()
    
    print(f"Total languages: {len(languages)}")
    print("\nLanguage codes:")
    codes = [lang['code'] for lang in languages]
    print(codes)
    
    # Check for Indian languages specifically
    indian_languages = ['hi', 'bn', 'ta', 'te', 'kn', 'ml', 'mr', 'gu', 'pa', 'or', 'as', 'ur']
    print(f"\n=== Indian Language Support ===")
    for lang in indian_languages:
        supported = lang in codes
        print(f"{lang}: {'✅ Supported' if supported else '❌ Not supported'}")
        
    # Test translation for a supported Indian language (Hindi)
    if 'hi' in codes:
        print(f"\n=== Testing Hindi Translation ===")
        test_response = requests.post('http://localhost:5001/translate', json={
            'q': 'Hello, how are you?',
            'source': 'en',
            'target': 'hi',
            'format': 'text'
        })
        if test_response.ok:
            result = test_response.json()
            print(f"English: Hello, how are you?")
            print(f"Hindi: {result.get('translatedText', 'Failed')}")
        else:
            print(f"Translation test failed: {test_response.status_code}")
            
    # Test translation for Bengali if supported
    if 'bn' in codes:
        print(f"\n=== Testing Bengali Translation ===")
        test_response = requests.post('http://localhost:5001/translate', json={
            'q': 'Hello, how are you?',
            'source': 'en',
            'target': 'bn',
            'format': 'text'
        })
        if test_response.ok:
            result = test_response.json()
            print(f"English: Hello, how are you?")
            print(f"Bengali: {result.get('translatedText', 'Failed')}")
        else:
            print(f"Translation test failed: {test_response.status_code}")
            
except Exception as e:
    print(f"Error: {e}")
