from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field
from bson import ObjectId
from app.services.storage import StorageService
from app.utils.security import get_current_user


router = APIRouter()
storage = StorageService()


class Article(BaseModel):
    id: str | None = None
    title: str
    content: str
    tags: List[str] = Field(default_factory=list)


@router.get("/", response_model=List[Article])
async def list_articles(tag: Optional[str] = None, q: Optional[str] = Query(default=None), semantic: bool = Query(default=False), skip: int = 0, limit: int = 20):
    if q:
        hits = await (storage.search_articles_semantic(q, size=limit) if semantic else storage.search_articles(q, size=limit))
        return [Article(id=h["id"], title=h.get("title", ""), content=h.get("content", ""), tags=h.get("tags", [])) for h in hits]
    
    # Use the new get_all_articles method
    articles = await storage.get_all_articles(skip=skip, limit=limit)
    return [Article(id=article["id"], title=article.get("title", ""), content=article.get("content", ""), tags=article.get("tags", [])) for article in articles]


@router.post("/", response_model=Article)
async def create_article(article: Article, user=Depends(get_current_user)):
    doc = article.model_dump(exclude_none=True)
    doc["owner_id"] = user["id"]
    doc.pop("id", None)
    new_id = await storage.save_article(doc, user_id=user["id"])
    return Article(id=new_id, **doc)


@router.get("/{article_id}", response_model=Article)
async def get_article(article_id: str):
    article = await storage.get_article_by_id(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return Article(id=article["id"], title=article["title"], content=article["content"], tags=article.get("tags", []))


@router.put("/{article_id}", response_model=Article)
async def update_article(article_id: str, article: Article, user=Depends(get_current_user)):
    update_doc = article.model_dump(exclude_none=True)
    update_doc.pop("id", None)
    result = await storage.db.articles.update_one({"_id": ObjectId(article_id)}, {"$set": update_doc})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Re-save the article to update keywords and embedding
    updated_article = await storage.get_article_by_id(article_id)
    if updated_article:
        # Remove the old document and save the updated one
        await storage.db.articles.delete_one({"_id": ObjectId(article_id)})
        update_doc["_id"] = ObjectId(article_id)
        await storage.save_article(update_doc, user_id=user["id"])
    
    return Article(id=article_id, **update_doc)


@router.delete("/{article_id}")
async def delete_article(article_id: str, user=Depends(get_current_user)):
    result = await storage.db.articles.delete_one({"_id": ObjectId(article_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Article not found")
    return {"deleted": True}


