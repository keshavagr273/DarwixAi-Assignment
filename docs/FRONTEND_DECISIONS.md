# PARLEY Control Room — Frontend Architectural Decisions

This document records the architectural, design, and technical decisions made during the frontend implementation of **PARLEY**, in accordance with `PROMPT_1_FRONTEND.md`.

---

## 1. Design Philosophy: Control Room Aesthetic vs. "AI-Slop"

### Decision: Strict Flat Pro-Console Aesthetic (Zero Gradients)
- **Constraint:** The user strictly mandated: *"it should look good and not ai and it should not have gradient"*.
- **Implementation:**
  - **Zero Gradients:** Excluded all linear gradients, radial glow meshes, and background blur bubbles. Replaced with sharp 1px borders (`#243041`), solid panel fills (`#0B0F14` app background, `#121821` panels, `#18212D` card surfaces), and high-contrast typographic hierarchy.
  - **Color Discipline:** 5 strictly semantic signals:
    - `--signal-green (#3DDC97)`: Grounded / Verified / Pass
    - `--signal-amber (#FFB547)`: Caution / Suppressed / Warning
    - `--signal-red (#FF5C6C)`: Blocked / Safety Gate Tripped / Risk
    - `--signal-cyan (#4CC9F0)`: Live Streaming / Active WebRTC
    - `--signal-violet (#A78BFA)`: LLM Draft / Generative Text
  - **Typography:** Inter for high-legibility UI text, Space Grotesk for architectural titles, and JetBrains Mono for hashes, tokens, latencies, and citations.

---

## 2. Key Interactive Signatures Built

### 1. Grounding Receipts & Global Receipt Drawer
- **Why:** In financial voice bots, "Every claim must have a receipt."
- **How:** Every bot turn carries clickable chips (e.g., `[kb_policy_014 · v1.3 · 0.98]`). Clicking immediately slides out the right-hand **Grounding Receipt Inspector**, revealing:
  - Source file and canonical section
  - Exact retrieved text chunk (with zero PII leakage)
  - Multi-stage retrieval score breakdown (Dense Vector, BM25 Lexical, BGE Cross-Reranker)
  - 5-stage Provenance Lineage DAG (Source → Parse → Clean → Chunk → Embed).

### 2. Sentence Gate Visualizer
- **Why:** Reviewers need to see fail-closed safety in action.
- **How:** A visual pipeline strip: `Draft → Verified → Spoken` or `Draft → Blocked → Fallback`. For blocked drafts, an interactive reveal lets reviewers view the struck-through draft to see what the model wanted to say and why it was intercepted.

### 3. Nudge Court (Suppression as Proof of False-Positive Control)
- **Why:** An alert engine that fires too often causes dangerous cognitive overload. False-positive suppression is the primary proof of quality.
- **How:** The Nudge Court displays avoided alerts with explicit reason codes (`cooldown 20s`, `duplicate`, `below confidence 0.62`, `topic_grouped`, `noisy_audio_guard`).

### 4. 3-Pane Localization Workbench
- **Why:** Proves that *adaptation ≠ translation*.
- **How:** Side-by-side contrast of:
  1. Neutral Intent
  2. Literal English Translation (rejected for being cold and adversarial)
  3. Authentic Localized Final with linguistic annotations explaining honorifics (Bapak/Ibu, Po/Opo), financial vernacular (angsuran, cicilan, jatuh tempo), and payment channels (GCash, Indomaret).

---

## 3. Technology Stack & Tradeoffs

| Technology | Selection | Alternative Rejected & Rationale |
|---|---|---|
| **Framework** | Vite + React 19 + TypeScript | Next.js SSR was rejected because this is an internal real-time operational control room requiring zero server hydration overhead. |
| **Styling** | Tailwind CSS + CSS Variables | CSS-in-JS (styled-components) was rejected for bundle weight and runtime CSS injection penalties. |
| **Icons** | Lucide React | FontAwesome was rejected for inconsistent stroke weights; Lucide provides crisp 1.5px/2px control-room icons. |
| **Waveform** | Custom Canvas Web Audio API | Heavy third-party canvas wrappers were rejected in favor of a lean, responsive 60fps canvas visualizer. |
| **Mock Layer** | In-Memory Deterministic Fixtures | Network-intercepted MSW was abstracted behind typed fixtures to ensure 100% offline stability without service worker race conditions. |

---

## 4. Route Map

1. `/` — **Mission Control (Landing Page)**: 30-second proof, 4 deliverable cards, latency strip, "I Don't Know" ledger.
2. `/live` — **Live Nudge Cockpit (Hero)**: 3-column real-time audio, dual-lane transcript, signal timeline, nudge stack, Nudge Court, and latency waterfall.
3. `/kb` — **KB Studio**: 7 sub-tabs (Sources, Pipeline stepper, Cleaning Diff, Dedupe Clusters, PII Shield, Records Table, Time Machine).
4. `/retrieval` — **Retrieval Lab**: Dense/Sparse/Hybrid/Rerank toggle, 12-item Evidence Table with editable reviewer verdicts, No-Answer refusal tests.
5. `/agent` — **Voice Agent Studio**: Telephony stack config, FSM Flow Designer, browser mic test call simulator with real-time checklist and CRM payloads.
6. `/markets` — **Market Packs**: India, Philippines, and Indonesia 3-pane localization workbench, Register Dial & Language Lock, Terminology Glossary, and Fallbacks.
7. `/asr` — **ASR Bench**: Indonesian regional accent matrix (Jakarta, Javanese, Sundanese, Batak), word-level diff inspector, and provider comparison.
8. `/calls` & `/trace/:traceId` — **Call Library & Black Box**: Historical sessions and microsecond flight recorder timeline.
9. `/evaluation` — **Evaluation Suite**: Adversarial red-team suite, 10x load stress simulation, and nudge confusion matrix.
10. `/architecture` — **System Topology**: Interactive multi-lane architecture diagram, technical decisions, and design tokens (`/architecture#design`).
11. `/demo` — **Demo Story Mode**: Presenter runbook with rehearsal timer and step-by-step cue cards.
12. `/gaps` — **Gaps & Compliance**: Transparent log of regulatory review items, data retention, and audio security.
