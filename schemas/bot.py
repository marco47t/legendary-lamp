from pydantic import BaseModel, field_validator
from datetime import datetime

DEFAULT_PERSONA = (
    "You are a helpful assistant. Answer questions ONLY based on the "
    "provided context. If the answer is not in the context, say: "
    "'I don't have information about that in my knowledge base.' "
    "Be concise and friendly."
)


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
    persona: str          # always a string in the response
    language: str
    telegram_webhook_active: bool
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}

    # fix #17: if DB row has NULL persona, substitute the default instead of crashing
    @field_validator("persona", mode="before")
    @classmethod
    def fill_persona(cls, v: str | None) -> str:
        return v if v is not None else DEFAULT_PERSONA
    
class TelegramDeployRequest(BaseModel):
    telegram_token: str