import React, { useState } from 'react';
import {
  mockAccentBenchmarks,
  mockWordDiffExample,
  mockProviders,
  mockTtsCompromises
} from '../data/mockAsrData';
import {
  Mic,
  AlertTriangle,
  Cpu,
  Layers,
  CheckCircle2,
  Sliders,
  Volume2
} from 'lucide-react';

export const AsrBench: React.FC = () => {
  const [selectedAccentIdx, setSelectedAccentIdx] = useState<number>(1); // Default to Javanese
  const currentAccent = mockAccentBenchmarks[selectedAccentIdx];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
              Speech Engineering
            </span>
            <span className="text-xs text-slate-400">
              Empirical ASR Evaluation · Regional Indonesian Accents & Street Noise
            </span>
          </div>
          <h1 className="font-heading text-xl lg:text-2xl font-bold text-white tracking-tight">
            ASR & TTS Engineering Bench
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Measure Word Error Rate (WER) across regional dialects, inspect phoneme substitution diffs, and review streaming provider tradeoffs.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="p-3 bg-[#141C30] border border-[#1F293D] rounded-xl">
            <span className="text-slate-400">Primary Engine: </span>
            <strong className="text-emerald-400 font-mono ml-1">Deepgram Nova-2 (185ms)</strong>
          </div>
        </div>
      </div>

      {/* Regional Accent Matrix */}
      <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#1F293D]">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Mic className="w-4 h-4 text-indigo-400" />
              Regional Dialect WER Benchmark Matrix (n=695 Samples)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any accent row to view its phonetic error patterns and word-level alignment diff.
            </p>
          </div>
          <span className="text-xs text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/20 font-mono">
            Telephony Labeled Mini-Set
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {mockAccentBenchmarks.map((acc, idx) => {
            const isSelected = selectedAccentIdx === idx;
            return (
              <div
                key={acc.accent}
                onClick={() => setSelectedAccentIdx(idx)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-600/15 border-indigo-500/50 shadow-md shadow-indigo-950/20'
                    : 'bg-[#141C30] border-[#1F293D] hover:border-slate-500'
                }`}
              >
                <div className="font-heading font-semibold text-sm text-white mb-0.5">
                  {acc.accent}
                </div>
                <div className="text-[11px] text-slate-400 mb-3">{acc.region}</div>

                <div className="space-y-1.5 border-t border-[#1F293D] pt-3 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Clean (&gt;25dB):</span>
                    <span className="text-emerald-400 font-semibold">{acc.werClean}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Moderate (15–25dB):</span>
                    <span className="text-amber-400 font-semibold">{acc.werModerate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Street Noise (&lt;15dB):</span>
                    <span className="text-rose-400 font-semibold">{acc.werNoisy}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Accent Detail & Error Patterns */}
        <div className="p-4 bg-[#141C30] border border-[#1F293D] rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between text-indigo-300 font-semibold">
            <span>Phonetic Error Patterns: {currentAccent.accent}</span>
            <span className="text-slate-400 font-normal font-mono text-[11px]">Evaluation Size: n={currentAccent.sampleSize}</span>
          </div>
          <ul className="list-disc list-inside text-slate-300 space-y-1 leading-relaxed">
            {currentAccent.typicalErrorPatterns.map((pat, i) => (
              <li key={i}>{pat}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Word-Level Diff Inspector */}
      <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 space-y-4 shadow-sm text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#1F293D]">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Word-Level Diff Inspector (Ground Truth Reference vs Hypothesis)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Audio Sample: Sundanese-accented borrower confirming BCA Virtual Account instalment payment over cafe background noise.
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-medium">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Correct
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Substitution
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-400" /> Deletion
            </span>
            <span className="flex items-center gap-1.5 text-sky-400">
              <span className="w-2 h-2 rounded-full bg-sky-400" /> Insertion
            </span>
          </div>
        </div>

        {/* Word alignment chips */}
        <div className="p-5 bg-[#090D16] border border-[#1F293D] rounded-xl flex flex-wrap gap-2 leading-relaxed">
          {mockWordDiffExample.map((token, idx) => {
            if (token.type === 'correct') {
              return (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg font-mono text-xs"
                >
                  {token.word}
                </span>
              );
            }
            if (token.type === 'substitution') {
              return (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg font-mono text-xs"
                  title={`Hypothesis heard: "${token.hypothesisAlternative}"`}
                >
                  {token.word} <span className="text-[10px] text-slate-400">({token.hypothesisAlternative})</span>
                </span>
              );
            }
            if (token.type === 'deletion') {
              return (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg font-mono text-xs line-through"
                  title="Word was omitted in hypothesis"
                >
                  {token.word}
                </span>
              );
            }
            if (token.type === 'insertion') {
              return (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-lg font-mono text-xs"
                  title="Spurious token inserted"
                >
                  {token.hypothesisAlternative}
                </span>
              );
            }
            return null;
          })}
        </div>
      </div>

      {/* Provider Benchmark Comparison Table */}
      <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-[#1F293D]">
          <h2 className="text-sm font-semibold text-white">
            ASR Provider Tradeoff & Telephony Benchmark Matrix
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            Evaluated Under Telephony 8kHz / 16kHz
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#1F293D]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1F293D] text-slate-400 bg-[#141C30] font-medium">
                <th className="py-3 px-4">Provider & Model</th>
                <th className="py-3 px-4 font-mono">Streaming Latency</th>
                <th className="py-3 px-4">Cost / Hour</th>
                <th className="py-3 px-4">Code-Switch Accuracy</th>
                <th className="py-3 px-4">Dialect Robustness</th>
                <th className="py-3 px-4 text-right">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F293D] bg-[#0E1424]">
              {mockProviders.map((p) => (
                <tr key={p.name} className="hover:bg-[#141C30]/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white">{p.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{p.model}</div>
                  </td>
                  <td className="py-3.5 px-4 text-emerald-400 font-mono font-semibold">{p.streamingLatencyMs} ms</td>
                  <td className="py-3.5 px-4 text-slate-200 font-mono">{p.costPerHour}</td>
                  <td className="py-3.5 px-4 text-slate-300">{p.codeSwitchScore}</td>
                  <td className="py-3.5 px-4 text-slate-300">{p.idAccentRobustness}</td>
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        p.verdict === 'SELECTED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : p.verdict === 'BACKUP'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {p.verdict}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TTS Voice Compromises Box */}
      <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 space-y-4 shadow-sm">
        <h2 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Documented TTS Voice Limitations & Engineering Mitigations
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {mockTtsCompromises.map((comp, i) => (
            <div
              key={i}
              className="p-5 bg-[#141C30] border border-[#1F293D] rounded-2xl space-y-2.5"
            >
              <div className="flex justify-between items-center text-white font-semibold">
                <span>{comp.issue}</span>
                <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {comp.status}
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                <strong className="text-slate-300">Observed Defect:</strong> {comp.description}
              </p>
              <p className="text-emerald-400 leading-relaxed">
                <strong className="text-emerald-300">Engineering Mitigation:</strong> {comp.mitigationEngineered}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
