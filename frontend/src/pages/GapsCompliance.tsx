import React from 'react';

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
    <div className="p-6 space-y-6 max-w-7xl mx-auto select-none font-mono text-xs">
      {/* Header */}
      <div className="bg-[#121821] border border-[#243041] rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 bg-[#18212D] text-[#FFB547] border border-[#243041] rounded font-semibold">
              TRANSPARENCY & GOVERNANCE
            </span>
            <span className="text-xs text-[#8A97A8]">
              Honest Disclosure of Limitations & Regulatory Gaps
            </span>
          </div>
          <h1 className="font-heading text-xl font-bold text-[#E6EDF5] mt-1">
            Gaps, Compliance & Known Limitations
          </h1>
          <p className="text-xs text-[#8A97A8] font-sans">
            Explicitly documents open native-speaker review items, regulatory wording checks, data-retention lifecycles, and consent disclosures.
          </p>
        </div>
      </div>

      {/* Compliance Items Table */}
      <div className="bg-[#121821] border border-[#243041] rounded-lg p-5 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#243041] text-[#8A97A8] bg-[#0B0F14]">
                <th className="py-2.5 px-3">CAT</th>
                <th className="py-2.5 px-3">COMPLIANCE TITLE</th>
                <th className="py-2.5 px-3">SEVERITY</th>
                <th className="py-2.5 px-3">DESCRIPTION & RISK</th>
                <th className="py-2.5 px-3">ACTIVE MITIGATION</th>
                <th className="py-2.5 px-3">OWNER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#243041]">
              {complianceItems.map((item) => (
                <tr key={item.id} className="hover:bg-[#18212D]/60 transition-colors">
                  <td className="py-3 px-3 uppercase text-[#4CC9F0] font-semibold">{item.category}</td>
                  <td className="py-3 px-3 font-semibold text-[#E6EDF5]">{item.title}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        item.severity === 'HIGH'
                          ? 'bg-[#251417] text-[#FF5C6C] border border-[#FF5C6C]/40'
                          : item.severity === 'MEDIUM'
                          ? 'bg-[#261E14] text-[#FFB547] border border-[#FFB547]/40'
                          : 'bg-[#13221C] text-[#3DDC97] border border-[#3DDC97]/40'
                      }`}
                    >
                      {item.severity}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[#8A97A8] text-[11px] font-sans max-w-sm">{item.description}</td>
                  <td className="py-3 px-3 text-[#3DDC97] text-[11px] font-sans max-w-sm">{item.mitigationInPlace}</td>
                  <td className="py-3 px-3 text-[#57677D] text-[11px]">{item.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
