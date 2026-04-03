import json
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from services.chat_service import load_history
from core.database import get_db
from models.user import User
from models.bot import Bot
from models.usage import UsageLog
from models.chat_message import ChatMessage
from schemas.chat import ChatRequest, ChatResponse
from routers.deps import get_current_user, get_user_via_api_key
from services.rag import retrieve
from services.llm import generate_answer_with_history, stream_answer_with_history
from core.limiter import limiter, user_limiter, api_limiter
from fastapi import Request
from pydantic import BaseModel

router = APIRouter(tags=["Chat"])


async def _chat_logic(
    bot_id: str, message: str, session_id: str | None,
    channel: str, db: AsyncSession, user: User,
) -> ChatResponse:
    bot = await db.get(Bot, bot_id)

    if channel == "api":
        if not bot or not bot.is_active:
            raise HTTPException(status_code=404, detail="Bot not found")
    else:
        if not bot or not bot.is_active or bot.user_id != user.id:
            raise HTTPException(status_code=404, detail="Bot not found")

    session_id = session_id or str(uuid.uuid4())
    history = await load_history(bot_id, session_id, db)
    chunks = await retrieve(bot_id, message)
    context = "\n\n---\n\n".join(chunks) if chunks else "No relevant documents found."
    answer, tokens = await generate_answer_with_history(bot.persona, context, history, message)

    db.add(ChatMessage(bot_id=bot_id, session_id=session_id, role="user", content=message))
    db.add(ChatMessage(bot_id=bot_id, session_id=session_id, role="assistant", content=answer))
    db.add(UsageLog(
        bot_id=bot_id,
        user_id=user.id,
        session_id=session_id,
        tokens_used=tokens,
        channel=channel,
    ))
    await db.commit()
    return ChatResponse(answer=answer, sources=chunks[:2], session_id=session_id)


# ── Streaming helper ──────────────────────────────────────────────────────────

async def _stream_logic(
    bot_id: str, message: str, session_id: str | None,
    channel: str, db: AsyncSession, user: User,
):
    """
    SSE generator. Yields lines in the format:
      data: <text chunk>
      data: [SOURCES] <json list>
      data: [DONE] <session_id>
    """
    bot = await db.get(Bot, bot_id)

    if channel == "api":
        if not bot or not bot.is_active:
            yield "data: [ERROR] Bot not found\n\n"
            return
    else:
        if not bot or not bot.is_active or bot.user_id != user.id:
            yield "data: [ERROR] Bot not found\n\n"
            return

    session_id = session_id or str(uuid.uuid4())
    history = await load_history(bot_id, session_id, db)
    chunks = await retrieve(bot_id, message)
    context = "\n\n---\n\n".join(chunks) if chunks else "No relevant documents found."

    full_text = ""
    tokens = 0

    async for piece in stream_answer_with_history(bot.persona, context, history, message):
        if isinstance(piece, dict) and piece.get("__done__"):
            full_text = piece["full_text"]
            tokens = piece["tokens"]
        else:
            # Escape newlines so each SSE data line is valid
            escaped = piece.replace("\n", "\\n")
            yield f"data: {escaped}\n\n"

    # Persist after stream completes
    db.add(ChatMessage(bot_id=bot_id, session_id=session_id, role="user", content=message))
    db.add(ChatMessage(bot_id=bot_id, session_id=session_id, role="assistant", content=full_text))
    db.add(UsageLog(
        bot_id=bot_id,
        user_id=user.id,
        session_id=session_id,
        tokens_used=tokens,
        channel=channel,
    ))
    await db.commit()

    # Send sources and session_id as final SSE events
    yield f"data: [SOURCES] {json.dumps(chunks[:2])}\n\n"
    yield f"data: [DONE] {session_id}\n\n"


# ── Non-streaming endpoints (unchanged) ──────────────────────────────────────

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


# ── Streaming endpoints (NEW) ─────────────────────────────────────────────────

@router.post("/chat/stream")
@user_limiter.limit("60/minute")
async def chat_stream_web(
    request: Request,
    payload: ChatRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return StreamingResponse(
        _stream_logic(payload.bot_id, payload.message, payload.session_id, "web", db, user),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/api/v1/chat/stream")
@api_limiter.limit("120/minute")
async def chat_stream_api(
    request: Request,
    payload: ChatRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_user_via_api_key),
):
    return StreamingResponse(
        _stream_logic(payload.bot_id, payload.message, payload.session_id, "api", db, user),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Public chat (no auth) ─────────────────────────────────────────────────────

class PublicChatRequest(BaseModel):
    message: str
    session_id: str | None = None


@router.post("/public/chat/{bot_id}", response_model=ChatResponse)
@limiter.limit("30/minute")
async def chat_public(
    request: Request,
    bot_id: str,
    payload: PublicChatRequest,
    db: AsyncSession = Depends(get_db),
):
    bot = await db.get(Bot, bot_id)
    if not bot or not bot.is_active:
        raise HTTPException(status_code=404, detail="Bot not found")

    session_id = payload.session_id or str(uuid.uuid4())
    history = await load_history(bot_id, session_id, db)
    chunks = await retrieve(bot_id, payload.message)
    context = "\n\n---\n\n".join(chunks) if chunks else "No relevant documents found."
    answer, tokens = await generate_answer_with_history(bot.persona, context, history, payload.message)

    db.add(ChatMessage(bot_id=bot_id, session_id=session_id, role="user", content=payload.message))
    db.add(ChatMessage(bot_id=bot_id, session_id=session_id, role="assistant", content=answer))
    db.add(UsageLog(
        bot_id=bot_id,
        user_id=bot.user_id,
        session_id=session_id,
        tokens_used=tokens,
        channel="public",
    ))
    await db.commit()
    return ChatResponse(answer=answer, sources=chunks[:2], session_id=session_id)


@router.post("/public/chat/{bot_id}/stream")
@limiter.limit("30/minute")
async def chat_public_stream(
    request: Request,
    bot_id: str,
    payload: PublicChatRequest,
    db: AsyncSession = Depends(get_db),
):
    async def _public_stream():
        bot = await db.get(Bot, bot_id)
        if not bot or not bot.is_active:
            yield "data: [ERROR] Bot not found\n\n"
            return

        session_id = payload.session_id or str(uuid.uuid4())
        history = await load_history(bot_id, session_id, db)
        chunks = await retrieve(bot_id, payload.message)
        context = "\n\n---\n\n".join(chunks) if chunks else "No relevant documents found."

        full_text = ""
        tokens = 0

        async for piece in stream_answer_with_history(bot.persona, context, history, payload.message):
            if isinstance(piece, dict) and piece.get("__done__"):
                full_text = piece["full_text"]
                tokens = piece["tokens"]
            else:
                escaped = piece.replace("\n", "\\n")
                yield f"data: {escaped}\n\n"

        db.add(ChatMessage(bot_id=bot_id, session_id=session_id, role="user", content=payload.message))
        db.add(ChatMessage(bot_id=bot_id, session_id=session_id, role="assistant", content=full_text))
        db.add(UsageLog(
            bot_id=bot_id,
            user_id=bot.user_id,
            session_id=session_id,
            tokens_used=tokens,
            channel="public",
        ))
        await db.commit()

        yield f"data: [SOURCES] {json.dumps(chunks[:2])}\n\n"
        yield f"data: [DONE] {session_id}\n\n"

    return StreamingResponse(
        _public_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Conversation history ──────────────────────────────────────────────────────

class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime
    model_config = {"from_attributes": True}


class SessionOut(BaseModel):
    session_id: str
    message_count: int


@router.get("/bots/{bot_id}/sessions", response_model=list[SessionOut])
@user_limiter.limit("60/minute")
async def list_sessions(
    request: Request,
    bot_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    bot = await db.get(Bot, bot_id)
    if not bot or bot.user_id != user.id:
        raise HTTPException(status_code=404, detail="Bot not found")
    result = await db.execute(
        select(ChatMessage.session_id, func.count(ChatMessage.id).label("message_count"))
        .where(ChatMessage.bot_id == bot_id)
        .group_by(ChatMessage.session_id)
        .order_by(func.max(ChatMessage.created_at).desc())
    )
    return [{"session_id": row.session_id, "message_count": row.message_count} for row in result]


@router.get("/bots/{bot_id}/sessions/{session_id}", response_model=list[MessageOut])
@user_limiter.limit("60/minute")
async def get_session_messages(
    request: Request,
    bot_id: str,
    session_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    bot = await db.get(Bot, bot_id)
    if not bot or bot.user_id != user.id:
        raise HTTPException(status_code=404, detail="Bot not found")
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.bot_id == bot_id, ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
    )
    return result.scalars().all()