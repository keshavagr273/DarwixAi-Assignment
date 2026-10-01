import pytest
from pathlib import Path
from kb.pipeline.fetch_parse import compute_extraction_health
from kb.pipeline.cleaner import clean_text_boilerplate
from kb.pipeline.normalizer import normalize_dates_in_text, normalize_field_name
from kb.pipeline.defect_detector import detect_all_defects
from kb.pipeline.dedupe import cluster_and_deduplicate, tokenize_for_similarity, jaccard_similarity
from kb.pipeline.pii_shield import sanitize_pii, scan_text_for_raw_pii, PiiVault
from kb.pipeline.chunker import chunk_record
from kb.schema.models import KbRecord

def test_extraction_health_calculation():
    clean_text = "Meridian Assure offers comprehensive health and hospital cash protection plans."
    garbled_text = "%^&*@!~ MERIDIAN ?????? 001239840 ENDORSMNT ... /// \\\\\\ ===>> %% p0l!cy n0: ???[[[ ]]]***"
    
    assert compute_extraction_health(clean_text) >= 0.85
    assert compute_extraction_health(garbled_text) < 0.60

def test_boilerplate_cleaning():
    dirty = """
    We use cookies to improve your browsing experience. Accept All
    Home | Products | Contact
    Actual content of the policy section.
    Copyright © 2026 Meridian Assure Corp. All rights reserved.
    """
    cleaned = clean_text_boilerplate(dirty)
    assert "Accept All" not in cleaned
    assert "Products" not in cleaned
    assert "Actual content of the policy section." in cleaned

def test_repeated_disclaimer_deduplication():
    seen = set()
    disclaimer = "Statutory Notice IRDAI: Insurance is the subject matter of solicitation. Policy terms and conditions apply. IRDAI Reg No. 994."
    
    # First time -> kept
    first_pass = clean_text_boilerplate(f"Notice: {disclaimer}", seen)
    assert "Statutory Notice IRDAI" in first_pass
    
    # Second time -> stripped
    second_pass = clean_text_boilerplate(f"Notice 2: {disclaimer}", seen)
    assert "Statutory Notice IRDAI" not in second_pass

def test_date_normalization_to_iso8601():
    text = "Effective dates: 15/10/2024 (UK) and 10-24-2024 (US) and 2024.11.01 (Dot)."
    norm = normalize_dates_in_text(text)
    assert "2024-10-15" in norm
    assert "2024-10-24" in norm
    assert "2024-11-01" in norm

def test_pii_masking_and_vault_isolation():
    vault = PiiVault()
    sample = "Customer Aarav Patel, phone +91 9876543210, email aarav.patel@synthmail.com, policy POL-982144, PAN ABCDE1234F."
    
    sanitized, pii_types, count = sanitize_pii(sample, vault)
    
    assert "+91 9876543210" not in sanitized
    assert "aarav.patel@synthmail.com" not in sanitized
    assert "POL-982144" not in sanitized
    assert "ABCDE1234F" not in sanitized
    
    assert "[PHONE_1]" in sanitized
    assert "[EMAIL_1]" in sanitized
    assert "[POLICY_NUM_1]" in sanitized
    assert "[ID_1]" in sanitized
    
    # Zero raw PII scan
    leaks = scan_text_for_raw_pii(sanitized)
    assert len(leaks) == 0

def test_near_duplicate_clustering():
    rec1 = KbRecord(
        record_id="r1", kb_version="v1.1", title="Payment FAQ 1",
        content="How do I make my insurance premium payment online via QuickPay portal using debit or credit card?",
        category="faq", category_path="faq/pay", source_id="s1", content_hash="h1", citation_display="[r1]"
    )
    rec2 = KbRecord(
        record_id="r2", kb_version="v1.1", title="Payment FAQ 2",
        content="How can I pay my insurance premium online via QuickPay portal using debit or credit card?",
        category="faq", category_path="faq/pay", source_id="s2", content_hash="h2", citation_display="[r2]"
    )
    
    unique, clusters = cluster_and_deduplicate([rec1, rec2], similarity_threshold=0.55)
    assert len(clusters) == 1
    assert clusters[0].canonical_id == "r1"
    assert rec2.duplicate_of == "r1"
