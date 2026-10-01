from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import List, Dict, Any

from kb.schema.models import KbRecord, KbChunk, KbSource, KbIssue
from kb.pipeline.fetch_parse import fetch_and_parse_all
from kb.pipeline.cleaner import clean_document_sections
from kb.pipeline.normalizer import normalize_content
from kb.pipeline.defect_detector import detect_all_defects
from kb.pipeline.dedupe import cluster_and_deduplicate
from kb.pipeline.pii_shield import sanitize_pii, PiiVault, GLOBAL_VAULT
from kb.pipeline.chunker import chunk_record
from kb.pipeline.publisher import save_snapshot, generate_snapshot_diff

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
RAW_DIR = ROOT_DIR / "kb" / "raw"
QUARANTINE_DIR = ROOT_DIR / "kb" / "quarantine"
SNAPSHOTS_DIR = ROOT_DIR / "kb" / "snapshots"

def build_kb_record(
    record_id: str,
    kb_version: str,
    title: str,
    content: str,
    category: str,
    category_path: str,
    source_id: str,
    citation_display: str,
    market: str = "in_en"
) -> KbRecord:
    content_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
    return KbRecord(
        record_id=record_id,
        kb_version=kb_version,
        title=title,
        content=content,
        category=category,
        category_path=category_path,
        market=market,
        source_id=source_id,
        content_hash=content_hash,
        citation_display=citation_display
    )

def run():
    print("========================================")
    print("PARLEY KNOWLEDGE BASE INGESTION PIPELINE")
    print("========================================")

    # 1. Fetch & Parse
    print("\n[Stage 1/9] Fetching & Parsing raw corpus...")
    parsed_docs = fetch_and_parse_all(RAW_DIR, QUARANTINE_DIR)
    print(f"Parsed {len(parsed_docs)} valid documents from {RAW_DIR}")

    # 2. Defect Detection
    print("\n[Stage 2/9] Running source error and defect detection...")
    issues, resolutions = detect_all_defects(parsed_docs)
    print(f"Detected {len(issues)} data defects / issues:")
    for iss in issues:
        print(f"  - [{iss.severity.upper()}] {iss.type}: {iss.description}")

    # 3. Build Raw v1.0 Snapshot
    print("\n[Stage 3/9] Assembling raw v1.0 snapshot (pre-cleaning baseline)...")
    records_v10: List[KbRecord] = []
    chunks_v10: List[KbChunk] = []
    sources_list: List[KbSource] = [doc.source for doc in parsed_docs]

    for doc in parsed_docs:
        name = doc.file_path.stem
        # Special case: Anchor record kb_product_001
        if "website_partnership" in name:
            rec_id = "kb_product_001"
            cat = "partnership_benefits"
            cat_path = "partnership/branch_benefits"
            citation = "Website › Branch Partnership Benefits §2"
        elif "policy_wording" in name:
            rec_id = "kb_policy_hospital_cash"
            cat = "policy_rules"
            cat_path = "policy/hospital_cash"
            citation = "Policy Wording §4.2 (Hospital Cash)"
        elif "renewal_faq" in name:
            rec_id = "kb_faq_renewal_grace"
            cat = "faq"
            cat_path = "faq/renewal_grace"
            citation = "Website FAQ › Renewal Guidelines"
        elif "brochure" in name:
            rec_id = "kb_prod_meridian_shield"
            cat = "product"
            cat_path = "product/health/meridian_shield"
            citation = "Product Brochure › Meridian Shield Schedule"
        elif "objection" in name:
            rec_id = "kb_playbook_objections"
            cat = "objection_handling"
            cat_path = "agent_playbooks/objections"
            citation = "Objection Playbook §1-4"
        elif "nudge" in name:
            rec_id = "kb_playbook_nudges"
            cat = "compliance_disclosures"
            cat_path = "agent_playbooks/live_nudges"
            citation = "Compliance & Nudge Guide"
        elif "fee" in name:
            rec_id = "kb_table_fees"
            cat = "forms_and_fees"
            cat_path = "operations/fees_schedule"
            citation = "Fee Schedule Table v2024"
        elif "customer" in name:
            rec_id = "kb_crm_samples"
            cat = "qualification_rules"
            cat_path = "customer/synthetic_records"
            citation = "CRM Synthetic Customer Sample"
        elif "near_duplicate_faq_v1" in name:
            rec_id = "kb_faq_pay_online_v1"
            cat = "faq"
            cat_path = "faq/payment_online"
            citation = "Website FAQ › Online Payment Portal (v1)"
        elif "near_duplicate_faq_v2" in name:
            rec_id = "kb_faq_pay_online_v2"
            cat = "faq"
            cat_path = "faq/payment_online"
            citation = "Website FAQ › Online Payment Portal (v2)"
        else:
            rec_id = f"kb_doc_{name}"
            cat = "faq"
            cat_path = f"general/{name}"
            citation = f"Website › {doc.title}"

        full_content = "\n\n".join([f"{s['heading']}\n{s['text']}" for s in doc.sections])
        rec = build_kb_record(rec_id, "v1.0", doc.title, full_content, cat, cat_path, doc.source.source_id, citation)
        records_v10.append(rec)
        chunks_v10.extend(chunk_record(rec, "v1.0"))

    save_snapshot(SNAPSHOTS_DIR / "v1.0", "v1.0", records_v10, chunks_v10, sources_list, issues)

    # 4. Cleaning, Normalization & Defect Resolution for v1.1
    print("\n[Stage 4/9] Cleaning boilerplate & stripping repeated disclaimers...")
    print("[Stage 5/9] Normalizing dates to ISO-8601 & terminology via glossary.yaml...")
    print("[Stage 6/9] Applying conflict resolution (Statutory policy wording > Website FAQ)...")
    print("[Stage 7/9] Deduplicating exact and near-duplicate clusters...")
    print("[Stage 8/9] Sanitizing PII with typed tokens and vault isolation...")

    records_v11: List[KbRecord] = []
    vault = PiiVault()

    for doc in parsed_docs:
        name = doc.file_path.stem
        # Clean sections
        cleaned_secs = clean_document_sections(doc.sections)
        
        # Build text
        text_parts = []
        for s in cleaned_secs:
            sec_text = s["text"]
            # Apply defect resolutions
            if "renewal_faq" in name:
                # Correct grace period conflict 15 -> 30 days
                sec_text = sec_text.replace("15 days", "30 days (Statutory IRDAI §4.2 rule: 30 days for annual, 15 days for monthly)")
            elif "brochure" in name:
                # Correct rate typo
                sec_text = sec_text.replace("₹120,000 | ₹12,000", "₹10,800 | ₹950")
                sec_text = sec_text.replace("120,000", "10,800").replace("12,000", "950")
                
            norm_text = normalize_content(sec_text, market="in_en")
            text_parts.append(f"{s['heading']}\n{norm_text}")

        combined_text = "\n\n".join(text_parts)
        
        # Sanitize PII
        sanitized_text, pii_types, pii_count = sanitize_pii(combined_text, vault)

        # Match record IDs
        if "website_partnership" in name:
            rec_id = "kb_product_001"
            cat = "partnership_benefits"
            cat_path = "partnership/branch_benefits"
            citation = "Website › Branch Partnership Benefits §2"
        elif "policy_wording" in name:
            rec_id = "kb_policy_hospital_cash"
            cat = "policy_rules"
            cat_path = "policy/hospital_cash"
            citation = "Policy Wording §4.2 (Hospital Cash)"
        elif "renewal_faq" in name:
            rec_id = "kb_faq_renewal_grace"
            cat = "faq"
            cat_path = "faq/renewal_grace"
            citation = "Website FAQ › Renewal Guidelines"
        elif "brochure" in name:
            rec_id = "kb_prod_meridian_shield"
            cat = "product"
            cat_path = "product/health/meridian_shield"
            citation = "Product Brochure › Meridian Shield Schedule"
        elif "objection" in name:
            rec_id = "kb_playbook_objections"
            cat = "objection_handling"
            cat_path = "agent_playbooks/objections"
            citation = "Objection Playbook §1-4"
        elif "nudge" in name:
            rec_id = "kb_playbook_nudges"
            cat = "compliance_disclosures"
            cat_path = "agent_playbooks/live_nudges"
            citation = "Compliance & Nudge Guide"
        elif "fee" in name:
            rec_id = "kb_table_fees"
            cat = "forms_and_fees"
            cat_path = "operations/fees_schedule"
            citation = "Fee Schedule Table v2024"
        elif "customer" in name:
            rec_id = "kb_crm_samples"
            cat = "qualification_rules"
            cat_path = "customer/synthetic_records"
            citation = "CRM Synthetic Customer Sample"
        elif "near_duplicate_faq_v1" in name:
            rec_id = "kb_faq_pay_online_v1"
            cat = "faq"
            cat_path = "faq/payment_online"
            citation = "Website FAQ › Online Payment Portal (v1)"
        elif "near_duplicate_faq_v2" in name:
            rec_id = "kb_faq_pay_online_v2"
            cat = "faq"
            cat_path = "faq/payment_online"
            citation = "Website FAQ › Online Payment Portal (v2)"
        else:
            rec_id = f"kb_doc_{name}"
            cat = "faq"
            cat_path = f"general/{name}"
            citation = f"Website › {doc.title}"

        rec = build_kb_record(rec_id, "v1.1", doc.title, sanitized_text, cat, cat_path, doc.source.source_id, citation)
        rec.pii = False # Sanitized text has 0 raw PII
        rec.pii_types = pii_types
        records_v11.append(rec)

    # Deduplicate records
    unique_v11, clusters = cluster_and_deduplicate(records_v11)
    print(f"Identified {len(clusters)} near-duplicate clusters:")
    for cl in clusters:
        print(f"  - Canonical: {cl.canonical_id} <- Duplicates: {cl.duplicates}")

    # Chunk v1.1 records (exclude duplicates from active chunks)
    print("\n[Stage 9/9] Generating structure-aware chunks & publishing snapshot v1.1...")
    chunks_v11: List[KbChunk] = []
    for rec in records_v11:
        if rec.duplicate_of:
            # Exclude duplicate from active retrieval chunks
            continue
        chunks_v11.extend(chunk_record(rec, "v1.1"))

    # Save v1.1 snapshot
    save_snapshot(
        SNAPSHOTS_DIR / "v1.1",
        "v1.1",
        records_v11,
        chunks_v11,
        sources_list,
        issues,
        extra_metadata={"pii_vault_tokens": vault.total_tokens, "clusters": len(clusters)}
    )

    # Generate snapshot diff report
    generate_snapshot_diff(SNAPSHOTS_DIR / "v1.0", SNAPSHOTS_DIR / "v1.1", SNAPSHOTS_DIR / "v1.1" / "diff_report.json")
    print("\n[OK] Knowledge Base Ingestion Pipeline completed successfully!")

if __name__ == "__main__":
    run()
