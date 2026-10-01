# PARLEY Control Room Frontend

Operational command center for grounded, multilingual financial voice operations with real-time live nudges, fail-closed sentence gates, and traceable knowledge base pipelines.

---

## Quick Start

### 1. Install & Run Locally

```bash
cd frontend
npm install
npm run dev
```

The application runs by default in **Mock Mode** on `http://127.0.0.1:5173/` with self-contained, typed fixtures and real-time streaming simulations. Zero backend or API keys required.

### 2. Live Backend Switching

- In the top navigation bar, toggle the environment pill from **MOCK FIXTURES** to **LIVE BACKEND**.
- Or start the dev server with the environment flag:
  ```bash
  VITE_API_MODE=live npm run dev
  ```

---

## Architectural Highlights & User Principles

1. **Zero Gradients ("Not AI" Aesthetic):** Built with strict flat solid colors, crisp 1px borders (`#243041`), Bloomberg/Linear control-room density, and zero glowing blur meshes.
2. **Every Claim Has A Receipt:** Click any citation chip (e.g. `[kb_policy_014 · v1.3 · 0.98]`) across the application to open the **Grounding Receipt Inspector** with exact canonical text and provenance DAG.
3. **Sentence Gate Visualizer:** Displays real-time `Draft → Verified → Spoken` or `Draft → Blocked [Strikethrough] → Fallback`.
4. **Nudge Court:** Proves false-positive suppression by prominently displaying avoided low-value alerts with explicit reason codes (`cooldown`, `duplicate`, `below confidence`, `topic_grouped`).
5. **Localization ≠ Translation:** 3-pane workbench contrasting Neutral Intent, Literal Translation, and Authentic Localized Expressions for India (`in_en`), Philippines (`ph_tl`), and Indonesia (`id_id`).

---

## Route Map

| Route | Page | Purpose |
|---|---|---|
| `/` | **Mission Control** | 30-second executive proof, 4 deliverable cards, live latency strip, "I Don't Know" ledger. |
| `/live` | **Live Nudge Cockpit (Hero)** | 3-column real-time console with WebRTC waveform, streaming transcript, signal timeline, nudge stack, Nudge Court, and latency waterfall. |
| `/kb` | **KB Studio** | 7 sub-tabs: Sources, 9-stage Pipeline Stepper, Cleaning Diff, Dedupe Clusters, PII Shield, Records Table, Time Machine. |
| `/retrieval` | **Retrieval Lab** | 12-item Evidence Table (exportable to CSV), Dense/Sparse/Hybrid/Rerank toggle, and No-Answer refusal tests. |
| `/agent` | **Voice Agent Studio** | Browser test call simulator with live mic, real-time qualification checklist, FSM flow designer, and CRM lead payloads. |
| `/markets` | **Market Packs** | 3-pane localization workbench, Register Dial, Language Lock, Terminology Glossary, and Fallback Sheet. |
| `/asr` | **ASR Bench** | Indonesian regional accent matrix (Jakarta, Javanese, Sundanese, Batak), word-level diff inspector, and provider matrix. |
| `/calls` | **Call Library** | Searchable recorded calls with speaker lanes and grounded rate metrics. |
| `/trace/:traceId` | **Call Black Box** | Microsecond flight recorder waterfall with start/end ms across VAD, ASR, retrieval, LLM, gate, and TTS. |
| `/evaluation` | **Evaluation Suite** | Adversarial red-team defenses, 10x load stress curves, and nudge confusion matrix. |
| `/architecture` | **System Topology** | Multi-lane architecture diagram, technical decisions, and design tokens (`/architecture#design`). |
| `/demo` | **Demo Mode** | Presenter story mode with rehearsal timer and step-by-step cue cards for walkthrough recording. |
| `/gaps` | **Gaps & Compliance** | Transparent log of regulatory review items, data retention, and audio security disclosures. |

---

## Key Keyboard Shortcuts

- `Cmd+K` or `Ctrl+K`: Opens the global **Command Palette** to jump to any page or inspect any KB record.
- `ESC`: Closes the Command Palette or Receipt Drawer.
