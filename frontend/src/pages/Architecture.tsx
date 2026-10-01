import React, { useState } from 'react';
import {
  Layers,
  ArrowRight,
  ShieldCheck,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Info,
  Palette,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface ComponentDetail {
  id: string;
  name: string;
  lane: 'telephony' | 'nudge' | 'data';
  whyChosen: string;
  alternativesRejected: string;
  failureMode: string;
  failClosedFallback: string;
}

const componentDetails: Record<string, ComponentDetail> = {
  asr: {
    id: 'asr',
    name: 'Streaming ASR (Deepgram Nova-2 Telephony)',
    lane: 'telephony',
    whyChosen: 'Lowest streaming time-to-first-token (185ms), excellent code-switching accuracy for Taglish and Hinglish, custom finance phrase boosting.',
    alternativesRejected: 'Whisper Large-v3 (440ms latency was too high for 250ms streaming chunk budget); Google Speech-to-Text v2 (3.7x higher cost).',
    failureMode: 'Acoustic SNR < 10dB (heavy street traffic noise or speech overlap).',
    failClosedFallback: 'Silero VAD holds chunk until confident endpoint; throttles speculative downstream commercial nudges.'
  },
  retrieval: {
    id: 'retrieval',
    name: 'Hybrid Retriever (pgvector + BM25 + BGE Reranker)',
    lane: 'telephony',
    whyChosen: 'Dense embeddings excel at semantic paraphrasing; BM25 guarantees exact keyword hits (policy clauses, grace period numbers); cross-encoder reranks top 5.',
    alternativesRejected: 'Pure vector search (frequently retrieved wrong policy versions); pure Elasticsearch (failed colloquial paraphrasing).',
    failureMode: 'Query completely out of domain or ambiguous customer statement.',
    failClosedFallback: 'Score < 0.65 threshold fires fail-closed unavailable information fallback in native register.'
  },
  gate: {
    id: 'gate',
    name: 'Sentence Gate (Grounding Verifier)',
    lane: 'telephony',
    whyChosen: 'Intercepts model output before TTS synthesis. Verifies factual claims against retrieved canonical chunk citations.',
    alternativesRejected: 'Post-hoc audit (leaves customer exposed to live hallucination during the call).',
    failureMode: 'Model generates ungrounded claim or hallucinates rate of return.',
    failClosedFallback: 'Immediate fail-closed block; replaces output sentence with pre-certified fallback phrase.'
  },
  nudge: {
    id: 'nudge',
    name: 'Real-Time Nudge Engine & Court',
    lane: 'nudge',
    whyChosen: 'Extracts real-time signals on 250ms chunks and scores priority P0-P3. Suppression rules eliminate alert fatigue.',
    alternativesRejected: 'Post-call batch review (misses the moment of customer objection or disclosure violation).',
    failureMode: 'Spurious low-confidence cues during noisy audio.',
    failClosedFallback: 'Nudge Court suppresses alert with logged reason (cooldown, low_confidence, duplicate).'
  },
  pii: {
    id: 'pii',
    name: 'PII Shield & Deterministic Vault',
    lane: 'data',
    whyChosen: 'Regex + NER replaces phone numbers, policy IDs, and national IDs with tokens [PHONE_1] before chunking and embedding.',
    alternativesRejected: 'Relying on LLM prompt instructions not to leak (prompts are vulnerable to extraction attacks).',
    failureMode: 'Novel unformatted PII patterns.',
    failClosedFallback: 'Automated CI regression test scans 100% of chunks; fails build if raw pattern detected.'
  }
};

export const Architecture: React.FC = () => {
  const [selectedCompId, setSelectedCompId] = useState<string>('gate');
  const activeDetail = componentDetails[selectedCompId] || componentDetails.gate;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto select-none font-mono text-xs">
      {/* Header */}
      <div className="bg-[#121821] border border-[#243041] rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 bg-[#18212D] text-[#3DDC97] border border-[#243041] rounded font-semibold">
              SYSTEM ARCHITECTURE & DESIGN DECISIONS
            </span>
            <span className="text-xs text-[#8A97A8]">
              Defendable Technical Choices · Fail-Closed Engineering
            </span>
          </div>
          <h1 className="font-heading text-xl font-bold text-[#E6EDF5] mt-1">
            System Topology & Tradeoff Matrix
          </h1>
          <p className="text-xs text-[#8A97A8] font-sans">
            Interactive multi-lane architecture diagram. Click any node to review why it was chosen, alternatives rejected, failure modes, and fallbacks.
          </p>
        </div>
      </div>

      {/* Interactive Topology Diagram */}
      <div className="bg-[#121821] border border-[#243041] rounded-lg p-5 space-y-6">
        <h2 className="text-xs uppercase tracking-wider text-[#E6EDF5] font-semibold flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-[#3DDC97]" />
          End-to-End Operational Lanes (Click Nodes for Deep-Dive)
        </h2>

        {/* Lane 1: Real-Time Audio & Telephony */}
        <div className="p-4 bg-[#18212D] border border-[#243041] rounded-lg space-y-2">
          <div className="text-[10px] text-[#4CC9F0] uppercase font-semibold">
            LANE 1: TELEPHONY & GROUNDED DIALOGUE PATH
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {['WebRTC Ingest', 'Silero VAD', 'asr', 'Language Router', 'retrieval', 'Dialogue LLM', 'gate', 'ElevenLabs TTS'].map((node, i) => {
              const isClickable = !!componentDetails[node];
              const isSelected = selectedCompId === node;
              const displayName = componentDetails[node]?.name.split(' (')[0] || node;

              return (
                <React.Fragment key={i}>
                  <button
                    onClick={() => isClickable && setSelectedCompId(node)}
                    className={`px-3 py-2 rounded text-xs transition-colors border ${
                      isSelected
                        ? 'bg-[#13221C] text-[#3DDC97] border-[#3DDC97] font-semibold'
                        : isClickable
                        ? 'bg-[#0B0F14] text-[#E6EDF5] border-[#243041] hover:border-[#4CC9F0]'
                        : 'bg-[#0B0F14] text-[#8A97A8] border-[#243041] cursor-default'
                    }`}
                  >
                    {displayName}
                  </button>
                  {i < 7 && <ArrowRight className="w-3.5 h-3.5 text-[#57677D]" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Lane 2: Live Insights & Nudge Engine */}
        <div className="p-4 bg-[#18212D] border border-[#243041] rounded-lg space-y-2">
          <div className="text-[10px] text-[#FFB547] uppercase font-semibold">
            LANE 2: STREAMING CALL-INSIGHTS & NUDGE COURT
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {['Audio Chunk Bus', 'Signal Classifier', 'nudge', 'WebSocket Gateway', 'Cockpit UI'].map((node, i) => {
              const isClickable = !!componentDetails[node];
              const isSelected = selectedCompId === node;
              const displayName = componentDetails[node]?.name.split(' (')[0] || node;

              return (
                <React.Fragment key={i}>
                  <button
                    onClick={() => isClickable && setSelectedCompId(node)}
                    className={`px-3 py-2 rounded text-xs transition-colors border ${
                      isSelected
                        ? 'bg-[#261E14] text-[#FFB547] border-[#FFB547] font-semibold'
                        : isClickable
                        ? 'bg-[#0B0F14] text-[#E6EDF5] border-[#243041] hover:border-[#FFB547]'
                        : 'bg-[#0B0F14] text-[#8A97A8] border-[#243041] cursor-default'
                    }`}
                  >
                    {displayName}
                  </button>
                  {i < 4 && <ArrowRight className="w-3.5 h-3.5 text-[#57677D]" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Lane 3: Data Ingestion & PII Shield */}
        <div className="p-4 bg-[#18212D] border border-[#243041] rounded-lg space-y-2">
          <div className="text-[10px] text-[#3DDC97] uppercase font-semibold">
            LANE 3: KNOWLEDGE BASE PIPELINE & VERSIONING
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {['Raw Documents', 'Boilerplate Stripper', 'Dedupe Engine', 'pii', 'Chunker', 'pgvector Index'].map((node, i) => {
              const isClickable = !!componentDetails[node];
              const isSelected = selectedCompId === node;
              const displayName = componentDetails[node]?.name.split(' (')[0] || node;

              return (
                <React.Fragment key={i}>
                  <button
                    onClick={() => isClickable && setSelectedCompId(node)}
                    className={`px-3 py-2 rounded text-xs transition-colors border ${
                      isSelected
                        ? 'bg-[#13221C] text-[#3DDC97] border-[#3DDC97] font-semibold'
                        : isClickable
                        ? 'bg-[#0B0F14] text-[#E6EDF5] border-[#243041] hover:border-[#3DDC97]'
                        : 'bg-[#0B0F14] text-[#8A97A8] border-[#243041] cursor-default'
                    }`}
                  >
                    {displayName}
                  </button>
                  {i < 5 && <ArrowRight className="w-3.5 h-3.5 text-[#57677D]" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Component Deep-Dive Inspection Box */}
        <div className="p-5 bg-[#0B0F14] border border-[#3DDC97]/50 rounded-lg space-y-4">
          <div className="flex items-center justify-between border-b border-[#243041] pb-2">
            <span className="font-heading font-semibold text-base text-[#3DDC97]">
              Component Inspector: {activeDetail.name}
            </span>
            <span className="text-[10px] text-[#8A97A8] bg-[#18212D] px-2 py-0.5 rounded border border-[#243041]">
              DEFENDABLE CHOICE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div className="p-3 bg-[#18212D] border border-[#243041] rounded space-y-1">
              <div className="font-mono text-[10px] text-[#3DDC97] uppercase font-semibold">
                Why Chosen (Rationale):
              </div>
              <p className="text-[#E6EDF5] leading-relaxed">{activeDetail.whyChosen}</p>
            </div>

            <div className="p-3 bg-[#18212D] border border-[#243041] rounded space-y-1">
              <div className="font-mono text-[10px] text-[#FF5C6C] uppercase font-semibold">
                Alternatives Rejected:
              </div>
              <p className="text-[#8A97A8] leading-relaxed">{activeDetail.alternativesRejected}</p>
            </div>

            <div className="p-3 bg-[#18212D] border border-[#243041] rounded space-y-1">
              <div className="font-mono text-[10px] text-[#FFB547] uppercase font-semibold">
                Anticipated Failure Mode:
              </div>
              <p className="text-[#8A97A8] leading-relaxed">{activeDetail.failureMode}</p>
            </div>

            <div className="p-3 bg-[#18212D] border border-[#243041] rounded space-y-1">
              <div className="font-mono text-[10px] text-[#4CC9F0] uppercase font-semibold">
                Fail-Closed Fallback Architecture:
              </div>
              <p className="text-[#E6EDF5] leading-relaxed">{activeDetail.failClosedFallback}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Production Improvement Plan */}
      <div className="bg-[#121821] border border-[#243041] rounded-lg p-5 space-y-4">
        <h2 className="text-xs uppercase tracking-wider text-[#E6EDF5] font-semibold">
          Production Improvement Plan (Post-Assessment Roadmap)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#18212D] border border-[#243041] rounded space-y-2">
            <div className="flex justify-between text-[#FF5C6C] font-semibold">
              <span>P0: Telephony SIP Trunking</span>
              <span>Q4 2026</span>
            </div>
            <p className="text-[#8A97A8] font-sans">
              Deploy Asterisk / FreeSWITCH SIP gateways with Twilio trunking for real PSTN outbound dialing.
            </p>
          </div>

          <div className="p-4 bg-[#18212D] border border-[#243041] rounded space-y-2">
            <div className="flex justify-between text-[#FFB547] font-semibold">
              <span>P1: On-Device Small LLM</span>
              <span>Q1 2027</span>
            </div>
            <p className="text-[#8A97A8] font-sans">
              Fine-tune 3B parameter model on regional Indonesian multifinance conversations to reduce LLM latency to &lt;90ms.
            </p>
          </div>

          <div className="p-4 bg-[#18212D] border border-[#243041] rounded space-y-2">
            <div className="flex justify-between text-[#3DDC97] font-semibold">
              <span>P2: Continuous Learning</span>
              <span>Q2 2027</span>
            </div>
            <p className="text-[#8A97A8] font-sans">
              Automated ingestion pipeline from daily customer agent notes with human-in-the-loop review.
            </p>
          </div>
        </div>
      </div>

      {/* Design System Tokens (Section 9.5 requirement) */}
      <div id="design" className="bg-[#121821] border border-[#243041] rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#243041] pb-2">
          <h2 className="text-xs uppercase tracking-wider text-[#E6EDF5] font-semibold flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-[#A78BFA]" />
            PARLEY Design System & Strict Solid Color Tokens (Zero Gradients)
          </h2>
          <span className="text-[#3DDC97]">Air-Traffic Control Spec</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
          <div className="p-3 bg-[#0B0F14] border border-[#243041] rounded">
            <div className="w-6 h-6 rounded bg-[#3DDC97] mx-auto mb-1" />
            <div className="text-[#E6EDF5] font-semibold">#3DDC97</div>
            <div className="text-[10px] text-[#8A97A8]">signal-green (Grounded)</div>
          </div>

          <div className="p-3 bg-[#0B0F14] border border-[#243041] rounded">
            <div className="w-6 h-6 rounded bg-[#FFB547] mx-auto mb-1" />
            <div className="text-[#E6EDF5] font-semibold">#FFB547</div>
            <div className="text-[10px] text-[#8A97A8]">signal-amber (Suppressed)</div>
          </div>

          <div className="p-3 bg-[#0B0F14] border border-[#243041] rounded">
            <div className="w-6 h-6 rounded bg-[#FF5C6C] mx-auto mb-1" />
            <div className="text-[#E6EDF5] font-semibold">#FF5C6C</div>
            <div className="text-[10px] text-[#8A97A8]">signal-red (Blocked Gate)</div>
          </div>

          <div className="p-3 bg-[#0B0F14] border border-[#243041] rounded">
            <div className="w-6 h-6 rounded bg-[#4CC9F0] mx-auto mb-1" />
            <div className="text-[#E6EDF5] font-semibold">#4CC9F0</div>
            <div className="text-[10px] text-[#8A97A8]">signal-cyan (Streaming Live)</div>
          </div>

          <div className="p-3 bg-[#0B0F14] border border-[#243041] rounded">
            <div className="w-6 h-6 rounded bg-[#A78BFA] mx-auto mb-1" />
            <div className="text-[#E6EDF5] font-semibold">#A78BFA</div>
            <div className="text-[10px] text-[#8A97A8]">signal-violet (Model Draft)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
