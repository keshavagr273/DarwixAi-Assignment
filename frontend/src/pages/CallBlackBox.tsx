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
    <div className="p-6 space-y-6 max-w-7xl mx-auto select-none font-mono text-xs">
      {/* Header */}
      <div className="bg-[#121821] border border-[#243041] rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/calls" className="text-[#8A97A8] hover:text-[#E6EDF5] flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Calls
            </Link>
            <span className="text-[#57677D]">/</span>
            <span className="text-[#4CC9F0] font-semibold">{traceId}</span>
          </div>
          <h1 className="font-heading text-xl font-bold text-[#E6EDF5]">
            Call Black Box Flight Recorder
          </h1>
          <p className="text-[#8A97A8] font-sans">
            Microsecond telemetry spans across VAD, streaming ASR, hybrid retrieval, LLM, fail-closed sentence gate, and TTS delivery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#0B0F14] border border-[#243041] rounded text-right">
            <div className="text-[10px] text-[#8A97A8]">TOTAL TURN LATENCY</div>
            <div className="text-[#3DDC97] text-base font-bold">{totalDurationMs} ms</div>
          </div>
        </div>
      </div>

      {/* Flight Recorder Waterfall Spans */}
      <div className="bg-[#121821] border border-[#243041] rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#243041] pb-2">
          <span className="text-xs uppercase tracking-wider text-[#E6EDF5] font-semibold flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-[#4CC9F0]" />
            Turn Telemetry Timeline ({spans.length} Spans)
          </span>
          <span className="text-[#57677D]">Start 0ms → Delivery {totalDurationMs}ms</span>
        </div>

        <div className="space-y-2">
          {spans.map((sp) => {
            const leftPct = (sp.start_ms / totalDurationMs) * 100;
            const widthPct = Math.max(3, (sp.duration_ms / totalDurationMs) * 100);

            return (
              <div key={sp.id} className="p-2.5 bg-[#18212D] border border-[#243041] rounded space-y-1.5">
                <div className="flex justify-between items-center text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#E6EDF5]">{sp.name}</span>
                    <span className="text-[#8A97A8]">({sp.provider})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#57677D]">Start: {sp.start_ms}ms</span>
                    <span className="text-[#3DDC97] font-semibold">{sp.duration_ms} ms</span>
                  </div>
                </div>

                {/* Timeline Gantt bar */}
                <div className="w-full h-2.5 bg-[#0B0F14] rounded-full overflow-hidden relative">
                  <div
                    className={`h-full absolute rounded-full ${
                      sp.status === 'cached' ? 'bg-[#A78BFA]' : 'bg-[#3DDC97]'
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
      <div className="bg-[#121821] border border-[#243041] rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-wider text-[#E6EDF5] font-semibold flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4 text-[#3DDC97]" />
            A/B Replay Turn with Alternate Model or KB Snapshot
          </h2>
          <span className="text-[#57677D]">Deterministic Replay Engine</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] text-[#8A97A8] block mb-1">SELECT LLM ENGINE:</label>
            <select
              value={replayModel}
              onChange={(e) => setReplayModel(e.target.value)}
              className="w-full p-2 bg-[#0B0F14] border border-[#243041] rounded text-[#E6EDF5] focus:outline-none"
            >
              <option value="Claude 3.5 Haiku">Claude 3.5 Haiku (Fast)</option>
              <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet (Strong)</option>
              <option value="GPT-4o Mini">GPT-4o Mini</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-[#8A97A8] block mb-1">TARGET KB SNAPSHOT:</label>
            <select
              value={replayKb}
              onChange={(e) => setReplayKb(e.target.value)}
              className="w-full p-2 bg-[#0B0F14] border border-[#243041] rounded text-[#E6EDF5] focus:outline-none"
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
              className="w-full py-2 bg-[#13221C] hover:bg-[#1A3328] text-[#3DDC97] border border-[#3DDC97]/60 rounded font-semibold flex items-center justify-center gap-1.5"
            >
              {replaySimulating ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Execute Replay Simulation
            </button>
          </div>
        </div>

        {replayResult && (
          <div className="p-3 bg-[#0B0F14] border border-[#3DDC97]/40 rounded text-[#3DDC97] font-sans text-xs">
            {replayResult}
          </div>
        )}
      </div>
    </div>
  );
};
