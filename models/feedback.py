import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, ForeignKey, SmallInteger, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


class Feedback(Base):
    __tablename__ = "feedback"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    usage_log_id: Mapped[str] = mapped_column(String, ForeignKey("usage_logs.id"), nullable=False, index=True)
    bot_id: Mapped[str] = mapped_column(String, ForeignKey("bots.id"), nullable=False, index=True)
    # 1 = positive, -1 = negative
    rating: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    usage_log = relationship("UsageLog", backref="feedback")
    bot = relationship("Bot", backref="feedback")