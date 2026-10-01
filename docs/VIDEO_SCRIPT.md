# PARLEY Walkthrough Video Script

**Recommended Length: 8-12 Minutes**

## 1. System Overview (0:00 - 2:00)
- "Hi, I'm presenting PARLEY, a multilingual, hallucination-free voice and knowledge operations platform built for the insurance and finance sector."
- Show the **Mission Control** dashboard. Point out the volume of processed documents, total calls handled, and the refusal rate.
- Explain the overall value proposition: Safe, compliant, and deeply integrated with real customer data.

## 2. Architecture & Design Decisions (2:00 - 3:30)
- Open `docs/ARCHITECTURE.md`.
- Briefly explain the separation of concerns:
  - **FastAPI Backend**: Handles logic, RAG, and WebSockets.
  - **React Frontend**: Connects directly to the browser's Web Speech API for zero-latency local prototyping.
  - **Sentence Gate**: The fail-closed filter that prevents LLM hallucinations.
  - **FSM (Finite State Machine)**: Forces the LLM to follow regulatory flows.

## 3. Knowledge Base & Voice Agent Flow (3:30 - 6:00)
- Go to the **Voice Agent** UI Tab.
- Start a test call (MOCK mode).
- Walk through a standard call flow:
  1. *Greeting & Verification* (FSM enforced).
  2. *Disclosure* (FSM enforced).
  3. *Retrieval*: User asks about grace periods.
- Point to the **Sentence Gate Strip** on the UI.
  - Show the citation chip ("Every bot sentence has a receipt").
  - Click the citation chip to open the **Receipt Drawer** and prove the answer came from the PDF chunks.
- Try an out-of-scope question (e.g., "What about Bitcoin?").
  - Show how the agent strictly refuses and triggers the fallback phrasing.

## 4. Multilingual & Live Nudges (6:00 - 9:00)
- Switch the Voice Agent market to **Philippines (`ph_tl`)**.
- Start a call and highlight the *Taglish* usage and the proper honorifics (`po`/`opo`).
- Switch to the **Live Nudge Cockpit** tab.
- Explain the **Streaming Insights Engine**.
- Click the **"1. Cross-Sell"** scenario and watch the real-time nudge pop up in the supervisor view.
- Click the **"4. Noisy Ambiguous Call"** scenario. Show that NO nudges pop up because the duplicate suppression and confidence threshold successfully filtered the low-value noise.

## 5. Limitations & Production Plan (9:00 - 10:00)
- Wrap up by acknowledging this is a prototype.
- Outline the next steps:
  - Moving from Web Speech API to LiveKit/Twilio RTP streams.
  - Replacing the heuristic insights engine with a locally hosted Llama-3-8B classifier on vLLM.
  - Improving ASR tuning for deep regional accents like Javanese.
- Thank the reviewer for their time.
