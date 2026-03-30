import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models.user import User
from models.bot import Bot
from models.usage import UsageLog
from schemas.chat import ChatRequest, ChatResponse
from routers.deps import get_current_user, get_user_via_api_key
from services.rag import retrieve
from services.llm import generate_answer

router = APIRouter(tags=["Chat"])


async def _chat_logic(
    bot_id: str, message: str, session_id: str | None, channel: str, db: AsyncSession
) -> ChatResponse:
    bot = await db.get(Bot, bot_id)
    if not bot or not bot.is_active:
        raise HTTPException(status_code=404, detail="Bot not found")

    session_id = session_id or str(uuid.uuid4())
    chunks = retrieve(bot_id, message)
    context = "\n\n---\n\n".join(chunks) if chunks else "No relevant documents found."

    answer, tokens = generate_answer(bot.persona, context, message)

    db.add(UsageLog(bot_id=bot_id, session_id=session_id,
                    tokens_used=tokens, channel=channel))
    await db.commit()

    return ChatResponse(answer=answer, sources=chunks[:2], session_id=session_id)


# JWT-authenticated — for your own web widget
@router.post("/chat", response_model=ChatResponse)
async def chat_web(
    payload: ChatRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await _chat_logic(payload.bot_id, payload.message,
                             payload.session_id, "web", db)


# API key-authenticated — for developers
@router.post("/api/v1/chat", response_model=ChatResponse)
async def chat_api(
    payload: ChatRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_user_via_api_key),
):
    return await _chat_logic(payload.bot_id, payload.message,
                             payload.session_id, "api", db)