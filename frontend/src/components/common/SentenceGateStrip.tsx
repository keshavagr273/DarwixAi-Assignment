import React, { useState } from 'react';
import type { SentenceGateData } from '../../types';
import { ReceiptChip } from './ReceiptChip';
import { ArrowRight, AlertOctagon, CheckCircle2, Eye, EyeOff } from 'lucide-react';

interface SentenceGateStripProps {
  gate: SentenceGateData;
}

export const SentenceGateStrip: React.FC<SentenceGateStripProps> = ({ gate }) => {
  const [showBlockedDraft, setShowBlockedDraft] = useState(false);

  const isVerified = gate.status === 'VERIFIED';
  const isBlocked = gate.status === 'BLOCKED_FALLBACK';

  return (
    <div className="mt-2.5 pt-2 border-t border-[#1F293D] space-y-2 text-xs">
      {/* Pipeline Strip */}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        {/* Step 1: Draft */}
        <span className="px-2.5 py-0.5 bg-violet-500/10 text-violet-300 border border-violet-500/20 rounded-md font-mono">
          Draft (LLM)
        </span>

        <ArrowRight className="w-3 h-3 text-slate-500" />

        {/* Step 2: Gate Check */}
        {isVerified ? (
          <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            Sentence Gate: Verified
          </span>
        ) : (
          <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-md flex items-center gap-1 font-medium">
            <AlertOctagon className="w-3 h-3" />
            Sentence Gate: Blocked
          </span>
        )}

        <ArrowRight className="w-3 h-3 text-slate-500" />

        {/* Step 3: Spoken or Fallback */}
        {isVerified ? (
          <span className="px-2.5 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-md font-medium">
            Spoken to Caller
          </span>
        ) : (
          <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md font-medium">
            Fail-Closed Fallback Spoken
          </span>
        )}

        {/* Receipt Chip if verified */}
        {isVerified && gate.receipt && (
          <div className="ml-auto">
            <ReceiptChip receipt={gate.receipt} />
          </div>
        )}
      </div>

      {/* Blocked Draft Drill-down */}
      {isBlocked && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs space-y-1.5">
          <div className="flex items-center justify-between text-rose-400">
            <span className="font-semibold flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5" />
              Safety Gate Tripped: {gate.block_reason || 'Unsupported claim detected'}
            </span>
            <button
              onClick={() => setShowBlockedDraft(!showBlockedDraft)}
              className="text-[11px] underline hover:text-rose-300 flex items-center gap-1 font-medium"
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
            <div className="mt-1 pt-1.5 border-t border-rose-500/20 text-slate-400">
              <span className="text-[11px] text-violet-300 block mb-0.5">Attempted claim:</span>
              <span className="line-through text-rose-300 bg-[#090D16] px-2 py-0.5 rounded font-mono text-[11px]">
                "{gate.draft_text}"
              </span>
            </div>
          )}

          {gate.receipt && (
            <div className="pt-1.5 flex items-center justify-between border-t border-rose-500/20">
              <span className="text-[11px] text-slate-400">Canonical Policy Citation:</span>
              <ReceiptChip receipt={gate.receipt} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
