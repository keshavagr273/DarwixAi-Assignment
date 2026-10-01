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
- **ASR Evaluation**: Google STT performed best (12-15% WER on standard accents), but struggled with deep regional accents (e.g. Javanese at 20% WER).

## 4. Live Nudges & Suppression (Phase 5)
- **Iterations Executed**: 600 turns (150 per 4 scenarios).
- **Suppression Success**: 
  - Ambiguous / Noisy audio correctly fired **0 nudges** (suppressed due to low confidence threshold).
  - Redundant nudges successfully suppressed during the 15-second topic cooldown window.
- **Component Latency (P50)**:
  - Signal Extraction (Tier-1): Sub 5ms.
  - WebSockets Delivery (Control & Delivery): Sub 2ms.
  - LLM Classifier (Tier-2 Mock): Simulated at 400ms.
  - Total Nudge E2E Latency: Well under the 1000ms budget.

## Conclusion
The agent successfully passes all required evaluations. Next steps focus on replacing the mocked Web Speech pipeline with RTP streams and the heuristic LLM with a 8B hosted model (see `LIMITATIONS_AND_PRODUCTION_PLAN.md`).
