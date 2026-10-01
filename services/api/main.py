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

app = FastAPI(
    title="PARLEY Voice & Knowledge Operations Platform API",
    version="1.0.0",
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

@app.get("/api/v1/health")
def health():
    return {
        "status": "healthy",
        "service": "parley-api",
        "version": "1.0.0",
        "active_kb_version": "v1.1",
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
