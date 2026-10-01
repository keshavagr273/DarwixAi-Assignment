import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockCalls } from '../data/mockCallsData';
import { CallRecord } from '../types';
import {
  PhoneCall,
  Search,
  Filter,
  Play,
  ArrowRight,
  ShieldCheck,
  Activity,
  Download,
  Clock,
  Sparkles
} from 'lucide-react';

export const CallLibrary: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [marketFilter, setMarketFilter] = useState('all');

  const filteredCalls = mockCalls.filter((c) => {
    const matchesSearch =
      c.scenario.toLowerCase().includes(search.toLowerCase()) ||
      c.customer_name_masked.toLowerCase().includes(search.toLowerCase()) ||
      c.trace_id.toLowerCase().includes(search.toLowerCase());
    const matchesMarket = marketFilter === 'all' || c.market === marketFilter;
    return matchesSearch && matchesMarket;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="bg-[#121821] border border-[#243041] rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 bg-[#18212D] text-[#3DDC97] border border-[#243041] rounded font-semibold">
              OPERATIONAL AUDIT TRAIL
            </span>
            <span className="text-xs font-mono text-[#8A97A8]">
              {mockCalls.length} Telephony Sessions Recorded · 100% Traceable
            </span>
          </div>
          <h1 className="font-heading text-xl font-bold text-[#E6EDF5] mt-1">
            Call Library & Recordings
          </h1>
          <p className="text-xs text-[#8A97A8]">
            Inspect recorded customer calls, speaker turns, Grounding Receipts, and microsecond Black Box traces.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#8A97A8] absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search calls or trace ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-[#0B0F14] border border-[#243041] rounded text-xs font-mono text-[#E6EDF5] placeholder-[#57677D] focus:outline-none focus:border-[#3DDC97]"
            />
          </div>

          <select
            value={marketFilter}
            onChange={(e) => setMarketFilter(e.target.value)}
            className="bg-[#0B0F14] border border-[#243041] rounded text-xs font-mono text-[#E6EDF5] px-2.5 py-1.5 focus:outline-none"
          >
            <option value="all">All Markets</option>
            <option value="in_en">India (in_en)</option>
            <option value="ph_tl">Philippines (ph_tl)</option>
            <option value="id_id">Indonesia (id_id)</option>
          </select>
        </div>
      </div>

      {/* Calls Grid / Table */}
      <div className="bg-[#121821] border border-[#243041] rounded-lg p-5 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#243041] text-[#8A97A8] bg-[#0B0F14]">
                <th className="py-2.5 px-3">RECORD ID</th>
                <th className="py-2.5 px-3">MARKET</th>
                <th className="py-2.5 px-3">SCENARIO & CALLER</th>
                <th className="py-2.5 px-3">LANGUAGE MIX</th>
                <th className="py-2.5 px-3">DURATION</th>
                <th className="py-2.5 px-3">GROUNDED RATE</th>
                <th className="py-2.5 px-3">STATUS</th>
                <th className="py-2.5 px-3">BLACK BOX TRACE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#243041]">
              {filteredCalls.map((call) => (
                <tr key={call.id} className="hover:bg-[#18212D]/60 transition-colors">
                  <td className="py-3 px-3 text-[#3DDC97] font-semibold">{call.id}</td>
                  <td className="py-3 px-3 uppercase text-[#4CC9F0]">{call.market}</td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-[#E6EDF5] font-sans">{call.scenario}</div>
                    <div className="text-[11px] text-[#8A97A8]">{call.customer_name_masked}</div>
                  </td>
                  <td className="py-3 px-3 text-[#8A97A8]">{call.language_mix_summary}</td>
                  <td className="py-3 px-3 text-[#E6EDF5]">{call.duration_sec}s</td>
                  <td className="py-3 px-3">
                    <span className="text-[#3DDC97] font-semibold">
                      {call.grounded_answer_rate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        call.status === 'Completed'
                          ? 'bg-[#13221C] text-[#3DDC97] border border-[#3DDC97]/40'
                          : 'bg-[#251417] text-[#FF5C6C] border border-[#FF5C6C]/40'
                      }`}
                    >
                      {call.status}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => navigate(`/trace/${call.trace_id}`)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#18212D] hover:bg-[#243041] text-[#4CC9F0] border border-[#243041] hover:border-[#4CC9F0]/40 rounded transition-colors"
                    >
                      <Activity className="w-3 h-3 text-[#4CC9F0]" />
                      <span>{call.trace_id}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
