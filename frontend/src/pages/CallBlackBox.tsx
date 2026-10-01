import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockTraceSpans } from '../data/mockCallsData';
import { TraceSpan } from '../types';
import {
  Activity,
  ArrowLeft,
  Clock,
  Cpu,
  Layers,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Sliders,
  Play
} from 'lucide-react';

export const CallBlackBox: React.FC = () => {
  const { traceId = 'tr_8f902a11c8e9' } = useParams();
  const spans: TraceSpan[] = mockTraceSpans[traceId] || mockTraceSpans['tr_8f902a11c8e9'];

  const [replayModel, setReplayModel] = useState('Claude 3.5 Sonnet');
  const [replayKb, setReplayKb] = useState('v1.3');
  const [replaySimulating, setReplaySimulating] = useState(false);
  const [replayResult, setReplayResult] = useState<string | null>(null);

  const totalDurationMs = spans[spans.length - 1].start_ms + spans[spans.length - 1].duration_ms;

  const handleSimulateReplay = () => {
    setReplaySimulating(true);
    setReplayResult(null);
    setTimeout(() => {
      setReplaySimulating(false);
      setReplayResult('Turn Replayed: Output identical to canonical grounded response. Latency: 640ms (-95ms faster). Zero hallucination delta.');
    }, 1200);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none text-xs">
      {/* Header */}
      <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 mb-1">
            <Link to="/calls" className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Call Library
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-indigo-400 font-mono font-semibold">{traceId}</span>
          </div>
          <h1 className="font-heading text-xl lg:text-2xl font-bold text-white tracking-tight">
            Call Black Box Flight Recorder
          </h1>
          <p className="text-slate-300 max-w-2xl leading-relaxed">
            Microsecond telemetry spans across VAD, streaming ASR, hybrid retrieval, LLM turn generation, sentence gate validation, and TTS delivery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-4 bg-[#141C30] border border-[#1F293D] rounded-2xl text-right">
            <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Total Turn Latency</div>
            <div className="text-emerald-400 text-lg font-bold font-mono mt-0.5">{totalDurationMs} ms</div>
          </div>
        </div>
      </div>

      {/* Flight Recorder Waterfall Spans */}
      <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 space-y-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#1F293D] pb-3">
          <span className="text-xs uppercase tracking-wider text-white font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            Turn Telemetry Timeline ({spans.length} Spans)
          </span>
          <span className="text-slate-400 font-mono text-[11px]">Start 0ms → Spoken Delivery {totalDurationMs}ms</span>
        </div>

        <div className="space-y-3">
          {spans.map((sp) => {
            const leftPct = (sp.start_ms / totalDurationMs) * 100;
            const widthPct = Math.max(3, (sp.duration_ms / totalDurationMs) * 100);

            return (
              <div key={sp.id} className="p-3.5 bg-[#141C30] border border-[#1F293D] rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{sp.name}</span>
                    <span className="text-slate-400 text-[11px]">({sp.provider})</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-slate-400">Start: {sp.start_ms}ms</span>
                    <span className="text-emerald-400 font-semibold">{sp.duration_ms} ms</span>
                  </div>
                </div>

                {/* Timeline Gantt bar */}
                <div className="w-full h-2.5 bg-[#090D16] rounded-full overflow-hidden relative border border-[#1F293D]">
                  <div
                    className={`h-full absolute rounded-full ${
                      sp.status === 'cached' ? 'bg-violet-500' : 'bg-indigo-500'
                    }`}
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Turn Replay Simulator */}
      <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-[#1F293D]">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-emerald-400" />
            Counterfactual Turn Replay Simulator
          </h2>
          <span className="text-slate-400 font-mono text-[11px]">Deterministic Replay</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1.5 font-medium">Alternative LLM Engine:</label>
            <select
              value={replayModel}
              onChange={(e) => setReplayModel(e.target.value)}
              className="w-full p-2.5 bg-[#141C30] border border-[#1F293D] rounded-xl text-slate-200 focus:outline-none"
            >
              <option value="Claude 3.5 Haiku">Claude 3.5 Haiku (Fast)</option>
              <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet (Strong)</option>
              <option value="Groq Llama-3-70b">Groq Llama-3-70b (Ultra-fast)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1.5 font-medium">Knowledge Snapshot:</label>
            <select
              value={replayKb}
              onChange={(e) => setReplayKb(e.target.value)}
              className="w-full p-2.5 bg-[#141C30] border border-[#1F293D] rounded-xl text-slate-200 focus:outline-none"
            >
              <option value="v1.3">v1.3 (Active Production)</option>
              <option value="v1.2">v1.2 (Legacy)</option>
              <option value="v1.1">v1.1 (Pre-PII Audit)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSimulateReplay}
              disabled={replaySimulating}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              {replaySimulating ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Execute Turn Replay
            </button>
          </div>
        </div>

        {replayResult && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 font-sans text-xs">
            {replayResult}
          </div>
        )}
      </div>
    </div>
  );
};
