import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from services.chat_service import load_history
from core.database import get_db
from models.user import User
from models.bot import Bot
from models.usage import UsageLog
from models.chat_message import ChatMessage
from schemas.chat import ChatRequest, ChatResponse
from routers.deps import get_current_user, get_user_via_api_key
from services.rag import retrieve
from services.llm import generate_answer_with_history
from core.limiter import limiter, user_limiter, api_limiter
from fastapi import Request
router = APIRouter(tags=["Chat"])

# How many past turns to include in context (each turn = 1 user + 1 assistant message)
HISTORY_TURNS = 6



async def _chat_logic(
    bot_id: str, message: str, session_id: str | None,
    channel: str, db: AsyncSession, user: User,
) -> ChatResponse:
    bot = await db.get(Bot, bot_id)
    # fix #20: verify bot belongs to the authenticated user
    if not bot or not bot.is_active or bot.user_id != user.id:
        raise HTTPException(status_code=404, detail="Bot not found")

    session_id = session_id or str(uuid.uuid4())

    # fix #5: load conversation history for this session
    history = await load_history(bot_id, session_id, db)

    chunks = await retrieve(bot_id, message)
    context = "\n\n---\n\n".join(chunks) if chunks else "No relevant documents found."

    answer, tokens = await generate_answer_with_history(
        bot.persona, context, history, message
    )

    # persist both turns
    db.add(ChatMessage(bot_id=bot_id, session_id=session_id, role="user", content=message))
    db.add(ChatMessage(bot_id=bot_id, session_id=session_id, role="assistant", content=answer))
    db.add(UsageLog(
        bot_id=bot_id,
        user_id=user.id,        # fix #19
        session_id=session_id,
        tokens_used=tokens,
        channel=channel,
    ))
    await db.commit()

    return ChatResponse(answer=answer, sources=chunks[:2], session_id=session_id)


@router.post("/chat", response_model=ChatResponse)
@user_limiter.limit("60/minute")
async def chat_web(
    request: Request,           
    payload: ChatRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await _chat_logic(payload.bot_id, payload.message, payload.session_id, "web", db, user)


@router.post("/api/v1/chat", response_model=ChatResponse)
@api_limiter.limit("120/minute")
async def chat_api(
    request: Request,
    payload: ChatRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_user_via_api_key),
):
    return await _chat_logic(payload.bot_id, payload.message, payload.session_id, "api", db, user)