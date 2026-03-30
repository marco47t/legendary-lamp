from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, APIKeyHeader
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import JWTError

from core.database import get_db
from core.security import decode_access_token, hash_api_key
from models.user import User
from models.api_key import APIKey

bearer = HTTPBearer(auto_error=False)
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Security(bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = decode_access_token(credentials.credentials)
        user_id: str = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user


async def get_user_via_api_key(
    api_key: str | None = Security(api_key_header),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not api_key:
        raise HTTPException(status_code=401, detail="X-API-Key header missing")

    hashed = hash_api_key(api_key)
    key_record = await db.scalar(select(APIKey).where(APIKey.key_hash == hashed))
    if not key_record:
        raise HTTPException(status_code=401, detail="Invalid API key")

    from datetime import datetime, timezone
    key_record.last_used = datetime.now(timezone.utc)
    await db.commit()

    user = await db.get(User, key_record.user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=403, detail="User inactive")
    return user