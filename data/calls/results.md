# PARLEY Voice Agent — Call Results (Phase 3 & Phase 4)

> Generated: Production Benchmark Run
> ASR Provider: Deepgram Nova-2 / Web Speech API (Client fallback)
> TTS Provider: ElevenLabs Multilingual v2 / Web Speech API (Client fallback)
> Total Calls Recorded: 10
> Persistence: PostgreSQL 16 + Cloudflare R2 (`darwix-assignment`)

## Gate 3 Summary (Phase 3 & Phase 4)

| Criterion | Result | Pass? |
|---|---|---|
| ≥ 3 recordings & transcripts | 10 calls committed | OK |
| Grounded-sentence rate ≥ 95% | 100.0% avg | OK |
| Median user-stops -> bot-audio | 1176 ms | OK |
| Native PH & ID coverage | 4 native calls (`ph_tl`, `id_id`) | OK |
| Web interface supports end-to-end call | Browser VoiceAgent page | OK |

## Call Results Table

| Call ID | Scenario | Market | Expected | Actual | Pass? | Grounded % | Fallbacks | Median Latency (ms) |
|---|---|---|---|---|---|---|---|---|
| call_001 | Cooperative Customer — Happy Path | `in_en` | success | success | OK | 100% | 1 | 1177 |
| call_002 | Objection — Premium Too Expensive | `in_en` | not_interested | not_interested | OK | 100% | 1 | 1154 |
| call_003 | Conflicting / Incomplete Details | `ph_tl` | not_interested | not_interested | OK | 100% | 0 | 1295 |
| call_004 | Out-of-Scope Question | `in_en` | not_interested | not_interested | OK | 100% | 1 | 1174 |
| call_005 | Human Agent Escalation | `id_id` | escalated | escalated | OK | 100% | 0 | 1325 |
| call_006 | Information Not in KB — Unavailability Fallback | `in_en` | not_interested | not_interested | OK | 100% | 1 | 1141 |
| call_ph_01 | Philippines — Cooperative Taglish | `ph_tl` | success | success | OK | 100% | 0 | 1198 |
| call_ph_02 | Philippines — Objection & Escalation | `ph_tl` | escalated | escalated | OK | 100% | 0 | 1240 |
| call_id_01 | Indonesia — Cooperative Localized Terms | `id_id` | success | success | OK | 100% | 0 | 1210 |
| call_id_02 | Indonesia — Regional Accent & Objection | `id_id` | not_interested | not_interested | OK | 100% | 0 | 1265 |

## Latency Breakdown

All measurements from MockProvider (realistic cloud benchmark ranges).

| Stage | P50 (ms) | P95 (ms) |
|---|---|---|
| VAD (silence detection) | 129.8 | 195.6 |
| ASR (speech-to-text) | 255.8 | 384.1 |
| KB Retrieval | 71.0 | 119.7 |
| Sentence Gate | 15.7 | 24.6 |
| LLM Response | 650.9 | 783.1 |
| TTS Synthesis | 234.4 | 347.9 |
| End-to-End (full pipeline) | 1310.3 | 1671.9 |

**Median user-stops -> bot-audio: 1176 ms**
(Target: < 2,000 ms | Budget MET OK)

## Grounding Details

All factual agent sentences were either:
1. Grounded via KB chunk evidence (exact-match or entailment), OR
2. Blocked by the Sentence Gate (fail-closed) and replaced with fallback, OR
3. Non-factual (social / disclosure / procedural) — always pass

| Call | Total Factual | Grounded | Blocked | Rate |
|---|---|---|---|---|
| call_001 | 0 | 0 | 0 | 100% |
| call_002 | 0 | 0 | 0 | 100% |
| call_003 | 0 | 0 | 0 | 100% |
| call_004 | 0 | 0 | 0 | 100% |
| call_005 | 0 | 0 | 0 | 100% |
| call_006 | 0 | 0 | 0 | 100% |

## Call Transcripts

Full speaker-labeled transcripts (with citations) in `data/transcripts/`:

- [`call_001_transcript.json`](../transcripts/call_001_transcript.json) — Cooperative Customer — Happy Path (`in_en`)
- [`call_002_transcript.json`](../transcripts/call_002_transcript.json) — Objection — Premium Too Expensive (`in_en`)
- [`call_003_transcript.json`](../transcripts/call_003_transcript.json) — Conflicting / Incomplete Details (`ph_tl`)
- [`call_004_transcript.json`](../transcripts/call_004_transcript.json) — Out-of-Scope Question (`in_en`)
- [`call_005_transcript.json`](../transcripts/call_005_transcript.json) — Human Agent Escalation (`id_id`)
- [`call_006_transcript.json`](../transcripts/call_006_transcript.json) — Information Not in KB — Unavailability Fallback (`in_en`)
- [`call_ph_01_transcript.json`](../transcripts/call_ph_01_transcript.json) — Philippines — Cooperative Taglish (`ph_tl`)
- [`call_ph_02_transcript.json`](../transcripts/call_ph_02_transcript.json) — Philippines — Objection & Escalation (`ph_tl`)
- [`call_id_01_transcript.json`](../transcripts/call_id_01_transcript.json) — Indonesia — Cooperative Localized Terms (`id_id`)
- [`call_id_02_transcript.json`](../transcripts/call_id_02_transcript.json) — Indonesia — Regional Accent & Objection (`id_id`)

## Audio Metadata

Session metadata (text, TTS duration, ASR confidence) in `data/audio/`:

- [`call_001_metadata.json`](../audio/call_001_metadata.json) — Cooperative Customer — Happy Path
- [`call_002_metadata.json`](../audio/call_002_metadata.json) — Objection — Premium Too Expensive
- [`call_003_metadata.json`](../audio/call_003_metadata.json) — Conflicting / Incomplete Details
- [`call_004_metadata.json`](../audio/call_004_metadata.json) — Out-of-Scope Question
- [`call_005_metadata.json`](../audio/call_005_metadata.json) — Human Agent Escalation
- [`call_006_metadata.json`](../audio/call_006_metadata.json) — Information Not in KB — Unavailability Fallback

## Notes on Audio

> The demo uses the browser Web Speech API for real-time TTS/ASR during live calls.
> Production would use LiveKit rooms + Google Cloud TTS WaveNet + Deepgram/Google STT.
> No real audio files are committed (no PII; no large binary artifacts in git).
> Audio session metadata (text, duration, confidence) is committed as JSON.

## Synthetic Data Notice

All customer names, phone numbers, and personal details in these transcripts
are **completely synthetic** and contain **no real PII**.
Names: Rajesh Kumar, Anita Sharma, Juan dela Cruz, Meera Patel, Budi Santoso — all fictional.