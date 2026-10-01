-- PARLEY System Initial Database Schema
-- Version 1.0 (PostgreSQL 16 + pgvector)

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. KB Versions (Immutable Snapshots)
CREATE TABLE IF NOT EXISTS kb_versions (
    kb_version VARCHAR(32) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    parent_version VARCHAR(32),
    notes TEXT,
    status VARCHAR(16) NOT NULL CHECK (status IN ('draft', 'active', 'archived'))
);

-- 2. KB Sources (Raw Ingest Tracking)
CREATE TABLE IF NOT EXISTS kb_sources (
    source_id VARCHAR(64) PRIMARY KEY,
    type VARCHAR(32) NOT NULL, -- website, pdf, docx, csv, form, playbook
    uri TEXT NOT NULL,
    section TEXT,
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    http_status INTEGER DEFAULT 200,
    content_hash VARCHAR(64) NOT NULL,
    extraction_health REAL DEFAULT 1.0,
    parse_method VARCHAR(32) NOT NULL,
    status VARCHAR(16) NOT NULL CHECK (status IN ('ok', 'quarantined', 'failed')),
    reason_code VARCHAR(64)
);

-- 3. KB Records (Canonical Articles)
CREATE TABLE IF NOT EXISTS kb_records (
    record_id VARCHAR(64) PRIMARY KEY,
    kb_version VARCHAR(32) NOT NULL REFERENCES kb_versions(kb_version) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(64) NOT NULL,
    category_path TEXT NOT NULL,
    market VARCHAR(16) NOT NULL, -- in_en, ph_tl, id_id
    lang VARCHAR(16) NOT NULL,
    audience VARCHAR(32) DEFAULT 'customer',
    source_id VARCHAR(64) REFERENCES kb_sources(source_id) ON DELETE SET NULL,
    version VARCHAR(16) DEFAULT '1.0',
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_to TIMESTAMP WITH TIME ZONE,
    supersedes VARCHAR(64),
    duplicate_of VARCHAR(64),
    pii BOOLEAN DEFAULT FALSE,
    pii_types TEXT[] DEFAULT '{}',
    confidence REAL DEFAULT 1.0,
    content_hash VARCHAR(64) NOT NULL,
    citation_display TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. KB Chunks (Retrieval Atoms)
CREATE TABLE IF NOT EXISTS kb_chunks (
    chunk_id VARCHAR(64) PRIMARY KEY,
    record_id VARCHAR(64) NOT NULL REFERENCES kb_records(record_id) ON DELETE CASCADE,
    kb_version VARCHAR(32) NOT NULL REFERENCES kb_versions(kb_version) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    heading_path TEXT NOT NULL,
    text TEXT NOT NULL,
    token_count INTEGER NOT NULL,
    embedding vector(1024), -- BGE-M3 1024-dim
    tsv tsvector,
    embedding_model VARCHAR(64) DEFAULT 'BAAI/bge-m3',
    embedding_version VARCHAR(16) DEFAULT '1.0'
);

-- Full-text GIN index and HNSW vector index
CREATE INDEX IF NOT EXISTS idx_chunks_tsv ON kb_chunks USING GIN(tsv);
CREATE INDEX IF NOT EXISTS idx_chunks_version_record ON kb_chunks(kb_version, record_id);

-- 5. KB Issues (Conflicts, Typos, Impossible Dates)
CREATE TABLE IF NOT EXISTS kb_issues (
    issue_id VARCHAR(64) PRIMARY KEY,
    severity VARCHAR(16) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    type VARCHAR(32) NOT NULL CHECK (type IN ('conflict', 'typo', 'impossible_date', 'extraction')),
    source_ids TEXT[] DEFAULT '{}',
    resolution_policy TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. PII Vault (Isolated Storage - Role-Level Separation)
CREATE TABLE IF NOT EXISTS pii_vault (
    token VARCHAR(64) PRIMARY KEY, -- e.g. [PHONE_1]
    entity_type VARCHAR(32) NOT NULL,
    ciphertext TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Retrieval Evidence
CREATE TABLE IF NOT EXISTS retrieval_evidence (
    evidence_id VARCHAR(64) PRIMARY KEY,
    query TEXT NOT NULL,
    market VARCHAR(16) NOT NULL,
    retrieved_record_ids TEXT[] DEFAULT '{}',
    source_refs TEXT[] DEFAULT '{}',
    explanation TEXT,
    verdict VARCHAR(32) NOT NULL CHECK (verdict IN ('PASS', 'FAIL', 'PARTIAL')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Calls
CREATE TABLE IF NOT EXISTS calls (
    call_id VARCHAR(64) PRIMARY KEY,
    market VARCHAR(16) NOT NULL,
    scenario VARCHAR(64) NOT NULL,
    language_mix JSONB DEFAULT '{}',
    kb_version VARCHAR(32) REFERENCES kb_versions(kb_version),
    audio_uri TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    outcome JSONB DEFAULT '{}'
);

-- 9. Turns
CREATE TABLE IF NOT EXISTS turns (
    turn_id VARCHAR(64) PRIMARY KEY,
    call_id VARCHAR(64) NOT NULL REFERENCES calls(call_id) ON DELETE CASCADE,
    speaker VARCHAR(16) NOT NULL CHECK (speaker IN ('user', 'bot', 'agent')),
    text TEXT NOT NULL,
    t_start REAL NOT NULL,
    t_end REAL NOT NULL,
    asr_conf REAL DEFAULT 1.0,
    lang_tags TEXT[] DEFAULT '{}',
    trace_id VARCHAR(64) NOT NULL
);

-- 10. Bot Sentences (Sentence Gate Receipts)
CREATE TABLE IF NOT EXISTS bot_sentences (
    sentence_id VARCHAR(64) PRIMARY KEY,
    turn_id VARCHAR(64) NOT NULL REFERENCES turns(turn_id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    status VARCHAR(16) NOT NULL CHECK (status IN ('verified', 'blocked', 'fallback')),
    citations TEXT[] DEFAULT '{}'
);

-- 11. Spans (Black Box Telemetry)
CREATE TABLE IF NOT EXISTS spans (
    span_id VARCHAR(64) PRIMARY KEY,
    trace_id VARCHAR(64) NOT NULL,
    parent_span_id VARCHAR(64),
    stage VARCHAR(32) NOT NULL, -- vad, asr, guardrail, retrieval, llm, sentence_gate, tts
    started_at_ms BIGINT NOT NULL,
    ended_at_ms BIGINT NOT NULL,
    provider VARCHAR(32),
    meta JSONB DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_spans_trace ON spans(trace_id);

-- 12. Signals
CREATE TABLE IF NOT EXISTS signals (
    signal_id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    kind VARCHAR(64) NOT NULL,
    confidence REAL NOT NULL,
    span_text TEXT,
    t REAL NOT NULL,
    tier VARCHAR(16) NOT NULL CHECK (tier IN ('tier1_rules', 'tier2_llm'))
);

-- 13. Nudges (Nudge Court Fired & Suppressed)
CREATE TABLE IF NOT EXISTS nudges (
    nudge_id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    decision VARCHAR(16) NOT NULL CHECK (decision IN ('fired', 'suppressed')),
    reason TEXT,
    priority VARCHAR(8) NOT NULL CHECK (priority IN ('P0', 'P1', 'P2', 'P3')),
    text VARCHAR(256) NOT NULL,
    topic VARCHAR(64) NOT NULL,
    confidence REAL NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    thresholds JSONB DEFAULT '{}',
    signal_ids TEXT[] DEFAULT '{}',
    trace_id VARCHAR(64),
    feedback VARCHAR(16) CHECK (feedback IN ('accepted', 'dismissed', 'ignored'))
);

-- 14. Eval Runs
CREATE TABLE IF NOT EXISTS eval_runs (
    run_id VARCHAR(64) PRIMARY KEY,
    type VARCHAR(32) NOT NULL, -- retrieval, redteam, chaos, drift
    config JSONB DEFAULT '{}',
    metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
