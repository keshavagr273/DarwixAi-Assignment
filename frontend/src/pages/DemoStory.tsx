import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlaySquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Volume2,
  FileText,
  Play,
  RotateCcw
} from 'lucide-react';

interface Step {
  id: number;
  title: string;
  targetRoute: string;
  focusMessage: string;
  presenterNotes: string[];
  keyArtifactToHighlight: string;
}

const demoSteps: Step[] = [
  {
    id: 1,
    title: '1. Executive Overview & Mission Control',
    targetRoute: '/',
    focusMessage: 'Open Mission Control: "Every claim carries a verifiable citation receipt, and unnecessary alerts are filtered with deterministic reasons."',
    presenterNotes: [
      'Highlight the 4 core platform capabilities (Voice Agent, Knowledge Engine, Localization, Live Copilot).',
      'Show the live latency telemetry strip (1,087ms P95 end-to-end against 2,500ms budget).',
      'Demonstrate the Fail-Closed Refusals Ledger showing zero ungrounded hallucinations.'
    ],
    keyArtifactToHighlight: 'Platform Capabilities & Refusals Ledger'
  },
  {
    id: 2,
    title: '2. Traceable Knowledge Base & PII Vault',
    targetRoute: '/kb',
    focusMessage: 'Open KB Studio: Walk through Ingestion → Cleaning Diff → PII Vault Tokenization → Version Lineage.',
    presenterNotes: [
      'Show Cleaning Diff tab: point out the resolved conflict between marketing flyer and statutory policy contract.',
      'Show PII Shield: demonstrate 0 raw leaks across 412 chunks, with all customer identifiers masked to tokens.',
      'Click any record row to open the provenance Grounding Receipt.'
    ],
    keyArtifactToHighlight: 'Cleaning Diff & PII Zero-Leak Gate'
  },
  {
    id: 3,
    title: '3. Hybrid Retrieval Quality Lab',
    targetRoute: '/retrieval',
    focusMessage: 'Open Retrieval Lab: Query sandbox comparing Dense Vector vs BM25 vs Cross-Encoder Reranking.',
    presenterNotes: [
      'Show the Evidence Table with product, policy, qualification, FAQ, and objection queries.',
      'Highlight deliberate edge cases and show how composite rerank scoring resolved them.',
      'Show the green "Correctly Refused" no-answer queries that fail-closed.'
    ],
    keyArtifactToHighlight: 'Evidence Table & Score Breakdown'
  },
  {
    id: 4,
    title: '4. Autonomous Voice Telephony Studio',
    targetRoute: '/agent',
    focusMessage: 'Open Voice Studio: Interactive browser telephony simulator with real-time checklist and CRM payloads.',
    presenterNotes: [
      'Trigger "Start Inbound Call" to observe the live audio waveform and dual-lane streaming transcript.',
      'Show the Sentence Gate visualizer strips validating claims before speech output.',
      'Inspect the live qualification checklist automatically extracting structured parameters.'
    ],
    keyArtifactToHighlight: 'Live Telephony Simulator & Sentence Gate'
  },
  {
    id: 5,
    title: '5. Native Multilingual Localization',
    targetRoute: '/markets',
    focusMessage: 'Open Market Packs: 3-pane localization workbench (Neutral intent vs Literal translation vs Localized final).',
    presenterNotes: [
      'Switch between Philippines (Taglish) and Indonesia (Multifinance).',
      'Walk through the 3-pane workbench showing why literal translation fails and how cultural honorifics work.',
      'Inspect the Register Dial and Language Lock indicator.'
    ],
    keyArtifactToHighlight: '3-Pane Contrast & Register Dial'
  },
  {
    id: 6,
    title: '6. Live Agent Copilot & Nudge Court',
    targetRoute: '/live',
    focusMessage: 'Open Live Copilot: Real-time insights, prioritized nudges, and false-positive suppression court.',
    presenterNotes: [
      'Switch across the 4 scenarios (Cross-sell, Skipped disclosure, Frustration, Ambient noise).',
      'Demonstrate the Suppression Court explaining why filtered alerts were rejected to eliminate alert fatigue.',
      'Review the bottom dock Latency Waterfall proving sub-second execution.'
    ],
    keyArtifactToHighlight: 'Suppression Court & Latency Waterfall'
  },
  {
    id: 7,
    title: '7. System Benchmarks & Architecture',
    targetRoute: '/evaluation',
    focusMessage: 'Open Evaluation Suite: Adversarial red-team defenses and 10x concurrency load stress testing.',
    presenterNotes: [
      'Review the adversarial red-team test suite (100% fail-closed defense rate).',
      'Inspect the Nudge Confusion Matrix (81.2% precision, 94.2% suppression accuracy).',
      'Conclude on the Architecture topology diagram showing multi-lane pipeline design.'
    ],
    keyArtifactToHighlight: 'Red-Team Matrix & Architecture Topology'
  }
];

export const DemoStory: React.FC = () => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const navigate = useNavigate();

  const step = demoSteps[currentStepIdx];

  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleNext = () => {
    if (currentStepIdx < demoSteps.length - 1) {
      setCurrentStepIdx((idx) => idx + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx((idx) => idx - 1);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none text-xs">
      {/* Header */}
      <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
              Walkthrough Runbook
            </span>
            <span className="text-xs text-slate-400">
              Step {currentStepIdx + 1} of {demoSteps.length} · Guided Product Tour
            </span>
          </div>
          <h1 className="font-heading text-xl lg:text-2xl font-bold text-white tracking-tight">
            Product Walkthrough & Rehearsal Flow
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Standard operating demonstration sequence for executive reviews, architecture evaluations, and live customer demos.
          </p>
        </div>

        {/* Floating Timer Pill */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#141C30] border border-[#1F293D] rounded-xl flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">Rehearsal:</span>
            <span className="text-white font-mono font-semibold text-sm">{formatTimer(elapsedSec)}</span>
          </div>
          <button
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className="p-3 bg-[#141C30] hover:bg-[#1A2540] text-slate-300 hover:text-white border border-[#1F293D] rounded-xl transition-colors"
            title={isTimerRunning ? 'Pause Timer' : 'Resume Timer'}
          >
            {isTimerRunning ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      {/* Main Stepper Card */}
      <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 lg:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1F293D]">
          <div>
            <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">
              Step {step.id} of {demoSteps.length}
            </span>
            <h2 className="font-heading text-xl font-bold text-white mt-1">
              {step.title}
            </h2>
          </div>

          <button
            onClick={() => navigate(step.targetRoute)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all self-start sm:self-auto"
          >
            <span>Jump to Live Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Focus Statement */}
        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs">
          <span className="text-indigo-400 font-semibold block mb-1">Demonstration Narrative:</span>
          <p className="text-white text-sm font-medium leading-relaxed font-sans">
            "{step.focusMessage}"
          </p>
        </div>

        {/* Presenter Talking Points */}
        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Key Talking Points & Evidence
          </span>
          <div className="space-y-2.5">
            {step.presenterNotes.map((note, idx) => (
              <div
                key={idx}
                className="p-4 bg-[#141C30] border border-[#1F293D] rounded-xl flex items-start gap-3"
              >
                <span className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  ✓
                </span>
                <p className="text-slate-200 text-xs leading-relaxed font-sans">
                  {note}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Highlight Artifact */}
        <div className="p-4 bg-[#141C30] border border-[#1F293D] rounded-xl flex items-center justify-between text-xs">
          <span className="text-slate-400">Featured Operational Artifact:</span>
          <span className="text-emerald-400 font-semibold font-mono">{step.keyArtifactToHighlight}</span>
        </div>

        {/* Navigation Buttons */}
        <div className="pt-4 border-t border-[#1F293D] flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStepIdx === 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium border transition-all ${
              currentStepIdx === 0
                ? 'opacity-40 cursor-not-allowed border-[#1F293D] text-slate-500'
                : 'bg-[#141C30] hover:bg-[#1A2540] text-slate-200 border-[#1F293D]'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Step</span>
          </button>

          <div className="flex items-center gap-1.5">
            {demoSteps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStepIdx(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === currentStepIdx
                    ? 'w-7 bg-indigo-500'
                    : 'bg-[#1F293D] hover:bg-slate-500'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={currentStepIdx === demoSteps.length - 1}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentStepIdx === demoSteps.length - 1
                ? 'opacity-40 cursor-not-allowed bg-[#141C30] border border-[#1F293D] text-slate-500'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
            }`}
          >
            <span>Next Step</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
