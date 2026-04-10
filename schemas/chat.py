from pydantic import BaseModel


class ChatRequest(BaseModel):
    bot_id: str
    message: str
    session_id: str | None = None


class ChatResponse(BaseModel):
    answer: str
    sources: list[dict] = []
    session_id: str
    usage_log_id: str | None = None 