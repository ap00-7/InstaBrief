from pydantic_settings import BaseSettings
from pydantic import Field, field_validator
import os


class Settings(BaseSettings):
    secret_key: str = Field(default="change-me", env="SECRET_KEY")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    cors_origins: list[str] = Field(default=["*"])
    
    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            # Handle comma-separated string or single value
            if "," in v:
                return [origin.strip() for origin in v.split(",")]
            return [v.strip()]
        return v

    # MongoDB configuration - read from environment
    mongo_uri: str = Field(
        default="mongodb://mongo:27017/instabrief",
        env="MONGODB_URI"
    )
    database_name: str = "instabrief"

    # Optional: SQLite fallback
    database_url: str = "sqlite:///./instabrief.db"
    
    # Environment
    environment: str = Field(default="development", env="ENVIRONMENT")

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()


