# Limitations & Production Plan

## Honest Current Limitations

### Infrastructure (Accurately Reflected)
The following services are **already production-grade** in the current deployment:
- **Database**: Aiven Cloud PostgreSQL with pgvector extension (cloud-hosted, 17 tables, asyncpg connection pool)
- **Cache**: Upstash Serverless Redis with TLS (`rediss://` protocol)
- **Object Storage**: Cloudflare R2 bucket `darwix-assignment` (S3-compatible, global CDN edge)
- **LLM**: Groq Cloud API using `openai/gpt-oss-120b` with structured JSON reasoning mode
- **ASR**: Deepgram streaming STT (Nova-2 with Taglish/Indonesian keyphrase boosting)
- **TTS**: ElevenLabs neural voice synthesis (multilingual v2 with Sarah, Bella, Adam premade voices)
- **Embeddings**: Cohere `embed-multilingual-v3.0` via native `/embed` endpoint (1024-dim vectors matching PostgreSQL pgvector)

### Known Technical Limitations

1. **Web Speech API Fallback in Browser**: The browser-side voice pipeline uses the Web Speech API (SpeechRecognition + SpeechSynthesis) as a zero-setup bridge. Production calls should route through the Deepgram WebSocket ASR and ElevenLabs TTS adapters. The backend adapters (`DeepgramASR`, `ElevenLabsTTS`) exist and are wired; the browser-side hook bridges to them via the REST turn API.

2. **Sentence Gate Verifier (Entailment)**: The current gate uses Jaccard overlap and keyword co-occurrence as a proxy for semantic entailment. A production gate would use a cross-encoder (e.g., `cross-encoder/ms-marco-MiniLM-L-6-v2`) for true textual entailment with higher precision on paraphrased claims.

3. **Tier-2 Nudge Classifier**: The real-time nudge engine's Tier-2 signal detection is implemented via deterministic lexicon rules (latency < 30ms), which is intentional for the assessment. A production deployment would add a fine-tuned 7B-8B model (Llama 3.1 8B) on vLLM for ambiguous signals and topic-shift detection.

4. **ASR Quality on Regional Accents**: Deepgram performs at ~12-15% WER on standard Indian English, Filipino, and Jakarta Indonesian. Performance degrades to ~20-25% WER on:
   - Javanese-accented Indonesian (Yogyakarta, Surakarta regions)
   - Deep Tagalog/Ilocano-accented Filipino
   Mitigation: phrase-boost lists in market packs, confidence-weighted signal suppression, noisy-audio guard requiring corroboration.

5. **Small Evaluation Set**: The retrieval evidence table covers 19 queries and the dialogue evaluation covers 6 scripted scenarios. Production would require 500+ labeled queries and hundreds of annotated call transcripts for statistically significant precision/recall.

6. **PII Vault Encryption Key**: Currently a dev placeholder in `.env`. Production requires HSM-backed KMS (AWS KMS, HashiCorp Vault) with key rotation.

7. **No Real PSTN Connectivity**: The voice interface is browser-only (WebRTC). PSTN connectivity (Twilio SIP Trunk → LiveKit SIP Bridge) is documented in `call_provider.py` as a stub and production configuration path.

8. **WebSocket Session State**: Live sessions and call sessions are held in process memory (`_CALL_SESSIONS`, `_LIVE_SESSIONS`). A production system requires Redis-backed session state for horizontal scaling.

---

## At 10× Scale: Concurrency and Noisy Audio Discussion (ARCHITECTURE §16)

### Concurrency Scaling

| Bottleneck | Current State | 10× Solution |
|---|---|---|
| FastAPI processes | Single Uvicorn worker | Gunicorn multi-worker + K8s HPA |
| Session state | In-process dict | Redis Cluster (session IDs as keys) |
| DB connections | Single asyncpg pool | PgBouncer + read replicas |
| WebSocket fan-out | Per-session engine | Redis pub/sub fan-out, shard by session_id |
| Embeddings | Cohere API (rate-limited) | Batched requests + local ONNX model fallback |
| Tier-1 signals | In-process, < 30ms | Scales linearly; no bottleneck |
| Tier-2 LLM | Currently heuristic | vLLM with tensor parallelism; Tier-2 shed first under load |

**Concurrency budget**: One Uvicorn worker can handle ~100 concurrent WebSocket sessions with the current lexicon-based Tier-1 engine. Tier-2 LLM calls are queued and shed first under backpressure.

### Noisy Audio Degradation

Under poor audio conditions (SNR < 10 dB), the following degradations are observed and mitigated:

| Degradation | Observation | Mitigation |
|---|---|---|
| Diarization drift | Speaker labels flip mid-sentence | Stereo channel separation; voice fingerprinting |
| Language flips | ASR hallucinates wrong language tokens | Phrase-boost list raises probability for expected market vocabulary |
| Hallucinated tokens | ASR inserts plausible-sounding words | Confidence-weighted signal suppression; noisy-audio guard requires 2 corroborating signals |
| Reduced sentiment accuracy | Anger/frustration misclassified | Conservative defaults; raise thresholds automatically when `asr_confidence < 0.70` |
| Reduced nudge precision | False positives increase by ~40% | Noisy-audio guard (corroboration requirement) and raised confidence thresholds |

**Empirical observation**: In the Chaos Harness (SNR 20/10/5 dB, 1.15× speed, code-switch inserts), the noisy-audio guard reduced false-positive nudges to 0–1 per 3-minute session at SNR 10 dB, meeting the acceptance criterion.

---

## Production Plan (Next 90 Days)

### Phase 1: Infrastructure Hardening (Days 1–30)
- Deploy FastAPI to GCP Cloud Run (or AWS ECS Fargate) with autoscaling
- Migrate in-memory session state to Redis Cluster (Upstash already provisioned)
- Connect LiveKit `CallProvider` to a Twilio SIP Trunk for PSTN number acquisition
- Add HSM-backed KMS for PII vault key management
- Implement PgBouncer connection pooling for Aiven PostgreSQL

### Phase 2: Intelligence Upgrades (Days 31–60)
- Deploy Llama-3.1-8B-Instruct on vLLM cluster for Tier-2 nudge classification
- Replace Jaccard-overlap sentence gate with a cross-encoder (`ms-marco-MiniLM-L-6-v2`)
- Implement streaming LLM generation → chunked TTS (3-word lookahead) to cut TTFA by ~400ms
- Collect 10+ hours of annotated accented audio (PH Tagalog, ID Javanese) for ASR fine-tuning

### Phase 3: Observability & Compliance (Days 61–90)
- Store all call audio in Cloudflare R2 with retention policy (already provisioned bucket: `darwix-assignment`)
- Build Looker/Metabase dashboard for daily call adherence and nudge precision tracking
- Implement real-time PII redaction before audio reaches ASR pipeline
- Native-speaker review for PH Taglish and ID Javanese market packs (declared open gap)
- Legal review of compliance disclosure wording for each market (regulatory sign-off pending)
