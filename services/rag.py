import asyncio
from vector_store.chroma_client import get_collection, delete_doc_chunks
from services.llm import embed_batch, embed_query


# Fix #12: one batched API call instead of N+1 sequential calls
async def index_chunks(bot_id: str, doc_id: str, chunks: list[str]) -> int:
    collection = await asyncio.to_thread(get_collection, bot_id)
    embeddings = await embed_batch(chunks)
    ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [{"doc_id": doc_id} for _ in chunks]
    await asyncio.to_thread(
        collection.add, ids=ids, embeddings=embeddings,
        documents=chunks, metadatas=metadatas,
    )
    return len(chunks)


async def retrieve(bot_id: str, query: str, top_k: int = 4) -> list[str]:
    collection = await asyncio.to_thread(get_collection, bot_id)
    count = await asyncio.to_thread(collection.count)
    if count == 0:
        return []
    query_embedding = await embed_query(query)
    results = await asyncio.to_thread(
        collection.query,
        query_embeddings=[query_embedding],
        n_results=min(top_k, count),
    )
    return results["documents"][0] if results["documents"] else []


async def remove_document(bot_id: str, doc_id: str):
    await asyncio.to_thread(delete_doc_chunks, bot_id, doc_id)