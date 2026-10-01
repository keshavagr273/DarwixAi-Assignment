import type { LiveTranscriptTurn, LiveNudge, SuppressedNudge } from '../types';

export interface ScenarioDefinition {
  id: string;
  name: string;
  description: string;
  expectedOutcome: string;
  caller: string;
  policyNo: string;
  market: 'in_en' | 'ph_tl' | 'id_id';
  turns: LiveTranscriptTurn[];
  nudges: LiveNudge[];
  suppressedNudges: SuppressedNudge[];
}

export const mockScenarios: Record<string, ScenarioDefinition> = {
  cross_sell: {
    id: 'cross_sell',
    name: 'Missed Cross-Sell: Dual Policy Opportunity',
    description: 'Customer mentions purchasing an additional commercial scooter while reviewing personal life policy renewal.',
    expectedOutcome: 'System detects high-affinity motor add-on cue; fires P1 nudge to offer bundled partner discount.',
    caller: 'Rajesh K. (Masked [CUST_ID_982])',
    policyNo: 'POL-IN-2024-8849',
    market: 'in_en',
    turns: [
      {
        id: 'turn_01',
        speaker: 'agent',
        timestamp: '00:04',
        text: 'Good afternoon, Mr. Kumar. This is Meridian Assure checking in regarding your comprehensive life insurance renewal due on October 15th.',
        gate: {
          turn_id: 'gate_01',
          status: 'VERIFIED',
          draft_text: 'Good afternoon, Mr. Kumar. This is Meridian Assure checking in regarding your comprehensive life insurance renewal due on October 15th.',
          final_spoken_text: 'Good afternoon, Mr. Kumar. This is Meridian Assure checking in regarding your comprehensive life insurance renewal due on October 15th.',
          receipt: {
            citation: 'kb_qual_003 · v1.3 · 0.96',
            record_id: 'kb_qual_003',
            version: 'v1.3',
            score: 0.96,
            source_title: 'Renewal Payment Eligibility & Verification Rules',
            source_file: 'Meridian_Assure_Policy_Wording_v2024.pdf',
            chunk_text: 'Identity verification initiates renewal consultation with customer due date and policy summary disclosure...',
            score_breakdown: { dense: 0.95, bm25: 0.98, rerank: 0.96 }
          }
        },
        asr_latency_ms: 140,
        confidence: 0.99
      },
      {
        id: 'turn_02',
        speaker: 'customer',
        timestamp: '00:12',
        text: 'Yes, hi. I received your SMS. I was actually busy because we just purchased a new electric two-wheeler for our delivery store.',
        asr_latency_ms: 185,
        confidence: 0.97
      },
      {
        id: 'turn_03',
        speaker: 'agent',
        timestamp: '00:19',
        text: 'Understood, congratulations on the new vehicle! As an active policyholder, you are eligible for our partner discount if you bundle two-wheeler coverage.',
        gate: {
          turn_id: 'gate_03',
          status: 'VERIFIED',
          draft_text: 'Understood, congratulations on the new vehicle! As an active policyholder, you are eligible for our partner discount if you bundle two-wheeler coverage.',
          final_spoken_text: 'Understood, congratulations on the new vehicle! As an active policyholder, you are eligible for our partner discount if you bundle two-wheeler coverage.',
          receipt: {
            citation: 'kb_product_001 · v1.3 · 0.94',
            record_id: 'kb_product_001',
            version: 'v1.3',
            score: 0.94,
            source_title: 'Branch Partnership Benefits',
            source_file: 'Meridian_Retail_Partner_Benefits_Portal.html',
            chunk_text: 'Branch partner employees and nominated family members receive a verified 15% discount on annual renewal premiums and vehicle add-on covers...',
            score_breakdown: { dense: 0.92, bm25: 0.96, rerank: 0.94 }
          }
        },
        asr_latency_ms: 160,
        confidence: 0.98
      },
      {
        id: 'turn_04',
        speaker: 'customer',
        timestamp: '00:27',
        text: 'Oh really? How much discount can I get, and does it cover commercial delivery riders?',
        asr_latency_ms: 175,
        confidence: 0.96
      },
      {
        id: 'turn_05',
        speaker: 'agent',
        timestamp: '00:34',
        text: 'You get a 15% discount on the premium. For commercial rider terms, let me connect you with our motor specialist to verify the vehicle permit.',
        gate: {
          turn_id: 'gate_05',
          status: 'VERIFIED',
          draft_text: 'You get a 15% discount and commercial delivery riders are 100% automatically included without inspection.',
          final_spoken_text: 'You get a 15% discount on the premium. For commercial rider terms, let me connect you with our motor specialist to verify the vehicle permit.',
          block_reason: 'Draft contained unverified claim regarding automatic commercial rider coverage without inspection.',
          receipt: {
            citation: 'kb_product_001 · v1.3 · 0.91',
            record_id: 'kb_product_001',
            version: 'v1.3',
            score: 0.91,
            source_title: 'Branch Partnership Benefits',
            source_file: 'Meridian_Retail_Partner_Benefits_Portal.html',
            chunk_text: '...verified 15% discount on renewal premiums and vehicle add-on covers... Commercial operations require underwriting inspection endorsement.',
            score_breakdown: { dense: 0.91, bm25: 0.90, rerank: 0.92 }
          }
        },
        asr_latency_ms: 190,
        confidence: 0.97
      }
    ],
    nudges: [
      {
        id: 'nudge_01',
        priority: 'P1',
        imperative_text: 'Offer 15% 2-Wheeler Bundle Discount for new EV purchase',
        rationale: 'Customer mentioned new electric two-wheeler purchase in turn 00:12. Cross-sell propensity 0.88.',
        confidence: 0.88,
        topic: 'cross_sell_vehicle',
        expires_in_sec: 14,
        fired_at: '00:14',
        status: 'accepted',
        waterfall_latency_ms: {
          chunk: 60,
          asr: 175,
          signal: 95,
          llm: 290,
          delivery: 35,
          total: 655
        }
      },
      {
        id: 'nudge_02',
        priority: 'P2',
        imperative_text: 'Prompt to schedule callback with Commercial Motor Specialist',
        rationale: 'Customer inquired about commercial delivery coverage which requires branch underwriter signoff.',
        confidence: 0.84,
        topic: 'specialist_escalation',
        expires_in_sec: 25,
        fired_at: '00:30',
        status: 'active',
        waterfall_latency_ms: {
          chunk: 65,
          asr: 165,
          signal: 110,
          llm: 310,
          delivery: 40,
          total: 690
        }
      }
    ],
    suppressedNudges: [
      {
        id: 'sup_01',
        candidate_text: 'Suggest personal accident policy add-on',
        topic: 'personal_accident_upsell',
        suppression_reason: 'topic_grouped',
        verdict_detail: 'Suppressed: Grouped under higher-affinity topic [cross_sell_vehicle] to prevent agent cognitive overload.',
        confidence: 0.64,
        timestamp: '00:15'
      },
      {
        id: 'sup_02',
        candidate_text: 'Remind customer about UPI payment cash back',
        topic: 'payment_promotion',
        suppression_reason: 'cooldown',
        verdict_detail: 'Suppressed by Cooldown rule: 20s cooldown active following cross-sell prompt.',
        confidence: 0.72,
        timestamp: '00:22'
      },
      {
        id: 'sup_03',
        candidate_text: 'Repeat 15% discount reminder',
        topic: 'cross_sell_vehicle',
        suppression_reason: 'duplicate',
        verdict_detail: 'Suppressed: Duplicate intent already acknowledged by agent in turn 00:19.',
        confidence: 0.91,
        timestamp: '00:26'
      }
    ]
  },

  skipped_disclosure: {
    id: 'skipped_disclosure',
    name: 'Skipped Mandatory Disclosure & Risky Claim',
    description: 'Agent neglects statutory 30-day grace period explanation while taking renewal commitment.',
    expectedOutcome: 'System flags compliance risk P0; pins mandatory disclosure alert until acknowledged.',
    caller: 'Ananya Sharma (Masked [CUST_ID_302])',
    policyNo: 'POL-IN-2023-4112',
    market: 'in_en',
    turns: [
      {
        id: 'turn_d1',
        speaker: 'agent',
        timestamp: '00:03',
        text: 'Hello Ms. Sharma, your term insurance expires in 48 hours. If you do not pay by tomorrow midnight, your policy terminates immediately.',
        gate: {
          turn_id: 'gate_d1',
          status: 'BLOCKED_FALLBACK',
          draft_text: 'If you do not pay by tomorrow midnight, your policy terminates immediately and all previous premiums are forfeited.',
          final_spoken_text: 'Please note your renewal date is approaching. You also have a statutory 30-day grace period where your life cover continues uninterrupted.',
          block_reason: 'BLOCKED by Sentence Gate: Statement violated IRDAI Section 4.2 by claiming immediate termination with no grace period.',
          receipt: {
            citation: 'kb_policy_014 · v1.3 · 0.99',
            record_id: 'kb_policy_014',
            version: 'v1.3',
            score: 0.99,
            source_title: 'Grace Period and Reinstatement Rules',
            source_file: 'Meridian_Assure_Policy_Wording_v2024.pdf',
            chunk_text: 'All policyholders are granted a statutory grace period of 30 calendar days from the declared premium due date. Full death benefit coverage remains active...',
            score_breakdown: { dense: 0.99, bm25: 0.98, rerank: 0.99 }
          }
        },
        asr_latency_ms: 155,
        confidence: 0.98
      },
      {
        id: 'turn_d2',
        speaker: 'customer',
        timestamp: '00:14',
        text: 'Wait, I was traveling and thought I had a month to pay. Are you saying my medical cover is canceled?',
        asr_latency_ms: 170,
        confidence: 0.96
      },
      {
        id: 'turn_d3',
        speaker: 'agent',
        timestamp: '00:22',
        text: 'Not at all. You have a full 30-day statutory grace period during which your coverage remains 100% active. I apologize for any initial confusion.',
        gate: {
          turn_id: 'gate_d3',
          status: 'VERIFIED',
          draft_text: 'You have a full 30-day statutory grace period during which your coverage remains 100% active.',
          final_spoken_text: 'You have a full 30-day statutory grace period during which your coverage remains 100% active.',
          receipt: {
            citation: 'kb_policy_014 · v1.3 · 0.99',
            record_id: 'kb_policy_014',
            version: 'v1.3',
            score: 0.99,
            source_title: 'Grace Period and Reinstatement Rules',
            source_file: 'Meridian_Assure_Policy_Wording_v2024.pdf',
            chunk_text: 'Full death benefit and medical rider coverage remain active throughout the grace period...',
            score_breakdown: { dense: 0.98, bm25: 0.99, rerank: 0.99 }
          }
        },
        asr_latency_ms: 165,
        confidence: 0.99
      }
    ],
    nudges: [
      {
        id: 'nudge_comp_01',
        priority: 'P0',
        imperative_text: 'REQUIRED: Clarify 30-day grace period and continuous medical cover',
        rationale: 'Customer expressed distress regarding immediate termination. Mandatory IRDAI compliance notice must be confirmed.',
        confidence: 0.98,
        topic: 'regulatory_grace_period',
        expires_in_sec: 45,
        fired_at: '00:15',
        pinned: true,
        status: 'active',
        waterfall_latency_ms: {
          chunk: 50,
          asr: 155,
          signal: 80,
          llm: 240,
          delivery: 30,
          total: 555
        }
      }
    ],
    suppressedNudges: [
      {
        id: 'sup_d1',
        candidate_text: 'Push for immediate Netbanking payment link',
        topic: 'payment_urgency',
        suppression_reason: 'low_confidence',
        verdict_detail: 'Suppressed: Customer is in compliance risk state; pushy sales nudge suppressed by safety gate.',
        confidence: 0.38,
        timestamp: '00:16'
      }
    ]
  },

  rising_frustration: {
    id: 'rising_frustration',
    name: 'Rising Frustration & Payment Debit Failure',
    description: 'Customer was debited via UPI yesterday but received an overdue reminder today.',
    expectedOutcome: 'System detects escalation markers; offers instant UTR lookup tool and supervisor transfer option.',
    caller: 'Venkatesh Iyer (Masked [CUST_ID_119])',
    policyNo: 'POL-IN-2022-7719',
    market: 'in_en',
    turns: [
      {
        id: 'turn_f1',
        speaker: 'customer',
        timestamp: '00:06',
        text: 'Why are you calling me again?! My account was already debited 14,500 rupees yesterday on Google Pay and your system is still spamming me!',
        asr_latency_ms: 160,
        confidence: 0.98
      },
      {
        id: 'turn_f2',
        speaker: 'agent',
        timestamp: '00:15',
        text: 'I completely understand your frustration Mr. Iyer, and I am very sorry for the distress. Let me check the bank settlement reconciliation right now.',
        gate: {
          turn_id: 'gate_f2',
          status: 'VERIFIED',
          draft_text: 'I completely understand your frustration Mr. Iyer. Let me check the bank settlement reconciliation right now.',
          final_spoken_text: 'I completely understand your frustration Mr. Iyer. Let me check the bank settlement reconciliation right now.',
          receipt: {
            citation: 'kb_faq_022 · v1.3 · 0.93',
            record_id: 'kb_faq_022',
            version: 'v1.3',
            score: 0.93,
            source_title: 'Accepted Digital Payment Channels & Instant Receipt',
            source_file: 'Meridian_Retail_Partner_Benefits_Portal.html',
            chunk_text: 'UPI reconciliations typically settle within 120 seconds. In case of bank clearing delays, UTR reference resolves ledger pending status...',
            score_breakdown: { dense: 0.91, bm25: 0.95, rerank: 0.93 }
          }
        },
        asr_latency_ms: 180,
        confidence: 0.97
      }
    ],
    nudges: [
      {
        id: 'nudge_frust_01',
        priority: 'P0',
        imperative_text: 'Request 12-digit UPI UTR number to immediately clear overdue lock',
        rationale: 'Customer reported debit confirmation with missing CRM acknowledgement. Sentiment index: -0.82 (High Frustration).',
        confidence: 0.94,
        topic: 'payment_reconciliation',
        expires_in_sec: 20,
        fired_at: '00:08',
        status: 'active',
        waterfall_latency_ms: {
          chunk: 55,
          asr: 160,
          signal: 90,
          llm: 260,
          delivery: 35,
          total: 600
        }
      },
      {
        id: 'nudge_frust_02',
        priority: 'P2',
        imperative_text: 'Empathize and offer priority supervisor transfer if UTR not found',
        rationale: 'De-escalation protocol triggered by voice stress and consecutive negative sentiment markers.',
        confidence: 0.86,
        topic: 'de_escalation',
        expires_in_sec: 30,
        fired_at: '00:16',
        status: 'active',
        waterfall_latency_ms: {
          chunk: 60,
          asr: 170,
          signal: 105,
          llm: 280,
          delivery: 40,
          total: 655
        }
      }
    ],
    suppressedNudges: [
      {
        id: 'sup_f1',
        candidate_text: 'Pitch auto-debit registration for next year',
        topic: 'auto_debit_enrollment',
        suppression_reason: 'low_confidence',
        verdict_detail: 'Suppressed: Inappropriate during active dispute (Customer sentiment -0.82 < threshold -0.20).',
        confidence: 0.12,
        timestamp: '00:09'
      }
    ]
  },

  noisy_call: {
    id: 'noisy_call',
    name: 'Noisy Ambiguous Call (False-Positive Guard)',
    description: 'Caller is in heavy traffic with honking audio; demonstrates suppression of uncertain nudges.',
    expectedOutcome: 'System detects SNR < 12dB; false-positive guard suppresses low-confidence speculative nudges.',
    caller: 'Maria Clara (Masked [CUST_ID_044])',
    policyNo: 'POL-PH-2025-9012',
    market: 'ph_tl',
    turns: [
      {
        id: 'turn_n1',
        speaker: 'customer',
        timestamp: '00:05',
        text: '[Loud traffic / honking] ...hello po? Nasa jeep po ako... medyo maingay... ano pong tawag ninyo?',
        asr_latency_ms: 290,
        confidence: 0.74,
        language: 'Taglish (PH)'
      },
      {
        id: 'turn_n2',
        speaker: 'agent',
        timestamp: '00:14',
        text: 'Magandang araw po Ma’am Maria. Meridian Life po ito, magtatanong lang po sana kung natanggap ninyo ang paalala para sa inyong policy renewal.',
        gate: {
          turn_id: 'gate_n2',
          status: 'VERIFIED',
          draft_text: 'Magandang araw po Ma’am Maria. Meridian Life po ito para sa inyong policy renewal.',
          final_spoken_text: 'Magandang araw po Ma’am Maria. Meridian Life po ito, magtatanong lang po sana kung natanggap ninyo ang paalala para sa inyong policy renewal.',
          receipt: {
            citation: 'kb_ph_life_009 · v1.3 · 0.95',
            record_id: 'kb_ph_life_009',
            version: 'v1.3',
            score: 0.95,
            source_title: 'Philippine Life Insurance Grace Period and Bancassurance Taglish Rules',
            source_file: 'Bancassurance_PH_Bilingual_Brochure_Taglish.pdf',
            chunk_text: 'Bancassurance renewal outreach conducts respectful initial inquiry with po/opo particle in Taglish register...',
            score_breakdown: { dense: 0.94, bm25: 0.96, rerank: 0.95 }
          }
        },
        asr_latency_ms: 170,
        confidence: 0.98,
        language: 'Taglish (PH)'
      }
    ],
    nudges: [
      {
        id: 'nudge_noise_01',
        priority: 'P2',
        imperative_text: 'Offer to reschedule or send SMS payment summary due to street noise',
        rationale: 'Acoustic clarity degraded (SNR 10.4 dB). Politeness protocol recommends async channel offer.',
        confidence: 0.89,
        topic: 'channel_switch',
        expires_in_sec: 25,
        fired_at: '00:09',
        status: 'active',
        waterfall_latency_ms: {
          chunk: 90,
          asr: 280,
          signal: 110,
          llm: 290,
          delivery: 40,
          total: 810
        }
      }
    ],
    suppressedNudges: [
      {
        id: 'sup_n1',
        candidate_text: 'Suggest hospital income benefit rider',
        topic: 'rider_upsell',
        suppression_reason: 'noisy_audio_guard',
        verdict_detail: 'Suppressed by Noisy Audio Guard: ASR confidence 0.74 < minimum 0.85 threshold for commercial nudges.',
        confidence: 0.51,
        timestamp: '00:07'
      },
      {
        id: 'sup_n2',
        candidate_text: 'Ask if she needs credit card installment',
        topic: 'payment_options',
        suppression_reason: 'low_confidence',
        verdict_detail: 'Suppressed: Intent acoustic certainty below safe operational cutoff.',
        confidence: 0.42,
        timestamp: '00:08'
      }
    ]
  }
};
