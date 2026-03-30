import httpx
from core.config import settings

TELEGRAM_API = "https://api.telegram.org/bot{token}/{method}"


async def set_webhook(token: str, bot_id: str) -> dict:
    webhook_url = f"{settings.APP_BASE_URL}/telegram/webhook/{bot_id}"
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            TELEGRAM_API.format(token=token, method="setWebhook"),
            json={"url": webhook_url, "allowed_updates": ["message"]},
        )
    return resp.json()


async def delete_webhook(token: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            TELEGRAM_API.format(token=token, method="deleteWebhook")
        )
    return resp.json()


async def send_message(token: str, chat_id: int, text: str) -> dict:
    text = text[:4090]
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            TELEGRAM_API.format(token=token, method="sendMessage"),
            json={"chat_id": chat_id, "text": text, "parse_mode": "Markdown"},
        )
    return resp.json()


async def send_typing(token: str, chat_id: int):
    async with httpx.AsyncClient() as client:
        await client.post(
            TELEGRAM_API.format(token=token, method="sendChatAction"),
            json={"chat_id": chat_id, "action": "typing"},
        )