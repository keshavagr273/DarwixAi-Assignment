from __future__ import annotations

import re
import json
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
import time

from kb.schema.models import KbRecord, KbChunk, RetrievalResult, EvidenceItem
from kb.pipeline.embed_index import HybridSearchIndex, MIN_RERANK_THRESHOLD
from kb.pipeline.normalizer import load_glossary, normalize_terminology

class HybridRetriever:
    def __init__(self, snapshot_dir: Path, glossary_path: Optional[Path] = None):
        self.snapshot_dir = snapshot_dir
        self.records_map: Dict[str, KbRecord] = {}
        self.chunks: List[KbChunk] = []
        
        # Load glossary
        root = snapshot_dir.parent.parent.parent
        self.glossary = load_glossary(glossary_path or (root / "kb" / "schema" / "glossary.yaml"))
        
        self._load_snapshot()
        self.index = HybridSearchIndex(self.chunks, self.records_map)

    def _load_snapshot(self):
        records_file = self.snapshot_dir / "records.json"
        chunks_file = self.snapshot_dir / "chunks.json"
        
        if records_file.exists():
            data = json.loads(records_file.read_text(encoding="utf-8"))
            for r in data:
                rec = KbRecord(**r)
                self.records_map[rec.record_id] = rec
                
        if chunks_file.exists():
            data = json.loads(chunks_file.read_text(encoding="utf-8"))
            self.chunks = [KbChunk(**c) for c in data]

    def rewrite_query(self, query: str, market: str) -> str:
        expanded = query.lower()
        if market == "ph_tl":
            expanded = expanded.replace("palugit", "grace period")
            expanded = expanded.replace("bayad sa renewal", "renewal premium payment")
            expanded = expanded.replace("hulog", "premium payment")
            expanded = expanded.replace("mag-lapse", "policy lapse")
            expanded = expanded.replace("bago", "before")
            expanded = expanded.replace("kung late", "if overdue")
            expanded = expanded.replace("magkano po ba ang", "how many days")
        elif market == "id_id":
            expanded = expanded.replace("masa tenggang", "grace period")
            expanded = expanded.replace("pembayaran premi", "premium payment")
            expanded = expanded.replace("cicilan", "instalment")
            expanded = expanded.replace("angsuran", "instalment")
            expanded = expanded.replace("tidak aktif atau hangus", "policy lapse")
            expanded = expanded.replace("jatuh tempo", "due date")
            expanded = expanded.replace("berapa hari", "how many days")
            expanded = expanded.replace("sebelum", "before")
            expanded = expanded.replace("polis asuransi", "insurance policy")
            
        return expanded

    def search(self, query: str, market: str = "in_en", top_k: int = 3, threshold: float = MIN_RERANK_THRESHOLD) -> Tuple[List[RetrievalResult], bool]:
        # Out-of-Scope entity check: detect specific unsupported nouns (crypto, pet, gold, pilot coupons)
        unsupported_keywords = {
            "bitcoin", "crypto", "cryptocurrency", "ethereum", "usdt",
            "gold", "dubai", "bullion",
            "pet", "dogs", "cats", "exotic", "cosmetic",
            "pilot", "coupon", "voucher_discount_code", "secret"
        }
        q_lower = query.lower()
        if any(re.search(rf"\b{re.escape(kw)}\b", q_lower) for kw in unsupported_keywords):
            # Strict fail-closed refusal on out-of-scope requests
            return [], True

        rewritten_query = self.rewrite_query(query, market)
        return self.index.search(rewritten_query, top_k=top_k, min_threshold=threshold)

# Singleton retriever instance for services
_GLOBAL_RETRIEVER: Optional[HybridRetriever] = None

def get_retriever() -> HybridRetriever:
    global _GLOBAL_RETRIEVER
    if _GLOBAL_RETRIEVER is None:
        root = Path(__file__).resolve().parent.parent.parent
        active_snapshot = root / "kb" / "snapshots" / "v1.1"
        _GLOBAL_RETRIEVER = HybridRetriever(active_snapshot)
    return _GLOBAL_RETRIEVER
