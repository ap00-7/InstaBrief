"""
Language Detection Service
Automatically detects the language of input text using multiple methods
"""

import logging
from typing import Dict, List, Tuple, Optional
from langdetect import detect, detect_langs, LangDetectException
import re

class LanguageDetector:
    """
    Robust language detection service with fallback methods
    """
    
    def __init__(self):
        # Common language patterns for fallback detection
        self.language_patterns = {
            'ar': r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]',
            'zh': r'[\u4e00-\u9fff\u3400-\u4dbf\u20000-\u2a6df\u2a700-\u2b73f\u2b740-\u2b81f\u2b820-\u2ceaf]',
            'ja': r'[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]',
            'ko': r'[\uac00-\ud7af\u1100-\u11ff\u3130-\u318f\ua960-\ua97f\ud7b0-\ud7ff]',
            'hi': r'[\u0900-\u097f]',
            'ru': r'[\u0400-\u04ff]'
        }
        
        # Language confidence thresholds
        self.confidence_threshold = 0.7
        self.min_text_length = 10
        
    def detect_language(self, text: str) -> Tuple[str, float]:
        """
        Detect language with confidence score
        
        Args:
            text: Input text to analyze
            
        Returns:
            Tuple of (language_code, confidence_score)
        """
        if not text or len(text.strip()) < self.min_text_length:
            return 'en', 0.5
        
        # Clean text for better detection
        cleaned_text = self._clean_text(text)
        
        # Primary detection using langdetect
        try:
            detected_langs = detect_langs(cleaned_text)
            if detected_langs:
                primary_lang = detected_langs[0]
                
                # If confidence is high enough, return result
                if primary_lang.prob >= self.confidence_threshold:
                    return primary_lang.lang, primary_lang.prob
                
                # For lower confidence, try pattern matching as verification
                pattern_lang = self._detect_by_patterns(cleaned_text)
                if pattern_lang and pattern_lang == primary_lang.lang:
                    # Pattern confirms langdetect result
                    return primary_lang.lang, min(primary_lang.prob + 0.1, 1.0)
                elif pattern_lang:
                    # Pattern suggests different language
                    return pattern_lang, 0.8
                else:
                    # Use langdetect result even with lower confidence
                    return primary_lang.lang, primary_lang.prob
                    
        except LangDetectException as e:
            logging.warning(f"Language detection failed: {e}")
        
        # Fallback to pattern-based detection
        pattern_lang = self._detect_by_patterns(cleaned_text)
        if pattern_lang:
            return pattern_lang, 0.6
        
        # Final fallback to English
        return 'en', 0.3
    
    def detect_multiple_languages(self, text: str, top_n: int = 3) -> List[Tuple[str, float]]:
        """
        Detect multiple possible languages with confidence scores
        
        Args:
            text: Input text to analyze
            top_n: Number of top languages to return
            
        Returns:
            List of (language_code, confidence_score) tuples
        """
        if not text or len(text.strip()) < self.min_text_length:
            return [('en', 0.5)]
        
        cleaned_text = self._clean_text(text)
        results = []
        
        try:
            detected_langs = detect_langs(cleaned_text)
            results = [(lang.lang, lang.prob) for lang in detected_langs[:top_n]]
        except LangDetectException:
            # Fallback detection
            pattern_lang = self._detect_by_patterns(cleaned_text)
            if pattern_lang:
                results = [(pattern_lang, 0.6)]
            else:
                results = [('en', 0.3)]
        
        # Ensure we have at least one result
        if not results:
            results = [('en', 0.3)]
        
        return results
    
    def _clean_text(self, text: str) -> str:
        """
        Clean text for better language detection
        """
        # Remove URLs
        text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', text)
        
        # Remove email addresses
        text = re.sub(r'\S+@\S+', '', text)
        
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove numbers and special characters that don't help with language detection
        text = re.sub(r'[0-9\[\](){}.,;:!?"\'-]', ' ', text)
        
        return text.strip()
    
    def _detect_by_patterns(self, text: str) -> Optional[str]:
        """
        Detect language using character patterns
        """
        # Count characters for each language pattern
        pattern_scores = {}
        
        for lang_code, pattern in self.language_patterns.items():
            matches = len(re.findall(pattern, text))
            if matches > 0:
                # Calculate score based on match density
                score = matches / len(text) if text else 0
                pattern_scores[lang_code] = score
        
        if pattern_scores:
            # Return language with highest pattern score
            best_lang = max(pattern_scores, key=pattern_scores.get)
            if pattern_scores[best_lang] > 0.1:  # Minimum threshold
                return best_lang
        
        return None
    
    def is_supported_language(self, lang_code: str) -> bool:
        """
        Check if a language code is supported
        """
        supported_languages = {
            'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi'
        }
        return lang_code in supported_languages
    
    def get_language_info(self, lang_code: str) -> Dict[str, str]:
        """
        Get detailed information about a language
        """
        language_info = {
            'en': {'name': 'English', 'native': 'English', 'family': 'Germanic'},
            'es': {'name': 'Spanish', 'native': 'Español', 'family': 'Romance'},
            'fr': {'name': 'French', 'native': 'Français', 'family': 'Romance'},
            'de': {'name': 'German', 'native': 'Deutsch', 'family': 'Germanic'},
            'it': {'name': 'Italian', 'native': 'Italiano', 'family': 'Romance'},
            'pt': {'name': 'Portuguese', 'native': 'Português', 'family': 'Romance'},
            'ru': {'name': 'Russian', 'native': 'Русский', 'family': 'Slavic'},
            'zh': {'name': 'Chinese', 'native': '中文', 'family': 'Sino-Tibetan'},
            'ja': {'name': 'Japanese', 'native': '日本語', 'family': 'Japonic'},
            'ko': {'name': 'Korean', 'native': '한국어', 'family': 'Koreanic'},
            'ar': {'name': 'Arabic', 'native': 'العربية', 'family': 'Semitic'},
            'hi': {'name': 'Hindi', 'native': 'हिन्दी', 'family': 'Indo-Aryan'}
        }
        
        return language_info.get(lang_code, {
            'name': lang_code.upper(),
            'native': lang_code.upper(),
            'family': 'Unknown'
        })
