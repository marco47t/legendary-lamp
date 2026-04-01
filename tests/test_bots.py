import pytest
from httpx import AsyncClient
from conftest import make_user, make_bot
from models.bot import Bot

@pytest.mark.asyncio
async def test_create_bot(client: AsyncClient, db):
    _, token = await make_user(db, "botcreate@test.com")
    r = await client.post("/bots/", json={"name": "MyBot", "language": "en"},  # ← POST
                          headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "MyBot"
    assert data["language"] == "en"
    assert "id" in data


@pytest.mark.asyncio
async def test_create_bot_unauthenticated(client: AsyncClient):
    r = await client.post("/bots/", json={"name": "UnauthedBot"})
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_list_bots_empty(client: AsyncClient, db):
    _, token = await make_user(db, "botlist@test.com")
    r = await client.get("/bots/", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_list_bots_only_own(client: AsyncClient, db):
    user1, token1 = await make_user(db, "owner1@test.com")
    user2, token2 = await make_user(db, "owner2@test.com")
    await make_bot(db, user1.id, "Bot1")
    await make_bot(db, user2.id, "Bot2")

    r = await client.get("/bots/", headers={"Authorization": f"Bearer {token1}"})
    names = [b["name"] for b in r.json()]
    assert "Bot1" in names
    assert "Bot2" not in names  # must not see other user's bot


@pytest.mark.asyncio
async def test_get_bot(client: AsyncClient, db):
    user, token = await make_user(db, "botget@test.com")
    bot = await make_bot(db, user.id)
    r = await client.get(f"/bots/{bot.id}", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["id"] == bot.id


@pytest.mark.asyncio
async def test_get_bot_wrong_user(client: AsyncClient, db):
    user1, _ = await make_user(db, "botowner@test.com")
    _, token2 = await make_user(db, "botnowner@test.com")
    bot = await make_bot(db, user1.id)
    r = await client.get(f"/bots/{bot.id}", headers={"Authorization": f"Bearer {token2}"})
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_update_bot(client: AsyncClient, db):
    user, token = await make_user(db, "botupdate@test.com")
    bot = await make_bot(db, user.id)
    r = await client.put(f"/bots/{bot.id}",        # ← PUT not PATCH
                         json={"name": "UpdatedName"},
                         headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["name"] == "UpdatedName"


@pytest.mark.asyncio
async def test_delete_bot(client: AsyncClient, db):
    user, token = await make_user(db, "botdelete@test.com")
    bot = await make_bot(db, user.id)
    r = await client.delete(f"/bots/{bot.id}", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 204
    r2 = await client.get(f"/bots/{bot.id}", headers={"Authorization": f"Bearer {token}"})
    assert r2.status_code == 404


@pytest.mark.asyncio
async def test_delete_bot_wrong_user(client: AsyncClient, db):
    user1, _ = await make_user(db, "delowner@test.com")
    _, token2 = await make_user(db, "delnowner@test.com")
    bot = await make_bot(db, user1.id)
    r = await client.delete(f"/bots/{bot.id}", headers={"Authorization": f"Bearer {token2}"})
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_bot_persona_null_fallback(client: AsyncClient, db):
    user, token = await make_user(db, "nullpersona@test.com")
    bot = Bot(user_id=user.id, name="NullPersona", persona=None)
    db.add(bot)
    await db.commit()
    await db.refresh(bot)
    r = await client.get(f"/bots/{bot.id}",
                         headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert isinstance(r.json()["persona"], str)
    assert len(r.json()["persona"]) > 0


@pytest.mark.asyncio
async def test_get_nonexistent_bot(client: AsyncClient, db):
    _, token = await make_user(db, "ghost@test.com")
    r = await client.get("/bots/does-not-exist",
                         headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 404