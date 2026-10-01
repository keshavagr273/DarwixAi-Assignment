// Core data types for PARLEY Control Room

export type MarketCode = 'in_en' | 'ph_tl' | 'id_id';

export interface KbRecord {
  record_id: string;
  title: string;
  content: string;
  category: 'product' | 'policy' | 'qualification' | 'faq' | 'objection';
  source: string;
  source_type: 'pdf' | 'web' | 'table' | 'form' | 'doc' | 'brochure' | 'policy_wording';
  version: string;
  pii: boolean;
  market: MarketCode;
  lang: string;
  valid_from: string;
  valid_to: string;
  supersedes?: string;
  content_hash: string;
  chunk_index: number;
  parent_doc_id: string;
  confidence: number;
}

export interface IngestedSource {
  id: string;
  name: string;
  type: 'pdf' | 'web_page' | 'faq_table' | 'brochure' | 'policy_wording';
  url_or_path: string;
  fetch_status: 'SUCCESS' | 'WARNING' | 'QUARANTINED';
  parse_method: string;
  health_score: number; // 0 - 100
  flags: string[];
  chunks_produced: number;
  last_ingested: string;
}

export interface CleaningDiffItem {
  id: string;
  source_name: string;
  raw_snippet: string;
  cleaned_snippet: string;
  removed_elements: string[];
  standardized_terms: { before: string; after: string; reason: string }[];
  detected_error?: {
    field: string;
    description: string;
    resolution: string;
    severity: 'HIGH' | 'MEDIUM';
  };
}

export interface DedupeCluster {
  id: string;
  similarity_score: number;
  canonical_id: string;
  canonical_title: string;
  selection_rationale: string;
  duplicates: {
    record_id: string;
    title: string;
    source: string;
    status: 'merged' | 'quarantined' | 'split';
  }[];
}

export interface PiiDetectionItem {
  token_id: string;
  entity_type: 'PHONE' | 'NAME' | 'EMAIL' | 'POLICY_NUM' | 'NATIONAL_ID' | 'ADDRESS';
  masked_token: string;
  raw_sample_masked: string;
  detection_method: 'regex' | 'ner' | 'checksum';
  confidence: number;
  verified_quarantined: boolean;
}

export interface RetrievalResult {
  record_id: string;
  chunk_id: string;
  title: string;
  text: string;
  source_ref: string;
  category: string;
  version: string;
  citation: string;
  scores: {
    dense: number;
    sparse: number;
    rerank: number;
    boost: number;
    total: number;
  };
}

export interface RetrievalEvidenceItem {
  id: string;
  category: 'product' | 'policy' | 'qualification' | 'faq' | 'objection' | 'no_answer';
  question: string;
  market: MarketCode;
  retrieved_record_id: string;
  retrieved_chunk: string;
  source_reference: string;
  relevance_explanation: string;
  verdict: 'correct' | 'partially_correct' | 'incorrect';
  reviewer_notes?: string;
  fixed_in_version?: string;
  is_refusal_test?: boolean;
}

export interface GroundingReceipt {
  citation: string;
  record_id: string;
  version: string;
  score: number;
  source_title: string;
  source_file: string;
  chunk_text: string;
  score_breakdown: {
    dense: number;
    bm25: number;
    rerank: number;
  };
}

export interface SentenceGateData {
  turn_id: string;
  status: 'VERIFIED' | 'BLOCKED_FALLBACK' | 'UNSUPPORTED';
  draft_text: string;
  final_spoken_text: string;
  block_reason?: string;
  receipt?: GroundingReceipt;
}

export interface LiveTranscriptTurn {
  id: string;
  speaker: 'agent' | 'customer' | 'system';
  timestamp: string;
  text: string;
  gate?: SentenceGateData;
  asr_latency_ms?: number;
  confidence?: number;
  language?: string;
}

export interface LiveNudge {
  id: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  imperative_text: string;
  rationale: string;
  confidence: number;
  topic: string;
  expires_in_sec: number;
  fired_at: string;
  pinned?: boolean;
  status: 'active' | 'accepted' | 'dismissed' | 'snoozed';
  waterfall_latency_ms: {
    chunk: number;
    asr: number;
    signal: number;
    llm: number;
    delivery: number;
    total: number;
  };
}

export interface SuppressedNudge {
  id: string;
  candidate_text: string;
  topic: string;
  suppression_reason: 'duplicate' | 'cooldown' | 'low_confidence' | 'topic_grouped' | 'noisy_audio_guard' | 'expired';
  verdict_detail: string;
  confidence: number;
  timestamp: string;
}

export interface LocalizationTriplet {
  id: string;
  intent_label: string;
  category: string;
  neutral_intent: string;
  literal_english_translation: string;
  localized_natural_expression: string;
  market: MarketCode;
  cultural_annotations: {
    feature: string;
    explanation: string;
  }[];
  honorific_register: string;
}

export interface CallRecord {
  id: string;
  trace_id: string;
  customer_name_masked: string;
  market: MarketCode;
  scenario: string;
  language_mix_summary: string;
  duration_sec: number;
  timestamp: string;
  grounded_answer_rate: number;
  fallbacks_count: number;
  wer_estimated: number;
  status: 'Completed' | 'Escalated_Human' | 'Declined_Callback';
}

export interface TraceSpan {
  id: string;
  name: string;
  start_ms: number;
  duration_ms: number;
  status: 'ok' | 'degraded' | 'cached';
  provider: string;
  details?: Record<string, string | number | boolean>;
}
