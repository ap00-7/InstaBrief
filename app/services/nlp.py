from __future__ import annotations

import nltk
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.corpus import stopwords
import hashlib


class NLPService:
    def __init__(self):
        # Skip NLTK data downloads for now to avoid network/corruption issues
        self.nltk_available = False
        print("NLP Service initialized with fallback methods (NLTK disabled)")

    def extract_entities(self, text: str):
        """Simple entity extraction using NLTK or fallback"""
        if self.nltk_available:
            try:
                tokens = word_tokenize(text)
            except Exception:
                tokens = text.split()
        else:
            tokens = text.split()
        
        # Simple approach: return capitalized words as potential entities
        entities = []
        for token in tokens:
            if token[0].isupper() and len(token) > 2:
                entities.append((token, 'PERSON'))  # Simplified entity type
        return entities

    def compute_embedding(self, text: str):
        """Simple text embedding using hash-based approach"""
        # Create a simple hash-based embedding (384 dimensions to match original)
        hash_obj = hashlib.sha256(text.encode())
        hash_hex = hash_obj.hexdigest()
        
        # Convert hex to list of integers and normalize
        embedding = []
        for i in range(0, len(hash_hex), 2):
            if len(embedding) >= 384:
                break
            embedding.append(int(hash_hex[i:i+2], 16) / 255.0)
        
        # Pad or truncate to exactly 384 dimensions
        while len(embedding) < 384:
            embedding.append(0.0)
        
        return embedding[:384]

    def extract_keywords(self, text: str, num_keywords: int = 10):
        """Extract keywords using NLTK or fallback"""
        if self.nltk_available:
            try:
                tokens = word_tokenize(text.lower())
                stop_words = set(stopwords.words('english'))
            except Exception:
                tokens = text.lower().split()
                stop_words = set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'])
        else:
            tokens = text.lower().split()
            stop_words = set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'])
        
        # Filter out stopwords and short words
        keywords = [word for word in tokens if word.isalnum() and word not in stop_words and len(word) > 2]
        
        # Count frequency
        from collections import Counter
        keyword_freq = Counter(keywords)
        
        return [word for word, freq in keyword_freq.most_common(num_keywords)]


