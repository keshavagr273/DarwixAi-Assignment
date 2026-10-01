import React from 'react';
import { useApp } from '../../context/AppContext';
import type { MarketCode } from '../../types';
import { mockVersions } from '../../data/mockKbData';
import { Search, Radio, Database } from 'lucide-react';
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

  return (
    <header className="h-14 bg-[#121821] border-b border-[#243041] px-4 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Left: Brand & Mode */}
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded bg-[#18212D] border border-[#243041] group-hover:border-[#3DDC97] flex items-center justify-center transition-colors">
            <Radio className="w-4 h-4 text-[#3DDC97]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-bold text-base tracking-wider text-[#E6EDF5]">
                PARLEY
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#18212D] text-[#8A97A8] border border-[#243041] rounded">
                OPS
              </span>
            </div>
          </div>
        </Link>

        {/* MOCK / LIVE Pill */}
        <div className="flex items-center rounded border border-[#243041] bg-[#0B0F14] p-0.5 text-xs font-mono">
          <button
            onClick={() => setApiMode('mock')}
            className={`px-2.5 py-0.5 rounded transition-colors ${
              apiMode === 'mock'
                ? 'bg-[#18212D] text-[#FFB547] font-semibold border border-[#FFB547]/40'
                : 'text-[#8A97A8] hover:text-[#E6EDF5]'
            }`}
          >
            MOCK FIXTURES
          </button>
          <button
            onClick={() => setApiMode('live')}
            className={`px-2.5 py-0.5 rounded transition-colors ${
              apiMode === 'live'
                ? 'bg-[#13221C] text-[#3DDC97] font-semibold border border-[#3DDC97]/40'
                : 'text-[#8A97A8] hover:text-[#E6EDF5]'
            }`}
          >
            LIVE BACKEND
          </button>
        </div>
      </div>

      {/* Center: Market & KB Snapshot Selectors */}
      <div className="hidden lg:flex items-center gap-3">
        {/* Market Selector */}
        <div className="flex items-center gap-1.5 text-xs font-mono bg-[#18212D] border border-[#243041] px-2.5 py-1 rounded">
          <span className="text-[#8A97A8]">MARKET:</span>
          <select
            value={market}
            onChange={(e) => setMarket(e.target.value as MarketCode)}
            className="bg-transparent text-[#E6EDF5] font-semibold focus:outline-none cursor-pointer"
          >
            <option value="in_en" className="bg-[#121821] text-[#E6EDF5]">🇮🇳 India (in_en)</option>
            <option value="ph_tl" className="bg-[#121821] text-[#E6EDF5]">🇵🇭 Philippines (ph_tl)</option>
            <option value="id_id" className="bg-[#121821] text-[#E6EDF5]">🇮🇩 Indonesia (id_id)</option>
          </select>
        </div>

        {/* KB Snapshot Selector */}
        <div className="flex items-center gap-1.5 text-xs font-mono bg-[#18212D] border border-[#243041] px-2.5 py-1 rounded">
          <Database className="w-3.5 h-3.5 text-[#3DDC97]" />
          <span className="text-[#8A97A8]">KB SNAPSHOT:</span>
          <select
            value={kbVersion}
            onChange={(e) => setKbVersion(e.target.value)}
            className="bg-transparent text-[#3DDC97] font-semibold focus:outline-none cursor-pointer"
          >
            {mockVersions.map((v) => (
              <option key={v.version} value={v.version} className="bg-[#121821] text-[#E6EDF5]">
                {v.version} {v.active ? '· Active (412 chunks)' : `· Legacy (${v.records_count} chunks)`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: System Health & Search */}
      <div className="flex items-center gap-3">
        {/* Health dots with latencies */}
        <div className="hidden xl:flex items-center gap-2.5 px-3 py-1 bg-[#0B0F14] border border-[#243041] rounded text-[11px] font-mono">
          <div className="flex items-center gap-1" title="ASR Latency: 185ms (Deepgram Nova-2)">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3DDC97]" />
            <span className="text-[#8A97A8]">ASR</span>
            <span className="text-[#E6EDF5]">185ms</span>
          </div>
          <span className="text-[#243041]">|</span>
          <div className="flex items-center gap-1" title="LLM Latency: 310ms (Claude 3.5 Haiku)">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3DDC97]" />
            <span className="text-[#8A97A8]">LLM</span>
            <span className="text-[#E6EDF5]">310ms</span>
          </div>
          <span className="text-[#243041]">|</span>
          <div className="flex items-center gap-1" title="TTS Latency: 195ms (ElevenLabs Turbo)">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3DDC97]" />
            <span className="text-[#8A97A8]">TTS</span>
            <span className="text-[#E6EDF5]">195ms</span>
          </div>
          <span className="text-[#243041]">|</span>
          <div className="flex items-center gap-1" title="KB Hybrid Vector: 48ms">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3DDC97]" />
            <span className="text-[#8A97A8]">KB</span>
            <span className="text-[#E6EDF5]">48ms</span>
          </div>
          <span className="text-[#243041]">|</span>
          <div className="flex items-center gap-1" title="WebSocket: Connected">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4CC9F0] animate-pulse" />
            <span className="text-[#4CC9F0]">WS LIVE</span>
          </div>
        </div>

        {/* Global Search / Quick Jump */}
        <button
          onClick={() => setIsCmdOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#18212D] hover:bg-[#243041] border border-[#243041] rounded text-xs font-mono text-[#8A97A8] hover:text-[#E6EDF5] transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Search records & traces</span>
          <kbd className="px-1.5 py-0.5 bg-[#0B0F14] border border-[#243041] rounded text-[10px] text-[#57677D]">
            ⌘K
          </kbd>
        </button>
      </div>
    </header>
  );
};
