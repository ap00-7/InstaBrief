#!/usr/bin/env python3
import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.storage import StorageService

async def add_test_articles():
    storage = StorageService()
    
    test_articles = [
        {
            "title": "Introduction to Machine Learning",
            "content": "Machine learning is a subset of artificial intelligence that focuses on algorithms that can learn from data. It includes supervised learning, unsupervised learning, and reinforcement learning techniques.",
            "tags": ["machine learning", "AI", "algorithms", "data science"]
        },
        {
            "title": "Web Development Best Practices",
            "content": "Modern web development involves using frameworks like React, Vue, and Angular. Key practices include responsive design, performance optimization, and security considerations.",
            "tags": ["web development", "React", "JavaScript", "frontend"]
        },
        {
            "title": "Database Design Principles",
            "content": "Good database design follows normalization principles, ensures data integrity, and optimizes for performance. Key concepts include primary keys, foreign keys, and indexing strategies.",
            "tags": ["database", "SQL", "design", "performance"]
        },
        {
            "title": "Python Programming Guide",
            "content": "Python is a versatile programming language used for web development, data analysis, machine learning, and automation. It features clean syntax and extensive libraries.",
            "tags": ["Python", "programming", "automation", "data analysis"]
        },
        {
            "title": "Cloud Computing Overview",
            "content": "Cloud computing provides on-demand access to computing resources including servers, storage, databases, and software. Major providers include AWS, Azure, and Google Cloud.",
            "tags": ["cloud", "AWS", "Azure", "infrastructure"]
        }
    ]
    
    print("Adding test articles...")
    for article in test_articles:
        article_id = await storage.save_article(article)
        print(f"Added article: {article['title']} (ID: {article_id})")
    
    print("\nTest articles added successfully!")
    print("You can now test the search functionality.")

if __name__ == "__main__":
    asyncio.run(add_test_articles())
