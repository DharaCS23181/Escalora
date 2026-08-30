import os
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, field_validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "Escalora API"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    APP_ENV: str = "development"
    
    # Database
    DATABASE_URL: str
    
    # Redis & Celery
    REDIS_URL: str
    CELERY_BROKER_URL: str
    CELERY_RESULT_BACKEND: str
    
    # Security
    JWT_SECRET_KEY: str = "change_me_later"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Development Seed
    INITIAL_ADMIN_EMAIL: str = "admin@escalora.com"
    INITIAL_ADMIN_PASSWORD: str = "admin123"
    INITIAL_ADMIN_NAME: str = "System Admin"
    
    # CORS
    CORS_ORIGINS: Union[str, List[str]] = []

    @field_validator("CORS_ORIGINS", mode='before')
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

settings = Settings()
