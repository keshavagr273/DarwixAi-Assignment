import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { mockEvidenceTable, mockSearchResults } from '../data/mockRetrievalData';
import type { RetrievalEvidenceItem } from '../types';
import {
  Search,
  Download,
  CheckCircle2,
  Sliders,
  Database,
  ArrowRight,
  Layers,
  Sparkles,
  Check,
  FileText
} from 'lucide-react';

export const RetrievalLab: React.FC = () => {
  const { openReceipt, market, kbVersion, apiMode } = useApp();
  const [retrievalMode, setRetrievalMode] = useState<
    'dense' | 'sparse' | 'hybrid' | 'hybrid_rerank'
  >('hybrid_rerank');
  const [searchQuery, setSearchQuery] = useState('Are there discounts available if I work for an agency branch partner?');
  const [evidenceList, setEvidenceList] = useState<RetrievalEvidenceItem[]>(mockEvidenceTable);
  const [activeTab, setActiveTab] = useState<'evidence_table' | 'live_query'>('evidence_table');
  const [marketFilter, setMarketFilter] = useState<string>(market);

  // Keep filter in sync when market changes in navbar
  useEffect(() => {
    setMarketFilter(market);
  }, [market]);

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
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
              RAG Evaluation Bench
            </span>
            <span className="text-xs text-slate-400">
              {evidenceList.length} Verified Evidence Records · Fail-Closed Refusal Suite
            </span>
          </div>
          <h1 className="font-heading text-xl lg:text-2xl font-bold text-white tracking-tight">
            Retrieval Quality Lab
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Compare Dense vector, BM25 keyword, and Cross-Encoder rerank fusion logic. Test adversarial refusal queries and review human-verified retrieval verdicts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-[#141C30] hover:bg-[#1A2540] text-slate-200 border border-[#1F293D] hover:border-slate-500 rounded-xl text-xs font-semibold transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            Export Evidence CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1F293D] pb-3 text-xs">
        <button
          onClick={() => setActiveTab('evidence_table')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors duration-100 outline-none focus:outline-none focus-visible:outline-none border ${
            activeTab === 'evidence_table'
              ? 'bg-indigo-600 text-white shadow-sm border-indigo-500'
              : 'text-slate-400 hover:text-white hover:bg-[#141C30] border-transparent'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Evidence Table ({evidenceList.length} Cases)</span>
        </button>
        <button
          onClick={() => setActiveTab('live_query')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors duration-100 outline-none focus:outline-none focus-visible:outline-none border ${
            activeTab === 'live_query'
              ? 'bg-indigo-600 text-white shadow-sm border-indigo-500'
              : 'text-slate-400 hover:text-white hover:bg-[#141C30] border-transparent'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Interactive Query Sandbox</span>
        </button>
      </div>

      {/* ================= VIEW 1: EVIDENCE TABLE ================= */}
      {activeTab === 'evidence_table' && (
        <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#1F293D]">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Comprehensive Retrieval Evidence Table
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Covers Product, Policy, Qualification, FAQ, Objection, deliberate failure cases, and fail-closed refusal tests.
              </p>
            </div>
            
            {/* Market Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-[#141C30] border border-[#1F293D] rounded-xl text-xs">
              <button
                onClick={() => setMarketFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  marketFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Markets
              </button>
              <button
                onClick={() => setMarketFilter('in_en')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  marketFilter === 'in_en' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                🇮🇳 India
              </button>
              <button
                onClick={() => setMarketFilter('ph_tl')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  marketFilter === 'ph_tl' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                🇵🇭 Philippines
              </button>
              <button
                onClick={() => setMarketFilter('id_id')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  marketFilter === 'id_id' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                🇮🇩 Indonesia
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#1F293D]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1F293D] text-slate-400 bg-[#141C30] font-medium">
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Market</th>
                  <th className="py-3 px-4">Customer Query</th>
                  <th className="py-3 px-4">Retrieved Citation</th>
                  <th className="py-3 px-4">Source Document</th>
                  <th className="py-3 px-4">Relevance Explanation</th>
                  <th className="py-3 px-4 text-right">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F293D] bg-[#0E1424]">
                {evidenceList
                  .filter((item) => marketFilter === 'all' || item.market === marketFilter)
                  .map((item) => (
                  <tr key={item.id} className="hover:bg-[#141C30]/50 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-300 capitalize">
                      {item.category}
                    </td>
                    <td className="py-3.5 px-4 uppercase text-indigo-400 font-mono text-[11px]">
                      {item.market}
                    </td>
                    <td className="py-3.5 px-4 text-white font-medium max-w-xs">
                      {item.question}
                    </td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-mono text-indigo-300 font-semibold mb-0.5">
                        {item.retrieved_record_id}
                      </div>
                      <div className="line-clamp-2 text-[11px] text-slate-400 leading-tight">
                        {item.retrieved_chunk}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] max-w-xs truncate">
                      {item.source_reference}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 text-xs max-w-xs">
                      {item.relevance_explanation}
                      {item.reviewer_notes && (
                        <div className="text-amber-400 text-[11px] mt-1 font-mono">
                          Note: {item.reviewer_notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {item.is_refusal_test ? (
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-semibold text-[11px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Correct Refusal
                        </span>
                      ) : (
                        <select
                          value={item.verdict}
                          onChange={(e) =>
                            handleVerdictChange(item.id, e.target.value as any)
                          }
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border focus:outline-none cursor-pointer ${
                            item.verdict === 'correct'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : item.verdict === 'partially_correct'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          <option value="correct" className="bg-[#0E1424] text-emerald-400">Correct</option>
                          <option value="partially_correct" className="bg-[#0E1424] text-amber-400">Partially Correct</option>
                          <option value="incorrect" className="bg-[#0E1424] text-rose-400">Incorrect</option>
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
        <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 space-y-6 shadow-sm">
          {/* Query input and mode toggle */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Retrieval Engine Sandbox
              </label>
              {/* Mode Switcher */}
              <div className="flex items-center rounded-xl border border-[#1F293D] bg-[#090D16] p-0.5 text-xs">
                <button
                  onClick={() => setRetrievalMode('dense')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    retrievalMode === 'dense'
                      ? 'bg-[#182238] text-indigo-300 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Dense Vector
                </button>
                <button
                  onClick={() => setRetrievalMode('sparse')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    retrievalMode === 'sparse'
                      ? 'bg-[#182238] text-sky-300 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sparse (BM25)
                </button>
                <button
                  onClick={() => setRetrievalMode('hybrid')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    retrievalMode === 'hybrid'
                      ? 'bg-[#182238] text-amber-300 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Hybrid RRF
                </button>
                <button
                  onClick={() => setRetrievalMode('hybrid_rerank')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    retrievalMode === 'hybrid_rerank'
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white'
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
                className="w-full py-3.5 pl-4 pr-12 bg-[#141C30] border border-[#1F293D] rounded-xl text-sm text-white font-sans focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-4 top-4" />
            </div>

            {/* Quick Test Inquiries */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400">Pre-loaded Inquiries:</span>
              <button
                onClick={() => setSearchQuery('Are there discounts available if I work for an agency branch partner?')}
                className="px-2.5 py-1 bg-[#141C30] text-slate-300 hover:text-white border border-[#1F293D] rounded-lg transition-colors"
              >
                Branch Partner Discount
              </button>
              <button
                onClick={() => setSearchQuery('How many days do I have before my policy lapses if I miss the due date?')}
                className="px-2.5 py-1 bg-[#141C30] text-slate-300 hover:text-white border border-[#1F293D] rounded-lg transition-colors"
              >
                Statutory Grace Window
              </button>
              <button
                onClick={() => setSearchQuery('What is the current stock price of Meridian Assure on the Bombay Stock Exchange?')}
                className="px-2.5 py-1 bg-rose-500/10 text-rose-300 hover:text-rose-200 border border-rose-500/20 rounded-lg transition-colors"
              >
                Adversarial Hallucination Bait
              </button>
            </div>
          </div>

          {/* Results list */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-[#1F293D]">
              <span className="font-semibold uppercase tracking-wider text-slate-300">Retrieved Candidate Chunks (k=2)</span>
              <span className="font-mono">Latency: 48 ms · Top Score: 0.94</span>
            </div>

            {mockSearchResults['branch discount']?.map((res, i) => (
              <div
                key={res.chunk_id}
                className="p-5 bg-[#141C30] border border-[#1F293D] rounded-2xl space-y-4 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1F293D] pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-[#090D16] border border-[#1F293D] flex items-center justify-center text-indigo-400 font-bold text-xs">
                      #{i + 1}
                    </span>
                    <span className="font-heading font-semibold text-sm text-white">
                      {res.title}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">{res.record_id}</span>
                  </div>
                  <span className="text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 font-mono text-[11px]">
                    [{res.citation}]
                  </span>
                </div>

                <div className="p-4 bg-[#090D16] border border-[#1F293D] rounded-xl text-slate-200 font-sans leading-relaxed select-text">
                  {res.text}
                </div>

                {/* Score breakdown pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-[#090D16] border border-[#1F293D] rounded-xl text-xs font-mono">
                  <div>
                    <div className="text-slate-400 text-[11px] mb-0.5">Dense Vector:</div>
                    <div className="text-indigo-400 font-semibold">{(res.scores.dense * 100).toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[11px] mb-0.5">Sparse BM25:</div>
                    <div className="text-sky-400 font-semibold">{(res.scores.sparse * 100).toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[11px] mb-0.5">Cross-Reranker:</div>
                    <div className="text-violet-400 font-semibold">{(res.scores.rerank * 100).toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[11px] mb-0.5">Composite Score:</div>
                    <div className="text-emerald-400 font-bold">{(res.scores.total * 100).toFixed(1)}%</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400 truncate max-w-sm">{res.source_ref}</span>
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
                    className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium hover:underline"
                  >
                    <span>Inspect Grounding Receipt</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
