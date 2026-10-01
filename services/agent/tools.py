"""Agent tools: retrieve_kb, create_lead_or_update_crm, schedule_callback, escalate_human."""
from __future__ import annotations

import uuid
import json
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from services.retrieval.retriever import get_retriever

# ---------------------------------------------------------------------------
# Path for persisted CRM / callback / lead data
# ---------------------------------------------------------------------------
DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
CRM_LOG = DATA_DIR / "crm" / "leads.jsonl"
CALLBACK_LOG = DATA_DIR / "crm" / "callbacks.jsonl"
ESCALATION_LOG = DATA_DIR / "crm" / "escalations.jsonl"
OPT_OUT_LOG = DATA_DIR / "crm" / "opt_outs.jsonl"


def _append_jsonl(path: Path, record: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")


# ---------------------------------------------------------------------------
# Tool 1: retrieve_kb
# ---------------------------------------------------------------------------

def retrieve_kb(
    query: str,
    market: str = "in_en",
    top_k: int = 3,
    threshold: float = 0.50,
    session_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Retrieve grounded answers from the KB.
    Returns result dict including chunks and is_refusal flag.
    """
    t_start = time.perf_counter()
    retriever = get_retriever()
    results, is_refusal = retriever.search(
        query=query,
        market=market,
        top_k=top_k,
        threshold=threshold,
    )
    latency_ms = round((time.perf_counter() - t_start) * 1000.0, 2)

    # Convert RetrievalResult objects to dicts for serialization
    chunks = []
    citations = []
    for r in results:
        chunk_dict = {
            "record_id": r.record_id,
            "text": r.text,
            "content": r.text,
            "score": r.score,
            "version": r.kb_version,
            "source": r.source_ref,
            "source_display": r.source_ref,
            "citation": r.citation,
        }
        chunks.append(chunk_dict)
        citations.append(r.citation)

    return {
        "query": query,
        "market": market,
        "is_refusal": is_refusal,
        "results": chunks,
        "citations": citations,
        "latency_ms": latency_ms,
        "kb_version": "v1.1",
        "session_id": session_id,
    }


# ---------------------------------------------------------------------------
# Tool 2: create_lead_or_update_crm
# ---------------------------------------------------------------------------

def create_lead_or_update_crm(
    session_id: str,
    customer_name: str,
    phone_number: str,
    market: str = "in_en",
    slots: Optional[Dict[str, Any]] = None,
    disposition: str = "interested",
    notes: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Create or update a CRM lead record.
    Returns lead_id and status.
    """
    lead_id = f"lead_{uuid.uuid4().hex[:12]}"
    record = {
        "lead_id": lead_id,
        "session_id": session_id,
        "customer_name": customer_name,
        "phone_number": phone_number,
        "market": market,
        "disposition": disposition,
        "slots": slots or {},
        "notes": notes,
        "created_at": time.time(),
        "created_at_iso": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    _append_jsonl(CRM_LOG, record)
    return {
        "tool": "create_lead_or_update_crm",
        "lead_id": lead_id,
        "status": "created",
        "session_id": session_id,
        "message": f"Lead {lead_id} created for {customer_name}",
    }


# ---------------------------------------------------------------------------
# Tool 3: schedule_callback
# ---------------------------------------------------------------------------

def schedule_callback(
    session_id: str,
    phone_number: str,
    customer_name: str,
    preferred_time: Optional[str] = None,
    market: str = "in_en",
    reason: str = "customer_request",
) -> Dict[str, Any]:
    """
    Schedule a callback for the customer.
    Returns callback_id and confirmation.
    """
    callback_id = f"cb_{uuid.uuid4().hex[:10]}"
    record = {
        "callback_id": callback_id,
        "session_id": session_id,
        "customer_name": customer_name,
        "phone_number": phone_number,
        "preferred_time": preferred_time or "flexible",
        "market": market,
        "reason": reason,
        "status": "scheduled",
        "created_at": time.time(),
        "created_at_iso": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    _append_jsonl(CALLBACK_LOG, record)
    return {
        "tool": "schedule_callback",
        "callback_id": callback_id,
        "status": "scheduled",
        "session_id": session_id,
        "preferred_time": preferred_time or "flexible",
        "message": f"Callback {callback_id} scheduled for {customer_name}",
    }


# ---------------------------------------------------------------------------
# Tool 4: escalate_human
# ---------------------------------------------------------------------------

def escalate_human(
    session_id: str,
    reason: str,
    market: str = "in_en",
    customer_name: Optional[str] = None,
    phone_number: Optional[str] = None,
    current_state: Optional[str] = None,
    slots: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Trigger escalation to a human agent.
    Persists escalation record and returns webhook payload.
    """
    escalation_id = f"esc_{uuid.uuid4().hex[:10]}"
    record = {
        "escalation_id": escalation_id,
        "session_id": session_id,
        "reason": reason,
        "market": market,
        "customer_name": customer_name,
        "phone_number": phone_number,
        "state_at_escalation": current_state,
        "slots": slots or {},
        "status": "escalated",
        "created_at": time.time(),
        "created_at_iso": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    _append_jsonl(ESCALATION_LOG, record)

    # Webhook payload (would be sent to real webhook in production)
    webhook_payload = {
        "event": "agent.escalation",
        "escalation_id": escalation_id,
        "session_id": session_id,
        "reason": reason,
        "market": market,
        "customer_name": customer_name,
        "phone_number": phone_number,
    }

    return {
        "tool": "escalate_human",
        "escalation_id": escalation_id,
        "status": "transferred",
        "session_id": session_id,
        "webhook_payload": webhook_payload,
        "message": f"Session {session_id} escalated to human: {reason}",
    }


# ---------------------------------------------------------------------------
# Tool 5: log_opt_out
# ---------------------------------------------------------------------------

def log_opt_out(
    session_id: str,
    phone_number: Optional[str] = None,
    market: str = "in_en",
) -> Dict[str, Any]:
    """Log DNC opt-out for the customer."""
    record = {
        "session_id": session_id,
        "phone_number": phone_number,
        "market": market,
        "opt_out_at": time.time(),
        "opt_out_at_iso": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    _append_jsonl(OPT_OUT_LOG, record)
    return {"tool": "log_opt_out", "status": "recorded", "session_id": session_id}
