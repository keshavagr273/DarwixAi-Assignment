# Key Design Decisions

## 1. Web Speech API for Local Voice Prototyping
**What:** Using the browser's native `SpeechRecognition` and `SpeechSynthesis` instead of wiring up a full LiveKit+Deepgram pipeline for local dev.
**Why:** Achieves sub-2000ms latency immediately, costs $0 to prototype, and eliminates complex WebRTC tunneling for reviewers.
**Rejected:** Forcing reviewers to set up Ngrok and Twilio SIP trunks. Too fragile for an assignment.

## 2. Sentence Gate "Fail-Closed" Mechanism
**What:** The LLM's output is broken into sentences. Each sentence is independently verified against the retrieved context chunk. If it contains numbers/facts not in the chunk, the *entire* turn is blocked and replaced with a safe fallback.
**Why:** In finance, a hallucinated interest rate is a legal liability. A slightly awkward fallback is always better than a convincing lie.
**Rejected:** Prompt-only constraints (they eventually fail under jailbreaks or edge cases).

## 3. Hybrid RAG (Dense + BM25)
**What:** Combining semantic embeddings with exact keyword matching (BM25) with a 0.70 / 0.30 weight ratio.
**Why:** Users often search for exact policy names (e.g., "Term Plan X2") where dense embeddings might incorrectly return "Term Plan Y2" because they are semantically close. BM25 anchors specific nouns.
**Rejected:** Pure vector search.

## 4. Client-side Barge-in
**What:** Canceling the TTS playback immediately when the user starts speaking (via VAD).
**Why:** Feels vastly more natural than forcing the user to wait for the bot to finish its paragraph.

## 5. Duplicate Suppression via Lexicon and Cooldowns
**What:** Nudges (insights) use strict 15-second cooldowns per topic and require a confidence threshold.
**Why:** A supervisor dashboard flashing 5 times because a customer stuttered "manager... um... manager" is useless.
**Rejected:** Sending every LLM classification raw.
