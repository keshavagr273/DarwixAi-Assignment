# PARLEY — KB Planted Defects Catalogue & Detection Log

> Documenting deliberate data defects planted in `kb/raw/` to test and validate pipeline cleaning, deduplication, conflict resolution, PII sanitization, and quarantine mechanisms.

---

## 1. Summary of Planted Defects

| Defect # | Category | File Location | Description | Pipeline Detection Mechanism | Resolution Policy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **D-01** | Boilerplate & Navigation | `website_partnership.html`, `website_faq.html` | Cookie banner, navigation menu, social links, footer copyright blocks | Heuristic DOM / Regex stripper in `cleaner.py` | Stripped completely before chunking |
| **D-02** | Repeated Sections | `website_faq.html` | Statutory IRDAI disclaimer repeated 4 times verbatim across sections | Cross-document line frequency counter | Deduplicated to single canonical notice |
| **D-03** | Near-Duplicates | `near_duplicate_faq_v1.html` vs `near_duplicate_faq_v2.html` | "How do I make an online premium payment?" with 94% lexical overlap and minor rephrasing | MinHash / Jaccard token overlap (> 0.90) | Choose canonical by recency & completeness; mark `duplicate_of` |
| **D-04** | Factual Conflict (Grace Period) | `policy_wording_hospital_cash.md` vs `website_renewal_faq.html` | Official policy wording says **30 days** grace period; website FAQ claims **15 days** | `defect_detector.py` rule checking numeric grace period values | Flagged to `kb_issues`. Policy wording wins over website |
| **D-05** | Rate Table Typo | `product_brochure_meridian_shield.md` | Premium for Age 45 listed as **₹12,000/mo** (order-of-magnitude typo vs ₹1,200/mo for Age 40) | Range and monotonicity validator in `defect_detector.py` | Flagged as High Severity typo in `kb_issues` |
| **D-06** | Mixed Date Formats | `forms_fee_schedule.csv` | Dates formatted inconsistently: `15/10/2024` (DD/MM), `10-24-2024` (MM-DD), `2024.11.01` (YYYY.MM) | `normalizer.py` date parser | Converted to ISO-8601 (`YYYY-MM-DD`) with original preserved |
| **D-07** | Scanned / Unreadable Page | `scanned_endorsement_unreadable.txt` | Simulated corrupted OCR scan with garbled ASCII noise and < 20% dictionary density | `fetch_parse.py` computing `extraction_health` (score = 0.22 < 0.60 threshold) | Quarantined to `kb/quarantine/` with reason `LOW_HEALTH_OCR_GARBLE` |
| **D-08** | Synthetic PII Leaks | `customer_records_synthetic_pii.csv`, `website_faq.html` | Raw phone numbers (+91 9876543210), email addresses, policy numbers (POL-883921), Indian PAN, Indonesian NIK | `pii_shield.py` regex + checksum detector | Sanitized to `[PHONE_1]`, `[EMAIL_1]`, `[ID_1]`; tokens saved in `pii_vault`; indexed chunk has `pii=false` |

---

## 2. Sample Canonical Record: `kb_product_001`
As specified in the PRD, `website_partnership.html` contains the exact anchor record:
- **Record ID:** `kb_product_001`
- **Title:** `Branch Partnership Benefits`
- **Category:** `partnership_benefits`
- **Source Type:** `website section`
- **Version:** `1.0`
- **PII:** `false`
- **Content:** Details on reciprocal referral fees, branch co-located claims desk, and instant digital endorsements for partner banks.
