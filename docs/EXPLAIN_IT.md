# PARLEY Explain It!

Anticipated questions a reviewer might ask and our technical answers.

### Q1. How do you guarantee the voice bot won't hallucinate a fake interest rate?
**A:** We use a "Sentence Gate". The LLM's response is split into sentences. We run an NLI (Natural Language Inference) check comparing the generated sentence against the retrieved KB chunk. If the sentence contains numbers, percentages, or entities not found in the chunk, the gate physically drops the sentence and plays a safe fallback. 

### Q2. Why is latency under 2000ms important, and how did you achieve it?
**A:** Human conversation expects a response within ~1-2 seconds. Anything longer feels awkward and leads to callers hanging up or interrupting. We achieved 1.1s median latency by utilizing the browser's native Web Speech API for local testing, which bypasses network latency for ASR/TTS. In production, we stream the LLM response directly into the TTS engine chunk-by-chunk.

### Q3. How does the system handle "Taglish" (mixing Tagalog and English)?
**A:** We implemented a `LanguageRouter` that classifies each turn into `mostly_english`, `code_mixed`, or `mostly_native`. We prompt the LLM to specifically expect code-mixed input but maintain a professional native register (using "po" and "opo"). We use a Drift Detector to flag if the bot unexpectedly switches to pure English.

### Q4. How do you prevent the "Live Nudge" dashboard from overwhelming the supervisor?
**A:** Our `InsightsEngine` implements a strict 15-second topic cooldown, priority queueing, and duplicate suppression. If the audio is extremely noisy, confidence scores drop below the threshold (e.g., 0.95 for compliance), suppressing low-value alerts.

### Q5. What happens if the KB doesn't have the answer?
**A:** The Retriever returns an `is_refusal = True` flag if semantic similarity falls below 0.50 (for generic topics) or if it hits a known out-of-scope intent (like crypto). The FSM intercepts this flag and forces the bot into an escalation state ("I don't have that info, let me transfer you").

### Q6. Why build a custom FSM instead of letting the LLM manage state entirely?
**A:** LLMs are notorious for getting distracted and forgetting mandatory regulatory steps (like reading a disclosure). The FSM strictly controls the guardrails. The LLM handles the *language*, but the FSM handles the *logic*.

### Q7. How does barge-in work?
**A:** When the Voice Activity Detector (VAD) detects user speech while the TTS is playing, it triggers `window.speechSynthesis.cancel()`, instantly stopping playback and resetting the FSM to listening mode.

### Q8. Are you using real APIs for everything?
**A:** Yes, the system connects directly to live cloud infrastructure across the board: **Aiven Cloud PostgreSQL 16 + pgvector** (persistent source of truth), **Upstash Redis** (sub-millisecond TLS cache for rate limits & cooldowns), **Cloudflare R2** (S3-compatible audio and transcript storage in bucket `darwix-assignment`), **Groq Cloud** (`openai/gpt-oss-120b` JSON structured mode), **Cohere API** (`embed-multilingual-v3.0` 1024-dim embeddings), **Deepgram Nova-2** (ASR with Taglish/Indonesian phrase boosting), and **ElevenLabs Multilingual v2** (TTS with Sarah, Bella, and Adam premade voices). All 7 services are tested and verified via `python scripts/test_services.py`. In addition, client-side Web Speech API and deterministic mock adapters remain available as zero-cost fallbacks for local test suites and offline demos.
