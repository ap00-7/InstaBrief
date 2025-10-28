from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from config.settings import settings

logger.info("Starting InstaBrief API initialization...")

# Import routers one by one with error handling
try:
    logger.info("Importing auth router...")
    from app.routes.auth import router as auth_router
    logger.info("✓ Auth router imported successfully")
except Exception as e:
    logger.error(f"✗ Failed to import auth router: {e}")
    auth_router = None

try:
    logger.info("Importing articles router...")
    from app.routes.articles import router as articles_router
    logger.info("✓ Articles router imported successfully")
except Exception as e:
    logger.error(f"✗ Failed to import articles router: {e}")
    articles_router = None

try:
    logger.info("Importing documents router...")
    from app.routes.documents import router as documents_router
    logger.info("✓ Documents router imported successfully")
except Exception as e:
    logger.error(f"✗ Failed to import documents router: {e}")
    documents_router = None

try:
    logger.info("Importing summarize router...")
    from app.routes.summarize import router as summarize_router
    logger.info("✓ Summarize router imported successfully")
except Exception as e:
    logger.error(f"✗ Failed to import summarize router: {e}")
    summarize_router = None

try:
    logger.info("Importing feedback router...")
    from app.routes.feedback import router as feedback_router
    logger.info("✓ Feedback router imported successfully")
except Exception as e:
    logger.error(f"✗ Failed to import feedback router: {e}")
    feedback_router = None

try:
    logger.info("Importing users router...")
    from app.routes.users import router as users_router
    logger.info("✓ Users router imported successfully")
except Exception as e:
    logger.error(f"✗ Failed to import users router: {e}")
    users_router = None

try:
    logger.info("Importing tags router...")
    from app.routes.tags import router as tags_router
    logger.info("✓ Tags router imported successfully")
except Exception as e:
    logger.error(f"✗ Failed to import tags router: {e}")
    tags_router = None

try:
    logger.info("Importing support router...")
    from app.routes.support import router as support_router
    logger.info("✓ Support router imported successfully")
except Exception as e:
    logger.error(f"✗ Failed to import support router: {e}")
    support_router = None

logger.info("Creating FastAPI app...")
app = FastAPI(title="InstaBrief API", version="0.1.0")

logger.info("Adding CORS middleware...")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files from frontend directory (only in development)
if settings.environment == "development" and os.path.exists("frontend"):
    app.mount("/static", StaticFiles(directory="frontend"), name="static")

logger.info("Including routers...")
if auth_router:
    app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
    logger.info("✓ Auth router included")
if articles_router:
    app.include_router(articles_router, prefix="/api/articles", tags=["articles"])
    logger.info("✓ Articles router included")
if documents_router:
    app.include_router(documents_router, prefix="/api/documents", tags=["documents"])
    logger.info("✓ Documents router included")
if summarize_router:
    app.include_router(summarize_router, prefix="/api/summarize", tags=["summarize"])
    logger.info("✓ Summarize router included")
if feedback_router:
    app.include_router(feedback_router, prefix="/api/feedback", tags=["feedback"])
    logger.info("✓ Feedback router included")
if users_router:
    app.include_router(users_router, prefix="/api/users", tags=["users"])
    logger.info("✓ Users router included")
if tags_router:
    app.include_router(tags_router, prefix="/api/tags", tags=["tags"])
    logger.info("✓ Tags router included")
if support_router:
    app.include_router(support_router, prefix="/api/support", tags=["support"])
    logger.info("✓ Support router included")

logger.info("InstaBrief API setup complete!")


@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "InstaBrief API is running", "timestamp": "2025-10-28"}

@app.get("/simple")
async def simple_check():
    """Ultra-simple endpoint for debugging"""
    return {"alive": True}


@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "InstaBrief API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health"
    }


