import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select
from app.main import app
from app.core.config import settings
from app.models.user import User
from app.db.session import AsyncSessionLocal
from app.core.security import verify_password
from app.db.seed import seed_db

@pytest.mark.asyncio
async def test_initial_admin_created_and_idempotent():
    # 1. Run the seed function
    async with AsyncSessionLocal() as session:
        await seed_db(session)
        
    # 2. Verify admin exists
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == settings.INITIAL_ADMIN_EMAIL))
        admin_user = result.scalars().first()
        assert admin_user is not None
        assert admin_user.role.value == "ADMIN"
        assert admin_user.full_name == settings.INITIAL_ADMIN_NAME
        
        # Save current password hash to ensure it doesn't change
        original_hash = admin_user.password_hash
        assert verify_password(settings.INITIAL_ADMIN_PASSWORD, original_hash)
        
    # 3. Run the seed function again to test idempotency
    async with AsyncSessionLocal() as session:
        await seed_db(session)
        
    # 4. Verify no duplicate admin was created and password hash wasn't overwritten
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == settings.INITIAL_ADMIN_EMAIL))
        users = result.scalars().all()
        assert len(users) == 1  # No duplicate
        assert users[0].password_hash == original_hash  # Hash exactly the same (not reset)


@pytest.mark.asyncio
async def test_initial_admin_login():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Correct login
        response = await ac.post(
            f"{settings.API_V1_STR}/auth/login",
            json={
                "email": settings.INITIAL_ADMIN_EMAIL,
                "password": settings.INITIAL_ADMIN_PASSWORD
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        
        # Wrong password
        response = await ac.post(
            f"{settings.API_V1_STR}/auth/login",
            json={
                "email": settings.INITIAL_ADMIN_EMAIL,
                "password": "definitely_wrong_password_123!"
            }
        )
        assert response.status_code == 401
