from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr
from bson import ObjectId
from app.services.storage import StorageService
from app.utils.security import hash_password, verify_password, create_access_token
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from starlette.responses import RedirectResponse
import httpx
import os

config = Config('.env')
oauth = OAuth(config)

# Configure Google OAuth
oauth.register(
    name='google',
    client_id=config('GOOGLE_CLIENT_ID', default=''),
    client_secret=config('GOOGLE_CLIENT_SECRET', default=''),
    server_metadata_url='https://accounts.google.com/.well-known/openid_configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

# Configure Microsoft OAuth
oauth.register(
    name='microsoft',
    client_id=config('MICROSOFT_CLIENT_ID', default=''),
    client_secret=config('MICROSOFT_CLIENT_SECRET', default=''),
    server_metadata_url='https://login.microsoftonline.com/common/v2.0/.well-known/openid_configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

router = APIRouter()
storage = StorageService()


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str = ""
    last_name: str = ""


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class OAuthCallbackRequest(BaseModel):
    code: str
    state: str
    provider: str


@router.post("/register")
async def register(payload: RegisterRequest):
    existing = await storage.db.users.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_doc = {
        "email": payload.email, 
        "password_hash": hash_password(payload.password),
        "first_name": payload.first_name,
        "last_name": payload.last_name,
        "auth_provider": "local"
    }
    result = await storage.db.users.insert_one(user_doc)
    return {"id": str(result.inserted_id), "email": payload.email}


@router.post("/login")
async def login(payload: LoginRequest):
    user = await storage.db.users.find_one({"email": payload.email})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    token = create_access_token(str(user["_id"]))
    return {"access_token": token, "token_type": "bearer"}


@router.get("/oauth/{provider}")
async def oauth_login(provider: str, request: Request):
    if provider not in ['google', 'microsoft']:
        raise HTTPException(status_code=400, detail="Unsupported provider")
    
    client = oauth.create_client(provider)
    redirect_uri = f"{request.url.scheme}://{request.url.netloc}/auth/oauth/{provider}/callback"
    return await client.authorize_redirect(request, redirect_uri)


@router.get("/oauth/{provider}/callback")
async def oauth_callback(provider: str, request: Request):
    if provider not in ['google', 'microsoft']:
        raise HTTPException(status_code=400, detail="Unsupported provider")
    
    client = oauth.create_client(provider)
    try:
        token = await client.authorize_access_token(request)
        user_info = token.get('userinfo')
        
        if not user_info:
            # Fetch user info manually if not in token
            if provider == 'google':
                resp = await client.get('https://www.googleapis.com/oauth2/v2/userinfo', token=token)
                user_info = resp.json()
            elif provider == 'microsoft':
                resp = await client.get('https://graph.microsoft.com/v1.0/me', token=token)
                user_info = resp.json()
        
        email = user_info.get('email')
        if not email:
            raise HTTPException(status_code=400, detail="Email not provided by OAuth provider")
        
        # Check if user exists
        existing_user = await storage.db.users.find_one({"email": email})
        
        if existing_user:
            # User exists, log them in
            user_id = str(existing_user["_id"])
        else:
            # Create new user
            user_doc = {
                "email": email,
                "first_name": user_info.get('given_name', ''),
                "last_name": user_info.get('family_name', ''),
                "auth_provider": provider,
                "oauth_id": user_info.get('id', user_info.get('sub', '')),
                "picture": user_info.get('picture', '')
            }
            result = await storage.db.users.insert_one(user_doc)
            user_id = str(result.inserted_id)
        
        # Create JWT token
        access_token = create_access_token(user_id)
        
        # Redirect to frontend with token
        return RedirectResponse(
            url=f"http://localhost:3000/auth/callback?token={access_token}",
            status_code=302
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth authentication failed: {str(e)}")


@router.post("/oauth/token")
async def oauth_token_exchange(payload: OAuthCallbackRequest):
    """Handle OAuth token exchange for frontend"""
    try:
        if payload.provider == 'google':
            # Exchange code for token with Google
            async with httpx.AsyncClient() as client:
                token_response = await client.post(
                    'https://oauth2.googleapis.com/token',
                    data={
                        'client_id': config('GOOGLE_CLIENT_ID'),
                        'client_secret': config('GOOGLE_CLIENT_SECRET'),
                        'code': payload.code,
                        'grant_type': 'authorization_code',
                        'redirect_uri': 'http://localhost:3000/auth/callback'
                    }
                )
                token_data = token_response.json()
                
                if 'access_token' not in token_data:
                    raise HTTPException(status_code=400, detail="Failed to get access token")
                
                # Get user info
                user_response = await client.get(
                    'https://www.googleapis.com/oauth2/v2/userinfo',
                    headers={'Authorization': f'Bearer {token_data["access_token"]}'}
                )
                user_info = user_response.json()
                
        elif payload.provider == 'microsoft':
            # Exchange code for token with Microsoft
            async with httpx.AsyncClient() as client:
                token_response = await client.post(
                    'https://login.microsoftonline.com/common/oauth2/v2.0/token',
                    data={
                        'client_id': config('MICROSOFT_CLIENT_ID'),
                        'client_secret': config('MICROSOFT_CLIENT_SECRET'),
                        'code': payload.code,
                        'grant_type': 'authorization_code',
                        'redirect_uri': 'http://localhost:3000/auth/callback'
                    }
                )
                token_data = token_response.json()
                
                if 'access_token' not in token_data:
                    raise HTTPException(status_code=400, detail="Failed to get access token")
                
                # Get user info
                user_response = await client.get(
                    'https://graph.microsoft.com/v1.0/me',
                    headers={'Authorization': f'Bearer {token_data["access_token"]}'}
                )
                user_info = user_response.json()
        else:
            raise HTTPException(status_code=400, detail="Unsupported provider")
        
        email = user_info.get('email')
        if not email:
            raise HTTPException(status_code=400, detail="Email not provided by OAuth provider")
        
        # Check if user exists
        existing_user = await storage.db.users.find_one({"email": email})
        
        if existing_user:
            user_id = str(existing_user["_id"])
        else:
            # Create new user
            user_doc = {
                "email": email,
                "first_name": user_info.get('given_name', user_info.get('givenName', '')),
                "last_name": user_info.get('family_name', user_info.get('surname', '')),
                "auth_provider": payload.provider,
                "oauth_id": user_info.get('id', user_info.get('sub', '')),
                "picture": user_info.get('picture', '')
            }
            result = await storage.db.users.insert_one(user_doc)
            user_id = str(result.inserted_id)
        
        # Create JWT token
        access_token = create_access_token(user_id)
        return {"access_token": access_token, "token_type": "bearer"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth authentication failed: {str(e)}")


