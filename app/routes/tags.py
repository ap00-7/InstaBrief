from fastapi import APIRouter
from app.services.storage import StorageService


router = APIRouter()
storage = StorageService()


@router.get('/')
async def list_tags(limit: int = 20):
  pipeline = [
    { '$unwind': { 'path': '$tags', 'preserveNullAndEmptyArrays': False } },
    { '$group': { '_id': '$tags', 'count': { '$sum': 1 } } },
    { '$sort': { 'count': -1 } },
    { '$limit': limit },
  ]
  tags = []
  async for row in storage.db.articles.aggregate(pipeline):
    tags.append({ 'tag': row['_id'], 'count': row['count'] })
  return tags


