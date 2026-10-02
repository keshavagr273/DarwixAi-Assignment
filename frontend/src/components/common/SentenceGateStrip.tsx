import React, { useState } from 'react';
import type { SentenceGateData } from '../../types';
import { ReceiptChip } from './ReceiptChip';
import { ArrowRight, AlertOctagon, CheckCircle2, ShieldCheck, Eye, EyeOff } from 'lucide-react';

interface SentenceGateStripProps {
  gate: SentenceGateData;
}

export const SentenceGateStrip: React.FC<SentenceGateStripProps> = ({ gate }) => {
  const [showBlockedDraft, setShowBlockedDraft] = useState(false);

  const isVerified = gate.status === 'VERIFIED';
  const isBlocked = gate.status === 'BLOCKED_FALLBACK';

  return (
    <div className="mt-2.5 pt-2 border-t border-[#1F293D] space-y-2 text-xs">
      {/* Row 1: Pipeline Lifecycle Strip */}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        {/* Step 1: Draft */}
        <span className="px-2 py-0.5 bg-violet-500/10 text-violet-300 border border-violet-500/20 rounded-md font-mono shrink-0">
          Draft (LLM)
        </span>

        <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />

        {/* Step 2: Gate Check */}
        {isVerified ? (
          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md flex items-center gap-1 font-medium shrink-0">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Sentence Gate: Verified
          </span>
        ) : (
          <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-md flex items-center gap-1 font-medium shrink-0">
            <AlertOctagon className="w-3 h-3 text-rose-400" />
            Sentence Gate: Blocked
          </span>
        )}

        <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />

        {/* Step 3: Spoken or Fallback */}
        {isVerified ? (
          <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-md font-medium shrink-0">
            Spoken to Caller
          </span>
        ) : (
          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md font-medium shrink-0">
            Fail-Closed Fallback Spoken
          </span>
        )}
      </div>

      {/* Row 2: Grounding Citation Row for Verified Turns */}
      {isVerified && gate.receipt && (
        <div className="pt-1.5 border-t border-[#1F293D]/50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-300 min-w-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-medium text-slate-300 shrink-0">Grounding Citation:</span>
            {gate.receipt.source_title && (
              <span className="text-slate-400 font-normal truncate max-w-[200px] hidden md:inline">
                {gate.receipt.source_title}
              </span>
            )}
          </div>
          <div className="shrink-0 max-w-full">
            <ReceiptChip receipt={gate.receipt} />
          </div>
        </div>
      )}

      {/* Blocked Draft Drill-down */}
      {isBlocked && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-xs space-y-2">
          <div className="flex items-center justify-between text-rose-400">
            <span className="font-semibold flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
              <span>Safety Gate Tripped: {gate.block_reason || 'Unsupported claim detected'}</span>
            </span>
            <button
              onClick={() => setShowBlockedDraft(!showBlockedDraft)}
              className="text-[11px] underline hover:text-rose-300 flex items-center gap-1 font-medium shrink-0 ml-2"
            >
              {showBlockedDraft ? (
                <>
                  <EyeOff className="w-3 h-3" /> Hide Draft
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3" /> View Blocked Draft
                </>
              )}
            </button>
          </div>

          {showBlockedDraft && (
            <div className="p-2.5 bg-[#090D16]/90 border border-rose-500/30 rounded-lg text-slate-300 space-y-1">
              <span className="text-[10px] text-rose-400 uppercase tracking-wider font-semibold block">
                Attempted Claim (Blocked from Voice Stream):
              </span>
              <p className="line-through text-rose-300 font-mono text-[11px] leading-relaxed">
                "{gate.draft_text}"
              </p>
            </div>
          )}

          {gate.receipt && (
            <div className="pt-2 border-t border-rose-500/20 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-300 min-w-0">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-medium text-slate-300 shrink-0">Canonical Policy Citation:</span>
                {gate.receipt.source_title && (
                  <span className="text-slate-400 font-normal truncate max-w-[200px] hidden md:inline">
                    {gate.receipt.source_title}
                  </span>
                )}
              </div>
              <div className="shrink-0 max-w-full">
                <ReceiptChip receipt={gate.receipt} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
