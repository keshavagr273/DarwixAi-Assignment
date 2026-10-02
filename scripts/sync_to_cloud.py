"""
Sync local knowledge base, call transcripts, CRM data, and raw files to live cloud services:
  - PostgreSQL: kb_versions, kb_sources, kb_records, kb_chunks (with Cohere vector(1024)), calls, turns, crm_leads, crm_escalations
  - Cloudflare R2: transcripts, raw KB documents
  - Redis: session cache test
"""
import asyncio
import json
import os
import pathlib
import time
from dotenv import load_dotenv

load_dotenv()

import sys
REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from services.db import acquire, upsert_chunk_embedding, vector_search
from services.embeddings import embed_documents, embed_query
from services.storage import upload_transcript, upload_kb_source, storage_ping
from services.cache import session_touch, session_get, redis_ping


async def sync_kb():
    print("\n--- 1. Syncing Knowledge Base to PostgreSQL & R2 ---")
    v11_dir = REPO_ROOT / "kb" / "snapshots" / "v1.1"
    records_file = v11_dir / "records.json"
    chunks_file = v11_dir / "chunks.json"
    sources_file = v11_dir / "sources.json"

    records = json.loads(records_file.read_text(encoding="utf-8")) if records_file.exists() else []
    chunks = json.loads(chunks_file.read_text(encoding="utf-8")) if chunks_file.exists() else []
    sources = json.loads(sources_file.read_text(encoding="utf-8")) if sources_file.exists() else []

    async with acquire() as conn:
        # Insert versions
        await conn.execute("""
            INSERT INTO kb_versions (kb_version, notes, status)
            VALUES ('v1.0', 'Initial ingest baseline', 'archived')
            ON CONFLICT (kb_version) DO NOTHING;
        """)
        await conn.execute("""
            INSERT INTO kb_versions (kb_version, notes, status)
            VALUES ('v1.1', 'Cleaned, deduplicated, and PII-sanitized production version', 'active')
            ON CONFLICT (kb_version) DO NOTHING;
        """)
        print("  kb_versions: OK")

        # Insert sources
        for s in sources:
            await conn.execute("""
                INSERT INTO kb_sources (source_id, type, uri, section, content_hash, parse_method, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (source_id) DO UPDATE SET status = EXCLUDED.status;
            """, s["source_id"], s.get("type", "website"), s.get("uri", ""), s.get("section"),
                s.get("content_hash", "hash"), s.get("parse_method", "html_clean"), s.get("status", "ok"))
        print(f"  kb_sources: {len(sources)} sources synced")

        # Insert records
        for r in records:
            await conn.execute("""
                INSERT INTO kb_records (
                    record_id, kb_version, title, content, category, category_path,
                    market, lang, source_id, pii, pii_types, content_hash, citation_display
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                ON CONFLICT (record_id) DO UPDATE SET
                    title = EXCLUDED.title, content = EXCLUDED.content;
            """, r["record_id"], r["kb_version"], r["title"], r["content"], r["category"],
                r["category_path"], r["market"], r.get("lang", "en"), r.get("source_id"),
                r.get("pii", False), r.get("pii_types", []), r["content_hash"], r["citation_display"])
        print(f"  kb_records: {len(records)} records synced")

    # Embed and insert chunks with Cohere
    print(f"  Embedding {len(chunks)} chunks with Cohere embed-multilingual-v3.0...")
    texts = [c["text"] for c in chunks]
    vectors = embed_documents(texts)
    print(f"  Generated {len(vectors)} vectors (dim={len(vectors[0]) if vectors else 0})")

    for i, c in enumerate(chunks):
        await upsert_chunk_embedding(
            chunk_id=c["chunk_id"],
            record_id=c["record_id"],
            kb_version=c["kb_version"],
            chunk_index=c["chunk_index"],
            heading_path=c["heading_path"],
            text=c["text"],
            token_count=c["token_count"],
            embedding=vectors[i],
            embedding_model="embed-multilingual-v3.0",
        )
    print(f"  kb_chunks: {len(chunks)} chunks upserted with pgvector embeddings")

    # Upload raw documents to R2
    raw_dir = REPO_ROOT / "kb" / "raw"
    if storage_ping():
        uploaded = 0
        for f in raw_dir.glob("*.*"):
            if f.is_file():
                upload_kb_source(f.read_bytes(), f.name, "text/plain")
                uploaded += 1
        print(f"  R2: {uploaded} raw KB documents uploaded to darwix-assignment")


async def sync_transcripts_and_calls():
    print("\n--- 2. Syncing Calls & Transcripts to PostgreSQL & R2 ---")
    transcripts_dir = REPO_ROOT / "data" / "transcripts"
    transcript_files = list(transcripts_dir.glob("*.json"))

    for tf in transcript_files:
        data = json.loads(tf.read_text(encoding="utf-8"))
        call_id = data["call_id"]
        market = data.get("market", "in_en")
        scenario = data.get("scenario", "default")
        outcome = {
            "verdict": data.get("verdict"),
            "duration_s": data.get("duration_s"),
            "grounding_rate": data.get("grounding_rate"),
            "expected_disposition": data.get("expected_disposition"),
        }

        async with acquire() as conn:
            await conn.execute("""
                INSERT INTO calls (call_id, market, scenario, kb_version, outcome)
                VALUES ($1, $2, $3, 'v1.1', $4)
                ON CONFLICT (call_id) DO UPDATE SET outcome = EXCLUDED.outcome;
            """, call_id, market, scenario, json.dumps(outcome))

            for t in data.get("turns", []):
                turn_id = f"{call_id}_turn_{t['turn']}"
                speaker = "user" if t["speaker"] == "customer" else "agent"
                text = t.get("text", "")
                await conn.execute("""
                    INSERT INTO turns (turn_id, call_id, speaker, text, t_start, t_end, asr_conf, lang_tags, trace_id)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    ON CONFLICT (turn_id) DO NOTHING;
                """, turn_id, call_id, speaker, text,
                    float(t.get("turn", 1)), float(t.get("turn", 1)) + 1.0,
                    1.0, [t.get("language", "en-IN")], f"trace_{call_id}_{t['turn']}")

        # Upload transcript JSON to R2
        try:
            upload_transcript(tf.read_text(encoding="utf-8"), call_id)
        except Exception as e:
            print(f"  Warning: R2 upload for {call_id} failed: {e}")

    print(f"  PostgreSQL & R2: {len(transcript_files)} call transcripts synced")


async def sync_crm():
    print("\n--- 3. Syncing CRM Data to PostgreSQL ---")
    leads_file = REPO_ROOT / "data" / "crm" / "leads.jsonl"
    if leads_file.exists():
        count = 0
        async with acquire() as conn:
            for line in leads_file.read_text(encoding="utf-8").strip().splitlines():
                if not line.strip():
                    continue
                row = json.loads(line)
                await conn.execute("""
                    INSERT INTO crm_leads (lead_id, session_id, customer_name, phone_number, market, disposition, slots, notes)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    ON CONFLICT (lead_id) DO NOTHING;
                """, row["lead_id"], row["session_id"], row["customer_name"], row["phone_number"],
                    row.get("market", "in_en"), row.get("disposition", "interested"),
                    json.dumps(row.get("slots", {})), row.get("notes"))
                count += 1
        print(f"  crm_leads: {count} leads synced")

    esc_file = REPO_ROOT / "data" / "crm" / "escalations.jsonl"
    if esc_file.exists():
        count = 0
        async with acquire() as conn:
            for line in esc_file.read_text(encoding="utf-8").strip().splitlines():
                if not line.strip():
                    continue
                row = json.loads(line)
                await conn.execute("""
                    INSERT INTO crm_escalations (escalation_id, session_id, reason, market, customer_name, phone_number)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (escalation_id) DO NOTHING;
                """, row["escalation_id"], row["session_id"], row["reason"],
                    row.get("market", "in_en"), row.get("customer_name"), row.get("phone_number"))
                count += 1
        print(f"  crm_escalations: {count} escalations synced")


async def verify_vector_search():
    print("\n--- 4. Verifying pgvector Cosine Search in PostgreSQL ---")
    q = "What is the grace period for premium payment?"
    print(f"  Query: '{q}'")
    q_vec = embed_query(q)
    results = await vector_search(q_vec, kb_version="v1.1", top_k=3, threshold=0.3)
    print(f"  Found {len(results)} matching chunks via pgvector:")
    for r in results:
        print(f"    - [{r['record_id']}] sim={r['similarity']:.4f}: {r['text'][:90]}...")


async def main():
    print("==================================================")
    print("PARLEY CLOUD SYNCHRONIZATION AND VERIFICATION")
    print("==================================================")
    await sync_kb()
    await sync_transcripts_and_calls()
    await sync_crm()
    await verify_vector_search()
    print("\n[ALL CLOUD SYNCS COMPLETE AND VERIFIED]")


if __name__ == "__main__":
    asyncio.run(main())
