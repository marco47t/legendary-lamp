from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from models.user import UserType
from core.database import get_db
from core.security import (
    hash_password, verify_password, create_access_token,
    create_refresh_token, hash_refresh_token,
)
from models.user import User
from models.refresh_token import RefreshToken
from schemas.auth import (
    RegisterRequest, LoginRequest,
    TokenResponse, RefreshRequest, UserOut,
)
from routers.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])
def _ensure_utc(dt: datetime) -> datetime:
    """SQLite strips tzinfo on read — re-attach UTC if missing."""
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)

@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        user_type=payload.user_type,
    )
    db.add(user)
    await db.flush()  # get user.id without full commit yet

    raw, token_hash = create_refresh_token()
    db.add(RefreshToken(user_id=user.id, token_hash=token_hash))
    await db.commit()
    await db.refresh(user)

    access = create_access_token({"sub": user.id, "type": user.user_type})
    return TokenResponse(access_token=access, refresh_token=raw, token_type="bearer")


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.email == payload.email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    raw, token_hash = create_refresh_token()
    db.add(RefreshToken(user_id=user.id, token_hash=token_hash))
    await db.commit()

    access = create_access_token({"sub": user.id, "type": user.user_type})
    return TokenResponse(access_token=access, refresh_token=raw, token_type="bearer")


@router.post("/refresh", response_model=TokenResponse)
async def refresh(payload: RefreshRequest, db: AsyncSession = Depends(get_db)):
    hashed = hash_refresh_token(payload.refresh_token)
    record = await db.scalar(select(RefreshToken).where(RefreshToken.token_hash == hashed))

    if not record or record.revoked:
        raise HTTPException(status_code=401, detail="Invalid or revoked refresh token")
    expires_at = record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Refresh token expired")
    # rotate — revoke old, issue new
    record.revoked = True
    raw, token_hash = create_refresh_token()
    db.add(RefreshToken(user_id=record.user_id, token_hash=token_hash))
    await db.commit()

    user = await db.get(User, record.user_id)
    access = create_access_token({"sub": user.id, "type": user.user_type})
    return TokenResponse(access_token=access, refresh_token=raw, token_type="bearer")



@router.post("/logout", status_code=204)
async def logout(payload: RefreshRequest, db: AsyncSession = Depends(get_db)):
    hashed = hash_refresh_token(payload.refresh_token)
    record = await db.scalar(select(RefreshToken).where(RefreshToken.token_hash == hashed))
    if record:
        record.revoked = True
        await db.commit()


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user