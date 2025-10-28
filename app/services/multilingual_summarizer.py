"""
Multilingual Summarization Service using free open-source models
Supports 200+ languages using NLLB and mT5 models from Hugging Face
"""

import logging
import os
from typing import Dict, List, Optional, Tuple
import torch
from transformers import (
    AutoTokenizer, AutoModelForSeq2SeqLM,
    M2M100ForConditionalGeneration, M2M100Tokenizer,
    pipeline
)
from langdetect import detect, detect_langs
import warnings

# Suppress warnings for cleaner output
warnings.filterwarnings("ignore", category=UserWarning)
logging.getLogger("transformers").setLevel(logging.ERROR)

class MultilingualSummarizer:
    """
    Free multilingual summarization using open-source models:
    - NLLB-200 for translation (supports 200+ languages)
    - mT5 for multilingual summarization
    - Automatic language detection
    """
    
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.models = {}
        self.tokenizers = {}
        
        # Language mappings for NLLB (200+ languages supported)
        self.nllb_lang_codes = {
            # Major languages
            'en': 'eng_Latn', 'es': 'spa_Latn', 'fr': 'fra_Latn', 'de': 'deu_Latn',
            'it': 'ita_Latn', 'pt': 'por_Latn', 'ru': 'rus_Cyrl', 'zh': 'zho_Hans',
            'ja': 'jpn_Jpan', 'ko': 'kor_Hang', 'ar': 'arb_Arab', 'hi': 'hin_Deva',
            'tr': 'tur_Latn', 'pl': 'pol_Latn', 'nl': 'nld_Latn', 'sv': 'swe_Latn',
            'da': 'dan_Latn', 'no': 'nob_Latn', 'fi': 'fin_Latn', 'cs': 'ces_Latn',
            'sk': 'slk_Latn', 'hu': 'hun_Latn', 'ro': 'ron_Latn', 'bg': 'bul_Cyrl',
            'hr': 'hrv_Latn', 'sr': 'srp_Cyrl', 'sl': 'slv_Latn', 'et': 'est_Latn',
            'lv': 'lav_Latn', 'lt': 'lit_Latn', 'uk': 'ukr_Cyrl', 'be': 'bel_Cyrl',
            'mk': 'mkd_Cyrl', 'sq': 'sqi_Latn', 'mt': 'mlt_Latn', 'is': 'isl_Latn',
            'ga': 'gle_Latn', 'cy': 'cym_Latn', 'eu': 'eus_Latn', 'ca': 'cat_Latn',
            'gl': 'glg_Latn', 'ast': 'ast_Latn', 'oc': 'oci_Latn', 'br': 'bre_Latn',
            'co': 'cos_Latn', 'sc': 'srd_Latn', 'rm': 'roh_Latn', 'fur': 'fur_Latn',
            
            # Asian languages
            'th': 'tha_Thai', 'vi': 'vie_Latn', 'id': 'ind_Latn', 'ms': 'zsm_Latn',
            'tl': 'tgl_Latn', 'my': 'mya_Mymr', 'km': 'khm_Khmr', 'lo': 'lao_Laoo',
            'ka': 'kat_Geor', 'hy': 'hye_Armn', 'he': 'heb_Hebr', 'fa': 'pes_Arab',
            'ur': 'urd_Arab', 'bn': 'ben_Beng', 'ta': 'tam_Taml', 'te': 'tel_Telu',
            'kn': 'kan_Knda', 'ml': 'mal_Mlym', 'si': 'sin_Sinh', 'ne': 'npi_Deva',
            'mr': 'mar_Deva', 'gu': 'guj_Gujr', 'pa': 'pan_Guru', 'or': 'ory_Orya',
            'as': 'asm_Beng', 'sd': 'snd_Arab', 'ps': 'pbt_Arab', 'tg': 'tgk_Cyrl',
            'ky': 'kir_Cyrl', 'kk': 'kaz_Cyrl', 'uz': 'uzn_Latn', 'tk': 'tuk_Latn',
            'az': 'azj_Latn', 'mn': 'khk_Cyrl', 'bo': 'bod_Tibt', 'dz': 'dzo_Tibt',
            
            # African languages
            'sw': 'swh_Latn', 'am': 'amh_Ethi', 'ti': 'tir_Ethi', 'om': 'orm_Latn',
            'so': 'som_Latn', 'ha': 'hau_Latn', 'yo': 'yor_Latn', 'ig': 'ibo_Latn',
            'zu': 'zul_Latn', 'xh': 'xho_Latn', 'af': 'afr_Latn', 'st': 'sot_Latn',
            'tn': 'tsn_Latn', 'ss': 'ssw_Latn', 've': 'ven_Latn', 'ts': 'tso_Latn',
            'nr': 'nbl_Latn', 'rw': 'kin_Latn', 'rn': 'run_Latn', 'ny': 'nya_Latn',
            'sn': 'sna_Latn', 'lg': 'lug_Latn', 'ak': 'aka_Latn', 'tw': 'twi_Latn',
            'ee': 'ewe_Latn', 'ff': 'fuv_Latn', 'wo': 'wol_Latn', 'bm': 'bam_Latn',
            
            # American indigenous languages
            'qu': 'quy_Latn', 'gn': 'grn_Latn', 'ay': 'aym_Latn', 'nv': 'nav_Latn',
            'chr': 'chr_Cher', 'iu': 'iku_Cans', 'cr': 'cre_Cans', 'oj': 'ojb_Latn',
            
            # Pacific languages
            'mi': 'mri_Latn', 'sm': 'smo_Latn', 'to': 'ton_Latn', 'fj': 'fij_Latn',
            'ty': 'tah_Latn', 'haw': 'haw_Latn', 'ch': 'cha_Latn', 'mh': 'mah_Latn'
        }
        
        # Initialize models lazily
        self._summarizer = None
        self._translator = None
        self._language_detector = None
        
    def _get_summarizer(self):
        """Lazy load mT5 summarizer"""
        if self._summarizer is None:
            try:
                # Use mT5-small for efficiency while maintaining quality
                self._summarizer = pipeline(
                    "summarization",
                    model="google/mt5-small",
                    tokenizer="google/mt5-small",
                    device=0 if self.device == "cuda" else -1,
                    framework="pt"
                )
                logging.info("mT5 summarizer loaded successfully")
            except Exception as e:
                logging.error(f"Failed to load mT5 summarizer: {e}")
                # Fallback to a lighter model
                try:
                    self._summarizer = pipeline(
                        "summarization",
                        model="facebook/bart-large-cnn",
                        device=0 if self.device == "cuda" else -1
                    )
                    logging.info("Fallback to BART summarizer")
                except Exception as e2:
                    logging.error(f"Failed to load fallback summarizer: {e2}")
                    raise e2
        return self._summarizer
    
    def _get_translator(self):
        """Lazy load NLLB translator"""
        if self._translator is None:
            try:
                # Use NLLB-200-distilled for efficiency
                model_name = "facebook/nllb-200-distilled-600M"
                self.tokenizers['nllb'] = AutoTokenizer.from_pretrained(model_name)
                self.models['nllb'] = AutoModelForSeq2SeqLM.from_pretrained(model_name)
                
                if self.device == "cuda":
                    self.models['nllb'] = self.models['nllb'].to(self.device)
                
                logging.info("NLLB translator loaded successfully")
            except Exception as e:
                logging.error(f"Failed to load NLLB translator: {e}")
                # Fallback to M2M100
                try:
                    model_name = "facebook/m2m100_418M"
                    self.tokenizers['m2m'] = M2M100Tokenizer.from_pretrained(model_name)
                    self.models['m2m'] = M2M100ForConditionalGeneration.from_pretrained(model_name)
                    
                    if self.device == "cuda":
                        self.models['m2m'] = self.models['m2m'].to(self.device)
                    
                    logging.info("Fallback to M2M100 translator")
                except Exception as e2:
                    logging.error(f"Failed to load fallback translator: {e2}")
                    raise e2
        return True
    
    def detect_language(self, text: str) -> Tuple[str, float]:
        """
        Detect the language of input text
        Returns: (language_code, confidence)
        """
        try:
            # Use langdetect for fast detection
            detected_langs = detect_langs(text)
            if detected_langs:
                lang_code = detected_langs[0].lang
                confidence = detected_langs[0].prob
                return lang_code, confidence
            return 'en', 0.5
        except Exception as e:
            logging.warning(f"Language detection failed: {e}")
            return 'en', 0.5
    
    def translate_text(self, text: str, source_lang: str, target_lang: str) -> str:
        """
        Translate text using NLLB model
        """
        try:
            self._get_translator()
            
            # Map language codes to NLLB format
            src_code = self.nllb_lang_codes.get(source_lang, 'eng_Latn')
            tgt_code = self.nllb_lang_codes.get(target_lang, 'eng_Latn')
            
            if 'nllb' in self.models:
                tokenizer = self.tokenizers['nllb']
                model = self.models['nllb']
                
                # Set source language
                tokenizer.src_lang = src_code
                
                # Tokenize input
                inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
                
                if self.device == "cuda":
                    inputs = {k: v.to(self.device) for k, v in inputs.items()}
                
                # Generate translation
                with torch.no_grad():
                    generated_tokens = model.generate(
                        **inputs,
                        forced_bos_token_id=tokenizer.lang_code_to_id[tgt_code],
                        max_length=512,
                        num_beams=5,
                        early_stopping=True
                    )
                
                # Decode result
                translated = tokenizer.batch_decode(generated_tokens, skip_special_tokens=True)[0]
                return translated
                
            elif 'm2m' in self.models:
                # Fallback to M2M100
                tokenizer = self.tokenizers['m2m']
                model = self.models['m2m']
                
                tokenizer.src_lang = source_lang
                inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)
                
                if self.device == "cuda":
                    inputs = {k: v.to(self.device) for k, v in inputs.items()}
                
                with torch.no_grad():
                    generated_tokens = model.generate(**inputs, forced_bos_token_id=tokenizer.get_lang_id(target_lang))
                
                translated = tokenizer.batch_decode(generated_tokens, skip_special_tokens=True)[0]
                return translated
            
            return text  # Return original if translation fails
            
        except Exception as e:
            logging.error(f"Translation failed: {e}")
            return text
    
    def summarize_multilingual(
        self, 
        text: str, 
        target_language: str = 'en',
        max_length: int = 150,
        min_length: int = 30,
        summary_ratio: float = 0.3
    ) -> Dict[str, str]:
        """
        Generate multilingual summary
        
        Args:
            text: Input text to summarize
            target_language: Target language for summary
            max_length: Maximum summary length
            min_length: Minimum summary length
            summary_ratio: Ratio of original text to keep in summary
            
        Returns:
            Dictionary with original and translated summaries
        """
        try:
            # Detect input language
            detected_lang, confidence = self.detect_language(text)
            
            # Get summarizer
            summarizer = self._get_summarizer()
            
            # Calculate dynamic length based on input
            text_length = len(text.split())
            calculated_max = min(max_length, max(min_length, int(text_length * summary_ratio)))
            calculated_min = min(min_length, calculated_max // 2)
            
            # Generate summary in original language first
            summary_result = summarizer(
                text,
                max_length=calculated_max,
                min_length=calculated_min,
                do_sample=False,
                early_stopping=True
            )
            
            original_summary = summary_result[0]['summary_text']
            
            # If target language is different from detected language, translate
            if target_language != detected_lang and target_language != 'en':
                translated_summary = self.translate_text(
                    original_summary, 
                    detected_lang, 
                    target_language
                )
            else:
                translated_summary = original_summary
            
            return {
                'original_summary': original_summary,
                'translated_summary': translated_summary,
                'detected_language': detected_lang,
                'target_language': target_language,
                'confidence': confidence
            }
            
        except Exception as e:
            logging.error(f"Multilingual summarization failed: {e}")
            # Fallback to simple text truncation
            words = text.split()
            fallback_length = min(max_length // 5, len(words) // 4)
            fallback_summary = ' '.join(words[:fallback_length]) + '...'
            
            return {
                'original_summary': fallback_summary,
                'translated_summary': fallback_summary,
                'detected_language': 'en',
                'target_language': target_language,
                'confidence': 0.1
            }
    
    def get_supported_languages(self) -> List[Dict[str, str]]:
        """
        Get list of supported languages with their codes and names
        """
        languages = [
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
        ]
        
        return sorted(languages, key=lambda x: x['name'])
    
    def cleanup(self):
        """Clean up loaded models to free memory"""
        if hasattr(self, 'models'):
            for model in self.models.values():
                if hasattr(model, 'cpu'):
                    model.cpu()
                del model
        
        if hasattr(self, 'tokenizers'):
            for tokenizer in self.tokenizers.values():
                del tokenizer
        
        # Clear CUDA cache if available
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
