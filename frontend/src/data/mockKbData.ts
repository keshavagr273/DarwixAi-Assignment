import type { IngestedSource, CleaningDiffItem, DedupeCluster, PiiDetectionItem, KbRecord } from '../types';

export const mockSources: IngestedSource[] = [
  {
    id: 'src_01',
    name: 'Meridian_Assure_Policy_Wording_v2024.pdf',
    type: 'policy_wording',
    url_or_path: 's3://parley-ingest/raw/legal/Meridian_Assure_Master_v2024.pdf',
    fetch_status: 'SUCCESS',
    parse_method: 'pdfplumber_layout_aware',
    health_score: 98,
    flags: [],
    chunks_produced: 142,
    last_ingested: '2026-09-28 14:22:10 UTC',
  },
  {
    id: 'src_02',
    name: 'Meridian_Retail_Partner_Benefits_Portal.html',
    type: 'web_page',
    url_or_path: 'https://partners.meridianassure.com/benefits/branch-tier1',
    fetch_status: 'SUCCESS',
    parse_method: 'trafilatura_clean_html',
    health_score: 92,
    flags: ['boilerplate_stripped'],
    chunks_produced: 38,
    last_ingested: '2026-09-29 08:15:33 UTC',
  },
  {
    id: 'src_03',
    name: 'Q3_Customer_FAQ_Discrepancy_Sheet.xlsx',
    type: 'faq_table',
    url_or_path: 'internal://ops/kb/Q3_Renewal_Discrepancy_Table.xlsx',
    fetch_status: 'WARNING',
    parse_method: 'openpyxl_tabular_normalizer',
    health_score: 74,
    flags: ['source_conflict_detected', 'grace_period_mismatch'],
    chunks_produced: 26,
    last_ingested: '2026-09-29 11:40:02 UTC',
  },
  {
    id: 'src_04',
    name: 'Bancassurance_PH_Bilingual_Brochure_Taglish.pdf',
    type: 'brochure',
    url_or_path: 's3://parley-ingest/raw/ph/Meridian_PH_Life_Bancassurance_2026.pdf',
    fetch_status: 'SUCCESS',
    parse_method: 'ocr_bilingual_tesseract_v5',
    health_score: 95,
    flags: ['taglish_diacritics_normalized'],
    chunks_produced: 64,
    last_ingested: '2026-09-30 04:09:12 UTC',
  },
  {
    id: 'src_05',
    name: 'ID_Multifinance_OJK_Regulatory_Notice_2026.pdf',
    type: 'policy_wording',
    url_or_path: 's3://parley-ingest/raw/id/OJK_Cicilan_Consumer_Protection_Circular.pdf',
    fetch_status: 'SUCCESS',
    parse_method: 'pdfplumber_layout_aware',
    health_score: 99,
    flags: ['regulatory_canonical'],
    chunks_produced: 82,
    last_ingested: '2026-09-30 09:30:45 UTC',
  },
  {
    id: 'src_06',
    name: 'Scanned_Legacy_Agent_Notes_Batch4.pdf',
    type: 'pdf',
    url_or_path: 's3://parley-ingest/raw/legacy/Scanned_Notes_Batch4.pdf',
    fetch_status: 'QUARANTINED',
    parse_method: 'tesseract_ocr_fallback',
    health_score: 38,
    flags: ['extraction_failed', 'unreadable_handwriting_12%'],
    chunks_produced: 0,
    last_ingested: '2026-09-30 16:55:00 UTC',
  },
];

export const mockDiffItems: CleaningDiffItem[] = [
  {
    id: 'diff_01',
    source_name: 'Meridian_Retail_Partner_Benefits_Portal.html',
    raw_snippet: `<!-- HEADER NAV -->\n<nav class="partner-nav">Home > Partners > Tier 1 Benefits</nav>\n<h1>Branch Partnership Benefits Overview</h1>\n<p>Cookie Policy: We store tracking cookies for performance.</p>\n<p>Branch partner employees receive a comprehensive 15% discount on personal life and vehicle renewal policies when processed directly through the authorized agency branch code (AP-BRANCH-99).</p>\n<footer>Copyright 2026 Meridian Assure Group. All rights reserved. Call 1800-00-9999 for inquiries.</footer>`,
    cleaned_snippet: `Branch partner employees receive a comprehensive 15% discount on personal life and vehicle renewal policies when processed directly through the authorized agency branch code (AP-BRANCH-99). Applicable across Tier-1 and Tier-2 registered distribution branches.`,
    removed_elements: [
      'Stripped navigational breadcrumbs (<nav class="partner-nav">)',
      'Stripped cookie tracking disclosure banner',
      'Stripped repetitive corporate footer and copyright string',
    ],
    standardized_terms: [
      { before: 'agency branch code', after: 'authorized branch partner code', reason: 'Taxonomy gloss standardized to partner terminology' },
      { before: 'renewal policies', after: 'renewal premium schedules', reason: 'Aligned with underwriting lexicon' }
    ],
  },
  {
    id: 'diff_02',
    source_name: 'Q3_Customer_FAQ_Discrepancy_Sheet.xlsx (vs Master Policy PDF)',
    raw_snippet: `Row 14: Q: What is the grace period for premium renewals?\nA: You have 15 calendar days from the scheduled due date to complete your payment before the policy relapses.\nNote: Late fee of Rs. 250 applies after Day 15.`,
    cleaned_snippet: `The grace period for renewal premium settlement is exactly 30 calendar days from the premium due date. During this 30-day window, full life coverage remains active. [Source Error Resolved: Marketing FAQ claimed 15 days, Master Policy Section 4.2 guarantees statutory 30-day grace period under IRDAI regulations].`,
    removed_elements: [
      'Overwrote erroneous 15-day claim from marketing collateral',
      'Appended cross-referenced canonical citation from Master Underwriting Schedule'
    ],
    standardized_terms: [
      { before: 'relapses', after: 'lapses into unpaid dormancy', reason: 'Regulatory precision requirement' }
    ],
    detected_error: {
      field: 'Grace Period Duration',
      description: 'Critical conflict: Marketing flyer listed 15 days, whereas Master Policy Contract Section 4.2 explicitly mandates 30 calendar days.',
      resolution: 'System adhered to canonical precedence rule: Master Underwriting Contract overrides marketing FAQs.',
      severity: 'HIGH'
    }
  },
  {
    id: 'diff_03',
    source_name: 'Bancassurance_PH_Bilingual_Brochure_Taglish.pdf',
    raw_snippet: `PAALALA SA MGA CUSTOMERS:\nI-update po ang inyong auto-debit bago sumapit ang June 15, 2026. Para maiwasan ang cancellation, tumawag sa hotline 0917-888-2341 at hanapin si Maria Santos.\nMaraming salamat po!`,
    cleaned_snippet: `Mangyaring i-update ang inyong auto-debit nomination bago ang takdang petsa ng pagbabayad upang mapanatiling aktibo ang inyong proteksyon. Maaaring i-ayos ito sa pamamagitan ng mobile portal o sa pamamagitan ng pagtawag sa opisyal na customer support line [PHONE_1] (naka-assign sa customer assistance desk [AGENT_NAME_1]).`,
    removed_elements: [
      'Removed informal flyer exclamation salutations',
      'Masked real mobile number into vault token [PHONE_1]',
      'Masked individual staff name into vault token [AGENT_NAME_1]'
    ],
    standardized_terms: [
      { before: 'cancellation', after: 'pagka-antala o pag-lapse ng coverage', reason: 'Formal insurance compliance glossary for PH market' }
    ]
  }
];

export const mockDedupeClusters: DedupeCluster[] = [
  {
    id: 'cluster_01',
    similarity_score: 96.8,
    canonical_id: 'kb_policy_014',
    canonical_title: 'Grace Period and Policy Reinstatement Rights',
    selection_rationale: 'Retained kb_policy_014 as canonical: Derived directly from Underwriting Policy PDF v2024 rather than promotional web page. Contains statutory IRDAI clause citations.',
    duplicates: [
      {
        record_id: 'kb_policy_014',
        title: 'Grace Period and Policy Reinstatement Rights',
        source: 'Meridian_Assure_Policy_Wording_v2024.pdf (Sec 4.2)',
        status: 'merged'
      },
      {
        record_id: 'kb_faq_088_dup',
        title: 'How long do I have to pay my overdue premium?',
        source: 'Website_Renewal_FAQ_2025.html',
        status: 'merged'
      },
      {
        record_id: 'kb_brochure_012_dup',
        title: 'Grace Period & Continuous Protection Flyer',
        source: 'Branch_Brochure_Print_2025.pdf',
        status: 'merged'
      }
    ]
  },
  {
    id: 'cluster_02',
    similarity_score: 93.4,
    canonical_id: 'kb_product_001',
    canonical_title: 'Branch Partnership Benefits (Tier 1 & Tier 2)',
    selection_rationale: 'Consolidated three regional branch sheets into single parameterized canonical chunk. Eliminates duplicate embeddings while preserving regional tier logic.',
    duplicates: [
      {
        record_id: 'kb_product_001',
        title: 'Branch Partnership Benefits (Tier 1 & Tier 2)',
        source: 'Meridian_Retail_Partner_Benefits_Portal.html',
        status: 'merged'
      },
      {
        record_id: 'kb_product_001_mumbai',
        title: 'Mumbai Metro Branch Partner Rebate Schedule',
        source: 'Western_Region_Ops_Memo.docx',
        status: 'merged'
      }
    ]
  }
];

export const mockPiiItems: PiiDetectionItem[] = [
  {
    token_id: 'pii_tok_001',
    entity_type: 'PHONE',
    masked_token: '[PHONE_1]',
    raw_sample_masked: '+91 98201 XXXXX',
    detection_method: 'regex',
    confidence: 0.99,
    verified_quarantined: true,
  },
  {
    token_id: 'pii_tok_002',
    entity_type: 'POLICY_NUM',
    masked_token: '[POLICY_REF_1]',
    raw_sample_masked: 'POL-2024-8849-XXXX',
    detection_method: 'checksum',
    confidence: 1.0,
    verified_quarantined: true,
  },
  {
    token_id: 'pii_tok_003',
    entity_type: 'NAME',
    masked_token: '[AGENT_NAME_1]',
    raw_sample_masked: 'Maria SXXXXX',
    detection_method: 'ner',
    confidence: 0.94,
    verified_quarantined: true,
  },
  {
    token_id: 'pii_tok_004',
    entity_type: 'NATIONAL_ID',
    masked_token: '[NIK_TOKEN_1]',
    raw_sample_masked: '32012488XXXXXXXX',
    detection_method: 'checksum',
    confidence: 0.98,
    verified_quarantined: true,
  },
  {
    token_id: 'pii_tok_005',
    entity_type: 'EMAIL',
    masked_token: '[EMAIL_REDACTED_1]',
    raw_sample_masked: 'rXXXXX.kXXXXX@gmail.com',
    detection_method: 'regex',
    confidence: 1.0,
    verified_quarantined: true,
  },
];

export const mockKbRecords: KbRecord[] = [
  {
    record_id: 'kb_product_001',
    title: 'Branch Partnership Benefits',
    content: 'Branch partner employees and nominated family members receive a verified 15% discount on annual life insurance renewal premiums and vehicle add-on covers when processed with valid branch agent identification code (AP-BRANCH-99). The benefit applies across Tier 1 and Tier 2 partner financial hubs.',
    category: 'product',
    source: 'Meridian_Retail_Partner_Benefits_Portal.html',
    source_type: 'web',
    version: 'v1.3',
    pii: false,
    market: 'in_en',
    lang: 'en-IN',
    valid_from: '2026-01-01',
    valid_to: '2026-12-31',
    content_hash: 'sha256:7f9a2e31bc9801da52d',
    chunk_index: 0,
    parent_doc_id: 'doc_partner_portal_01',
    confidence: 0.99,
  },
  {
    record_id: 'kb_policy_014',
    title: 'Grace Period and Reinstatement Rules',
    content: 'All policyholders are granted a statutory grace period of 30 calendar days from the declared premium due date. Full death benefit and medical rider coverage remain active throughout the grace period. Policies unpaid after 30 days lapse into dormant status, requiring medical re-certification for reinstatement within 6 months.',
    category: 'policy',
    source: 'Meridian_Assure_Policy_Wording_v2024.pdf',
    source_type: 'pdf',
    version: 'v1.3',
    pii: false,
    market: 'in_en',
    lang: 'en-IN',
    valid_from: '2024-01-01',
    valid_to: '2028-12-31',
    supersedes: 'kb_policy_014_v1.0',
    content_hash: 'sha256:4b83f091c6e11892bb',
    chunk_index: 3,
    parent_doc_id: 'doc_master_underwriting_02',
    confidence: 0.98,
  },
  {
    record_id: 'kb_qual_003',
    title: 'Renewal Payment Eligibility & Verification Rules',
    content: 'To confirm renewal intention over phone, the caller must verify: (1) Date of Birth matching master record, (2) Last 4 digits of registered phone number, and (3) Policy registration state. Renewal discounts cannot be authorized until two-factor verification succeeds.',
    category: 'qualification',
    source: 'Meridian_Assure_Policy_Wording_v2024.pdf',
    source_type: 'pdf',
    version: 'v1.3',
    pii: false,
    market: 'in_en',
    lang: 'en-IN',
    valid_from: '2025-06-01',
    valid_to: '2027-12-31',
    content_hash: 'sha256:1a84f33190cbcd88e3',
    chunk_index: 1,
    parent_doc_id: 'doc_verification_matrix_01',
    confidence: 0.97,
  },
  {
    record_id: 'kb_objection_007',
    title: 'Affordability & Split Payment Objection Handling',
    content: 'If customer cites temporary cashflow constraints or premium unaffordability, the agent is authorized to offer: (1) Quarterly mode conversion with zero surcharge, (2) Auto-debit deferral up to 21 days within grace period, or (3) Sum assured reduction retaining basic life cover.',
    category: 'objection',
    source: 'Q3_Customer_FAQ_Discrepancy_Sheet.xlsx',
    source_type: 'table',
    version: 'v1.3',
    pii: false,
    market: 'in_en',
    lang: 'en-IN',
    valid_from: '2026-01-15',
    valid_to: '2027-01-15',
    content_hash: 'sha256:9c782103f19e48712e',
    chunk_index: 0,
    parent_doc_id: 'doc_objection_matrix_2026',
    confidence: 0.95,
  },
  {
    record_id: 'kb_faq_022',
    title: 'Accepted Digital Payment Channels & Instant Receipt',
    content: 'Instant payment verification is available via UPI (Google Pay, PhonePe, Paytm), Netbanking (all scheduled commercial banks), and Credit/Debit cards (Visa, Mastercard, RuPay). Official digital renewal receipts are dispatched via SMS and WhatsApp within 120 seconds of bank confirmation.',
    category: 'faq',
    source: 'Meridian_Retail_Partner_Benefits_Portal.html',
    source_type: 'web',
    version: 'v1.3',
    pii: false,
    market: 'in_en',
    lang: 'en-IN',
    valid_from: '2026-01-01',
    valid_to: '2026-12-31',
    content_hash: 'sha256:32ff1904a8b27341ea',
    chunk_index: 2,
    parent_doc_id: 'doc_partner_portal_01',
    confidence: 0.99,
  },
  {
    record_id: 'kb_ph_life_009',
    title: 'Philippine Life Insurance Grace Period and Bancassurance Taglish Rules',
    content: 'Sa ilalim ng Insurance Commission regulations, may 31-day grace period ang bawat policyholder para bayaran ang renewal premium nang walang interest penalty. Nanatiling active ang coverage. Kung gagamit ng GCash o Maya bills payment, piliin ang "Meridian Life PH" at i-input ang 10-digit policy number.',
    category: 'policy',
    source: 'Bancassurance_PH_Bilingual_Brochure_Taglish.pdf',
    source_type: 'brochure',
    version: 'v1.3',
    pii: false,
    market: 'ph_tl',
    lang: 'tl-PH',
    valid_from: '2026-01-01',
    valid_to: '2027-06-30',
    content_hash: 'sha256:88fa2903bb1084ef7a',
    chunk_index: 4,
    parent_doc_id: 'doc_ph_life_master',
    confidence: 0.98,
  },
  {
    record_id: 'kb_id_multi_012',
    title: 'Ketentuan Jatuh Tempo Angsuran Multifinance & Biaya Denda Keterlambatan',
    content: 'Sesuai regulasi Otoritas Jasa Keuangan (OJK), pembayaran angsuran pembiayaan (cicilan) wajib dilakukan paling lambat pada tanggal jatuh tempo setiap bulannya. Keterlambatan dikenakan denda harian sebesar 0.5% dari nilai angsuran bulanan. Pembayaran dapat dilakukan via Virtual Account BCA, Mandiri, BRI, atau kasir Indomaret/Alfamart.',
    category: 'policy',
    source: 'ID_Multifinance_OJK_Regulatory_Notice_2026.pdf',
    source_type: 'policy_wording',
    version: 'v1.3',
    pii: false,
    market: 'id_id',
    lang: 'id-ID',
    valid_from: '2026-01-01',
    valid_to: '2027-12-31',
    content_hash: 'sha256:55ae21800cc234199d',
    chunk_index: 1,
    parent_doc_id: 'doc_ojk_id_rules',
    confidence: 0.99,
  }
];

export const mockVersions = [
  { version: 'v1.3', date: '2026-09-30', active: true, records_count: 412, pii_leak_test: 'PASSED (0 leaks)', retrieval_eval_pass: '96.4%' },
  { version: 'v1.2', date: '2026-08-15', active: false, records_count: 398, pii_leak_test: 'PASSED (0 leaks)', retrieval_eval_pass: '92.1%' },
  { version: 'v1.1', date: '2026-07-01', active: false, records_count: 364, pii_leak_test: 'WARNING (1 quarantined)', retrieval_eval_pass: '87.5%' },
  { version: 'v1.0', date: '2026-05-10', active: false, records_count: 310, pii_leak_test: 'FAILED (source discrepancy)', retrieval_eval_pass: '79.2%' },
];
