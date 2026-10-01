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
  FileText
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
    title: '1. Executive Overview & Thesis',
    targetRoute: '/',
    focusMessage: 'Open Mission Control: "Every claim has a receipt, and every unnecessary alert is suppressed with a reason."',
    presenterNotes: [
      'Point out the 4 completed deliverables cards (Q1 Voice Agent, Q2 Knowledge Base, Q3 Native-Language Bots, Q4 Live Nudge Engine).',
      'Show the live latency telemetry strip (1,087ms P95 end-to-end against 2.5s budget).',
      'Highlight the "I Don\'t Know" ledger demonstrating refusals as an engineering victory.'
    ],
    keyArtifactToHighlight: 'Deliverable Cards & Refusal Ledger'
  },
  {
    id: 2,
    title: '2. Traceable Knowledge Base (Q2)',
    targetRoute: '/kb',
    focusMessage: 'Open KB Studio: Walk through Ingestion → Cleaning Diff → PII Vault → Records DAG.',
    presenterNotes: [
      'Show Cleaning Diff tab: point out the resolved conflict (15-day marketing flyer vs 30-day statutory policy PDF).',
      'Show PII Shield: demonstrate 0 raw leaks across 412 chunks, with all phone numbers and IDs masked to tokens.',
      'Click a record row to open the provenance Lineage DAG.'
    ],
    keyArtifactToHighlight: 'Cleaning Diff & PII Zero-Leak Gate'
  },
  {
    id: 3,
    title: '3. Retrieval Evidence Table (Q2)',
    targetRoute: '/retrieval',
    focusMessage: 'Open Retrieval Lab: 12 pre-loaded queries with Dense vs Sparse vs Hybrid + Reranker.',
    presenterNotes: [
      'Show the Evidence Table with product, policy, qualification, FAQ, and objection queries.',
      'Highlight the 2 deliberate failure cases and explain how they were diagnosed and fixed in v1.2/v1.3.',
      'Show the green "Correctly refused" no-answer queries that fail-closed.'
    ],
    keyArtifactToHighlight: 'Evidence Table & Score Breakdown'
  },
  {
    id: 4,
    title: '4. Voice Agent & Test Call (Q1)',
    targetRoute: '/agent',
    focusMessage: 'Open Voice Agent Studio: Browser test call simulator with real-time checklist and CRM lead payload.',
    presenterNotes: [
      'Trigger "Start Simulated Inbound Call" to see the live audio waveform and dual-lane streaming transcript.',
      'Show the Sentence Gate visualizer strips (Draft → Verified → Spoken).',
      'Point out the Qualification Checklist ticking off identity, status, due date, intent, and payment channel.'
    ],
    keyArtifactToHighlight: 'Live Calling Simulator & Sentence Gate'
  },
  {
    id: 5,
    title: '5. Native-Language Bots (Q3)',
    targetRoute: '/markets',
    focusMessage: 'Open Market Packs: 3-pane localization workbench (Neutral intent vs English literal vs Localized final).',
    presenterNotes: [
      'Switch between Philippines (Taglish) and Indonesia (Multifinance).',
      'Walk through the 3-pane workbench showing why literal translation fails and how cultural softeners work.',
      'Show the Register Dial and Language Lock indicator.'
    ],
    keyArtifactToHighlight: '3-Pane Contrast & Register Dial'
  },
  {
    id: 6,
    title: '6. Live Nudge Cockpit (Q4 HERO)',
    targetRoute: '/live',
    focusMessage: 'Open Live Cockpit: Real-time insights, active nudge cards, and the Nudge Court suppression engine.',
    presenterNotes: [
      'Switch between the 4 scripted scenarios (Cross-sell, Skipped disclosure, Frustration, Noisy call).',
      'Show the Nudge Court displaying suppressed low-value alerts with explicit reasons.',
      'Review the bottom dock Latency Waterfall proving sub-2.5s execution budget.'
    ],
    keyArtifactToHighlight: 'Nudge Court & Latency Waterfall'
  },
  {
    id: 7,
    title: '7. Honest Evaluation & Architecture',
    targetRoute: '/evaluation',
    focusMessage: 'Open Evaluation Suite: Adversarial red-team defenses and 10x concurrency load stress testing.',
    presenterNotes: [
      'Review the red-team hallucination bait tests (5 of 5 blocked).',
      'Inspect the Nudge Confusion Matrix (81.2% precision, 94.2% suppression accuracy).',
      'Conclude on the Architecture page showing the multi-lane topology and component tradeoffs.'
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

  // Floating rehearsal timer
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto select-none font-mono text-xs">
      {/* Header */}
      <div className="bg-[#121821] border border-[#243041] rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 bg-[#18212D] text-[#3DDC97] border border-[#243041] rounded font-semibold">
              PRESENTATION RUNBOOK
            </span>
            <span className="text-xs text-[#8A97A8]">
              Step {currentStepIdx + 1} of {demoSteps.length} · Guided Walkthrough Order
            </span>
          </div>
          <h1 className="font-heading text-xl font-bold text-[#E6EDF5] mt-1">
            Demo Mode & Video Presentation Story
          </h1>
          <p className="text-xs text-[#8A97A8] font-sans">
            Follow the cue cards below to record a seamless, high-confidence video walkthrough.
          </p>
        </div>

        {/* Floating Timer */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#0B0F14] border border-[#243041] rounded flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#4CC9F0]" />
            <span className="text-[#8A97A8]">Rehearsal Timer:</span>
            <span className="text-[#E6EDF5] font-bold text-sm">{formatTimer(elapsedSec)}</span>
          </div>
          <button
            onClick={() => setElapsedSec(0)}
            className="px-2 py-1.5 bg-[#18212D] hover:bg-[#243041] text-[#8A97A8] border border-[#243041] rounded text-[11px]"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main Cue Card */}
      <div className="bg-[#121821] border border-[#3DDC97]/60 rounded-lg p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#243041] pb-3">
          <div>
            <span className="text-[10px] text-[#3DDC97] font-bold uppercase tracking-wider">
              PRESENTATION STEP {step.id} OF {demoSteps.length}
            </span>
            <h2 className="font-heading text-lg font-bold text-[#E6EDF5] mt-0.5">
              {step.title}
            </h2>
          </div>

          <button
            onClick={() => navigate(step.targetRoute)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#13221C] hover:bg-[#1A3328] text-[#3DDC97] border border-[#3DDC97]/60 rounded font-semibold text-xs transition-colors"
          >
            <span>Jump to Surface ({step.targetRoute})</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Target Message */}
        <div className="p-3.5 bg-[#0B0F14] border border-[#243041] rounded text-sm text-[#4CC9F0] font-sans font-medium">
          {step.focusMessage}
        </div>

        {/* Presenter Speaking Notes */}
        <div className="space-y-2">
          <div className="text-[11px] text-[#8A97A8] uppercase font-semibold">
            On-Screen Talking Points (Say This Clearly):
          </div>
          <ul className="space-y-2">
            {step.presenterNotes.map((note, i) => (
              <li key={i} className="p-3 bg-[#18212D] border border-[#243041] rounded text-xs font-sans text-[#E6EDF5] flex items-start gap-2">
                <span className="w-4 h-4 rounded bg-[#0B0F14] border border-[#243041] text-[#3DDC97] flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Key Artifact to Point at */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#8A97A8]">Key Artifact to Highlight:</span>
          <span className="px-2 py-0.5 bg-[#13221C] text-[#3DDC97] border border-[#3DDC97]/40 rounded font-semibold">
            {step.keyArtifactToHighlight}
          </span>
        </div>

        {/* Stepper Navigation Buttons */}
        <div className="pt-4 border-t border-[#243041] flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStepIdx === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#18212D] hover:bg-[#243041] disabled:opacity-40 text-[#E6EDF5] border border-[#243041] rounded font-semibold transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous Cue Card
          </button>

          <button
            onClick={handleNext}
            disabled={currentStepIdx === demoSteps.length - 1}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#13221C] hover:bg-[#1A3328] disabled:opacity-40 text-[#3DDC97] border border-[#3DDC97]/60 rounded font-semibold transition-colors"
          >
            <span>Next Cue Card</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
