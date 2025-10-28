from __future__ import annotations

from typing import Optional, Dict, Any
import nltk
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lsa import LsaSummarizer
from sumy.summarizers.text_rank import TextRankSummarizer
from sumy.nlp.stemmers import Stemmer
from sumy.utils import get_stop_words

# Import our new multilingual services with fallbacks
try:
    from .multilingual_summarizer import MultilingualSummarizer
    MULTILINGUAL_AVAILABLE = True
except ImportError as e:
    print(f"Multilingual summarizer not available: {e}")
    MultilingualSummarizer = None
    MULTILINGUAL_AVAILABLE = False

try:
    from .language_detector import LanguageDetector
    LANGUAGE_DETECTOR_AVAILABLE = True
except ImportError as e:
    print(f"Language detector not available: {e}")
    LanguageDetector = None
    LANGUAGE_DETECTOR_AVAILABLE = False


class SummarizerService:
    def __init__(self) -> None:
        # Download required NLTK data with error handling
        try:
            try:
                nltk.data.find('tokenizers/punkt')
            except (LookupError, Exception):
                try:
                    nltk.download('punkt', quiet=True)
                except Exception as e:
                    print(f"Warning: Failed to download NLTK punkt data: {e}")
            
            try:
                nltk.data.find('tokenizers/punkt_tab')
            except (LookupError, Exception):
                try:
                    nltk.download('punkt_tab', quiet=True)
                except Exception as e:
                    print(f"Warning: Failed to download NLTK punkt_tab data: {e}")
        except Exception as e:
            print(f"Warning: NLTK initialization had issues: {e}. Continuing with fallback methods.")
        
        # Initialize multilingual services (if available)
        self.multilingual_summarizer = None
        if LANGUAGE_DETECTOR_AVAILABLE:
            self.language_detector = LanguageDetector()
        else:
            self.language_detector = None
        
    def _get_multilingual_summarizer(self):
        """Lazy load multilingual summarizer to save memory"""
        if not MULTILINGUAL_AVAILABLE:
            return None
        if self.multilingual_summarizer is None:
            self.multilingual_summarizer = MultilingualSummarizer()
        return self.multilingual_summarizer

    def generate_summary(self, text: str, max_length: Optional[int] = 150) -> str:
        """Generate summary using extractive summarization with dynamic length control"""
        if not text.strip():
            return ""
        
        # Parse the text
        parser = PlaintextParser.from_string(text, Tokenizer("english"))
        stemmer = Stemmer("english")
        
        # Use TextRank summarizer
        summarizer = TextRankSummarizer(stemmer)
        summarizer.stop_words = get_stop_words("english")
        
        # Calculate number of sentences to extract
        sentences = parser.document.sentences
        total_sentences = len(sentences)
        
        if total_sentences <= 2:
            return text
        
        # IMPROVED length calculation - be more generous with longer summaries
        if max_length:
            if max_length <= 100:  # Very short
                num_sentences = max(1, min(2, total_sentences // 10))
            elif max_length <= 300:  # Short
                num_sentences = max(2, min(5, int(total_sentences * 0.15)))
            elif max_length <= 600:  # Medium  
                num_sentences = max(3, min(10, int(total_sentences * 0.30)))
            else:  # Long = be much more generous
                num_sentences = max(5, min(int(total_sentences * 0.60), total_sentences - 1))
        else:
            # Default: ~30% of sentences (more generous)
            num_sentences = max(2, int(total_sentences * 0.30))
        
        # Ensure we don't exceed available sentences
        num_sentences = min(num_sentences, total_sentences - 1)
        
        print(f"SummarizerService: Using {num_sentences} sentences from {total_sentences} total (max_length={max_length})")
        
        # Generate summary
        summary_sentences = summarizer(parser.document, num_sentences)
        summary = " ".join([str(sentence) for sentence in summary_sentences])
        
        # Be less aggressive with truncation for longer summaries
        if max_length and max_length <= 200 and len(summary) > max_length * 1.2:
            # Only truncate very short summaries if they exceed by 20%
            sentences_list = summary.split('. ')
            truncated = sentences_list[0]
            if len(truncated) > max_length:
                truncated = truncated[:max_length].rsplit(' ', 1)[0] + "..."
            else:
                truncated += "."
            summary = truncated
        elif max_length and max_length > 200 and len(summary) > max_length * 2:
            # For longer summaries, allow much more overflow (2x)
            summary = summary[:int(max_length * 1.8)].rsplit(' ', 1)[0] + "..."
        
        return summary.strip()

    def generate_summary_lsa(self, text: str, max_length: Optional[int] = 150) -> str:
        """Alternative summarization using LSA"""
        if not text.strip():
            return ""
        
        parser = PlaintextParser.from_string(text, Tokenizer("english"))
        stemmer = Stemmer("english")
        
        summarizer = LsaSummarizer(stemmer)
        summarizer.stop_words = get_stop_words("english")
        
        sentences = parser.document.sentences
        if len(sentences) <= 2:
            return text
        
        num_sentences = max(1, min(len(sentences) // 3, int(max_length / (len(text) / len(sentences))) if max_length else 3))
        
        summary_sentences = summarizer(parser.document, num_sentences)
        summary = " ".join([str(sentence) for sentence in summary_sentences])
        
        if max_length and len(summary) > max_length:
            summary = summary[:max_length].rsplit(' ', 1)[0] + "..."
        
        return summary.strip()

    def generate_multilingual_summary(
        self, 
        text: str, 
        target_language: str = 'en',
        max_length: Optional[int] = 150,
        summary_type: str = 'extractive'
    ) -> Dict[str, Any]:
        """
        Generate multilingual summary with language detection and translation
        
        Args:
            text: Input text to summarize
            target_language: Target language for the summary
            max_length: Maximum summary length
            summary_type: 'extractive', 'abstractive', or 'both'
            
        Returns:
            Dictionary containing summaries, language info, and metadata
        """
        if not text.strip():
            return {
                'extractive_summary': '',
                'abstractive_summary': '',
                'detected_language': 'en',
                'target_language': target_language,
                'confidence': 0.0
            }
        
        # Detect input language (with fallback)
        if self.language_detector:
            detected_lang, confidence = self.language_detector.detect_language(text)
            language_info = self.language_detector.get_language_info(detected_lang)
        else:
            detected_lang, confidence = 'en', 0.5
            language_info = {'name': 'English', 'native': 'English', 'family': 'Germanic'}
        
        result = {
            'detected_language': detected_lang,
            'target_language': target_language,
            'confidence': confidence,
            'language_info': language_info
        }
        
        # Generate extractive summary using traditional method (fast and reliable)
        if summary_type in ['extractive', 'both']:
            extractive_summary = self.generate_summary(text, max_length)
            result['extractive_summary'] = extractive_summary
        
        # Generate abstractive summary using multilingual AI (if requested)
        if summary_type in ['abstractive', 'both']:
            try:
                multilingual_summarizer = self._get_multilingual_summarizer()
                if multilingual_summarizer:
                    ai_result = multilingual_summarizer.summarize_multilingual(
                        text, 
                        target_language=target_language,
                        max_length=max_length
                    )
                    result['abstractive_summary'] = ai_result.get('translated_summary', '')
                    result['original_abstractive'] = ai_result.get('original_summary', '')
                else:
                    # Fallback to extractive if multilingual not available
                    result['abstractive_summary'] = result.get('extractive_summary', '')
                    result['error'] = "Multilingual AI not available"
            except Exception as e:
                # Fallback to extractive if AI summarization fails
                result['abstractive_summary'] = result.get('extractive_summary', '')
                result['error'] = f"AI summarization failed: {str(e)}"
        
        # If target language is different from detected language, translate extractive summary
        if (target_language != detected_lang and 
            target_language != 'en' and 
            'extractive_summary' in result):
            try:
                multilingual_summarizer = self._get_multilingual_summarizer()
                translated = multilingual_summarizer.translate_text(
                    result['extractive_summary'],
                    detected_lang,
                    target_language
                )
                result['translated_extractive'] = translated
            except Exception as e:
                result['translated_extractive'] = result['extractive_summary']
                result['translation_error'] = f"Translation failed: {str(e)}"
        
        return result
    
    def detect_language(self, text: str) -> Dict[str, Any]:
        """
        Detect the language of input text
        
        Args:
            text: Input text to analyze
            
        Returns:
            Dictionary with language detection results
        """
        if self.language_detector:
            detected_lang, confidence = self.language_detector.detect_language(text)
            multiple_langs = self.language_detector.detect_multiple_languages(text, top_n=3)
            language_info = self.language_detector.get_language_info(detected_lang)
            is_supported = self.language_detector.is_supported_language(detected_lang)
        else:
            detected_lang, confidence = 'en', 0.5
            multiple_langs = [('en', 0.5)]
            language_info = {'name': 'English', 'native': 'English', 'family': 'Germanic'}
            is_supported = True
        
        return {
            'primary_language': detected_lang,
            'confidence': confidence,
            'possible_languages': multiple_langs,
            'language_info': language_info,
            'is_supported': is_supported
        }
    
    def get_supported_languages(self) -> Dict[str, Any]:
        """
        Get list of all supported languages
        
        Returns:
            Dictionary with supported languages and their information
        """
        try:
            multilingual_summarizer = self._get_multilingual_summarizer()
            if multilingual_summarizer:
                languages = multilingual_summarizer.get_supported_languages()
            else:
                raise Exception("Multilingual summarizer not available")
            
            return {
                'languages': languages,
                'total_count': len(languages),
                'categories': {
                    'major': [lang for lang in languages if lang['code'] in ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi']],
                    'european': [lang for lang in languages if lang['code'] in ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'pl', 'nl', 'sv', 'da', 'no', 'fi', 'cs', 'sk', 'hu', 'ro', 'bg', 'hr', 'sr', 'sl', 'et', 'lv', 'lt', 'uk', 'be', 'mk', 'sq', 'mt', 'is', 'ga', 'cy', 'eu', 'ca', 'gl']],
                    'asian': [lang for lang in languages if lang['code'] in ['zh', 'ja', 'ko', 'hi', 'th', 'vi', 'id', 'ms', 'tl', 'my', 'km', 'lo', 'bn', 'ta', 'te', 'kn', 'ml', 'si', 'ne', 'mr', 'gu', 'pa', 'or', 'as']],
                    'african': [lang for lang in languages if lang['code'] in ['sw', 'am', 'ti', 'om', 'so', 'ha', 'yo', 'ig', 'zu', 'xh', 'af']],
                    'middle_eastern': [lang for lang in languages if lang['code'] in ['ar', 'he', 'fa', 'ur', 'tr', 'ka', 'hy']],
                    'indigenous': [lang for lang in languages if lang['code'] in ['qu', 'gn', 'mi', 'haw']]
                }
            }
        except Exception as e:
            # Fallback to basic language list
            return {
                'languages': [
                    {'code': 'en', 'name': 'English', 'native': 'English'},
                    {'code': 'es', 'name': 'Spanish', 'native': 'Español'},
                    {'code': 'fr', 'name': 'French', 'native': 'Français'},
                    {'code': 'de', 'name': 'German', 'native': 'Deutsch'},
                    {'code': 'it', 'name': 'Italian', 'native': 'Italiano'},
                    {'code': 'pt', 'name': 'Portuguese', 'native': 'Português'},
                    {'code': 'ru', 'name': 'Russian', 'native': 'Русский'},
                    {'code': 'zh', 'name': 'Chinese', 'native': '中文'},
                    {'code': 'ja', 'name': 'Japanese', 'native': '日本語'},
                    {'code': 'ko', 'name': 'Korean', 'native': '한국어'},
                    {'code': 'ar', 'name': 'Arabic', 'native': 'العربية'},
                    {'code': 'hi', 'name': 'Hindi', 'native': 'हिन्दी'}
                ],
                'total_count': 12,
                'error': str(e)
            }
    
    def cleanup(self):
        """Clean up resources"""
        if self.multilingual_summarizer:
            self.multilingual_summarizer.cleanup()
            self.multilingual_summarizer = None


