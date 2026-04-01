import asyncio
from google import genai
from google.genai import types
from core.config import settings
from fastapi import Request
import time 

_client = genai.Client(api_key=settings.GOOGLE_API_KEY)

# Fix #10: use settings instead of hardcoded "gemini-embedding-001"
EMBED_MODEL = settings.EMBEDDING_MODEL   # models/text-embedding-004
CHAT_MODEL  = settings.GEMINI_MODEL      # gemini-2.0-flash-lite


# ── sync internals (run in thread pool) ──────────────────────────────────────

def _sync_embed(text: str) -> list[float]:
    result = _client.models.embed_content(model=EMBED_MODEL, contents=text)
    return result.embeddings[0].values


def _sync_embed_batch(texts: list[str]) -> list[list[float]]:
    """True batchEmbedContents — 1 API request per 100 chunks."""
    BATCH_SIZE = 100
    WINDOW_SECONDS = 65
    all_embeddings: list[list[float]] = []

    for i in range(0, len(texts), BATCH_SIZE):
        chunk = texts[i : i + BATCH_SIZE]
        start = time.time()

        for attempt in range(3):
            try:
                requests = [                                          # ✅ build list
                    types.EmbedContentRequest(
                        model=EMBED_MODEL,
                        contents=text                                 # one text per request object
                    )
                    for text in chunk
                ]
                result = _client.models.batch_embed_contents(
                    model=EMBED_MODEL,
                    requests=requests,                                # ✅ pass the list
                )
                all_embeddings.extend(e.values for e in result.embeddings)
                break
            except Exception as e:
                if "429" in str(e) and attempt < 2:
                    wait = 30 * (attempt + 1)
                    print(f"[embed] 429 rate limited, waiting {wait}s...")
                    time.sleep(wait)
                else:
                    raise

        if i + BATCH_SIZE < len(texts):
            elapsed = time.time() - start
            sleep_for = max(0, WINDOW_SECONDS - elapsed)
            print(f"[embed] batch {i//BATCH_SIZE + 1} done, sleeping {sleep_for:.1f}s")
            time.sleep(sleep_for)

    return all_embeddings


def _sync_generate(system_prompt: str, context: str, question: str) -> tuple[str, int]:
    # Fix #4: system_prompt ONLY in system_instruction, NOT repeated in contents
    prompt = (
        f"CONTEXT FROM KNOWLEDGE BASE:\n{context}\n\n"
        f"USER QUESTION: {question}\n\n"
        "Answer based only on the context above."
    )
    response = _client.models.generate_content(
        model=CHAT_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(system_instruction=system_prompt),
    )
    text = response.text or "I could not generate a response."
    tokens = response.usage_metadata.total_token_count if response.usage_metadata else 0
    return text, tokens


# ── async public API (Fix #1: never blocks the event loop) ───────────────────

async def embed_text(text: str) -> list[float]:
    return await asyncio.to_thread(_sync_embed, text)

async def embed_query(text: str) -> list[float]:
    return await asyncio.to_thread(_sync_embed, text)

async def embed_batch(texts: list[str]) -> list[list[float]]:
    return await asyncio.to_thread(_sync_embed_batch, texts)

async def generate_answer(system_prompt: str, context: str, question: str) -> tuple[str, int]:
    return await asyncio.to_thread(_sync_generate, system_prompt, context, question)

def _sync_generate_with_history(
    system_prompt: str,
    context: str,
    history: list[dict],   # [{"role": "user"|"model", "parts": [{"text": "..."}]}]
    question: str,
) -> tuple[str, int]:
    # Build conversation as a list of Content objects
    contents = []
    for msg in history:
        contents.append(types.Content(role=msg["role"], parts=[types.Part(text=msg["parts"][0]["text"])]))

    # Append the new user turn with context injected
    user_turn = (
        f"CONTEXT FROM KNOWLEDGE BASE:\n{context}\n\n"
        f"USER QUESTION: {question}\n\n"
        "Answer based only on the context above."
    )
    contents.append(types.Content(role="user", parts=[types.Part(text=user_turn)]))

    response = _client.models.generate_content(
        model=CHAT_MODEL,
        contents=contents,
        config=types.GenerateContentConfig(system_instruction=system_prompt),
    )
    text = response.text or "I could not generate a response."
    tokens = response.usage_metadata.total_token_count if response.usage_metadata else 0
    return text, tokens


async def generate_answer_with_history(
    system_prompt: str,
    context: str,
    history: list[dict],
    question: str,
) -> tuple[str, int]:
    return await asyncio.to_thread(
        _sync_generate_with_history, system_prompt, context, history, question
    )