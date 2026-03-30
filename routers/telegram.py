from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.security import encrypt_token, decrypt_token
from models.user import User
from models.bot import Bot
from models.usage import UsageLog
from schemas.bot import TelegramDeployRequest
from routers.deps import get_current_user
from services.telegram_service import set_webhook, delete_webhook, send_message, send_typing
from services.rag import retrieve
from services.llm import generate_answer

router = APIRouter(tags=["Telegram"])


@router.post("/bots/{bot_id}/telegram/deploy")
async def deploy_telegram(
    bot_id: str,
    payload: TelegramDeployRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    bot = await db.get(Bot, bot_id)
    if not bot or bot.user_id != user.id:
        raise HTTPException(status_code=404, detail="Bot not found")

    result = await set_webhook(payload.telegram_token, bot_id)
    if not result.get("ok"):
        raise HTTPException(
            status_code=400,
            detail=f"Telegram error: {result.get('description', 'Unknown error')}"
        )

    bot.telegram_token_encrypted = encrypt_token(payload.telegram_token)
    bot.telegram_webhook_active = True
    await db.commit()
    return {"message": "Telegram bot deployed successfully"}


@router.delete("/bots/{bot_id}/telegram/undeploy")
async def undeploy_telegram(
    bot_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    bot = await db.get(Bot, bot_id)
    if not bot or bot.user_id != user.id:
        raise HTTPException(status_code=404, detail="Bot not found")
    if not bot.telegram_token_encrypted:
        raise HTTPException(status_code=400, detail="No Telegram token found")

    token = decrypt_token(bot.telegram_token_encrypted)
    await delete_webhook(token)
    bot.telegram_webhook_active = False
    bot.telegram_token_encrypted = None
    await db.commit()
    return {"message": "Telegram bot undeployed"}


@router.post("/telegram/webhook/{bot_id}")
async def telegram_webhook(
    bot_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    update = await request.json()
    message = update.get("message")
    if not message:
        return {"ok": True}

    chat_id = message["chat"]["id"]
    text = message.get("text", "").strip()

    bot = await db.get(Bot, bot_id)
    if not bot or not bot.is_active or not bot.telegram_token_encrypted:
        return {"ok": True}

    token = decrypt_token(bot.telegram_token_encrypted)

    if not text or text == "/start":
        await send_message(token, chat_id, f"👋 Hello! I'm *{bot.name}*. Ask me anything!")
        return {"ok": True}

    await send_typing(token, chat_id)

    chunks = retrieve(bot_id, text)
    context = "\n\n---\n\n".join(chunks) if chunks else "No relevant documents found."
    answer, tokens = generate_answer(bot.persona, context, text)

    db.add(UsageLog(bot_id=bot_id, session_id=str(chat_id),
                    tokens_used=tokens, channel="telegram"))
    await db.commit()

    await send_message(token, chat_id, answer)
    return {"ok": True}