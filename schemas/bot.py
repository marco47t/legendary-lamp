from pydantic import BaseModel
from datetime import datetime


class BotCreate(BaseModel):
    name: str
    persona: str | None = None
    language: str = "en"


class BotUpdate(BaseModel):
    name: str | None = None
    persona: str | None = None
    language: str | None = None


class BotOut(BaseModel):
    id: str
    name: str
    persona: str
    language: str
    telegram_webhook_active: bool
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TelegramDeployRequest(BaseModel):
    telegram_token: str