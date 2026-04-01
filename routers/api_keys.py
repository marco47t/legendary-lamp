from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.database import get_db
from core.security import generate_api_key
from models.user import User, UserType
from models.api_key import APIKey
from schemas.api_key import APIKeyCreate, APIKeyCreated, APIKeyOut
from routers.deps import get_current_user
from core.limiter import limiter
from fastapi import Request
router = APIRouter(prefix="/api-keys", tags=["API Keys"])


@router.post("/", response_model=APIKeyOut, status_code=201)
@limiter.limit("10/hour")
async def create_api_key(
    request: Request,
    body: APIKeyCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    raw, hashed = generate_api_key()
    key = APIKey(
        user_id=user.id,
        key_hash=hashed,
        label=body.label,
        key_preview=raw[-4:],   # fix #15: store last 4 chars for display only
    )
    db.add(key)
    await db.commit()
    await db.refresh(key)
    # return the raw key ONCE — never stored, never retrievable again
    return {**key.__dict__, "key": raw}


@router.get("/", response_model=list[APIKeyOut])
async def list_api_keys(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(APIKey).where(APIKey.user_id == user.id))
    return result.scalars().all()


@router.delete("/{key_id}", status_code=204)
async def revoke_api_key(
    key_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    key = await db.get(APIKey, key_id)
    if not key or key.user_id != user.id:
        raise HTTPException(status_code=404, detail="API key not found")
    await db.delete(key)
    await db.commit()