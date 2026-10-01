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
    <div className="mt-2.5 pt-2 border-t border-[#243041] space-y-1.5 font-mono text-xs">
      {/* Pipeline Strip */}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        {/* Step 1: Draft */}
        <span className="px-2 py-0.5 bg-[#1B182B] text-[#A78BFA] border border-[#A78BFA]/30 rounded">
          Draft (LLM)
        </span>

        <ArrowRight className="w-3 h-3 text-[#57677D]" />

        {/* Step 2: Gate Check */}
        {isVerified ? (
          <span className="px-2 py-0.5 bg-[#13221C] text-[#3DDC97] border border-[#3DDC97]/40 rounded flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Sentence Gate: Verified
          </span>
        ) : (
          <span className="px-2 py-0.5 bg-[#251417] text-[#FF5C6C] border border-[#FF5C6C]/40 rounded flex items-center gap-1">
            <AlertOctagon className="w-3 h-3" />
            Sentence Gate: BLOCKED
          </span>
        )}

        <ArrowRight className="w-3 h-3 text-[#57677D]" />

        {/* Step 3: Spoken or Fallback */}
        {isVerified ? (
          <span className="px-2 py-0.5 bg-[#121E2A] text-[#4CC9F0] border border-[#4CC9F0]/40 rounded">
            Spoken to Caller
          </span>
        ) : (
          <span className="px-2 py-0.5 bg-[#261E14] text-[#FFB547] border border-[#FFB547]/40 rounded">
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
        <div className="p-2.5 bg-[#1C1315] border border-[#FF5C6C]/30 rounded text-xs space-y-1.5">
          <div className="flex items-center justify-between text-[#FF5C6C]">
            <span className="font-semibold flex items-center gap-1">
              <AlertOctagon className="w-3.5 h-3.5" />
              Safety Gate Tripped: {gate.block_reason || 'Unsupported hallucination detected'}
            </span>
            <button
              onClick={() => setShowBlockedDraft(!showBlockedDraft)}
              className="text-[11px] underline hover:text-[#FFA6B0] flex items-center gap-1"
            >
              {showBlockedDraft ? (
                <>
                  <EyeOff className="w-3 h-3" /> Hide Draft
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3" /> View Blocked Model Draft
                </>
              )}
            </button>
          </div>

          {showBlockedDraft && (
            <div className="mt-1 pt-1.5 border-t border-[#FF5C6C]/20 text-[#8A97A8]">
              <span className="text-[11px] text-[#A78BFA] block mb-0.5">What model attempted to say:</span>
              <span className="line-through text-[#FF5C6C]/90 bg-[#0B0F14] px-1.5 py-0.5 rounded">
                "{gate.draft_text}"
              </span>
            </div>
          )}

          {gate.receipt && (
            <div className="pt-1 flex items-center justify-between">
              <span className="text-[11px] text-[#8A97A8]">Canonical Policy Citation:</span>
              <ReceiptChip receipt={gate.receipt} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
