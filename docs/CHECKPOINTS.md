# PARLEY — CHECKPOINTS

> A gated build plan. Do not start a phase until the previous gate is green. Tick boxes only when the evidence exists in the repository (file path, command output, or recording).
> Total window: 48 hours. Times are targets; gates are mandatory.

**Legend:** ☐ not started · ☑ done · 🔒 gate (blocking) · 🧪 evidence to capture · ✂ cut-first if behind

---

## PHASE 0 — Foundation (Hours 0–3)

- ☑ Repository created with layout from `ARCHITECTURE.md` and `CLAUDE.md`
- ☑ `.env.example` lists every variable; `.env` is git-ignored
- ☑ Secret-scanning pre-commit hook installed and tested with a fake key
- ☑ `docker-compose.yml` brings up Postgres(+pgvector), Redis, MinIO
- ☑ DB migrations create all tables from `ARCHITECTURE.md §5`
- ☑ CI runs lint, type-check, unit tests
- ☑ `docs/DECISIONS.md` started (first entries: voice platform, vector store, retrieval, grounding approach)
- ☑ Provider verification note: confirm current ASR/TTS/LLM language support for en-IN, en-PH, fil-PH, id-ID and record findings in `docs/ASR_TTS_REPORT.md`

🔒 **GATE 0 (PASSED):** `make up` starts all services; `make test` passes (14/14 tests green); `git log` / repo contains no secrets.

🧪 Evidence: `scripts/scan_secrets.py`, `tests/test_secret_scan.py`, `services/api/migrations/001_initial_schema.sql`, `.github/workflows/ci.yml`.

---

## PHASE 1 — Knowledge Base (Q2) (Hours 3–14)

### 1A. Corpus
- ☑ Fictional company corpus created in `kb/raw/` (website HTML, PDFs, DOCX, CSV, forms, FAQs, objection playbook, partnership page, nudge playbook)
- ☑ Planted defects documented in `kb/raw/PLANTED_DEFECTS.md`: nav/footer noise, repeated sections, 2 near-duplicates, grace-period conflict (15 vs 30 days), typo in rate table, mixed date formats, one scanned/unreadable PDF page, synthetic PII (names, phones, emails, policy numbers, ID numbers)
- ☑ Includes the exact sample record `kb_product_001 · Branch Partnership Benefits · partnership_benefits · website section · 1.0 · false`

### 1B. Pipeline
- ☑ Fetch/load + parse for each source type (`fetch_parse.py`)
- ☑ `extraction_health` computed; failed page quarantined with reason code (`LOW_HEALTH_OCR_GARBLE`)
- ☑ Boilerplate removal verified on sampled pages (`cleaner.py`)
- ☑ Normalization: dates to ISO-8601, terminology via `glossary.yaml`, form fields snake_case, categories via `taxonomy.yaml` (`normalizer.py`)
- ☑ Source-error detection flags every planted conflict/typo into `kb_issues` (`defect_detector.py`)
- ☑ Dedupe: exact + near-duplicate clusters with canonical choice (`dedupe.py`)
- ☑ PII detection, typed tokens, vault separation, `pii` flag set (`pii_shield.py`)
- ☑ Chunking per strategy; metadata populated (`chunker.py`)
- ☑ Embeddings + HNSW + full-text indexes built (`embed_index.py`)
- ☑ Snapshot `v1.0` (raw ingest) and `v1.1` (after fixes) with diff (`publisher.py`, `run_pipeline.py`)

### 1C. Retrieval
- ☑ Hybrid retrieval + rerank + threshold + `NO_MATCH` (`services/retrieval/retriever.py`)
- ☑ Citation builder outputs `[record_id@version · source display]`
- ☑ `retrieval_queries.yaml` with 19 queries (product, policy, qualification, FAQ, objection), 4 no-answer, 2 cross-lingual
- ☑ Evidence table generated with: question, retrieved chunk/record, source reference, relevance explanation, verdict (`data/evaluation/retrieval_evidence.md`)
- ☑ At least two initial failures diagnosed and fixed; before/after documented
- ☑ Metrics: recall@k (100.0%), MRR (0.868), refusal precision (100.0%)

🔒 **GATE 1 (PASSED):**
- ☑ ≥ 12 queries evaluated; ≥ 80% correct (19/19 queries evaluated; 100.0% accuracy); all failures explained
- ☑ All planted defects detected (report in `docs/KB_DESIGN.md`)
- ☑ `make pii-scan` reports 0 raw PII patterns in indexed chunks (`scripts/pii_scan.py` confirmed 0 leaks)
- ☑ Retrieval reachable through API (`POST /api/v1/retrieval/search` tested & passing)

🧪 Evidence: `data/evaluation/retrieval_evidence.md`, `kb/snapshots/v1.1/`, cleaning/dedupe/PII reports in `docs/KB_DESIGN.md`.

---

## PHASE 2 — Agent Core in Text Mode (Hours 14–24)

- ☐ Market Pack loader (`in_en`, `ph_tl`, `id_id` skeletons)
- ☐ Dialogue state machine and qualification rules in YAML with unit tests
- ☐ `retrieve_kb` tool wired to the same retrieval code as the API
- ☐ System prompt audited: **contains no FAQs, objections or policy facts** (automated test greps for a banned-fact list)
- ☐ Sentence Gate implemented: sentence typing, exact-match checks, entailment check, fail-closed behavior, persisted outcomes
- ☐ Fallback phrases per market in `fallbacks.yaml`
- ☐ Escalation triggers and `escalate_human` webhook
- ☐ `create_lead_or_update_crm` and `schedule_callback` tools
- ☐ Text simulator runs scripted scenarios: cooperative, objection, conflicting details, out-of-scope, human request, information-not-in-KB
- ☐ Red-team suite: unavailable rates, invented legal guarantees, prompt injection in user input, prompt injection inside KB text, request for another customer's PII

🔒 **GATE 2:**
- ☐ Red-team suite: 0 fabricated answers
- ☐ Information-not-in-KB scenario produces the unavailable-information fallback and a callback/human offer
- ☐ Every factual bot sentence in simulator logs has citations or was blocked
- ☐ Disposition accuracy ≥ 90% on scripted scenarios

🧪 Evidence: `data/evaluation/grounding_report.json`, simulator transcripts, gate logs including blocked drafts.

---

## PHASE 3 — Voice Q1 (Hours 24–30)

- ☐ LiveKit (or chosen platform) configured; `CallProvider` adapter in place
- ☐ ASR and TTS adapters for `in_en`; VAD/endpointing tuned
- ☐ Barge-in cancels in-flight TTS
- ☐ Browser calling page works (mic permission flow, mute, end, connection status)
- ☐ Latency spans recorded for each turn (VAD, ASR, retrieval, LLM, gate, TTS)
- ☐ Optional: PSTN number via SIP trunk ✂
- ☐ Recorded calls (≥ 3, target 6), each with audio, transcript (speaker-labeled, with citations), outcome JSON:
  - ☐ Cooperative customer
  - ☐ Objection
  - ☐ Incomplete or conflicting details
  - ☐ Out-of-scope question
  - ☐ Human-assistance request
  - ☐ Question whose answer is not in the KB (bot states unavailability)
- ☐ `data/calls/results.md` table: scenario, expected, actual, pass/fail, grounded %, fallbacks, median response latency

🔒 **GATE 3:**
- ☐ A person can open the web interface and complete a call end to end
- ☐ ≥ 3 recordings and transcripts committed (no real PII)
- ☐ Median user-stops → bot-audio latency measured and reported
- ☐ Grounded-sentence rate ≥ 95% on recorded calls

🧪 Evidence: `data/audio/`, `data/transcripts/`, `data/calls/results.md`, latency chart.

---

## PHASE 4 — Native-Language Bots Q3 (Hours 30–38)

### 4A. Philippines (`ph_tl`)
- ☐ Pack complete: persona (po/opo, sir/ma'am), glossary (premium, policy, beneficiary, rider, lapse, coverage, bank referral), fallbacks, disclosures, formats
- ☐ ASR: ≥ 2 providers tried; phrase boosting configured; code-switching behavior documented
- ☐ TTS: Filipino voice selected; SSML and loanword pronunciation overrides; compromises documented
- ☐ ≥ 5 localization examples (literal translation vs localized, with reason)
- ☐ 2 recorded calls covering: cooperative, sector-specific objection, mixed English finance terms, colloquial speech, human escalation

### 4B. Indonesia (`id_id`)
- ☐ Pack complete: Bapak/Ibu/Kak, formal vs colloquial rules, glossary (cicilan, tenor, denda, DP, jatuh tempo, angsuran, pembiayaan), fallbacks, collections-conduct rules (no threats, no third-party disclosure)
- ☐ ASR: ≥ 2 providers tried; numerals/amount parsing ("tiga juta lima ratus", "3,5 jt") tested
- ☐ Regional accent test set (≥ 3 minutes, provenance documented) vs standard Jakarta speech; errors catalogued
- ☐ TTS: Indonesian voice; SSML for amounts/dates; compromises documented
- ☐ ≥ 5 localization examples
- ☐ 2 recorded calls covering: cooperative, objection, mixed finance English, colloquial, human escalation, regional accent

### 4C. Shared
- ☐ Language Router outputs `lang_mix` and `formality` per turn
- ☐ Language Lock + drift detector implemented and run on all PH/ID transcripts
- ☐ `docs/ASR_TTS_REPORT.md`: provider/model, languages tested, code-switching behavior, approximate quality (with sample size), observed errors, accent performance, latency, cost, choice and rationale
- ☐ `docs/LOCALIZATION.md`: all examples, terminology, register rules, comparison between markets
- ☐ Known native-speaker and compliance gaps listed

🔒 **GATE 4:**
- ☐ 4 recorded calls (2 per market) + transcripts
- ☐ 0 unexpected English switches in fallback/escalation turns (drift report)
- ☐ Accent observations documented with numbers and caveats
- ☐ Fallback phrases verified in-language for both markets

🧪 Evidence: `data/calls/ph_*`, `data/calls/id_*`, drift report, ASR bench CSV.

---

## PHASE 5 — Live Insights Q4 (Hours 38–44)

### 5A. Streaming pipeline
- ☐ Audio source: live mic path and replay-at-1× path (100–250 ms chunks)
- ☐ Streaming ASR with partial/final results; stereo or diarization-based speaker lanes
- ☐ Rolling transcript buffer
- ☐ Tier-1 signals (rules/lexicon/embeddings) for all six signal families
- ☐ Tier-2 small-LLM classifier with strict JSON output and caching
- ☐ Compliance engine with disclosure checklist and stage timers
- ☐ Nudge generation from approved playbook; ≤ 18-word texts; exact wording for compliance nudges
- ☐ Delivery via WebSocket plus at least one other channel (webhook, polling or CLI)

### 5B. Nudge control
- ☐ Confidence thresholds per signal type
- ☐ Duplicate suppression
- ☐ Cooldowns and topic grouping
- ☐ Priority queue and expiry
- ☐ Rate limit and noisy-audio guard
- ☐ Fired and suppressed decisions persisted with reasons

### 5C. Measurement
- ☐ Timestamps captured at every stage (received, ASR partial/final, signal, LLM start/end, nudge created/sent, UI rendered)
- ☐ ≥ 100 nudge events per scenario (use loops or multiple replays)
- ☐ `docs/LATENCY_REPORT.md`: P50/P95/P99 for ASR, signal extraction, LLM, delivery, end to end; histogram; budget comparison
- ☐ Four scenarios recorded and hand-labeled: missed cross-sell, skipped disclosure/risky statement, rising frustration, noisy/ambiguous
- ☐ Precision, recall, false-positive rate per signal; nudges per minute; suppressed vs fired
- ☐ Chaos runs: SNR 20/10/5 dB, 1.15× speed, code-switch inserts ✂
- ☐ `docs/REALTIME_NUDGES.md` includes limitations at 10× scale and with noisy audio

🔒 **GATE 5:**
- ☐ Replay produces a compliance nudge and a missed-opportunity nudge **during** the call, within seconds
- ☐ Noisy/ambiguous scenario produces 0–1 low-value nudges
- ☐ P50/P95 measured and published
- ☐ Live demo recorded (screen + audio)

🧪 Evidence: nudge logs (fired + suppressed), latency histograms, labeled confusion tables, demo recording.

---

## PHASE 6 — Integration, Documentation, Submission (Hours 44–48)

### 6A. UI wiring
- ☐ Frontend connected to live API/WebSocket (`VITE_API_MODE=live`); mock banner shown otherwise
- ☐ Required pages working: Mission Control, KB Studio, Retrieval Lab, Voice Agent, Live Nudge Cockpit, Call Library, Evaluation
- ☐ Receipt drawer opens from any citation chip
- ☐ Playwright smoke tests pass for: test call, retrieval test, live nudge replay
- ☐ Nice-to-have pages: Market Packs, ASR Bench, Black Box, Architecture, Gaps, Demo Mode ✂

### 6B. Documentation
- ☐ `README.md` with setup, run commands, sample inputs, results summary
- ☐ `docs/ARCHITECTURE.md` with exported diagrams
- ☐ `docs/DECISIONS.md` complete (what / why / rejected)
- ☐ `docs/EVAL_REPORT.md` and `data/evaluation/*.json`
- ☐ `docs/LIMITATIONS_AND_PRODUCTION_PLAN.md`
- ☐ `docs/EXPLAIN_IT.md` (30 hardest reviewer questions with answers)
- ☐ `docs/VIDEO_SCRIPT.md`

### 6C. Submission audit
- ☐ Clean-machine test: clone, copy `.env.example`, run documented commands successfully
- ☐ Secret scan on full git history: clean
- ☐ No real customer data anywhere; synthetic data labeled
- ☐ Mocked components and unverified provider claims listed in README
- ☐ Video recorded (order below) and linked

🔒 **GATE 6 (submission):** all items above ticked; rejection-condition audit below passes.

---

## VIDEO WALKTHROUGH CHECKLIST (required content, in this order)

1. ☐ System overview and live demonstration
2. ☐ Architecture and key design decisions
3. ☐ Knowledge-base/retrieval design and voice-agent flow (show a cited answer and a refusal)
4. ☐ Multilingual handling (PH Taglish and ID colloquial/accent) and live nudge generation (compliance + missed opportunity + suppressed noisy example)
5. ☐ Error/fallback cases, limitations, production improvements

Recommended length 8–12 minutes; rehearse once; keep the Demo Mode stepper handy.

---

## REJECTION-CONDITION AUDIT (final check)

| Condition | Verification question | Pass |
|---|---|---|
| No working prototype / missing deliverables | Can a reviewer call the agent, browse the KB, hear PH/ID bots, and watch live nudges? | ☐ |
| Copied work not explainable | Can I explain every module and decision without notes? Is `EXPLAIN_IT.md` rehearsed? | ☐ |
| Disconnected KB and voice bot | Does a spoken sentence show a citation that resolves to a KB record? | ☐ |
| Hallucinated answers | Did the "not in KB" call and red-team suite pass with zero fabrication? | ☐ |
| Unmeasured latency | Are P50/P95 numbers published for both voice and nudges? | ☐ |
| Literal translation | Are there ≥ 3 (target 5) localization examples per market plus accent tests and in-language fallbacks? | ☐ |
| Nudges only after the call | Does the recording show nudges appearing mid-call? | ☐ |
| Excessive low-value alerts | Does the noisy call show suppression with reasons? | ☐ |

---

## DAILY CHECK-IN TEMPLATE

```
Time: __   Phase: __
Done since last check-in:
Blocked by:
Next gate and ETA:
Risks (provider, time, quality):
Cut decisions made (✂ items):
```

## CUT ORDER IF BEHIND SCHEDULE

1. Chaos Console UI
2. Knowledge Time Machine UI
3. Black Box page and interactive architecture
4. Extra scenarios and second regional accent
5. PSTN number

**Never cut:** Sentence Gate, `NO_MATCH` path, citations, latency measurement, nudge suppression, required recorded calls, documentation of limitations.
