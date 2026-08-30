import asyncio
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.core.config import settings
from app.models.user import User, RoleEnum
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.core.security import hash_password
from sqlalchemy import select

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def seed_db(session: AsyncSession):
    # Check if admin exists
    result = await session.execute(select(User).where(User.email == settings.INITIAL_ADMIN_EMAIL))
    admin_user = result.scalars().first()

    if not admin_user:
        logger.info(f"Creating initial admin: {settings.INITIAL_ADMIN_EMAIL}")
        admin_user = User(
            full_name=settings.INITIAL_ADMIN_NAME,
            email=settings.INITIAL_ADMIN_EMAIL,
            password_hash=hash_password(settings.INITIAL_ADMIN_PASSWORD),
            role=RoleEnum.ADMIN
        )
        session.add(admin_user)
        await session.commit()
    else:
        logger.info("Admin user already exists.")

    # Create development seed data
    if settings.APP_ENV == "development":
        logger.info("Development mode detected. Seeding test users and projects...")
        
        # Test Users
        users_data = [
            {"email": "lead@escalora.com", "name": "Test Lead", "role": RoleEnum.PROJECT_LEAD},
            {"email": "senior1@escalora.com", "name": "Senior Dev 1", "role": RoleEnum.SENIOR_DEVELOPER},
            {"email": "senior2@escalora.com", "name": "Senior Dev 2", "role": RoleEnum.SENIOR_DEVELOPER},
            {"email": "dev1@escalora.com", "name": "Developer 1", "role": RoleEnum.DEVELOPER},
            {"email": "dev2@escalora.com", "name": "Developer 2", "role": RoleEnum.DEVELOPER},
            {"email": "dev3@escalora.com", "name": "Developer 3", "role": RoleEnum.DEVELOPER},
        ]

        created_users = {}
        for u in users_data:
            result = await session.execute(select(User).where(User.email == u["email"]))
            user = result.scalars().first()
            if not user:
                user = User(
                    full_name=u["name"],
                    email=u["email"],
                    password_hash=hash_password("password"),
                    role=u["role"]
                )
                session.add(user)
                await session.flush()
                logger.info(f"Created user: {u['email']}")
            created_users[u["email"]] = user
        
        await session.commit()

        # Test Project
        result = await session.execute(select(Project).where(Project.key == "CORE"))
        project = result.scalars().first()
        if not project:
            lead_id = created_users["lead@escalora.com"].id
            project = Project(
                name="Core Infrastructure",
                key="CORE",
                description="Main escalora infrastructure project",
                project_lead_id=lead_id
            )
            session.add(project)
            await session.commit()
            await session.refresh(project)
            logger.info("Created CORE project")

            # Assign members
            members_to_add = [
                "senior1@escalora.com", "senior2@escalora.com", 
                "dev1@escalora.com", "dev2@escalora.com", "dev3@escalora.com"
            ]
            for m in members_to_add:
                member_user = created_users[m]
                session.add(ProjectMember(project_id=project.id, user_id=member_user.id))
            
            await session.commit()
            logger.info("Assigned members to CORE project")

async def main():
    async with AsyncSessionLocal() as session:
        await seed_db(session)

if __name__ == "__main__":
    asyncio.run(main())
