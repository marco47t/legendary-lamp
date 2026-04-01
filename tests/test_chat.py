import pytest
import asyncio
from httpx import AsyncClient
from conftest import make_user, make_bot


@pytest.mark.asyncio
async def test_chat_basic(client: AsyncClient, db):
    user, token = await make_user(db, "chat1@test.com")
    bot = await make_bot(db, user.id)
    r = await client.post("/chat", json={"bot_id": bot.id, "message": "Hello"},
                          headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["answer"] == "Mocked answer."
    assert "session_id" in r.json()


@pytest.mark.asyncio
async def test_chat_session_persists(client: AsyncClient, db):
    """Same session_id across calls — history should accumulate."""
    user, token = await make_user(db, "chatsession@test.com")
    bot = await make_bot(db, user.id)

    r1 = await client.post("/chat", json={"bot_id": bot.id, "message": "Hi", "session_id": "s1"},
                           headers={"Authorization": f"Bearer {token}"})
    assert r1.json()["session_id"] == "s1"

    r2 = await client.post("/chat", json={"bot_id": bot.id, "message": "Follow up", "session_id": "s1"},
                           headers={"Authorization": f"Bearer {token}"})
    assert r2.json()["session_id"] == "s1"


@pytest.mark.asyncio
async def test_chat_auto_generates_session(client: AsyncClient, db):
    """No session_id sent → one is created and returned."""
    user, token = await make_user(db, "chatautosession@test.com")
    bot = await make_bot(db, user.id)
    r = await client.post("/chat", json={"bot_id": bot.id, "message": "Hi"},
                          headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert len(r.json()["session_id"]) > 0


@pytest.mark.asyncio
async def test_chat_wrong_bot_ownership(client: AsyncClient, db):
    """User must not be able to chat with another user's bot — fix #20."""
    user1, _ = await make_user(db, "chatowner@test.com")
    _, token2 = await make_user(db, "chatnowner@test.com")
    bot = await make_bot(db, user1.id)
    r = await client.post("/chat", json={"bot_id": bot.id, "message": "Hi"},
                          headers={"Authorization": f"Bearer {token2}"})
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_chat_nonexistent_bot(client: AsyncClient, db):
    _, token = await make_user(db, "chatnobot@test.com")
    r = await client.post("/chat", json={"bot_id": "00000000-fake", "message": "Hi"},
                          headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_chat_unauthenticated(client: AsyncClient, db):
    user, _ = await make_user(db, "chatunauth@test.com")
    bot = await make_bot(db, user.id)
    r = await client.post("/chat", json={"bot_id": bot.id, "message": "Hi"})
    assert r.status_code == 401


# ── CONCURRENCY: 4 users chat simultaneously ─────────────────────────────────

@pytest.mark.asyncio
async def test_4_concurrent_users(client: AsyncClient, db):
    """4 users fire requests at the same time — all must get independent responses."""
    users = []
    for i in range(4):
        user, token = await make_user(db, f"concurrent{i}@test.com")
        bot = await make_bot(db, user.id, f"ConcurrentBot{i}")
        users.append((token, bot.id, f"session-{i}"))

    async def fire(token, bot_id, session_id):
        return await client.post(
            "/chat",
            json={"bot_id": bot_id, "message": "What is 2+2?", "session_id": session_id},
            headers={"Authorization": f"Bearer {token}"},
        )

    results = await asyncio.gather(*[fire(t, b, s) for t, b, s in users])

    for r in results:
        assert r.status_code == 200
        assert r.json()["answer"] == "Mocked answer."

    # each response must have its own session_id
    sessions = [r.json()["session_id"] for r in results]
    assert len(set(sessions)) == 4


@pytest.mark.asyncio
async def test_same_user_concurrent_sessions(client: AsyncClient, db):
    """1 user opens 4 tabs (4 different session_ids) simultaneously."""
    user, token = await make_user(db, "multichat@test.com")
    bot = await make_bot(db, user.id)

    async def fire(session_id):
        return await client.post(
            "/chat",
            json={"bot_id": bot.id, "message": "Hello", "session_id": session_id},
            headers={"Authorization": f"Bearer {token}"},
        )

    results = await asyncio.gather(*[fire(f"tab-{i}") for i in range(4)])
    for r in results:
        assert r.status_code == 200

    # all returned their respective session_ids
    for i, r in enumerate(results):
        assert r.json()["session_id"] == f"tab-{i}"


@pytest.mark.asyncio
async def test_empty_message(client: AsyncClient, db):
    user, token = await make_user(db, "chatempty@test.com")
    bot = await make_bot(db, user.id)
    r = await client.post("/chat", json={"bot_id": bot.id, "message": ""},
                          headers={"Authorization": f"Bearer {token}"})
    # empty string is still technically valid — LLM handles it
    assert r.status_code in (200, 422)