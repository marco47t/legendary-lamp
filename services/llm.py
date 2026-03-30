from google import genai
from google.genai import types
from core.config import settings

_client = genai.Client(api_key=settings.GOOGLE_API_KEY)

EMBED_MODEL = "gemini-embedding-001"
CHAT_MODEL = settings.GEMINI_MODEL  # gemini-2.0-flash-lite


def embed_text(text: str) -> list[float]:
    result = _client.models.embed_content(model=EMBED_MODEL, contents=text)
    return result.embeddings[0].values


def embed_query(text: str) -> list[float]:
    result = _client.models.embed_content(model=EMBED_MODEL, contents=text)
    return result.embeddings[0].values


def generate_answer(system_prompt: str, context: str, question: str) -> tuple[str, int]:
    prompt = f"""{system_prompt}

---
CONTEXT FROM KNOWLEDGE BASE:
{context}
---

USER QUESTION: {question}

Answer based only on the context above."""

    response = _client.models.generate_content(
        model=CHAT_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
        )
    )
    text = response.text or "I could not generate a response."
    tokens = response.usage_metadata.total_token_count if response.usage_metadata else 0
    return text, tokens