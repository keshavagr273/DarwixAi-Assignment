<p align="center">
  <img src="docs/assets/logo.png" alt="PARLEY Logo" width="130" style="border-radius: 28px; box-shadow: 0 16px 36px rgba(0,0,0,0.5);" />
  <h1 align="center">PARLEY</h1>
  <p align="center">
    <strong>Enterprise-Grade Grounded Voice Operations Platform & Real-Time Agent Guidance Cockpit</strong><br/>
    <em>Deterministic Dialogue FSM, Fail-Closed Pre-TTS Sentence Gate, 9-Stage KB Ingestion Pipeline, Native Taglish & Bahasa Voice Bots, and Real-Time Live Nudges.</em>
  </p>
  <p align="center">
    <a href="#-quick-start"><img src="https://img.shields.io/badge/Python-3.11%2B-3776AB?logo=python&logoColor=white" alt="Python"></a>
    <a href="#-quick-start"><img src="https://img.shields.io/badge/FastAPI-2.0.0-009688?logo=fastapi&logoColor=white" alt="FastAPI"></a>
    <a href="#-cloud-infrastructure"><img src="https://img.shields.io/badge/PostgreSQL-16_%2B_pgvector-336791?logo=postgresql&logoColor=white" alt="PostgreSQL 16 + pgvector"></a>
    <a href="#-cloud-infrastructure"><img src="https://img.shields.io/badge/Redis-Upstash_TLS-D82C20?logo=redis&logoColor=white" alt="Upstash Redis TLS"></a>
    <a href="#-cloud-infrastructure"><img src="https://img.shields.io/badge/Storage-Cloudflare_R2-F38020?logo=cloudflare&logoColor=white" alt="Cloudflare R2"></a>
    <a href="#-cloud-infrastructure"><img src="https://img.shields.io/badge/LLM-Groq_GPT--OSS--120B-F05A28" alt="Groq LLM"></a>
    <a href="#-cloud-infrastructure"><img src="https://img.shields.io/badge/ASR-Deepgram_Nova--2-13EF93?logo=deepgram&logoColor=black" alt="Deepgram Nova-2"></a>
    <a href="#-cloud-infrastructure"><img src="https://img.shields.io/badge/TTS-ElevenLabs_Multilingual_v2-black?logo=elevenlabs&logoColor=white" alt="ElevenLabs TTS"></a>
    <a href="#-quick-start"><img src="https://img.shields.io/badge/Tests-287%20Passed%20(100%25)-22c55e" alt="Tests Passed"></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-22c55e.svg" alt="MIT License"></a>
  </p>
  <p align="center">
    <a href="#-what-is-parley">About</a> · 
    <a href="#-the-problem">The Problem</a> · 
    <a href="#-features">Features</a> · 
    <a href="#-architecture">Architecture</a> · 
    <a href="#-pipeline-workflow">Pipeline</a> · 
    <a href="#-feature-comparison--assessment-deliverables">Deliverables & Comparison</a> · 
    <a href="#-quick-start">Quick Start</a> · 
    <a href="#-configuration-reference">Configuration</a> · 
    <a href="#-api-documentation">API Docs</a> · 
    <a href="#-repository-structure">Repository Structure</a> · 
    <a href="#-documentation-index">Documentation Index</a>
  </p>
</p>

---

## 📖 What is PARLEY?

**PARLEY** is an enterprise-grade, interactive conversational AI and operational command platform built specifically for high-stakes financial services (insurance renewal, policy servicing, and lending payment reminders). It bridges messy, contradictory business documents with conversational voice agents that **never invent facts or numbers**, while providing real-time supervisor co-piloting via streaming nudges.

In banking and insurance contact centers, hallucinations and ungrounded statements are regulatory violations. A customer given the wrong grace period, an incorrect premium rate, or an unverified policy waiver can trigger statutory penalties, loss of license, and customer churn.

PARLEY solves this with a strict **Evidence Over Inference** architecture:

- **Fail-Closed Sentence Gate** — Before any synthesized audio reaches the customer, every factual sentence must pass strict numerical, date, and entailment checks against retrieved knowledge chunks. If evidence is lacking, the statement is physically blocked and replaced with a deterministic fallback.
- **Every Spoken Claim Has A Receipt** — Spoken statements carry transparent citation receipts (`[record_id@version · source]`) linking directly back to canonical records in PostgreSQL and Cloudflare R2.
- **9-Stage Automated Knowledge Base Pipeline** — Transforms heterogeneous, contradictory documents (HTML, Markdown, CSV, OCR text) into immutable, versioned, PII-safe vector records.
- **Authentic Multi-Market Localization** — True cultural adaptation for India (`in_en`), Philippines (`ph_tl`), and Indonesia (`id_id`), featuring code-switching (Taglish), native financial vocabulary, honorifics (`po`/`opo`, `Bapak`/`Ibu`), and drift detection.
- **Real-Time Live Nudge Cockpit & Nudge Court** — Dual-tier streaming signal extractor (Tier-1 rules <30ms, Tier-2 Groq LLM <300ms) with Upstash Redis-backed cooldowns, rate limits, and deduplication to suppress low-value alert noise.
- **Production Cloud Infrastructure** — Fully integrated with live cloud services: Aiven PostgreSQL 16 with pgvector (source of truth), Upstash Redis (real-time cache), Cloudflare R2 (audio & transcript archival), Groq Cloud LLM, Cohere Multilingual Embeddings, Deepgram Nova-2 ASR, and ElevenLabs TTS.

---

## ⚠️ The Problem

Navigating financial customer interactions with traditional IVR trees or naive generic LLM wrappers leads to dangerous compliance violations and operator fatigue:

| Operational Challenge | Traditional IVRs / Generic LLM Wrappers | With PARLEY |
|---|---|---|
| **Conflicting & Dirty Business Knowledge** | Naive RAG ingests outdated FAQs and duplicates, leading to contradictory bot statements | **9-Stage Pipeline** resolving statutory policy conflicts (30-day grace period > 15-day FAQ), rate typos, and quarantine OCR scans |
| **Hallucinated Rates & Grace Periods** | LLM invents plausible numbers or accepts out-of-scope requests (e.g. crypto, pet cover) | **Fail-Closed Sentence Gate** blocking unverified claims and enforcing **100% Refusal Precision** |
| **Literal Translation Failure** | Robotic translation ("Paano ko ikaw matutulungan?") alienates customers and damages brand trust | **Market Packs** with authentic honorifics, natural code-mixing (Taglish), and collections conduct guardrails |
| **Supervisor Alert Fatigue** | Real-time dashboards fire hundreds of redundant alerts on noise and minor pauses | **Nudge Court** enforcing 20s topic cooldowns, sliding-window rate limits, and Noisy-Audio corroboration via Upstash Redis |
| **Auditing & Regulatory Verification** | Black-box LLM generations cannot be traced back to original legal policy sections | **Interactive Receipt Drawer** displaying complete provenance DAG from source URL to spoken sentence |
| **Voice Turn Latency** | Conversational lags > 3.0s cause caller drop-off and awkward conversation overlaps | **Median 1,176ms User-to-Bot Latency** with pipelined sentence gates and streaming speech models |

---

## ⚡ Features

### 1. Deterministic Dialogue FSM & Fail-Closed Sentence Gate
- **12-State Regulated Conversation Engine**: Enforces mandatory greeting, consent disclosure, eligibility qualification, and compliant closing without drifting.
- **Pre-TTS Sentence Gate**: Parses LLM drafts into discrete assertions; runs regex entity checks, date matchers, and token entailment.
- **Claim Receipts**: Every verified sentence receives a cryptographic trace ID and citation chip (`[kb_policy_014 · v1.1 · 0.98]`).
- **Interactive Strikethrough Visualizer**: UI reveals intercepted drafts, showing exactly what was blocked and why a safe fallback was spoken.

### 2. 9-Stage Automated Knowledge Base Pipeline
- **Extraction Health & Quarantine**: Computes character entropy and garble ratios; isolates poor OCR scans (`extraction_health < 0.60`) to `kb/quarantine/`.
- **Boilerplate Stripper**: Eliminates cookie notices, navigation menus, and collapses repeated statutory notices.
- **Conflict Resolution Engine**: Enforces strict policy precedence: Statutory Policy Wording overrides website FAQs (corrects grace period from 15 to 30 days).
- **Outlier Defect Detection**: Flags non-monotonic rate schedule typos (corrects ₹120,000 outlier back to ₹10,800).
- **Layered PII Shield & Vault**: Replaces phone numbers, emails, PAN, and NIK with typed tokens; stores raw values in an isolated vault table unreachable by the retriever.

### 3. Hybrid Semantic & Lexical Retrieval (pgvector + Cohere)
- **1024-Dimension Dense Embeddings**: Cohere `embed-multilingual-v3.0` vectors stored natively in Aiven PostgreSQL `vector(1024)`.
- **Sparse BM25 Keyword Search**: Exact match for policy numbers, statutory terms, and fee tables.
- **Reciprocal Rank Fusion (RRF)**: Merges dense vector and sparse lexical rankings.
- **Strict Threshold Gating**: Refuses out-of-scope or adversarial queries (e.g. crypto, pet surgery, gold bullion) with **100% Refusal Precision**.

### 4. Authentic Native Voice Bots (Philippines & Indonesia)
- **Market Packs**: Modular configuration (`in_en.yaml`, `ph_tl.yaml`, `id_id.yaml`) isolating personas, register rules, honorifics, and local finance glossaries.
- **Language Router & Register Controller**: Dynamically detects code-switching ratio (`lang_mix`) and formality level.
- **Language Lock & Drift Detector**: Continuously audits turns to ensure the bot never inadvertently drops into pure English.
- **Speech Adapters**: Deepgram Nova-2 ASR with domain keyphrase boosting and ElevenLabs Multilingual v2 with premade voices (Sarah, Bella, Adam).

### 5. Real-Time Streaming Nudge Cockpit & Nudge Court
- **Dual-Tier Signal Extractor**: Tier-1 deterministic regex/lexicon triggers (<30ms) paired with Tier-2 Groq LLM structured JSON reasoning (<300ms).
- **6 Signal Families**: Missing compliance disclosures, rising customer frustration, missed cross-sell opportunities, payment difficulty, callback requests, and topic shifts.
- **Nudge Court Suppression**: Powered by Upstash Redis: 20s topic cooldown, 60s sliding rate-limit (max 6 nudges/min), and Noisy-Audio Guard (requires 2 consecutive signals when ASR confidence < 0.70).
- **WebSocket Streaming**: Bidirectional streaming on `/ws/live/{session_id}` emitting transcripts, signals, fired nudges, and suppression reasons.

### 6. Live Cloud Telemetry & Observability
- **Black Box Flight Recorder**: Captures millisecond start/end timestamps across VAD, ASR, Retrieval, Gate, LLM, and TTS.
- **CRM Integration**: Automatic lead capture (`crm_leads`), callback scheduling (`crm_callbacks`), and human escalation dispatch (`crm_escalations`) committed to PostgreSQL.
- **Cloud Object Storage**: Full call transcripts, audio segments, and raw documents archived to Cloudflare R2 bucket `darwix-assignment`.

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PARLEY Control Room (React / Vite)                 │
│   Mission Control · Live Cockpit · KB Studio · Retrieval Lab · Voice Studio │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / REST / WebSocket
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                          PARLEY API Gateway (FastAPI :8000)                 │
│   FSM Engine · Sentence Gate · Hybrid Retriever · Nudge Court · Telemetry   │
└──────────────┬───────────────────────┬───────────────────────┬──────────────┘
               │                       │                       │
      Upstash  │             PostgreSQL│ + pgvector            │ Cloudflare R2
        Redis  │             (Aiven)   │                       │ (S3 API)
┌──────────────▼─────────────┐ ┌───────▼────────────────┐ ┌────▼──────────────┐
│  Upstash Redis Cache (TLS) │ │  Aiven PostgreSQL 16   │ │  Cloudflare R2    │
│  - 20s Nudge Cooldowns     │ │  - 17 Relational Tables│ │  - Audio Chunks   │
│  - 60s Rate Limiter Window │ │  - pgvector(1024) Chunks││  - Full Recordings │
│  - Session Heartbeat Keys  │ │  - Calls, Turns, Traces│ │  - Transcripts    │
│  - KB Query Vector Cache   │ │  - CRM Leads & Records │ │  - Raw KB Archives│
└────────────────────────────┘ └────────────────────────┘ └───────────────────┘
               │                       │                       │
       Groq    │                Cohere │ API          Deepgram │ + ElevenLabs
┌──────────────▼─────────────┐ ┌───────▼────────────────┐ ┌────▼──────────────┐
│  Groq Cloud LLM            │ │  Cohere Embeddings API │ │  Speech Services  │
│  - openai/gpt-oss-120b     │ │  - embed-multilingual- │ │  - Deepgram Nova-2│
│  - Fast JSON Reasoning     │ │    v3.0 (1024 dims)    │ │  - ElevenLabs v2  │
│  - Grounded Conversational │ │  - Cosine Search &     │ │    (Sarah, Bella, │
│    Voice Generations       │ │    Rerank Scoring      │ │     Adam voices)  │
└────────────────────────────┘ └────────────────────────┘ └───────────────────┘
```

---

## 🔄 Pipeline Workflow

```
┌──────────┐    ┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌─────────────┐
│ Raw KB   │    │ Extract &   │    │ Boilerplate  │    │ Terminology │    │ Defect &    │
│ Ingest   ├───►│ Quarantine  ├───►│ Strip        ├───►│ & Dates     ├───►│ Conflict    │
│ (HTML/CS)│    │ (Entropy)   │    │ (Cleaner)    │    │ Normalizer  │    │ Detector    │
└──────────┘    └─────────────┘    └──────────────┘    └─────────────┘    └──────┬──────┘
                                                                                 │
┌──────────┐    ┌─────────────┐    ┌──────────────┐    ┌─────────────┐           │
│ Live RAG │    │  PostgreSQL │    │ Structure    │    │ Layered PII │           │
│ & Voice  │◄───┤  pgvector   │◄───┤ Chunking     │◄───┤ Shield &    │◄──────────┘
│ Pipeline │    │  Indexation │    │ (150-350 tok)│    │ Vault Mask  │
└──────────┘    └─────────────┘    └──────────────┘    └─────────────┘
```

---

## 📊 Feature Comparison & Assessment Deliverables

| Assessment Question | Deliverable | PARLEY Production Implementation | Verification & Evidence |
|---|---|---|---|
| **Q1: Grounded Voice Agent** | Inbound/Outbound renewal & service voice agent with factual grounding. | Dialogue FSM + Pre-TTS Sentence Gate (`Draft → Verified → Spoken` or `Blocked → Fallback`). Fallbacks for out-of-scope, price objection, and human escalation. | [`tests/test_sentence_gate.py`](file:///d:/Projects/DarwixAI-Assignment/tests/test_sentence_gate.py)<br>[`tests/test_dialogue_fsm.py`](file:///d:/Projects/DarwixAI-Assignment/tests/test_dialogue_fsm.py) |
| **Q2: Knowledge Base** | Production-ready KB pipeline from messy, conflicting raw documents. | 9-stage pipeline: extraction, defect detector (resolves 15d vs 30d statutory conflict, rate table typos), deduplication, layered PII masking vault, and Cohere `vector(1024)` indexing. | [`kb/tests/eval_retrieval.py`](file:///d:/Projects/DarwixAI-Assignment/kb/tests/eval_retrieval.py)<br>100% accuracy, 100% refusal, MRR 0.868 |
| **Q3: Native Voice Bots** | Authentic native voice bots for Philippines (`ph_tl`) and Indonesia (`id_id`). | Language Router with code-switch drift detector, localized market packs (`market_packs/`), Deepgram Nova-2 ASR boosting, and ElevenLabs multilingual premade voices. | [`scripts/record_native_calls.py`](file:///d:/Projects/DarwixAI-Assignment/scripts/record_native_calls.py)<br>[`docs/LOCALIZATION.md`](file:///d:/Projects/DarwixAI-Assignment/docs/LOCALIZATION.md) |
| **Q4: Real-time Live Nudges** | Real-time supervisor and copilot nudge cockpit. | Two-tier signal detector (Tier 1 regex rules <2ms, Tier 2 Groq LLM), Nudge Court with cooldowns, rate limits, and dedup suppression sets in Upstash Redis. | [`services/insights/engine.py`](file:///d:/Projects/DarwixAI-Assignment/services/insights/engine.py)<br>[`docs/REALTIME_NUDGES.md`](file:///d:/Projects/DarwixAI-Assignment/docs/REALTIME_NUDGES.md) |

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.11+** installed
- **Node.js 20+** & `npm`
- **Git**

---

### Step 1: Clone and Configure

```bash
git clone https://github.com/keshavagr273/DarwixAi-Assignment.git
cd DarwixAi-Assignment
cp .env.example .env
```

Edit `.env` with your cloud credentials (or use pre-configured environment):

```env
PORT=8000
HOST=127.0.0.1
DATABASE_URL="postgresql://user:pass@host:port/dbname?sslmode=require"
REDIS_URL="rediss://default:token@host.upstash.io:6379"
MINIO_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
MINIO_ACCESS_KEY="your_r2_access_key"
MINIO_SECRET_KEY="your_r2_secret_key"
MINIO_BUCKET="darwix-assignment"
GROQ_API_KEY="gsk_your_groq_api_key"
GROQ_MODEL="openai/gpt-oss-120b"
DEEPGRAM_API_KEY="your_deepgram_key"
ELEVENLABS_API_KEY="your_elevenlabs_key"
EMBEDDING_API_KEY="your_cohere_key"
EMBEDDING_MODEL="embed-multilingual-v3.0"
```

---

### Step 2: Validate Live Cloud Services

Run the automated service verification script to confirm all 7 external providers are operational:

```bash
python scripts/test_services.py
```

*Expected output: `7/7 [PASS] (postgres, redis, cohere, groq, deepgram, elevenlabs, r2)`*

---

### Step 3: Run Database Migrations & Cloud Sync

```bash
# 1. Run PostgreSQL schema migrations (creates all 17 tables)
python scripts/run_migrations.py

# 2. Sync KB records, Cohere vector(1024) embeddings, call transcripts, and CRM data to PostgreSQL & R2
python scripts/sync_to_cloud.py
```

---

### Step 4: Run Knowledge Base Pipeline & Automated Tests

```bash
# 1. Ingest messy corpus, resolve planted defects, sanitize PII, generate v1.0 and v1.1 snapshots
python -m kb.pipeline.run_pipeline

# 2. Run PII scanner (asserts zero unmasked PII leaks in published chunks)
python scripts/pii_scan.py

# 3. Run Gate 1 retrieval evaluation across 19 test queries
python -m kb.tests.eval_retrieval

# 4. Run full pytest test suite (287 tests, 100% green)
pytest
```

---

### Step 5: Start Backend and Frontend Development Servers

```bash
# Terminal 1: FastAPI Backend (Port 8000)
python services/api/main.py

# Terminal 2: React Control Room Frontend (Port 5173)
cd frontend
npm install
npm run dev
```

### Access Your Applications:
- 🌐 **Frontend Control Room**: [http://127.0.0.1:5173](http://127.0.0.1:5173)
- ⚙️ **Backend REST API**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- 🩺 **Deep Health Check**: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)
- 📊 **PostgreSQL Source of Truth Stats**: [http://127.0.0.1:8000/api/v1/db/stats](http://127.0.0.1:8000/api/v1/db/stats)

---

## ⚙️ Configuration Reference

All application parameters are driven by environment variables:

| Variable | Default / Example | Purpose |
|---|---|---|
| `PORT` | `8000` | FastAPI server port |
| `HOST` | `127.0.0.1` | Host interface binding |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Allowed CORS origins |
| `DATABASE_URL` | `postgresql://...` | Aiven PostgreSQL connection URL with `sslmode=require` |
| `REDIS_URL` | `rediss://...` | Upstash Redis connection URL over TLS |
| `MINIO_ENDPOINT`| `https://<id>.r2.cloudflarestorage.com` | Cloudflare R2 S3-compatible API endpoint |
| `MINIO_ACCESS_KEY` | *(required)* | Cloudflare R2 S3 client access key |
| `MINIO_SECRET_KEY` | *(required)* | Cloudflare R2 S3 client secret key |
| `MINIO_BUCKET` | `darwix-assignment` | Cloudflare R2 target bucket |
| `GROQ_API_KEY` | *(required)* | Groq Cloud API key for ultra-fast reasoning |
| `GROQ_MODEL` | `openai/gpt-oss-120b` | Groq LLM model identifier |
| `DEEPGRAM_API_KEY` | *(required)* | Deepgram API key for Nova-2 streaming STT |
| `ELEVENLABS_API_KEY`| *(required)* | ElevenLabs API key for multilingual v2 voice synthesis |
| `EMBEDDING_BASE_URL`| `https://api.cohere.com/v1` | Cohere native `/embed` endpoint |
| `EMBEDDING_API_KEY` | *(required)* | Cohere API key for 1024-dim multilingual embeddings |
| `EMBEDDING_MODEL` | `embed-multilingual-v3.0` | Cohere multilingual embedding model |

---

## 📡 API Documentation

PARLEY exposes a comprehensive REST and WebSocket API:

### System & Health Endpoints:
- `GET /api/v1/health` — Deep health check across all 7 external cloud services
- `GET /api/v1/db/stats` — Live row counts across all 17 PostgreSQL source-of-truth tables

### Retrieval & Knowledge Base Endpoints:
- `POST /api/v1/retrieval/search` — Hybrid vector + BM25 search with threshold refusal gating
- `GET  /api/v1/retrieval/evidence` — Gate 1 retrieval evaluation report and MRR metrics
- `GET  /api/v1/kb/records` — List canonical KB records from the published snapshot
- `GET  /api/v1/kb/records/:id` — Inspect a single versioned KB record
- `GET  /api/v1/kb/versions` — List immutable KB versions (`v1.0`, `v1.1`)
- `GET  /api/v1/kb/diff` — Inspect the snapshot diff report between v1.0 and v1.1
- `GET  /api/v1/kb/issues` — List detected data defects, rate outliers, and statutory conflicts

### Voice & Agent Session Endpoints:
- `POST /api/v1/agent/sessions` — Initialize a new dialogue FSM session for a target market
- `POST /api/v1/agent/sessions/:id/turn` — Execute a conversational turn with Sentence Gate verification
- `POST /api/v1/voice/calls` — Create a tracked voice call session
- `POST /api/v1/voice/calls/:id/turn` — Process an incoming audio/transcript turn
- `GET  /api/v1/voice/calls` — Query all persisted calls in PostgreSQL
- `GET  /api/v1/voice/transcripts/:id` — Retrieve full speaker-labeled transcript with citations
- `GET  /api/v1/markets/:market` — Retrieve market pack configuration, honorifics, and fallbacks

### Object Storage & CRM Endpoints:
- `POST /api/v1/storage/upload-audio` — Upload audio chunks to Cloudflare R2 with presigned URL
- `POST /api/v1/storage/upload-transcript` — Upload finalized transcript JSON to Cloudflare R2
- `GET  /api/v1/storage/recordings/:session_id` — List all stored audio recordings for a session
- `POST /api/v1/crm/leads` — Create or update a qualified CRM lead in PostgreSQL
- `POST /api/v1/crm/callbacks` — Schedule a customer callback in PostgreSQL
- `POST /api/v1/crm/escalations` — Dispatch a supervisor escalation in PostgreSQL

### Streaming WebSocket Endpoints:
- `WS /ws/nudges` — Streaming real-time supervisor nudges
- `WS /ws/live/:session_id` — Full live call streaming endpoint (transcripts, signals, nudges, gates)

---

## 📁 Repository Structure

```text
DarwixAi-Assignment/
├── docs/                                # Technical Architecture & Gated Deliverables
│   ├── assets/                          # Application Logo & UI Media Assets
│   ├── ARCHITECTURE.md                  # Comprehensive System Architecture & Schemas
│   ├── PRD.md                           # Master Product Requirements Document
│   ├── CHECKPOINTS.md                   # Gated Phase Plan & Verification Sign-Off
│   ├── DECISIONS.md                     # Architectural Decision Records (ADRs 001–005)
│   ├── KB_DESIGN.md                     # Knowledge Base & Planted Defect Resolution Report
│   ├── ASR_TTS_REPORT.md                # Multilingual Speech Evaluation & Provider Matrix
│   ├── LIMITATIONS_AND_PRODUCTION_PLAN.md # Enterprise Scaling Plan & Boundary Limitations
│   ├── LOCALIZATION.md                  # Cultural Adaptation & Terminology Workbench
│   ├── REALTIME_NUDGES.md               # Nudge Court Policies & Chaos Harness Report
│   ├── LATENCY_REPORT.md                # Monotonic P50/P95 Latency Breakdown
│   ├── EVAL_REPORT.md                   # Automated Evaluation Results & Grounding Metrics
│   ├── EXPLAIN_IT.md                    # 30 Critical Reviewer Questions & Technical Answers
│   ├── FRONTEND_DECISIONS.md            # Control Room Design Principles & Zero-Gradient Tokens
│   └── VIDEO_SCRIPT.md                  # Rehearsed Presenter Walkthrough Cue Cards
├── services/                            # Backend Platform Core
│   ├── agent/                           # Dialogue FSM, Market Packs, Sentence Gate, Tools
│   ├── api/                             # FastAPI Gateway, Endpoints, Migrations
│   │   └── migrations/                  # PostgreSQL 16 + pgvector Schema DDL
│   ├── insights/                        # Streaming Insights Engine, Tier-1/Tier-2 Detectors
│   ├── retrieval/                       # Hybrid Retriever, RRF, Cross-Encoder Reranker
│   ├── voice/                           # ASR / TTS Adapters (Deepgram, ElevenLabs, Mock)
│   ├── cache.py                         # Upstash Redis Real-Time Cooldown & Rate-Limit Cache
│   ├── db.py                            # Aiven PostgreSQL Single Source of Truth Layer
│   ├── embeddings.py                    # Cohere Multilingual 1024-dim Vector Service
│   ├── llm.py                           # Groq Fast Structured JSON Inference Service
│   └── storage.py                       # Cloudflare R2 S3-Compatible Object Store Service
├── kb/                                  # Knowledge Base Engineering Pipeline
│   ├── pipeline/                        # Cleaner, Defect Detector, Dedupe, PII Shield, Chunker
│   ├── raw/                             # Heterogeneous Business Corpus with Planted Defects
│   ├── quarantine/                      # Quarantined Garbled OCR Scans
│   ├── schema/                          # Pydantic Schemas, Taxonomy, Glossary
│   └── snapshots/                       # Immutable Snapshots (v1.0 Baseline, v1.1 Golden)
├── frontend/                            # React Control Room Shell
│   ├── src/                             # Pages, Components, Hooks, State Stores
│   ├── public/                          # Static Favicon and Application Assets
│   └── README.md                        # Frontend Setup & Route Map
├── scripts/                             # Verification & Ingestion Utility Scripts
│   ├── test_services.py                 # Automated 7-Service Cloud Verification
│   ├── run_migrations.py                # PostgreSQL Schema Migration Runner
│   ├── sync_to_cloud.py                 # Knowledge & Call Data Cloud Sync Runner
│   ├── pii_scan.py                      # Automated PII Leakage Scanner
│   ├── scan_secrets.py                  # Pre-Commit Secret Scanner
│   └── record_calls.py                  # Multi-Market Call Scenario Recorder
├── data/                                # Checked-In Evaluation Evidence & Transcripts
│   ├── calls/                           # Call Results Table & Benchmark Data
│   ├── crm/                             # CRM Leads & Escalation Records
│   ├── evaluation/                      # Retrieval Evidence Table & Gate Logs
│   └── transcripts/                     # Speaker-Labeled Call Transcripts with Citations
├── tests/                               # Comprehensive Automated Test Suite (287 Tests)
├── .env.example                         # Environment Variables Template
├── logo.png                             # Application Master Logo Asset
└── README.md                            # Project Overview & Quick Start Documentation
```

---

## 📚 Documentation Index

All in-depth technical reports, architectural designs, and verification ledgers are maintained in the [`docs/`](file:///d:/Projects/DarwixAI-Assignment/docs/) directory:

- [`docs/ARCHITECTURE.md`](file:///d:/Projects/DarwixAI-Assignment/docs/ARCHITECTURE.md): Complete system architecture, live cloud stack topology, and telemetry schemas.
- [`docs/PRD.md`](file:///d:/Projects/DarwixAI-Assignment/docs/PRD.md): Product Requirements Document and functional specifications.
- [`docs/CHECKPOINTS.md`](file:///d:/Projects/DarwixAI-Assignment/docs/CHECKPOINTS.md): Phase-by-phase completion evidence and gate sign-offs.
- [`docs/DECISIONS.md`](file:///d:/Projects/DarwixAI-Assignment/docs/DECISIONS.md): Architectural Decision Records (ADRs 001–005) including Live Cloud Infrastructure.
- [`docs/KB_DESIGN.md`](file:///d:/Projects/DarwixAI-Assignment/docs/KB_DESIGN.md): Knowledge base architecture and planted defect resolution report.
- [`docs/LIMITATIONS_AND_PRODUCTION_PLAN.md`](file:///d:/Projects/DarwixAI-Assignment/docs/LIMITATIONS_AND_PRODUCTION_PLAN.md): Enterprise production scale plan, SLA targets, and boundary limitations.
- [`docs/ASR_TTS_REPORT.md`](file:///d:/Projects/DarwixAI-Assignment/docs/ASR_TTS_REPORT.md): Deepgram, ElevenLabs, and Google STT/TTS multilingual evaluation.
- [`docs/LOCALIZATION.md`](file:///d:/Projects/DarwixAI-Assignment/docs/LOCALIZATION.md): Southeast Asian cultural adaptation and terminology glossary.
- [`docs/REALTIME_NUDGES.md`](file:///d:/Projects/DarwixAI-Assignment/docs/REALTIME_NUDGES.md): Nudge Court policies, suppression metrics, and chaos harness report.
- [`docs/LATENCY_REPORT.md`](file:///d:/Projects/DarwixAI-Assignment/docs/LATENCY_REPORT.md): Monotonic latency breakdown for voice turns and real-time nudges.
- [`docs/EVAL_REPORT.md`](file:///d:/Projects/DarwixAI-Assignment/docs/EVAL_REPORT.md): Final evaluation report across all checkpoints.
- [`docs/EXPLAIN_IT.md`](file:///d:/Projects/DarwixAI-Assignment/docs/EXPLAIN_IT.md): 30 technical interview defense questions with answers.
- [`docs/FRONTEND_DECISIONS.md`](file:///d:/Projects/DarwixAI-Assignment/docs/FRONTEND_DECISIONS.md): Control room design philosophy and flat UI token specification.
- [`docs/VIDEO_SCRIPT.md`](file:///d:/Projects/DarwixAI-Assignment/docs/VIDEO_SCRIPT.md): Rehearsed presenter video walkthrough script.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>PARLEY Voice Operations Platform</strong><br/>
  <em>Every Spoken Claim Has A Receipt · Every Low-Value Alert Is Suppressed With A Reason.</em>
</p>
