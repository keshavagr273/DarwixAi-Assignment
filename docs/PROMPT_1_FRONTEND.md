# PROMPT 1 — FRONTEND MASTER PROMPT: "PARLEY" CONTROL ROOM

> Paste everything below the line into your AI coding tool (Claude Code / Cursor / etc.).
> Pair it with PROMPT 2 (development) so the contracts (API + WebSocket events) match.

---

## 0. ROLE AND MISSION

You are a senior product engineer and design-systems lead. Build the complete frontend for **PARLEY**, a "control room" for grounded, multilingual financial voice agents. It is the single web surface for an AI Engineer assessment with four connected deliverables:

1. A knowledge-grounded voice agent (insurance renewal / premium-due reminder).
2. A production-ready, traceable knowledge base (KB) the agent retrieves from.
3. Native-language voice bots for the Philippines (English / Filipino / Taglish, life insurance) and Indonesia (formal + colloquial Bahasa, multifinance, regional accent).
4. A real-time call-insights and nudge engine that works while the call is live.

The frontend must make the **evidence graders look for** instantly visible: grounded answers with citations, safe fallbacks, measured latency, localization (not translation), and suppressed low-value nudges. Reliability and legibility beat decoration. Every screen must work against **mock fixtures** (so it runs with no backend) and switch to the **live API** with one env flag.

Do not ask me questions. Make decisions, note assumptions in `docs/FRONTEND_DECISIONS.md`, and build.

## 1. THE IDEA THAT MAKES THIS DIFFERENT (design thesis)

Most submissions will be a chat widget plus a dashboard. PARLEY is designed like an **air-traffic-control + broadcast-mixing-console** hybrid, built around one principle: **"Every claim has a receipt."**

Signature UI mechanisms (all are required, they are the differentiators):

1. **Grounding Receipts.** Every bot sentence in any transcript is rendered as a clickable unit with a small receipt chip showing `kb_policy_014 · v1.3 · 0.87`. Clicking opens a side drawer with the exact source chunk, the original source (URL / PDF page), and the retrieval score breakdown. A sentence with no support renders with a hatched "UNSUPPORTED" marker (this should only appear in demos of the safety gate failing, and in the red-team view).
2. **Sentence Gate Visualizer.** A tiny pipeline strip under each bot turn: `Draft → Verified → Spoken` or `Draft → Blocked → Fallback`. Blocked drafts are viewable (struck through) so a reviewer sees what the model *wanted* to say and why it was stopped.
3. **"I Don't Know" Ledger.** Refusals/fallbacks are treated as a first-class success metric, not an error. A dedicated panel lists every question the bot declined to invent an answer for, with the reason (`no_kb_match`, `low_confidence`, `out_of_scope`, `needs_human`).
4. **Register Dial + Language Lock.** For PH/ID bots, a live dial shows the conversation's current language mix (e.g. EN 22 / TL 61 / Taglish bridge 17) and politeness register (formal ↔ colloquial). A "Language Lock" badge turns amber if the bot drifts into unexpected English.
5. **Nudge Court.** The live nudge cockpit shows nudges that **fired** *and* nudges that were **suppressed**, with the verdict reason (`duplicate`, `cooldown 20s`, `below confidence 0.62`, `expired`, `grouped under topic: payment_difficulty`). Suppression is the proof of false-positive control, so it must be loud and beautiful, not hidden.
6. **Knowledge Time Machine.** The KB has a version scrubber (timeline slider). Dragging it shows records appear/disappear/change and re-runs saved retrieval tests against that version, showing regressions in red.
7. **Chaos Console.** Sliders to inject noise (SNR), accent profile, and code-switch intensity into a replayed call to see how ASR confidence, nudges, and false positives change.
8. **Call Black Box.** One `trace_id` opens a flight-recorder timeline across ASR → retrieval → LLM → gate → TTS with millisecond waterfalls.

## 2. TECH STACK (fixed)

- React 18 + Vite + TypeScript (strict). React Router v6 (data routers).
- Tailwind CSS with CSS variables for theme tokens; `class-variance-authority` for variants; headless primitives from Radix UI.
- State: Zustand for UI/session state; TanStack Query for server state.
- Charts: visx or Recharts for latency histograms/waterfalls; custom SVG for the Register Dial and nudge timeline.
- Audio: WaveSurfer.js for recorded playback + a custom `<canvas>` live waveform using Web Audio `AnalyserNode`.
- Calling interface: LiveKit client SDK (web) behind an adapter interface `CallProvider` (so Vapi/Retell/Twilio could be swapped); include a `MockCallProvider` that replays scripted audio+events.
- Realtime: native WebSocket wrapper with auto-reconnect, backoff, heartbeat, and event schema validation using Zod.
- Mock layer: MSW (REST) + a `MockSocket` that emits recorded event streams at real-time pace.
- Testing: Vitest + React Testing Library + Playwright smoke tests for the three critical flows (test call, retrieval test, live nudge replay).
- Lint/format: ESLint, Prettier, `tsc --noEmit` in CI script. Env template `.env.example` (no secrets).

## 3. VISUAL IDENTITY

Name: **PARLEY**. Tone: calm, precise, operational: "a control room you trust at 2 a.m."

- Theme: dark-first with a true light mode. Respect `prefers-color-scheme` and `prefers-reduced-motion`.
- Palette (tokens): `--bg #0B0F14`, `--panel #121821`, `--panel-2 #18212D`, `--line #243041`, `--text #E6EDF5`, `--muted #8A97A8`, `--signal-green #3DDC97` (grounded/verified), `--signal-amber #FFB547` (caution/suppressed), `--signal-red #FF5C6C` (blocked/compliance), `--signal-cyan #4CC9F0` (live/streaming), `--signal-violet #A78BFA` (LLM/AI-generated).
- Semantic color rule: **green = backed by KB, violet = model-generated, amber = held back, red = blocked/risk, cyan = live stream.** Never use these colors decoratively.
- Typography: "Space Grotesk" (headings), "Inter" (UI), "JetBrains Mono" (IDs, latencies, citations). Load Indonesian/Filipino diacritics correctly; test with `ñ`, `Ñg`, `é`.
- Motion: purposeful only: waveform, streaming-text caret, nudge slide-in with expiry countdown ring, receipt chip "stamp" animation. All disabled under reduced motion.
- Density: compact "pro tool" density, 13px base, 8px grid, keyboard-first. Command palette (`Cmd/Ctrl+K`) for jumping between pages, trace ids, and KB records.
- Empty/loading/error states designed for every panel (skeletons, "no data yet" with the next action).

## 4. APP SHELL

- Left rail (icon + label, collapsible): Mission Control, KB Studio, Retrieval Lab, Voice Agent, Market Packs, ASR Bench, Live Nudge Cockpit, Call Library, Evaluation, Architecture, Gaps & Compliance, Demo Mode.
- Top bar: environment pill (`MOCK` / `LIVE`), active KB version selector, active market (IN / PH / ID), global search, system health dots (ASR, LLM, TTS, KB, WS) with last latency.
- Global right-side **Receipt Drawer** (shared component) that opens from any citation chip anywhere in the app.
- Global toast + incident banner when a provider is degraded (shows the active fallback provider).

## 5. PAGES — DETAILED SPECIFICATION

### 5.1 Mission Control (`/`)
Purpose: 30-second proof that the whole system works.
- Four "deliverable cards" (Q1 Voice Agent, Q2 Knowledge Base, Q3 Native-Language Bots, Q4 Live Nudges), each with: status, last test result, key metric (e.g., "Grounded answer rate 96%", "KB records 412 · PII-masked 100%", "P95 end-to-end 2.1s", "Nudge precision 0.81"), and a "Open" and "Run demo" button.
- Live system strip: p50/p95 latency sparkline for ASR, retrieval, LLM, TTS.
- "Today's refusals": top 5 "I don't know" events with reasons.
- A one-click **"Run the full story"** button that launches Demo Mode (see 5.12).

### 5.2 KB Studio (`/kb`) — Question 2 workbench
Tabs:
1. **Sources**: table of ingested sources (website sections, PDFs, forms, tables, policy docs, marketing pages) with type, URL/path, fetch status, parse method, extraction health score, and flags (`extraction_failed`, `source_error`, `duplicate_of`).
2. **Pipeline**: horizontal stepper visualizing stages: Fetch → Parse → Boilerplate strip → Normalize → Dedupe → PII shield → Chunk → Embed/Index → Publish. Each stage shows counts in/out and a "view diff" drill-down.
3. **Cleaning Diff**: side-by-side raw vs cleaned for any source. Highlight removed nav/headers/footers/repeats (strike in amber), standardized terms (blue underline with before→after tooltip), standardized dates, and flagged obvious source errors (red marker with explanation, e.g., "Grace period says 15 days here and 30 days in policy PDF").
4. **Dedupe Clusters**: cards per near-duplicate cluster with similarity %, canonical record chosen, reason for choosing it, and "split / merge" override.
5. **PII Shield**: shows detected entities by type (name, phone, email, policy number, Aadhaar/PAN-like, NIK, TIN, address) with masked tokens like `[PHONE_1]`, detection method (regex / NER / checksum), confidence, and a "reveal in sandbox" toggle disabled by default. Records flagged `pii: true/false`. Include a "PII leak test" panel proving no raw PII appears in any retrievable chunk.
6. **Records**: searchable, filterable table following the required schema: `record_id, title, content, category, source, version, pii` plus extra columns `lang, market, valid_from, valid_to, supersedes, content_hash, chunk_index, parent_doc_id, confidence`. Row click opens a full record view with a **lineage graph** (source → parse → clean → chunk → embed) rendered as a small DAG.
7. **Taxonomy**: interactive tree of product / policy / FAQ / objection / qualification-rule categories with record counts; click filters Records.
8. **Schema**: formatted schema doc + 5 real sample records (include the `kb_product_001 Branch Partnership Benefits` example exactly as the assignment shows).
9. **Time Machine**: version timeline (v1.0, v1.1, …) with diff (added/changed/removed records) and "re-run retrieval regression on this version" button; show pass/fail delta.

### 5.3 Retrieval Lab (`/retrieval`) — Question 2 evidence
- Query box with market/language selector, "mode" toggle (Dense / Sparse / Hybrid / Hybrid + Rerank) to **show retrieval-logic differences live**.
- Result list: rank, record title, chunk text with query-term highlights, source reference (link/PDF page), score breakdown bars (dense, BM25, rerank, recency/version boost), and the final citation string.
- **Evidence Table** (exportable to Markdown/CSV) with columns exactly as the assignment requires: user question, retrieved chunk/record, source reference, relevance explanation, verdict (correct / partially correct / incorrect). Pre-load at least 12 queries covering: product, policy, qualification, FAQ, objection; include 2 deliberate failures (partially correct / incorrect) and show how they were diagnosed and fixed. A "verdict" pill is editable by the human reviewer.
- "No-answer" test queries that must return the *unavailable* path, shown with a green "Correctly refused" badge.
- Compare view: same query across KB versions.

### 5.4 Voice Agent (`/agent`) — Question 1
Tabs:
1. **Configuration**: provider/model for ASR, LLM, TTS, VAD; script; business rules (editable form + read-only JSON); KB connection status with index version; tool list (retrieve_kb, create_lead, schedule_callback, escalate_human).
2. **Flow Designer**: node-based read-only-by-default canvas (React Flow) showing: Greeting & Identity Check → Purpose → Qualification → Objection Handling (RAG) → Unsupported-Question Fallback → Human Escalation → Close/Business Action. Click a node to see prompt fragment, tools, guardrails, and the exact fallback phrase.
3. **Test Call**: browser calling widget (mic permission flow, mute, end, push-to-talk fallback, connection quality indicator) + live transcript with Grounding Receipts, Sentence Gate strips, qualification checklist filling in live (✓ intent, ✓ policy status, ✓ due date, ✓ payment preference), and a live "extracted fields" JSON panel.
4. **Business Action**: shows the optional action result (mock CRM lead card, callback scheduled slot, escalation webhook payload with delivery status).
5. **Test Matrix**: required coverage as a checklist table — cooperative customer, objection, incomplete/conflicting details, out-of-scope, human-assistance request — each linked to a recorded call, transcript, pass/fail, and notes. Add a **mandatory "unavailable information" test** row.

### 5.5 Market Packs (`/markets`) — Question 3 localization
- Switcher: IN (renewal, English), PH (life insurance), ID (multifinance).
- **Localization Workbench**: three-pane view (Neutral intent → English literal → Localized final) so reviewers can see that adaptation ≠ translation. Include ≥ 5 examples per market (assignment requires 3), annotated with *why* (politeness particle, honorific, date/amount format, payment channel, cultural softener). Examples: PH "po/opo", "ma'am/sir", Taglish bridging, GCash/bank referral; ID "Bapak/Ibu", "Kak", "cicilan / angsuran / jatuh tempo / denda / DP / tenor / pembiayaan", payday timing ("tanggal gajian"), Indomaret/transfer/virtual account.
- **Terminology Glossary**: searchable table (term, market, register, definition, do-not-translate flag, example sentence).
- **Register Dial** panel (see §1) with historical language-mix chart per call.
- **Fallback Sheet**: per-language fallback and escalation phrases, proving fallback stays in the customer's language and register (show a "language drift detector" result per test call).
- **Native-Speaker/Compliance Gaps** list per market (open items, severity, owner), such as OJK / IC / IRDAI-style disclosure wording that needs legal review.

### 5.6 ASR Bench (`/asr`) — Question 3 requirement
- Per market: provider/model, languages tested, code-switching behavior, approximate quality (WER/CER estimate on a labeled mini-set, clearly labeled "approximate, n=…"), observed error patterns (named entities, numerals, loanwords, finance terms), and **Indonesia regional-accent performance** (e.g., Javanese-, Sundanese-, or Batak-accented Indonesian vs. standard Jakarta).
- Interactive chart: WER by accent × noise level. Clicking a bar shows example reference vs. hypothesis with a word-level diff (insert/delete/substitute colored).
- Provider comparison table (latency, cost per hour estimate, streaming support, code-switch handling, verdict).
- "Compromises" box documenting TTS voice limitations (e.g., Filipino voice reads English finance terms with an Indonesian-like or flat prosody; what was done about it).

### 5.7 Live Nudge Cockpit (`/live`) — Question 4 (hero screen)
Layout (3 columns + bottom dock):
- **Left — Audio & Transcript**: stream source selector (Live mic / Replay file at 1× / Replay with Chaos), live waveform, streaming transcript with agent/customer lanes, per-chunk ASR latency badge, interim vs final text styling.
- **Center — Signal Timeline**: horizontal timeline with swim-lanes: intent/topic shifts, compliance/risk, sentiment/frustration (line chart), buying signals, missed opportunities, callback needs. Events appear in real time with confidence values.
- **Right — Nudge Stack**: prioritized cards. Each: priority (P0–P3), short imperative text (≤ 18 words), reason, confidence, expiry countdown ring, "Accept / Dismiss / Snooze" (feedback is logged for precision tracking). Pinned compliance nudges stay until acknowledged.
- **Nudge Court drawer**: tab "Suppressed" with reasons and counts (`duplicate`, `cooldown`, `low_confidence`, `topic_grouped`, `expired`, `noisy_audio_guard`). Show a running "Nudges avoided: N" counter.
- **Bottom dock — Latency Waterfall**: for the latest nudge, a stacked horizontal bar: audio chunk → ASR → signal extraction → LLM → delivery → render, in ms, with P50/P95 running stats and a budget line at 2.5 s.
- Four scripted scenarios selectable with one click: Missed cross-sell (second vehicle / second policy), Skipped disclosure / risky statement, Rising frustration, Noisy-ambiguous call (must produce few or zero nudges).
- "Explain this nudge" button: shows the transcript span, rule/model that fired, confidence calculation.

### 5.8 Call Library (`/calls`)
- Grid/table of every recorded call: market, language, scenario, duration, outcome, grounded-answer rate, number of fallbacks, WER if labeled.
- Detail page (`/calls/:id`): WaveSurfer waveform with speaker lanes, synced transcript, receipt chips, sentence gate strips, notes, download buttons (audio, transcript `.txt/.json`, config snapshot), and a **Black Box** tab.

### 5.9 Call Black Box (`/trace/:traceId`)
Waterfall of spans (VAD, ASR, intent, retrieval, rerank, LLM, gate, TTS, delivery) with start/end ms, provider, token counts, and cache hits. Include a "replay this turn with another KB version/model" button (calls `/replay`).

### 5.10 Evaluation (`/evaluation`)
- **Grounding**: grounded-sentence rate, unsupported blocked, hallucination red-team results (list of adversarial prompts with pass/fail).
- **Retrieval**: recall@k, MRR, verdict distribution, regression across KB versions.
- **Latency**: P50/P95 histograms per component and end-to-end; 10× load simulation chart (concurrent streams vs. latency).
- **Nudge quality**: precision estimate, false-positive rate by signal type, confusion table from a hand-labeled sample, acceptance rate from reviewer feedback.
- **Chaos results**: matrix of SNR × accent × code-switch with outcomes.
- Export "Evaluation Report" as printable HTML/PDF.

### 5.11 Architecture (`/architecture`)
- Interactive architecture diagram (SVG): Telephony/WebRTC → VAD → Streaming ASR → Language Router → Dialogue Manager → Retriever (hybrid) → LLM → Sentence Gate → TTS → Caller; side-lane: Event Bus → Signal Extractor → Nudge Engine → WebSocket → Cockpit; data-lane: Ingestion → Cleaning → PII Shield → Chunk/Embed → Index with versions.
- Click any component for: why chosen, alternatives rejected, failure mode, fallback. This page is the "explain technical choices" evidence.
- Section: **Production Improvement Plan** (checklist with priority) and **10× Scale / Noisy Audio Limitations**.

### 5.12 Demo Mode (`/demo`)
- A guided "story" (stepper) that drives the actual UI through the video-walkthrough order: overview → KB pipeline → retrieval evidence → voice call → fallback & escalation → PH & ID bots → live nudges → limitations. Includes on-screen presenter notes and a keyboard-driven "next" so the recorded walkthrough is smooth and repeatable. Add a floating timer.

### 5.13 Gaps & Compliance (`/gaps`)
- Honest list of known limitations, native-speaker review gaps, regulatory wording to verify, data-retention rules, consent/recording disclosure, and how PII is handled in recordings. Each item: severity, mitigation, owner.

## 6. SHARED COMPONENTS (build once, reuse)

`ReceiptChip`, `ReceiptDrawer`, `SentenceGateStrip`, `TranscriptTurn`, `LiveWaveform`, `StreamingText`, `NudgeCard`, `SuppressedNudgeRow`, `LatencyWaterfall`, `PercentileBadge`, `RegisterDial`, `LanguageMixBar`, `LineageGraph`, `DiffViewer`, `VerdictPill`, `ScoreBars`, `SignalLane`, `ChaosSliders`, `ProviderHealthDot`, `EmptyState`, `CodeBlock` (copy button), `CommandPalette`.

## 7. DATA CONTRACTS (frontend must implement exactly)

REST (base `/api`):
- `GET /kb/records?query&category&market&version`, `GET /kb/records/:id`, `GET /kb/versions`, `GET /kb/versions/:v/diff`
- `POST /retrieval/search {query, market, mode, version, k}` → `{results:[{record_id, chunk_id, text, source_ref, scores:{dense,sparse,rerank,boost}, citation}], trace_id, latency_ms}`
- `GET /retrieval/evidence` / `PUT /retrieval/evidence/:id {verdict}`
- `POST /calls/token {market, scenario}` → call-provider join token
- `GET /calls`, `GET /calls/:id`, `GET /trace/:traceId`
- `GET /eval/summary`, `GET /asr/bench`

WebSocket `/ws/live/:sessionId` events (Zod-validated discriminated union on `type`):
`transcript.partial`, `transcript.final {speaker, text, t_start, t_end, asr_latency_ms}`, `signal {kind, confidence, span, t}`, `nudge.fired {id, priority, text, reason, confidence, expires_at, topic}`, `nudge.suppressed {id, reason, details}`, `latency.sample {stage, ms}`, `call.state`, `register.update {lang_mix, formality}`, `gate.event {turn_id, status, draft, final, citations}`.

If any contract is missing from the backend, the mock layer must still satisfy it and a banner must say "MOCK DATA".

## 8. QUALITY BARS

- Lighthouse performance ≥ 90 on desktop for non-live pages; live page must hold 60 fps with transcripts of 5,000 words (virtualized lists).
- WCAG AA contrast, full keyboard navigation, ARIA live regions for nudges (polite) and compliance nudges (assertive), captions for all audio.
- Responsive down to 1024 px for the cockpit, and down to 360 px for the call widget and Call Library.
- Zero secrets in the client. All provider keys remain server-side; tokens are short-lived.
- Every page has at least one component test; three Playwright flows pass headless.

## 9. DELIVERABLES

1. Complete Vite project in `/frontend`, runnable with `npm i && npm run dev` (mock mode default) and `VITE_API_MODE=live` for the real backend.
2. `README` with screenshots placeholders, route map, component inventory, and mock-vs-live instructions.
3. `docs/FRONTEND_DECISIONS.md`: why each library/layout/semantic color was chosen and what was rejected.
4. Seed fixtures: ≥ 12 retrieval evidence rows, 6 recorded-call transcripts (EN/TL/Taglish/ID formal/ID colloquial/ID regional), 4 live-nudge scenario streams, ASR bench data, localization examples.
5. A short "design tokens" page at `/architecture#design` showing the palette and component states.

Start by scaffolding the shell, tokens, and shared components, then the Live Nudge Cockpit, then KB Studio and Retrieval Lab, then the remaining pages. After each major page, run type-check and tests. Finish with a self-review listing anything that is mocked.
