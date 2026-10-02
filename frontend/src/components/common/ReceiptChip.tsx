import React from 'react';
import { useApp } from '../../context/AppContext';
import type { GroundingReceipt } from '../../types';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

interface ReceiptChipProps {
  receipt?: GroundingReceipt;
  unsupported?: boolean;
}

export const ReceiptChip: React.FC<ReceiptChipProps> = ({ receipt, unsupported }) => {
  const { openReceipt, kbVersion } = useApp();

  if (unsupported || !receipt) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg cursor-not-allowed">
        <AlertTriangle className="w-3 h-3 text-rose-400" />
        Unsupported
      </span>
    );
  }

  const activeVersion = receipt.version || kbVersion || 'v1.3';

  return (
    <button
      onClick={() => openReceipt({ ...receipt, version: activeVersion })}
      title="Click to inspect Grounding Receipt & Source Lineage"
      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 hover:border-emerald-500/40 rounded-lg transition-colors text-left shadow-sm max-w-full"
    >
      <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
      <span className="truncate">
        {receipt.record_id} · {activeVersion} · {receipt.score.toFixed(2)}
      </span>
    </button>
  );
};
