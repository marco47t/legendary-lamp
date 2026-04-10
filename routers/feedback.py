import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from core.database import get_db
from core.limiter import user_limiter
from models.user import User
from models.bot import Bot
from models.usage import UsageLog
from models.feedback import Feedback
from schemas.feedback import FeedbackCreate, FeedbackOut
from routers.deps import get_current_user

router = APIRouter(tags=["Feedback"])
logger = logging.getLogger(__name__)


@router.post("/feedback", response_model=FeedbackOut, status_code=201)
@user_limiter.limit("120/minute")
async def submit_feedback(
    request: Request,
    payload: FeedbackCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Submit thumbs-up/down feedback for a chat answer (identified by usage_log_id)."""
    usage_log = await db.get(UsageLog, payload.usage_log_id)
    if not usage_log or usage_log.user_id != user.id:
        raise HTTPException(status_code=404, detail="Usage log not found")

    # Prevent duplicate feedback on the same log entry
    existing = await db.execute(
        select(Feedback).where(Feedback.usage_log_id == payload.usage_log_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Feedback already submitted for this message")

    fb = Feedback(
        usage_log_id=payload.usage_log_id,
        bot_id=usage_log.bot_id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(fb)
    await db.commit()
    await db.refresh(fb)
    logger.info("feedback submitted usage_log_id=%s rating=%d", payload.usage_log_id, payload.rating)
    return fb


@router.get("/bots/{bot_id}/feedback/summary")
@user_limiter.limit("60/minute")
async def get_feedback_summary(
    request: Request,
    bot_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Returns positive/negative counts and ratio for a bot."""
    bot = await db.get(Bot, bot_id)
    if not bot or bot.user_id != user.id:
        raise HTTPException(status_code=404, detail="Bot not found")

    result = await db.execute(
        select(Feedback.rating, func.count(Feedback.id).label("count"))
        .where(Feedback.bot_id == bot_id)
        .group_by(Feedback.rating)
    )
    rows = result.all()
    counts = {row.rating: row.count for row in rows}
    positive = counts.get(1, 0)
    negative = counts.get(-1, 0)
    total = positive + negative
    return {
        "bot_id": bot_id,
        "positive": positive,
        "negative": negative,
        "total": total,
        "positive_ratio": round(positive / total, 2) if total else None,
    }