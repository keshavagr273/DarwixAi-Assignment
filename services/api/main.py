from __future__ import annotations

import time
import uuid
import json
from pathlib import Path
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from services.retrieval.retriever import get_retriever, HybridRetriever
from kb.schema.models import RetrievalResult

# Phase 2: Agent imports
from services.agent.fsm_engine import create_session, get_session, delete_session
from services.agent.tools import (
    retrieve_kb as tool_retrieve_kb,
    create_lead_or_update_crm as tool_crm,
    schedule_callback as tool_callback,
    escalate_human as tool_escalate,
)
from services.agent.market_loader import (
    load_pack,
    list_markets,
    get_disclosures,
    get_localization_examples,
)
from services.agent.system_prompt import build_system_prompt
from services.agent.sentence_gate import get_gate

import yaml

app = FastAPI(
    title="PARLEY Voice & Knowledge Operations Platform API",
    version="2.0.0",
    description="Grounded, Multilingual Voice-Operations & Knowledge Base Platform API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SearchRequest(BaseModel):
    query: str
    market: str = "in_en"
    top_k: int = 3
    threshold: float = 0.50
    session_id: Optional[str] = None

class SearchResponse(BaseModel):
    trace_id: str
    query: str
    market: str
    is_refusal: bool
    results: List[RetrievalResult]
    latency_ms: float
    kb_version: str = "v1.1"

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
SNAPSHOT_DIR = ROOT_DIR / "kb" / "snapshots" / "v1.1"
FALLBACKS_PATH = ROOT_DIR / "services" / "agent" / "fallbacks.yaml"
GATE_LOG_PATH = ROOT_DIR / "data" / "evaluation" / "gate_log.jsonl"
CRM_LOG_PATH = ROOT_DIR / "data" / "crm" / "leads.jsonl"
CALLBACK_LOG_PATH = ROOT_DIR / "data" / "crm" / "callbacks.jsonl"

# ─────────────────────────────────────────────────────────────────────────────
# Phase 1: Health + Retrieval + KB endpoints
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/v1/health")
def health():
    return {
        "status": "healthy",
        "service": "parley-api",
        "version": "2.0.0",
        "active_kb_version": "v1.1",
        "phase": "2",
        "timestamp": time.time()
    }

@app.post("/api/v1/retrieval/search", response_model=SearchResponse)
def search_retrieval(req: SearchRequest):
    t_start = time.perf_counter()
    trace_id = f"trace_{uuid.uuid4().hex[:12]}"
    
    retriever = get_retriever()
    results, is_refusal = retriever.search(
        query=req.query,
        market=req.market,
        top_k=req.top_k,
        threshold=req.threshold
    )
    latency_ms = round((time.perf_counter() - t_start) * 1000.0, 2)
    
    return SearchResponse(
        trace_id=trace_id,
        query=req.query,
        market=req.market,
        is_refusal=is_refusal,
        results=results,
        latency_ms=latency_ms,
        kb_version="v1.1"
    )

@app.get("/api/v1/kb/records")
def list_records():
    rec_file = SNAPSHOT_DIR / "records.json"
    if rec_file.exists():
        return json.loads(rec_file.read_text(encoding="utf-8"))
    return []

@app.get("/api/v1/kb/issues")
def list_issues():
    issues_file = SNAPSHOT_DIR / "issues.json"
    if issues_file.exists():
        return json.loads(issues_file.read_text(encoding="utf-8"))
    return []

@app.get("/api/v1/kb/diff")
def get_snapshot_diff():
    diff_file = SNAPSHOT_DIR / "diff_report.json"
    if diff_file.exists():
        return json.loads(diff_file.read_text(encoding="utf-8"))
    return {}

# ─────────────────────────────────────────────────────────────────────────────
# Phase 2: Agent Session endpoints
# ─────────────────────────────────────────────────────────────────────────────

class CreateSessionRequest(BaseModel):
    market: str = "in_en"

class TurnRequest(BaseModel):
    session_id: str
    user_input: str
    slots: Optional[Dict[str, Any]] = None

class CRMRequest(BaseModel):
    session_id: str
    customer_name: str
    phone_number: str
    market: str = "in_en"
    slots: Optional[Dict[str, Any]] = None
    disposition: str = "interested"
    notes: Optional[str] = None

class CallbackRequest(BaseModel):
    session_id: str
    phone_number: str
    customer_name: str
    preferred_time: Optional[str] = None
    market: str = "in_en"

class EscalationRequest(BaseModel):
    session_id: str
    reason: str
    market: str = "in_en"
    customer_name: Optional[str] = None
    phone_number: Optional[str] = None

class GateCheckRequest(BaseModel):
    sentence: str
    chunks: List[Dict[str, Any]] = []
    session_id: str = "api_check"
    turn_number: int = 0


@app.post("/api/v1/agent/sessions")
def create_agent_session(req: CreateSessionRequest):
    """Create a new dialogue session for the agent."""
    fsm = create_session(req.market)
    return {
        "session_id": fsm.session.session_id,
        "market": req.market,
        "current_state": fsm.session.current_state,
        "created_at": fsm.session.created_at,
    }


@app.post("/api/v1/agent/sessions/{session_id}/turn")
def process_turn(session_id: str, req: TurnRequest):
    """Process one dialogue turn — detect intent and advance state machine."""
    fsm = get_session(session_id)
    if not fsm:
        raise HTTPException(status_code=404, detail=f"Session {session_id!r} not found")
    
    t_start = time.perf_counter()
    intent = fsm.detect_intent(req.user_input)
    result = fsm.transition(intent=intent, slot_updates=req.slots)
    latency_ms = round((time.perf_counter() - t_start) * 1000.0, 2)
    
    return {
        **result,
        "detected_intent": intent,
        "latency_ms": latency_ms,
    }


@app.get("/api/v1/agent/sessions/{session_id}")
def get_agent_session(session_id: str):
    """Get current session state and slot values."""
    fsm = get_session(session_id)
    if not fsm:
        raise HTTPException(status_code=404, detail=f"Session {session_id!r} not found")
    return fsm.to_dict()


@app.delete("/api/v1/agent/sessions/{session_id}")
def end_agent_session(session_id: str):
    """End and clean up a session."""
    deleted = delete_session(session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Session {session_id!r} not found")
    return {"status": "deleted", "session_id": session_id}


@app.post("/api/v1/agent/retrieve")
def agent_retrieve(req: SearchRequest):
    """retrieve_kb tool endpoint: KB retrieval with session context."""
    result = tool_retrieve_kb(
        query=req.query,
        market=req.market,
        top_k=req.top_k,
        threshold=req.threshold,
        session_id=req.session_id,
    )
    return result


@app.post("/api/v1/agent/crm/lead")
def create_crm_lead(req: CRMRequest):
    """create_lead_or_update_crm tool endpoint."""
    result = tool_crm(
        session_id=req.session_id,
        customer_name=req.customer_name,
        phone_number=req.phone_number,
        market=req.market,
        slots=req.slots,
        disposition=req.disposition,
        notes=req.notes,
    )
    return result


@app.post("/api/v1/agent/crm/callback")
def create_callback(req: CallbackRequest):
    """schedule_callback tool endpoint."""
    result = tool_callback(
        session_id=req.session_id,
        phone_number=req.phone_number,
        customer_name=req.customer_name,
        preferred_time=req.preferred_time,
        market=req.market,
    )
    return result


@app.post("/api/v1/agent/escalate")
def escalate(req: EscalationRequest):
    """escalate_human tool endpoint."""
    result = tool_escalate(
        session_id=req.session_id,
        reason=req.reason,
        market=req.market,
        customer_name=req.customer_name,
        phone_number=req.phone_number,
    )
    return result


@app.post("/api/v1/agent/gate/check")
def gate_check(req: GateCheckRequest):
    """Sentence Gate check endpoint — evaluate a single sentence."""
    gate = get_gate()
    outcome = gate.evaluate(
        sentence=req.sentence,
        retrieved_chunks=req.chunks,
        session_id=req.session_id,
        turn_number=req.turn_number,
    )
    return outcome.to_dict()


# ─────────────────────────────────────────────────────────────────────────────
# Phase 2: Market Pack endpoints
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/v1/markets")
def get_markets():
    """List available markets."""
    return {"markets": list_markets()}


@app.get("/api/v1/markets/{market}")
def get_market_pack(market: str):
    """Get full market pack configuration."""
    try:
        pack = load_pack(market)
        return pack
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/api/v1/markets/{market}/system_prompt")
def get_market_system_prompt(market: str):
    """Get the agent system prompt for a market."""
    try:
        prompt = build_system_prompt(market)
        return {"market": market, "system_prompt": prompt}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/api/v1/markets/{market}/fallbacks")
def get_market_fallbacks(market: str):
    """Get fallback phrases for a market."""
    if not FALLBACKS_PATH.exists():
        return {}
    with open(FALLBACKS_PATH, encoding="utf-8") as f:
        fallbacks = yaml.safe_load(f)
    if market not in fallbacks:
        raise HTTPException(status_code=404, detail=f"No fallbacks for market {market!r}")
    return {"market": market, "fallbacks": fallbacks[market]}


@app.get("/api/v1/markets/{market}/localization")
def get_localization(market: str):
    """Get localization examples for a market."""
    try:
        examples = get_localization_examples(market)
        return {"market": market, "examples": examples, "count": len(examples)}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ─────────────────────────────────────────────────────────────────────────────
# Phase 2: Gate log + CRM log read endpoints (for UI/evaluation)
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/v1/gate/log")
def get_gate_log(limit: int = Query(default=50, le=500)):
    """Return recent gate log entries."""
    if not GATE_LOG_PATH.exists():
        return []
    lines = GATE_LOG_PATH.read_text(encoding="utf-8").strip().split("\n")
    lines = [l for l in lines if l.strip()]
    recent = lines[-limit:]
    return [json.loads(l) for l in recent]


@app.get("/api/v1/crm/leads")
def get_crm_leads(limit: int = Query(default=50, le=500)):
    """Return recent CRM lead entries."""
    if not CRM_LOG_PATH.exists():
        return []
    lines = CRM_LOG_PATH.read_text(encoding="utf-8").strip().split("\n")
    lines = [l for l in lines if l.strip()]
    recent = lines[-limit:]
    return [json.loads(l) for l in recent]


@app.get("/api/v1/crm/callbacks")
def get_callbacks(limit: int = Query(default=50, le=500)):
    """Return recent scheduled callbacks."""
    if not CALLBACK_LOG_PATH.exists():
        return []
    lines = CALLBACK_LOG_PATH.read_text(encoding="utf-8").strip().split("\n")
    lines = [l for l in lines if l.strip()]
    recent = lines[-limit:]
    return [json.loads(l) for l in recent]

