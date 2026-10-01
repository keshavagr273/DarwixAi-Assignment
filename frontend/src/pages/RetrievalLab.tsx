import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { mockEvidenceTable, mockSearchResults } from '../data/mockRetrievalData';
import type { RetrievalEvidenceItem } from '../types';
import {
  Search,
  Download,
  CheckCircle2
} from 'lucide-react';

export const RetrievalLab: React.FC = () => {
  const { openReceipt } = useApp();
  const [retrievalMode, setRetrievalMode] = useState<
    'dense' | 'sparse' | 'hybrid' | 'hybrid_rerank'
  >('hybrid_rerank');
  const [searchQuery, setSearchQuery] = useState('Are there discounts available if I work for an agency branch partner?');
  const [evidenceList, setEvidenceList] = useState<RetrievalEvidenceItem[]>(mockEvidenceTable);
  const [activeTab, setActiveTab] = useState<'evidence_table' | 'live_query'>('evidence_table');

  const handleVerdictChange = (id: string, newVerdict: 'correct' | 'partially_correct' | 'incorrect') => {
    setEvidenceList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, verdict: newVerdict } : item))
    );
  };

  const handleExportCSV = () => {
    const headers = ['Category', 'Market', 'Question', 'Retrieved Record', 'Source Reference', 'Relevance Explanation', 'Verdict'];
    const rows = evidenceList.map((e) => [
      e.category,
      e.market,
      `"${e.question.replace(/"/g, '""')}"`,
      e.retrieved_record_id,
      `"${e.source_reference.replace(/"/g, '""')}"`,
      `"${e.relevance_explanation.replace(/"/g, '""')}"`,
      e.verdict
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'parley_retrieval_evidence_table.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="bg-[#121821] border border-[#243041] rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 bg-[#18212D] text-[#3DDC97] border border-[#243041] rounded font-semibold">
              QUESTION 2 EVIDENCE
            </span>
            <span className="text-xs font-mono text-[#8A97A8]">
              {evidenceList.length} Verified Evidence Records · Fail-Closed Refusal Suite
            </span>
          </div>
          <h1 className="font-heading text-xl font-bold text-[#E6EDF5] mt-1">
            Retrieval Lab & Evidence Table
          </h1>
          <p className="text-xs text-[#8A97A8]">
            Compare Dense vs BM25 vs Hybrid + Reranker logic, test no-answer refusal queries, and review human-verified retrieval verdicts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#18212D] hover:bg-[#243041] text-[#E6EDF5] border border-[#243041] rounded text-xs font-mono transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#3DDC97]" />
            Export Evidence CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#243041] pb-1 text-xs font-mono">
        <button
          onClick={() => setActiveTab('evidence_table')}
          className={`px-4 py-2 rounded-t font-semibold transition-colors ${
            activeTab === 'evidence_table'
              ? 'bg-[#18212D] text-[#3DDC97] border-t border-x border-[#243041]'
              : 'text-[#8A97A8] hover:text-[#E6EDF5]'
          }`}
        >
          1. Evidence Table ({evidenceList.length} Cases)
        </button>
        <button
          onClick={() => setActiveTab('live_query')}
          className={`px-4 py-2 rounded-t font-semibold transition-colors ${
            activeTab === 'live_query'
              ? 'bg-[#18212D] text-[#3DDC97] border-t border-x border-[#243041]'
              : 'text-[#8A97A8] hover:text-[#E6EDF5]'
          }`}
        >
          2. Live Interactive Query Workbench
        </button>
      </div>

      {/* ================= VIEW 1: EVIDENCE TABLE ================= */}
      {activeTab === 'evidence_table' && (
        <div className="bg-[#121821] border border-[#243041] rounded-lg p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xs font-mono uppercase tracking-wider text-[#E6EDF5] font-semibold">
                Comprehensive Retrieval Evidence Table (Deliverable Q2)
              </h2>
              <p className="text-xs text-[#8A97A8]">
                Covers Product, Policy, Qualification, FAQ, Objection, 2 deliberate failure cases diagnosed & fixed, and No-Answer refusal tests.
              </p>
            </div>
            <span className="text-xs font-mono text-[#3DDC97] bg-[#13221C] px-2 py-1 rounded border border-[#3DDC97]/40">
              Human Reviewer Edits Enabled
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#243041] text-[#8A97A8] bg-[#0B0F14]">
                  <th className="py-2.5 px-3">CAT</th>
                  <th className="py-2.5 px-3">MARKET</th>
                  <th className="py-2.5 px-3">USER QUESTION</th>
                  <th className="py-2.5 px-3">RETRIEVED RECORD / CHUNK</th>
                  <th className="py-2.5 px-3">SOURCE REFERENCE</th>
                  <th className="py-2.5 px-3">RELEVANCE EXPLANATION</th>
                  <th className="py-2.5 px-3">REVIEWER VERDICT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243041]">
                {evidenceList.map((item) => (
                  <tr key={item.id} className="hover:bg-[#18212D]/60 transition-colors">
                    <td className="py-3 px-3 uppercase text-[#8A97A8] font-semibold">
                      {item.category}
                    </td>
                    <td className="py-3 px-3 uppercase text-[#4CC9F0]">
                      {item.market}
                    </td>
                    <td className="py-3 px-3 font-sans font-medium text-[#E6EDF5] max-w-xs">
                      {item.question}
                    </td>
                    <td className="py-3 px-3 text-[#8A97A8] max-w-sm">
                      <div className="font-mono text-[#3DDC97] font-semibold mb-0.5">
                        {item.retrieved_record_id}
                      </div>
                      <div className="line-clamp-2 text-[11px] leading-tight">
                        {item.retrieved_chunk}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-[#57677D] text-[11px] max-w-xs truncate">
                      {item.source_reference}
                    </td>
                    <td className="py-3 px-3 text-[#8A97A8] text-[11px] max-w-xs font-sans">
                      {item.relevance_explanation}
                      {item.reviewer_notes && (
                        <div className="text-[#FFB547] text-[10px] mt-1 font-mono">
                          Note: {item.reviewer_notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {item.is_refusal_test ? (
                        <span className="px-2 py-0.5 bg-[#13221C] text-[#3DDC97] border border-[#3DDC97]/40 rounded font-semibold text-[10px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          CORRECTLY REFUSED
                        </span>
                      ) : (
                        <select
                          value={item.verdict}
                          onChange={(e) =>
                            handleVerdictChange(item.id, e.target.value as any)
                          }
                          className={`px-2 py-0.5 rounded font-mono text-[11px] font-semibold border focus:outline-none cursor-pointer ${
                            item.verdict === 'correct'
                              ? 'bg-[#13221C] text-[#3DDC97] border-[#3DDC97]/40'
                              : item.verdict === 'partially_correct'
                              ? 'bg-[#261E14] text-[#FFB547] border-[#FFB547]/40'
                              : 'bg-[#251417] text-[#FF5C6C] border-[#FF5C6C]/40'
                          }`}
                        >
                          <option value="correct" className="bg-[#121821] text-[#3DDC97]">Correct</option>
                          <option value="partially_correct" className="bg-[#121821] text-[#FFB547]">Partially Correct</option>
                          <option value="incorrect" className="bg-[#121821] text-[#FF5C6C]">Incorrect</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= VIEW 2: LIVE QUERY WORKBENCH ================= */}
      {activeTab === 'live_query' && (
        <div className="bg-[#121821] border border-[#243041] rounded-lg p-5 space-y-6">
          {/* Query input and mode toggle */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-mono text-[#8A97A8] uppercase tracking-wider">
                Interactive Retrieval Query
              </label>
              {/* Mode Switcher */}
              <div className="flex items-center rounded border border-[#243041] bg-[#0B0F14] p-0.5 text-xs font-mono">
                <button
                  onClick={() => setRetrievalMode('dense')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    retrievalMode === 'dense'
                      ? 'bg-[#18212D] text-[#3DDC97] border border-[#3DDC97]/40 font-semibold'
                      : 'text-[#8A97A8] hover:text-[#E6EDF5]'
                  }`}
                >
                  Dense Vector
                </button>
                <button
                  onClick={() => setRetrievalMode('sparse')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    retrievalMode === 'sparse'
                      ? 'bg-[#18212D] text-[#4CC9F0] border border-[#4CC9F0]/40 font-semibold'
                      : 'text-[#8A97A8] hover:text-[#E6EDF5]'
                  }`}
                >
                  Sparse (BM25)
                </button>
                <button
                  onClick={() => setRetrievalMode('hybrid')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    retrievalMode === 'hybrid'
                      ? 'bg-[#18212D] text-[#FFB547] border border-[#FFB547]/40 font-semibold'
                      : 'text-[#8A97A8] hover:text-[#E6EDF5]'
                  }`}
                >
                  Hybrid
                </button>
                <button
                  onClick={() => setRetrievalMode('hybrid_rerank')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    retrievalMode === 'hybrid_rerank'
                      ? 'bg-[#13221C] text-[#3DDC97] border border-[#3DDC97]/60 font-semibold'
                      : 'text-[#8A97A8] hover:text-[#E6EDF5]'
                  }`}
                >
                  Hybrid + Rerank (Prod)
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-3 pl-4 pr-10 bg-[#0B0F14] border border-[#243041] rounded-md text-sm text-[#E6EDF5] font-sans focus:outline-none focus:border-[#3DDC97]"
              />
              <Search className="w-4 h-4 text-[#8A97A8] absolute right-3.5 top-3.5" />
            </div>

            {/* Preloaded quick queries */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="text-[#57677D]">Quick Test Inquiries:</span>
              <button
                onClick={() => setSearchQuery('Are there discounts available if I work for an agency branch partner?')}
                className="px-2 py-0.5 bg-[#18212D] text-[#8A97A8] hover:text-[#E6EDF5] border border-[#243041] rounded"
              >
                Branch Partner Discount
              </button>
              <button
                onClick={() => setSearchQuery('How many days do I have before my policy lapses if I miss the due date?')}
                className="px-2 py-0.5 bg-[#18212D] text-[#8A97A8] hover:text-[#E6EDF5] border border-[#243041] rounded"
              >
                Statutory Grace Period
              </button>
              <button
                onClick={() => setSearchQuery('What is the current stock price of Meridian Assure on the Bombay Stock Exchange?')}
                className="px-2 py-0.5 bg-[#18212D] text-[#FF5C6C] hover:text-[#FFA6B0] border border-[#FF5C6C]/40 rounded"
              >
                No-Answer Bait
              </button>
            </div>
          </div>

          {/* Results list */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between text-xs font-mono text-[#8A97A8]">
              <span>RETRIEVAL RESULTS (k=2 CHUNKS)</span>
              <span>Search Latency: 48 ms · Top Score: 0.94</span>
            </div>

            {mockSearchResults['branch discount']?.map((res, i) => (
              <div
                key={res.chunk_id}
                className="p-4 bg-[#18212D] border border-[#243041] rounded-lg space-y-3 font-mono text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#243041] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-[#0B0F14] border border-[#243041] flex items-center justify-center text-[#3DDC97] font-semibold text-[11px]">
                      #{i + 1}
                    </span>
                    <span className="font-heading font-semibold text-sm text-[#E6EDF5]">
                      {res.title}
                    </span>
                    <span className="text-[#3DDC97]">{res.record_id}</span>
                  </div>
                  <span className="text-[#4CC9F0] bg-[#121E2A] px-2 py-0.5 rounded border border-[#4CC9F0]/40 font-semibold">
                    Citation: [{res.citation}]
                  </span>
                </div>

                <div className="p-3 bg-[#0B0F14] border border-[#243041] rounded text-[#E6EDF5] font-mono leading-relaxed select-text">
                  {res.text}
                </div>

                {/* Score breakdown bars */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-[#0B0F14] border border-[#243041] rounded text-[11px]">
                  <div>
                    <div className="text-[#8A97A8] mb-0.5">Dense Vector:</div>
                    <div className="text-[#3DDC97] font-semibold">{(res.scores.dense * 100).toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-[#8A97A8] mb-0.5">Sparse BM25:</div>
                    <div className="text-[#4CC9F0] font-semibold">{(res.scores.sparse * 100).toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-[#8A97A8] mb-0.5">Cross-Reranker:</div>
                    <div className="text-[#A78BFA] font-semibold">{(res.scores.rerank * 100).toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-[#8A97A8] mb-0.5">Total Composite:</div>
                    <div className="text-[#E6EDF5] font-bold">{(res.scores.total * 100).toFixed(1)}%</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#57677D]">{res.source_ref}</span>
                  <button
                    onClick={() =>
                      openReceipt({
                        citation: res.citation,
                        record_id: res.record_id,
                        version: res.version,
                        score: res.scores.total,
                        source_title: res.title,
                        source_file: res.source_ref,
                        chunk_text: res.text,
                        score_breakdown: {
                          dense: res.scores.dense,
                          bm25: res.scores.sparse,
                          rerank: res.scores.rerank
                        }
                      })
                    }
                    className="text-[#3DDC97] hover:underline"
                  >
                    Open in Receipt Inspector →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
