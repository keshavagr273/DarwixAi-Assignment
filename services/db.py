"""
PostgreSQL data layer for PARLEY (asyncpg).
This is the source of truth for all persisted state:
  - KB records, chunks, versions
  - Calls, turns, bot sentences
  - Signals, nudges (fired + suppressed)
  - Spans (black-box telemetry)
  - CRM leads, callbacks, escalations
  - Eval runs

All functions are async-safe and use the shared pool.
"""
from __future__ import annotations

import json
import os
import time
import uuid
import asyncio
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional

import asyncpg
from dotenv import load_dotenv

load_dotenv()

# ─────────────────────────────────────────────────────────────────────────────
# Pool management (singleton, lazy init)
# ─────────────────────────────────────────────────────────────────────────────

_pool: Optional[asyncpg.Pool] = None
_POOL_LOCK = asyncio.Lock()


async def get_pool() -> asyncpg.Pool:
    """Return (or lazily create) the shared asyncpg pool."""
    global _pool
    try:
        current_loop = asyncio.get_running_loop()
    except RuntimeError:
        current_loop = None

    if _pool is not None:
        if not getattr(_pool, "_closed", False) and getattr(_pool, "_loop", None) is current_loop:
            return _pool
        else:
            _pool = None

    dsn = os.environ.get("DATABASE_URL", "")
    if not dsn:
        raise RuntimeError("DATABASE_URL is not configured in environment.")
    _pool = await asyncpg.create_pool(
        dsn=dsn,
        min_size=2,
        max_size=10,
        command_timeout=30,
        ssl="require",
    )
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


@asynccontextmanager
async def acquire():
    """Context manager yielding a pooled connection."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        yield conn


# ─────────────────────────────────────────────────────────────────────────────
# Health check
# ─────────────────────────────────────────────────────────────────────────────

async def db_ping() -> bool:
    global _pool
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            result = await conn.fetchval("SELECT 1")
        return result == 1
    except Exception:
        try:
            _pool = None
            pool = await get_pool()
            async with pool.acquire() as conn:
                result = await conn.fetchval("SELECT 1")
            return result == 1
        except Exception:
            return False


# ─────────────────────────────────────────────────────────────────────────────
# Calls
# ─────────────────────────────────────────────────────────────────────────────

async def insert_call(call_id: str, market: str, scenario: str, kb_version: str = "v1.1") -> None:
    async with acquire() as conn:
        await conn.execute(
            """
            INSERT INTO calls (call_id, market, scenario, kb_version, started_at)
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (call_id) DO NOTHING
            """,
            call_id, market, scenario, kb_version
        )


async def end_call_db(call_id: str, outcome: Dict[str, Any]) -> None:
    async with acquire() as conn:
        await conn.execute(
            """
            UPDATE calls SET ended_at = NOW(), outcome = $1
            WHERE call_id = $2
            """,
            json.dumps(outcome), call_id
        )


async def get_call(call_id: str) -> Optional[Dict[str, Any]]:
    async with acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM calls WHERE call_id = $1", call_id)
    if row:
        return dict(row)
    return None


async def list_calls(limit: int = 50) -> List[Dict[str, Any]]:
    async with acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM calls ORDER BY started_at DESC LIMIT $1", limit
        )
    return [dict(r) for r in rows]


# ─────────────────────────────────────────────────────────────────────────────
# Turns
# ─────────────────────────────────────────────────────────────────────────────

async def insert_turn(
    call_id: str,
    speaker: str,
    text: str,
    t_start: float,
    t_end: float,
    asr_conf: float = 1.0,
    lang_tags: Optional[List[str]] = None,
) -> str:
    turn_id = f"turn_{uuid.uuid4().hex[:12]}"
    trace_id = f"trace_{uuid.uuid4().hex[:12]}"
    async with acquire() as conn:
        await conn.execute(
            """
            INSERT INTO turns (turn_id, call_id, speaker, text, t_start, t_end, asr_conf, lang_tags, trace_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            """,
            turn_id, call_id, speaker, text,
            t_start, t_end, asr_conf,
            lang_tags or [], trace_id
        )
    return turn_id


# ─────────────────────────────────────────────────────────────────────────────
# Bot Sentences (Sentence Gate receipts)
# ─────────────────────────────────────────────────────────────────────────────

async def insert_bot_sentence(
    turn_id: str,
    text: str,
    status: str,
    citations: Optional[List[str]] = None,
) -> str:
    sentence_id = f"sent_{uuid.uuid4().hex[:12]}"
    async with acquire() as conn:
        await conn.execute(
            """
            INSERT INTO bot_sentences (sentence_id, turn_id, text, status, citations)
            VALUES ($1, $2, $3, $4, $5)
            """,
            sentence_id, turn_id, text, status, citations or []
        )
    return sentence_id


# ─────────────────────────────────────────────────────────────────────────────
# Nudges
# ─────────────────────────────────────────────────────────────────────────────

async def insert_nudge(
    session_id: str,
    decision: str,           # "fired" | "suppressed"
    reason: str,
    priority: str,           # "P0" | "P1" | "P2" | "P3"
    text: str,
    topic: str,
    confidence: float,
    trace_id: Optional[str] = None,
    signal_ids: Optional[List[str]] = None,
    expires_in_s: float = 30.0,
) -> str:
    nudge_id = f"nudge_{uuid.uuid4().hex[:12]}"
    from datetime import datetime, timezone, timedelta
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in_s)
    async with acquire() as conn:
        await conn.execute(
            """
            INSERT INTO nudges
              (nudge_id, session_id, decision, reason, priority, text,
               topic, confidence, expires_at, trace_id, signal_ids)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            """,
            nudge_id, session_id, decision, reason, priority, text,
            topic, confidence, expires_at,
            trace_id or f"trace_{uuid.uuid4().hex[:12]}",
            signal_ids or []
        )
    return nudge_id


async def get_session_nudges(session_id: str, limit: int = 100) -> List[Dict[str, Any]]:
    async with acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT * FROM nudges WHERE session_id = $1
            ORDER BY expires_at DESC LIMIT $2
            """,
            session_id, limit
        )
    return [dict(r) for r in rows]


# ─────────────────────────────────────────────────────────────────────────────
# Signals
# ─────────────────────────────────────────────────────────────────────────────

async def insert_signal(
    session_id: str,
    kind: str,
    confidence: float,
    span_text: str,
    tier: str = "tier1_rules",
) -> str:
    signal_id = f"sig_{uuid.uuid4().hex[:12]}"
    async with acquire() as conn:
        await conn.execute(
            """
            INSERT INTO signals (signal_id, session_id, kind, confidence, span_text, t, tier)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            """,
            signal_id, session_id, kind, confidence, span_text, time.time(), tier
        )
    return signal_id


# ─────────────────────────────────────────────────────────────────────────────
# Spans (black-box telemetry)
# ─────────────────────────────────────────────────────────────────────────────

async def insert_span(
    trace_id: str,
    stage: str,
    started_at_ms: int,
    ended_at_ms: int,
    provider: Optional[str] = None,
    parent_span_id: Optional[str] = None,
    meta: Optional[Dict[str, Any]] = None,
) -> str:
    span_id = f"span_{uuid.uuid4().hex[:12]}"
    async with acquire() as conn:
        await conn.execute(
            """
            INSERT INTO spans (span_id, trace_id, parent_span_id, stage,
                               started_at_ms, ended_at_ms, provider, meta)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            """,
            span_id, trace_id, parent_span_id, stage,
            started_at_ms, ended_at_ms, provider,
            json.dumps(meta or {})
        )
    return span_id


async def get_trace_spans_db(trace_id: str) -> List[Dict[str, Any]]:
    async with acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM spans WHERE trace_id = $1 ORDER BY started_at_ms",
            trace_id
        )
    return [dict(r) for r in rows]


# ─────────────────────────────────────────────────────────────────────────────
# CRM
# ─────────────────────────────────────────────────────────────────────────────

async def insert_crm_lead(
    session_id: str,
    customer_name: str,
    phone_number: str,
    market: str,
    disposition: str,
    slots: Optional[Dict[str, Any]] = None,
    notes: Optional[str] = None,
) -> str:
    lead_id = f"lead_{uuid.uuid4().hex[:12]}"
    async with acquire() as conn:
        await conn.execute(
            """
            INSERT INTO crm_leads
              (lead_id, session_id, customer_name, phone_number, market,
               disposition, slots, notes, created_at)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
            ON CONFLICT DO NOTHING
            """,
            lead_id, session_id, customer_name, phone_number, market,
            disposition, json.dumps(slots or {}), notes
        )
    return lead_id


async def insert_crm_callback(
    session_id: str,
    customer_name: str,
    phone_number: str,
    preferred_time: Optional[str] = None,
    market: str = "in_en",
) -> str:
    callback_id = f"cb_{uuid.uuid4().hex[:10]}"
    async with acquire() as conn:
        await conn.execute(
            """
            INSERT INTO crm_callbacks
              (callback_id, session_id, customer_name, phone_number, preferred_time, market, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT DO NOTHING
            """,
            callback_id, session_id, customer_name, phone_number, preferred_time or "flexible", market
        )
    return callback_id


async def insert_crm_escalation(
    session_id: str,
    reason: str,
    market: str = "in_en",
    customer_name: Optional[str] = None,
    phone_number: Optional[str] = None,
) -> str:
    escalation_id = f"esc_{uuid.uuid4().hex[:10]}"
    async with acquire() as conn:
        await conn.execute(
            """
            INSERT INTO crm_escalations
              (escalation_id, session_id, reason, market, customer_name, phone_number, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT DO NOTHING
            """,
            escalation_id, session_id, reason, market, customer_name, phone_number
        )
    return escalation_id


async def list_crm_leads_db(limit: int = 50) -> List[Dict[str, Any]]:
    async with acquire() as conn:
        rows = await conn.fetch("SELECT * FROM crm_leads ORDER BY created_at DESC LIMIT $1", limit)
    return [dict(r) for r in rows]


async def list_crm_callbacks_db(limit: int = 50) -> List[Dict[str, Any]]:
    async with acquire() as conn:
        rows = await conn.fetch("SELECT * FROM crm_callbacks ORDER BY created_at DESC LIMIT $1", limit)
    return [dict(r) for r in rows]


async def list_crm_escalations_db(limit: int = 50) -> List[Dict[str, Any]]:
    async with acquire() as conn:
        rows = await conn.fetch("SELECT * FROM crm_escalations ORDER BY created_at DESC LIMIT $1", limit)
    return [dict(r) for r in rows]


# ─────────────────────────────────────────────────────────────────────────────
# KB chunk vector upsert (used by embed pipeline)
# ─────────────────────────────────────────────────────────────────────────────

async def upsert_chunk_embedding(
    chunk_id: str,
    record_id: str,
    kb_version: str,
    chunk_index: int,
    heading_path: str,
    text: str,
    token_count: int,
    embedding: List[float],
    embedding_model: str = "embed-v4.0",
) -> None:
    # Format as PostgreSQL vector literal
    vec_str = "[" + ",".join(str(v) for v in embedding) + "]"
    async with acquire() as conn:
        await conn.execute(
            """
            INSERT INTO kb_chunks
              (chunk_id, record_id, kb_version, chunk_index, heading_path,
               text, token_count, embedding, embedding_model, embedding_version)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8::vector,$9,$10)
            ON CONFLICT (chunk_id) DO UPDATE
              SET embedding = EXCLUDED.embedding,
                  embedding_model = EXCLUDED.embedding_model
            """,
            chunk_id, record_id, kb_version, chunk_index, heading_path,
            text, token_count, vec_str, embedding_model, "1.0"
        )


async def vector_search(
    query_embedding: List[float],
    kb_version: str = "v1.1",
    top_k: int = 5,
    threshold: float = 0.5,
) -> List[Dict[str, Any]]:
    """pgvector cosine similarity search."""
    vec_str = "[" + ",".join(str(v) for v in query_embedding) + "]"
    async with acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT chunk_id, record_id, text, heading_path,
                   1 - (embedding <=> $1::vector) AS similarity
            FROM kb_chunks
            WHERE kb_version = $2
              AND 1 - (embedding <=> $1::vector) >= $3
            ORDER BY similarity DESC
            LIMIT $4
            """,
            vec_str, kb_version, threshold, top_k
        )
    return [dict(r) for r in rows]
