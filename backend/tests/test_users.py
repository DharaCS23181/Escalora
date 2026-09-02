import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select
from app.main import app
from app.db.session import AsyncSessionLocal
from app.models.user import User, RoleEnum, UserStatus
from app.core.config import settings
from app.core.security import hash_password, verify_password
import uuid

async def get_admin_token(async_client):
    admin_email = f"admin_{uuid.uuid4()}@escalora.com"
    async with AsyncSessionLocal() as session:
        admin = User(full_name="Admin", email=admin_email, password_hash=hash_password("pass"), role=RoleEnum.ADMIN)
        session.add(admin)
        await session.commit()
    login_res = await async_client.post("/api/v1/auth/login", json={"email": admin_email, "password": "pass"})
    return {"Authorization": f"Bearer {login_res.json()['access_token']}"}

@pytest.mark.asyncio
async def test_create_user_default_password():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as async_client:
        headers = await get_admin_token(async_client)
        invite_email = f"user_{uuid.uuid4()}@escalora.com"
        
        response = await async_client.post(
            f"{settings.API_V1_STR}/users/invite",
            json={
                "full_name": "Test User",
                "email": invite_email,
                "role": "DEVELOPER"
            },
            headers=headers
        )
        assert response.status_code == 201
        
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(User).where(User.email == invite_email))
            user = result.scalars().first()
            
            assert user is not None
            assert user.status == UserStatus.ACTIVE
            assert verify_password("password", user.password_hash)
            # Ensure plaintext password is not stored in DB
            assert user.password_hash != "password"
            
        # Test login with default password
        login_res = await async_client.post(
            f"{settings.API_V1_STR}/auth/login",
            json={"email": invite_email, "password": "password"}
        )
        assert login_res.status_code == 200
        user_token = login_res.json()["access_token"]
        
        # Test change password
        change_res = await async_client.patch(
            f"{settings.API_V1_STR}/users/me/password",
            json={
                "current_password": "password",
                "new_password": "new_secure_password",
                "confirm_password": "new_secure_password"
            },
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert change_res.status_code == 200
        
        # Test old password fails
        login_old_res = await async_client.post(
            f"{settings.API_V1_STR}/auth/login",
            json={"email": invite_email, "password": "password"}
        )
        assert login_old_res.status_code == 401
        
        # Test new password succeeds
        login_new_res = await async_client.post(
            f"{settings.API_V1_STR}/auth/login",
            json={"email": invite_email, "password": "new_secure_password"}
        )
        assert login_new_res.status_code == 200

@pytest.mark.asyncio
async def test_change_password_validation_failures():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as async_client:
        # Create a user to test with
        user_email = f"user_{uuid.uuid4()}@escalora.com"
        async with AsyncSessionLocal() as session:
            user = User(full_name="Test", email=user_email, password_hash=hash_password("valid_password"), role=RoleEnum.DEVELOPER)
            session.add(user)
            await session.commit()
            
        login_res = await async_client.post(
            f"{settings.API_V1_STR}/auth/login",
            json={"email": user_email, "password": "valid_password"}
        )
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Wrong current password
        res1 = await async_client.patch(
            f"{settings.API_V1_STR}/users/me/password",
            json={
                "current_password": "wrong_password",
                "new_password": "new_password123",
                "confirm_password": "new_password123"
            },
            headers=headers
        )
        assert res1.status_code == 401
        
        # Mismatched confirm password
        res2 = await async_client.patch(
            f"{settings.API_V1_STR}/users/me/password",
            json={
                "current_password": "valid_password",
                "new_password": "new_password123",
                "confirm_password": "new_password_different"
            },
            headers=headers
        )
        assert res2.status_code == 400
        
        # Too short
        res3 = await async_client.patch(
            f"{settings.API_V1_STR}/users/me/password",
            json={
                "current_password": "valid_password",
                "new_password": "short",
                "confirm_password": "short"
            },
            headers=headers
        )
        assert res3.status_code == 400
