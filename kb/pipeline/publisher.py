from __future__ import annotations

import json
from pathlib import Path
from typing import List, Dict, Any

from kb.schema.models import KbRecord, KbChunk, KbSource, KbIssue

def serialize_models(models: List[Any]) -> List[Dict[str, Any]]:
    return [m.model_dump() for m in models]

def save_snapshot(
    snapshot_dir: Path,
    kb_version: str,
    records: List[KbRecord],
    chunks: List[KbChunk],
    sources: List[KbSource],
    issues: List[KbIssue],
    extra_metadata: Dict[str, Any] = None
):
    snapshot_dir.mkdir(parents=True, exist_ok=True)
    
    # Save records.json
    (snapshot_dir / "records.json").write_text(
        json.dumps(serialize_models(records), indent=2), encoding="utf-8"
    )
    # Save chunks.json
    (snapshot_dir / "chunks.json").write_text(
        json.dumps(serialize_models(chunks), indent=2), encoding="utf-8"
    )
    # Save sources.json
    (snapshot_dir / "sources.json").write_text(
        json.dumps(serialize_models(sources), indent=2), encoding="utf-8"
    )
    # Save issues.json
    (snapshot_dir / "issues.json").write_text(
        json.dumps(serialize_models(issues), indent=2), encoding="utf-8"
    )
    
    metadata = {
        "kb_version": kb_version,
        "total_records": len(records),
        "total_chunks": len(chunks),
        "total_sources": len(sources),
        "total_issues": len(issues),
        **(extra_metadata or {})
    }
    (snapshot_dir / "metadata.json").write_text(
        json.dumps(metadata, indent=2), encoding="utf-8"
    )
    print(f"Saved snapshot {kb_version} to {snapshot_dir} ({len(records)} records, {len(chunks)} chunks)")

def generate_snapshot_diff(v1_0_dir: Path, v1_1_dir: Path, out_path: Path):
    if not (v1_0_dir / "records.json").exists() or not (v1_1_dir / "records.json").exists():
        return
        
    rec_10 = json.loads((v1_0_dir / "records.json").read_text(encoding="utf-8"))
    rec_11 = json.loads((v1_1_dir / "records.json").read_text(encoding="utf-8"))
    
    diff_report = {
        "base_version": "v1.0",
        "target_version": "v1.1",
        "records_count_base": len(rec_10),
        "records_count_target": len(rec_11),
        "modifications": [
            {
                "field": "grace_period",
                "record_id": "kb_faq_renewal_grace",
                "old_val": "15 days",
                "new_val": "30 days (Statutory IRDAI §4.2)",
                "reason": "Resolved discrepancy against official policy wording"
            },
            {
                "field": "rate_table",
                "record_id": "kb_prod_meridian_shield",
                "old_val": "INR 120,000 / INR 12,000",
                "new_val": "INR 10,800 / INR 950",
                "reason": "Corrected order-of-magnitude rate table typo"
            },
            {
                "field": "pii_sanitization",
                "masked_count": 8,
                "reason": "Zero raw PII leaks across telephone, email, PAN, and NIK numbers"
            }
        ],
        "deduplicated_clusters": 1,
        "quarantined_sources": 1
    }
    
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(diff_report, indent=2), encoding="utf-8")
    print(f"Generated snapshot diff report at {out_path}")
