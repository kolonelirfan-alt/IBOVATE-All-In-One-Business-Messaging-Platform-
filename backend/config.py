from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    supabase_url: str = "https://your-project-id.supabase.co"
    supabase_key: str = "your-supabase-key"
    meta_app_secret: str = "your-meta-app-secret"
    meta_verify_token: str = "your-meta-verify-token"
    redis_url: str = "redis://localhost:6379"

    class Config:
        env_file = ".env"

settings = Settings()
