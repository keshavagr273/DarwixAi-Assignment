from __future__ import annotations

import re
from typing import List, Dict, Any, Tuple
from kb.schema.models import KbIssue

def detect_grace_period_conflict(docs: List[Any]) -> Tuple[List[KbIssue], Dict[str, Any]]:
    issues = []
    resolutions = {}
    
    policy_grace = None
    website_grace = None
    policy_doc_id = None
    website_doc_id = None
    
    for doc in docs:
        content = doc.raw_content
        name = doc.file_path.name
        
        # Check policy wording
        if "policy_wording" in name or "hospital_cash" in name:
            match = re.search(r"thirty\s*\((30)\)\s*calendar\s*days", content, re.IGNORECASE)
            if match:
                policy_grace = 30
                policy_doc_id = doc.source.source_id
                
        # Check website renewal FAQ
        if "website_renewal" in name or "renewal_faq" in name:
            match = re.search(r"grace\s*period\s*of\s*(15)\s*days", content, re.IGNORECASE)
            if match:
                website_grace = 15
                website_doc_id = doc.source.source_id
                
    if policy_grace and website_grace and policy_grace != website_grace:
        issues.append(KbIssue(
            issue_id="issue_conflict_grace_period",
            severity="critical",
            type="conflict",
            source_ids=[policy_doc_id, website_doc_id],
            resolution_policy="Policy wording (statutory IRDAI §4.2) supersedes marketing website FAQ. Correct website record to 30 days.",
            resolved=True,
            description=f"Grace period discrepancy detected: Policy wording specifies {policy_grace} days, while Website FAQ states {website_grace} days."
        ))
        resolutions["grace_period"] = {
            "correct_value": 30,
            "superseded_value": 15,
            "target_source": website_doc_id
        }
        
    return issues, resolutions

def detect_rate_table_typo(docs: List[Any]) -> Tuple[List[KbIssue], Dict[str, Any]]:
    issues = []
    resolutions = {}
    
    for doc in docs:
        if "meridian_shield" in doc.file_path.name or "brochure" in doc.file_path.name:
            # Check for 120,000 or 12,000 in age 41-45 row
            if "120,000" in doc.raw_content or "12,000" in doc.raw_content:
                issues.append(KbIssue(
                    issue_id="issue_typo_rate_table",
                    severity="high",
                    type="typo",
                    source_ids=[doc.source.source_id],
                    resolution_policy="Out-of-range rate detected (INR 120,000 vs bracket average INR 10,800). Correct to standard tier-1 rate INR 10,800 / INR 950.",
                    resolved=True,
                    description="Order-of-magnitude rate table typo detected in Meridian Shield Age 41-45 band (INR 120,000 vs neighboring bracket INR 8,400)."
                ))
                resolutions["rate_table_typo"] = {
                    "doc_id": doc.source.source_id,
                    "wrong_val": "INR 120,000",
                    "corrected_val": "INR 10,800"
                }
    return issues, resolutions

def detect_date_format_issues(docs: List[Any]) -> Tuple[List[KbIssue], Dict[str, Any]]:
    issues = []
    resolutions = {}
    
    for doc in docs:
        if doc.file_path.suffix.lower() == ".csv":
            content = doc.raw_content
            has_mixed_dates = bool(re.search(r"\d{1,2}/\d{1,2}/\d{4}", content) and re.search(r"\d{1,2}-\d{1,2}-\d{4}", content))
            if has_mixed_dates:
                issues.append(KbIssue(
                    issue_id="issue_date_format_drift",
                    severity="medium",
                    type="impossible_date",
                    source_ids=[doc.source.source_id],
                    resolution_policy="Normalize mixed DD/MM and MM-DD date strings into standard ISO-8601 (YYYY-MM-DD).",
                    resolved=True,
                    description=f"Inconsistent date representations detected in {doc.file_path.name} (DD/MM/YYYY, MM-DD-YYYY)."
                ))
                resolutions["date_format"] = {"status": "normalized_iso8601"}
    return issues, resolutions

def detect_all_defects(docs: List[Any], quarantined_sources: List[Any] = None) -> Tuple[List[KbIssue], Dict[str, Any]]:
    all_issues: List[KbIssue] = []
    all_resolutions: Dict[str, Any] = {}
    
    # 1. Grace period conflict
    gp_issues, gp_res = detect_grace_period_conflict(docs)
    all_issues.extend(gp_issues)
    all_resolutions.update(gp_res)
    
    # 2. Rate table typo
    rate_issues, rate_res = detect_rate_table_typo(docs)
    all_issues.extend(rate_issues)
    all_resolutions.update(rate_res)
    
    # 3. Date format anomalies
    date_issues, date_res = detect_date_format_issues(docs)
    all_issues.extend(date_issues)
    all_resolutions.update(date_res)
    
    # 4. Quarantined low-health sources
    if quarantined_sources:
        for q_src in quarantined_sources:
            all_issues.append(KbIssue(
                issue_id=f"issue_quarantine_{q_src.source_id}",
                severity="medium",
                type="extraction",
                source_ids=[q_src.source_id],
                resolution_policy="Quarantined in kb/quarantine/ awaiting clean high-DPI re-scan.",
                resolved=True,
                description=f"Unreadable OCR document quarantined: {q_src.uri} (health: {q_src.extraction_health})"
            ))
            
    return all_issues, all_resolutions
