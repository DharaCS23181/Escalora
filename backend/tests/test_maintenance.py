import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings

@pytest.mark.asyncio
async def test_maintenance_sla_check_no_secret():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(f"{settings.API_V1_STR}/internal/maintenance/sla-check")
        assert response.status_code == 401
        assert response.json() == {"detail": "Unauthorized"}

@pytest.mark.asyncio
async def test_maintenance_sla_check_wrong_secret():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            f"{settings.API_V1_STR}/internal/maintenance/sla-check",
            headers={"X-Maintenance-Secret": "wrong_secret"}
        )
        assert response.status_code == 401
        assert response.json() == {"detail": "Unauthorized"}

@pytest.mark.asyncio
async def test_maintenance_sla_check_correct_secret():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            f"{settings.API_V1_STR}/internal/maintenance/sla-check",
            headers={"X-Maintenance-Secret": settings.SLA_MAINTENANCE_SECRET}
        )
        # Should succeed because it evaluates SLAs in the DB
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "processed" in data
        assert "at_risk" in data
        assert "breached" in data
        assert "escalated" in data
