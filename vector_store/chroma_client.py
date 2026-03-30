import chromadb
from chromadb.config import Settings as ChromaSettings
from core.config import settings

_client = None


def get_chroma_client():
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_PATH,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
    return _client


def get_collection(bot_id: str):
    return get_chroma_client().get_or_create_collection(
        name=f"bot_{bot_id}",
        metadata={"hnsw:space": "cosine"},
    )


def delete_collection(bot_id: str):
    try:
        get_chroma_client().delete_collection(f"bot_{bot_id}")
    except Exception:
        pass


def delete_doc_chunks(bot_id: str, doc_id: str):
    collection = get_collection(bot_id)
    results = collection.get(where={"doc_id": doc_id})
    if results["ids"]:
        collection.delete(ids=results["ids"])