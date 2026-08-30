import pytest
from httpx import AsyncClient
from app.models.user import RoleEnum
from app.core.security import hash_password

@pytest.mark.asyncio
async def test_login_success(async_client: AsyncClient, db_session):
    # Setup test user
    from app.models.user import User
    test_user = User(
        full_name="Test User",
        email="test_login@escalora.com",
        password_hash=hash_password("password123"),
        role=RoleEnum.DEVELOPER
    )
    db_session.add(test_user)
    await db_session.commit()

    response = await async_client.post("/api/v1/auth/login", json={
        "email": "test_login@escalora.com",
        "password": "password123"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "test_login@escalora.com"
    assert "password_hash" not in data["user"]

@pytest.mark.asyncio
async def test_login_wrong_password(async_client: AsyncClient, db_session):
    response = await async_client.post("/api/v1/auth/login", json={
        "email": "test_login@escalora.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_get_me(async_client: AsyncClient, db_session):
    # Setup test user
    from app.models.user import User
    test_user = User(
        full_name="Test User",
        email="test_login@escalora.com",
        password_hash=hash_password("password123"),
        role=RoleEnum.DEVELOPER
    )
    db_session.add(test_user)
    await db_session.commit()

    # First login
    login_response = await async_client.post("/api/v1/auth/login", json={
        "email": "test_login@escalora.com",
        "password": "password123"
    })
    token = login_response.json()["access_token"]
    
    response = await async_client.get("/api/v1/auth/me", headers={
        "Authorization": f"Bearer {token}"
    })
    
    assert response.status_code == 200
    assert response.json()["email"] == "test_login@escalora.com"
