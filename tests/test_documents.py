import io
import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient
from conftest import make_user, make_bot


def pdf_bytes():
    return b"%PDF-1.4 fake pdf content for testing"


@pytest.mark.asyncio
async def test_upload_document(client: AsyncClient, db):
    user, token = await make_user(db, "docup@test.com")
    bot = await make_bot(db, user.id)
    with patch("routers.documents._ingest", new_callable=AsyncMock):
        r = await client.post(
            f"/bots/{bot.id}/documents/",
            files={"file": ("test.txt", io.BytesIO(b"Hello world content"), "text/plain")},
            headers={"Authorization": f"Bearer {token}"},
        )
    assert r.status_code == 201
    assert r.json()["filename"] == "test.txt"
    assert r.json()["status"] == "pending"


@pytest.mark.asyncio
async def test_upload_wrong_bot(client: AsyncClient, db):
    user1, _ = await make_user(db, "docwrong1@test.com")
    _, token2 = await make_user(db, "docwrong2@test.com")
    bot = await make_bot(db, user1.id)
    r = await client.post(
        f"/bots/{bot.id}/documents/",
        files={"file": ("test.txt", io.BytesIO(b"Hello"), "text/plain")},
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_upload_unsupported_type(client: AsyncClient, db):
    user, token = await make_user(db, "doctype@test.com")
    bot = await make_bot(db, user.id)
    r = await client.post(
        f"/bots/{bot.id}/documents/",
        files={"file": ("image.png", io.BytesIO(b"fake png"), "image/png")},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 415


@pytest.mark.asyncio
async def test_upload_exceeds_size(client: AsyncClient, db):
    user, token = await make_user(db, "docsize@test.com")
    bot = await make_bot(db, user.id)
    big = b"x" * (21 * 1024 * 1024)  # 21MB > 20MB limit
    r = await client.post(
        f"/bots/{bot.id}/documents/",
        files={"file": ("big.txt", io.BytesIO(big), "text/plain")},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 413


@pytest.mark.asyncio
async def test_list_documents(client: AsyncClient, db):
    user, token = await make_user(db, "doclist@test.com")
    bot = await make_bot(db, user.id)
    with patch("routers.documents._ingest", new_callable=AsyncMock):
        await client.post(
            f"/bots/{bot.id}/documents/",
            files={"file": ("a.txt", io.BytesIO(b"content"), "text/plain")},
            headers={"Authorization": f"Bearer {token}"},
        )
    r = await client.get(f"/bots/{bot.id}/documents/",
                         headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert len(r.json()) == 1


@pytest.mark.asyncio
async def test_delete_document(client: AsyncClient, db):
    user, token = await make_user(db, "docdel@test.com")
    bot = await make_bot(db, user.id)
    with patch("routers.documents._ingest", new_callable=AsyncMock):
        up = await client.post(
            f"/bots/{bot.id}/documents/",
            files={"file": ("del.txt", io.BytesIO(b"bye"), "text/plain")},
            headers={"Authorization": f"Bearer {token}"},
        )
    assert up.status_code == 201          # ← assert it uploaded first
    doc_id = up.json()["id"]
    with patch("services.rag.remove_document"), \
         patch("os.path.exists", return_value=False):   # ← skip actual file delete
        r = await client.delete(f"/bots/{bot.id}/documents/{doc_id}",
                                headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 204