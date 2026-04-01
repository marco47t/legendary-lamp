import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


class Bot(Base):
    __tablename__ = "bots"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    persona: Mapped[str] = mapped_column(
        Text,
        default=(
            "You are a helpful assistant. Answer questions ONLY based on the "
            "provided context. If the answer is not in the context, say: "
            "'I don't have information about that in my knowledge base.' "
            "Be concise and friendly."
        ),
    )
    language: Mapped[str] = mapped_column(String(10), default="en")

    telegram_token_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)
    telegram_webhook_active: Mapped[bool] = mapped_column(Boolean, default=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user = relationship("User", back_populates="bots")
    documents = relationship("Document", back_populates="bot", cascade="all, delete-orphan")
    usage_logs = relationship("UsageLog", back_populates="bot", cascade="all, delete-orphan")
    # fix #5: conversation history
    chat_messages = relationship("ChatMessage", back_populates="bot", cascade="all, delete-orphan")