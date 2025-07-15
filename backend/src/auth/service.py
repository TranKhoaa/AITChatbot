from src.db.main import get_session
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from src.user.model import User
from src.admin.model import Admin
from src.auth.schema import UserCreateSchema, AdminCreateSchema
from .utils import generate_passwd_hash


class AuthService:
    async def get_user_by_name(self, name: str, session: AsyncSession):
        statement = select(User).where(User.name == name)
        result = await session.exec(statement)
        user = result.first()
        return user

    async def get_admin_by_name(self, name: str, session: AsyncSession):
        statement = select(Admin).where(Admin.name == name)
        result = await session.exec(statement)
        admin = result.first()
        return admin

    async def user_exists(self, name, session: AsyncSession):
        user = await self.get_user_by_name(name, session)
        return True if user is not None else False

    async def admin_exists(self, name, session: AsyncSession):
        admin = await self.get_user_by_name(name, session)
        return True if admin is not None else False

    async def create_user(self, user_data: UserCreateSchema, session: AsyncSession):
        user_data_dict = user_data.model_dump()
        user = User(**user_data_dict)
        user.password_hash = generate_passwd_hash(user_data.password)
        session.add(user)

        await session.commit()
        await session.refresh(user)
        return user
    
    async def create_admin(self, admin_data: AdminCreateSchema, session: AsyncSession):
        admin_data_dict = admin_data.model_dump()
        admin = Admin(**admin_data_dict)
        admin.password_hash = generate_passwd_hash(admin_data.password)
        session.add(admin)

        await session.commit()
        await session.refresh(admin)
        return admin
    
