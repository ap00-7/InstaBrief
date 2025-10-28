from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import jwt, JWTError
from passlib.context import CryptContext
from config.settings import settings
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.services.storage import StorageService


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)


def create_access_token(subject: str, expires_minutes: Optional[int] = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes or settings.access_token_expire_minutes)
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


auth_scheme = HTTPBearer(auto_error=False)
storage_singleton = StorageService()


async def get_current_user(creds: HTTPAuthorizationCredentials | None = Depends(auth_scheme)):
    if not creds or not creds.scheme.lower() == 'bearer':
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = creds.credentials
    
    # Development bypass for testing
    if token == 'dev-token-bypass':
        # For development, create/find a user based on the login
        try:
            from bson import ObjectId
            
            # Default to John Doe for development
            target_email = "john.doe@example.com"
            target_first_name = "John"
            target_last_name = "Doe"
            
            # Look for existing user with this email
            existing_user = await storage_singleton.db.users.find_one({"email": target_email})
            
            if existing_user:
                return {
                    "id": str(existing_user["_id"]),
                    "email": existing_user.get("email", target_email),
                    "first_name": existing_user.get("first_name", target_first_name),
                    "last_name": existing_user.get("last_name", target_last_name)
                }
            
            # If user doesn't exist, create John Doe user
            user_doc = {
                "email": target_email,
                "first_name": target_first_name,
                "last_name": target_last_name,
                "password_hash": hash_password("password123"),
                "preferences": {
                    "language": "English",
                    "theme": "Light", 
                    "ai_model": "GPT-4 (Recommended)",
                    "auto_generate_tags": True
                }
            }
            result = await storage_singleton.db.users.insert_one(user_doc)
            
            return {
                "id": str(result.inserted_id),
                "email": target_email,
                "first_name": target_first_name,
                "last_name": target_last_name
            }
            
        except Exception as e:
            # Fallback to John Doe if database operations fail
            return {
                "id": "507f1f77bcf86cd799439011",  # Mock ObjectId
                "email": "john.doe@example.com",
                "first_name": "John",
                "last_name": "Doe"
            }
    
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id = payload.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await storage_singleton.db.users.find_one({"_id": __import__('bson').ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return {
            "id": user_id, 
            "email": user.get('email'),
            "first_name": user.get('first_name'),
            "last_name": user.get('last_name')
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


