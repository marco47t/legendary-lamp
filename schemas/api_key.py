from pydantic import BaseModel
from datetime import datetime


class APIKeyCreate(BaseModel):
    label: str = "My Key"


class APIKeyCreated(BaseModel):
    id: str
    label: str
    raw_key: str  # shown ONCE, never stored
    created_at: datetime

    model_config = {"from_attributes": True}


class APIKeyOut(BaseModel):
    id: str
    label: str
    last_used: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}