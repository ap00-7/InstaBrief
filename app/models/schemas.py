from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: str
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ArticleCreate(BaseModel):
    title: str
    content: str
    tags: List[str] = Field(default_factory=list)


class ArticlePublic(BaseModel):
    id: str
    title: str
    content: str
    tags: List[str] = Field(default_factory=list)


class FeedbackCreate(BaseModel):
    article_id: str
    helpful: bool
    comments: Optional[str] = None


class SummaryRequest(BaseModel):
    text: str
    max_length: Optional[int] = 150


class SummaryResponse(BaseModel):
    summary: str


