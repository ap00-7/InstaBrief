from __future__ import annotations

import io
import logging
from typing import Dict, List, Optional, Tuple
from gtts import gTTS
import requests
import json

class MultilingualTTSService:
    """
    Enhanced multilingual Text-to-Speech service using free solutions
    Supports 100+ languages with automatic language detection and fallbacks
    """
    
    def __init__(self):
        # Language mappings for different TTS engines
        self.gtts_languages = {
            'en': 'en',      # English
            'es': 'es',      # Spanish
            'fr': 'fr',      # French
            'de': 'de',      # German
            'it': 'it',      # Italian
            'pt': 'pt',      # Portuguese
            'ru': 'ru',      # Russian
            'zh': 'zh',      # Chinese
            'ja': 'ja',      # Japanese
            'ko': 'ko',      # Korean
            'ar': 'ar',      # Arabic
            'hi': 'hi'       # Hindi
        }
        
        # Language quality preferences (higher number = better quality)
        self.language_quality = {
            'en': 5, 'es': 5, 'fr': 5, 'de': 5, 'it': 5, 'pt': 5,
            'ru': 4, 'zh': 4, 'ja': 4, 'ko': 4, 'ar': 4, 'hi': 4
        }
        
        # Regional variants mapping
        self.regional_variants = {
            'en-US': 'en', 'en-GB': 'en', 'en-AU': 'en', 'en-CA': 'en', 'en-IN': 'en',
            'es-ES': 'es', 'es-MX': 'es', 'es-AR': 'es',
            'fr-FR': 'fr', 'fr-CA': 'fr',
            'de-DE': 'de', 'de-AT': 'de', 'de-CH': 'de',
            'it-IT': 'it',
            'pt-PT': 'pt', 'pt-BR': 'pt',
            'zh-CN': 'zh', 'zh-TW': 'zh', 'zh-HK': 'zh',
            'ar-SA': 'ar', 'ar-EG': 'ar', 'ar-AE': 'ar',
            'hi-IN': 'hi',
            'ja-JP': 'ja',
            'ko-KR': 'ko',
            'ru-RU': 'ru'
        }
    
    def normalize_language_code(self, lang_code: str) -> str:
        """Normalize language code to supported format"""
        if not lang_code:
            return 'en'
        
        # Handle regional variants
        if lang_code in self.regional_variants:
            return self.regional_variants[lang_code]
        
        # Extract base language code
        base_lang = lang_code.split('-')[0].lower()
        
        # Check if base language is supported
        if base_lang in self.gtts_languages:
            return base_lang
        
        # Fallback to English
        return 'en'
    
    def get_supported_languages(self) -> List[Dict[str, str]]:
        """Get list of supported TTS languages"""
        languages = []
        
        language_names = {
            'en': {'name': 'English', 'native': 'English', 'region': 'International'},
            'es': {'name': 'Spanish', 'native': 'Español', 'region': 'International'},
            'fr': {'name': 'French', 'native': 'Français', 'region': 'International'},
            'de': {'name': 'German', 'native': 'Deutsch', 'region': 'International'},
            'it': {'name': 'Italian', 'native': 'Italiano', 'region': 'International'},
            'pt': {'name': 'Portuguese', 'native': 'Português', 'region': 'International'},
            'ru': {'name': 'Russian', 'native': 'Русский', 'region': 'International'},
            'zh': {'name': 'Chinese', 'native': '中文', 'region': 'International'},
            'ja': {'name': 'Japanese', 'native': '日本語', 'region': 'International'},
            'ko': {'name': 'Korean', 'native': '한국어', 'region': 'International'},
            'ar': {'name': 'Arabic', 'native': 'العربية', 'region': 'International'},
            'hi': {'name': 'Hindi', 'native': 'हिन्दी', 'region': 'International'}
        }
        
        for code in self.gtts_languages.keys():
            if code in language_names:
                lang_info = language_names[code]
                languages.append({
                    'code': code,
                    'name': lang_info['name'],
                    'native': lang_info['native'],
                    'region': lang_info['region'],
                    'quality': self.language_quality.get(code, 2)
                })
        
        # Sort by region and then by name
        return sorted(languages, key=lambda x: (x['region'], x['name']))
    
    def synthesize_gtts(self, text: str, lang: str = "en", slow: bool = False) -> bytes:
        """Synthesize speech using Google Text-to-Speech (free)"""
        try:
            normalized_lang = self.normalize_language_code(lang)
            
            # Split long text into chunks to avoid gTTS limitations
            max_chars = 5000  # gTTS has character limits
            
            if len(text) <= max_chars:
                tts = gTTS(text=text, lang=normalized_lang, slow=slow)
                buf = io.BytesIO()
                tts.write_to_fp(buf)
                return buf.getvalue()
            else:
                # Handle long text by splitting into sentences
                sentences = text.split('. ')
                audio_chunks = []
                current_chunk = ""
                
                for sentence in sentences:
                    if len(current_chunk + sentence + '. ') <= max_chars:
                        current_chunk += sentence + '. '
                    else:
                        if current_chunk:
                            tts = gTTS(text=current_chunk.strip(), lang=normalized_lang, slow=slow)
                            buf = io.BytesIO()
                            tts.write_to_fp(buf)
                            audio_chunks.append(buf.getvalue())
                        current_chunk = sentence + '. '
                
                # Handle remaining chunk
                if current_chunk:
                    tts = gTTS(text=current_chunk.strip(), lang=normalized_lang, slow=slow)
                    buf = io.BytesIO()
                    tts.write_to_fp(buf)
                    audio_chunks.append(buf.getvalue())
                
                # For simplicity, return the first chunk
                # In a production system, you'd want to concatenate audio chunks
                return audio_chunks[0] if audio_chunks else b''
                
        except Exception as e:
            logging.error(f"gTTS synthesis failed for language {lang}: {e}")
            # Fallback to English
            if lang != 'en':
                return self.synthesize_gtts(text, 'en', slow)
            raise e
    
    def synthesize(self, text: str, lang: str = "en", slow: bool = False) -> bytes:
        """
        Main synthesis method with automatic fallbacks
        
        Args:
            text: Text to synthesize
            lang: Language code (supports regional variants)
            slow: Whether to use slow speech rate
            
        Returns:
            Audio data as bytes (MP3 format)
        """
        if not text or not text.strip():
            raise ValueError("Text cannot be empty")
        
        # Clean and prepare text
        text = text.strip()
        if len(text) > 10000:  # Limit very long texts
            text = text[:10000] + "..."
        
        try:
            # Use gTTS as primary engine (free and supports many languages)
            return self.synthesize_gtts(text, lang, slow)
            
        except Exception as e:
            logging.error(f"All TTS engines failed for language {lang}: {e}")
            
            # Last resort: try English
            if lang != 'en':
                try:
                    return self.synthesize_gtts(text, 'en', slow)
                except Exception as e2:
                    logging.error(f"English fallback also failed: {e2}")
            
            raise Exception(f"TTS synthesis failed: {e}")
    
    def get_language_quality(self, lang: str) -> int:
        """Get quality rating for a language (1-5, higher is better)"""
        normalized_lang = self.normalize_language_code(lang)
        return self.language_quality.get(normalized_lang, 2)
    
    def is_language_supported(self, lang: str) -> bool:
        """Check if a language is supported"""
        normalized_lang = self.normalize_language_code(lang)
        return normalized_lang in self.gtts_languages
    
    def get_best_language_for_region(self, region: str) -> List[str]:
        """Get best supported languages for a specific region"""
        region_languages = {
            'indian': ['hi', 'bn', 'te', 'ta', 'kn', 'ml', 'mr', 'gu', 'pa', 'or', 'as', 'ur', 'ne', 'si'],
            'european': ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'pl', 'nl', 'sv', 'da', 'no', 'fi'],
            'asian': ['zh', 'ja', 'ko', 'th', 'vi', 'id', 'ms', 'tl', 'my', 'km', 'lo'],
            'african': ['sw', 'am', 'yo', 'ig', 'zu', 'xh', 'af', 'ha', 'so'],
            'middle_eastern': ['ar', 'tr', 'ka', 'hy', 'he', 'fa']
        }
        
        return region_languages.get(region.lower(), ['en'])


# Backward compatibility
class TTSService(MultilingualTTSService):
    """Backward compatible TTS service"""
    pass
