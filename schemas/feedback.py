from pydantic import BaseModel, field_validator
from datetime import datetime


class FeedbackCreate(BaseModel):
    usage_log_id: str
    rating: int
    comment: str | None = None

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v: int) -> int:
        if v not in (1, -1):
            raise ValueError("rating must be 1 (positive) or -1 (negative)")
        return v


class FeedbackOut(BaseModel):
    id: str
    usage_log_id: str
    bot_id: str
    rating: int
    comment: str | None
    created_at: datetime

    model_config = {"from_attributes": True}