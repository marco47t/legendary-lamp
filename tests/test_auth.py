import pytest
from httpx import AsyncClient
from conftest import make_user


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    r = await client.post("/auth/register", json={
        "email": "new@test.com", "password": "password123", "user_type": "developer"
    })
    assert r.status_code == 201
    assert "access_token" in r.json()
    assert "refresh_token" in r.json()


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    payload = {"email": "dup@test.com", "password": "password123", "user_type": "developer"}
    await client.post("/auth/register", json=payload)
    r = await client.post("/auth/register", json=payload)
    assert r.status_code == 409@pytest.mark.asyncio
    
async def test_register_duplicate_email(client: AsyncClient):
    payload = {"email": "dup@test.com", "password": "password123", "user_type": "developer"}
    await client.post("/auth/register", json=payload)
    r = await client.post("/auth/register", json=payload)
    assert r.status_code == 409   # ← was 400, now 409


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    await client.post("/auth/register", json={
        "email": "login@test.com", "password": "password123", "user_type": "developer"
    })
    r = await client.post("/auth/login", json={
        "email": "login@test.com", "password": "password123"
    })
    assert r.status_code == 200
    assert "access_token" in r.json()
    assert "refresh_token" in r.json()


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await client.post("/auth/register", json={
        "email": "wrongpass@test.com", "password": "correct", "user_type": "developer"
    })
    r = await client.post("/auth/login", json={
        "email": "wrongpass@test.com", "password": "wrong"
    })
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient):
    r = await client.post("/auth/login", json={
        "email": "ghost@test.com", "password": "whatever"
    })
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token_rotation(client: AsyncClient):
    reg = await client.post("/auth/register", json={
        "email": "refresh@test.com", "password": "password123", "user_type": "developer"
    })
    refresh_token = reg.json()["refresh_token"]

    r = await client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert r.status_code == 200
    assert "access_token" in r.json()


@pytest.mark.asyncio
async def test_refresh_token_cannot_be_reused(client: AsyncClient):
    reg = await client.post("/auth/register", json={
        "email": "reuse@test.com", "password": "password123", "user_type": "developer"
    })
    refresh_token = reg.json()["refresh_token"]

    # use it once
    await client.post("/auth/refresh", json={"refresh_token": refresh_token})
    # reuse should fail
    r = await client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_refresh_invalid_token(client: AsyncClient):
    r = await client.post("/auth/refresh", json={"refresh_token": "fake-token"})
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_logout_revokes_token(client: AsyncClient):
    reg = await client.post("/auth/register", json={
        "email": "logout@test.com", "password": "password123", "user_type": "developer"
    })
    refresh_token = reg.json()["refresh_token"]

    await client.post("/auth/logout", json={"refresh_token": refresh_token})
    r = await client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_protected_route_no_token(client: AsyncClient):
    r = await client.get("/bots/")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_protected_route_invalid_token(client: AsyncClient):
    r = await client.get("/bots/", headers={"Authorization": "Bearer garbage"})
    assert r.status_code == 401