import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  Zap,
  Database,
  Bot,
  Globe2,
  Play,
  CheckCircle2,
  Cpu,
  ChevronRight,
  ArrowUpRight,
  Radio,
  FileCheck,
  Clock,
  Filter
} from 'lucide-react';

export const MissionControl: React.FC = () => {
  const { openReceipt } = useApp();
  const navigate = useNavigate();

  const coreModules = [
    {
      id: 'voice-agent',
      title: 'Autonomous Voice Agent',
      subtitle: 'Policy Renewal & Inbound Intent Qualification',
      status: 'Operational',
      statusBadge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      primaryMetric: '96.4%',
      metricLabel: 'Grounded Answer Rate',
      description: 'Zero ungrounded hallucinations permitted. Real-time sentence gate validates every claim before audio synthesis.',
      lastVerification: '5/5 Scenarios Verified',
      openPath: '/agent',
      actionText: 'Open Voice Studio',
      icon: Bot,
    },
    {
      id: 'knowledge-shield',
      title: 'Knowledge Engine & PII Vault',
      subtitle: 'Versioned RAG, Chunk Provenance & Tokenization',
      status: 'Snapshot v1.3',
      statusBadge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      primaryMetric: '412 Records',
      metricLabel: '0 PII Leaks (100% Shielded)',
      description: 'Hybrid Dense + BM25 + Cross-Encoder retrieval with deterministic vault tokens protecting customer identities.',
      lastVerification: '12/12 CI Gates Clean',
      openPath: '/kb',
      actionText: 'Open Knowledge Studio',
      icon: Database,
    },
    {
      id: 'localization',
      title: 'Multilingual Localization',
      subtitle: 'Southeast Asian Dialects & Formal Registers',
      status: 'Register Locked',
      statusBadge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      primaryMetric: '3 Markets',
      metricLabel: 'Linguistic Adaptation ≠ Translation',
      description: 'Native Taglish and Indonesian vernacular with locked Po/Opo honorifics and regional debt repayment terminology.',
      lastVerification: 'Zero English Drift',
      openPath: '/markets',
      actionText: 'Inspect Language Packs',
      icon: Globe2,
    },
    {
      id: 'live-copilot',
      title: 'Live Copilot & Nudge Court',
      subtitle: 'Real-Time Insights & False-Positive Suppression',
      status: 'Streaming Active',
      statusBadge: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      primaryMetric: '81.2%',
      metricLabel: 'Precision (14 Suppressed)',
      description: 'Sub-second prioritized guidance (P0–P3) with suppression court to eliminate agent alert fatigue.',
      lastVerification: 'P95 < 2.5s Budget Met',
      openPath: '/live',
      actionText: 'Open Live Copilot',
      icon: Zap,
    },
  ];

  const refusalsLedger = [
    {
      id: 'ref_01',
      question: 'Can you guarantee 24% annual stock return like the CEO tweet?',
      refusalReason: 'hallucination_attempt',
      gateAction: 'Blocked claim · Offered licensed advisor callback',
      market: 'in_en',
      citation: 'kb_qual_003 · v1.3 · 0.96',
      timestamp: '11:42:09'
    },
    {
      id: 'ref_02',
      question: 'Pwede po ba akong mangutang para ipang-casino sa Pasay?',
      refusalReason: 'out_of_scope_gambling',
      gateAction: 'Polite refusal in native Taglish (No English drift)',
      market: 'ph_tl',
      citation: 'kb_ph_life_009 · v1.3 · 0.95',
      timestamp: '10:15:33'
    },
    {
      id: 'ref_03',
      question: 'Bolehkah titip uang tunai ke surveyor lapangan tanpa kwitansi resmi?',
      refusalReason: 'anti_fraud_violation',
      gateAction: 'Strict Block: Warned against unverified cash handover',
      market: 'id_id',
      citation: 'kb_id_multi_012 · v1.3 · 0.99',
      timestamp: '09:28:44'
    },
    {
      id: 'ref_04',
      question: 'What is the stock price on the Bombay Stock Exchange today?',
      refusalReason: 'no_kb_match',
      gateAction: 'Fail-closed fallback: Offered support desk transfer',
      market: 'in_en',
      citation: 'UNSUPPORTED',
      timestamp: '08:50:11'
    },
    {
      id: 'ref_05',
      question: 'What was the phone number of the customer called before me?',
      refusalReason: 'pii_exfiltration_risk',
      gateAction: 'Cross-tenant guard tripped: Access denied',
      market: 'in_en',
      citation: 'SYSTEM_GATE',
      timestamp: '08:12:00'
    }
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#111827] to-[#0E1424] border border-[#1F293D] rounded-2xl p-6 lg:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-medium text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Production Pipeline Operational</span>
            </div>
            <h1 className="font-heading text-2xl lg:text-3xl font-bold tracking-tight text-white">
              PARLEY Command Center
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Operational control surface for grounded multilingual voice agents. Every spoken claim carries a verifiable citation receipt, and live nudges are filtered to eliminate agent fatigue.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/demo')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#141C30] hover:bg-[#1A2540] border border-[#1F293D] hover:border-slate-500 text-slate-200 rounded-xl text-xs font-semibold transition-all shadow-sm"
            >
              <Play className="w-3.5 h-3.5 text-indigo-400" />
              Run Product Tour
            </button>
            <button
              onClick={() => navigate('/live')}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/20"
            >
              <Zap className="w-3.5 h-3.5" />
              Launch Live Copilot
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core Pillars Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide text-slate-200 uppercase font-mono">
            Platform Capabilities
          </h2>
          <span className="text-xs text-slate-400">
            4 of 4 Verified in Production
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {coreModules.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="bg-[#0E1424] hover:bg-[#12192C] border border-[#1F293D] hover:border-slate-600 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 space-y-5 shadow-sm group"
              >
                <div className="space-y-4">
                  {/* Top card bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[#141C30] border border-[#1F293D] group-hover:border-indigo-500/40 transition-colors">
                        <Icon className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="font-heading text-base font-semibold text-white">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-400">{item.subtitle}</p>
                      </div>
                    </div>
                    <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${item.statusBadge}`}>
                      {item.status}
                    </span>
                  </div>

                  {/* Highlight Metric */}
                  <div className="p-4 bg-[#141C30]/70 border border-[#1F293D] rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xl font-bold font-mono text-white tracking-tight">
                        {item.primaryMetric}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {item.metricLabel}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-emerald-400 flex items-center gap-1.5 justify-end">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {item.lastVerification}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Automated Verification
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#1F293D] flex items-center justify-between">
                  <span className="text-xs text-slate-400">Production Ready</span>
                  <button
                    onClick={() => navigate(item.openPath)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#141C30] hover:bg-indigo-600/20 text-slate-200 hover:text-indigo-300 border border-[#1F293D] hover:border-indigo-500/40 rounded-lg text-xs font-medium transition-all"
                  >
                    <span>{item.actionText}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Latency Telemetry Breakdown */}
      <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#1F293D]">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">
              End-to-End Pipeline Latency Telemetry
            </h2>
          </div>
          <div className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
            P95 Total: 1,087 ms · Budget: 2,500 ms (Green)
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
          <div className="p-3 bg-[#141C30] border border-[#1F293D] rounded-xl space-y-1">
            <div className="text-[11px] text-slate-400">VAD (Silero)</div>
            <div className="font-mono text-base font-bold text-white">35 ms</div>
            <div className="text-[10px] text-emerald-400 font-mono">P95: 55 ms</div>
          </div>
          <div className="p-3 bg-[#141C30] border border-[#1F293D] rounded-xl space-y-1">
            <div className="text-[11px] text-slate-400">ASR (Deepgram)</div>
            <div className="font-mono text-base font-bold text-white">170 ms</div>
            <div className="text-[10px] text-emerald-400 font-mono">P95: 240 ms</div>
          </div>
          <div className="p-3 bg-[#141C30] border border-[#1F293D] rounded-xl space-y-1">
            <div className="text-[11px] text-slate-400">Hybrid RAG Search</div>
            <div className="font-mono text-base font-bold text-white">48 ms</div>
            <div className="text-[10px] text-emerald-400 font-mono">P95: 72 ms</div>
          </div>
          <div className="p-3 bg-[#141C30] border border-[#1F293D] rounded-xl space-y-1">
            <div className="text-[11px] text-slate-400">LLM Generation</div>
            <div className="font-mono text-base font-bold text-white">290 ms</div>
            <div className="text-[10px] text-emerald-400 font-mono">P95: 420 ms</div>
          </div>
          <div className="p-3 bg-[#141C30] border border-[#1F293D] rounded-xl space-y-1">
            <div className="text-[11px] text-slate-400">Sentence Gate</div>
            <div className="font-mono text-base font-bold text-white">42 ms</div>
            <div className="text-[10px] text-emerald-400 font-mono">P95: 60 ms</div>
          </div>
          <div className="p-3 bg-[#141C30] border border-[#1F293D] rounded-xl space-y-1">
            <div className="text-[11px] text-slate-400">TTS Audio Out</div>
            <div className="font-mono text-base font-bold text-white">180 ms</div>
            <div className="text-[10px] text-emerald-400 font-mono">P95: 240 ms</div>
          </div>
        </div>
      </div>

      {/* Hallucination Prevention & Refusal Ledger */}
      <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                Fail-Closed Refusals & Hallucination Prevention Ledger
              </h2>
              <p className="text-xs text-slate-400">
                Audited queries where the agent safely declined to invent ungrounded answers.
              </p>
            </div>
          </div>
          <span className="text-xs font-medium px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full self-start sm:self-auto">
            5 Logged · 0 Ungrounded Hallucinations
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#1F293D]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1F293D] text-slate-400 bg-[#141C30] font-medium">
                <th className="py-3 px-4 font-mono">Time</th>
                <th className="py-3 px-4">Market</th>
                <th className="py-3 px-4">User Inquiry / Adversarial Prompt</th>
                <th className="py-3 px-4">Reason Code</th>
                <th className="py-3 px-4">Fail-Closed Verdict</th>
                <th className="py-3 px-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F293D] bg-[#0E1424]">
              {refusalsLedger.map((row) => (
                <tr key={row.id} className="hover:bg-[#141C30]/50 transition-colors">
                  <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">{row.timestamp}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 bg-[#141C30] border border-[#1F293D] rounded text-slate-200 text-[11px] font-mono uppercase">
                      {row.market}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-200 font-medium max-w-sm truncate">
                    "{row.question}"
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-[11px] font-mono">
                      {row.refusalReason}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">
                    {row.gateAction}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {row.citation !== 'UNSUPPORTED' && row.citation !== 'SYSTEM_GATE' ? (
                      <button
                        onClick={() =>
                          openReceipt({
                            citation: row.citation,
                            record_id: row.citation.split(' ')[0],
                            version: 'v1.3',
                            score: 0.96,
                            source_title: 'Fail-Closed Reference Policy',
                            source_file: 'Master_Policy_Schedule_v2024.pdf',
                            chunk_text: 'Statutory compliance requires refusal of unverified financial commitments and immediate transfer to authorized human supervisor...',
                            score_breakdown: { dense: 0.95, bm25: 0.98, rerank: 0.96 }
                          })
                        }
                        className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium hover:underline text-xs"
                      >
                        <span>Receipt</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">System Gate</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
