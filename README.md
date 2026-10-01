# PARLEY — Grounded Multilingual Voice Operations Platform

PARLEY is a production-grade platform for grounded, multilingual financial voice operations with real-time live nudges, fail-closed sentence gates, and traceable knowledge base pipelines.

Built in accordance with `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/CHECKPOINTS.md`, and `docs/PROMPT_1_FRONTEND.md`.

---

## 🚀 Quick Start

### 1. Backend & Knowledge Base (Phase 0 & Phase 1)
```bash
# 1. Install dependencies
pip install -e .

# 2. Run secret scan (asserts 0 secrets committed)
python scripts/scan_secrets.py

# 3. Run Knowledge Base Ingestion Pipeline (builds v1.0 & v1.1 snapshots)
python -m kb.pipeline.run_pipeline

# 4. Run PII Leak Scan (asserts 0 raw PII in indexed chunks)
python scripts/pii_scan.py

# 5. Run Gate 1 Retrieval Evaluation (runs 19 queries, checks refusals & MRR)
python -m kb.tests.eval_retrieval

# 6. Run full unit and integration test suite
pytest tests/ -v

# 7. Start FastAPI Server
uvicorn services.api.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend Control Room
```bash
cd frontend
npm install
npm run dev
```

Visit **[http://127.0.0.1:5173/](http://127.0.0.1:5173/)** to launch the interactive control room.

- **Mock Mode (Default):** Runs 100% self-contained against local fixtures with simulated audio waveforms, streaming transcripts, and real-time nudges.
- **Live Mode:** Toggle the top bar switch to "LIVE BACKEND" to communicate with the FastAPI backend at `http://127.0.0.1:8000/api/v1/retrieval/search`.

---

## 🔒 Checkpoint Status

### Phase 0 — Foundation (GATE 0: PASSED)
- [x] Repository layout following `ARCHITECTURE.md` and `CLAUDE.md`.
- [x] Secret scanning utility (`scripts/scan_secrets.py`) verified with unit tests (`tests/test_secret_scan.py`).
- [x] PostgreSQL 16 + pgvector schema migrations (`services/api/migrations/001_initial_schema.sql`).
- [x] `docker-compose.yml` for Postgres, Redis, and MinIO.
- [x] Architectural decisions log (`docs/DECISIONS.md`).
- [x] ASR/TTS language capabilities report (`docs/ASR_TTS_REPORT.md`).
- [x] GitHub Actions CI workflow (`.github/workflows/ci.yml`).

### Phase 1 — Knowledge Base Q2 (GATE 1: PASSED)
- [x] Realistic mixed corpus in `kb/raw/` with planted defects catalogue (`kb/raw/PLANTED_DEFECTS.md`).
- [x] Anchor benchmark record `kb_product_001 · Branch Partnership Benefits`.
- [x] 9-stage ingestion pipeline (`kb/pipeline/run_pipeline.py`).
- [x] Low-health OCR scan quarantine (`kb/quarantine/`).
- [x] Conflict resolution: Statutory policy wording (30-day grace period) supersedes website FAQ (15 days).
- [x] Near-duplicate clustering and canonical selection (`kb/pipeline/dedupe.py`).
- [x] Layered PII masking with vault isolation; `make pii-scan` verifies 0 raw leaks.
- [x] Hybrid BM25 + dense vector search with Reciprocal Rank Fusion and threshold gating (`services/retrieval/retriever.py`).
- [x] Retrieval evaluation (`data/evaluation/retrieval_evidence.md`): 100.0% accuracy, 100.0% refusal precision on out-of-scope queries, MRR 0.868.
- [x] FastAPI REST endpoint `POST /api/v1/retrieval/search`.
- [x] Full design documentation (`docs/KB_DESIGN.md`).

---

## 📐 Key Architectural Signatures

1. **Zero Gradients / Not-AI Aesthetic:** Clean, high-density air-traffic-control styling with crisp 1px borders, solid fills, and strict semantic color coding.
2. **Every Spoken Claim Has A Receipt:** Click any citation chip across transcripts to inspect exact source chunks, similarity scores, and provenance lineage DAGs.
3. **Sentence Gate Visualizer:** Live pipeline visualizer (`Draft → Verified → Spoken` or `Draft → Blocked [Strikethrough] → Fallback`).
4. **Nudge Court (Suppression as Proof):** Prominently displays avoided low-value alerts with explicit reason codes (`cooldown`, `duplicate`, `below confidence 0.62`, `topic_grouped`).
5. **Localization ≠ Translation:** 3-pane workbench contrasting Neutral Intent, Literal Translation, and Authentic Localized Expressions for India (`in_en`), Philippines (`ph_tl`), and Indonesia (`id_id`).
6. **Knowledge Time Machine:** Version scrubber with retrieval regression testing and snapshot diff reports.

---

## 📚 Documentation Index

- `docs/CHECKPOINTS.md`: Gated 48-hour build plan with signed-off gates.
- `docs/KB_DESIGN.md`: Knowledge base architecture and planted defect resolution report.
- `docs/DECISIONS.md`: Architectural Decision Records (ADRs 001–004).
- `docs/ASR_TTS_REPORT.md`: Multilingual speech provider verification matrix.
- `data/evaluation/retrieval_evidence.md`: 19-query retrieval evidence table with latency and refusal metrics.
- `docs/PRD.md`: Master Product Requirements Document.
- `docs/ARCHITECTURE.md`: Complete system architecture & data schemas.
