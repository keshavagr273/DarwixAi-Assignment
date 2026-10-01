import React from 'react';
import { useApp } from '../../context/AppContext';
import type { GroundingReceipt } from '../../types';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

interface ReceiptChipProps {
  receipt?: GroundingReceipt;
  unsupported?: boolean;
}

export const ReceiptChip: React.FC<ReceiptChipProps> = ({ receipt, unsupported }) => {
  const { openReceipt } = useApp();

  if (unsupported || !receipt) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono font-medium bg-[#1F1517] text-[#FF5C6C] border border-[#FF5C6C]/40 rounded cursor-not-allowed">
        <AlertTriangle className="w-3 h-3 text-[#FF5C6C]" />
        UNSUPPORTED
      </span>
    );
  }

  return (
    <button
      onClick={() => openReceipt(receipt)}
      title="Click to inspect Grounding Receipt & Source Lineage"
      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono font-medium bg-[#13221C] hover:bg-[#1A3328] text-[#3DDC97] border border-[#3DDC97]/40 hover:border-[#3DDC97] rounded transition-colors text-left"
    >
      <ShieldCheck className="w-3 h-3 text-[#3DDC97] shrink-0" />
      <span>
        {receipt.record_id} · {receipt.version} · {receipt.score.toFixed(2)}
      </span>
    </button>
  );
};
