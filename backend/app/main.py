from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from app.core.config import settings

tags_metadata = [
    {"name": "Authentication", "description": "Authentication and authorization"},
    {"name": "Users", "description": "User management"},
    {"name": "Projects", "description": "Project management"},
    {"name": "Tickets", "description": "Ticket management"},
    {"name": "SLA", "description": "Service Level Agreement management"},
    {"name": "Escalations", "description": "Escalation workflows"},
    {"name": "Notifications", "description": "System notifications"},
    {"name": "Analytics", "description": "Data analytics"},
    {"name": "Reports", "description": "System reports"},
    {"name": "Audit Logs", "description": "System audit logs"},
    {"name": "Health", "description": "API health checks"},
]

app = FastAPI(
    title="Escalora API",
    description="REST API for the Escalora Intelligent Software Maintenance Ticket Escalation System.",
    version="1.0.0",
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=tags_metadata
)

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
        tags=app.openapi_tags,
    )
    # Prepare OpenAPI for future JWT authentication
    openapi_schema["components"] = openapi_schema.get("components", {})
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "JWT Authorization header using the Bearer scheme."
        }
    }
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.CORS_ORIGINS] if settings.CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.routes import health, auth, users, projects, tickets, notifications, sla, escalations

app.include_router(health.router, prefix=f"{settings.API_V1_STR}", tags=["Health"])
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth")
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users")
app.include_router(projects.router, prefix=f"{settings.API_V1_STR}/projects")
app.include_router(tickets.router, prefix=f"{settings.API_V1_STR}/tickets")
app.include_router(notifications.router, prefix=f"{settings.API_V1_STR}/notifications")
app.include_router(sla.router, prefix=f"{settings.API_V1_STR}/sla")
app.include_router(escalations.router, prefix=f"{settings.API_V1_STR}/escalations")

@app.get("/")
def root():
    return {"message": "Welcome to the Escalora API"}
