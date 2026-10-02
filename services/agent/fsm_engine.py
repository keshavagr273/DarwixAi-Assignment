"""Dialogue FSM engine for PARLEY Voice Agent.

Loads dialogue_fsm.yaml and manages per-session state transitions,
slot collection, and qualification rule evaluation.
"""
from __future__ import annotations

import re
import uuid
import json
import time
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

import yaml

FSM_YAML = Path(__file__).parent / "dialogue_fsm.yaml"
_FSM: Optional[Dict[str, Any]] = None


def _normalize_transitions(states: Dict[str, Any]) -> Dict[str, Any]:
    """YAML 'on:' is parsed as Python True. Normalize all transition 'on' keys."""
    for state_def in states.values():
        if isinstance(state_def, dict) and "transitions" in state_def:
            normalized = []
            for t in state_def["transitions"]:
                if isinstance(t, dict):
                    # YAML 'on' → Python True; convert back to string 'on'
                    new_t = {}
                    for k, v in t.items():
                        if k is True:
                            new_t["on"] = v
                        else:
                            new_t[k] = v
                    normalized.append(new_t)
                else:
                    normalized.append(t)
            state_def["transitions"] = normalized
    return states


def _load_fsm() -> Dict[str, Any]:
    global _FSM
    if _FSM is None:
        with open(FSM_YAML, encoding="utf-8") as f:
            _FSM = yaml.safe_load(f)
        _FSM["states"] = _normalize_transitions(_FSM["states"])
    return _FSM


@dataclass
class DialogueSession:
    session_id: str = field(default_factory=lambda: f"sess_{uuid.uuid4().hex[:10]}")
    market: str = "in_en"
    current_state: str = "GREETING"
    previous_state: Optional[str] = None
    slots: Dict[str, Any] = field(default_factory=dict)
    disposition: Optional[str] = None
    is_terminal: bool = False
    turn_count: int = 0
    created_at: float = field(default_factory=time.time)
    crm_lead_id: Optional[str] = None
    callback_scheduled_at: Optional[str] = None
    escalation_reason: Optional[str] = None
    gate_blocks: int = 0
    history: List[Dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class DialogueFSM:
    """Manages dialogue state machine for a single session."""

    def __init__(self, market: str = "in_en"):
        self.fsm = _load_fsm()
        self.states: Dict[str, Any] = self.fsm["states"]
        self.qual_rules: Dict[str, Any] = self.fsm.get("qualification_rules", {})
        self.escalation_triggers: List[Dict[str, Any]] = self.fsm.get("escalation_triggers", [])
        self.session = DialogueSession(market=market)

    def get_current_state(self) -> Dict[str, Any]:
        return self.states.get(self.session.current_state, {})

    def detect_intent(self, user_input: str) -> str:
        """Rule-based intent detection from user input text."""
        text = user_input.lower().strip()

        # Check escalation triggers first
        for trigger in self.escalation_triggers:
            pattern = trigger["pattern"]
            if re.search(pattern, text, re.IGNORECASE):
                return "human_request"

        # Intent patterns
        if self.session.current_state == "GREETING" and re.search(r"(yes|speaking|this is he|this is she|correct|right|haan|ji|ako nga|totoo|benar|betul|saya sendiri|i am|it is me)", text):
            return "name_confirmed"
        if self.session.current_state == "COMPLIANCE_DISCLOSURE" and re.search(r"(ok|okay|sure|go on|proceed|no issue|yes|alright|fine|continue|yeah)", text):
            return "disclosure_acknowledged"

        if re.search(r"not interested|no thank|don.t (want|need)|not now", text):
            return "not_interested"
        if re.search(r"call.?back|call me (later|again|back)|another time", text):
            return "callback_requested"
        if re.search(r"how (much|many)|what is|what are|tell me|explain|details about", text):
            return "question_asked"
        if re.search(r"(interested|sounds good|tell me more|yes|sure|okay|proceed)", text):
            return "interested"
        if re.search(r"too expensive|can.t afford|not affordable|price is high|costly", text):
            return "objection_raised"
        if re.search(r"(wrong number|you.ve got|you have the wrong|mistake)", text):
            return "name_rejected"

        return "continue"

    def evaluate_qualification(self) -> Tuple[bool, Optional[str]]:
        """
        Evaluate qualification rules for the current market.
        Returns (is_qualified, fail_state).
        """
        rules = self.qual_rules.get(self.session.market, {})
        slots = self.session.slots

        age = slots.get("age")
        if age is not None:
            age_min = rules.get("age_min", 18)
            age_max = rules.get("age_max", 70)
            if not (age_min <= int(age) <= age_max):
                return False, "NOT_ELIGIBLE"

        # Soft income check (optional, won't hard-fail)
        annual_income = slots.get("annual_income")
        monthly_income = slots.get("monthly_income")
        market = self.session.market

        if market == "in_en" and annual_income is not None:
            min_income = rules.get("annual_income_min", 120000)
            if float(annual_income) < min_income:
                return False, "LOW_INCOME_SOFT_END"
        elif market in ("ph_tl", "id_id") and monthly_income is not None:
            min_income = rules.get("monthly_income_min", 10000)
            if float(monthly_income) < min_income:
                return False, "LOW_INCOME_SOFT_END"

        return True, None

    def transition(self, intent: str, slot_updates: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Process an intent, update slots, apply qualification rules,
        and transition to next state. Returns response context dict.
        """
        if self.session.is_terminal:
            return {"error": "Session is already terminated", "state": self.session.current_state}

        self.session.turn_count += 1
        if slot_updates:
            self.session.slots.update(slot_updates)

        current_def = self.get_current_state()
        transitions = current_def.get("transitions", [])

        # If in QUALIFICATION state, evaluate rules
        if self.session.current_state == "QUALIFICATION" and self.session.slots.get("age"):
            qualified, fail_state = self.evaluate_qualification()
            if not qualified and fail_state:
                intent = "not_eligible" if fail_state == "NOT_ELIGIBLE" else "low_income"

        # Find matching transition
        next_state = None
        for t in transitions:
            if t["on"] == intent:
                next_state = t["to"]
                break

        if next_state is None:
            # No explicit transition; default to staying in current state
            next_state = self.session.current_state

        # Handle _PREVIOUS pseudo-state
        if next_state == "_PREVIOUS":
            next_state = self.session.previous_state or "PRODUCT_PITCH"

        # Record history
        self.session.history.append({
            "turn": self.session.turn_count,
            "from_state": self.session.current_state,
            "intent": intent,
            "to_state": next_state,
            "timestamp": time.time()
        })

        self.session.previous_state = self.session.current_state
        self.session.current_state = next_state

        # Check if terminal
        new_state_def = self.states.get(next_state, {})
        if new_state_def.get("terminal"):
            self.session.is_terminal = True
            self.session.disposition = new_state_def.get("disposition", "unknown")

        return {
            "session_id": self.session.session_id,
            "state": self.session.current_state,
            "previous_state": self.session.previous_state,
            "is_terminal": self.session.is_terminal,
            "disposition": self.session.disposition,
            "slots": self.session.slots,
            "required_slots": new_state_def.get("required_slots", []),
            "actions": new_state_def.get("actions", []),
            "turn_count": self.session.turn_count,
        }

    def set_slot(self, key: str, value: Any) -> None:
        self.session.slots[key] = value

    def increment_gate_blocks(self) -> None:
        self.session.gate_blocks += 1

    def to_dict(self) -> Dict[str, Any]:
        return self.session.to_dict()


# In-memory session store (for API layer)
_SESSIONS: Dict[str, DialogueFSM] = {}


def create_session(market: str = "in_en") -> DialogueFSM:
    fsm = DialogueFSM(market=market)
    _SESSIONS[fsm.session.session_id] = fsm
    return fsm


def get_session(session_id: str) -> Optional[DialogueFSM]:
    return _SESSIONS.get(session_id)


def delete_session(session_id: str) -> bool:
    if session_id in _SESSIONS:
        del _SESSIONS[session_id]
        return True
    return False
