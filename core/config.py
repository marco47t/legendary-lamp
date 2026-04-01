from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "DocBot"
    SECRET_KEY: str
    ENCRYPTION_KEY: str
    DATABASE_URL: str
    GOOGLE_API_KEY: str
    GEMINI_MODEL: str = "gemini-3.1-flash-lite-preview"        # ← fixed (was gemini-3.1 which doesn't exist)
    EMBEDDING_MODEL: str = "gemini-embedding-001"        # ← fixed (removed models/ prefix)
    CHROMA_PERSIST_PATH: str = "./vector_store/data"
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 20
    APP_BASE_URL: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ALLOWED_ORIGINS: str = "*"
    TELEGRAM_WEBHOOK_SECRET: str = ""                  # ← added (empty default = Telegram optional)

    @property
    def allowed_origins_list(self) -> list[str]:
        v = self.ALLOWED_ORIGINS.strip()
        if v.startswith("["):
            import json
            return json.loads(v)
        return [o.strip() for o in v.split(",") if o.strip()]


settings = Settings()