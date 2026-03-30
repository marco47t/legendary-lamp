import os
import uuid
import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.config import settings
from core.database import get_db
from models.user import User
from models.bot import Bot
from models.document import Document, DocumentStatus
from schemas.document import DocumentOut
from routers.deps import get_current_user
from services.ingestion import extract_text, chunk_text, get_file_type
from services.rag import index_chunks, remove_document

router = APIRouter(prefix="/bots/{bot_id}/documents", tags=["Documents"])


def _save_file(upload: UploadFile, bot_id: str, doc_id: str, ext: str) -> str:
    dir_path = Path(settings.UPLOAD_DIR) / bot_id
    dir_path.mkdir(parents=True, exist_ok=True)
    file_path = str(dir_path / f"{doc_id}.{ext}")
    with open(file_path, "wb") as f:
        shutil.copyfileobj(upload.file, f)
    return file_path


async def _ingest(doc_id: str, file_path: str, file_type: str, bot_id: str):
    from core.database import AsyncSessionLocal
    async with AsyncSessionLocal() as session:
        doc = await session.get(Document, doc_id)
        if not doc:
            return
        try:
            text = extract_text(file_path, file_type)
            chunks = chunk_text(text)
            count = index_chunks(bot_id, doc_id, chunks)
            doc.status = DocumentStatus.INDEXED
            doc.chunk_count = count
        except Exception as e:
            doc.status = DocumentStatus.FAILED
            doc.error_message = str(e)
        await session.commit()


@router.post("/", response_model=DocumentOut, status_code=201)
async def upload_document(
    bot_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    bot = await db.get(Bot, bot_id)
    if not bot or bot.user_id != user.id:
        raise HTTPException(status_code=404, detail="Bot not found")

    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"Max file size is {settings.MAX_FILE_SIZE_MB}MB")
    await file.seek(0)

    try:
        file_type = get_file_type(file.filename)
    except ValueError as e:
        raise HTTPException(status_code=415, detail=str(e))

    doc_id = str(uuid.uuid4())
    ext = Path(file.filename).suffix.lower().lstrip(".")
    file_path = _save_file(file, bot_id, doc_id, ext)

    doc = Document(
        id=doc_id,
        bot_id=bot_id,
        filename=file.filename,
        file_path=file_path,
        file_type=file_type,
        status=DocumentStatus.PENDING,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    background_tasks.add_task(_ingest, doc_id, file_path, file_type, bot_id)
    return doc


@router.get("/", response_model=list[DocumentOut])
async def list_documents(
    bot_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    bot = await db.get(Bot, bot_id)
    if not bot or bot.user_id != user.id:
        raise HTTPException(status_code=404, detail="Bot not found")
    result = await db.execute(select(Document).where(Document.bot_id == bot_id))
    return result.scalars().all()


@router.delete("/{doc_id}", status_code=204)
async def delete_document(
    bot_id: str,
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    bot = await db.get(Bot, bot_id)
    if not bot or bot.user_id != user.id:
        raise HTTPException(status_code=404, detail="Bot not found")
    doc = await db.get(Document, doc_id)
    if not doc or doc.bot_id != bot_id:
        raise HTTPException(status_code=404, detail="Document not found")

    remove_document(bot_id, doc_id)
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
    await db.delete(doc)
    await db.commit()