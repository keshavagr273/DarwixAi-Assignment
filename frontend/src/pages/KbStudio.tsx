import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  mockSources,
  mockDiffItems,
  mockDedupeClusters,
  mockPiiItems,
  mockKbRecords,
  mockVersions
} from '../data/mockKbData';
import type { KbRecord } from '../types';
import {
  FileText,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Play,
  RotateCcw,
  Eye,
  EyeOff,
  ChevronRight,
  Database,
  Layers,
  GitCompare,
  Copy,
  Lock,
  ArrowRight
} from 'lucide-react';

export const KbStudio: React.FC = () => {
  const { openReceipt, kbVersion, setKbVersion } = useApp();
  const [activeTab, setActiveTab] = useState<
    'sources' | 'pipeline' | 'diff' | 'dedupe' | 'pii' | 'records' | 'time_machine'
  >('sources');

  // Search & Filters for Records Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // PII Reveal toggle (defaults to false for safety)
  const [revealPiiSandbox, setRevealPiiSandbox] = useState(false);
  const [piiScanRunning, setPiiScanRunning] = useState(false);
  const [piiScanDone, setPiiScanDone] = useState(false);

  // Time Machine regression simulation
  const [regressionRunning, setRegressionRunning] = useState(false);
  const [regressionDone, setRegressionDone] = useState(false);

  const filteredRecords = mockKbRecords.filter((r) => {
    const matchesSearch =
      r.record_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleRunPiiScan = () => {
    setPiiScanRunning(true);
    setPiiScanDone(false);
    setTimeout(() => {
      setPiiScanRunning(false);
      setPiiScanDone(true);
    }, 1200);
  };

  const handleRunRegression = () => {
    setRegressionRunning(true);
    setRegressionDone(false);
    setTimeout(() => {
      setRegressionRunning(false);
      setRegressionDone(true);
    }, 1500);
  };

  const tabs = [
    { id: 'sources', label: `Ingested Sources (${mockSources.length})`, icon: FileText },
    { id: 'pipeline', label: 'Pipeline Stepper', icon: Layers },
    { id: 'diff', label: 'Cleaning & Diff', icon: GitCompare },
    { id: 'dedupe', label: 'Dedupe Clusters', icon: Copy },
    { id: 'pii', label: 'PII Shield Vault', icon: Shield },
    { id: 'records', label: 'Records Explorer', icon: Database },
    { id: 'time_machine', label: 'Time Machine', icon: Clock },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
              Knowledge Lifecycle Engine
            </span>
            <span className="text-xs text-slate-400">
              Active Snapshot: <strong className="text-emerald-400 font-mono">{kbVersion}</strong> (412 Chunks)
            </span>
          </div>
          <h1 className="font-heading text-xl lg:text-2xl font-bold text-white tracking-tight">
            Knowledge Base Studio
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Full traceable pipeline: Source Ingestion → Cleaning Diff → Near-Duplicate Clustering → PII Vault Tokenization → Versioned Snapshots.
          </p>
        </div>

        {/* Action pills */}
        <div className="flex items-center gap-3 text-xs">
          <div className="p-3 bg-[#141C30] border border-[#1F293D] rounded-xl flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-400">PII Vault:</span>
            <span className="text-white font-medium">0 Raw Leaks</span>
          </div>
          <div className="p-3 bg-[#141C30] border border-[#1F293D] rounded-xl flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span className="text-slate-400">Lineage:</span>
            <span className="text-white font-medium">100% Traceable</span>
          </div>
        </div>
      </div>

      {/* Modern Sub-Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[#1F293D] pb-3 text-xs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium transition-colors duration-100 outline-none focus:outline-none focus-visible:outline-none border ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm border-indigo-500'
                  : 'text-slate-400 hover:text-white hover:bg-[#141C30] border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================= TAB 1: Sources ================= */}
      {activeTab === 'sources' && (
        <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-[#1F293D]">
            <h2 className="text-sm font-semibold text-white">
              Ingested Sources Inventory & Extraction Health
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              Total Ingested: {mockSources.length} files · 1 Quarantined
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#1F293D]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1F293D] text-slate-400 bg-[#141C30] font-medium">
                  <th className="py-3 px-4">Source Document</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Extraction Method</th>
                  <th className="py-3 px-4">Health Score</th>
                  <th className="py-3 px-4">Chunks</th>
                  <th className="py-3 px-4">Ingestion Status</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F293D] bg-[#0E1424]">
                {mockSources.map((src) => {
                  const isQuarantined = src.fetch_status === 'QUARANTINED';
                  const isWarning = src.fetch_status === 'WARNING';

                  return (
                    <tr key={src.id} className="hover:bg-[#141C30]/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                          {src.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">{src.url_or_path}</div>
                      </td>
                      <td className="py-3.5 px-4 uppercase text-slate-400 font-mono text-[11px]">{src.type}</td>
                      <td className="py-3.5 px-4 text-indigo-300 font-mono text-[11px]">{src.parse_method}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-semibold font-mono ${
                            src.health_score > 90
                              ? 'text-emerald-400'
                              : src.health_score > 70
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {src.health_score}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-200">{src.chunks_produced}</td>
                      <td className="py-3.5 px-4">
                        {isQuarantined ? (
                          <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full font-medium text-[11px]">
                            Quarantined
                          </span>
                        ) : isWarning ? (
                          <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full font-medium text-[11px]">
                            Conflict Flagged
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-medium text-[11px]">
                            Indexed
                          </span>
                        )}
                        {src.flags.length > 0 && (
                          <div className="text-[10px] text-slate-400 mt-1">
                            {src.flags.join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-400 font-mono text-[11px]">{src.last_ingested}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 2: Pipeline Stepper ================= */}
      {activeTab === 'pipeline' && (
        <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 space-y-6 shadow-sm">
          <div>
            <h2 className="text-sm font-semibold text-white">
              End-to-End Pipeline Visualization (9 Distinct Stages)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic transformation with verifiable in/out stage artifacts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-9 gap-3 text-xs">
            {[
              { num: '01', name: 'Fetch', inCount: '6 files', outCount: '6 raw blobs', delta: '100% fetched' },
              { num: '02', name: 'Parse', inCount: '6 blobs', outCount: '5 parsed, 1 bad', delta: '83% yield' },
              { num: '03', name: 'Strip', inCount: '5 docs', outCount: 'Clean text', delta: '-18% boiler' },
              { num: '04', name: 'Normalize', inCount: 'Clean text', outCount: 'ISO-8601', delta: '100% clean' },
              { num: '05', name: 'Dedupe', inCount: '18 clusters', outCount: 'Canonical', delta: '-31% dupes' },
              { num: '06', name: 'PII Shield', inCount: 'All records', outCount: 'Vault sealed', delta: '0 raw leaks' },
              { num: '07', name: 'Chunk', inCount: 'Clean records', outCount: '412 chunks', delta: '512 tok bounds' },
              { num: '08', name: 'Embed/Index', inCount: '412 chunks', outCount: 'pgvector HNSW', delta: 'BGE-M3 1024d' },
              { num: '09', name: 'Publish', inCount: 'Snapshot', outCount: 'v1.3 Active', delta: 'Passed CI' },
            ].map((stage) => (
              <div
                key={stage.num}
                className="p-3.5 bg-[#141C30] border border-[#1F293D] rounded-xl flex flex-col justify-between space-y-3 hover:border-indigo-500/40 transition-colors"
              >
                <div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <span>STAGE {stage.num}</span>
                    <span className="text-emerald-400">✓</span>
                  </div>
                  <div className="font-semibold text-sm text-white mt-1">
                    {stage.name}
                  </div>
                </div>

                <div className="text-[11px] space-y-0.5 text-slate-400 border-t border-[#1F293D] pt-2">
                  <div>In: <span className="text-slate-200">{stage.inCount}</span></div>
                  <div>Out: <span className="text-slate-200">{stage.outCount}</span></div>
                  <div className="text-[10px] text-emerald-400 font-mono font-medium">{stage.delta}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-[#141C30] border border-[#1F293D] rounded-xl space-y-2 text-xs">
            <span className="text-emerald-400 font-semibold">Stage 05 & 06 Automated Safety Enforcement:</span>
            <p className="text-slate-300 leading-relaxed font-sans">
              Every chunk is evaluated against near-duplicate clusters (Jaccard + Sentence Transformer cosine similarity &gt; 0.90) and passed through the PII Shield NER & regex vault before ingestion into pgvector. Chunks with unmasked entities are blocked from publication.
            </p>
          </div>
        </div>
      )}

      {/* ================= TAB 3: Cleaning Diff ================= */}
      {activeTab === 'diff' && (
        <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 space-y-6 shadow-sm">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Raw vs Cleaned Document Diff & Conflict Resolution
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Inspection of boilerplate removal, date/terminology standardization, and resolution of conflicting source policies.
            </p>
          </div>

          <div className="space-y-6">
            {mockDiffItems.map((diff) => (
              <div
                key={diff.id}
                className="border border-[#1F293D] bg-[#141C30] rounded-2xl p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1F293D] pb-3">
                  <div className="text-xs font-semibold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    {diff.source_name}
                  </div>
                  {diff.detected_error && (
                    <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-xs font-medium">
                      Source Conflict Resolved
                    </span>
                  )}
                </div>

                {/* Conflict banner if present */}
                {diff.detected_error && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs space-y-1.5">
                    <div className="text-rose-400 font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      {diff.detected_error.field}: {diff.detected_error.description}
                    </div>
                    <div className="text-slate-300 font-sans">
                      <strong>Resolution Precedence:</strong> {diff.detected_error.resolution}
                    </div>
                  </div>
                )}

                {/* 2-Pane Side-by-side View */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Raw side */}
                  <div className="p-4 bg-[#090D16] border border-[#1F293D] rounded-xl space-y-2">
                    <div className="text-[11px] text-amber-400 uppercase font-semibold">
                      Raw Ingested Text
                    </div>
                    <pre className="text-slate-400 whitespace-pre-wrap font-mono text-[11px] leading-relaxed">
                      {diff.raw_snippet}
                    </pre>
                  </div>

                  {/* Cleaned side */}
                  <div className="p-4 bg-[#090D16] border border-emerald-500/30 rounded-xl space-y-2">
                    <div className="text-[11px] text-emerald-400 uppercase font-semibold">
                      Standardized Canonical Chunk
                    </div>
                    <div className="text-slate-200 whitespace-pre-wrap font-mono text-[11px] leading-relaxed">
                      {diff.cleaned_snippet}
                    </div>
                  </div>
                </div>

                {/* Removed items & standardization notes */}
                <div className="pt-2 border-t border-[#1F293D] flex flex-wrap gap-4 text-[11px]">
                  <div>
                    <span className="text-slate-400">Stripped Boilerplate: </span>
                    <span className="text-amber-300 font-mono">{diff.removed_elements.join('; ')}</span>
                  </div>
                  {diff.standardized_terms.length > 0 && (
                    <div>
                      <span className="text-slate-400">Standardized Terms: </span>
                      <span className="text-indigo-300 font-mono">
                        {diff.standardized_terms.map((t) => `"${t.before}" → "${t.after}"`).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 4: Dedupe Clusters ================= */}
      {activeTab === 'dedupe' && (
        <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-[#1F293D]">
            <h2 className="text-sm font-semibold text-white">
              Near-Duplicate Clusters & Canonical Precedence
            </h2>
            <span className="text-xs text-emerald-400 font-mono">
              Similarity Threshold: ≥ 0.90
            </span>
          </div>

          <div className="space-y-4">
            {mockDedupeClusters.map((cluster) => (
              <div
                key={cluster.id}
                className="p-5 bg-[#141C30] border border-[#1F293D] rounded-2xl space-y-3.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1F293D] pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 bg-[#090D16] border border-[#1F293D] text-indigo-400 font-mono text-xs rounded-md font-semibold">
                      Cluster {cluster.id}
                    </span>
                    <span className="font-heading font-semibold text-sm text-white">
                      {cluster.canonical_title}
                    </span>
                  </div>
                  <span className="text-xs text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20 font-mono">
                    Similarity: {cluster.similarity_score}%
                  </span>
                </div>

                <div className="text-xs text-slate-300">
                  <strong className="text-slate-400">Precedence Decision:</strong> {cluster.selection_rationale}
                </div>

                {/* Duplicates table */}
                <div className="overflow-x-auto rounded-xl border border-[#1F293D]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#1F293D] text-slate-400 bg-[#090D16] font-medium">
                        <th className="py-2.5 px-3 font-mono">Record ID</th>
                        <th className="py-2.5 px-3">Title</th>
                        <th className="py-2.5 px-3">Source Path</th>
                        <th className="py-2.5 px-3 text-right">Cluster Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F293D]">
                      {cluster.duplicates.map((dup) => (
                        <tr key={dup.record_id} className="hover:bg-[#090D16]/50">
                          <td className="py-2.5 px-3 text-indigo-400 font-mono font-medium">{dup.record_id}</td>
                          <td className="py-2.5 px-3 text-slate-200">{dup.title}</td>
                          <td className="py-2.5 px-3 text-slate-400 truncate max-w-xs">{dup.source}</td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-medium">
                              {dup.status === 'merged' ? 'Canonical Merged' : dup.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 5: PII Shield ================= */}
      {activeTab === 'pii' && (
        <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                PII Shield & Irreversible Tokenization Vault
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Detected entities are replaced with deterministic vault tokens. Raw customer identity never enters embeddings or logs.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setRevealPiiSandbox(!revealPiiSandbox)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141C30] text-slate-300 hover:text-white border border-[#1F293D] rounded-xl text-xs transition-colors"
              >
                {revealPiiSandbox ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {revealPiiSandbox ? 'Mask Sandbox Values' : 'Reveal Sandbox Values'}
              </button>
              <button
                onClick={handleRunPiiScan}
                disabled={piiScanRunning}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                {piiScanRunning ? (
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                Run Full Index PII Scan
              </button>
            </div>
          </div>

          {/* PII Leak Gate Status Card */}
          <div className="p-5 bg-[#141C30] border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">
                  PII Zero-Leak Shield Gate: PASSED
                </div>
                <div className="text-slate-400 mt-0.5">
                  412 indexed chunks evaluated across regex, checksum, and NER passes. 0 raw leaks found.
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-emerald-400 font-bold font-mono text-sm">100% MASKED</div>
              <div className="text-slate-400 text-[11px]">Production Verified</div>
            </div>
          </div>

          {piiScanDone && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Full Index Scan Complete: Evaluated 412 vector chunks against 5,000+ regex and NER entity patterns. Zero raw PII leaked.</span>
            </div>
          )}

          {/* Detected Entities Table */}
          <div className="overflow-x-auto rounded-xl border border-[#1F293D]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1F293D] text-slate-400 bg-[#141C30] font-medium">
                  <th className="py-3 px-4 font-mono">Token ID</th>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">Vault Token</th>
                  <th className="py-3 px-4">Raw Sample (Sandbox)</th>
                  <th className="py-3 px-4">Detection Engine</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F293D] bg-[#0E1424]">
                {mockPiiItems.map((item) => (
                  <tr key={item.token_id} className="hover:bg-[#141C30]/50 transition-colors">
                    <td className="py-3 px-4 text-indigo-400 font-mono font-medium">{item.token_id}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-[#141C30] border border-[#1F293D] rounded text-slate-200 text-[11px]">
                        {item.entity_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-indigo-300 font-mono font-semibold">{item.masked_token}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {revealPiiSandbox ? item.raw_sample_masked : '••••••••••••••••'}
                    </td>
                    <td className="py-3 px-4 uppercase text-sky-400 font-mono text-[11px]">{item.detection_method}</td>
                    <td className="py-3 px-4 text-emerald-400 font-mono">{(item.confidence * 100).toFixed(0)}%</td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                        Vault Sealed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 6: Records & Lineage DAG ================= */}
      {activeTab === 'records' && (
        <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1F293D]">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Canonical Records & Schema Explorer
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any row to open the Grounding Receipt with score breakdown and provenance lineage.
              </p>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search records or terms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-[#141C30] border border-[#1F293D] rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#141C30] border border-[#1F293D] rounded-xl text-xs text-slate-200 px-3 py-1.5 focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="product">Product</option>
                <option value="policy">Policy</option>
                <option value="qualification">Qualification</option>
                <option value="objection">Objection</option>
                <option value="faq">FAQ</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#1F293D]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1F293D] text-slate-400 bg-[#141C30] font-medium">
                  <th className="py-3 px-4 font-mono">Record ID</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Market</th>
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4">Source Reference</th>
                  <th className="py-3 px-4">PII Shield</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F293D] bg-[#0E1424]">
                {filteredRecords.map((r) => (
                  <tr
                    key={r.record_id}
                    onClick={() =>
                      openReceipt({
                        citation: `${r.record_id} · ${r.version} · 0.98`,
                        record_id: r.record_id,
                        version: r.version,
                        score: 0.98,
                        source_title: r.title,
                        source_file: r.source,
                        chunk_text: r.content,
                        score_breakdown: { dense: 0.97, bm25: 0.99, rerank: 0.98 }
                      })
                    }
                    className="hover:bg-[#141C30]/60 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 text-indigo-400 font-mono font-medium">{r.record_id}</td>
                    <td className="py-3 px-4 text-slate-200 font-medium">{r.title}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-[#141C30] border border-[#1F293D] rounded-full text-slate-300 text-[11px] capitalize">
                        {r.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 uppercase text-slate-400 font-mono text-[11px]">{r.market}</td>
                    <td className="py-3 px-4 font-mono text-emerald-400">{r.version}</td>
                    <td className="py-3 px-4 text-slate-400 truncate max-w-xs">{r.source}</td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Shielded
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1">
                        Receipt <ArrowRight className="w-3 h-3" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 7: Time Machine ================= */}
      {activeTab === 'time_machine' && (
        <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1F293D]">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Snapshot Time Machine & Version Regression Gate
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Roll forward or backwards across knowledge releases with instantaneous zero-downtime hot swapping.
              </p>
            </div>

            <button
              onClick={handleRunRegression}
              disabled={regressionRunning}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              {regressionRunning ? (
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              Run Full Regression Suite
            </button>
          </div>

          {regressionDone && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-xs text-emerald-300">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <div>
                <div className="font-semibold text-white">Snapshot Regression PASSED (412 Chunks Clean)</div>
                <div className="text-emerald-400 mt-0.5">Zero ungrounded hallucinations detected across 50 gold standard adversarial test cases.</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {mockVersions.map((v) => {
              const isSelected = kbVersion === v.version;
              return (
                <div
                  key={v.version}
                  onClick={() => setKbVersion(v.version)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-600/15 border-indigo-500/50 shadow-md shadow-indigo-950/20'
                      : 'bg-[#141C30] border-[#1F293D] hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-sm font-bold text-white">
                      {v.version}
                    </span>
                    {v.active && (
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                        Production Active
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="text-slate-400">Total Chunks: <span className="font-mono text-slate-200">{v.records_count}</span></div>
                    <div className="text-slate-400">Released: <span className="font-mono text-slate-200">{v.date}</span></div>
                    <div className="text-slate-400">Eval Pass: <span className="font-mono text-emerald-400">{v.retrieval_eval_pass}</span></div>
                    <div className="text-[11px] text-slate-400 pt-2 border-t border-[#1F293D]">{v.pii_leak_test}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
