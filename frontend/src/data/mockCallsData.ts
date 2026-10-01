import type { CallRecord, TraceSpan } from '../types';

export const mockCalls: CallRecord[] = [
  {
    id: 'call_rec_101',
    trace_id: 'tr_8f902a11c8e9',
    customer_name_masked: 'Rajesh K. [CUST_982]',
    market: 'in_en',
    scenario: 'Renewal Reminder with EV Cross-Sell',
    language_mix_summary: 'EN 94% / HI 6%',
    duration_sec: 142,
    timestamp: '2026-09-30 14:10:22',
    grounded_answer_rate: 98.2,
    fallbacks_count: 0,
    wer_estimated: 4.8,
    status: 'Completed'
  },
  {
    id: 'call_rec_102',
    trace_id: 'tr_4c2199b00ef4',
    customer_name_masked: 'Maria C. [CUST_044]',
    market: 'ph_tl',
    scenario: 'Bancassurance Renewal in Taglish (Heavy Street Noise)',
    language_mix_summary: 'TL 61% / EN 22% / Taglish Bridge 17%',
    duration_sec: 185,
    timestamp: '2026-09-30 15:45:10',
    grounded_answer_rate: 96.0,
    fallbacks_count: 0,
    wer_estimated: 8.9,
    status: 'Completed'
  },
  {
    id: 'call_rec_103',
    trace_id: 'tr_1a337bd48801',
    customer_name_masked: 'Bapak Hendra [CUST_512]',
    market: 'id_id',
    scenario: 'Multifinance Angsuran (Formal Sopan)',
    language_mix_summary: 'ID 96% / EN 4%',
    duration_sec: 110,
    timestamp: '2026-09-30 16:20:00',
    grounded_answer_rate: 100.0,
    fallbacks_count: 0,
    wer_estimated: 5.1,
    status: 'Completed'
  },
  {
    id: 'call_rec_104',
    trace_id: 'tr_9901aa72f33c',
    customer_name_masked: 'Bapak Slamet [CUST_789]',
    market: 'id_id',
    scenario: 'Javanese-Accented Multifinance Payday Delay',
    language_mix_summary: 'ID 82% / JV 18%',
    duration_sec: 210,
    timestamp: '2026-09-30 17:05:44',
    grounded_answer_rate: 94.5,
    fallbacks_count: 1,
    wer_estimated: 9.8,
    status: 'Completed'
  },
  {
    id: 'call_rec_105',
    trace_id: 'tr_77bcf4209118',
    customer_name_masked: 'Ananya S. [CUST_302]',
    market: 'in_en',
    scenario: 'Grace Period Compliance Test & Out-of-Scope Query',
    language_mix_summary: 'EN 100%',
    duration_sec: 95,
    timestamp: '2026-10-01 09:12:30',
    grounded_answer_rate: 100.0,
    fallbacks_count: 2,
    wer_estimated: 3.9,
    status: 'Completed'
  },
  {
    id: 'call_rec_106',
    trace_id: 'tr_22aa18bc0071',
    customer_name_masked: 'Venkatesh I. [CUST_119]',
    market: 'in_en',
    scenario: 'UPI Debit Dispute De-escalation',
    language_mix_summary: 'EN 98% / HI 2%',
    duration_sec: 160,
    timestamp: '2026-10-01 11:35:19',
    grounded_answer_rate: 95.0,
    fallbacks_count: 1,
    wer_estimated: 6.2,
    status: 'Escalated_Human'
  }
];

export const mockTraceSpans: Record<string, TraceSpan[]> = {
  tr_8f902a11c8e9: [
    { id: 'sp_01', name: 'Voice Activity Detection (Silero VAD)', start_ms: 0, duration_ms: 45, status: 'ok', provider: 'Silero_Local_ONNX' },
    { id: 'sp_02', name: 'Streaming ASR (Deepgram Nova-2)', start_ms: 45, duration_ms: 185, status: 'ok', provider: 'Deepgram_Nova2_Telephony' },
    { id: 'sp_03', name: 'Language & Register Classifier', start_ms: 230, duration_ms: 35, status: 'ok', provider: 'FastText_Regional_v2' },
    { id: 'sp_04', name: 'Hybrid KB Retrieval (Dense + BM25)', start_ms: 265, duration_ms: 68, status: 'ok', provider: 'pgvector_hybrid_v1.3' },
    { id: 'sp_05', name: 'Cross-Encoder Reranker', start_ms: 333, duration_ms: 52, status: 'cached', provider: 'BGE_Reranker_Large' },
    { id: 'sp_06', name: 'LLM Response Generation', start_ms: 385, duration_ms: 310, status: 'ok', provider: 'Claude_3_5_Haiku' },
    { id: 'sp_07', name: 'Fail-Closed Sentence Gate Verification', start_ms: 695, duration_ms: 48, status: 'ok', provider: 'Parley_Gate_Engine' },
    { id: 'sp_08', name: 'Streaming TTS Synthesis (ElevenLabs Turbo)', start_ms: 743, duration_ms: 195, status: 'ok', provider: 'ElevenLabs_Turbo_v2.5' },
    { id: 'sp_09', name: 'WebRTC Audio Delivery', start_ms: 938, duration_ms: 22, status: 'ok', provider: 'LiveKit_SFU' }
  ]
};
