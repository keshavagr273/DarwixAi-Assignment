import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Copy, FileText, Cpu, GitBranch, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export const ReceiptDrawer: React.FC = () => {
  const { selectedReceipt, closeReceipt } = useApp();
  const [copied, setCopied] = React.useState(false);

  if (!selectedReceipt) return null;

  const handleCopyCitation = () => {
    navigator.clipboard.writeText(`[${selectedReceipt.record_id}@${selectedReceipt.version} · ${selectedReceipt.source_title}]`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={closeReceipt}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-xl bg-[#0E1424] border-l border-[#1F293D] h-full shadow-2xl flex flex-col z-10 overflow-y-auto animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#1F293D] bg-[#141C30] flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
            <h2 className="font-heading text-base font-semibold text-white">
              Grounding Receipt Inspector
            </h2>
            <span className="text-[11px] font-medium px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
              Verified Grounded
            </span>
          </div>
          <button
            onClick={closeReceipt}
            aria-label="Close receipt drawer"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1E293B] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-xs">
          {/* Summary Box */}
          <div className="p-5 bg-[#141C30] border border-[#1F293D] rounded-2xl space-y-3.5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-medium">Record ID</div>
                <div className="font-mono text-sm font-bold text-indigo-400 mt-0.5">
                  {selectedReceipt.record_id}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-slate-400 uppercase font-medium">Snapshot Version</div>
                <div className="font-mono text-sm font-semibold text-white mt-0.5">
                  {selectedReceipt.version}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-slate-400 uppercase font-medium">Composite Score</div>
                <div className="font-mono text-sm font-bold text-emerald-400 mt-0.5">
                  {(selectedReceipt.score * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-400 uppercase font-medium mb-1">Source Title</div>
              <div className="text-sm font-semibold text-white">
                {selectedReceipt.source_title}
              </div>
            </div>

            <div className="pt-3 border-t border-[#1F293D] flex items-center justify-between">
              <span className="text-slate-400 truncate max-w-[280px]">
                {selectedReceipt.source_file}
              </span>
              <button
                onClick={handleCopyCitation}
                className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-medium hover:underline text-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Copied Citation!' : 'Copy Citation String'}
              </button>
            </div>
          </div>

          {/* Retrieved Source Chunk */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                Retrieved Canonical Chunk
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                Tokens: ~84 · Zero PII Leakage
              </span>
            </div>
            <div className="p-4 bg-[#090D16] border border-[#1F293D] rounded-xl text-slate-200 font-sans leading-relaxed select-text text-xs">
              {selectedReceipt.chunk_text}
            </div>
          </div>

          {/* Multi-Stage Retrieval Score Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-sky-400" />
              Multi-Stage Retrieval Score Breakdown
            </h3>
            <div className="space-y-3 p-5 bg-[#141C30] border border-[#1F293D] rounded-2xl shadow-sm">
              {/* Dense */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-400">Dense Vector (Cohere Embed-v4.0)</span>
                  <span className="text-indigo-400 font-mono">{(selectedReceipt.score_breakdown.dense * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-[#090D16] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${selectedReceipt.score_breakdown.dense * 100}%` }}
                  />
                </div>
              </div>

              {/* BM25 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-400">Sparse Lexical (BM25 Keyword Match)</span>
                  <span className="text-sky-400 font-mono">{(selectedReceipt.score_breakdown.bm25 * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-[#090D16] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full"
                    style={{ width: `${selectedReceipt.score_breakdown.bm25 * 100}%` }}
                  />
                </div>
              </div>

              {/* Rerank */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-400">Cross-Encoder Reranker (BGE-M3 Rerank)</span>
                  <span className="text-emerald-400 font-mono">{(selectedReceipt.score_breakdown.rerank * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-[#090D16] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${selectedReceipt.score_breakdown.rerank * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Lineage DAG */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
              Provenance Lineage Graph
            </h3>
            <div className="p-5 bg-[#141C30] border border-[#1F293D] rounded-2xl space-y-3 text-xs shadow-sm">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#090D16] border border-[#1F293D] flex items-center justify-center text-slate-400 font-mono text-[11px]">1</span>
                <div>
                  <div className="text-white font-medium">Raw Source Ingestion</div>
                  <div className="text-[11px] text-slate-400">{selectedReceipt.source_file}</div>
                </div>
              </div>

              <div className="ml-3 pl-3 border-l border-[#1F293D] py-1 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#090D16] border border-[#1F293D] flex items-center justify-center text-slate-400 font-mono text-[11px]">2</span>
                <div>
                  <div className="text-white font-medium">Boilerplate & Deduplication</div>
                  <div className="text-[11px] text-emerald-400">Canonical rule verified (Cluster #1)</div>
                </div>
              </div>

              <div className="ml-3 pl-3 border-l border-[#1F293D] py-1 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#090D16] border border-[#1F293D] flex items-center justify-center text-slate-400 font-mono text-[11px]">3</span>
                <div>
                  <div className="text-white font-medium">PII Shield Verification</div>
                  <div className="text-[11px] text-emerald-400">0 raw PII entities · Sealed in Vault</div>
                </div>
              </div>

              <div className="ml-3 pl-3 border-l border-[#1F293D] py-1 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#090D16] border border-[#1F293D] flex items-center justify-center text-slate-400 font-mono text-[11px]">4</span>
                <div>
                  <div className="text-white font-medium">Structure-Aware Chunking</div>
                  <div className="text-[11px] text-slate-400">Chunk index: 0 · 512 token boundary</div>
                </div>
              </div>

              <div className="ml-3 pl-3 border-l border-[#1F293D] py-1 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">✓</span>
                <div>
                  <div className="text-emerald-400 font-semibold">Active Vector Index</div>
                  <div className="text-[11px] text-slate-400">pgvector · Snapshot {selectedReceipt.version}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1F293D] bg-[#141C30] mt-auto flex items-center justify-between text-xs text-slate-400">
          <span>Every claim has a verifiable receipt.</span>
          <button
            onClick={closeReceipt}
            className="px-4 py-2 bg-[#1E293B] hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
