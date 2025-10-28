from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
from app.services.summarizer import SummarizerService
from app.services.tts import TTSService
from app.services.storage import StorageService
from bson import ObjectId


router = APIRouter()
summarizer = SummarizerService()
tts_service = TTSService()
storage = StorageService()


class SummarizeRequest(BaseModel):
    text: str
    max_length: int | None = 150


@router.post("/")
async def summarize(payload: SummarizeRequest):
    if not payload.text:
        raise HTTPException(status_code=400, detail="Text is required")
    result = summarizer.generate_summary(payload.text, max_length=payload.max_length)
    doc = {"text": payload.text, "summary": result}
    res = await storage.db.summaries.insert_one(doc)
    return {"id": str(res.inserted_id), "summary": result}


@router.post("/tts")
async def summarize_tts(payload: SummarizeRequest):
    if not payload.text:
        raise HTTPException(status_code=400, detail="Text is required")
    summary = summarizer.generate_summary(payload.text, max_length=payload.max_length)
    audio = tts_service.synthesize(summary)
    return Response(content=audio, media_type="audio/mpeg")


@router.get("/")
async def list_summaries(skip: int = 0, limit: int = 20):
    cursor = storage.db.summaries.find({}).skip(skip).limit(limit)
    items = []
    async for doc in cursor:
        items.append({"id": str(doc["_id"]), "text": doc.get("text", ""), "summary": doc.get("summary", "")})
    return items


@router.get("/{summary_id}")
async def get_summary(summary_id: str):
    doc = await storage.db.summaries.find_one({"_id": ObjectId(summary_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return {"id": str(doc["_id"]), "text": doc.get("text", ""), "summary": doc.get("summary", "")}


@router.get("/{summary_id}/export")
async def export_summary(summary_id: str):
    doc = await storage.db.summaries.find_one({"_id": ObjectId(summary_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    content = (doc.get("summary") or "").encode("utf-8")
    return Response(content=content, media_type="text/plain", headers={"Content-Disposition": f"attachment; filename=summary-{summary_id}.txt"})


