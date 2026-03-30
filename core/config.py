from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "DocBot"
    SECRET_KEY: str
    ENCRYPTION_KEY: str

    DATABASE_URL: str

    GOOGLE_API_KEY: str
    GEMINI_MODEL: str = "gemini-2.0-flash-lite"
    EMBEDDING_MODEL: str = "models/text-embedding-004"

    CHROMA_PERSIST_PATH: str = "./vector_store/data"

    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 20

    APP_BASE_URL: str

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 1 day


settings = Settings()