import pytest
from httpx import AsyncClient
from conftest import make_user


@pytest.mark.asyncio
async def test_create_api_key(client: AsyncClient, db):
    _, token = await make_user(db, "keymaker@test.com")
    r = await client.post("/api-keys/", json={"label": "My Key"},
                          headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 201
    data = r.json()
    assert "id" in data
    assert data["key"].startswith("sk-")
    assert len(data["key_preview"]) == 4
    assert data["key"][-4:] == data["key_preview"]

@pytest.mark.asyncio
async def test_api_key_not_shown_in_list(client: AsyncClient, db):
    """Raw key must be None in list response — fix #15."""
    _, token = await make_user(db, "keyhide@test.com")
    await client.post("/api-keys/", json={"label": "Hidden"},
                      headers={"Authorization": f"Bearer {token}"})
    r = await client.get("/api-keys/", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    for key in r.json():
        assert key.get("key") is None  # never returned again after creation

@pytest.mark.asyncio
async def test_api_key_auth(client: AsyncClient, db):
    _, token = await make_user(db, "keyauth@test.com")
    create_r = await client.post("/api-keys/", json={"label": "Auth Key"},
                                 headers={"Authorization": f"Bearer {token}"})
    assert create_r.status_code == 201
    raw_key = create_r.json()["key"]
    r = await client.get("/bots/", headers={"X-API-Key": raw_key})
    assert r.status_code == 200

@pytest.mark.asyncio
async def test_api_key_not_shown_in_list(client: AsyncClient, db):
    _, token = await make_user(db, "keyhide@test.com")
    await client.post("/api-keys/", json={"label": "Hidden"},
                      headers={"Authorization": f"Bearer {token}"})
    r = await client.get("/api-keys/", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    for key in r.json():
        assert key.get("key") is None


@pytest.mark.asyncio
async def test_invalid_api_key(client: AsyncClient):
    r = await client.get("/bots/", headers={"X-API-Key": "sk-totallyFake"})
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_revoke_api_key(client: AsyncClient, db):
    _, token = await make_user(db, "keyrevoke@test.com")
    create_r = await client.post("/api-keys/", json={"label": "Revokable"},
                                 headers={"Authorization": f"Bearer {token}"})
    assert create_r.status_code == 201
    key_id = create_r.json()["id"]
    raw_key = create_r.json()["key"]

    r_del = await client.delete(f"/api-keys/{key_id}",
                                headers={"Authorization": f"Bearer {token}"})
    assert r_del.status_code == 204

    r_use = await client.get("/bots/", headers={"X-API-Key": raw_key})
    assert r_use.status_code == 401