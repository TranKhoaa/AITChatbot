from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from datetime import datetime, timezone
from typing import Optional

from .model import TokenBlacklist


class TokenBlacklistService:
    """Service for managing token blacklist operations"""
    
    async def add_token_to_blacklist(
        self,
        jti: str,
        token_type: str,
        expires_at: datetime,
        session: AsyncSession
    ) -> TokenBlacklist:
        """Add a token to the blacklist"""
        # Ensure expires_at is timezone-naive for database storage
        if expires_at.tzinfo is not None:
            expires_at = expires_at.replace(tzinfo=None)
            
        blacklisted_token = TokenBlacklist(
            jti=jti,
            token_type=token_type,
            expires_at=expires_at
        )
        
        session.add(blacklisted_token)
        await session.commit()
        await session.refresh(blacklisted_token)
        return blacklisted_token
    
    async def is_token_blacklisted(self, jti: str, session: AsyncSession) -> bool:
        """Check if a token is blacklisted"""
        statement = select(TokenBlacklist).where(TokenBlacklist.jti == jti)
        result = await session.exec(statement)
        blacklisted_token = result.first()
        return blacklisted_token is not None
    
    async def get_blacklisted_token(self, jti: str, session: AsyncSession) -> Optional[TokenBlacklist]:
        """Get a blacklisted token by JTI"""
        statement = select(TokenBlacklist).where(TokenBlacklist.jti == jti)
        result = await session.exec(statement)
        return result.first()
    
    async def cleanup_expired_tokens(self, session: AsyncSession) -> int:
        """Remove expired tokens from blacklist to keep the table clean"""
        current_time = datetime.now(timezone.utc)
        statement = select(TokenBlacklist).where(TokenBlacklist.expires_at < current_time)
        result = await session.exec(statement)
        expired_tokens = result.all()
        
        count = 0
        for token in expired_tokens:
            await session.delete(token)
            count += 1
        
        await session.commit()
        return count
