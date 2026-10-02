import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { MarketCode } from '../../types';
import { mockVersions } from '../../data/mockKbData';
import { Search, Radio, Database, Globe, ChevronDown, Activity, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const {
    market,
    setMarket,
    kbVersion,
    setKbVersion,
    apiMode,
    setApiMode,
    setIsCmdOpen
  } = useApp();

  const [showTelemetry, setShowTelemetry] = useState(false);

  return (
    <header className="h-14 bg-[#0E1424]/95 backdrop-blur-md border-b border-[#1F293D] px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Left: Brand & Mode Segmented Control */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-8 h-8 rounded-lg border border-indigo-500/30 group-hover:border-indigo-500/60 flex items-center justify-center transition-all shadow-sm overflow-hidden bg-[#182238]">
            <img src="/logo.png" alt="PARLEY Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-base tracking-tight text-white">
                PARLEY
              </span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md">
                Voice AI
              </span>
            </div>
          </div>
        </Link>

        {/* Subtle vertical divider */}
        <div className="h-5 w-[1px] bg-[#1F293D] hidden sm:block" />

        {/* Clean Mode Switcher */}
        <div className="flex items-center rounded-lg border border-[#1F293D] bg-[#090D16] p-0.5 text-xs shrink-0">
          <button
            onClick={() => setApiMode('mock')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors duration-100 outline-none focus:outline-none focus-visible:outline-none border ${
              apiMode === 'mock'
                ? 'bg-[#182238] text-amber-300 font-semibold shadow-sm border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            Mock Fixtures
          </button>
          <button
            onClick={() => setApiMode('live')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors duration-100 outline-none focus:outline-none focus-visible:outline-none border ${
              apiMode === 'live'
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            Live Backend
          </button>
        </div>
      </div>

      {/* Center: Market & KB Snapshot Selectors */}
      <div className="hidden lg:flex items-center gap-2.5 xl:gap-3">
        {/* Subtle vertical divider */}
        <div className="h-5 w-[1px] bg-[#1F293D] hidden xl:block" />

        {/* Market Selector */}
        <div className="flex items-center gap-1.5 text-xs bg-[#141C30] border border-[#1F293D] hover:border-slate-600 px-2.5 py-1.5 rounded-lg transition-colors shadow-sm">
          <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="text-slate-400 font-medium text-[11px]">Market:</span>
          <select
            value={market}
            onChange={(e) => setMarket(e.target.value as MarketCode)}
            className="bg-transparent text-slate-100 text-xs font-medium focus:outline-none cursor-pointer pr-1"
          >
            <option value="in_en" className="bg-[#0E1424] text-slate-100">🇮🇳 India (in_en)</option>
            <option value="ph_tl" className="bg-[#0E1424] text-slate-100">🇵🇭 Philippines (ph_tl)</option>
            <option value="id_id" className="bg-[#0E1424] text-slate-100">🇮🇩 Indonesia (id_id)</option>
          </select>
        </div>

        {/* KB Snapshot Selector */}
        <div className="flex items-center gap-1.5 text-xs bg-[#141C30] border border-[#1F293D] hover:border-slate-600 px-2.5 py-1.5 rounded-lg transition-colors shadow-sm">
          <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-slate-400 font-medium text-[11px]">Snapshot:</span>
          <select
            value={kbVersion}
            onChange={(e) => setKbVersion(e.target.value)}
            className="bg-transparent text-emerald-400 text-xs font-medium focus:outline-none cursor-pointer pr-1"
          >
            {mockVersions.map((v) => (
              <option key={v.version} value={v.version} className="bg-[#0E1424] text-slate-100">
                {v.version} {v.active ? '· Active' : '· Legacy'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Telemetry & Search */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Subtle vertical divider */}
        <div className="h-5 w-[1px] bg-[#1F293D] hidden lg:block" />

        {/* Modern Live Telemetry Pill with Hover Breakdown */}
        <div className="relative">
          <button
            onClick={() => setShowTelemetry(!showTelemetry)}
            onMouseEnter={() => setShowTelemetry(true)}
            onMouseLeave={() => setShowTelemetry(false)}
            className="hidden md:flex items-center gap-2 px-2.5 py-1.5 bg-[#141C30] hover:bg-[#1A2540] border border-[#1F293D] rounded-lg text-xs transition-colors shadow-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium text-[11px]">System Active</span>
            <span className="text-slate-600">·</span>
            <span className="font-mono text-emerald-400 font-semibold text-[11px]">1.08s P95</span>
          </button>

          {/* Telemetry Breakdown Popover */}
          {showTelemetry && (
            <div
              onMouseEnter={() => setShowTelemetry(true)}
              onMouseLeave={() => setShowTelemetry(false)}
              className="absolute right-0 top-full mt-2 w-72 bg-[#0E1424] border border-[#1F293D] shadow-2xl rounded-xl p-3.5 z-50 text-xs animate-in fade-in slide-in-from-top-1"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1F293D]">
                <span className="font-semibold text-slate-200">Pipeline Latency Telemetry</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30">Healthy</span>
              </div>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between items-center text-slate-400">
                  <span>ASR (Deepgram Nova-2):</span>
                  <span className="text-slate-200 font-semibold">185 ms</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Hybrid RAG Search:</span>
                  <span className="text-slate-200 font-semibold">48 ms</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>LLM Turn (Claude 3.5 Haiku):</span>
                  <span className="text-slate-200 font-semibold">310 ms</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Sentence Gate Validation:</span>
                  <span className="text-slate-200 font-semibold">42 ms</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>TTS Synthesis (ElevenLabs):</span>
                  <span className="text-slate-200 font-semibold">195 ms</span>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-[#1F293D] flex justify-between text-[11px] text-slate-400">
                <span>Total Streaming Budget:</span>
                <span className="text-emerald-400 font-semibold">2,500 ms (Green)</span>
              </div>
            </div>
          )}
        </div>

        {/* Global Search / Quick Jump */}
        <button
          onClick={() => setIsCmdOpen(true)}
          className="flex items-center gap-2 px-2.5 py-1.5 bg-[#141C30] hover:bg-[#1A2540] border border-[#1F293D] hover:border-slate-500 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition-colors shadow-sm"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline font-medium text-xs">Search</span>
          <kbd className="px-1.5 py-0.5 bg-[#090D16] border border-[#1F293D] rounded text-[10px] text-slate-400 font-mono">
            ⌘K
          </kbd>
        </button>
      </div>
    </header>
  );
};
