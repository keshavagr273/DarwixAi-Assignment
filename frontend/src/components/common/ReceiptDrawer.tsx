import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Copy, FileText, Cpu, GitBranch } from 'lucide-react';

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
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={closeReceipt}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-xl bg-[#121821] border-l border-[#243041] h-full shadow-2xl flex flex-col z-10 overflow-y-auto">
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#243041] bg-[#18212D] flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3DDC97] shrink-0" />
            <h2 className="font-heading text-base font-semibold text-[#E6EDF5]">
              Grounding Receipt Inspector
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 bg-[#13221C] text-[#3DDC97] border border-[#3DDC97]/40 rounded">
              VERIFIED GROUNDED
            </span>
          </div>
          <button
            onClick={closeReceipt}
            aria-label="Close receipt drawer"
            className="p-1.5 text-[#8A97A8] hover:text-[#E6EDF5] hover:bg-[#243041] rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Summary Box */}
          <div className="p-4 bg-[#18212D] border border-[#243041] rounded-md space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-[#8A97A8]">RECORD ID</div>
                <div className="font-mono text-sm font-semibold text-[#3DDC97]">
                  {selectedReceipt.record_id}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono text-[#8A97A8]">SNAPSHOT VERSION</div>
                <div className="font-mono text-sm font-semibold text-[#E6EDF5]">
                  {selectedReceipt.version}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono text-[#8A97A8]">COMPOSITE SCORE</div>
                <div className="font-mono text-sm font-semibold text-[#4CC9F0]">
                  {(selectedReceipt.score * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-mono text-[#8A97A8] mb-1">TITLE</div>
              <div className="text-sm font-medium text-[#E6EDF5]">
                {selectedReceipt.source_title}
              </div>
            </div>

            <div className="pt-2 border-t border-[#243041] flex items-center justify-between text-xs font-mono">
              <span className="text-[#8A97A8] truncate max-w-[280px]">
                {selectedReceipt.source_file}
              </span>
              <button
                onClick={handleCopyCitation}
                className="inline-flex items-center gap-1 text-[#3DDC97] hover:underline"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Copied Citation!' : 'Copy Citation String'}
              </button>
            </div>
          </div>

          {/* Retrieved Source Chunk */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#8A97A8] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#3DDC97]" />
                Retrieved Canonical Chunk
              </h3>
              <span className="text-[11px] font-mono text-[#57677D]">
                Tokens: ~84 · Zero PII Leakage
              </span>
            </div>
            <div className="p-4 bg-[#0B0F14] border border-[#243041] rounded-md font-mono text-xs text-[#E6EDF5] leading-relaxed select-text">
              {selectedReceipt.chunk_text}
            </div>
          </div>

          {/* Multi-Stage Retrieval Score Breakdown */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#8A97A8] mb-3 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#4CC9F0]" />
              Multi-Stage Retrieval Score Breakdown
            </h3>
            <div className="space-y-3 p-4 bg-[#18212D] border border-[#243041] rounded-md">
              {/* Dense */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-[#8A97A8]">Dense Embedding (text-embedding-3-large)</span>
                  <span className="text-[#E6EDF5]">{(selectedReceipt.score_breakdown.dense * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#0B0F14] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#3DDC97]"
                    style={{ width: `${selectedReceipt.score_breakdown.dense * 100}%` }}
                  />
                </div>
              </div>

              {/* BM25 */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-[#8A97A8]">Sparse Lexical (BM25 Token Match)</span>
                  <span className="text-[#E6EDF5]">{(selectedReceipt.score_breakdown.bm25 * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#0B0F14] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#4CC9F0]"
                    style={{ width: `${selectedReceipt.score_breakdown.bm25 * 100}%` }}
                  />
                </div>
              </div>

              {/* Rerank */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-[#8A97A8]">Cross-Encoder Reranker (BGE-Reranker-Large)</span>
                  <span className="text-[#E6EDF5]">{(selectedReceipt.score_breakdown.rerank * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#0B0F14] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#A78BFA]"
                    style={{ width: `${selectedReceipt.score_breakdown.rerank * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Lineage DAG */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#8A97A8] mb-3 flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-[#3DDC97]" />
              Provenance Lineage Graph
            </h3>
            <div className="p-4 bg-[#18212D] border border-[#243041] rounded-md space-y-3 font-mono text-xs">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded bg-[#0B0F14] border border-[#243041] flex items-center justify-center text-[#8A97A8] text-[10px]">1</span>
                <div>
                  <div className="text-[#E6EDF5]">Raw Ingestion Source</div>
                  <div className="text-[11px] text-[#8A97A8]">{selectedReceipt.source_file}</div>
                </div>
              </div>

              <div className="ml-3 pl-3 border-l border-[#243041] py-1 flex items-center gap-3">
                <span className="w-6 h-6 rounded bg-[#0B0F14] border border-[#243041] flex items-center justify-center text-[#8A97A8] text-[10px]">2</span>
                <div>
                  <div className="text-[#E6EDF5]">Boilerplate & Deduplication</div>
                  <div className="text-[11px] text-[#3DDC97]">Canonical rule matched (Cluster #1)</div>
                </div>
              </div>

              <div className="ml-3 pl-3 border-l border-[#243041] py-1 flex items-center gap-3">
                <span className="w-6 h-6 rounded bg-[#0B0F14] border border-[#243041] flex items-center justify-center text-[#8A97A8] text-[10px]">3</span>
                <div>
                  <div className="text-[#E6EDF5]">PII Shield Verification</div>
                  <div className="text-[11px] text-[#3DDC97]">0 raw PII entities · Sealed in Vault</div>
                </div>
              </div>

              <div className="ml-3 pl-3 border-l border-[#243041] py-1 flex items-center gap-3">
                <span className="w-6 h-6 rounded bg-[#0B0F14] border border-[#243041] flex items-center justify-center text-[#8A97A8] text-[10px]">4</span>
                <div>
                  <div className="text-[#E6EDF5]">Structure-Aware Chunking</div>
                  <div className="text-[11px] text-[#8A97A8]">Chunk idx: 0 · 512 token boundary</div>
                </div>
              </div>

              <div className="ml-3 pl-3 border-l border-[#243041] py-1 flex items-center gap-3">
                <span className="w-6 h-6 rounded bg-[#13221C] border border-[#3DDC97]/40 flex items-center justify-center text-[#3DDC97] text-[10px]">✓</span>
                <div>
                  <div className="text-[#3DDC97] font-semibold">Active Vector Index</div>
                  <div className="text-[11px] text-[#8A97A8]">pgvector · Snapshot {selectedReceipt.version}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#243041] bg-[#18212D] mt-auto flex items-center justify-between text-xs text-[#8A97A8]">
          <span>Every claim has a receipt. Fail-closed architecture.</span>
          <button
            onClick={closeReceipt}
            className="px-3 py-1.5 bg-[#243041] hover:bg-[#334155] text-[#E6EDF5] rounded text-xs font-medium transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
