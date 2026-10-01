import React from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Lock,
  FileCheck
} from 'lucide-react';

interface ComplianceItem {
  id: string;
  category: 'REGULATORY' | 'LINGUISTIC' | 'SECURITY' | 'TELEPHONY';
  title: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  mitigationInPlace: string;
  owner: string;
  status: 'MITIGATED' | 'OPEN_AUDIT';
}

const complianceItems: ComplianceItem[] = [
  {
    id: 'gap_01',
    category: 'REGULATORY',
    title: 'OJK Multifinance Verbal Disclosure Exact Phrasing',
    severity: 'MEDIUM',
    description: 'Verifying whether OJK regulation POJK 1/POJK.07/2013 requires verbal disclosure of dispute settlement channels on every routine instalment reminder call, or only when delinquency exceeds 7 days.',
    mitigationInPlace: 'Implemented conservative policy: Agent delivers abbreviated compliance notice if customer requests payment deferral beyond due date.',
    owner: 'Legal & Compliance (Jakarta)',
    status: 'MITIGATED'
  },
  {
    id: 'gap_02',
    category: 'LINGUISTIC',
    title: 'Taglish Visayas Regional Dialect Acoustic Tolerance',
    severity: 'LOW',
    description: 'Callers in Cebu and Iloilo frequently mix Cebuano/Bisaya syntax into standard Taglish bancassurance conversations.',
    mitigationInPlace: 'Integrated acoustic confidence threshold guard; gracefully falls back to polite Philippine English when Tagalog confidence dips below 0.70.',
    owner: 'Speech Modeling Team',
    status: 'MITIGATED'
  },
  {
    id: 'gap_03',
    category: 'SECURITY',
    title: 'Dual-Consent Audio Recording Disclosures',
    severity: 'HIGH',
    description: 'Statutory compliance across Indian IT Act and Philippine NPC Circular 16-01 requires explicit caller consent before call recording begins.',
    mitigationInPlace: 'Mandatory non-skippable greeting turn: "This call is recorded for quality and compliance verification under policy terms."',
    owner: 'Telephony Ops',
    status: 'MITIGATED'
  },
  {
    id: 'gap_04',
    category: 'SECURITY',
    title: 'Audio File PII Redaction & Encryption at Rest',
    severity: 'HIGH',
    description: 'Recorded audio WAV files contain verbal customer account numbers and phone numbers.',
    mitigationInPlace: 'MinIO storage with AES-256 server-side encryption and 30-day auto-purge lifecycles. Transcripts redacted via PII Shield before indexing.',
    owner: 'Infrastructure Security',
    status: 'MITIGATED'
  }
];

export const GapsCompliance: React.FC = () => {
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none text-xs">
      {/* Header */}
      <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
              Governance & Oversight
            </span>
            <span className="text-xs text-slate-400">
              Audit Matrix & Known Regulatory Constraints
            </span>
          </div>
          <h1 className="font-heading text-xl lg:text-2xl font-bold text-white tracking-tight">
            Compliance, Gaps & Risk Mitigations
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Explicitly documents open native-speaker review items, regulatory wording checks, data-retention lifecycles, and consent disclosures.
          </p>
        </div>
      </div>

      {/* Compliance Items Table */}
      <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="overflow-x-auto rounded-xl border border-[#1F293D]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1F293D] text-slate-400 bg-[#141C30] font-medium">
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Compliance Area</th>
                <th className="py-3 px-4">Risk Severity</th>
                <th className="py-3 px-4">Description & Regulatory Risk</th>
                <th className="py-3 px-4">Active Production Mitigation</th>
                <th className="py-3 px-4 text-right">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F293D] bg-[#0E1424]">
              {complianceItems.map((item) => (
                <tr key={item.id} className="hover:bg-[#141C30]/50 transition-colors">
                  <td className="py-3.5 px-4 uppercase text-indigo-400 font-mono text-[11px] font-semibold">{item.category}</td>
                  <td className="py-3.5 px-4 font-semibold text-white">{item.title}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        item.severity === 'HIGH'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : item.severity === 'MEDIUM'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {item.severity}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 text-xs max-w-sm leading-relaxed">{item.description}</td>
                  <td className="py-3.5 px-4 text-emerald-300 text-xs max-w-sm leading-relaxed">{item.mitigationInPlace}</td>
                  <td className="py-3.5 px-4 text-right text-slate-400 text-[11px] font-mono">{item.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
