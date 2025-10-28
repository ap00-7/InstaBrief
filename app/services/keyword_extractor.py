"""
Advanced Keyword Extraction Service
Supports KeyBERT, YAKE, and fallback methods for robust keyword extraction
"""

from typing import List, Dict, Any, Optional
import re
from collections import Counter
import logging

# Advanced keyword extraction imports with fallbacks
try:
    from keybert import KeyBERT
    KEYBERT_AVAILABLE = True
except ImportError:
    KeyBERT = None
    KEYBERT_AVAILABLE = False

try:
    import yake
    YAKE_AVAILABLE = True
except ImportError:
    yake = None
    YAKE_AVAILABLE = False

try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SentenceTransformer = None
    SENTENCE_TRANSFORMERS_AVAILABLE = False

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.decomposition import LatentDirichletAllocation
    SKLEARN_AVAILABLE = True
except ImportError:
    TfidfVectorizer = None
    LatentDirichletAllocation = None
    SKLEARN_AVAILABLE = False

try:
    import nltk
    from nltk.corpus import stopwords
    from nltk.tokenize import word_tokenize
    NLTK_AVAILABLE = True
except ImportError:
    nltk = None
    NLTK_AVAILABLE = False

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class KeywordExtractor:
    """
    Advanced keyword extraction using multiple methods:
    1. KeyBERT (semantic similarity)
    2. YAKE (statistical approach)
    3. TF-IDF (frequency-based)
    4. Simple frequency analysis (fallback)
    """
    
    def __init__(self):
        self.keybert_model = None
        self.sentence_model = None
        self._initialize_models()
        
    def _initialize_models(self):
        """Initialize available models with error handling"""
        try:
            if KEYBERT_AVAILABLE and SENTENCE_TRANSFORMERS_AVAILABLE:
                # Use a lightweight multilingual model
                self.sentence_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
                self.keybert_model = KeyBERT(model=self.sentence_model)
                logger.info("KeyBERT initialized successfully")
            else:
                logger.warning("KeyBERT not available, using fallback methods")
        except Exception as e:
            logger.warning(f"Failed to initialize KeyBERT: {e}")
            self.keybert_model = None
            
        # Initialize NLTK data if available
        if NLTK_AVAILABLE:
            try:
                nltk.data.find('tokenizers/punkt')
                nltk.data.find('corpora/stopwords')
            except LookupError:
                try:
                    nltk.download('punkt', quiet=True)
                    nltk.download('stopwords', quiet=True)
                except Exception as e:
                    logger.warning(f"Failed to download NLTK data: {e}")
    
    def extract_keywords(
        self, 
        text: str, 
        num_keywords: int = 10,
        method: str = "auto"
    ) -> List[Dict[str, Any]]:
        """
        Extract keywords using the best available method
        
        Args:
            text: Input text
            num_keywords: Number of keywords to extract
            method: "keybert", "yake", "tfidf", "frequency", or "auto"
            
        Returns:
            List of dictionaries with 'keyword' and 'score' keys
        """
        if not text or len(text.strip()) < 10:
            return []
            
        # Auto-select best available method
        if method == "auto":
            if self.keybert_model:
                method = "keybert"
            elif YAKE_AVAILABLE:
                method = "yake"
            elif SKLEARN_AVAILABLE:
                method = "tfidf"
            else:
                method = "frequency"
        
        try:
            if method == "keybert" and self.keybert_model:
                return self._extract_keybert(text, num_keywords)
            elif method == "yake" and YAKE_AVAILABLE:
                return self._extract_yake(text, num_keywords)
            elif method == "tfidf" and SKLEARN_AVAILABLE:
                return self._extract_tfidf(text, num_keywords)
            else:
                return self._extract_frequency(text, num_keywords)
        except Exception as e:
            logger.warning(f"Keyword extraction method '{method}' failed: {e}")
            # Fallback to simple frequency method
            return self._extract_frequency(text, num_keywords)
    
    def _extract_keybert(self, text: str, num_keywords: int) -> List[Dict[str, Any]]:
        """Extract keywords using KeyBERT (semantic approach)"""
        try:
            keywords = self.keybert_model.extract_keywords(
                text, 
                keyphrase_ngram_range=(1, 2),
                stop_words='english',
                top_k=num_keywords,
                use_maxsum=True,
                nr_candidates=20,
                diversity=0.5
            )
            
            return [
                {"keyword": kw[0], "score": float(kw[1]), "method": "keybert"}
                for kw in keywords
            ]
        except Exception as e:
            logger.error(f"KeyBERT extraction failed: {e}")
            return []
    
    def _extract_yake(self, text: str, num_keywords: int) -> List[Dict[str, Any]]:
        """Extract keywords using YAKE (statistical approach)"""
        try:
            # YAKE parameters
            kw_extractor = yake.KeywordExtractor(
                lan="en",
                n=2,  # n-gram size
                dedupLim=0.7,
                top=num_keywords,
                features=None
            )
            
            keywords = kw_extractor.extract_keywords(text)
            
            # YAKE returns lower scores for better keywords, so we invert them
            return [
                {
                    "keyword": kw[1], 
                    "score": 1.0 / (1.0 + kw[0]),  # Invert YAKE score
                    "method": "yake"
                }
                for kw in keywords
            ]
        except Exception as e:
            logger.error(f"YAKE extraction failed: {e}")
            return []
    
    def _extract_tfidf(self, text: str, num_keywords: int) -> List[Dict[str, Any]]:
        """Extract keywords using TF-IDF"""
        try:
            # Split text into sentences for TF-IDF
            sentences = re.split(r'[.!?]+', text)
            sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
            
            if len(sentences) < 2:
                return self._extract_frequency(text, num_keywords)
            
            # Create TF-IDF vectorizer
            vectorizer = TfidfVectorizer(
                max_features=num_keywords * 3,
                stop_words='english',
                ngram_range=(1, 2),
                min_df=1,
                max_df=0.8
            )
            
            tfidf_matrix = vectorizer.fit_transform(sentences)
            feature_names = vectorizer.get_feature_names_out()
            
            # Get average TF-IDF scores
            mean_scores = tfidf_matrix.mean(axis=0).A1
            
            # Sort by score
            keyword_scores = list(zip(feature_names, mean_scores))
            keyword_scores.sort(key=lambda x: x[1], reverse=True)
            
            return [
                {
                    "keyword": kw[0], 
                    "score": float(kw[1]),
                    "method": "tfidf"
                }
                for kw in keyword_scores[:num_keywords]
            ]
        except Exception as e:
            logger.error(f"TF-IDF extraction failed: {e}")
            return []
    
    def _extract_frequency(self, text: str, num_keywords: int) -> List[Dict[str, Any]]:
        """Extract keywords using simple frequency analysis (fallback)"""
        try:
            # Basic text preprocessing
            text = text.lower()
            text = re.sub(r'[^\w\s]', ' ', text)
            
            # Get stopwords
            if NLTK_AVAILABLE:
                try:
                    stop_words = set(stopwords.words('english'))
                except:
                    stop_words = self._get_basic_stopwords()
            else:
                stop_words = self._get_basic_stopwords()
            
            # Tokenize
            if NLTK_AVAILABLE:
                try:
                    words = word_tokenize(text)
                except:
                    words = text.split()
            else:
                words = text.split()
            
            # Filter words
            words = [
                word for word in words 
                if (len(word) > 2 and 
                    word.isalpha() and 
                    word not in stop_words)
            ]
            
            # Count frequencies
            word_freq = Counter(words)
            
            # Also extract 2-grams
            bigrams = []
            for i in range(len(words) - 1):
                bigram = f"{words[i]} {words[i+1]}"
                if len(bigram) > 5:  # Reasonable length
                    bigrams.append(bigram)
            
            bigram_freq = Counter(bigrams)
            
            # Combine and normalize scores
            all_keywords = []
            
            # Add unigrams
            max_unigram_freq = max(word_freq.values()) if word_freq else 1
            for word, freq in word_freq.most_common(num_keywords):
                all_keywords.append({
                    "keyword": word,
                    "score": freq / max_unigram_freq,
                    "method": "frequency"
                })
            
            # Add bigrams
            max_bigram_freq = max(bigram_freq.values()) if bigram_freq else 1
            for bigram, freq in bigram_freq.most_common(num_keywords // 2):
                all_keywords.append({
                    "keyword": bigram,
                    "score": freq / max_bigram_freq * 0.8,  # Slightly lower weight
                    "method": "frequency"
                })
            
            # Sort by score and return top keywords
            all_keywords.sort(key=lambda x: x['score'], reverse=True)
            return all_keywords[:num_keywords]
            
        except Exception as e:
            logger.error(f"Frequency extraction failed: {e}")
            return []
    
    def _get_basic_stopwords(self) -> set:
        """Get basic English stopwords as fallback"""
        return {
            'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
            'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
            'to', 'was', 'will', 'with', 'would', 'you', 'your', 'this', 'they',
            'we', 'or', 'but', 'not', 'have', 'had', 'can', 'could', 'should',
            'may', 'might', 'must', 'shall', 'do', 'does', 'did', 'been', 'being',
            'i', 'me', 'my', 'myself', 'our', 'ours', 'ourselves', 'him', 'his',
            'himself', 'she', 'her', 'hers', 'herself', 'them', 'their', 'theirs',
            'themselves', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when',
            'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most',
            'other', 'some', 'such', 'no', 'nor', 'only', 'own', 'same', 'so',
            'than', 'too', 'very', 'just', 'now', 'also', 'here', 'there', 'then'
        }
    
    def extract_entities(self, text: str) -> List[Dict[str, Any]]:
        """
        Extract named entities using available NLP libraries
        """
        entities = []
        
        try:
            # Try spaCy if available
            try:
                import spacy
                nlp = spacy.load("en_core_web_sm")
                doc = nlp(text)
                
                for ent in doc.ents:
                    entities.append({
                        "text": ent.text,
                        "label": ent.label_,
                        "start": ent.start_char,
                        "end": ent.end_char,
                        "method": "spacy"
                    })
                
                return entities
                
            except (ImportError, OSError):
                pass
            
            # Fallback: simple pattern-based entity extraction
            return self._extract_simple_entities(text)
            
        except Exception as e:
            logger.error(f"Entity extraction failed: {e}")
            return []
    
    def _extract_simple_entities(self, text: str) -> List[Dict[str, Any]]:
        """Simple pattern-based entity extraction as fallback"""
        entities = []
        
        # Pattern for potential person names (capitalized words)
        person_pattern = r'\b[A-Z][a-z]+ [A-Z][a-z]+\b'
        for match in re.finditer(person_pattern, text):
            entities.append({
                "text": match.group(),
                "label": "PERSON",
                "start": match.start(),
                "end": match.end(),
                "method": "pattern"
            })
        
        # Pattern for organizations (words with Corp, Inc, Ltd, etc.)
        org_pattern = r'\b[A-Z][a-zA-Z\s]+(Corp|Inc|Ltd|LLC|Company|Organization|Institute|University|College)\b'
        for match in re.finditer(org_pattern, text):
            entities.append({
                "text": match.group(),
                "label": "ORG",
                "start": match.start(),
                "end": match.end(),
                "method": "pattern"
            })
        
        # Pattern for dates
        date_pattern = r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b\d{4}[/-]\d{1,2}[/-]\d{1,2}\b'
        for match in re.finditer(date_pattern, text):
            entities.append({
                "text": match.group(),
                "label": "DATE",
                "start": match.start(),
                "end": match.end(),
                "method": "pattern"
            })
        
        return entities
    
    def get_available_methods(self) -> List[str]:
        """Get list of available keyword extraction methods"""
        methods = ["frequency"]  # Always available
        
        if self.keybert_model:
            methods.append("keybert")
        if YAKE_AVAILABLE:
            methods.append("yake")
        if SKLEARN_AVAILABLE:
            methods.append("tfidf")
            
        return methods
    
    def cleanup(self):
        """Clean up resources"""
        if self.keybert_model:
            del self.keybert_model
            self.keybert_model = None
        if self.sentence_model:
            del self.sentence_model
            self.sentence_model = None
