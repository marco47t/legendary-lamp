from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from core.config import settings
from core.database import engine, Base
from core.limiter import limiter, user_limiter, api_limiter, bot_limiter

import models  # noqa: F401

from routers import auth, bots, documents, chat, telegram, api_keys


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="Multi-tenant document chatbot platform API",
    version="1.0.0",
    lifespan=lifespan,
)

# fix #8: attach limiter state and middleware
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# fix #13: lock CORS to your actual frontend domain via env var
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)
app.add_middleware(SlowAPIMiddleware)  # ← SlowAPI added AFTER CORS = runs inside CORS


app.include_router(auth.router)
app.include_router(bots.router)
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(telegram.router)
app.include_router(api_keys.router)


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME}