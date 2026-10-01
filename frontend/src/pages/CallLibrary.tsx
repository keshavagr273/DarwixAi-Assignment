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
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
              Audit Trail
            </span>
            <span className="text-xs text-slate-400">
              {mockCalls.length} Telephony Sessions Recorded · 100% Traceable
            </span>
          </div>
          <h1 className="font-heading text-xl lg:text-2xl font-bold text-white tracking-tight">
            Call Library & Recorded Sessions
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Inspect recorded customer calls, speaker turns, Grounding Receipts, and microsecond Black Box traces.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search calls or trace ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-[#141C30] border border-[#1F293D] rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={marketFilter}
            onChange={(e) => setMarketFilter(e.target.value)}
            className="bg-[#141C30] border border-[#1F293D] rounded-xl text-xs text-slate-200 px-3 py-1.5 focus:outline-none"
          >
            <option value="all">All Markets</option>
            <option value="in_en">India (in_en)</option>
            <option value="ph_tl">Philippines (ph_tl)</option>
            <option value="id_id">Indonesia (id_id)</option>
          </select>
        </div>
      </div>

      {/* Calls Grid / Table */}
      <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="overflow-x-auto rounded-xl border border-[#1F293D]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1F293D] text-slate-400 bg-[#141C30] font-medium">
                <th className="py-3 px-4 font-mono">Record ID</th>
                <th className="py-3 px-4">Market</th>
                <th className="py-3 px-4">Scenario & Customer</th>
                <th className="py-3 px-4">Language Mix</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Grounded Rate</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Flight Recorder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F293D] bg-[#0E1424]">
              {filteredCalls.map((call) => (
                <tr key={call.id} className="hover:bg-[#141C30]/50 transition-colors">
                  <td className="py-3.5 px-4 text-indigo-400 font-mono font-medium">{call.id}</td>
                  <td className="py-3.5 px-4 uppercase text-indigo-300 font-mono text-[11px]">{call.market}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white">{call.scenario}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{call.customer_name_masked}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">{call.language_mix_summary}</td>
                  <td className="py-3.5 px-4 text-slate-200 font-mono">{call.duration_sec}s</td>
                  <td className="py-3.5 px-4">
                    <span className="text-emerald-400 font-mono font-semibold">
                      {call.grounded_answer_rate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                        call.status === 'Completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {call.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => navigate(`/trace/${call.trace_id}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#141C30] hover:bg-indigo-600/20 text-indigo-300 border border-[#1F293D] hover:border-indigo-500/40 rounded-lg transition-all font-mono text-[11px]"
                    >
                      <Activity className="w-3 h-3 text-indigo-400" />
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
