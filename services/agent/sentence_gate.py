"""Sentence Gate for PARLEY Voice Agent.

Enforces grounding: every factual bot sentence must either:
  1. Match a retrieved KB chunk (exact-match or entailment), OR
  2. Be a whitelisted non-factual sentence (opener, closer, fallback, disclosure)

Fail-closed: if a sentence cannot be grounded, it is BLOCKED and logged.
Gate outcomes are persisted to data/evaluation/gate_log.jsonl.
"""
from __future__ import annotations

import re
import json
import time
import uuid
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import List, Optional, Tuple, Dict, Any

# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class SentenceGateOutcome:
    gate_id: str = field(default_factory=lambda: f"gate_{uuid.uuid4().hex[:10]}")
    session_id: str = ""
    turn_number: int = 0
    timestamp: float = field(default_factory=time.time)
    sentence: str = ""
    sentence_type: str = "factual"          # factual | procedural | social | disclosure
    verdict: str = "BLOCKED"               # PASSED | BLOCKED
    block_reason: Optional[str] = None
    grounding_source: Optional[str] = None  # record_id@version · source
    similarity_score: float = 0.0
    citations: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


# ---------------------------------------------------------------------------
# Banned fact patterns (automated test greps for these in system prompt)
# ---------------------------------------------------------------------------
BANNED_FACT_PATTERNS = [
    r"grace period is \d+ days",
    r"premium.*is.*INR|PHP|IDR.*\d+",
    r"cover.*up to.*\d+",
    r"interest rate.*\d+\.?\d*\s*%",
    r"sum assured.*\d+",
    r"policy.*expires after \d+ (days|months|years)",
    r"you (can|will) get.*guaranteed",
]

# Non-factual sentence type patterns (these do NOT require KB grounding)
NON_FACTUAL_PATTERNS = [
    # Social openers/closers — use word boundaries
    r"(good (morning|afternoon|evening)|namaste|magandang|selamat)",
    r"\b(thank you|salamat|terima kasih)\b",
    r"(have a (great|wonderful|good|nice)|semoga|mahal kita)",
    r"\b(please hold|please wait|one moment)\b",
    r"\b(absolutely|of course|certainly)\b",  # removed 'sure' — too short, appears in 'assured'
    # Disclosures (mandatory, never blocked)
    r"(this call may be recorded|pembicaraan ini mungkin direkam|ang tawag na ito)",
    r"(regulated by|diawasi oleh|regulado ng)",
    r"(marketing communication)",
    # Fallback/escalation phrases
    r"(let me transfer|i.ll connect|izinkan saya mengalihkan|ililipat ko)",
    r"\b(i don.t have (that|the))\b|(wala akong|saya tidak memiliki)",
    r"(i.d like to arrange|boleh saya atur|maaari ko.*ikonekta)",
    r"\b(outside the scope)\b|(di luar cakupan|hindi.*saklaw)",
    # Acknowledgements — must be at start or standalone
    r"^(i understand|i see|naiintindihan|saya mengerti)",
    r"\b(could you please|could you kindly|pwede po|boleh)\b",
]



def classify_sentence(sentence: str) -> str:
    """Classify a sentence as factual, procedural, social, or disclosure."""
    s = sentence.lower().strip()
    for pattern in NON_FACTUAL_PATTERNS:
        if re.search(pattern, s, re.IGNORECASE):
            return "social"

    # Heuristic: sentences with numbers + units are likely factual claims
    if re.search(r"\d+\s*(days?|months?|years?|%|INR|PHP|IDR|lakh|crore|ribu|juta|libo|milyon)", s):
        return "factual"

    # Sentences that assert product properties
    if re.search(r"\b(offers?|provides?|covers?|includes?|guaranteed|ensures?|pays?)\b", s):
        return "factual"

    return "procedural"


def exact_match_check(sentence: str, chunks: List[Dict[str, Any]], threshold: float = 0.25) -> Tuple[bool, float, Optional[str]]:
    """
    Check if sentence has significant token overlap with any retrieved chunk.
    Returns (matched, score, source_citation).
    """
    s_words = set(re.findall(r"\w+", sentence.lower()))
    if not s_words:
        return False, 0.0, None

    best_score = 0.0
    best_citation = None
    for chunk in chunks:
        c_text = chunk.get("text", "") + " " + chunk.get("content", "")
        c_words = set(re.findall(r"\w+", c_text.lower()))
        if not c_words:
            continue
        # Jaccard-like overlap: intersection / sentence_words
        overlap = len(s_words & c_words) / len(s_words)
        if overlap > best_score:
            best_score = overlap
            record_id = chunk.get("record_id", chunk.get("id", "unknown"))
            version = chunk.get("version", "v1.1")
            source = chunk.get("source_display", chunk.get("source", "KB"))
            best_citation = f"{record_id}@{version} · {source}"

    return best_score >= threshold, best_score, best_citation


def entailment_check(sentence: str, chunks: List[Dict[str, Any]]) -> Tuple[bool, float, Optional[str]]:
    """
    Lightweight entailment check: does any retrieved chunk semantically
    support the key claim in the sentence?
    Uses keyword co-occurrence as a proxy for entailment (no LLM required).
    """
    s_lower = sentence.lower()

    # Extract key claim nouns/numbers
    key_numbers = re.findall(r"\d+\.?\d*", s_lower)
    key_units = re.findall(r"\b(days?|months?|years?|%|percent|lakh|crore|ribu|juta|libo|milyon)\b", s_lower)

    for chunk in chunks:
        c_text = (chunk.get("text", "") + " " + chunk.get("content", "")).lower()

        # If sentence has specific numbers, check that chunk also contains them
        if key_numbers:
            matching_numbers = sum(1 for n in key_numbers if n in c_text)
            if matching_numbers == len(key_numbers):
                matching_units = sum(1 for u in key_units if u in c_text)
                score = 0.6 + (0.2 * matching_units)
                record_id = chunk.get("record_id", chunk.get("id", "unknown"))
                version = chunk.get("version", "v1.1")
                source = chunk.get("source_display", chunk.get("source", "KB"))
                return True, min(score, 1.0), f"{record_id}@{version} · {source}"

    return False, 0.0, None


# Persist gate log
_GATE_LOG_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "evaluation" / "gate_log.jsonl"


def _persist_outcome(outcome: SentenceGateOutcome) -> None:
    _GATE_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(_GATE_LOG_PATH, "a", encoding="utf-8") as f:
        f.write(json.dumps(outcome.to_dict(), ensure_ascii=False) + "\n")


class SentenceGate:
    """
    Evaluates each candidate bot sentence against retrieved KB chunks.

    Usage:
        gate = SentenceGate()
        result = gate.evaluate(
            sentence="The grace period is 30 days.",
            retrieved_chunks=[...],    # from retriever
            session_id="sess_abc",
            turn_number=3,
        )
        if result.verdict == "BLOCKED":
            # Replace with fallback
    """

    def __init__(self, persist: bool = True, exact_threshold: float = 0.25):
        self.persist = persist
        self.exact_threshold = exact_threshold

    def evaluate(
        self,
        sentence: str,
        retrieved_chunks: List[Dict[str, Any]],
        session_id: str = "",
        turn_number: int = 0,
    ) -> SentenceGateOutcome:
        sentence_type = classify_sentence(sentence)

        outcome = SentenceGateOutcome(
            session_id=session_id,
            turn_number=turn_number,
            sentence=sentence,
            sentence_type=sentence_type,
        )

        # Non-factual sentences always pass (social, disclosure, procedural)
        if sentence_type in ("social", "disclosure"):
            outcome.verdict = "PASSED"
            outcome.grounding_source = "whitelist:non-factual"
            outcome.similarity_score = 1.0
            if self.persist:
                _persist_outcome(outcome)
            return outcome

        # Procedural sentences get a lenient pass if no chunks contradict them
        if sentence_type == "procedural" and not retrieved_chunks:
            outcome.verdict = "PASSED"
            outcome.grounding_source = "whitelist:procedural-no-conflict"
            outcome.similarity_score = 0.8
            if self.persist:
                _persist_outcome(outcome)
            return outcome

        # For factual sentences, must be grounded in retrieved chunks
        if not retrieved_chunks:
            outcome.verdict = "BLOCKED"
            outcome.block_reason = "factual-no-chunks: no KB evidence provided"
            if self.persist:
                _persist_outcome(outcome)
            return outcome

        # Try exact match first
        exact_ok, exact_score, exact_citation = exact_match_check(
            sentence, retrieved_chunks, self.exact_threshold
        )
        if exact_ok:
            outcome.verdict = "PASSED"
            outcome.grounding_source = exact_citation
            outcome.similarity_score = exact_score
            outcome.citations = [exact_citation] if exact_citation else []
            if self.persist:
                _persist_outcome(outcome)
            return outcome

        # Try entailment check
        entail_ok, entail_score, entail_citation = entailment_check(sentence, retrieved_chunks)
        if entail_ok:
            outcome.verdict = "PASSED"
            outcome.grounding_source = entail_citation
            outcome.similarity_score = entail_score
            outcome.citations = [entail_citation] if entail_citation else []
            if self.persist:
                _persist_outcome(outcome)
            return outcome

        # Fail-closed: block the sentence
        outcome.verdict = "BLOCKED"
        outcome.similarity_score = exact_score
        outcome.block_reason = (
            f"fail-closed: best exact-match score {exact_score:.3f} < {self.exact_threshold}; "
            f"no entailment match found in {len(retrieved_chunks)} chunks"
        )
        if self.persist:
            _persist_outcome(outcome)
        return outcome

    def evaluate_response(
        self,
        response_text: str,
        retrieved_chunks: List[Dict[str, Any]],
        session_id: str = "",
        turn_number: int = 0,
    ) -> Tuple[str, List[SentenceGateOutcome]]:
        """
        Evaluate all sentences in a response text.
        Replaces blocked sentences with fallback marker.
        Returns (filtered_response, outcomes).
        """
        # Split on sentence boundaries
        sentences = re.split(r"(?<=[.!?])\s+", response_text.strip())
        outcomes: List[SentenceGateOutcome] = []
        filtered_parts: List[str] = []

        for sent in sentences:
            sent = sent.strip()
            if not sent:
                continue
            outcome = self.evaluate(sent, retrieved_chunks, session_id, turn_number)
            outcomes.append(outcome)
            if outcome.verdict == "PASSED":
                filtered_parts.append(sent)
            # BLOCKED sentences are silently omitted; caller should insert fallback

        return " ".join(filtered_parts), outcomes


# Singleton gate
_GATE: Optional[SentenceGate] = None


def get_gate() -> SentenceGate:
    global _GATE
    if _GATE is None:
        _GATE = SentenceGate()
    return _GATE
