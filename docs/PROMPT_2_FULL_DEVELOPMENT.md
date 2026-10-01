# PROMPT 2 — FULL DEVELOPMENT MASTER PROMPT: "PARLEY" BACKEND, AI, VOICE AND REAL-TIME ENGINE

> Paste everything below the line into your AI coding tool. Use alongside PROMPT 1 (frontend); the API and WebSocket contracts in section 14 must match.
> Before you start: verify the CURRENT model names, languages and pricing of every provider listed (they change). Where a provider lacks a language or accent, document it as a finding rather than hiding it.

---

## 0. ROLE AND MISSION

You are a staff-level AI/ML systems engineer. Build **PARLEY**: one coherent system that satisfies all four questions of an "AI Engineer Assessment" with working, measured, explainable outcomes.

**Scoring priorities (from the assessment):** functional outcomes, measurable results, grounded responses, reliability, ability to explain choices. **Auto-rejection risks to design against:** disconnected KB and voice bot; hallucinated answers; unmeasured latency; literal translation without code-switching/localization; nudges produced only after the call; excessive low-value alerts; copied work the candidate cannot explain.

Do not ask questions. Decide, document each decision (what / why / rejected alternatives) in `docs/DECISIONS.md`, and build. Prefer a **reliable core workflow** over extra features.

## 1. THE UNIQUE ANGLE (what makes this submission uncommon)

Most entries will be "a prompt + a vector DB + a dashboard." PARLEY is built on eight engineering ideas. Implement all of them; they are the differentiators and the talking points for the video.

1. **One engine, three Market Packs.** A single "Due-Date Conversation Engine" (renewal / premium reminder / instalment reminder share the same skeleton: identify → purpose → status → obstacle → commitment → close). Market behavior is injected by a **Market Pack** (config + KB slice + terminology + register rules + fallback phrases + TTS/ASR profile): `in_en` (Q1), `ph_tl` (Q3 Philippines), `id_id` (Q3 Indonesia). Localization is data, not code forks.
2. **Sentence Gate (grounding enforcement, not grounding hope).** The LLM drafts; a verifier checks each factual sentence against retrieved chunks (NLI/entailment prompt or a small cross-encoder + numeric/date/amount exact-match checks). Unsupported factual sentences are removed or replaced with the market-appropriate "I don't have that information" fallback *before TTS*. Every spoken sentence carries `citations: [record_id@version]`.
3. **Receipts everywhere.** Every retrieved chunk, bot sentence, nudge and latency number is linked by a `trace_id` to a stored span in a **Call Black Box**.
4. **Language Lock + Register Controller.** A per-turn language/register state machine detects customer language mix (EN / TL / Taglish; formal ID / colloquial ID / ID+English loanwords) and constrains the LLM and TTS so fallback and escalation never switch unexpectedly to English. A drift detector scores each bot turn.
5. **Knowledge Time Machine.** KB is versioned (immutable snapshots + diffs). Retrieval regression tests run per version, and calls record the KB version they used so any answer can be replayed against a different version.
6. **Nudge Court.** Q4's nudge engine logs both fired and suppressed nudges with reasons. Suppression policy (confidence thresholds, dedupe, cooldown, topic grouping, priority, expiry, noisy-audio guard) is first-class and measured.
7. **Chaos Harness.** Automated noise (SNR sweep), accent/speed and code-switch stress on recorded audio to produce honest false-positive and ASR-degradation numbers.
8. **"I don't know" as a KPI.** Refusals are tracked with reasons; the test suite rewards correct refusals and penalizes confident fabrication.

## 2. USE CASE DECISIONS (fixed)

- **Q1 voice agent:** *Insurance policy renewal reminder + qualification of renewal intent* (Market Pack `in_en`, English, light Hinglish tolerance in ASR/LLM understanding). Business action: **callback scheduling + mock CRM lead summary + human-escalation webhook**.
- **Q2 KB:** built from a realistic mixed corpus of a fictional insurer/finance group ("Meridian Assure / Meridian Finance") that you generate or assemble: marketing web pages (scraped or saved HTML), product brochures (PDF), policy-wording and qualification rules (PDF/DOCX), forms and fee tables, FAQ pages, objection-handling playbooks, branch-partnership pages (include the exact `kb_product_001 Branch Partnership Benefits` sample), duplicated and near-duplicated pages, inconsistent terminology (premium/installment/contribution; grace/lapse/free-look), and PII-laden customer samples (synthetic). **Plant deliberate defects** to prove cleaning: nav/footers, repeated sections, conflicting grace-period values across two sources, an extraction-failed scanned PDF page, mixed date formats, an obvious typo in a rate table, and synthetic PII.
- **Q3 Philippines bot:** life insurance premium/renewal reminder + bancassurance bank-referral follow-up. English / Filipino / natural Taglish. Terms: premium, policy, beneficiary, rider, lapse, coverage, bank referral, grace period, "po/opo".
- **Q3 Indonesia bot:** multifinance instalment reminder (jatuh tempo) with follow-up for late payment. Formal + colloquial Bahasa, English loanwords, at least one regional accent (choose Javanese-accented Indonesian; optionally Batak or Sundanese as a second). Terms: cicilan, angsuran, tenor, denda, DP, jatuh tempo, pembiayaan, "Bapak/Ibu/Kak".
- **Q4:** real-time insights for a generic insurance/finance sales or servicing call, with scripted scenarios: missed cross-sell (second vehicle / second policy), skipped disclosure/risky statement, rising frustration, noisy-ambiguous call.

## 3. REPOSITORY LAYOUT

```
parley/
├─ README.md                    # overview, setup, how to run each question, results summary
├─ .env.example                 # every variable, no secrets
├─ docker-compose.yml           # api, worker, postgres(+pgvector), redis, (optional) livekit, minio
├─ docs/
│  ├─ ARCHITECTURE.md  DECISIONS.md  KB_DESIGN.md  VOICE_AGENT.md
│  ├─ LOCALIZATION.md  ASR_TTS_REPORT.md  REALTIME_NUDGES.md
│  ├─ LATENCY_REPORT.md  EVAL_REPORT.md  LIMITATIONS_AND_PRODUCTION_PLAN.md
│  └─ diagrams/ (mermaid + exported png)
├─ kb/
│  ├─ raw/        # website html snapshots, PDFs, docx, csv
│  ├─ pipeline/   # fetch, parse, clean, normalize, dedupe, pii, chunk, embed, publish
│  ├─ schema/     # pydantic + JSON schema, taxonomy.yaml, glossary.yaml
│  ├─ snapshots/  # versioned immutable exports (v1.0, v1.1 …)
│  └─ tests/      # retrieval_queries.yaml, regression runner
├─ services/
│  ├─ api/            # FastAPI: REST + WebSocket gateway
│  ├─ retrieval/      # hybrid search, rerank, citation builder
│  ├─ agent/          # dialogue manager, market packs, sentence gate, tools
│  ├─ voice/          # call provider adapters, ASR/TTS adapters, VAD, language router
│  ├─ realtime/       # streaming pipeline, signals, nudge engine, latency tracer
│  └─ eval/           # grounding evals, red-team, chaos harness, metrics
├─ market_packs/  in_en/  ph_tl/  id_id/   # prompts, rules, glossary, fallbacks, voices, asr profile
├─ data/  calls/ audio/ transcripts/ configs/ evaluation/
├─ scripts/  ingest.sh  build_index.sh  run_demo.sh  replay_call.py  chaos_run.py
└─ frontend/   # from PROMPT 1
```

## 4. TECH STACK (defaults; swap only with a documented reason)

- **Language/Runtime:** Python 3.11, FastAPI, Uvicorn, asyncio; Pydantic v2; `structlog` + OpenTelemetry-style spans stored in Postgres.
- **Storage:** Postgres 16 + **pgvector** (records, chunks, embeddings, versions, calls, spans, nudges). Redis for streams/pub-sub/cooldown keys. Local disk or MinIO for audio.
- **Retrieval:** hybrid = dense (multilingual embedding model; e.g., BGE-M3 or a hosted multilingual embedding) + sparse (Postgres full-text / BM25 via `rank_bm25` or `pg_search`) fused with Reciprocal Rank Fusion, then a multilingual cross-encoder reranker (e.g., bge-reranker-v2-m3 or a hosted rerank API). Metadata filters: `market`, `lang`, `category`, `valid_at`, `version`, `pii=false`.
- **Voice platform:** primary **LiveKit Agents** (web calling interface, full control of the pipeline) with a `CallProvider` adapter so Vapi/Retell could be a documented alternative. Optional PSTN number via Twilio/Telnyx SIP trunk if time permits; a browser calling page is acceptable per the assessment.
- **ASR (streaming, language-specific per market):** evaluate at least two per market from Deepgram (Nova family), Google Cloud STT (Chirp), Azure Speech, and Whisper-large-v3 (offline baseline). Configure each Market Pack with its own provider/model/language hints/phrase boosting (finance terms, product names). Record observed behavior; do not assume support, test it.
- **TTS (native voices):** Azure Neural voices (e.g., `fil-PH-*`, `id-ID-*`, `en-IN-*`) as baseline; compare with ElevenLabs/Google if available. Use SSML for pacing, numbers, amounts, dates; document every compromise (e.g., English loanword pronunciation inside Filipino/Indonesian voice).
- **LLM:** Claude (Sonnet-class for dialogue and nudges; Haiku-class for fast signal classification and verification) through an `LLMClient` interface with timeouts, retries, streaming, and provider fallback. Temperature low (≤ 0.3). Structured outputs via JSON schema/tool use.
- **Frontend contracts:** see §14.
- **Quality:** pytest, ruff, mypy, pre-commit; GitHub Actions running lint, unit tests, KB regression tests, and a short eval smoke test.

## 5. QUESTION 2 — KNOWLEDGE BASE PIPELINE (build this first; Q1 depends on it)

### 5.1 Collection and parsing
- Website extraction: `httpx` + `trafilatura`/`readability-lxml` for main-content extraction, `selectolax`/BeautifulSoup for structure, Playwright fallback for JS-rendered pages; respect robots/ToS (for the assignment use locally saved or self-authored pages, and say so). Store raw HTML snapshots with fetch timestamp and HTTP status.
- Document parsing: `pdfplumber`/`PyMuPDF` (text + tables), `camelot`/`pdfplumber` table extraction, `python-docx` for DOCX, `pandas` for CSV/XLSX, OCR fallback (Tesseract or cloud OCR) for scanned pages with a confidence score.
- **Extraction failure handling:** per-source `extraction_health` score (text density, garbled-character ratio, table integrity, OCR confidence). Failures are quarantined into `kb/quarantine/` with reason codes, never silently dropped, and surfaced in the UI.

### 5.2 Cleaning and normalization
- Strip navigation, cookie banners, headers/footers, breadcrumbs, repeated disclaimers (detect with cross-document line frequency + DOM-region heuristics), social/share blocks, irrelevant promos.
- **Obvious source-error flags:** numeric conflicts across sources (e.g., grace period 15 vs 30 days), impossible dates, rate tables with out-of-range values, orphan references. Create `source_issues` records with severity, both source references, and a *resolution policy* (policy PDF > website > marketing).
- **Standardization:** a `glossary.yaml` mapping synonyms to canonical terms per market (e.g., "instalment/installment/EMI/angsuran/cicilan" with market-specific canonicals; "grace period/tolerance period/masa tenggang"), canonical headings, ISO-8601 dates (store original), currency normalization (INR/PHP/IDR with locale display), form field names normalized (snake_case) with a `form_fields` table.
- **Deduplication:** exact (content hash) + near-duplicate (MinHash/LSH or embedding cosine ≥ 0.92 within same category) → cluster, choose canonical by authority/recency/completeness, keep `duplicate_of` provenance. Report duplicates removed.
- **PII identification and protection:** layered detection: regex + checksum validators (phone, email, policy/loan numbers, PAN/Aadhaar-like, Indonesian NIK, Philippine TIN/SSS-like), NER (spaCy/Presidio with custom recognizers), and an LLM check on sampled chunks. Replace with stable typed tokens (`[PHONE_1]`), store the mapping only in an encrypted, separate vault table that the retriever cannot read. Chunks are flagged `pii: true/false`; `pii: true` chunks are never indexed for the voice agent. Add a **PII leak test** that scans every indexed chunk and fails CI if any pattern hits.

### 5.3 Schema, taxonomy, versioning
Record schema (Pydantic + JSON Schema), extending the assessment's fields:
```
record_id        kb_{category_prefix}_{NNN}     # e.g., kb_product_001
title, content (clean text), content_original_ref
category         (taxonomy leaf) ; category_path (e.g., product/partnership/benefits)
source           {type: website|pdf|docx|form|table|playbook, uri, section, page, fetched_at, content_hash}
market, lang, audience (customer|agent|branch_partner)
version          semver per record; kb_version (snapshot id)
valid_from, valid_to, supersedes, duplicate_of
pii (bool), pii_types[], confidence, extraction_health
chunk {parent_doc_id, chunk_index, token_count, heading_path}
citations {display: "Policy Wording §4.2 (p.7)", url_or_path}
embedding_model, embedding_version
```
Taxonomy (`taxonomy.yaml`): `product`, `policy_rules`, `qualification_rules`, `faq`, `objection_handling`, `forms_and_fees`, `compliance_disclosures`, `escalation_rules`, `partnership_benefits`, each with market overrides. Provide at least 5 fully written sample records including the assessment's `kb_product_001` example.

Versioning: immutable snapshots (`v1.0` raw ingest, `v1.1` after fixes), content-hash diffing, `supersedes` links, retrieval only sees `kb_version = active` unless a replay requests another.

### 5.4 Chunking, embedding, indexing, retrieval, citation
- **Chunking:** structure-aware (headings/sections/table rows kept intact), 150–350 tokens target, 15% overlap only for prose, one chunk per FAQ pair and per objection–response pair, one chunk per qualification rule with its condition + outcome; prepend `heading_path` (contextual chunk header) for embedding. Tables → row-group chunks with column headers repeated.
- **Embedding/indexing:** multilingual embeddings; HNSW index in pgvector; separate GIN full-text index; metadata B-tree indexes.
- **Retrieval/ranking logic:** query rewrite (language-aware, expand finance synonyms from glossary) → hybrid retrieve top 30 → RRF → rerank top 8 → apply version/recency/authority boost → threshold gate (`min_rerank_score`, `min_margin`) → return top 3 with citations. If nothing passes, return `NO_MATCH` (this triggers the unavailable-information path, never a guess).
- **Citation method:** `[record_id@kb_version · source.display]`; the same string is stored on every spoken sentence and shown in the UI.

### 5.5 Retrieval testing (required evidence)
- `retrieval_queries.yaml` with ≥ 12 queries across product, policy, qualification, FAQ, objection, plus 4 *no-answer* queries and 2 cross-lingual queries (Taglish, Indonesian colloquial). Runner outputs a Markdown/CSV table with: user question, retrieved chunk/record, source reference, relevance explanation (LLM-assisted, human-editable), verdict (correct / partially correct / incorrect). Keep at least two initial failures and document the fix (e.g., synonym expansion, chunk-size change, reranker threshold). Compute recall@k, MRR, refusal precision.
- Expose a simple retrieval API + the voice agent's `retrieve_kb` tool using the same code path (proof of real connection).

## 6. QUESTION 1 — KNOWLEDGE-GROUNDED VOICE AGENT

### 6.1 Conversation design (Due-Date Conversation Engine)
Finite-state skeleton with LLM-driven turns: `GREET_VERIFY` (consent notice, identity verification using non-sensitive confirmation only) → `PURPOSE` → `STATUS_CHECK` (policy status, due date, amount from CRM mock) → `QUALIFY` (renewal intent, payment mode, obstacles, change-of-details) → `HANDLE_OBJECTION` (RAG) → `COMMIT` (payment date/callback) → `CLOSE`. Cross-cutting handlers: `UNSUPPORTED_QUESTION`, `OUT_OF_SCOPE`, `CONFLICTING_DETAILS`, `HUMAN_ESCALATION`, `DISTRESS/VULNERABLE_CUSTOMER`.

Qualification logic (rules in YAML, evaluated in code, not by LLM alone): renewal-intent score, eligibility flags (policy in grace period vs lapsed, revival eligibility window), disposition outcome (`will_pay`, `needs_callback`, `needs_human`, `not_interested`, `dispute`). The LLM extracts slots; code decides the disposition.

### 6.2 Grounding implementation
- System prompt contains **only** persona, tone, safety rules, tool descriptions and flow rules, **no FAQs, objections or policies**. All facts come via `retrieve_kb`.
- Per turn: intent+slot extraction → decide retrieval need → retrieve (≤ 400 ms budget) → draft with citations → **Sentence Gate** → TTS.
- **Unsupported-question fallback:** when `NO_MATCH` or gate removes a claim, speak a fixed, market-localized phrase ("I don't have that information confirmed right now; I can have a specialist call you back, shall I arrange that?") and offer callback/escalation. Never improvise policy numbers, rates, dates, or legal statements.
- **Human escalation:** triggers (explicit request, 2 consecutive fallbacks, anger score > threshold, vulnerable-customer cues, complaint/legal words). Executes `escalate_human` tool → webhook payload with summary, reason, transcript link; spoken handoff line in the customer's language.
- **Conflicting/incomplete details:** read-back confirmation; ask a single clarifying question; never silently pick one value.
- Barge-in handling, endpointing tuned per market, silence prompts, max call duration, recording-consent disclosure.

### 6.3 Business action (implement all three; mock where needed)
`create_lead_or_update_crm` (mock CRM table + summary), `schedule_callback` (slot parsing with timezone), `escalate_human` (webhook + stored payload). Show results in UI.

### 6.4 Test calls (required)
Record ≥ 3 (target 6) calls through the real calling interface: cooperative; objection (price/ "I'll pay later"/ "policy not useful"); incomplete or conflicting details; out-of-scope question; human-assistance request; **a question whose answer is not in the KB** (bot must say so). Store audio, transcript (with speaker labels and citations), outcome JSON, and a `results.md` table (scenario, expected, actual, pass/fail, grounded %, fallbacks, latency).

## 7. QUESTION 3 — NATIVE-LANGUAGE BOTS

### 7.1 Philippines (`ph_tl`)
- ASR config: provider/model; languages `en-PH`, `fil-PH` (and test Taglish with phrase boosting for: premium, policy, beneficiary, rider, lapse, coverage, bank referral, GCash, Landbank/BDO-style bank names as generic placeholders). Document how mixed utterances are transcribed, where the model mis-assigns language, and mitigation (multi-language hint, post-ASR normalization, LLM understanding tolerant of noisy Taglish).
- Dialogue: natural Taglish by default after detecting customer mix; "po/opo", "ma'am/sir", softeners ("pwede po ba", "baka po"), no literal translation. Flows: premium reminder + lapse-prevention + bancassurance referral follow-up.
- Localization evidence: ≥ 5 documented examples comparing a literal translation vs. localized line, with reasons (politeness, payment channel such as bank/GCash/over-the-counter, 13th-month/payday timing, family/beneficiary sensitivity, amount/date format).
- Required tests: cooperative, sector objection ("hindi ko na kailangan ng insurance", "mahal ang premium", "nag-lapse na po ba?"), mixed English finance terms, colloquial speech, human escalation. Record **2 calls**.

### 7.2 Indonesia (`id_id`)
- ASR: Indonesian provider/model, formal and colloquial (gue/aku/saya, nggak/enggak, "udah", "nanti ya Pak"), English loanwords ("DP", "tenor", "overdue", "limit"), numerals/amount parsing ("tiga juta lima ratus", "3,5 jt"). **Regional-accent test:** record or obtain/synthesize ≥ 3 minutes of Javanese-accented speech (own voice or consented volunteer; document the source honestly) and compare WER/behavior against standard Jakarta speech; log errors (vowel shifts, "e/é", final consonants, code-switching to Javanese words). Report quality as *approximate with sample size*.
- Dialogue: Bapak/Ibu/Kak honorifics, formal-to-colloquial register matching, respectful collections tone (OJK-style conduct awareness: no threats, no contacting third parties, explain denda neutrally), payday timing ("tanggal gajian"), payment channels (virtual account, minimarket, transfer). Terms used naturally: cicilan, angsuran, tenor, denda, DP, jatuh tempo, pembiayaan.
- Required tests: cooperative, objection ("lagi susah, minggu depan ya", "dendanya kok besar?"), mixed English finance terms, colloquial speech, human escalation, regional accent. Record **2 calls**.
- ≥ 5 localization examples as above.

### 7.3 Shared multilingual requirements
- **Language Router:** detect per-turn language mix (lightweight classifier + ASR language tags) → set `register`, `lang_mix`, TTS voice, SSML profile. **Language Lock:** fallback/escalation strings and LLM instructions are always in the active language/register; automated check flags any bot turn whose English ratio exceeds a market threshold unless the customer is code-switching.
- **TTS report:** voices used, SSML adjustments, loanword pronunciation fixes (phoneme/respelling dictionaries), numbers/amounts/dates reading rules, compromises.
- **Comparison report (`docs/ASR_TTS_REPORT.md`):** table of provider/model, languages tested, code-switching behavior, approximate quality, observed errors, accent results, latency, cost estimate; final choice and why.
- **Known gaps:** native-speaker review not performed (or performed by whom), compliance wording requiring legal review, dialect coverage limits, TTS prosody limits.

## 8. QUESTION 4 — LIVE INSIGHTS AND NUDGES

### 8.1 Streaming pipeline (must be genuinely real-time)
`AudioSource` (live mic via WebRTC **or** a recording replayed at 1× speed in 100–250 ms PCM chunks; stereo channel = agent/customer when available, diarization fallback) → `StreamingASR` (websocket, interim + final results; record per-chunk latency) → `TranscriptBuffer` (rolling window, speaker-tagged) → `SignalExtractor` → `NudgeEngine` → `Delivery` (WebSocket + webhook + polling `GET /live/:id/nudges` + CLI tail). No post-call analysis path may be used for the qualifying demo.

### 8.2 Signal extraction (hybrid, fast)
- **Tier 1 (≤ 30 ms, rules/ML):** keyword/regex/embedding-similarity triggers for disclosures, risky phrases ("guaranteed returns", "no need to read the terms"), payment-difficulty phrases (EN/TL/ID), cross-sell cues ("second car", "my wife's bike", "another policy"), callback phrases, escalation words; lexicon + small sentiment/frustration model (e.g., rolling slope of sentiment + prosody proxies like interruption rate/ speech-rate where available).
- **Tier 2 (≤ 700 ms, small fast LLM):** triggered only when Tier 1 is ambiguous or on topic shifts; returns strict JSON `{signal, confidence, evidence_span, suggested_action_id}`. Cache by window hash.
- **Compliance engine:** required-disclosure checklist per call stage with timers (e.g., recording consent, product-risk disclosure, cooling-off/free-look explanation); fires when the agent attempts to proceed to a gated step (e.g., payment/commitment language) while a disclosure is unmet.
- Signals tracked: intent/topic shifts, compliance/risk, sentiment/frustration, buying signals, missed opportunities, callback needs.

### 8.3 Nudge generation and control (Nudge Court)
- Nudge templates drawn from an **approved playbook in the KB** (so nudges are grounded too): e.g., "Acknowledge the concern before continuing," "Offer approved payment-support/callback," "Suggest multi-vehicle offer," "Read the missing disclosure now."
- LLM only personalizes ≤ 18-word text; compliance nudges use exact approved wording.
- Controls (all configurable, all logged): confidence threshold per signal type; duplicate suppression (semantic + id); per-topic cooldown; topic grouping (merge related signals into one nudge); priority queue (P0 compliance > P1 frustration/payment > P2 opportunity > P3 coaching); expiry (opportunity nudges expire after N seconds or on topic change); repetition limit; **noisy-audio guard** (raise thresholds when ASR confidence/SNR is low; require two corroborating signals); max nudges per minute.
- Each fired/suppressed decision persists `{nudge_id, signal_ids, decision, reason, thresholds_at_time, trace_id}`.

### 8.4 Latency measurement (required)
Instrument with monotonic timestamps at: `audio_chunk_received`, `asr_partial`, `asr_final`, `signal_detected`, `llm_start/end`, `nudge_created`, `nudge_sent`, `ui_rendered` (UI posts back an ack). Compute per-stage and end-to-end **P50/P95/P99** over ≥ 100 nudge events per scenario in `docs/LATENCY_REPORT.md` with histograms; include network vs. compute split and the budget (target P95 end-to-end ≤ 2.5 s for Tier-1, ≤ 3.5 s with LLM).

### 8.5 Quality and false-positive analysis
Hand-label ≥ 4 scenario recordings (≥ 3 min each, mix of EN/TL/ID if feasible): missed cross-sell, skipped disclosure, rising frustration, noisy/ambiguous. Compute precision, recall, false-positive rate per signal type, plus "nudges per minute" and "suppressed vs fired." The noisy/ambiguous call must produce few or zero nudges; show the noisy-audio guard evidence. Run the **Chaos Harness** (white/babble noise at SNR 20/10/5 dB, 1.15× speed, code-switch inserts) and plot degradation.

### 8.6 Scale and noise limitations (document honestly)
10× concurrency plan (worker pool per stream, backpressure, bounded queues, shedding Tier-2 LLM first, regional deployments, GPU/ASR cost model), noisy-audio failure modes, diarization drift, ASR language flips, hallucinated signals, privacy/retention.

## 9. VOICE/LATENCY BUDGET FOR Q1 (live agent)

Target end-of-user-speech → first bot audio ≤ 1.2 s median: VAD endpointing ~250 ms, ASR final ~150 ms, retrieval ≤ 120 ms, LLM first token ≤ 450 ms (stream), sentence gate on first sentence ≤ 150 ms (pipeline gating per sentence), TTS first byte ≤ 250 ms. Log and report actuals; cache embeddings for frequent queries; pre-warm connections.

## 10. EVALUATION SUITE

- **Grounding evals:** sentence-level supported/unsupported rate on all recorded calls; red-team prompts (ask for unavailable rates, invent legal guarantees, prompt-injection from KB text or user, request PII of others) with pass/fail.
- **Retrieval evals:** recall@k, MRR, refusal precision, per-version regression.
- **Dialogue evals:** slot extraction accuracy, disposition correctness, escalation precision, language-drift rate.
- **Q4 evals:** as §8.5.
- Output `docs/EVAL_REPORT.md` and machine-readable `data/evaluation/*.json` consumed by the frontend Evaluation page.

## 11. SECURITY, PRIVACY, COMPLIANCE

No secrets in git (`.env.example` only, plus a secret-scan pre-commit). Synthetic customer data only. PII vault separated and encrypted; logs scrub PII; audio retention policy and recording-consent line in every script; rate limiting and auth on API; short-lived call tokens; prompt-injection defenses (KB content wrapped as untrusted data, instruction-stripping, tool allow-list); human-escalation always available. Include a "regulatory wording needs review" register (IRDAI / IRDAI-style disclosures for IN, IC/BSP-style for PH, OJK conduct for ID) without claiming legal accuracy.

## 12. DELIVERABLE ARTIFACTS CHECKLIST

1. Working repo with one-command setup (`make up`, `make ingest`, `make index`, `make demo`).
2. KB: cleaned records + snapshots + schema + taxonomy + dedupe/PII reports + retrieval evidence table (≥ 12 queries).
3. Q1: callable web interface (and optional phone number), flow config, ≥ 3 recorded calls with transcripts and results.
4. Q3: 2 recorded calls per market (PH, ID), transcripts, configs, glossaries, ≥ 3 localization examples each, ASR/TTS comparison, accent observations, known gaps.
5. Q4: streaming demo, nudge logs (fired + suppressed), latency report (P50/P95), false-positive analysis, recorded live demo.
6. Architecture diagram (Mermaid + PNG), decisions log, limitations + production plan.
7. Video walkthrough script (`docs/VIDEO_SCRIPT.md`) following the required order: overview & live demo → architecture & decisions → KB/retrieval and voice flow → multilingual handling and live nudges → fallbacks, limitations, production improvements.
8. `docs/EXPLAIN_IT.md`: a Q&A cheat sheet of the 30 hardest questions a reviewer could ask about each design choice, with concise answers (this supports "can the candidate defend it").

## 13. BUILD ORDER (follow strictly, verify at each gate)

1. Scaffold repo, docker-compose, DB schema/migrations, CI, env template.
2. Generate corpus with planted defects → ingestion pipeline → snapshots v1.0/v1.1 → PII/dedupe/error reports → index → retrieval API → retrieval evidence table. **Gate: ≥ 12 queries evaluated; no raw PII retrievable.**
3. Dialogue manager + Market Pack loader + Sentence Gate + tools → text-mode simulator with scripted scenarios. **Gate: red-team suite passes (no fabricated answers).**
4. Voice integration (LiveKit), ASR/TTS adapters, VAD/barge-in; record Q1 calls. **Gate: ≥ 3 calls, grounded, latency logged.**
5. PH and ID Market Packs, language router/lock, ASR/TTS benchmarking and accent test; record 4 calls. **Gate: no unexpected English fallback.**
6. Realtime pipeline, signals, Nudge Court, latency tracer, scenarios, labeling, chaos runs. **Gate: P50/P95 measured; noisy call suppressed.**
7. Wire everything to the frontend contracts; run Playwright flows; produce reports.
8. Final audit: secrets scan, README run-through on a clean machine, limitations doc, video script.

## 14. API AND EVENT CONTRACTS (must match frontend)

REST (`/api`): `GET /kb/records`, `GET /kb/records/{id}`, `GET /kb/versions`, `GET /kb/versions/{v}/diff`, `POST /retrieval/search`, `GET|PUT /retrieval/evidence`, `POST /calls/token`, `GET /calls`, `GET /calls/{id}`, `GET /trace/{trace_id}`, `POST /replay`, `GET /eval/summary`, `GET /asr/bench`, `POST /live/sessions`, `GET /live/{id}/nudges`.

WebSocket `/ws/live/{session_id}` events: `transcript.partial`, `transcript.final{speaker,text,t_start,t_end,asr_latency_ms}`, `signal{kind,confidence,span,t}`, `nudge.fired{id,priority,text,reason,confidence,expires_at,topic}`, `nudge.suppressed{id,reason,details}`, `latency.sample{stage,ms}`, `call.state`, `register.update{lang_mix,formality}`, `gate.event{turn_id,status,draft,final,citations}`.

Responses always include `trace_id`. Version every contract (`/api/v1`) and generate OpenAPI + TypeScript types for the frontend.

## 15. DEFINITION OF DONE

The work is done only when: a reviewer can call the agent, ask a question not in the KB and hear a safe, in-language refusal; click any bot sentence and see its source; watch a replayed call produce a compliance nudge and a missed-opportunity nudge within seconds while a noisy call produces none; read measured P50/P95 latencies; compare PH and ID bots and see localization (not translation); and read honest limitations. Finish with a self-audit listing every mocked component, every unverified provider claim, and every item that needs native-speaker or compliance review.
