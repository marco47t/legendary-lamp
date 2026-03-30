from pydantic import BaseModel


class ChatRequest(BaseModel):
    bot_id: str
    message: str
    session_id: str | None = None


class ChatResponse(BaseModel):
    answer: str
    sources: list[str] = []
    session_id: str