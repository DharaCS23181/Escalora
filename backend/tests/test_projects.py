import pytest
from httpx import AsyncClient
from app.models.user import RoleEnum
from app.core.security import hash_password

@pytest.mark.asyncio
async def test_admin_creates_project(async_client: AsyncClient, db_session):
    from app.models.user import User
    # Setup admin & lead
    admin = User(full_name="Admin", email="admin_proj@escalora.com", password_hash=hash_password("pass"), role=RoleEnum.ADMIN)
    lead = User(full_name="Lead", email="lead_proj@escalora.com", password_hash=hash_password("pass"), role=RoleEnum.PROJECT_LEAD)
    db_session.add_all([admin, lead])
    await db_session.commit()
    
    login_res = await async_client.post("/api/v1/auth/login", json={"email": "admin_proj@escalora.com", "password": "pass"})
    token = login_res.json()["access_token"]
    
    res = await async_client.post("/api/v1/projects", headers={"Authorization": f"Bearer {token}"}, json={
        "name": "Test Project",
        "key": "TEST",
        "project_lead_id": str(lead.id)
    })
    
    assert res.status_code == 201
    assert res.json()["key"] == "TEST"

@pytest.mark.asyncio
async def test_invalid_lead_assignment(async_client: AsyncClient, db_session):
    from app.models.user import User
    admin = User(full_name="Admin2", email="admin2_proj@escalora.com", password_hash=hash_password("pass"), role=RoleEnum.ADMIN)
    dev = User(full_name="Dev", email="dev_proj@escalora.com", password_hash=hash_password("pass"), role=RoleEnum.DEVELOPER)
    db_session.add_all([admin, dev])
    await db_session.commit()
    
    login_res = await async_client.post("/api/v1/auth/login", json={"email": "admin2_proj@escalora.com", "password": "pass"})
    token = login_res.json()["access_token"]
    
    res = await async_client.post("/api/v1/projects", headers={"Authorization": f"Bearer {token}"}, json={
        "name": "Test Project 2",
        "key": "TEST2",
        "project_lead_id": str(dev.id)
    })
    
    assert res.status_code == 400
    assert "PROJECT_LEAD" in res.json()["detail"]
