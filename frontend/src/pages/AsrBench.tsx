import React, { useState } from 'react';
import {
  mockAccentBenchmarks,
  mockWordDiffExample,
  mockProviders,
  mockTtsCompromises
} from '../data/mockAsrData';
import {
  Mic,
  AlertTriangle
} from 'lucide-react';

export const AsrBench: React.FC = () => {
  const [selectedAccentIdx, setSelectedAccentIdx] = useState<number>(1); // Default to Javanese
  const currentAccent = mockAccentBenchmarks[selectedAccentIdx];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="bg-[#121821] border border-[#243041] rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 bg-[#18212D] text-[#3DDC97] border border-[#243041] rounded font-semibold">
              QUESTION 3 BENCHMARK
            </span>
            <span className="text-xs font-mono text-[#8A97A8]">
              Empirical ASR Evaluation · Regional Indonesian Accents & Street Noise
            </span>
          </div>
          <h1 className="font-heading text-xl font-bold text-[#E6EDF5] mt-1">
            ASR & TTS Engineering Bench
          </h1>
          <p className="text-xs text-[#8A97A8]">
            Measure Word Error Rate (WER) across regional dialects, inspect phoneme substitution diffs, and review provider tradeoffs.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="p-2.5 bg-[#0B0F14] border border-[#243041] rounded">
            <span className="text-[#8A97A8]">Primary Engine: </span>
            <strong className="text-[#3DDC97]">Deepgram Nova-2 (185ms)</strong>
          </div>
        </div>
      </div>

      {/* Regional Accent Matrix (Interactive) */}
      <div className="bg-[#121821] border border-[#243041] rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#E6EDF5] font-semibold flex items-center gap-1.5">
              <Mic className="w-4 h-4 text-[#3DDC97]" />
              Indonesian Regional Accent WER Benchmark Matrix (n=695 Samples)
            </h2>
            <p className="text-xs text-[#8A97A8]">
              Click any accent row to view its phonetic error patterns and word-level alignment diff.
            </p>
          </div>
          <span className="text-xs font-mono text-[#4CC9F0] bg-[#121E2A] px-2 py-0.5 rounded border border-[#4CC9F0]/40">
            Labeled Telephony Mini-Set
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 font-mono text-xs">
          {mockAccentBenchmarks.map((acc, idx) => {
            const isSelected = selectedAccentIdx === idx;
            return (
              <div
                key={acc.accent}
                onClick={() => setSelectedAccentIdx(idx)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#18212D] border-[#3DDC97]'
                    : 'bg-[#0B0F14] border-[#243041] hover:border-[#334155]'
                }`}
              >
                <div className="font-heading font-semibold text-sm text-[#E6EDF5] mb-1">
                  {acc.accent}
                </div>
                <div className="text-[11px] text-[#8A97A8] mb-3">{acc.region}</div>

                <div className="space-y-1.5 border-t border-[#243041] pt-2">
                  <div className="flex justify-between">
                    <span className="text-[#8A97A8]">Clean (&gt;25dB):</span>
                    <span className="text-[#3DDC97] font-semibold">{acc.werClean}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A97A8]">Moderate (15-25dB):</span>
                    <span className="text-[#FFB547] font-semibold">{acc.werModerate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A97A8]">Street Noise (&lt;15dB):</span>
                    <span className="text-[#FF5C6C] font-semibold">{acc.werNoisy}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Accent Detail & Error Patterns */}
        <div className="p-4 bg-[#18212D] border border-[#243041] rounded-lg space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between text-[#3DDC97] font-semibold">
            <span>Observed Error Patterns: {currentAccent.accent}</span>
            <span className="text-[#8A97A8] font-normal">Sample Size: n={currentAccent.sampleSize}</span>
          </div>
          <ul className="list-disc list-inside text-[#8A97A8] space-y-1 font-sans">
            {currentAccent.typicalErrorPatterns.map((pat, i) => (
              <li key={i}>{pat}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Word-Level Diff Inspector */}
      <div className="bg-[#121821] border border-[#243041] rounded-lg p-5 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-wider text-[#E6EDF5] font-semibold">
            Word-Level Diff Inspector (Reference Ground Truth vs Hypothesis)
          </h2>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-[#3DDC97]">
              <span className="w-2 h-2 rounded bg-[#3DDC97]" /> Correct
            </span>
            <span className="flex items-center gap-1 text-[#FFB547]">
              <span className="w-2 h-2 rounded bg-[#FFB547]" /> Substitution
            </span>
            <span className="flex items-center gap-1 text-[#FF5C6C]">
              <span className="w-2 h-2 rounded bg-[#FF5C6C]" /> Deletion
            </span>
            <span className="flex items-center gap-1 text-[#4CC9F0]">
              <span className="w-2 h-2 rounded bg-[#4CC9F0]" /> Insertion
            </span>
          </div>
        </div>

        <p className="text-[#8A97A8] font-sans text-xs">
          Audio Sample: Sundanese-accented borrower confirming BCA Virtual Account instalment payment over cafe background noise.
        </p>

        {/* Word alignment chips */}
        <div className="p-4 bg-[#0B0F14] border border-[#243041] rounded-md flex flex-wrap gap-2 leading-relaxed">
          {mockWordDiffExample.map((token, idx) => {
            if (token.type === 'correct') {
              return (
                <span
                  key={idx}
                  className="px-2 py-1 bg-[#13221C] text-[#3DDC97] border border-[#3DDC97]/40 rounded font-mono"
                >
                  {token.word}
                </span>
              );
            }
            if (token.type === 'substitution') {
              return (
                <span
                  key={idx}
                  className="px-2 py-1 bg-[#261E14] text-[#FFB547] border border-[#FFB547]/50 rounded font-mono"
                  title={`Hypothesis heard: "${token.hypothesisAlternative}"`}
                >
                  {token.word} <span className="text-[10px] text-[#8A97A8]">({token.hypothesisAlternative})</span>
                </span>
              );
            }
            if (token.type === 'deletion') {
              return (
                <span
                  key={idx}
                  className="px-2 py-1 bg-[#251417] text-[#FF5C6C] border border-[#FF5C6C]/50 rounded font-mono line-through"
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
                  className="px-2 py-1 bg-[#121E2A] text-[#4CC9F0] border border-[#4CC9F0]/50 rounded font-mono"
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
      <div className="bg-[#121821] border border-[#243041] rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[#E6EDF5] font-semibold">
            ASR Provider Tradeoff & Telephony Benchmark Matrix
          </h2>
          <span className="text-xs font-mono text-[#8A97A8]">
            Evaluated Under Telephony 8kHz / 16kHz
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#243041] text-[#8A97A8] bg-[#0B0F14]">
                <th className="py-2.5 px-3">PROVIDER & MODEL</th>
                <th className="py-2.5 px-3">STREAMING LATENCY</th>
                <th className="py-2.5 px-3">COST / HOUR</th>
                <th className="py-2.5 px-3">CODE-SWITCH ACCURACY</th>
                <th className="py-2.5 px-3">ID ACCENT ROBUSTNESS</th>
                <th className="py-2.5 px-3">SELECTION VERDICT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#243041]">
              {mockProviders.map((p) => (
                <tr key={p.name} className="hover:bg-[#18212D]/60 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-[#E6EDF5] font-sans">{p.name}</div>
                    <div className="text-[11px] text-[#57677D]">{p.model}</div>
                  </td>
                  <td className="py-3 px-3 text-[#3DDC97] font-semibold">{p.streamingLatencyMs} ms</td>
                  <td className="py-3 px-3 text-[#E6EDF5]">{p.costPerHour}</td>
                  <td className="py-3 px-3 text-[#8A97A8]">{p.codeSwitchScore}</td>
                  <td className="py-3 px-3 text-[#8A97A8]">{p.idAccentRobustness}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        p.verdict === 'SELECTED'
                          ? 'bg-[#13221C] text-[#3DDC97] border border-[#3DDC97]/40'
                          : p.verdict === 'BACKUP'
                          ? 'bg-[#261E14] text-[#FFB547] border border-[#FFB547]/40'
                          : 'bg-[#0B0F14] text-[#8A97A8] border border-[#243041]'
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
      <div className="bg-[#121821] border border-[#243041] rounded-lg p-5 space-y-4">
        <h2 className="text-xs font-mono uppercase tracking-wider text-[#FFB547] font-semibold flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4" />
          Documented TTS Voice Limitations & Engineering Mitigations
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          {mockTtsCompromises.map((comp, i) => (
            <div
              key={i}
              className="p-4 bg-[#18212D] border border-[#243041] rounded-lg space-y-2"
            >
              <div className="flex justify-between items-center text-[#E6EDF5] font-semibold">
                <span>{comp.issue}</span>
                <span className="text-[10px] uppercase text-[#3DDC97] bg-[#13221C] px-2 py-0.5 rounded border border-[#3DDC97]/40">
                  {comp.status}
                </span>
              </div>
              <p className="text-[#8A97A8] font-sans leading-relaxed">
                <strong>Observed Defect:</strong> {comp.description}
              </p>
              <p className="text-[#3DDC97] font-sans leading-relaxed">
                <strong>Engineering Mitigation:</strong> {comp.mitigationEngineered}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
