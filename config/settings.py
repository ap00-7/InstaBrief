from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    secret_key: str = "change-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    cors_origins: list[str] = ["*"]

    # MongoDB configuration - use Docker container name
    mongo_uri: str = "mongodb://mongo:27017/instabrief"
    database_name: str = "instabrief"

    # Optional: SQLite fallback
    database_url: str = "sqlite:///./instabrief.db"


settings = Settings()


