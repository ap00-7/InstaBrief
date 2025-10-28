from fastapi import APIRouter
from pydantic import BaseModel
from app.services.storage import StorageService


router = APIRouter()
storage = StorageService()


class Feedback(BaseModel):
    article_id: str
    helpful: bool
    comments: str | None = None


@router.post("/")
async def submit_feedback(payload: Feedback):
    doc = payload.model_dump()
    result = await storage.db.feedback.insert_one(doc)
    return {"id": str(result.inserted_id)}


