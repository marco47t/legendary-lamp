from pydantic import BaseModel
from datetime import datetime


class DocumentOut(BaseModel):
    id: str
    filename: str
    file_type: str
    status: str
    chunk_count: int
    error_message: str | None
    uploaded_at: datetime

    model_config = {"from_attributes": True}