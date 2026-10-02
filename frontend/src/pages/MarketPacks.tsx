import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  marketProfiles,
  mockLocalizationTriplets,
  mockGlossary,
  mockFallbacks
} from '../data/mockMarketData';
import {
  Compass,
  Lock,
  Search,
  Globe2,
  BookOpen,
  Sliders,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const MarketPacks: React.FC = () => {
  const { market, setMarket } = useApp();
  const [activeTab, setActiveTab] = useState<'workbench' | 'glossary' | 'dial' | 'fallbacks' | 'gaps'>('workbench');
  const [glossaryQuery, setGlossaryQuery] = useState('');

  const currentProfile = marketProfiles[market];
  const tripletsForMarket = mockLocalizationTriplets.filter((t) => t.market === market);

  const filteredGlossary = mockGlossary.filter(
    (g) =>
      (g.market === market || market === 'in_en') &&
      (g.term.toLowerCase().includes(glossaryQuery.toLowerCase()) ||
        g.translation.toLowerCase().includes(glossaryQuery.toLowerCase()))
  );

  const tabs = [
    { id: 'workbench', label: `3-Pane Workbench (${tripletsForMarket.length})`, icon: Globe2 },
    { id: 'dial', label: 'Register Dial & Language Lock', icon: Compass },
    { id: 'glossary', label: 'Financial Glossary', icon: BookOpen },
    { id: 'fallbacks', label: 'Certified Fallbacks', icon: Sliders },
    { id: 'gaps', label: 'Regulatory Gaps', icon: ShieldAlert },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none">
      {/* Header with Market Switcher */}
      <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
              Linguistic Localization
            </span>
            <span className="text-xs text-slate-400">
              Cultural Adaptation ≠ Translation
            </span>
          </div>
          <h1 className="font-heading text-xl lg:text-2xl font-bold text-white tracking-tight">
            Market Packs & Cultural Localization
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Examine authentic honorifics, financial vernacular, politeness particles, and locked registers for Southeast Asian contact centers.
          </p>
        </div>

        {/* Big Market Selector */}
        <div className="flex items-center gap-1.5 bg-[#141C30] border border-[#1F293D] p-1 rounded-xl text-xs">
          <button
            onClick={() => setMarket('in_en')}
            className={`px-3 py-1.5 rounded-lg transition-colors duration-100 outline-none focus:outline-none focus-visible:outline-none border flex items-center gap-2 font-medium ${
              market === 'in_en'
                ? 'bg-indigo-600 text-white shadow-sm border-indigo-500'
                : 'text-slate-400 hover:text-white border-transparent'
            }`}
          >
            <span>🇮🇳</span> India (in_en)
          </button>
          <button
            onClick={() => setMarket('ph_tl')}
            className={`px-3 py-1.5 rounded-lg transition-colors duration-100 outline-none focus:outline-none focus-visible:outline-none border flex items-center gap-2 font-medium ${
              market === 'ph_tl'
                ? 'bg-indigo-600 text-white shadow-sm border-indigo-500'
                : 'text-slate-400 hover:text-white border-transparent'
            }`}
          >
            <span>🇵🇭</span> Philippines (ph_tl)
          </button>
          <button
            onClick={() => setMarket('id_id')}
            className={`px-3 py-1.5 rounded-lg transition-colors duration-100 outline-none focus:outline-none focus-visible:outline-none border flex items-center gap-2 font-medium ${
              market === 'id_id'
                ? 'bg-indigo-600 text-white shadow-sm border-indigo-500'
                : 'text-slate-400 hover:text-white border-transparent'
            }`}
          >
            <span>🇮🇩</span> Indonesia (id_id)
          </button>
        </div>
      </div>

      {/* Market Profile Highlights Card */}
      <div className="p-5 bg-[#141C30] border border-[#1F293D] rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
        <div>
          <span className="text-slate-400 text-[11px] uppercase tracking-wider block font-medium">Selected Focus Domain:</span>
          <div className="font-semibold text-white font-sans text-sm mt-1">{currentProfile.domain}</div>
        </div>
        <div>
          <span className="text-slate-400 text-[11px] uppercase tracking-wider block font-medium">Formality Protocol:</span>
          <div className="font-semibold text-emerald-400 font-sans text-sm mt-1">{currentProfile.formalityRange}</div>
        </div>
        <div>
          <span className="text-slate-400 text-[11px] uppercase tracking-wider block font-medium">Regulatory Authority:</span>
          <div className="font-semibold text-sky-400 font-sans text-sm mt-1">{currentProfile.regulatoryBody}</div>
        </div>
      </div>

      {/* Tabs */}
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

      {/* ================= TAB 1: 3-PANE WORKBENCH ================= */}
      {activeTab === 'workbench' && (
        <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 space-y-6 shadow-sm">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Three-Pane Contrast: Neutral Intent → English Literal → Localized Final
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Demonstrates why direct translation produces cold or robotic dialogue, while cultural adaptation builds customer trust.
            </p>
          </div>

          <div className="space-y-6">
            {tripletsForMarket.map((trip) => (
              <div
                key={trip.id}
                className="p-5 bg-[#141C30] border border-[#1F293D] rounded-2xl space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1F293D] pb-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-400 font-semibold">{trip.intent_label}</span>
                    <span className="text-slate-400">({trip.category})</span>
                  </div>
                  <span className="text-[11px] text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20 font-mono">
                    Register: {trip.honorific_register}
                  </span>
                </div>

                {/* 3 Columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Pane 1: Neutral Intent */}
                  <div className="p-4 bg-[#090D16] border border-[#1F293D] rounded-xl space-y-2">
                    <div className="text-[11px] text-slate-400 uppercase font-semibold">
                      1. Neutral Business Intent
                    </div>
                    <p className="text-slate-300 font-sans leading-relaxed">
                      {trip.neutral_intent}
                    </p>
                  </div>

                  {/* Pane 2: English Literal */}
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-2">
                    <div className="text-[11px] text-rose-400 uppercase font-semibold">
                      2. Literal Translation (Rejected)
                    </div>
                    <p className="text-rose-300 font-sans leading-relaxed line-through">
                      "{trip.literal_english_translation}"
                    </p>
                    <div className="text-[11px] text-rose-400/80 pt-1">
                      Flaw: Adversarial tone, unnatural cadence.
                    </div>
                  </div>

                  {/* Pane 3: Localized Final */}
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
                    <div className="text-[11px] text-emerald-400 uppercase font-semibold">
                      3. Authentic Localized Expression
                    </div>
                    <p className="text-white font-sans font-medium leading-relaxed">
                      "{trip.localized_natural_expression}"
                    </p>
                  </div>
                </div>

                {/* Cultural Annotations */}
                <div className="pt-3 border-t border-[#1F293D] space-y-2">
                  <div className="text-[11px] text-slate-400 font-medium">
                    Linguistic Rationale:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {trip.cultural_annotations.map((annot, i) => (
                      <div key={i} className="p-3 bg-[#090D16] rounded-xl border border-[#1F293D]">
                        <span className="text-indigo-400 font-semibold">{annot.feature}: </span>
                        <span className="text-slate-300">{annot.explanation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 2: REGISTER DIAL ================= */}
      {activeTab === 'dial' && (
        <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1F293D]">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-400" />
                Live Register Dial & Language Lock
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Monitors language mix and formality balance. If the agent slips into unidiomatic English, the Language Lock alarms.
              </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Language Lock: Engaged</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Formality Gauge */}
            <div className="p-5 bg-[#141C30] border border-[#1F293D] rounded-2xl space-y-3.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Politeness Register Spectrum:</span>
                <span className="text-emerald-400 font-semibold font-mono">Respectful Partner (72 / 100)</span>
              </div>
              <div className="w-full h-3 bg-[#090D16] rounded-full overflow-hidden flex border border-[#1F293D]">
                <div className="w-[72%] bg-emerald-500 h-full rounded-full" />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Colloquial / Casual</span>
                <span>Balanced Professional</span>
                <span>Formal Courtly</span>
              </div>
            </div>

            {/* Language Mix Breakdown */}
            <div className="p-5 bg-[#141C30] border border-[#1F293D] rounded-2xl space-y-3.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Conversation Language Mix:</span>
                <span className="text-indigo-400 font-semibold font-mono">Taglish (61% TL / 22% EN / 17% Hybrid)</span>
              </div>
              <div className="w-full h-3 bg-[#090D16] rounded-full overflow-hidden flex border border-[#1F293D]">
                <div className="w-[61%] bg-emerald-500" title="Tagalog (61%)" />
                <div className="w-[22%] bg-indigo-500" title="English Loanwords (22%)" />
                <div className="w-[17%] bg-violet-500" title="Hybrid Bridge (17%)" />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Tagalog (61%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" /> English (22%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-violet-500" /> Bridge (17%)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: GLOSSARY ================= */}
      {activeTab === 'glossary' && (
        <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1F293D]">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Financial Terminology Glossary & "Do Not Translate" Flags
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Standardized definitions and cultural usage guidelines across target regions.
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search glossary terms..."
                value={glossaryQuery}
                onChange={(e) => setGlossaryQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-[#141C30] border border-[#1F293D] rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#1F293D]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1F293D] text-slate-400 bg-[#141C30] font-medium">
                  <th className="py-3 px-4">Financial Term</th>
                  <th className="py-3 px-4">Market</th>
                  <th className="py-3 px-4">Standardized Local Expression</th>
                  <th className="py-3 px-4">Translation Policy</th>
                  <th className="py-3 px-4">Usage Guideline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F293D] bg-[#0E1424]">
                {filteredGlossary.map((g, i) => (
                  <tr key={i} className="hover:bg-[#141C30]/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">{g.term}</td>
                    <td className="py-3.5 px-4 uppercase text-indigo-400 font-mono text-[11px]">{g.market}</td>
                    <td className="py-3.5 px-4 text-emerald-400 font-medium">{g.translation}</td>
                    <td className="py-3.5 px-4">
                      {g.dnt ? (
                        <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-[10px] font-semibold">
                          Do Not Translate
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Adaptable</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 max-w-sm">{g.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 4: FALLBACK SHEET ================= */}
      {activeTab === 'fallbacks' && (
        <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 space-y-4 shadow-sm">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Per-Language Certified Fallback Sheet
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Guarantees that when the agent cannot answer, the refusal stays 100% in the customer’s native language and register.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {mockFallbacks.map((fb, i) => (
              <div
                key={i}
                className="p-5 bg-[#141C30] border border-[#1F293D] rounded-2xl space-y-3"
              >
                <div className="flex justify-between items-center border-b border-[#1F293D] pb-3">
                  <span className="font-semibold text-indigo-400 uppercase font-mono">{fb.market}</span>
                  <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                    Drift: {fb.drift_score}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 uppercase font-semibold">
                  Certified Fallback Phrase:
                </div>
                <p className="text-white font-sans leading-relaxed text-xs italic">
                  "{fb.phrase}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 5: GAPS ================= */}
      {activeTab === 'gaps' && (
        <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 space-y-4 shadow-sm text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#1F293D]">
            <h2 className="text-sm font-semibold text-white">
              Open Native-Speaker & Regulatory Review Gaps
            </h2>
            <span className="text-xs text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 font-medium">
              Tracked Open Items
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-[#141C30] border border-[#1F293D] rounded-xl space-y-2">
              <div className="flex justify-between text-amber-400 font-semibold">
                <span>[ID_GAP_01] OJK 2026 Disclosure Verbatim Legal Verification</span>
                <span className="text-[10px] bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-mono">Medium Severity</span>
              </div>
              <p className="text-slate-300">
                Verify whether OJK circular requires verbatim recitation of consumer dispute escalation telephone number or if SMS referral is permitted.
              </p>
            </div>

            <div className="p-4 bg-[#141C30] border border-[#1F293D] rounded-xl space-y-2">
              <div className="flex justify-between text-amber-400 font-semibold">
                <span>[PH_GAP_02] Taglish Cebuano / Bisaya Accent Field Testing</span>
                <span className="text-[10px] bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-mono">Low Severity</span>
              </div>
              <p className="text-slate-300">
                Field validation pending for Visayas callers who mix Bisaya particles with Taglish financial terminology.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
