from vector_store.chroma_client import get_collection, delete_doc_chunks
from services.llm import embed_text, embed_query


def index_chunks(bot_id: str, doc_id: str, chunks: list[str]) -> int:
    collection = get_collection(bot_id)
    embeddings = [embed_text(chunk) for chunk in chunks]
    ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [{"doc_id": doc_id} for _ in chunks]

    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=chunks,
        metadatas=metadatas,
    )
    return len(chunks)


def retrieve(bot_id: str, query: str, top_k: int = 4) -> list[str]:
    collection = get_collection(bot_id)
    if collection.count() == 0:
        return []

    query_embedding = embed_query(query)
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(top_k, collection.count()),
    )
    return results["documents"][0] if results["documents"] else []


def remove_document(bot_id: str, doc_id: str):
    delete_doc_chunks(bot_id, doc_id)