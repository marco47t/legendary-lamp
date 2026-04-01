import pytest
import asyncio
from core.security import (
    hash_password, verify_password,
    async_hash_password, async_verify_password,
    create_access_token, decode_access_token,
    create_refresh_token, hash_refresh_token,
    generate_api_key, encrypt_token, decrypt_token,
)


def test_password_hash_verify():
    h = hash_password("secret")
    assert verify_password("secret", h)
    assert not verify_password("wrong", h)


@pytest.mark.asyncio
async def test_async_password_hash_verify():
    h = await async_hash_password("secret")
    assert await async_verify_password("secret", h)
    assert not await async_verify_password("wrong", h)


def test_access_token_roundtrip():
    token = create_access_token("user-123")
    assert decode_access_token(token) == "user-123"


def test_access_token_invalid():
    from jose import JWTError
    with pytest.raises(JWTError):
        decode_access_token("garbage")


def test_refresh_token_hash_consistent():
    raw, h1 = create_refresh_token()
    h2 = hash_refresh_token(raw)
    assert h1 == h2


def test_refresh_tokens_are_unique():
    raw1, _ = create_refresh_token()
    raw2, _ = create_refresh_token()
    assert raw1 != raw2


def test_api_key_format():
    raw, hashed = generate_api_key()
    assert raw.startswith("sk-")
    assert len(hashed) == 64  # sha256 hex


def test_telegram_token_encrypt_decrypt():
    token = "123456:ABCdef"
    encrypted = encrypt_token(token)
    assert encrypted != token
    assert decrypt_token(encrypted) == token


@pytest.mark.asyncio
async def test_concurrent_bcrypt_calls():
    """bcrypt via asyncio.to_thread — 4 concurrent hashes must all complete."""
    results = await asyncio.gather(*[
        async_hash_password(f"password{i}") for i in range(4)
    ])
    assert len(results) == 4
    for i, h in enumerate(results):
        assert await async_verify_password(f"password{i}", h)