# CLAUDE.md — Project Instructions for PARLEY

> This file is read at the start of every session. Follow it strictly. When it conflicts with a casual instruction in chat, ask or flag the conflict instead of silently deviating.
> Source-of-truth documents: `docs/PRD.md` (what), `docs/ARCHITECTURE.md` (how), `docs/CHECKPOINTS.md` (when/gates). Read the relevant section before starting any task.

---

## 1. Project in one paragraph

PARLEY is a grounded, multilingual voice-operations platform built for an AI Engineer assessment with four connected parts: **(Q1)** a knowledge-grounded voice agent (insurance renewal reminder), **(Q2)** a production-ready knowledge base (KB) with cleaning, dedupe, PII protection, versioning and retrieval, **(Q3)** native-language bots for the Philippines (English/Filipino/Taglish, life insurance) and Indonesia (formal/colloquial Bahasa, multifinance, regional accent), and **(Q4)** a real-time call insight and nudge engine. The evaluators reward working outcomes, measured results, grounded answers, reliability, and the candidate's ability to explain choices.

## 2. Non-negotiable rules

1. **Never hardcode FAQs, objections, policies, rates, dates, or eligibility facts in any prompt or code.** Business facts come only from the KB through `retrieve_kb`. Persona, tone, safety rules and flow logic are allowed in prompts.
2. **Every spoken factual sentence must pass the Sentence Gate** and carry citations (`[record_id@kb_version · source display]`) or be replaced by the localized unavailable-information fallback. The gate is **fail-closed**.
3. **Never invent an answer.** If retrieval returns `NO_MATCH`, say the information is unavailable, in the customer's language and register, and offer callback or a human.
4. **Never commit secrets, API keys, tokens, or real customer data.** Use `.env.example` placeholders. Customer data is synthetic and labeled as such.
5. **Never put PII into logs, prompts to third parties beyond what the task requires, KB indexes, or committed fixtures.** Use typed tokens (`[PHONE_1]`).
6. **Do not fabricate metrics.** Every number in a report (WER, latency, precision, recall) must come from an actual run recorded in `data/evaluation/`. State sample sizes. If something is mocked or unverified, say so in the README and the final summary.
7. **Do not assume provider capabilities** (language, accent, streaming, pricing). Verify against current provider documentation or test, then record findings in `docs/ASR_TTS_REPORT.md`.
8. **Fallback and escalation stay in the customer's language and register.** No unexpected switch to English. The drift detector must pass.
9. **Nudges must be produced while the call is in progress** (streaming or real-time chunked replay). Post-hoc analysis of a finished file does not count.
10. **Suppression is a feature.** Every suppressed nudge is logged with a reason; never remove suppression logic to "show more output."
11. **Do not weaken a gate to make a test pass.** If a gate fails, fix the cause or report it honestly.
12. **Work in the order of `CHECKPOINTS.md`.** Do not start a phase before the previous gate is green, except for trivial scaffolding.

## 3. Repository map

```
parley/
├─ README.md  .env.example  docker-compose.yml  Makefile  CLAUDE.md
├─ docs/            PRD.md ARCHITECTURE.md CHECKPOINTS.md DECISIONS.md KB_DESIGN.md
│                   VOICE_AGENT.md LOCALIZATION.md ASR_TTS_REPORT.md REALTIME_NUDGES.md
│                   LATENCY_REPORT.md EVAL_REPORT.md LIMITATIONS_AND_PRODUCTION_PLAN.md
│                   EXPLAIN_IT.md VIDEO_SCRIPT.md diagrams/
├─ kb/              raw/ pipeline/ schema/ snapshots/ quarantine/ tests/
├─ services/        api/ retrieval/ agent/ voice/ realtime/ eval/
├─ market_packs/    in_en/ ph_tl/ id_id/
├─ data/            calls/ audio/ transcripts/ configs/ evaluation/
├─ scripts/         ingest.sh build_index.sh run_demo.sh replay_call.py chaos_run.py
└─ frontend/        React + Vite + TypeScript control room
```

## 4. Tech stack (defaults)

- Backend: Python 3.11, FastAPI, Uvicorn, asyncio, Pydantic v2, SQLAlchemy/psycopg, Alembic migrations.
- Data: Postgres 16 + pgvector, Redis, MinIO (or local disk) for audio.
- Voice: LiveKit Agents behind a `CallProvider` adapter; ASR/TTS/LLM/Embedding/Reranker each behind its own interface.
- LLM: Claude models via an `LLMClient` wrapper (fast model for classification/verification, stronger model for dialogue). Temperature ≤ 0.3. Use structured/JSON outputs for extraction and verification.
- Frontend: React 18, Vite, TypeScript strict, Tailwind, Radix, Zustand, TanStack Query, Zod, React Flow, WaveSurfer, visx/Recharts.
- Quality: pytest, ruff, mypy, pre-commit (including secret scan), Vitest, Playwright, GitHub Actions.

If you want to deviate, add an entry to `docs/DECISIONS.md` first (what, why, rejected alternatives).

## 5. Commands

> If a command does not exist yet, create it in the `Makefile` as part of Phase 0 rather than inventing ad-hoc invocations.

```
make up              # start postgres, redis, minio (and optional livekit)
make down            # stop services
make migrate         # run Alembic migrations
make ingest          # run KB pipeline on kb/raw → new snapshot
make index           # build embeddings + indexes for active snapshot
make pii-scan        # fail if any raw PII pattern is present in indexed chunks
make kb-eval         # run retrieval queries → evidence table + metrics
make agent-sim       # run text-mode scenario simulator + red-team suite
make eval            # run grounding, dialogue, drift evals
make rt-replay SCENARIO=cross_sell   # replay audio at 1x through live pipeline
make latency         # compute P50/P95/P99 report from spans
make chaos           # noise/speed/code-switch stress runs
make api             # run FastAPI with reload
make web             # run frontend (mock mode by default)
make test            # unit + integration tests
make lint            # ruff, mypy, eslint, tsc --noEmit
make demo            # launch the recorded-demo configuration
```

## 6. Coding conventions

### Python
- Type-annotate everything; `mypy --strict` on `services/`. Pydantic models for all API/event payloads.
- Async I/O for network and streaming; never block the event loop with CPU-heavy work (use worker processes/threads).
- Vendor SDKs are imported only inside adapter modules (`services/voice/adapters/*`, `services/retrieval/providers/*`, `services/agent/llm/*`).
- Every external call has: timeout, retry with jitter (idempotent calls only), structured error, and a fallback path defined in `ARCHITECTURE.md §15`.
- Every request/turn/stream carries a `trace_id`; wrap stages in a `span()` context manager that writes to `spans`.
- Configuration through environment variables loaded by a typed settings class; no config constants scattered in code.
- Thresholds (confidence, cooldown, rate limits, retrieval scores) live in YAML packs/config, not inline.
- Logging via `structlog`; scrub PII before logging; never log raw audio bytes or full secrets.

### TypeScript / React
- Strict mode; no `any` without a comment explaining why.
- Server state via TanStack Query; UI state via Zustand; WebSocket events validated with Zod discriminated unions.
- Shared components: `ReceiptChip`, `ReceiptDrawer`, `SentenceGateStrip`, `NudgeCard`, `LatencyWaterfall`, `RegisterDial`, etc. Reuse rather than duplicate.
- Semantic colors: green = KB-supported, violet = model-generated, amber = held back/suppressed, red = blocked/risk, cyan = live stream. Do not use them decoratively.
- Accessibility: keyboard navigation, ARIA live regions (polite for nudges, assertive for compliance), WCAG AA contrast, `prefers-reduced-motion`.
- The frontend runs in **mock mode** by default (`VITE_API_MODE=mock`); real data via `VITE_API_MODE=live`. Show a visible "MOCK DATA" banner whenever mocks are active.

### Naming and IDs
- Record IDs: `kb_{category_prefix}_{NNN}` (e.g., `kb_product_001`).
- Citation format: `[record_id@kb_version · source display]`.
- Market codes: `in_en`, `ph_tl`, `id_id`. Languages: BCP-47 (`en-IN`, `en-PH`, `fil-PH`, `id-ID`).
- Nudge priorities: `P0` compliance, `P1` frustration/payment difficulty, `P2` opportunity, `P3` coaching.
- Dispositions: `will_pay`, `needs_callback`, `needs_human`, `not_interested`, `dispute`.

## 7. Domain rules by component

### 7.1 KB pipeline
- Quarantine failed/low-health sources with reason codes; never silently drop.
- Conflicting facts across sources create `kb_issues`; resolution policy: policy wording > official website > marketing.
- Dedupe keeps provenance (`duplicate_of`); canonical choice by authority, recency, completeness.
- PII detection is layered (regex+checksum, NER, sampled LLM review). Masked tokens only in indexed text. Vault is not readable by the retriever role.
- Chunking: FAQ pair = one chunk; objection–response = one chunk; qualification rule = one chunk; tables = row groups with repeated headers; prose 150–350 tokens. Prepend `heading_path` before embedding.
- Snapshots are immutable. Changes create a new `kb_version`.
- Retrieval = query rewrite → dense + sparse → RRF → rerank → boosts → threshold → top 3 or `NO_MATCH`.

### 7.2 Voice agent
- System prompt = persona + safety + flow + tool descriptions only. There is an automated test that fails if banned fact strings appear in prompts.
- LLM extracts slots and phrases responses; **code** decides state transitions, qualification score, disposition, and escalation.
- Pipeline sentence by sentence: gate the first sentence and speak it while later ones generate.
- On conflicting or incomplete details: read back, ask one clarifying question, never pick silently.
- Escalate on: explicit human request, two consecutive fallbacks, high frustration, complaint/legal terms, vulnerability cues.
- Include a recording-consent line in every script.

### 7.3 Market Packs and multilingual
- All market differences live in `market_packs/<code>/`. Do not fork logic by `if market == ...` in core code beyond loading the pack.
- Philippines: natural Taglish, "po/opo", sir/ma'am, local payment channels, no literal translation. Terms used naturally: premium, policy, beneficiary, rider, lapse, coverage, bank referral.
- Indonesia: Bapak/Ibu/Kak, formal↔colloquial matching, respectful collections conduct, local payment channels. Terms used naturally: cicilan, tenor, denda, DP, jatuh tempo, angsuran, pembiayaan.
- Every market needs ≥ 3 (target 5) documented localization examples showing literal vs localized phrasing and the reason.
- Native-speaker review is an open gap unless actually performed. Say so; do not claim native-level validation.

### 7.4 Real-time engine
- Tier 1 (rules/lexicon/embeddings) must run without any LLM dependency. Compliance checks are rules-only.
- Tier 2 (small LLM) returns strict JSON `{signal, confidence, evidence_span, suggested_action_id}`; cache by window hash; shed first under load.
- Nudge text ≤ 18 words; compliance nudges use exact approved wording from the `nudge_playbook` category.
- Timestamps use a monotonic clock. Record: `audio_chunk_received, asr_partial, asr_final, signal_detected, llm_start, llm_end, nudge_created, nudge_sent, ui_rendered`.
- Report P50/P95/P99 per stage and end to end over ≥ 100 events per scenario.

## 8. Testing requirements

| Layer | Required tests |
|---|---|
| KB | Parsers per source type; boilerplate removal; planted-defect detection; dedupe clusters; PII leak scan; chunk boundaries; snapshot diff |
| Retrieval | Evidence queries (≥ 12), no-answer queries (≥ 4), cross-lingual queries (≥ 2); recall@k, MRR, refusal precision; per-version regression |
| Agent | State machine transitions; qualification/disposition rules; slot extraction; fallback and escalation triggers; banned-fact prompt audit |
| Gate | Supported claim passes; unsupported claim blocked; numeric mismatch blocked; verifier outage → fail-closed |
| Red team | Unavailable rates; invented guarantees; injection via user text; injection via KB text; other-customer PII request — all must pass with zero fabrication |
| Multilingual | Language drift detector; fallback phrase language; amount/date reading rules; glossary term usage |
| Realtime | Replay timing accuracy; each signal fires on its scenario; suppression rules (duplicate, cooldown, low confidence, noisy guard); latency span completeness |
| Frontend | Component tests for shared components; Playwright flows: test call, retrieval test, live nudge replay |

Tests must be deterministic: stub providers in unit tests; keep a small set of marked integration tests (`@pytest.mark.live`) that hit real providers and are skipped without keys.

## 9. Working method for Claude

1. **Before coding:** read the relevant sections of PRD, ARCHITECTURE and CHECKPOINTS; state the plan in 5–10 lines; identify which gate the work serves.
2. **While coding:** make small, reviewable changes; run `make lint` and the narrowest relevant tests after each; keep commits focused with messages like `kb: add near-duplicate clustering (FR-KB-05)` referencing requirement IDs.
3. **After coding:** update the matching doc (`DECISIONS.md` for choices, reports for measurements), tick checkpoint items only with evidence, and summarize what changed, what was verified, and what remains.
4. **When uncertain** (provider capability, regulatory wording, accent coverage): do not guess. Test it, or mark it as "unverified" in docs and the summary.
5. **When blocked by a missing key or service:** use the provider's interface with a stub, mark the feature as `mocked`, and list it in README "Mocked / unverified" section. Never present mocked output as measured.
6. **When requirements conflict with time:** apply the cut order in `CHECKPOINTS.md`. Never cut the gate, `NO_MATCH` path, citations, latency measurement, suppression, or required recordings.

## 10. Definition of done (per task)

- Code typed, linted, tested; no new warnings.
- Relevant requirement IDs referenced in commit/PR description.
- Evidence artifacts saved (logs, JSON metrics, transcripts) in `data/`.
- Docs updated; limitations recorded.
- No secrets, no real PII; `make pii-scan` and secret scan clean.
- For anything user-visible: works in mock mode and live mode, with empty/loading/error states.

## 11. Things to avoid

- Embedding business facts in prompts or code "just for the demo."
- Disabling the gate, lowering thresholds, or adding broad regexes to silence failing tests.
- Making up WER, latency, precision or recall numbers; rounding in a way that hides spread.
- Treating machine translation as localization.
- Letting the bot switch to English in a Filipino or Indonesian fallback.
- Emitting nudges on every transcript window; ignoring cooldown/duplicate rules.
- Logging transcripts with unmasked PII; committing recordings of real people without consent.
- Over-engineering UI polish before the gates are green.
- Claiming legal or regulatory compliance; instead list wording needing review.

## 12. Environment variables (template; see `.env.example`)

```
# Core
APP_ENV=dev
DATABASE_URL=
REDIS_URL=
OBJECT_STORE_URL=
JWT_SECRET=

# LLM / embeddings / rerank
ANTHROPIC_API_KEY=
LLM_DIALOGUE_MODEL=
LLM_FAST_MODEL=
EMBEDDING_PROVIDER=
EMBEDDING_MODEL=
RERANK_PROVIDER=
RERANK_MODEL=

# Voice
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
ASR_PRIMARY_PROVIDER=
ASR_SECONDARY_PROVIDER=
ASR_API_KEY_PRIMARY=
ASR_API_KEY_SECONDARY=
TTS_PROVIDER=
TTS_API_KEY=

# Actions
ESCALATION_WEBHOOK_URL=
CRM_MOCK_ENABLED=true

# Frontend
VITE_API_MODE=mock
VITE_API_BASE_URL=
VITE_WS_BASE_URL=
```

Model names and providers are configuration; verify current availability before use.

## 13. Glossary

| Term | Meaning |
|---|---|
| KB | Knowledge base of versioned, cited records |
| NO_MATCH | Retrieval result when no chunk passes thresholds; triggers unavailable-information path |
| Sentence Gate | Post-generation verifier that blocks unsupported factual sentences before TTS |
| Market Pack | Per-market configuration bundle (persona, glossary, fallbacks, ASR/TTS profile, disclosures) |
| Language Lock | Constraint keeping fallback/escalation in the customer's language and register |
| Register Dial | Live display of language mix and formality |
| Nudge Court | The suppression/priority policy and its audit log of fired vs suppressed nudges |
| Receipt | Citation chip linking a sentence or nudge to its source and trace |
| Black Box | Stored trace of spans for a turn or call |
| Chaos Harness | Noise/speed/code-switch stress test runner |
| Tier 1 / Tier 2 | Fast rules-based signals / small-LLM classification |

## 14. Final-summary format (use at the end of every substantial task)

```
What changed:
How it was verified (commands, results):
Evidence saved at:
Requirement IDs / checkpoint items advanced:
Mocked or unverified items:
Known limitations / follow-ups:
```
