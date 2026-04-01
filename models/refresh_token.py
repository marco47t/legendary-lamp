import secrets
from datetime import datetime, timedelta, timezone
from sqlalchemy import String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[str] = mapped_column(String, primary_key=True,
                                    default=lambda: secrets.token_hex(8))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    token_hash: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc) + timedelta(days=30)
    )
    revoked: Mapped[bool] = mapped_column(Boolean, default=False)

    user = relationship("User", back_populates="refresh_tokens")
