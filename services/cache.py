"""
Redis cache layer for PARLEY (redis-py with TLS for Upstash).

Responsibilities:
  - Fast session state cache (agent FSM state, last-known market)
  - Nudge cooldown tracking (prevent re-fire within cooldown window)
  - Nudge rate limiter (max nudges/minute per session)
  - Duplicate suppression set (seen nudge topics per session)
  - Live session ping / expiry (30-min TTL auto-cleanup)

All keys are namespaced with the session_id to avoid collision.
TTLs match the ARCHITECTURE.md cooldown settings (20s per topic, 60s for
rate-limit window, 30min for session heartbeat).
"""
from __future__ import annotations

import json
import os
import time
from typing import Any, Dict, List, Optional

import redis.asyncio as aioredis
from dotenv import load_dotenv

load_dotenv()

# ─────────────────────────────────────────────────────────────────────────────
# Connection (singleton)
# ─────────────────────────────────────────────────────────────────────────────

_client: Optional[aioredis.Redis] = None


def _get_client() -> aioredis.Redis:
    global _client
    if _client is None:
        redis_url = os.environ.get("REDIS_URL", "")
        if not redis_url:
            raise RuntimeError("REDIS_URL is not configured in environment.")
        _client = aioredis.from_url(
            redis_url,
            decode_responses=True,
            socket_timeout=5.0,
            socket_connect_timeout=5.0,
            retry_on_timeout=True,
        )
    return _client


async def redis_ping() -> bool:
    try:
        client = _get_client()
        result = await client.ping()
        return result is True
    except Exception:
        return False


# ─────────────────────────────────────────────────────────────────────────────
# Session heartbeat / expiry
# ─────────────────────────────────────────────────────────────────────────────

SESSION_TTL_S = 1800  # 30 minutes


async def session_touch(session_id: str, market: str = "in_en") -> None:
    """Create / refresh a live session entry with 30-min TTL."""
    client = _get_client()
    key = f"session:{session_id}"
    await client.hset(key, mapping={"market": market, "last_seen": time.time()})
    await client.expire(key, SESSION_TTL_S)


async def session_get(session_id: str) -> Optional[Dict[str, str]]:
    client = _get_client()
    data = await client.hgetall(f"session:{session_id}")
    return data or None


async def session_delete(session_id: str) -> None:
    client = _get_client()
    pipe = client.pipeline()
    pipe.delete(f"session:{session_id}")
    pipe.delete(f"cooldown:{session_id}")
    pipe.delete(f"rate:{session_id}")
    pipe.delete(f"seen:{session_id}")
    await pipe.execute()


# ─────────────────────────────────────────────────────────────────────────────
# Nudge cooldown (per topic, default 20s)
# ─────────────────────────────────────────────────────────────────────────────

async def cooldown_check(session_id: str, topic: str) -> bool:
    """Return True if topic is still in cooldown (should suppress)."""
    client = _get_client()
    key = f"cooldown:{session_id}:{topic}"
    return await client.exists(key) == 1


async def cooldown_set(session_id: str, topic: str, ttl_s: int = 20) -> None:
    """Mark a topic as fired; suppress until TTL expires."""
    client = _get_client()
    key = f"cooldown:{session_id}:{topic}"
    await client.set(key, "1", ex=ttl_s)


# ─────────────────────────────────────────────────────────────────────────────
# Rate limiter (max N nudges per 60-second window per session)
# ─────────────────────────────────────────────────────────────────────────────

async def rate_limit_check(session_id: str, max_per_minute: int = 6) -> bool:
    """Return True if session has hit the nudge rate limit (should suppress)."""
    client = _get_client()
    key = f"rate:{session_id}"
    current = await client.get(key)
    if current is None:
        return False
    return int(current) >= max_per_minute


async def rate_limit_increment(session_id: str, window_s: int = 60) -> int:
    """Increment counter; sets TTL on first increment. Returns new count."""
    client = _get_client()
    key = f"rate:{session_id}"
    pipe = client.pipeline()
    pipe.incr(key)
    pipe.expire(key, window_s)
    results = await pipe.execute()
    return results[0]


# ─────────────────────────────────────────────────────────────────────────────
# Duplicate suppression (semantic dedup within session window)
# ─────────────────────────────────────────────────────────────────────────────

async def dedup_seen(session_id: str, topic: str, window_s: int = 120) -> bool:
    """Return True if this exact topic was recently seen (duplicate)."""
    client = _get_client()
    key = f"seen:{session_id}"
    is_member = await client.sismember(key, topic)
    return bool(is_member)


async def dedup_add(session_id: str, topic: str, window_s: int = 120) -> None:
    """Mark a topic as seen within the dedup window."""
    client = _get_client()
    key = f"seen:{session_id}"
    pipe = client.pipeline()
    pipe.sadd(key, topic)
    pipe.expire(key, window_s)
    await pipe.execute()


# ─────────────────────────────────────────────────────────────────────────────
# Cache: KB search results (to avoid re-embedding on repeated queries)
# ─────────────────────────────────────────────────────────────────────────────

CACHE_TTL_S = 300  # 5 minutes


async def kb_cache_get(cache_key: str) -> Optional[List[Dict[str, Any]]]:
    client = _get_client()
    raw = await client.get(f"kb:{cache_key}")
    if raw:
        return json.loads(raw)
    return None


async def kb_cache_set(cache_key: str, results: List[Dict[str, Any]]) -> None:
    client = _get_client()
    await client.set(f"kb:{cache_key}", json.dumps(results), ex=CACHE_TTL_S)


# ─────────────────────────────────────────────────────────────────────────────
# Generic key/value helpers (for agent FSM state, etc.)
# ─────────────────────────────────────────────────────────────────────────────

async def cache_set(key: str, value: Any, ttl_s: int = 300) -> None:
    client = _get_client()
    serialized = json.dumps(value) if not isinstance(value, str) else value
    await client.set(key, serialized, ex=ttl_s)


async def cache_get(key: str) -> Optional[Any]:
    client = _get_client()
    raw = await client.get(key)
    if raw is None:
        return None
    try:
        return json.loads(raw)
    except Exception:
        return raw


async def cache_delete(key: str) -> None:
    client = _get_client()
    await client.delete(key)
