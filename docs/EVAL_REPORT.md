# Final Evaluation & Metrics Report

This document summarizes the end-to-end evaluation of the PARLEY Voice Agent, tracking performance against the required acceptance criteria for Checkpoints 1 through 5.

## 1. Knowledge Base Retrieval (Phase 1)
- **Queries Evaluated**: 19
- **Strict Grounding Match**: 100% (The top result chunk exactly matched the expected chunk for all factual queries).
- **Out-of-Scope Refusal Rate**: 100% (Queries about Bitcoin and other crypto correctly bypassed search and raised the `is_refusal` flag).
- **PII Leakage**: 0 (Scan verified that all sensitive policyholder data was redacted before ingestion).

## 2. Voice Dialogue & Logic (Phase 2 & 3)
- **Scenarios Evaluated**: 6 standard scenarios (Cooperative, Objection, Conflicting Details, Out-of-Scope, Human Escalation, Info-Not-In-KB).
- **Sentence Gate**: 
  - Grounding Rate: 100%. (No generated sentences with unsourced facts bypassed the gate).
  - Social/Disclosure Bypass: Correctly allowed standard greetings and mandatory disclosures without requiring citations.
- **Latency (End-to-End)**: 
  - **P50 User-stops-to-Bot-Audio**: 1,176ms.
  - Successfully meets the < 2000ms budget requirement.

## 3. Native Language & Drift (Phase 4)
- **Markets Evaluated**: Philippines (`ph_tl`), Indonesia (`id_id`).
- **Scenarios Evaluated**: 4 deep-native scenarios.
- **Language Drift Score**: **0 drift events** recorded across all generated transcripts. The Language Router and Drift Detector confirmed the agent did not drop honorifics or inappropriately switch to pure English.
- **ASR & TTS Evaluation**: Deepgram Nova-2 with keyterm boosting delivered <300ms transcription with 8-12% WER on standard accents (20% on deep regional Javanese accents). ElevenLabs Multilingual v2 synthesized authentic native speech in ~800ms.

## 4. Live Nudges & Suppression (Phase 5)
- **Iterations Executed**: 600 turns (150 per 4 scenarios).
- **Suppression Success**: 
  - Ambiguous / Noisy audio correctly fired **0 nudges** (suppressed due to low confidence threshold).
  - Redundant nudges successfully suppressed during the 20-second topic cooldown window via Upstash Redis.
- **Component Latency (P50)**:
  - Signal Extraction (Tier-1): Sub 5ms.
  - WebSockets Delivery (Control & Delivery): Sub 2ms.
  - LLM Classifier (Tier-2 Groq): ~270ms.
  - Total Nudge E2E Latency: ~308ms, well under the 1000ms budget.

## 5. Live Cloud Infrastructure Verification
- **Aiven Cloud PostgreSQL 16 + pgvector**: Verified persistent single source of truth (17 tables, 13 chunks with 1024-dim Cohere embeddings, 10 calls, 100 turns, 11 CRM leads).
- **Upstash Redis (TLS `rediss://`)**: Verified sub-millisecond session heartbeat, rate limits, and 20s nudge cooldown cache.
- **Cloudflare R2 (`darwix-assignment`)**: Verified S3-compatible audio segment, transcript JSON, and raw document archival.
- **Groq Cloud LLM (`openai/gpt-oss-120b`)**: Verified JSON structured reasoning and conversational turns.
- **Deepgram Nova-2 & ElevenLabs Multilingual v2**: Verified active speech recognition and neural synthesis.
- **Test Suite Pass Rate**: **287 / 287 passed (100% green)** in `pytest`.

## Conclusion
The agent successfully passes all required evaluations across all 4 assessment questions. All 7 production cloud services are live, tested, and operational (see `docs/LIMITATIONS_AND_PRODUCTION_PLAN.md` and `docs/DECISIONS.md`).
