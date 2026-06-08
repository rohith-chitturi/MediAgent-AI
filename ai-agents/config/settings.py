from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Service
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True

    # Database
    DATABASE_URL: str

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Backend API
    BACKEND_API_URL: str = "http://localhost:5000"
    AI_AGENT_API_KEY: str = "internal-key"

    # Gemini
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-1.5-flash"

    # Vapi
    VAPI_API_KEY: Optional[str] = None
    VAPI_PHONE_NUMBER_ID: Optional[str] = None

    # Resend
    RESEND_API_KEY: Optional[str] = None
    RESEND_FROM_EMAIL: str = "alerts@mediagent.ai"

    # Twilio
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
