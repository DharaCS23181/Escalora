import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/health")
    # Even if disconnected, it should return a valid JSON response structure
    assert response.status_code in (200, 503)
    data = response.json()
    assert "status" in data

@pytest.mark.asyncio
async def test_openapi_schema():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/openapi.json")
    assert response.status_code == 200
    data = response.json()
    assert data["info"]["title"] == "Escalora API"
    assert data["info"]["version"] == "1.0.0"
    assert "Health" in [tag["name"] for tag in data["tags"]]
    # Check security scheme
    assert "BearerAuth" in data["components"]["securitySchemes"]

@pytest.mark.asyncio
async def test_swagger_ui():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/docs")
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_redoc_ui():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/redoc")
    assert response.status_code == 200
