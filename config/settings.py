from pydantic_settings import BaseSettings
from pydantic import Field, field_validator
from typing import Union
import os


class Settings(BaseSettings):
    secret_key: str = Field(default="change-me", env="SECRET_KEY")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    cors_origins: Union[str, list[str]] = Field(default="*", env="CORS_ORIGINS")
    
    @field_validator("cors_origins", mode="after")
    @classmethod
    def parse_cors_origins(cls, v):
        # Convert to list if it's a string
        if isinstance(v, str):
            if "," in v:
                return [origin.strip() for origin in v.split(",")]
            return [v.strip()]
        return v

    # MongoDB configuration - read from environment
    mongo_uri: str = "mongodb+srv://akashpaul90766_db_user:7gZgXqm0VRqKXOmc@instabrief-cluster.cfzebhw.mongodb.net/?appName=instabrief-cluster"
    database_name: str = "instabrief"

    # Optional: SQLite fallback
    database_url: str = "sqlite:///./instabrief.db"
    
    # Environment
    environment: str = Field(default="development", env="ENVIRONMENT")

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # Ignore extra environment variables


settings = Settings()


