# PARLEY — ARCHITECTURAL & TECHNICAL DECISIONS LOG

> Format: Context, Alternatives Considered, Decision, Rationale, Consequences / Rejection Reason.

---

## ADR 001: Vector Store & Storage Foundation
- **Status:** Accepted
- **Context:** The platform requires storing structured records, chunks, dense embeddings, BM25 full-text vectors, and operational telemetry (spans, nudges, calls) with low latency and relational integrity.
- **Alternatives Considered:**
  1. *Pinecone / Qdrant Cloud:* Pure vector search SaaS.
  2. *ChromaDB:* Local embedded vector store.
  3. *PostgreSQL 16 + pgvector:* Relational database with vector similarity extension.
- **Decision:** **PostgreSQL 16 + pgvector** + Redis for streams/cooldowns.
- **Rationale:**
  - Complete co-location of relational metadata (`record_id`, `kb_version`, `pii_types`, `supersedes`) with high-dimensional chunk embeddings.
  - Zero dual-write inconsistency between relational state and vector index.
  - Support for HNSW index for sub-10ms approximate nearest neighbor queries, plus native GIN `tsvector` indexes for sparse search.
  - Role-level security isolates `pii_vault` from the `retriever` DB role.
- **Rejected Alternatives:**
  - *ChromaDB:* Lacks transactional isolation, weak multi-attribute filtering, and no role-level row security.
  - *Pinecone:* Proprietary SaaS with vendor lock-in and high variable cost for high-turn churn.

---

## ADR 002: Knowledge Base Hybrid Retrieval & Re-ranking Architecture
- **Status:** Accepted
- **Context:** An AI voice agent and human assistant cannot hallucinate financial numbers, grace periods, or interest rates. Dense vector search alone suffers from vocabulary mismatch and exact keyword blindness (e.g. policy IDs, specific numbers, and exact acronyms like "IRDAI" or "OJK").
- **Alternatives Considered:**
  1. *Dense-only vector search (Cosine top-k)*.
  2. *BM25 Keyword search only*.
  3. *Hybrid Dense (BGE-M3) + Sparse (BM25) with Reciprocal Rank Fusion (RRF) and Cross-Encoder Re-ranking*.
- **Decision:** **Hybrid Dense + Sparse with RRF, Cross-Encoder Re-ranking, and strict Threshold Gating**.
- **Rationale:**
  - BM25 accurately matches exact product codes, fee amounts, and statutory identifiers.
  - Multilingual dense embeddings (`BGE-M3`) capture semantic intent across mixed English, Taglish, and colloquial Bahasa.
  - RRF normalizes score distributions across dense and sparse retrievals without manual weight tuning.
  - A multilingual cross-encoder reranker scores question-context entailment.
  - **Threshold Gate (`min_rerank_score = 0.55`):** If no candidate exceeds the confidence margin, the system returns `NO_MATCH` rather than a weak hallucinated guess.
- **Consequences:**
  - Slightly higher compute budget (~35ms rerank step), comfortably within the 400ms retrieval latency budget.

---

## ADR 003: Grounding & Sentence Gate (Fail-Closed Architecture)
- **Status:** Accepted
- **Context:** Large Language Models can hallucinate even when supplied with relevant context. We need deterministic guarantees that every spoken factual claim has proof.
- **Alternatives Considered:**
  1. *Prompt Engineering alone ("Only answer using the context provided")*.
  2. *Post-call LLM Evaluation (detecting hallucinations after the user heard them)*.
  3. *Pre-TTS Sentence Gate with Natural Language Inference (NLI) + Exact Match checks*.
- **Decision:** **Pre-TTS Fail-Closed Sentence Gate**.
- **Rationale:**
  - Every response is parsed into discrete sentences before synthesis.
  - Non-factual sentences (greetings, acknowledgments) pass through immediately.
  - Factual statements are verified against retrieved chunks using numerical/date regex equality and entailment checks.
  - If verified, the sentence is tagged with its citation `[record_id@version · source]` and forwarded to TTS.
  - If unsupported, the sentence is blocked and replaced by a localized "I don't have that information" fallback.
  - If the verifier service times out or errors, the gate fails closed (blocks the claim).
- **Rejected Alternatives:**
  - *Prompt-only:* Empirically suffers from a 2–6% hallucination rate under adversarial prompting. Unacceptable in regulated insurance/banking operations.

---

## ADR 004: Multilingual Voice Architecture & Market Pack Pattern
- **Status:** Accepted
- **Context:** The platform serves India (`in_en`), Philippines (`ph_tl`), and Indonesia (`id_id`). Hardcoding branching logic (`if market == 'ph': ...`) causes maintainability debt.
- **Alternatives Considered:**
  1. *Single monolithic prompt with instructions for all 3 markets*.
  2. *Separate microservice codebases per country*.
  3. *Market Pack Plugin Architecture (data-driven configuration)*.
- **Decision:** **Market Pack Plugin Architecture**.
- **Rationale:**
  - Core "Due-Date Conversation Engine" finite-state machine is universal: identify → purpose → status → qualify → handle objection → commit → close.
  - All market-specific assets (prompts, register rules, honorific rules "po/opo", glossary synonyms, fallback phrases, ASR acoustic profiles, and TTS voice IDs) reside in `market_packs/{market_id}/`.
  - Adding a new country or language requires zero modifications to the core engine.

---

## ADR 005: Live Cloud Production Infrastructure & Real-Time Services
- **Status:** Accepted
- **Context:** The platform requires persistent, enterprise-scale storage, sub-millisecond cache for real-time live nudges, zero-egress audio storage, low-latency multilingual speech recognition/synthesis, and fast LLM reasoning without fake mocks.
- **Alternatives Considered:**
  1. *Local Docker only:* Ephemeral, lacks distributed availability, and fails in production multi-region deployments.
  2. *Single-vendor cloud lock-in (e.g. AWS or Azure only):* Prohibitive egress fees for audio streaming and rigid vendor constraints.
  3. *Composable Best-of-Breed Live Cloud Stack:* Aiven PostgreSQL with pgvector, Upstash Redis TLS, Cloudflare R2, Groq LLM, Cohere Multilingual Embeddings, Deepgram Nova-2 ASR, and ElevenLabs TTS.
- **Decision:** **Composable Best-of-Breed Live Cloud Stack**.
- **Rationale:**
  - **Aiven Cloud PostgreSQL 16 + pgvector:** Acts as the persistent single source of truth for all 17 relational tables, call sessions, turns, sentence receipts, and 1024-dimensional semantic chunk embeddings.
  - **Upstash Redis (TLS `rediss://`):** Serves as the ultra-fast real-time cache. Manages 20s per-topic nudge cooldowns, 60s sliding window rate-limiting, semantic deduplication sets, and 5-minute KB query vector caching.
  - **Cloudflare R2 (`darwix-assignment`):** S3-compatible, zero-egress object storage for live call audio chunks, finalized full recordings, transcript JSON backups, and raw source document archival.
  - **Groq Cloud (`openai/gpt-oss-120b`):** Sub-1.5s conversational turn completions and Tier-2 signal analysis using structured JSON reasoning.
  - **Cohere Multilingual Embeddings (`embed-multilingual-v3.0`):** 1024-dim vectors that natively match PostgreSQL `vector(1024)` across English, Taglish, and Bahasa Indonesia.
  - **Deepgram Nova-2 ASR:** Sub-300ms transcription with market-specific keyphrase boosting for insurance policy terms in Taglish and Indonesian.
  - **ElevenLabs Multilingual v2:** High-fidelity speech synthesis using premade voices: Sarah (`EXAVITQu4vr4xnSDxMaL` for India), Bella (`hpp4J3VqNfWAUOO0d1Us` for Philippines), and Adam (`pNInz6obpgDQGcFmaJgB` for Indonesia).
- **Consequences:**
  - Eliminates mock dependencies; verified via `scripts/test_services.py` with 100% pass rate.
  - PostgreSQL pool connection management is loop-aware in `services/db.py` to prevent event-loop conflicts.
