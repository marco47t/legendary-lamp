from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address


def get_user_id(request: Request) -> str:
    """Key by authenticated user ID — falls back to IP if not set."""
    user = getattr(request.state, "user", None)
    if user:
        return f"user:{user.id}"
    return get_remote_address(request)


def get_api_key(request: Request) -> str:
    """Key by the raw API key header value."""
    key = request.headers.get("X-API-Key") or request.headers.get("Authorization", "")
    return f"apikey:{key}" if key else get_remote_address(request)


def get_bot_id(request: Request) -> str:
    """Key by bot_id path param — correct for Telegram webhooks."""
    bot_id = request.path_params.get("bot_id", "")
    return f"bot:{bot_id}" if bot_id else get_remote_address(request)


# default limiter (IP) — used for auth endpoints where there's no identity yet
limiter = Limiter(key_func=get_remote_address)

# named limiters for specific contexts
user_limiter  = Limiter(key_func=get_user_id)
api_limiter   = Limiter(key_func=get_api_key)
bot_limiter   = Limiter(key_func=get_bot_id)