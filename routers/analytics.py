from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from core.database import get_db
from core.limiter import user_limiter
from models.user import User
from models.bot import Bot
from models.usage import UsageLog
from models.chat_message import ChatMessage
from routers.deps import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def _since(days: int) -> datetime:
    return datetime.now(timezone.utc) - timedelta(days=days)


# ── Platform-wide summary for the logged-in user ─────────────────────────────

@router.get("/summary")
@user_limiter.limit("60/minute")
async def get_summary(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Returns overall stats: total bots, total tokens, total messages,
    tokens this month, messages this month, and per-channel breakdown.
    """
    # All bots owned by user
    bots_result = await db.execute(
        select(func.count(Bot.id)).where(Bot.user_id == user.id)
    )
    total_bots = bots_result.scalar() or 0

    # All-time token usage
    total_tokens_result = await db.execute(
        select(func.sum(UsageLog.tokens_used)).where(UsageLog.user_id == user.id)
    )
    total_tokens = total_tokens_result.scalar() or 0

    # All-time message count (each user message = 1 ChatMessage with role=user, for all user's bots)
    # Use UsageLog rows as proxy for "conversations" since each chat call = 1 UsageLog row
    total_chats_result = await db.execute(
        select(func.count(UsageLog.id)).where(UsageLog.user_id == user.id)
    )
    total_chats = total_chats_result.scalar() or 0

    # Unique sessions = distinct non-null session_ids across all bots
    unique_sessions_result = await db.execute(
        select(func.count(func.distinct(UsageLog.session_id))).where(
            UsageLog.user_id == user.id,
            UsageLog.session_id.isnot(None)
        )
    )
    unique_sessions = unique_sessions_result.scalar() or 0

    # This month
    month_start = _since(30)
    month_tokens_result = await db.execute(
        select(func.sum(UsageLog.tokens_used)).where(
            and_(UsageLog.user_id == user.id, UsageLog.created_at >= month_start)
        )
    )
    month_tokens = month_tokens_result.scalar() or 0

    month_chats_result = await db.execute(
        select(func.count(UsageLog.id)).where(
            and_(UsageLog.user_id == user.id, UsageLog.created_at >= month_start)
        )
    )
    month_chats = month_chats_result.scalar() or 0

    # Per-channel breakdown (all-time)
    channel_result = await db.execute(
        select(UsageLog.channel, func.count(UsageLog.id).label("chats"), func.sum(UsageLog.tokens_used).label("tokens"))
        .where(UsageLog.user_id == user.id)
        .group_by(UsageLog.channel)
    )
    channels = [
        {"channel": row.channel, "chats": row.chats, "tokens": row.tokens or 0}
        for row in channel_result
    ]

    return {
        "total_bots": total_bots,
        "total_tokens_all_time": total_tokens,
        "total_chats_all_time": total_chats,
        "unique_sessions": unique_sessions,
        "tokens_last_30_days": month_tokens,
        "chats_last_30_days": month_chats,
        "by_channel": channels,
    }


# ── Daily usage over last N days (for the chart) ─────────────────────────────

@router.get("/daily")
@user_limiter.limit("60/minute")
async def get_daily_usage(
    request: Request,
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Returns a list of {date, tokens, chats} for each day in the last `days` days.
    Days with no activity are included with zeros.
    """
    if days < 1 or days > 90:
        raise HTTPException(status_code=400, detail="days must be between 1 and 90")

    since = _since(days)

    result = await db.execute(
        select(
            func.date(UsageLog.created_at).label("day"),
            func.sum(UsageLog.tokens_used).label("tokens"),
            func.count(UsageLog.id).label("chats"),
        )
        .where(and_(UsageLog.user_id == user.id, UsageLog.created_at >= since))
        .group_by(func.date(UsageLog.created_at))
        .order_by(func.date(UsageLog.created_at).asc())
    )
    rows = result.all()

    # Build a full date map so missing days show as 0
    date_map: dict[str, dict] = {}
    for i in range(days):
        d = (datetime.now(timezone.utc) - timedelta(days=days - 1 - i)).strftime("%Y-%m-%d")
        date_map[d] = {"date": d, "tokens": 0, "chats": 0}

    for row in rows:
        key = str(row.day)
        if key in date_map:
            date_map[key]["tokens"] = row.tokens or 0
            date_map[key]["chats"] = row.chats or 0

    return list(date_map.values())


# ── Per-bot breakdown ─────────────────────────────────────────────────────────

@router.get("/bots")
@user_limiter.limit("60/minute")
async def get_bot_usage(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Returns token usage and chat count per bot owned by the user.
    """
    result = await db.execute(
        select(
            Bot.id,
            Bot.name,
            Bot.is_active,
            func.count(UsageLog.id).label("chats"),
            func.sum(UsageLog.tokens_used).label("tokens"),
        )
        .outerjoin(UsageLog, UsageLog.bot_id == Bot.id)
        .where(Bot.user_id == user.id)
        .group_by(Bot.id, Bot.name, Bot.is_active)
        .order_by(func.sum(UsageLog.tokens_used).desc().nullslast())
    )
    return [
        {
            "bot_id": row.id,
            "bot_name": row.name,
            "is_active": row.is_active,
            "chats": row.chats or 0,
            "tokens": row.tokens or 0,
        }
        for row in result
    ]


# ── Single bot detail analytics ───────────────────────────────────────────────

@router.get("/bots/{bot_id}")
@user_limiter.limit("60/minute")
async def get_bot_detail(
    request: Request,
    bot_id: str,
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Returns daily usage + total sessions + unique sessions for a single bot.
    """
    bot = await db.get(Bot, bot_id)
    if not bot or bot.user_id != user.id:
        raise HTTPException(status_code=404, detail="Bot not found")

    since = _since(days)

    # Daily for this bot
    daily_result = await db.execute(
        select(
            func.date(UsageLog.created_at).label("day"),
            func.sum(UsageLog.tokens_used).label("tokens"),
            func.count(UsageLog.id).label("chats"),
        )
        .where(and_(UsageLog.bot_id == bot_id, UsageLog.created_at >= since))
        .group_by(func.date(UsageLog.created_at))
        .order_by(func.date(UsageLog.created_at).asc())
    )

    date_map: dict[str, dict] = {}
    for i in range(days):
        d = (datetime.now(timezone.utc) - timedelta(days=days - 1 - i)).strftime("%Y-%m-%d")
        date_map[d] = {"date": d, "tokens": 0, "chats": 0}
    for row in daily_result:
        key = str(row.day)
        if key in date_map:
            date_map[key]["tokens"] = row.tokens or 0
            date_map[key]["chats"] = row.chats or 0

    # Total unique sessions
    sessions_result = await db.execute(
        select(func.count(func.distinct(UsageLog.session_id)))
        .where(UsageLog.bot_id == bot_id)
    )
    total_sessions = sessions_result.scalar() or 0

    # Total tokens all-time
    total_tokens_result = await db.execute(
        select(func.sum(UsageLog.tokens_used)).where(UsageLog.bot_id == bot_id)
    )
    total_tokens = total_tokens_result.scalar() or 0

    return {
        "bot_id": bot_id,
        "bot_name": bot.name,
        "total_sessions": total_sessions,
        "total_tokens": total_tokens,
        "daily": list(date_map.values()),
    }