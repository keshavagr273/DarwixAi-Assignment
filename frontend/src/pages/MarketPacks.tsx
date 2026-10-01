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
  Search
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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto select-none">
      {/* Header with Market Switcher */}
      <div className="bg-[#121821] border border-[#243041] rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 bg-[#18212D] text-[#3DDC97] border border-[#243041] rounded font-semibold">
              QUESTION 3 DELIVERABLE
            </span>
            <span className="text-xs font-mono text-[#8A97A8]">
              Linguistic Localization Workbench · Adaptation ≠ Translation
            </span>
          </div>
          <h1 className="font-heading text-xl font-bold text-[#E6EDF5] mt-1">
            Market Packs & Cultural Localization
          </h1>
          <p className="text-xs text-[#8A97A8]">
            Examine authentic honorifics, financial vernacular, politeness particles, and locked registers for Southeast Asian contact centers.
          </p>
        </div>

        {/* Big Market Selector */}
        <div className="flex items-center gap-2 bg-[#0B0F14] border border-[#243041] p-1 rounded-md font-mono text-xs">
          <button
            onClick={() => setMarket('in_en')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              market === 'in_en'
                ? 'bg-[#18212D] text-[#3DDC97] border border-[#3DDC97]/40 font-semibold'
                : 'text-[#8A97A8] hover:text-[#E6EDF5]'
            }`}
          >
            <span>🇮🇳</span> India (in_en)
          </button>
          <button
            onClick={() => setMarket('ph_tl')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              market === 'ph_tl'
                ? 'bg-[#18212D] text-[#3DDC97] border border-[#3DDC97]/40 font-semibold'
                : 'text-[#8A97A8] hover:text-[#E6EDF5]'
            }`}
          >
            <span>🇵🇭</span> Philippines (ph_tl)
          </button>
          <button
            onClick={() => setMarket('id_id')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              market === 'id_id'
                ? 'bg-[#18212D] text-[#3DDC97] border border-[#3DDC97]/40 font-semibold'
                : 'text-[#8A97A8] hover:text-[#E6EDF5]'
            }`}
          >
            <span>🇮🇩</span> Indonesia (id_id)
          </button>
        </div>
      </div>

      {/* Market Profile Highlights Card */}
      <div className="p-4 bg-[#18212D] border border-[#243041] rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
        <div>
          <span className="text-[#8A97A8] text-[10px] uppercase">Selected Focus Domain:</span>
          <div className="font-semibold text-[#E6EDF5] font-sans mt-0.5">{currentProfile.domain}</div>
        </div>
        <div>
          <span className="text-[#8A97A8] text-[10px] uppercase">Formality Protocol:</span>
          <div className="font-semibold text-[#3DDC97] font-sans mt-0.5">{currentProfile.formalityRange}</div>
        </div>
        <div>
          <span className="text-[#8A97A8] text-[10px] uppercase">Regulatory Authority:</span>
          <div className="font-semibold text-[#4CC9F0] font-sans mt-0.5">{currentProfile.regulatoryBody}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1 border-b border-[#243041] pb-1 text-xs font-mono">
        <button
          onClick={() => setActiveTab('workbench')}
          className={`px-3.5 py-2 rounded-t font-semibold transition-colors ${
            activeTab === 'workbench'
              ? 'bg-[#18212D] text-[#3DDC97] border-t border-x border-[#243041]'
              : 'text-[#8A97A8] hover:text-[#E6EDF5]'
          }`}
        >
          1. 3-Pane Localization Workbench ({tripletsForMarket.length} Samples)
        </button>
        <button
          onClick={() => setActiveTab('dial')}
          className={`px-3.5 py-2 rounded-t font-semibold transition-colors ${
            activeTab === 'dial'
              ? 'bg-[#18212D] text-[#3DDC97] border-t border-x border-[#243041]'
              : 'text-[#8A97A8] hover:text-[#E6EDF5]'
          }`}
        >
          2. Register Dial & Language Lock
        </button>
        <button
          onClick={() => setActiveTab('glossary')}
          className={`px-3.5 py-2 rounded-t font-semibold transition-colors ${
            activeTab === 'glossary'
              ? 'bg-[#18212D] text-[#3DDC97] border-t border-x border-[#243041]'
              : 'text-[#8A97A8] hover:text-[#E6EDF5]'
          }`}
        >
          3. Terminology Glossary
        </button>
        <button
          onClick={() => setActiveTab('fallbacks')}
          className={`px-3.5 py-2 rounded-t font-semibold transition-colors ${
            activeTab === 'fallbacks'
              ? 'bg-[#18212D] text-[#3DDC97] border-t border-x border-[#243041]'
              : 'text-[#8A97A8] hover:text-[#E6EDF5]'
          }`}
        >
          4. Localized Fallback Sheet
        </button>
        <button
          onClick={() => setActiveTab('gaps')}
          className={`px-3.5 py-2 rounded-t font-semibold transition-colors ${
            activeTab === 'gaps'
              ? 'bg-[#18212D] text-[#3DDC97] border-t border-x border-[#243041]'
              : 'text-[#8A97A8] hover:text-[#E6EDF5]'
          }`}
        >
          5. Native Speaker / Regulatory Gaps
        </button>
      </div>

      {/* ================= TAB 1: 3-PANE WORKBENCH ================= */}
      {activeTab === 'workbench' && (
        <div className="bg-[#121821] border border-[#243041] rounded-lg p-5 space-y-6">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#E6EDF5] font-semibold">
              Three-Pane Contrast: Neutral Intent → English Literal → Localized Final
            </h2>
            <p className="text-xs text-[#8A97A8] mt-1">
              Demonstrates why direct translation produces cold, offensive, or robotic dialogue, while cultural adaptation builds trust.
            </p>
          </div>

          <div className="space-y-6">
            {tripletsForMarket.map((trip) => (
              <div
                key={trip.id}
                className="p-4 bg-[#18212D] border border-[#243041] rounded-lg space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#243041] pb-2 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-[#3DDC97] font-semibold">{trip.intent_label}</span>
                    <span className="text-[#8A97A8]">({trip.category})</span>
                  </div>
                  <span className="text-[11px] text-[#4CC9F0] bg-[#121E2A] px-2 py-0.5 rounded border border-[#4CC9F0]/40">
                    Register: {trip.honorific_register}
                  </span>
                </div>

                {/* 3 Columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* Pane 1: Neutral Intent */}
                  <div className="p-3 bg-[#0B0F14] border border-[#243041] rounded space-y-1">
                    <div className="font-mono text-[10px] text-[#8A97A8] uppercase font-semibold">
                      1. NEUTRAL BUSINESS INTENT
                    </div>
                    <p className="text-[#8A97A8] font-sans leading-relaxed">
                      {trip.neutral_intent}
                    </p>
                  </div>

                  {/* Pane 2: English Literal */}
                  <div className="p-3 bg-[#1F1416] border border-[#FF5C6C]/30 rounded space-y-1">
                    <div className="font-mono text-[10px] text-[#FF5C6C] uppercase font-semibold">
                      2. LITERAL TRANSLATION (REJECTED)
                    </div>
                    <p className="text-[#FF5C6C]/90 font-sans leading-relaxed line-through">
                      "{trip.literal_english_translation}"
                    </p>
                    <div className="text-[10px] text-[#8A97A8] font-mono pt-1">
                      Flaw: Adversarial, unidiomatic, robotic cadence.
                    </div>
                  </div>

                  {/* Pane 3: Localized Final */}
                  <div className="p-3 bg-[#0B0F14] border border-[#3DDC97]/50 rounded space-y-1">
                    <div className="font-mono text-[10px] text-[#3DDC97] uppercase font-semibold">
                      3. AUTHENTIC LOCALIZED FINAL
                    </div>
                    <p className="text-[#E6EDF5] font-sans font-medium leading-relaxed">
                      "{trip.localized_natural_expression}"
                    </p>
                  </div>
                </div>

                {/* Cultural Annotations */}
                <div className="pt-2 border-t border-[#243041] space-y-1.5">
                  <div className="text-[11px] font-mono text-[#8A97A8]">
                    Linguistic Engineering Annotations (Why This Phrasing Was Built):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    {trip.cultural_annotations.map((annot, i) => (
                      <div key={i} className="p-2 bg-[#0B0F14] rounded border border-[#243041]">
                        <span className="text-[#3DDC97] font-semibold">{annot.feature}: </span>
                        <span className="text-[#8A97A8] font-sans">{annot.explanation}</span>
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
        <div className="bg-[#121821] border border-[#243041] rounded-lg p-5 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-mono uppercase tracking-wider text-[#E6EDF5] font-semibold flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-[#3DDC97]" />
                Live Register Dial & Language Lock Badge
              </h2>
              <p className="text-xs text-[#8A97A8] mt-1">
                Monitors language mix and formality balance. If the bot slips into unexpected English, the Language Lock turns amber.
              </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 bg-[#13221C] border border-[#3DDC97]/40 rounded text-xs font-mono">
              <Lock className="w-3.5 h-3.5 text-[#3DDC97]" />
              <span className="text-[#3DDC97] font-semibold">LANGUAGE LOCK: ENGAGED</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono text-xs">
            {/* Formality Gauge */}
            <div className="p-4 bg-[#18212D] border border-[#243041] rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[#8A97A8]">Politeness Register Spectrum:</span>
                <span className="text-[#3DDC97] font-semibold">Respectful Partner (72 / 100)</span>
              </div>
              <div className="w-full h-3 bg-[#0B0F14] rounded-full overflow-hidden flex border border-[#243041]">
                <div className="w-[72%] bg-[#3DDC97] h-full" />
              </div>
              <div className="flex justify-between text-[11px] text-[#57677D]">
                <span>Colloquial / Casual</span>
                <span>Balanced Professional</span>
                <span>Formal Courtly</span>
              </div>
            </div>

            {/* Language Mix Breakdown */}
            <div className="p-4 bg-[#18212D] border border-[#243041] rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[#8A97A8]">Conversation Language Mix:</span>
                <span className="text-[#4CC9F0] font-semibold">Taglish (61% TL / 22% EN / 17% Hybrid)</span>
              </div>
              <div className="w-full h-3 bg-[#0B0F14] rounded-full overflow-hidden flex border border-[#243041]">
                <div className="w-[61%] bg-[#3DDC97]" title="Tagalog (61%)" />
                <div className="w-[22%] bg-[#4CC9F0]" title="English Loanwords (22%)" />
                <div className="w-[17%] bg-[#A78BFA]" title="Hybrid Bridge (17%)" />
              </div>
              <div className="flex justify-between text-[11px] text-[#8A97A8]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-[#3DDC97]" /> Tagalog (61%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-[#4CC9F0]" /> English (22%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-[#A78BFA]" /> Bridge (17%)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: GLOSSARY ================= */}
      {activeTab === 'glossary' && (
        <div className="bg-[#121821] border border-[#243041] rounded-lg p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xs font-mono uppercase tracking-wider text-[#E6EDF5] font-semibold">
                Financial Terminology Glossary & "Do Not Translate" Flags
              </h2>
              <p className="text-xs text-[#8A97A8] mt-1">
                Standardized definitions and cultural usage guidelines across target regions.
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8A97A8] absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search glossary terms..."
                value={glossaryQuery}
                onChange={(e) => setGlossaryQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-[#0B0F14] border border-[#243041] rounded text-xs font-mono text-[#E6EDF5] placeholder-[#57677D] focus:outline-none focus:border-[#3DDC97]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#243041] text-[#8A97A8] bg-[#0B0F14]">
                  <th className="py-2.5 px-3">TERM</th>
                  <th className="py-2.5 px-3">MARKET</th>
                  <th className="py-2.5 px-3">STANDARDIZED TARGET EXPRESSION</th>
                  <th className="py-2.5 px-3">DO NOT TRANSLATE</th>
                  <th className="py-2.5 px-3">USAGE GUIDELINE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243041]">
                {filteredGlossary.map((g, i) => (
                  <tr key={i} className="hover:bg-[#18212D]/60 transition-colors">
                    <td className="py-3 px-3 font-semibold text-[#E6EDF5]">{g.term}</td>
                    <td className="py-3 px-3 uppercase text-[#4CC9F0]">{g.market}</td>
                    <td className="py-3 px-3 text-[#3DDC97]">{g.translation}</td>
                    <td className="py-3 px-3">
                      {g.dnt ? (
                        <span className="px-2 py-0.5 bg-[#251417] text-[#FF5C6C] border border-[#FF5C6C]/40 rounded text-[10px] font-semibold">
                          DO NOT TRANSLATE
                        </span>
                      ) : (
                        <span className="text-[#57677D] text-[10px]">Adaptable</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[#8A97A8] font-sans max-w-sm">{g.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 4: FALLBACK SHEET ================= */}
      {activeTab === 'fallbacks' && (
        <div className="bg-[#121821] border border-[#243041] rounded-lg p-5 space-y-4">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#E6EDF5] font-semibold">
              Per-Language Fallback & Escalation Sheet
            </h2>
            <p className="text-xs text-[#8A97A8] mt-1">
              Guarantees that when the agent cannot answer, the refusal stays 100% in the customer’s native language and register.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            {mockFallbacks.map((fb, i) => (
              <div
                key={i}
                className="p-4 bg-[#18212D] border border-[#243041] rounded-lg space-y-3"
              >
                <div className="flex justify-between items-center border-b border-[#243041] pb-2">
                  <span className="font-semibold text-[#3DDC97] uppercase">{fb.market}</span>
                  <span className="text-[10px] text-[#4CC9F0]">Drift: {fb.drift_score}</span>
                </div>

                <div className="text-[10px] text-[#8A97A8] uppercase font-semibold">
                  Certified Fallback Phrase:
                </div>
                <p className="text-[#E6EDF5] font-sans leading-relaxed text-xs italic">
                  "{fb.phrase}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 5: GAPS ================= */}
      {activeTab === 'gaps' && (
        <div className="bg-[#121821] border border-[#243041] rounded-lg p-5 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-wider text-[#E6EDF5] font-semibold">
              Open Native-Speaker & Regulatory Review Gaps
            </h2>
            <span className="text-xs text-[#FFB547]">Tracked Open Items</span>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-[#18212D] border border-[#243041] rounded space-y-1">
              <div className="flex justify-between text-[#FFB547] font-semibold">
                <span>[ID_GAP_01] OJK 2026 Disclosure Verbatim Legal Verification</span>
                <span className="text-[10px] bg-[#261E14] px-1.5 py-0.2 rounded border border-[#FFB547]/40">MEDIUM SEVERITY</span>
              </div>
              <p className="text-[#8A97A8] font-sans">
                Verify whether OJK circular requires verbatim recitation of consumer dispute escalation telephone number or if SMS referral is permitted.
              </p>
            </div>

            <div className="p-3 bg-[#18212D] border border-[#243041] rounded space-y-1">
              <div className="flex justify-between text-[#FFB547] font-semibold">
                <span>[PH_GAP_02] Taglish Cebuano / Bisaya Accent Field Testing</span>
                <span className="text-[10px] bg-[#261E14] px-1.5 py-0.2 rounded border border-[#FFB547]/40">LOW SEVERITY</span>
              </div>
              <p className="text-[#8A97A8] font-sans">
                Field validation pending for Visayas callers who mix Bisaya particles with Taglish financial terminology.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
