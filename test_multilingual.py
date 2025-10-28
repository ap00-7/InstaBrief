#!/usr/bin/env python3
"""
Test script for multilingual summarization functionality
Tests the new AI-powered multilingual summarization with various languages
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.summarizer import SummarizerService

# Test texts in different languages
test_texts = {
    'english': """
    Artificial intelligence (AI) is intelligence demonstrated by machines, in contrast to the natural intelligence displayed by humans and animals. Leading AI textbooks define the field as the study of "intelligent agents": any device that perceives its environment and takes actions that maximize its chance of successfully achieving its goals. Colloquially, the term "artificial intelligence" is often used to describe machines that mimic "cognitive" functions that humans associate with the human mind, such as "learning" and "problem solving".
    """,
    
    'spanish': """
    La inteligencia artificial (IA) es la inteligencia demostrada por máquinas, en contraste con la inteligencia natural mostrada por humanos y animales. Los libros de texto líderes en IA definen el campo como el estudio de "agentes inteligentes": cualquier dispositivo que percibe su entorno y toma acciones que maximizan su posibilidad de lograr exitosamente sus objetivos.
    """,
    
    'french': """
    L'intelligence artificielle (IA) est l'intelligence démontrée par les machines, par opposition à l'intelligence naturelle affichée par les humains et les animaux. Les manuels d'IA de référence définissent le domaine comme l'étude des "agents intelligents" : tout dispositif qui perçoit son environnement et entreprend des actions qui maximisent ses chances d'atteindre avec succès ses objectifs.
    """,
    
    'german': """
    Künstliche Intelligenz (KI) ist die von Maschinen demonstrierte Intelligenz, im Gegensatz zur natürlichen Intelligenz, die von Menschen und Tieren gezeigt wird. Führende KI-Lehrbücher definieren das Feld als das Studium "intelligenter Agenten": jedes Gerät, das seine Umgebung wahrnimmt und Handlungen unternimmt, die seine Chance maximieren, seine Ziele erfolgreich zu erreichen.
    """,
    
    'chinese': """
    人工智能（AI）是机器展示的智能，与人类和动物展示的自然智能形成对比。领先的人工智能教科书将该领域定义为对"智能代理"的研究：任何感知其环境并采取行动以最大化成功实现其目标机会的设备。
    """,
    
    'arabic': """
    الذكاء الاصطناعي هو الذكاء الذي تظهره الآلات، على عكس الذكاء الطبيعي الذي يظهره البشر والحيوانات. تعرف الكتب المدرسية الرائدة في الذكاء الاصطناعي المجال بأنه دراسة "الوكلاء الأذكياء": أي جهاز يدرك بيئته ويتخذ إجراءات تزيد من فرصته في تحقيق أهدافه بنجاح.
    """
}

target_languages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi']

async def test_multilingual_summarization():
    """Test multilingual summarization functionality"""
    print("🚀 Testing Multilingual Summarization")
    print("=" * 50)
    
    try:
        # Initialize summarizer service
        summarizer = SummarizerService()
        print("✅ SummarizerService initialized successfully")
        
        # Test language detection
        print("\n🔍 Testing Language Detection")
        print("-" * 30)
        
        for lang_name, text in test_texts.items():
            try:
                detection_result = summarizer.detect_language(text.strip())
                print(f"{lang_name.capitalize():>10}: {detection_result['primary_language']} "
                      f"({detection_result['confidence']:.2f} confidence)")
            except Exception as e:
                print(f"{lang_name.capitalize():>10}: ❌ Detection failed - {e}")
        
        # Test supported languages
        print(f"\n🌍 Testing Supported Languages")
        print("-" * 30)
        
        try:
            languages_info = summarizer.get_supported_languages()
            total_languages = languages_info.get('total_count', 0)
            print(f"✅ Total supported languages: {total_languages}")
            
            # Show language categories
            categories = languages_info.get('categories', {})
            for category, langs in categories.items():
                print(f"  {category.replace('_', ' ').title()}: {len(langs)} languages")
                
        except Exception as e:
            print(f"❌ Failed to get supported languages: {e}")
        
        # Test multilingual summarization
        print(f"\n📝 Testing Multilingual Summarization")
        print("-" * 40)
        
        test_text = test_texts['english']  # Use English text as source
        
        for target_lang in target_languages[:6]:  # Test first 6 languages
            try:
                print(f"\nTesting summarization to {target_lang.upper()}...")
                
                result = summarizer.generate_multilingual_summary(
                    text=test_text,
                    target_language=target_lang,
                    max_length=100,
                    summary_type='extractive'
                )
                
                if result:
                    print(f"✅ {target_lang.upper()}: Generated successfully")
                    print(f"   Detected: {result.get('detected_language', 'unknown')}")
                    print(f"   Summary length: {len(result.get('extractive_summary', ''))}")
                    
                    # Show first 100 characters of summary
                    summary = result.get('extractive_summary', '')
                    if summary:
                        preview = summary[:100] + "..." if len(summary) > 100 else summary
                        print(f"   Preview: {preview}")
                else:
                    print(f"❌ {target_lang.upper()}: No result returned")
                    
            except Exception as e:
                print(f"❌ {target_lang.upper()}: Failed - {e}")
        
        # Test translation functionality
        print(f"\n🔄 Testing Translation")
        print("-" * 25)
        
        try:
            multilingual_summarizer = summarizer._get_multilingual_summarizer()
            
            # Test translation from English to Spanish
            english_text = "This is a test of the translation system."
            spanish_translation = multilingual_summarizer.translate_text(
                english_text, 'en', 'es'
            )
            
            print(f"Original: {english_text}")
            print(f"Spanish:  {spanish_translation}")
            
            if spanish_translation and spanish_translation != english_text:
                print("✅ Translation working")
            else:
                print("❌ Translation failed or returned original text")
                
        except Exception as e:
            print(f"❌ Translation test failed: {e}")
        
        print(f"\n🎉 Multilingual testing completed!")
        
        # Cleanup
        try:
            summarizer.cleanup()
            print("✅ Cleanup completed")
        except Exception as e:
            print(f"⚠️  Cleanup warning: {e}")
            
    except Exception as e:
        print(f"❌ Critical error during testing: {e}")
        import traceback
        traceback.print_exc()

def test_basic_functionality():
    """Test basic functionality without async"""
    print("🔧 Testing Basic Functionality")
    print("=" * 30)
    
    try:
        summarizer = SummarizerService()
        
        # Test basic summarization
        test_text = test_texts['english']
        summary = summarizer.generate_summary(test_text, max_length=100)
        
        print(f"Original length: {len(test_text)} characters")
        print(f"Summary length: {len(summary)} characters")
        print(f"Summary: {summary[:200]}...")
        
        if summary and len(summary) > 0:
            print("✅ Basic summarization working")
        else:
            print("❌ Basic summarization failed")
            
    except Exception as e:
        print(f"❌ Basic functionality test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🧪 InstaBrief Multilingual Summarization Test Suite")
    print("=" * 55)
    
    # Test basic functionality first
    test_basic_functionality()
    
    print("\n" + "=" * 55)
    
    # Test multilingual functionality
    try:
        asyncio.run(test_multilingual_summarization())
    except Exception as e:
        print(f"❌ Async test failed: {e}")
        print("This might be due to missing dependencies or model loading issues.")
        print("Please ensure all requirements are installed:")
        print("pip install -r requirements.txt")
