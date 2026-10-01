from __future__ import annotations

from typing import List, Optional, Literal, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

SourceType = Literal["website", "pdf", "docx", "form", "table", "playbook", "brochure", "policy_wording"]
IssueSeverity = Literal["critical", "high", "medium", "low"]
IssueType = Literal["conflict", "typo", "impossible_date", "extraction"]
SourceStatus = Literal["ok", "quarantined", "failed"]
Verdict = Literal["PASS", "FAIL", "PARTIAL", "REFUSED"]

class KbSource(BaseModel):
    source_id: str
    type: SourceType
    uri: str
    section: Optional[str] = None
    fetched_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    http_status: int = 200
    content_hash: str
    extraction_health: float = 1.0
    parse_method: str = "direct_parser"
    status: SourceStatus = "ok"
    reason_code: Optional[str] = None

class KbRecord(BaseModel):
    record_id: str
    kb_version: str
    title: str
    content: str
    category: str
    category_path: str
    market: str = "in_en"
    lang: str = "en"
    audience: str = "customer"
    source_id: Optional[str] = None
    version: str = "1.0"
    valid_from: Optional[str] = None
    valid_to: Optional[str] = None
    supersedes: Optional[str] = None
    duplicate_of: Optional[str] = None
    pii: bool = False
    pii_types: List[str] = Field(default_factory=list)
    confidence: float = 1.0
    content_hash: str
    citation_display: str

class KbChunk(BaseModel):
    chunk_id: str
    record_id: str
    kb_version: str
    chunk_index: int
    heading_path: str
    text: str
    token_count: int
    embedding_model: str = "BAAI/bge-m3"
    embedding_version: str = "1.0"
    metadata: Dict[str, Any] = Field(default_factory=dict)

class KbIssue(BaseModel):
    issue_id: str
    severity: IssueSeverity
    type: IssueType
    source_ids: List[str] = Field(default_factory=list)
    resolution_policy: str
    resolved: bool = False
    description: str

class RetrievalQuery(BaseModel):
    id: str
    query: str
    market: str = "in_en"
    category: Optional[str] = None
    expected_record_id: Optional[str] = None
    should_refuse: bool = False
    notes: Optional[str] = None

class RetrievalResult(BaseModel):
    chunk_id: str
    record_id: str
    kb_version: str
    title: str
    text: str
    heading_path: str
    score: float
    dense_score: float
    sparse_score: float
    rerank_score: float
    citation: str
    source_ref: str

class EvidenceItem(BaseModel):
    evidence_id: str
    query: str
    market: str
    retrieved_record_ids: List[str]
    source_refs: List[str]
    explanation: str
    verdict: Verdict
    latency_ms: float
