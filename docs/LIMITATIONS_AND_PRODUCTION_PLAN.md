# Limitations & Production Plan

## Current Limitations

1. **Voice Pipeline Mocking**: Currently relying on Web Speech API for zero-setup local dev. The real LiveKit/Twilio adapters are stubbed out but not actively handling RTP streams.
2. **LLM Tiering**: Tier-2 insights (the small-LLM classifier for nudges) is mocked via fast heuristic lexicons in `InsightsEngine`. In production, this would be a fine-tuned 8B model (like Llama 3 8B) running on vLLM.
3. **Database**: We are using local `.jsonl` files for CRM, logs, and KB. Production requires PostgreSQL (pgvector for embeddings) and Redis for FSM state.
4. **ASR Quality on Accents**: Javanese and regional Tagalog accents still suffer from ~20-25% WER.

## Production Plan (Next 90 Days)

### Phase 1: Infrastructure (Days 1-30)
- Migrate vector storage to Pinecone or pgvector.
- Deploy FastAPI backend to AWS EKS with autoscaling.
- Connect the LiveKit CallProvider to a Twilio SIP trunk to acquire real PSTN numbers.

### Phase 2: Intelligence Upgrades (Days 31-60)
- Deploy Llama-3-8B-Instruct on an inferencing cluster for Tier-2 insight classification.
- Implement streaming LLM generation chunking (sending 3-word chunks to TTS immediately to cut latency by 400ms).
- Collect 10 hours of accented audio in PH and ID to fine-tune a Whisper/Deepgram endpoint.

### Phase 3: Analytics & Compliance (Days 61-90)
- Store all call transcripts in a data lake (S3) and build a Looker dashboard for daily adherence reporting.
- Implement strict PII redaction (masking credit cards and IDs) before audio hits the ASR.
