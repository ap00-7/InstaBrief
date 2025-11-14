"""
Smart Summarizer using free lightweight models and Hugging Face Inference API
Memory-efficient and provides excellent summarization quality
"""

import os
import requests
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)


class SmartSummarizer:
    """
    Memory-efficient summarizer using Hugging Face Inference API (free tier)
    Falls back to local lightweight models if API unavailable
    """
    
    def __init__(self):
        # Hugging Face API token (optional - works without it on free tier)
        self.hf_token = os.getenv("HUGGINGFACE_API_TOKEN", None)
        self.hf_api_url = "https://api-inference.huggingface.co/models/"
        
        # Best free models for summarization (ranked by quality/speed)
        self.models = {
            "best": "facebook/bart-large-cnn",  # Best quality, slower
            "balanced": "sshleifer/distilbart-cnn-12-6",  # Good balance
            "fast": "t5-small",  # Fastest, lightweight
            "long": "pszemraj/long-t5-tglobal-base-16384-book-summary",  # For long docs
        }
        
        self.current_model = "balanced"  # Default to balanced
        
    def generate_summary(
        self, 
        text: str, 
        max_length: int = 150,
        min_length: int = 30,
        quality: str = "balanced"
    ) -> str:
        """
        Generate summary using Hugging Face Inference API
        
        Args:
            text: Input text to summarize
            max_length: Maximum summary length
            min_length: Minimum summary length  
            quality: "best", "balanced", "fast", or "long"
            
        Returns:
            Summary text
        """
        if not text or not text.strip():
            return ""
        
        # Choose model based on quality setting
        model_name = self.models.get(quality, self.models["balanced"])
        
        try:
            # Try API first (no local memory needed!)
            logger.info(f"Using HuggingFace API with {model_name}")
            summary = self._summarize_with_api(text, model_name, max_length, min_length)
            
            if summary:
                logger.info(f"API summarization successful: {len(summary)} chars")
                return summary
                
        except Exception as e:
            logger.warning(f"API summarization failed: {e}, falling back to extractive")
        
        # Fallback to simple extractive if API fails
        return self._fallback_extractive(text, max_length)
    
    def _summarize_with_api(
        self, 
        text: str, 
        model: str, 
        max_length: int,
        min_length: int
    ) -> Optional[str]:
        """
        Use Hugging Face Inference API (free tier)
        No local model loading required!
        """
        api_url = f"{self.hf_api_url}{model}"
        
        headers = {}
        if self.hf_token:
            headers["Authorization"] = f"Bearer {self.hf_token}"
        
        # Prepare payload
        payload = {
            "inputs": text[:4096],  # Limit input size for API
            "parameters": {
                "max_length": max_length,
                "min_length": min_length,
                "do_sample": False,
                "early_stopping": True,
            },
            "options": {
                "wait_for_model": True  # Wait if model is loading
            }
        }
        
        try:
            response = requests.post(
                api_url, 
                headers=headers, 
                json=payload,
                timeout=30  # 30 second timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                
                # Handle different response formats
                if isinstance(result, list) and len(result) > 0:
                    if isinstance(result[0], dict) and 'summary_text' in result[0]:
                        return result[0]['summary_text']
                    elif isinstance(result[0], dict) and 'generated_text' in result[0]:
                        return result[0]['generated_text']
                elif isinstance(result, dict):
                    if 'summary_text' in result:
                        return result['summary_text']
                    elif 'generated_text' in result:
                        return result['generated_text']
                
                logger.warning(f"Unexpected API response format: {result}")
                return None
                
            elif response.status_code == 503:
                # Model is loading, wait and retry once
                logger.info("Model loading, waiting...")
                import time
                time.sleep(5)
                
                response = requests.post(api_url, headers=headers, json=payload, timeout=30)
                if response.status_code == 200:
                    result = response.json()
                    if isinstance(result, list) and len(result) > 0:
                        return result[0].get('summary_text') or result[0].get('generated_text')
                
            logger.warning(f"API request failed: {response.status_code} - {response.text}")
            return None
            
        except requests.exceptions.Timeout:
            logger.warning("API request timed out after 30s")
            return None
        except Exception as e:
            logger.error(f"API request error: {e}")
            return None
    
    def _fallback_extractive(self, text: str, max_length: int) -> str:
        """
        Simple extractive summarization as fallback
        Takes first sentences up to max_length
        """
        sentences = [s.strip() + '.' for s in text.split('.') if s.strip()]
        
        if not sentences:
            return text[:max_length]
        
        # Calculate how many sentences to include
        words_per_sentence = len(text.split()) / len(sentences) if sentences else 20
        target_sentences = max(2, min(len(sentences), int(max_length / (words_per_sentence * 4))))
        
        # Take sentences from beginning, middle, and end for better coverage
        if target_sentences >= len(sentences):
            summary = ' '.join(sentences)
        else:
            begin = max(1, target_sentences // 2)
            middle = max(1, target_sentences // 3)
            end = max(1, target_sentences - begin - middle)
            
            beginning_sentences = sentences[:begin]
            middle_start = len(sentences) // 3
            middle_sentences = sentences[middle_start:middle_start + middle]
            end_sentences = sentences[-end:] if end > 0 else []
            
            summary = ' '.join(beginning_sentences + middle_sentences + end_sentences)
        
        # Truncate if still too long
        if len(summary) > max_length * 1.5:
            summary = summary[:max_length].rsplit(' ', 1)[0] + "..."
        
        return summary.strip()
    
    def generate_abstractive_summary(
        self, 
        text: str, 
        max_length: int = 150
    ) -> str:
        """
        Generate abstractive summary (rephrased, not just extracted)
        Uses best quality model
        """
        return self.generate_summary(text, max_length, quality="best")
    
    def generate_extractive_summary(
        self, 
        text: str, 
        max_length: int = 150
    ) -> str:
        """
        Generate extractive summary (important sentences extracted)
        Fast and reliable
        """
        return self._fallback_extractive(text, max_length)
    
    def generate_both_summaries(
        self, 
        text: str, 
        max_length: int = 150
    ) -> Dict[str, str]:
        """
        Generate both extractive and abstractive summaries
        
        Returns:
            Dict with 'extractive' and 'abstractive' keys
        """
        # For efficiency, generate abstractive first (uses API)
        abstractive = self.generate_abstractive_summary(text, max_length)
        
        # Generate extractive using fast local method
        extractive = self.generate_extractive_summary(text, max_length)
        
        return {
            'extractive': extractive,
            'abstractive': abstractive
        }


# Example usage
if __name__ == "__main__":
    summarizer = SmartSummarizer()
    
    test_text = """
    Artificial intelligence (AI) is intelligence demonstrated by machines, in contrast to the natural 
    intelligence displayed by humans and animals. Leading AI textbooks define the field as the study of 
    "intelligent agents": any device that perceives its environment and takes actions that maximize its 
    chance of successfully achieving its goals. Colloquially, the term "artificial intelligence" is often 
    used to describe machines that mimic "cognitive" functions that humans associate with the human mind, 
    such as "learning" and "problem solving". As machines become increasingly capable, tasks considered 
    to require "intelligence" are often removed from the definition of AI, a phenomenon known as the AI 
    effect. A quip in Tesler's Theorem says "AI is whatever hasn't been done yet."
    """
    
    print("Testing Smart Summarizer:")
    print("\n1. Balanced quality:")
    summary = summarizer.generate_summary(test_text, max_length=100, quality="balanced")
    print(f"Summary: {summary}")
    print(f"Length: {len(summary)} chars")
    
    print("\n2. Both summaries:")
    both = summarizer.generate_both_summaries(test_text, max_length=100)
    print(f"Extractive: {both['extractive']}")
    print(f"Abstractive: {both['abstractive']}")

