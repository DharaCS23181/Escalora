import pytest
from httpx import AsyncClient
from app.models.user import RoleEnum
from app.core.security import hash_password

@pytest.mark.asyncio
async def test_rbac_admin_creates_user(async_client: AsyncClient, db_session):
    from app.models.user import User
    # Setup admin
    admin = User(full_name="Admin", email="admin_rbac@escalora.com", password_hash=hash_password("pass"), role=RoleEnum.ADMIN)
    db_session.add(admin)
    await db_session.commit()
    
    login_res = await async_client.post("/api/v1/auth/login", json={"email": "admin_rbac@escalora.com", "password": "pass"})
    token = login_res.json()["access_token"]
    
    res = await async_client.post("/api/v1/users", headers={"Authorization": f"Bearer {token}"}, json={
        "full_name": "New User",
        "email": "new_user@escalora.com",
        "password": "password123",
        "role": "DEVELOPER"
    })
    
    assert res.status_code == 201
    assert res.json()["email"] == "new_user@escalora.com"

@pytest.mark.asyncio
async def test_rbac_developer_denied_admin_api(async_client: AsyncClient, db_session):
    from app.models.user import User
    dev = User(full_name="Dev", email="dev_rbac@escalora.com", password_hash=hash_password("pass"), role=RoleEnum.DEVELOPER)
    db_session.add(dev)
    await db_session.commit()
    
    login_res = await async_client.post("/api/v1/auth/login", json={"email": "dev_rbac@escalora.com", "password": "pass"})
    token = login_res.json()["access_token"]
    
    res = await async_client.post("/api/v1/users", headers={"Authorization": f"Bearer {token}"}, json={
        "full_name": "Hacker",
        "email": "hacker@escalora.com",
        "password": "password123",
        "role": "ADMIN"
    })
    
    assert res.status_code == 403
