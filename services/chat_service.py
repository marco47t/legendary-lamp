from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.chat_message import ChatMessage

HISTORY_TURNS = 6


async def load_history(bot_id: str, session_id: str, db: AsyncSession) -> list[dict]:
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.bot_id == bot_id, ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(HISTORY_TURNS * 2)
    )
    messages = list(reversed(result.scalars().all()))
    return [
        {
            "role": "user" if m.role == "user" else "model",
            "parts": [{"text": m.content}],
        }
        for m in messages
    ]