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
    { name: 'Live Agent Copilot', path: '/live', icon: Zap, category: 'Navigation' },
    { name: 'Knowledge Studio', path: '/kb', icon: Database, category: 'Navigation' },
    { name: 'Retrieval Quality Lab', path: '/retrieval', icon: Search, category: 'Navigation' },
    { name: 'Voice Agent Studio', path: '/agent', icon: Bot, category: 'Navigation' },
    { name: 'Language Packs & Localization', path: '/markets', icon: Globe2, category: 'Navigation' },
    { name: 'ASR Engineering Bench', path: '/asr', icon: Mic, category: 'Navigation' },
    { name: 'Call Library & Audio Traces', path: '/calls', icon: PhoneCall, category: 'Navigation' },
    { name: 'System Evaluation & Benchmarks', path: '/evaluation', icon: BarChart3, category: 'Navigation' },
    { name: 'Architecture & Decisions', path: '/architecture', icon: Layers, category: 'Navigation' },
    { name: 'Compliance & Gaps Matrix', path: '/gaps', icon: AlertTriangle, category: 'Navigation' },
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
    <div className="fixed inset-0 z-50 overflow-hidden flex items-start justify-center pt-24 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCmdOpen(false)}
      />

      {/* Palette Box */}
      <div className="relative w-full max-w-2xl bg-[#0E1424] border border-[#1F293D] rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col text-xs animate-in zoom-in-95 duration-150">
        {/* Search input bar */}
        <div className="flex items-center px-4 border-b border-[#1F293D] bg-[#141C30]">
          <Search className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Search pages, KB record IDs, or topics..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full py-3.5 bg-transparent text-white placeholder-slate-500 focus:outline-none text-sm font-sans"
          />
          <button
            onClick={() => setIsCmdOpen(false)}
            className="p-1 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results list */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {/* Navigation Pages */}
          {filteredPages.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Application Pages
              </div>
              <div className="space-y-1 mt-1">
                {filteredPages.map((page) => {
                  const Icon = page.icon;
                  return (
                    <button
                      key={page.path}
                      onClick={() => handleSelectPage(page.path)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#141C30] transition-colors text-left group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-indigo-400 group-hover:scale-105 transition-transform" />
                        <span className="font-medium">{page.name}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Knowledge Base Records Match */}
          {filteredRecords.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Knowledge Base Records & Citations
              </div>
              <div className="space-y-1 mt-1">
                {filteredRecords.slice(0, 5).map((record) => (
                  <button
                    key={record.record_id}
                    onClick={() => handleSelectRecord(record)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#141C30] transition-colors text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-emerald-400 group-hover:scale-105 transition-transform" />
                      <div>
                        <div className="text-white font-medium">{record.title}</div>
                        <div className="text-[11px] text-indigo-400 font-mono">{record.record_id} · {record.version}</div>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 group-hover:text-emerald-400 transition-colors">Open Receipt →</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredPages.length === 0 && filteredRecords.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              No matching pages or knowledge records found for "{query}".
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#1F293D] bg-[#141C30] flex items-center justify-between text-[11px] text-slate-400">
          <span>Navigate with mouse or arrow keys</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};
