import os
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, field_validator, model_validator

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
    CELERY_ENABLED: bool = True
    
    # Security
    JWT_SECRET_KEY: str | None = None
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    SLA_MAINTENANCE_SECRET: str = "change_me_to_a_strong_secret_in_production"
    
    # Development Seed
    INITIAL_ADMIN_EMAIL: str = "admin@escalora.com"
    INITIAL_ADMIN_PASSWORD: str | None = None
    INITIAL_ADMIN_NAME: str = "System Admin"
    
    # SMTP Email
    SMTP_HOST: str | None = None
    SMTP_PORT: int | None = None
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM_EMAIL: str | None = None
    SMTP_FROM_NAME: str | None = None
    SMTP_USE_TLS: bool = True
    
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

    @model_validator(mode='after')
    def validate_prod_secrets(self) -> 'Settings':
        if self.APP_ENV == "production":
            if not self.JWT_SECRET_KEY or self.JWT_SECRET_KEY == "change_me_later":
                raise ValueError("JWT_SECRET_KEY must be set to a secure value in production")
            if not self.INITIAL_ADMIN_PASSWORD or self.INITIAL_ADMIN_PASSWORD == "admin123":
                raise ValueError("INITIAL_ADMIN_PASSWORD must be securely set in production")
        else:
            if not self.JWT_SECRET_KEY:
                self.JWT_SECRET_KEY = "change_me_later"
            if not self.INITIAL_ADMIN_PASSWORD:
                self.INITIAL_ADMIN_PASSWORD = "admin123"
        return self

settings = Settings()
