import os

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.database import get_db
from models.user import User
from models.bot import Bot
from schemas.bot import BotCreate, BotUpdate, BotOut
from routers.deps import get_current_user
from vector_store.chroma_client import delete_collection

router = APIRouter(prefix="/bots", tags=["Bots"])


@router.post("/", response_model=BotOut, status_code=201)
async def create_bot(
    payload: BotCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    bot = Bot(user_id=user.id, **payload.model_dump(exclude_none=True))
    db.add(bot)
    await db.commit()
    await db.refresh(bot)
    return bot


@router.get("/", response_model=list[BotOut])
async def list_bots(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(Bot).where(Bot.user_id == user.id))
    return result.scalars().all()


@router.get("/{bot_id}", response_model=BotOut)
async def get_bot(
    bot_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    bot = await db.get(Bot, bot_id)
    if not bot or bot.user_id != user.id:
        raise HTTPException(status_code=404, detail="Bot not found")
    return bot


@router.put("/{bot_id}", response_model=BotOut)
async def update_bot(
    bot_id: str,
    payload: BotUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    bot = await db.get(Bot, bot_id)
    if not bot or bot.user_id != user.id:
        raise HTTPException(status_code=404, detail="Bot not found")
    for field, val in payload.model_dump(exclude_none=True).items():
        setattr(bot, field, val)
    await db.commit()
    await db.refresh(bot)
    return bot


@router.delete("/{bot_id}", status_code=204)
async def delete_bot(
    bot_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    bot = await db.get(Bot, bot_id)
    if not bot or bot.user_id != user.id:
        raise HTTPException(status_code=404, detail="Bot not found")

    # Delete physical files for all documents
    from sqlalchemy import select as sa_select
    from models.document import Document
    result = await db.execute(sa_select(Document).where(Document.bot_id == bot_id))
    for doc in result.scalars().all():
        if os.path.exists(doc.file_path):
            os.remove(doc.file_path)

    try:
        delete_collection(bot_id)
    except Exception:
        pass

    await db.delete(bot)
    await db.commit()