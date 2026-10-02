"""
Groq LLM service for PARLEY.

Used for:
  1. Agent response generation: given retrieved KB chunks + FSM context, build
     a grounded spoken reply using Groq's fast inference.
  2. Intent detection fallback: when FSM heuristics are insufficient, call
     LLM to classify intent.
  3. Tier-2 signal extraction: given a transcript segment, detect compliance
     risk, frustration level, and missed cross-sell opportunity with
     structured JSON output.

All calls respect the "no hardcoded facts in prompts" rule — factual content
only arrives via KB retrieval; prompts only carry persona, tone, and logic.

Model: openai/gpt-oss-120b on Groq (or any Groq-compatible model)
Latency target: < 1.5s for agent turns, < 2.5s for signal extraction
"""
from __future__ import annotations

import json
import os
import time
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv

load_dotenv()

# ─────────────────────────────────────────────────────────────────────────────
# Lazy import Groq SDK
# ─────────────────────────────────────────────────────────────────────────────

def _get_groq_client():
    """Lazy-load Groq client to avoid import errors in test environments."""
    try:
        from groq import Groq
        api_key = os.environ.get("GROQ_API_KEY", "")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY not configured.")
        return Groq(api_key=api_key)
    except ImportError:
        raise RuntimeError("groq package not installed. Run: pip install groq")


_GROQ_MODEL = os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b")

# ─────────────────────────────────────────────────────────────────────────────
# 1. Agent Response Generation
# ─────────────────────────────────────────────────────────────────────────────

AGENT_SYSTEM_TEMPLATE = """\
You are {agent_name}, a professional voice agent for SecureLife Insurance
operating in the {market_display} market.

Language: {language}. Speak naturally in this language. Use localized expressions,
not literal English translation. Match the customer's register (formal vs colloquial).

CURRENT CONVERSATION STATE: {dialogue_state}
REQUIRED INFORMATION TO COLLECT: {required_slots}

CRITICAL RULES:
- If REQUIRED INFORMATION TO COLLECT is not empty, you MUST politely ask the customer for this information (e.g. age) to proceed. Do NOT use the fallback phrase if you are just collecting information.
- Answer ONLY from the provided KB context below. Do not add any fact, rate,
  date, or policy detail that is not explicitly in the KB context.
- If the customer asks a factual question and the KB context does not contain the answer, say "I don't have that
  information right now" in the customer's language, and offer to connect them
  with a specialist.
- Be concise: 1-3 sentences maximum for a voice response.
- Never invent premium amounts, grace periods, or eligibility criteria.
- If calling about renewal, always mention the policy number (if available).

KB CONTEXT:
{kb_context}

CONVERSATION SO FAR:
{history}
"""


def generate_agent_response(
    user_input: str,
    kb_chunks: List[Dict[str, Any]],
    market: str = "in_en",
    agent_name: str = "Maya",
    conversation_history: Optional[List[Dict[str, str]]] = None,
    max_tokens: int = 350,
    dialogue_state: str = "",
    required_slots: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Generate a grounded agent voice response using Groq LLM.
    Returns dict with: text, latency_ms, model, is_groq, tokens_used
    """
    MARKET_DISPLAY = {
        "in_en": "India (English)",
        "ph_tl": "Philippines (Filipino/Taglish)",
        "id_id": "Indonesia (Bahasa Indonesia)",
    }
    LANGUAGE = {
        "in_en": "Indian English",
        "ph_tl": "Filipino/Taglish (mix of Filipino and English naturally)",
        "id_id": "Bahasa Indonesia (formal + colloquial as appropriate)",
    }

    kb_context = "\n\n".join(
        f"[{c.get('record_id', 'unknown')}] {c.get('text', c.get('content', ''))}"
        for c in kb_chunks[:3]
    ) if kb_chunks else "No relevant KB information found for this query."

    history_str = ""
    if conversation_history:
        for turn in conversation_history[-4:]:  # last 2 exchanges
            role = "Customer" if turn.get("role") == "user" else "Agent"
            history_str += f"{role}: {turn.get('content', '')}\n"

    req_slots_str = ", ".join(required_slots) if required_slots else "None"

    system_msg = AGENT_SYSTEM_TEMPLATE.format(
        agent_name=agent_name,
        market_display=MARKET_DISPLAY.get(market, market),
        language=LANGUAGE.get(market, "English"),
        kb_context=kb_context,
        history=history_str or "Start of conversation",
        dialogue_state=dialogue_state,
        required_slots=req_slots_str,
    )

    t_start = time.perf_counter()
    try:
        client = _get_groq_client()
        completion = client.chat.completions.create(
            model=_GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": user_input},
            ],
            max_tokens=max_tokens,
            temperature=0.3,
            stream=False,
        )
        text = completion.choices[0].message.content.strip()
        tokens = completion.usage.total_tokens if completion.usage else 0
        latency_ms = round((time.perf_counter() - t_start) * 1000, 1)
        return {
            "text": text,
            "latency_ms": latency_ms,
            "model": _GROQ_MODEL,
            "is_groq": True,
            "tokens_used": tokens,
        }
    except Exception as e:
        latency_ms = round((time.perf_counter() - t_start) * 1000, 1)
        # Graceful fallback: return first KB chunk as spoken response
        fallback_text = kb_chunks[0].get("text", "") if kb_chunks else ""
        if not fallback_text:
            fallback_text = "I'm sorry, I don't have that information available right now."
        return {
            "text": fallback_text[:300],
            "latency_ms": latency_ms,
            "model": "fallback",
            "is_groq": False,
            "error": str(e),
            "tokens_used": 0,
        }


# ─────────────────────────────────────────────────────────────────────────────
# 2. Intent Detection (LLM fallback)
# ─────────────────────────────────────────────────────────────────────────────

INTENT_SYSTEM = """\
Classify the customer's voice utterance into exactly one intent label.
Output ONLY a JSON object with keys: "intent" and "confidence" (0.0-1.0).
No other text.

Valid intents:
  greeting, confirm_renewal, objection_price, objection_timing,
  request_info, escalate_human, out_of_scope, provide_details,
  express_payment_difficulty, express_frustration, goodbye

Example output: {"intent": "objection_price", "confidence": 0.91}
"""


def detect_intent_llm(user_input: str, market: str = "in_en") -> Dict[str, Any]:
    """
    Use Groq to classify customer intent when FSM heuristics are insufficient.
    Returns dict with: intent, confidence, latency_ms, is_groq
    """
    import re
    t_start = time.perf_counter()
    try:
        client = _get_groq_client()
        completion = client.chat.completions.create(
            model=_GROQ_MODEL,
            messages=[
                {"role": "system", "content": INTENT_SYSTEM},
                {"role": "user", "content": f"Market: {market}\nUtterance: {user_input}"},
            ],
            response_format={"type": "json_object"},
            max_tokens=350,
            temperature=0.0,
        )
        raw = completion.choices[0].message.content.strip()
        try:
            result = json.loads(raw)
        except Exception:
            # Fallback regex extraction of JSON object
            match = re.search(r"\{.*?\}", raw, re.DOTALL)
            if match:
                result = json.loads(match.group(0))
            else:
                raise
        latency_ms = round((time.perf_counter() - t_start) * 1000, 1)
        return {
            "intent": result.get("intent", "out_of_scope"),
            "confidence": result.get("confidence", 0.7),
            "latency_ms": latency_ms,
            "is_groq": True,
        }
    except Exception as e:
        latency_ms = round((time.perf_counter() - t_start) * 1000, 1)
        return {
            "intent": "out_of_scope",
            "confidence": 0.5,
            "latency_ms": latency_ms,
            "is_groq": False,
            "error": str(e),
        }


# ─────────────────────────────────────────────────────────────────────────────
# 3. Tier-2 Signal Extraction (for live nudge engine)
# ─────────────────────────────────────────────────────────────────────────────

SIGNAL_SYSTEM = """\
You are a real-time call signal detector for a financial voice agent supervisor.
Analyze the transcript segment and detect signals. Output a JSON array of objects.
Each object must have:
  - "kind": one of ["compliance_gap", "frustration", "payment_difficulty",
                    "cross_sell_opportunity", "callback_request", "topic_shift"]
  - "confidence": float 0.0-1.0
  - "span_text": the exact phrase triggering this signal
  - "tier": "tier2_llm"

Return an empty array [] if no signals detected.
Output ONLY valid JSON, no other text.
"""


def extract_signals_llm(
    transcript_segment: str,
    market: str = "in_en",
    speaker: str = "customer",
) -> List[Dict[str, Any]]:
    """
    Tier-2 LLM signal extraction for compliance, frustration, and opportunity signals.
    Called when tier-1 rule-based detection confidence is below threshold.
    """
    import re
    t_start = time.perf_counter()
    try:
        client = _get_groq_client()
        completion = client.chat.completions.create(
            model=_GROQ_MODEL,
            messages=[
                {"role": "system", "content": SIGNAL_SYSTEM},
                {
                    "role": "user",
                    "content": f"Market: {market}\nSpeaker: {speaker}\nSegment: {transcript_segment}",
                },
            ],
            max_tokens=400,
            temperature=0.0,
        )
        raw = completion.choices[0].message.content.strip()
        try:
            signals = json.loads(raw)
        except Exception:
            match = re.search(r"\[.*?\]", raw, re.DOTALL)
            if match:
                signals = json.loads(match.group(0))
            else:
                signals = []
        latency_ms = round((time.perf_counter() - t_start) * 1000, 1)
        for s in signals:
            s["latency_ms"] = latency_ms
            s["tier"] = "tier2_llm"
        return signals if isinstance(signals, list) else []
    except Exception:
        return []


# ─────────────────────────────────────────────────────────────────────────────
# Health check
# ─────────────────────────────────────────────────────────────────────────────

def groq_ping() -> bool:
    """Quick check that the Groq key is valid."""
    try:
        result = detect_intent_llm("Hello, I'm calling about my policy", "in_en")
        return result.get("is_groq", False)
    except Exception:
        return False
