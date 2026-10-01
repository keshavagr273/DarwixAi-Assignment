import React, { useState } from 'react';
import {
  Layers,
  ArrowRight,
  ShieldCheck,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronRight,
  Database,
  Radio,
  Zap,
  Lock,
  GitBranch,
  Sliders
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
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none text-xs">
      {/* Header */}
      <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
              System Topology
            </span>
            <span className="text-xs text-slate-400">
              Multi-Lane Architecture · Fail-Closed Engineering
            </span>
          </div>
          <h1 className="font-heading text-xl lg:text-2xl font-bold text-white tracking-tight">
            System Topology & Tradeoff Matrix
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Multi-lane operational architecture. Click any pipeline component to inspect design rationales, alternatives rejected, failure modes, and automated fallbacks.
          </p>
        </div>
      </div>

      {/* Interactive Topology Diagram */}
      <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 space-y-6 shadow-sm">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2 pb-2 border-b border-[#1F293D]">
          <Layers className="w-4 h-4 text-indigo-400" />
          End-to-End Operational Lanes (Click Nodes to Inspect)
        </h2>

        {/* Lane 1: Real-Time Audio & Telephony */}
        <div className="p-5 bg-[#141C30] border border-[#1F293D] rounded-2xl space-y-3">
          <div className="text-[11px] text-indigo-300 uppercase font-semibold tracking-wider flex items-center gap-2">
            <Radio className="w-3.5 h-3.5" />
            Lane 1: Telephony & Grounded Dialogue Pipeline
          </div>
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {['WebRTC Ingest', 'Silero VAD', 'asr', 'Language Router', 'retrieval', 'Dialogue LLM', 'gate', 'ElevenLabs TTS'].map((node, i) => {
              const isClickable = !!componentDetails[node];
              const isSelected = selectedCompId === node;
              const displayName = componentDetails[node]?.name.split(' (')[0] || node;

              return (
                <React.Fragment key={i}>
                  <button
                    onClick={() => isClickable && setSelectedCompId(node)}
                    className={`px-3 py-2 rounded-xl text-xs transition-all border font-medium ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-transparent shadow-md'
                        : isClickable
                        ? 'bg-[#090D16] text-slate-200 border-[#1F293D] hover:border-indigo-500/50'
                        : 'bg-[#090D16] text-slate-400 border-[#1F293D] cursor-default'
                    }`}
                  >
                    {displayName}
                  </button>
                  {i < 7 && <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Lane 2: Live Insights & Nudge Engine */}
        <div className="p-5 bg-[#141C30] border border-[#1F293D] rounded-2xl space-y-3">
          <div className="text-[11px] text-amber-400 uppercase font-semibold tracking-wider flex items-center gap-2">
            <Zap className="w-3.5 h-3.5" />
            Lane 2: Streaming Call-Insights & Suppression Court
          </div>
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {['Audio Chunk Bus', 'Signal Classifier', 'nudge', 'WebSocket Gateway', 'Cockpit UI'].map((node, i) => {
              const isClickable = !!componentDetails[node];
              const isSelected = selectedCompId === node;
              const displayName = componentDetails[node]?.name.split(' (')[0] || node;

              return (
                <React.Fragment key={i}>
                  <button
                    onClick={() => isClickable && setSelectedCompId(node)}
                    className={`px-3 py-2 rounded-xl text-xs transition-all border font-medium ${
                      isSelected
                        ? 'bg-amber-600 text-white border-transparent shadow-md'
                        : isClickable
                        ? 'bg-[#090D16] text-slate-200 border-[#1F293D] hover:border-amber-500/50'
                        : 'bg-[#090D16] text-slate-400 border-[#1F293D] cursor-default'
                    }`}
                  >
                    {displayName}
                  </button>
                  {i < 4 && <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Lane 3: Data Ingestion & PII Shield */}
        <div className="p-5 bg-[#141C30] border border-[#1F293D] rounded-2xl space-y-3">
          <div className="text-[11px] text-emerald-400 uppercase font-semibold tracking-wider flex items-center gap-2">
            <Database className="w-3.5 h-3.5" />
            Lane 3: Knowledge Base Pipeline & PII Shield
          </div>
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {['Raw Documents', 'Boilerplate Stripper', 'Dedupe Engine', 'pii', 'Chunker', 'pgvector Index'].map((node, i) => {
              const isClickable = !!componentDetails[node];
              const isSelected = selectedCompId === node;
              const displayName = componentDetails[node]?.name.split(' (')[0] || node;

              return (
                <React.Fragment key={i}>
                  <button
                    onClick={() => isClickable && setSelectedCompId(node)}
                    className={`px-3 py-2 rounded-xl text-xs transition-all border font-medium ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-transparent shadow-md'
                        : isClickable
                        ? 'bg-[#090D16] text-slate-200 border-[#1F293D] hover:border-emerald-500/50'
                        : 'bg-[#090D16] text-slate-400 border-[#1F293D] cursor-default'
                    }`}
                  >
                    {displayName}
                  </button>
                  {i < 5 && <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Component Deep-Dive Inspection Box */}
        <div className="p-6 bg-[#090D16] border border-indigo-500/30 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#1F293D] pb-3">
            <span className="font-heading font-semibold text-base text-white">
              Component Deep-Dive: <span className="text-indigo-400">{activeDetail.name}</span>
            </span>
            <span className="text-[11px] text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 font-medium">
              Verified Component
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-[#141C30] border border-[#1F293D] rounded-xl space-y-1.5">
              <div className="text-[11px] text-emerald-400 uppercase font-semibold">
                Why Chosen (Rationale):
              </div>
              <p className="text-slate-200 leading-relaxed font-sans">{activeDetail.whyChosen}</p>
            </div>

            <div className="p-4 bg-[#141C30] border border-[#1F293D] rounded-xl space-y-1.5">
              <div className="text-[11px] text-rose-400 uppercase font-semibold">
                Alternatives Rejected:
              </div>
              <p className="text-slate-300 leading-relaxed font-sans">{activeDetail.alternativesRejected}</p>
            </div>

            <div className="p-4 bg-[#141C30] border border-[#1F293D] rounded-xl space-y-1.5">
              <div className="text-[11px] text-amber-400 uppercase font-semibold">
                Anticipated Failure Mode:
              </div>
              <p className="text-slate-300 leading-relaxed font-sans">{activeDetail.failureMode}</p>
            </div>

            <div className="p-4 bg-[#141C30] border border-[#1F293D] rounded-xl space-y-1.5">
              <div className="text-[11px] text-sky-400 uppercase font-semibold">
                Fail-Closed Fallback Architecture:
              </div>
              <p className="text-slate-200 leading-relaxed font-sans">{activeDetail.failClosedFallback}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Production Roadmap */}
      <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 space-y-4 shadow-sm">
        <h2 className="text-sm font-semibold text-white">
          Production Architecture Roadmap
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-[#141C30] border border-[#1F293D] rounded-2xl space-y-2">
            <div className="flex justify-between text-rose-400 font-semibold">
              <span>P0: Telephony SIP Trunking</span>
              <span className="font-mono text-[11px]">Q4 2026</span>
            </div>
            <p className="text-slate-300 leading-relaxed font-sans">
              Deploy Asterisk / FreeSWITCH SIP gateways with Twilio trunking for real PSTN outbound dialing.
            </p>
          </div>

          <div className="p-5 bg-[#141C30] border border-[#1F293D] rounded-2xl space-y-2">
            <div className="flex justify-between text-amber-400 font-semibold">
              <span>P1: On-Device Small LLM</span>
              <span className="font-mono text-[11px]">Q1 2027</span>
            </div>
            <p className="text-slate-300 leading-relaxed font-sans">
              Fine-tune 3B parameter model on regional Indonesian multifinance conversations to reduce LLM latency to &lt;90ms.
            </p>
          </div>

          <div className="p-5 bg-[#141C30] border border-[#1F293D] rounded-2xl space-y-2">
            <div className="flex justify-between text-emerald-400 font-semibold">
              <span>P2: Continuous Learning</span>
              <span className="font-mono text-[11px]">Q2 2027</span>
            </div>
            <p className="text-slate-300 leading-relaxed font-sans">
              Automated ingestion pipeline from daily customer agent notes with human-in-the-loop review.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
