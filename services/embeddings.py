"""
Cohere Embedding service for PARLEY (embed-multilingual-v3.0).

Used for:
  1. KB pipeline: embed all chunks at index build time, store vectors in
     PostgreSQL pgvector for production semantic search.
  2. Retrieval: embed the user query at search time, run cosine similarity
     against stored chunk embeddings (via services/db.py vector_search).
  3. Cache: query embeddings are cached in Redis for 5 minutes to avoid
     re-embedding identical or near-identical queries.

Dimension: 1024 (embed-multilingual-v3.0 output dim)
Input type: "search_query" for queries, "search_document" for chunks
Rate limit: 100 requests/min on free tier — batch chunks accordingly.
"""
from __future__ import annotations

import hashlib
import os
import time
from typing import Any, Dict, List, Optional

import httpx
from dotenv import load_dotenv

load_dotenv()

EMBEDDING_BASE_URL = os.environ.get(
    "EMBEDDING_BASE_URL",
    "https://api.cohere.com/compatibility/v1"
)
EMBEDDING_API_KEY = os.environ.get("EMBEDDING_API_KEY", "")
EMBEDDING_MODEL = os.environ.get("EMBEDDING_MODEL", "embed-multilingual-v3.0")
EMBEDDING_DIM = 1024  # embed-multilingual-v3.0 produces 1024-dim vectors


# ─────────────────────────────────────────────────────────────────────────────
# Core embed function (synchronous, uses httpx for simplicity in pipeline)
# ─────────────────────────────────────────────────────────────────────────────

def _embed_batch(
    texts: List[str],
    input_type: str = "search_document",
) -> List[List[float]]:
    """
    Embed a batch of texts using Cohere API (v1 /embed or OpenAI compatibility /embeddings).
    input_type: "search_query" for queries, "search_document" for chunks.
    Returns list of 1024-dim float vectors.
    """
    if not EMBEDDING_API_KEY:
        raise RuntimeError("EMBEDDING_API_KEY is not configured.")
    if not texts:
        return []

    headers = {
        "Authorization": f"Bearer {EMBEDDING_API_KEY}",
        "Content-Type": "application/json",
    }

    with httpx.Client(timeout=30.0) as client:
        if "compatibility" not in EMBEDDING_BASE_URL and "cohere.com" in EMBEDDING_BASE_URL:
            # Native Cohere v1 /embed endpoint
            url = f"{EMBEDDING_BASE_URL.rstrip('/')}/embed"
            payload = {
                "texts": texts,
                "model": EMBEDDING_MODEL,
                "input_type": input_type,
            }
            resp = client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            if "embeddings" in data:
                return data["embeddings"]
            raise ValueError(f"Unexpected Cohere response format: {list(data.keys())}")
        else:
            url = f"{EMBEDDING_BASE_URL.rstrip('/')}/embeddings"
            payload = {
                "model": EMBEDDING_MODEL,
                "input": texts,
                "encoding_format": "float",
            }
            resp = client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            if "data" in data:
                return [item["embedding"] for item in data["data"]]
            elif "embeddings" in data:
                return data["embeddings"]
            raise ValueError(f"Unexpected embedding response format: {list(data.keys())}")


def embed_query(query: str) -> List[float]:
    """Embed a single search query (input_type=search_query)."""
    t_start = time.perf_counter()
    vectors = _embed_batch([query], input_type="search_query")
    latency_ms = round((time.perf_counter() - t_start) * 1000, 1)
    if not vectors:
        return [0.0] * EMBEDDING_DIM
    return vectors[0]


def embed_documents(texts: List[str], batch_size: int = 96) -> List[List[float]]:
    """Embed multiple documents in batches (input_type=search_document)."""
    all_vectors = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        vectors = _embed_batch(batch, input_type="search_document")
        all_vectors.extend(vectors)
        if i + batch_size < len(texts):
            time.sleep(0.2)  # avoid rate-limit on free tier
    return all_vectors


def embed_query_with_cache(query: str, cache_ttl: int = 300) -> List[float]:
    """
    Embed a query with Redis caching.
    Falls back to direct embedding if Redis is unavailable.
    """
    cache_key = hashlib.sha256(
        f"{EMBEDDING_MODEL}:{query}".encode()
    ).hexdigest()[:16]

    # Try Redis cache first (synchronous fallback via event loop)
    try:
        import asyncio
        from services.cache import kb_cache_get

        loop = asyncio.get_event_loop()
        if loop.is_running():
            # In async context — can't use run_until_complete; skip cache
            pass
        else:
            cached = loop.run_until_complete(kb_cache_get(f"emb:{cache_key}"))
            if cached and isinstance(cached, list):
                return cached
    except Exception:
        pass

    vector = embed_query(query)

    try:
        import asyncio
        from services.cache import kb_cache_set

        loop = asyncio.get_event_loop()
        if not loop.is_running():
            loop.run_until_complete(kb_cache_set(f"emb:{cache_key}", vector))
    except Exception:
        pass

    return vector


# ─────────────────────────────────────────────────────────────────────────────
# Async wrappers (for use in FastAPI endpoints)
# ─────────────────────────────────────────────────────────────────────────────

async def async_embed_query(query: str) -> List[float]:
    """Async-safe query embedding with Redis cache."""
    cache_key = f"emb:{hashlib.sha256(f'{EMBEDDING_MODEL}:{query}'.encode()).hexdigest()[:16]}"
    try:
        from services.cache import kb_cache_get, kb_cache_set
        cached = await kb_cache_get(cache_key)
        if cached:
            return cached
    except Exception:
        pass

    import asyncio
    loop = asyncio.get_event_loop()
    vector = await loop.run_in_executor(None, embed_query, query)

    try:
        from services.cache import kb_cache_set
        await kb_cache_set(cache_key, vector)
    except Exception:
        pass

    return vector


# ─────────────────────────────────────────────────────────────────────────────
# Health check
# ─────────────────────────────────────────────────────────────────────────────

def cohere_ping() -> bool:
    try:
        v = embed_query("health check")
        return len(v) == EMBEDDING_DIM
    except Exception:
        return False
