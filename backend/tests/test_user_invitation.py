import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select
from unittest.mock import patch

from app.models.user import User, UserStatus, RoleEnum
from app.core.security import verify_password, hash_password
from app.core.config import settings
from app.services.email_service import send_invitation_email_sync
from app.db.session import AsyncSessionLocal
from app.main import app

@pytest.fixture
def override_celery_enabled(monkeypatch):
    """Force CELERY_ENABLED to False so we use FastAPI BackgroundTasks in tests."""
    monkeypatch.setattr(settings, "CELERY_ENABLED", False)
    return False

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
async def test_invite_user_background_tasks(override_celery_enabled):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as async_client:
        headers = await get_admin_token(async_client)
        invite_email = f"invited_{uuid.uuid4()}@escalora.com"
        with patch("app.services.user_service.send_invitation_email_sync") as mock_send:
            response = await async_client.post(
                f"{settings.API_V1_STR}/users/invite",
                json={
                    "full_name": "Test Invite",
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
                assert user.status == UserStatus.PENDING
                assert user.activation_pin is not None
                assert verify_password(user.activation_pin, user.password_hash)
                
                mock_send.assert_called_once_with(invite_email, "Test Invite", user.activation_pin)

@pytest.mark.asyncio
async def test_resend_invite_background_tasks(override_celery_enabled):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as async_client:
        headers = await get_admin_token(async_client)
        
        invite_email2 = f"invited_{uuid.uuid4()}@escalora.com"
        
        # create the user first
        await async_client.post(
            f"{settings.API_V1_STR}/users/invite",
            json={
                "full_name": "Test Invite 2",
                "email": invite_email2,
                "role": "DEVELOPER"
            },
            headers=headers
        )
        
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(User).where(User.email == invite_email2))
            user = result.scalars().first()
            assert user is not None
            
            old_pin = user.activation_pin
            old_hash = user.password_hash
            
            with patch("app.api.routes.users.send_invitation_email_sync") as mock_send:
                response = await async_client.post(
                    f"{settings.API_V1_STR}/users/{user.id}/resend-invite",
                    headers=headers
                )
                assert response.status_code == 200
                
                await session.refresh(user)
                
                assert user.activation_pin != old_pin
                assert user.password_hash != old_hash
                assert verify_password(user.activation_pin, user.password_hash)
                
                mock_send.assert_called_once_with(user.email, user.full_name, user.activation_pin)

@pytest.mark.asyncio
async def test_invite_user_celery_enabled(monkeypatch):
    """Test that if CELERY_ENABLED is true, it calls celery task delay."""
    monkeypatch.setattr(settings, "CELERY_ENABLED", True)
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as async_client:
        headers = await get_admin_token(async_client)
        
        celery_email = f"celery_{uuid.uuid4()}@escalora.com"
        
        with patch("app.services.user_service.send_invitation_email.delay") as mock_celery_delay:
            response = await async_client.post(
                f"{settings.API_V1_STR}/users/invite",
                json={
                    "full_name": "Celery Invite",
                    "email": celery_email,
                    "role": "DEVELOPER"
                },
                headers=headers
            )
            assert response.status_code == 201
            
            async with AsyncSessionLocal() as session:
                result = await session.execute(select(User).where(User.email == celery_email))
                user = result.scalars().first()
                
                mock_celery_delay.assert_called_once_with(celery_email, "Celery Invite", user.activation_pin)

def test_sync_email_independent():
    result = send_invitation_email_sync("test@escalora.com", "Test", "123456")
    assert result is None
