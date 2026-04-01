import os
# MUST be before any app imports — sets env before pydantic reads them
os.environ["SECRET_KEY"]      = "testsecretkey1234567890abcdef12345678"
os.environ["ENCRYPTION_KEY"]  = "APSUNWZiOsjO3Q5c4tWCXwTpKXzDR5QXVhz8QihwRS8="
os.environ["DATABASE_URL"]    = "sqlite+aiosqlite:///:memory:"
os.environ["GOOGLE_API_KEY"]  = "fake-key-for-tests"
os.environ["APP_BASE_URL"]    = "http://localhost:8000"
os.environ["ALLOWED_ORIGINS"] = "http://localhost:3000"

import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from unittest.mock import AsyncMock, patch, MagicMock

from main import app
from core.database import get_db, Base
from core.security import create_access_token, generate_api_key
from models.user import User, UserType
from models.bot import Bot
from models.api_key import APIKey

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"
test_engine = create_async_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSession = async_sessionmaker(test_engine, expire_on_commit=False)


async def override_get_db():
    async with TestSession() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(scope="session", autouse=True)
async def create_tables():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db() -> AsyncSession:
    async with TestSession() as session:
        yield session


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


async def make_user(db, email="user@test.com", user_type=UserType.developer) -> tuple[User, str]:
    from core.security import hash_password
    user = User(email=email, password_hash=hash_password("password123"), user_type=user_type)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    token = create_access_token({"sub": user.id, "type": str(user.user_type)})  # ← dict!
    return user, token


async def make_bot(db, user_id: str, name="TestBot") -> Bot:
    bot = Bot(user_id=user_id, name=name, persona="You are a helpful assistant.")
    db.add(bot)
    await db.commit()
    await db.refresh(bot)
    return bot


@pytest.fixture(autouse=True)
def mock_llm():
    with patch("routers.chat.generate_answer_with_history",
               new_callable=AsyncMock, return_value=("Mocked answer.", 42)), \
         patch("routers.chat.retrieve",
               new_callable=AsyncMock, return_value=[]), \
         patch("services.llm.embed_text",
               new_callable=AsyncMock, return_value=[0.1] * 768), \
         patch("services.llm.embed_query",
               new_callable=AsyncMock, return_value=[0.1] * 768), \
         patch("services.llm.embed_batch",
               new_callable=AsyncMock, return_value=[[0.1] * 768]), \
         patch("services.llm.generate_answer",
               new_callable=AsyncMock, return_value=("Mocked answer.", 42)), \
         patch("services.llm.generate_answer_with_history",
               new_callable=AsyncMock, return_value=("Mocked answer.", 42)), \
         patch("services.rag.retrieve",
               new_callable=AsyncMock, return_value=[]):
        yield


@pytest.fixture(autouse=True)
def mock_chroma():
    mock_col = MagicMock()
    mock_col.count.return_value = 0
    mock_col.query.return_value = {"documents": [[]]}
    mock_col.add.return_value = None
    mock_col.get.return_value = {"ids": []}
    mock_col.delete.return_value = None
    with patch("vector_store.chroma_client._client") as mock_client:
        mock_client.get_or_create_collection.return_value = mock_col
        mock_client.delete_collection.return_value = None
        yield mock_client