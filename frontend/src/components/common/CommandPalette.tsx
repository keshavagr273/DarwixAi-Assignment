import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Search, X, LayoutDashboard, Zap, Database, Bot, Globe2, Mic, PhoneCall, BarChart3, Layers, AlertTriangle, FileText, ArrowRight } from 'lucide-react';
import { mockKbRecords } from '../../data/mockKbData';

export const CommandPalette: React.FC = () => {
  const { isCmdOpen, setIsCmdOpen, openReceipt } = useApp();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  if (!isCmdOpen) return null;

  const quickPages = [
    { name: 'Mission Control', path: '/', icon: LayoutDashboard, category: 'Navigation' },
    { name: 'Live Nudge Cockpit (Hero)', path: '/live', icon: Zap, category: 'Navigation' },
    { name: 'KB Studio (Ingestion, Pipeline, Records)', path: '/kb', icon: Database, category: 'Navigation' },
    { name: 'Retrieval Lab (Evidence & No-Answer Tests)', path: '/retrieval', icon: Search, category: 'Navigation' },
    { name: 'Voice Agent Studio (Flow, Simulator, Rules)', path: '/agent', icon: Bot, category: 'Navigation' },
    { name: 'Market Packs & Localization (IN/PH/ID)', path: '/markets', icon: Globe2, category: 'Navigation' },
    { name: 'ASR Bench (Regional Accents & Noise)', path: '/asr', icon: Mic, category: 'Navigation' },
    { name: 'Call Library & Audio Traces', path: '/calls', icon: PhoneCall, category: 'Navigation' },
    { name: 'Evaluation Suite (Grounding, Stress, Latency)', path: '/evaluation', icon: BarChart3, category: 'Navigation' },
    { name: 'Architecture & Tradeoff Decisions', path: '/architecture', icon: Layers, category: 'Navigation' },
    { name: 'Gaps & Compliance Checklist', path: '/gaps', icon: AlertTriangle, category: 'Navigation' },
  ];

  const filteredPages = quickPages.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  const filteredRecords = mockKbRecords.filter(
    (r) =>
      r.record_id.toLowerCase().includes(query.toLowerCase()) ||
      r.title.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelectPage = (path: string) => {
    navigate(path);
    setIsCmdOpen(false);
  };

  const handleSelectRecord = (record: typeof mockKbRecords[0]) => {
    openReceipt({
      citation: `${record.record_id} · ${record.version} · 0.98`,
      record_id: record.record_id,
      version: record.version,
      score: 0.98,
      source_title: record.title,
      source_file: record.source,
      chunk_text: record.content,
      score_breakdown: { dense: 0.96, bm25: 0.94, rerank: 0.98 }
    });
    setIsCmdOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 transition-opacity"
        onClick={() => setIsCmdOpen(false)}
      />

      {/* Palette Box */}
      <div className="relative w-full max-w-2xl bg-[#121821] border border-[#243041] rounded-lg shadow-2xl overflow-hidden z-10 flex flex-col font-mono text-xs">
        {/* Search input bar */}
        <div className="flex items-center px-4 border-b border-[#243041] bg-[#18212D]">
          <Search className="w-4 h-4 text-[#8A97A8] mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Type a page name, KB record ID, or keyword..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full py-3 bg-transparent text-[#E6EDF5] placeholder-[#57677D] focus:outline-none text-sm font-sans"
          />
          <button
            onClick={() => setIsCmdOpen(false)}
            className="p-1 text-[#8A97A8] hover:text-[#E6EDF5] rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results list */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-4">
          {/* Navigation Pages */}
          {filteredPages.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] text-[#57677D] uppercase tracking-wider font-semibold">
                Control Room Pages
              </div>
              <div className="space-y-1 mt-1">
                {filteredPages.map((page) => {
                  const Icon = page.icon;
                  return (
                    <button
                      key={page.path}
                      onClick={() => handleSelectPage(page.path)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded text-left hover:bg-[#18212D] text-[#8A97A8] hover:text-[#E6EDF5] transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-[#8A97A8] group-hover:text-[#3DDC97]" />
                        <span className="font-sans font-medium">{page.name}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-[#3DDC97] transition-opacity" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* KB Records */}
          {filteredRecords.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] text-[#57677D] uppercase tracking-wider font-semibold">
                Knowledge Base Records
              </div>
              <div className="space-y-1 mt-1">
                {filteredRecords.map((r) => (
                  <button
                    key={r.record_id}
                    onClick={() => handleSelectRecord(r)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded text-left hover:bg-[#18212D] text-[#8A97A8] hover:text-[#E6EDF5] transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="w-4 h-4 text-[#3DDC97] shrink-0" />
                      <span className="font-mono text-[#3DDC97] font-semibold">{r.record_id}</span>
                      <span className="truncate text-[#E6EDF5] font-sans">{r.title}</span>
                    </div>
                    <span className="text-[10px] text-[#57677D] shrink-0 uppercase">{r.category}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-[#0B0F14] border-t border-[#243041] flex items-center justify-between text-[11px] text-[#57677D]">
          <span>Navigation shortcut: <kbd className="px-1 py-0.5 bg-[#18212D] rounded border border-[#243041]">ESC</kbd> to close</span>
          <span>Press Enter to select</span>
        </div>
      </div>
    </div>
  );
};
