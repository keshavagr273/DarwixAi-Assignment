# PARLEY — PRODUCT REQUIREMENTS DOCUMENT (PRD)

> Version 1.0 · Owner: Candidate (AI Engineer Assessment) · Status: Approved for build
> This PRD turns the assessment brief into a buildable product. Companion documents: `ARCHITECTURE.md`, `CHECKPOINTS.md`, `CLAUDE.md`.

---

## 1. Summary

**PARLEY** is a grounded, multilingual voice-operations platform for financial services. It converts unstructured business content into a traceable knowledge base (KB), uses that KB to run voice agents that never invent answers, localizes those agents for the Philippines and Indonesia, and analyzes live call audio to give a human agent timely, low-noise nudges.

**One-line promise:** *Every spoken claim has a receipt, and every unnecessary alert is suppressed with a reason.*

## 2. Background and problem

Financial-services contact centers (insurance, lending) face four recurring problems:

1. **Knowledge is scattered and dirty.** Policies, FAQs, brochures, forms and web pages overlap, contradict each other, and contain personal data. Bots built on this content hallucinate or leak.
2. **Voice bots invent answers.** A wrong grace period, rate or eligibility statement creates compliance and trust risk.
3. **Translation is not localization.** Customers in the Philippines and Indonesia code-switch, use local finance vocabulary, and expect culturally appropriate politeness. Literal translation fails.
4. **Human agents miss moments.** Cross-sell cues, skipped disclosures, and rising frustration are noticed only in post-call review, when it is too late.

## 3. Goals and non-goals

### 3.1 Goals

| ID | Goal |
|---|---|
| G1 | Deliver a working, callable voice agent whose factual statements come from the KB (Q1) |
| G2 | Deliver a production-style KB with cleaning, dedupe, PII protection, schema, versions, retrieval and citations (Q2) |
| G3 | Deliver two native-language bots (Philippines, Indonesia) demonstrating code-switching, local terminology and language-specific fallback (Q3) |
| G4 | Deliver a streaming insight/nudge pipeline with measured latency and false-positive control (Q4) |
| G5 | Make all evidence easy to inspect: transcripts, recordings, metrics, traces, citations |
| G6 | Make the candidate able to explain and defend every technical decision |

### 3.2 Non-goals

- Production-grade telephony scale, billing, multi-tenant administration.
- Real customer data, real CRM integration, real payments.
- Legal sign-off on regulatory wording (tracked as an open gap instead).
- Supporting more than the declared markets/languages.
- Visual polish beyond what is needed to make evidence clear.

## 4. Users and personas

| Persona | Description | Needs |
|---|---|---|
| **Customer (caller)** | Policyholder or borrower receiving a reminder call | Clear, polite, in their language; honest when the bot does not know; easy path to a human |
| **Contact-center agent** | Human on a live call | Short, timely, trustworthy nudges; no alert fatigue |
| **Operations/QA lead** | Reviews calls and bot behavior | Transcripts, sources behind answers, refusal reasons, metrics |
| **Knowledge manager** | Owns content | Visibility into cleaning, duplicates, conflicts, versions |
| **Assessment reviewer** | Evaluates the candidate | Working demo, measurable results, evidence mapped to requirements, honest limitations |

## 5. Scope

### 5.1 In scope

- Q1 voice agent: **insurance renewal reminder and renewal-intent qualification** (market `in_en`).
- Q2 KB for a fictional insurer/finance group ("Meridian Assure / Meridian Finance") with mixed content and planted defects.
- Q3 Philippines bot (life insurance premium/renewal reminder, bancassurance referral follow-up) and Indonesia bot (multifinance instalment reminder and follow-up).
- Q4 real-time insights using live audio or recorded audio replayed in real-time chunks.
- Control-room web UI, evidence exports, documentation, video walkthrough.

### 5.2 Out of scope (explicit)

PSTN number is optional (a web calling interface satisfies the requirement). Additional languages, advanced analytics warehouses, and full production hardening are described in the production plan only.

## 6. Functional requirements

Priority: **P0** = required for assessment pass, **P1** = strongly expected, **P2** = differentiator.

### 6.1 Knowledge Base (Q2)

| ID | Requirement | Pri |
|---|---|---|
| FR-KB-01 | Ingest website pages (static and JS-rendered), PDFs (text and scanned), DOCX, CSV/XLSX, forms, tables | P0 |
| FR-KB-02 | Document extraction method per source type and failure handling; failed or low-health sources are quarantined with reason codes and shown in UI | P0 |
| FR-KB-03 | Remove navigation, headers, footers, repeated sections and irrelevant content | P0 |
| FR-KB-04 | Detect and flag obvious source errors (conflicting values, impossible dates, out-of-range rates) with resolution policy | P0 |
| FR-KB-05 | Detect exact and near-duplicate content; keep a canonical record with provenance | P0 |
| FR-KB-06 | Standardize headings, dates (ISO-8601), terminology (glossary), categories, form fields | P0 |
| FR-KB-07 | Identify and mask PII with typed tokens; store mapping in isolated encrypted vault; flag `pii` on records | P0 |
| FR-KB-08 | Record schema includes at minimum `record_id, title, content, category, source, version, pii` and the sample `kb_product_001 Branch Partnership Benefits` | P0 |
| FR-KB-09 | Structure-aware chunking with documented strategy; metadata for market, language, category, validity, lineage | P0 |
| FR-KB-10 | Taxonomy for product/policy/FAQ/objection/qualification rules with market overrides | P0 |
| FR-KB-11 | Immutable versioned snapshots, diffs, and `supersedes` links | P0 |
| FR-KB-12 | Hybrid retrieval (dense + sparse + rerank) with metadata filters and a `NO_MATCH` threshold | P0 |
| FR-KB-13 | Citation string for every retrieved chunk: `[record_id@version · source display]` | P0 |
| FR-KB-14 | Retrieval evidence table ≥ 5 required, target ≥ 12 queries: question, retrieved record, source reference, relevance explanation, verdict (correct/partially correct/incorrect) | P0 |
| FR-KB-15 | Evidence covers product, policy, qualification, FAQ, and objection questions, plus no-answer queries | P0 |
| FR-KB-16 | Retrieval is reachable from a simple interface **and** the voice agent via the same code path | P0 |
| FR-KB-17 | Retrieval regression run per KB version with pass/fail deltas | P1 |
| FR-KB-18 | PII leak test over all indexed chunks (CI gate) | P1 |
| FR-KB-19 | Knowledge Time Machine UI: version scrubber, diff, regression rerun | P2 |

### 6.2 Voice Agent (Q1)

| ID | Requirement | Pri |
|---|---|---|
| FR-VA-01 | Configure voice platform; load provided script and business rules | P0 |
| FR-VA-02 | Provide a callable interface (web calling; PSTN optional) | P0 |
| FR-VA-03 | Connect to KB via `retrieve_kb`; system prompt must not embed FAQs, objections or policies | P0 |
| FR-VA-04 | Conversation flow with identity/consent, purpose, status check, qualification, objection handling, commitment, close | P0 |
| FR-VA-05 | Qualification logic implemented in code/rules with deterministic dispositions (`will_pay`, `needs_callback`, `needs_human`, `not_interested`, `dispute`) | P0 |
| FR-VA-06 | Grounded objection handling: responses derive from retrieved objection records and carry citations | P0 |
| FR-VA-07 | Unsupported-question fallback: states information is unavailable; never invents; offers callback/human | P0 |
| FR-VA-08 | Human escalation triggers and handoff (explicit request, repeated fallback, anger, complaint/legal terms, vulnerability) | P0 |
| FR-VA-09 | Sentence Gate verifies factual sentences pre-TTS; fail-closed | P0 |
| FR-VA-10 | Business action: callback scheduling, mock CRM summary, escalation webhook | P0 (at least one), P1 (all three) |
| FR-VA-11 | Record ≥ 3 test calls with transcripts and results: cooperative; objection; incomplete/conflicting details; out-of-scope; human request; **information-not-in-KB** | P0 |
| FR-VA-12 | Barge-in, silence handling, max duration, recording-consent line | P1 |
| FR-VA-13 | Conflicting/incomplete details handled by read-back and single clarifying question | P0 |

### 6.3 Native-Language Bots (Q3)

| ID | Requirement | Pri |
|---|---|---|
| FR-ML-01 | Philippines bot supports English, Filipino, and natural Taglish; terms premium, policy, beneficiary, rider, lapse, coverage, bank referral used naturally | P0 |
| FR-ML-02 | Indonesia bot supports formal and colloquial Bahasa Indonesia and finance English loanwords; terms cicilan, tenor, denda, DP, jatuh tempo, angsuran, pembiayaan used naturally | P0 |
| FR-ML-03 | Language-specific ASR configured and tested per market; report provider/model, languages tested, code-switching behavior, approximate quality, observed errors | P0 |
| FR-ML-04 | Indonesian regional-accent test (at least one accent beyond standard Jakarta) with documented performance | P0 |
| FR-ML-05 | Localized scripts, FAQs, objections, rules, politeness, dates, amounts, payment explanations per market and sector | P0 |
| FR-ML-06 | ≥ 3 localization (not translation) examples per market; target 5 | P0 |
| FR-ML-07 | Native TTS voices for Filipino and Indonesian where available; compromises documented | P0 |
| FR-ML-08 | Fallback and escalation remain in the customer's language/register; no unexpected English switch (drift detector) | P0 |
| FR-ML-09 | Two recorded calls per market covering: cooperative, sector-specific objection, mixed English/finance terms, colloquial speech, human escalation, Indonesian regional accent | P0 |
| FR-ML-10 | Comparison document and known native-speaker/compliance gaps | P0 |
| FR-ML-11 | Register Dial (live language mix and formality) | P2 |

### 6.4 Live Insights and Nudges (Q4)

| ID | Requirement | Pri |
|---|---|---|
| FR-RT-01 | Streaming input: live audio or recording replayed at real-time speed in chunks (not whole-file upload analysis) | P0 |
| FR-RT-02 | Streaming transcription with agent/customer separation where possible; per-chunk latency reported | P0 |
| FR-RT-03 | Track intent/topic shifts, compliance/risk, sentiment/frustration, buying signals, missed opportunities, callback needs | P0 |
| FR-RT-04 | Generate short actionable nudges and expose via dashboard/WebSocket/webhook/polling/CLI | P0 |
| FR-RT-05 | Measure audio-received → transcription → signal detection → nudge generation → display; report P50/P95 and component latency (ASR, signal extraction, LLM, delivery) | P0 |
| FR-RT-06 | Nudge control: confidence thresholds, duplicate suppression, cooldowns, topic grouping, priorities, expiry, repetition rules | P0 |
| FR-RT-07 | Approximate false-positive analysis on labeled scenarios | P0 |
| FR-RT-08 | Scenarios: missed cross-sell, skipped disclosure/risky statement, rising frustration, noisy/ambiguous call where unnecessary nudges are avoided | P0 |
| FR-RT-09 | At least one compliance example and one missed-opportunity example in the demo | P0 |
| FR-RT-10 | Document limitations at 10x scale and with noisy audio | P0 |
| FR-RT-11 | Nudge Court: log suppressed nudges with reasons | P1 |
| FR-RT-12 | Chaos Harness: SNR/speed/code-switch stress with plotted degradation | P2 |
| FR-RT-13 | Nudges grounded in an approved playbook from the KB | P1 |

### 6.5 Control Room UI (supporting)

| ID | Requirement | Pri |
|---|---|---|
| FR-UI-01 | Mission Control summarizing the four deliverables with key metrics | P1 |
| FR-UI-02 | KB Studio and Retrieval Lab showing pipeline, diffs, PII, records, evidence table | P0 |
| FR-UI-03 | Voice Agent page with test call, transcript with receipts, qualification checklist, test matrix | P0 |
| FR-UI-04 | Live Nudge Cockpit with transcript, signals, nudges, suppressed nudges, latency waterfall | P0 |
| FR-UI-05 | Call Library with audio, transcripts, downloads | P0 |
| FR-UI-06 | Architecture, Evaluation, Gaps & Compliance, Demo Mode pages | P1 |
| FR-UI-07 | Mock mode and live mode via environment flag | P1 |

## 7. Non-functional requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | Latency (voice) | User stops speaking → bot audio starts: median ≤ ~1.2 s target; actuals reported |
| NFR-02 | Latency (nudges) | End-to-end P95 ≤ 2.5 s (Tier 1), ≤ 3.5 s (with LLM) target; actuals reported |
| NFR-03 | Grounding | 100% of factual spoken sentences carry citations or are blocked; target grounded rate ≥ 95% on recorded calls |
| NFR-04 | Safety | Fail-closed when verifier, retriever or LLM errors occur |
| NFR-05 | Privacy | No real PII in repo; no raw PII in retrievable chunks; logs scrub PII |
| NFR-06 | Reliability | Provider failover for ASR/TTS/LLM; graceful degradation paths documented |
| NFR-07 | Security | No secrets in git; secret-scan hook; short-lived call tokens; rate limiting |
| NFR-08 | Reproducibility | Clean-machine setup with documented commands; seeded fixtures |
| NFR-09 | Observability | `trace_id` across all stages; spans stored |
| NFR-10 | Accessibility | UI keyboard accessible, WCAG AA contrast, captions for audio |
| NFR-11 | Maintainability | Typed code, linting, unit and integration tests, CI |
| NFR-12 | Honesty | All metrics report sample sizes; mocked components and unverified provider claims are listed |

## 8. Success metrics and acceptance thresholds

| Area | Metric | Acceptance target |
|---|---|---|
| KB cleaning | Residual boilerplate in indexed chunks (sampled) | < 2% |
| KB dedupe | Planted duplicates detected | ≥ 90% |
| KB PII | Raw PII patterns in indexed chunks | 0 |
| KB source errors | Planted conflicts/typos flagged | 100% of planted items |
| Retrieval | Evidence queries with verdict "correct" | ≥ 80%; every failure diagnosed with fix |
| Retrieval | No-answer queries correctly refused | 100% of the no-answer set |
| Voice agent | Grounded-sentence rate on recorded calls | ≥ 95% |
| Voice agent | Fabricated factual answers in red-team set | 0 |
| Voice agent | Disposition accuracy on scripted scenarios | ≥ 90% |
| Multilingual | Unexpected English switch in fallback/escalation | 0 occurrences in test calls |
| Multilingual | Localization examples per market | ≥ 3 (target 5) |
| ASR | Reported per market and accent | WER/CER estimate with sample size |
| Live nudges | P50/P95 latency reported per stage and end to end | Measured over ≥ 100 events per scenario |
| Live nudges | Noisy/ambiguous call | 0–1 low-value nudges per 3 minutes |
| Live nudges | Precision on labeled scenarios | Reported with confidence caveat; target ≥ 0.75 |

Targets are goals; the submission reports the measured values even where they miss the target and explains why.

## 9. Evidence-to-evaluation mapping

| Evaluation area (weight) | Where PARLEY demonstrates it |
|---|---|
| Business problem understanding (15%) | This PRD, personas, sector-specific flows, compliance gaps register |
| Research/domain understanding (10%) | Glossaries, market packs, localization examples, regulatory-wording register |
| End-to-end completeness (15%) | All four questions connected; KB → agent; replay → nudges → UI |
| Output quality (20%) | Cited answers, clean transcripts, accurate localization, useful nudges |
| Functional implementation (15%) | Callable agent, working pipeline, passing tests |
| AI-tool usage and independent thinking (10%) | `DECISIONS.md`, rejected alternatives, `EXPLAIN_IT.md`, own measurements |
| Feasibility, edge cases, technical depth (10%) | Failure-mode table, chaos harness, 10x discussion |
| Presentation and communication (5%) | Demo Mode, video script, README |

## 10. Rejection-condition risk register

| Rejection condition (from brief) | Mitigation in this product |
|---|---|
| Only notes/PRD, no working prototype | Working build gates in `CHECKPOINTS.md`; demo recorded |
| Copied work candidate cannot explain | `DECISIONS.md` + `EXPLAIN_IT.md`; own planted-defect corpus and measurements |
| Disconnected KB and voice bot | Same retrieval code path; citations on spoken sentences; calls store `kb_version` |
| Hallucinated answers | Sentence Gate, `NO_MATCH`, red-team suite, "not in KB" test call |
| Unmeasured latency | Latency tracer and report with P50/P95 |
| Literal multilingual translation | Market Packs, localization workbench, Language Lock, accent test |
| Nudges only after the call | Chunked replay and live pipeline; recorded live demo |
| Excessive low-value alerts | Nudge Court policy, noisy-audio guard, FP analysis |

## 11. Assumptions and dependencies

- Access to ASR, TTS and LLM providers with trial or paid keys; availability of Filipino and Indonesian support must be verified at build time.
- A fictional company and synthetic data are acceptable.
- Accent audio is self-recorded or consented; its provenance is documented.
- The assessment's "provided script and business rules" are represented by authored files in `market_packs/` if not supplied separately; replace them with the supplied ones when available.

## 12. Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Provider lacks quality for Filipino/Taglish or Indonesian accent | Medium | High | Benchmark ≥ 2 providers; phrase boosting; document compromises |
| 48-hour time limit | High | High | Strict build order; cut UI pages before cutting gates/metrics |
| Sentence Gate adds latency | Medium | Medium | Sentence-level pipelining; fast verifier model; exact-match shortcut |
| Small labeled set misleads | High | Medium | Report sample sizes and caveats |
| Streaming ASR instability | Medium | High | Replay mode as stable path; secondary provider |
| Native-speaker review unavailable | High | Medium | Declare gap; use glossary-driven checks; seek informal review |
| Secrets leak | Low | High | Pre-commit scan, `.env.example` only |

## 13. Milestones (48-hour plan)

| Phase | Window | Outcome |
|---|---|---|
| P0 Setup | Hours 0–3 | Repo, infra, schema, CI |
| P1 KB | Hours 3–14 | Cleaned, indexed KB; retrieval evidence |
| P2 Agent core | Hours 14–24 | Text-mode agent with gate, tools, red-team pass |
| P3 Voice Q1 | Hours 24–30 | Callable agent; 3+ recorded calls |
| P4 Native bots | Hours 30–38 | PH and ID calls; ASR/TTS report |
| P5 Live nudges | Hours 38–44 | Streaming pipeline, latency, FP analysis |
| P6 Finish | Hours 44–48 | UI wiring, docs, video, secret scan |

If behind schedule, cut in this order: Chaos Console UI → Time Machine UI → Architecture interactivity → extra scenarios. Never cut: Sentence Gate, `NO_MATCH` path, latency measurement, suppression logic, recorded calls.

## 14. Deliverables

GitHub repository with README and `.env.example`; architecture diagram; setup instructions; sample inputs; test results; recorded calls, transcripts and audio samples; video walkthrough (system overview and demo, architecture and decisions, KB/retrieval and voice flow, multilingual handling and live nudges, fallbacks/limitations/production improvements); known limitations; production-improvement plan; no credentials or customer information committed.

## 15. Open questions

1. Are the "provided script and business rules" supplied separately? (Assumed to be authored if not.)
2. Is a phone number required or is web calling sufficient? (Assumed web calling is sufficient.)
3. Which Indonesian accent will be tested? (Default: Javanese-accented Indonesian.)
4. Is a native-speaker reviewer available for PH/ID scripts? (Assumed no; gap declared.)
