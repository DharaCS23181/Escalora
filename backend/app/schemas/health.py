from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str = Field(..., description="Overall health status of the API", example="ok")
    database: str = Field(..., description="Database connection status", example="connected")
    redis: str = Field(..., description="Redis connection status", example="connected")
