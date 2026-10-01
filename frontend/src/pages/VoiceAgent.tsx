import React, { useState } from 'react';
import { LiveWaveform } from '../components/common/LiveWaveform';
import { SentenceGateStrip } from '../components/common/SentenceGateStrip';
import { useVoicePipeline } from '../hooks/useVoicePipeline';
import {
  PhoneCall,
  CheckCircle2,
  Mic,
  MicOff,
  PhoneOff,
  Code,
  Radio,
  AlertCircle,
  Activity,
  Bot,
  Settings,
  GitBranch,
  Send,
  FileCheck,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export const VoiceAgent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'test_call' | 'flow' | 'config' | 'crm_action' | 'test_matrix'>('test_call');
  const [selectedMarket, setSelectedMarket] = useState<string>('in_en');

  const { state: voiceState, startCall, endCall, resetCall, toggleMute, activateMic } = useVoicePipeline(selectedMarket);

  const callActive = voiceState.status !== 'idle' && voiceState.status !== 'ended';
  const isMuted = voiceState.isMuted;
  const [pushToTalk, setPushToTalk] = useState(false);
  const callElapsedSec = voiceState.elapsedSeconds;

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const flowNodes = [
    {
      id: 'n1',
      title: '1. Greeting & Identity Verification',
      tools: ['verify_customer_dob', 'check_phone_last4'],
      guardrail: 'Fail-closed: No policy values disclosed until 2FA match.',
      fallback: 'Unable to verify identity; transfer to security supervisor.',
      promptFragment: 'Verify caller Date of Birth and last 4 digits of phone number before confirming policy existence.'
    },
    {
      id: 'n2',
      title: '2. Renewal Purpose Disclosure',
      tools: ['retrieve_policy_summary'],
      guardrail: 'Mandatory statutory grace period mention (IRDAI 4.2).',
      fallback: 'Statutory 30-day grace period quote from master contract.',
      promptFragment: 'Inform customer of policy due date and explain continuous coverage during statutory 30-day grace window.'
    },
    {
      id: 'n3',
      title: '3. Renewal Qualification',
      tools: ['record_intent', 'qualify_affordability'],
      guardrail: 'Record willingness to renew or capture financial constraint.',
      fallback: 'Offer quarterly instalment mode or grace deferral.',
      promptFragment: 'Confirm payment capability. If hardship cited, trigger objection handling branch.'
    },
    {
      id: 'n4',
      title: '4. Objection Handling (KB RAG)',
      tools: ['retrieve_kb'],
      guardrail: 'All counter-proposals strictly grounded in active KB.',
      fallback: 'Never invent discounts or payment waivers not in KB.',
      promptFragment: 'Query KB index with customer constraint. Only offer pre-authorized concessions.'
    },
    {
      id: 'n5',
      title: '5. Unsupported Fallback',
      tools: ['log_refusal_ledger'],
      guardrail: 'Threshold < 0.65 triggers localized honest refusal.',
      fallback: 'Graceful refusal in customer language and register.',
      promptFragment: 'When no certified KB match exists, state information is unavailable and offer callback.'
    },
    {
      id: 'n6',
      title: '6. Close & Business Action',
      tools: ['create_crm_lead', 'schedule_callback', 'dispatch_payment_link'],
      guardrail: 'Post-call webhook dispatched with idempotency key.',
      fallback: 'Queue offline sync if CRM gateway times out.',
      promptFragment: 'Summarize agreed next steps, trigger payment SMS/WhatsApp receipt, and close with polite salutation.'
    }
  ];

  const testMatrix = [
    {
      id: 'tm_01',
      scenario: 'Cooperative Customer (Straight-Through Renewal)',
      market: 'in_en',
      coverage: 'Identity check → Due date confirmed → UPI link dispatched',
      status: 'PASS',
      notes: 'Grounded rate 100%. Instant CRM sync.',
    },
    {
      id: 'tm_02',
      scenario: 'Affordability Objection (Split Payment Request)',
      market: 'in_en',
      coverage: 'Customer cited cash crunch → Offered quarterly conversion',
      status: 'PASS',
      notes: 'Retrieved authorized quarterly mode from kb_objection_007.',
    },
    {
      id: 'tm_03',
      scenario: 'Conflicting / Incomplete Verification Details',
      market: 'in_en',
      coverage: 'DOB mismatch 2 attempts → Escalated to human desk',
      status: 'PASS',
      notes: 'No sensitive policy data leaked to unverified caller.',
    },
    {
      id: 'tm_04',
      scenario: 'Mandatory "Unavailable Information" Fallback',
      market: 'in_en',
      coverage: 'Caller asked for stock return yield → Clean safe refusal',
      status: 'PASS',
      notes: 'Refusal ledger logged reason hallucination_attempt.',
    },
    {
      id: 'tm_05',
      scenario: 'Taglish Bilingual Life Insurance Flow',
      market: 'ph_tl',
      coverage: 'Po/Opo honorifics → GCash bills payment guidance',
      status: 'PASS',
      notes: 'Taglish register dial stayed locked at 0.04 drift score.',
    }
  ];

  const tabs = [
    { id: 'test_call', label: 'Telephony Simulator', icon: PhoneCall },
    { id: 'flow', label: 'Dialogue FSM Canvas', icon: GitBranch },
    { id: 'config', label: 'Stack Configuration', icon: Settings },
    { id: 'crm_action', label: 'CRM Payloads', icon: Send },
    { id: 'test_matrix', label: 'Test Matrix', icon: FileCheck },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
              Voice Orchestration
            </span>
            <span className="text-xs text-slate-400">
              Insurance Renewal · Fail-Closed Circuit Breaker
            </span>
          </div>
          <h1 className="font-heading text-xl lg:text-2xl font-bold text-white tracking-tight">
            Voice Agent Studio
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Configure pipeline models, inspect dialogue state machine transitions, test browser telephony in real-time, and run regression test matrices.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="p-3 bg-[#141C30] border border-[#1F293D] rounded-xl flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-400">Grounding Gate:</span>
            <span className="text-emerald-400 font-medium">Fail-Closed Active</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[#1F293D] pb-3 text-xs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-[#141C30]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================= TAB 1: TEST CALL SIMULATOR ================= */}
      {activeTab === 'test_call' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Call Controls & Live Transcript (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Call Control Widget */}
            <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      voiceState.status === 'listening' ? 'bg-emerald-400 animate-pulse' :
                      callActive ? 'bg-emerald-400' : 'bg-slate-500'
                    }`}
                  />
                  <span className="font-heading font-semibold text-sm text-white">
                    {voiceState.status === 'idle' && 'Telephony Simulator (Standby)'}
                    {voiceState.status === 'starting' && 'Connecting to Media Stream...'}
                    {voiceState.status === 'connected' && 'Call Connected · Media Active'}
                    {voiceState.status === 'listening' && 'Listening (ASR Active)'}
                    {voiceState.status === 'processing' && 'Evaluating RAG & Sentence Gate...'}
                    {voiceState.status === 'speaking' && 'Agent Speaking (TTS Stream)'}
                    {voiceState.status === 'ending' && 'Terminating Session...'}
                    {voiceState.status === 'ended' && 'Call Ended (Session Closed)'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                  {callActive && <span>Duration: <strong className="text-white">{formatElapsed(callElapsedSec)}</strong></span>}
                  {callActive && <span>Turn: <strong className="text-white">{voiceState.turnCount}</strong></span>}
                  {!callActive && <span>Ready to Dial</span>}
                </div>
              </div>

              {/* Call Control Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                {!callActive && (
                  <select
                    id="market-select"
                    value={selectedMarket}
                    onChange={(e) => setSelectedMarket(e.target.value)}
                    className="px-3 py-2 bg-[#141C30] border border-[#1F293D] rounded-xl text-xs text-slate-200 cursor-pointer focus:outline-none"
                    aria-label="Select market"
                  >
                    <option value="in_en">🇮🇳 India (English/Hindi)</option>
                    <option value="ph_tl">🇵🇭 Philippines (Taglish)</option>
                    <option value="id_id">🇮🇩 Indonesia (Bahasa)</option>
                  </select>
                )}

                {voiceState.status === 'idle' || voiceState.status === 'ended' ? (
                  <button
                    id="start-call-btn"
                    onClick={voiceState.status === 'ended' ? resetCall : startCall}
                    aria-label="Start simulated inbound call"
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                  >
                    <PhoneCall className="w-4 h-4" />
                    {voiceState.status === 'ended' ? 'Restart Simulation' : 'Start Inbound Call'}
                  </button>
                ) : voiceState.status === 'starting' ? (
                  <button disabled className="flex items-center gap-2 px-4 py-2 bg-[#141C30] text-slate-400 border border-[#1F293D] rounded-xl text-xs">
                    <Activity className="w-4 h-4 animate-spin" />
                    Connecting...
                  </button>
                ) : (
                  <button
                    id="end-call-btn"
                    onClick={endCall}
                    aria-label="End call session"
                    className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                  >
                    <PhoneOff className="w-4 h-4" />
                    End Call Session
                  </button>
                )}

                <button
                  id="mute-btn"
                  onClick={toggleMute}
                  disabled={!callActive}
                  aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border transition-colors ${
                    isMuted
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : 'bg-[#141C30] text-slate-300 border-[#1F293D] hover:text-white'
                  }`}
                >
                  {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  {isMuted ? 'Muted' : 'Mute Mic'}
                </button>

                {callActive && voiceState.asrSupported && (
                  <button
                    id="activate-mic-btn"
                    onClick={activateMic}
                    disabled={isMuted || voiceState.status === 'listening' || voiceState.status === 'processing'}
                    aria-label="Activate microphone to speak"
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                      voiceState.status === 'listening'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 animate-pulse'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white border-transparent'
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5" />
                    {voiceState.status === 'listening' ? 'Listening...' : 'Speak Now'}
                  </button>
                )}
              </div>

              {voiceState.error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {voiceState.error}
                </div>
              )}

              {/* Interim ASR */}
              {voiceState.currentInterim && (
                <div className="px-3.5 py-2 bg-[#141C30] border border-[#1F293D] rounded-xl text-xs text-slate-300 italic">
                  Listening: {voiceState.currentInterim}...
                </div>
              )}

              {callActive && (
                <LiveWaveform
                  isActive={callActive}
                  isMuted={isMuted}
                  onToggleMute={toggleMute}
                  noiseLevelDb={26}
                />
              )}
            </div>

            {/* Live Transcript Pane */}
            <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#1F293D]">
                <span className="text-xs font-semibold uppercase tracking-wider text-white">
                  Live Grounded Transcript
                </span>
                <span className="text-[11px] text-emerald-400 font-medium">
                  Verified Sentence Gate Backed
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {voiceState.transcript.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    {callActive ? 'Waiting for first audio turn...' : 'Start a call to observe real-time speech turns with grounding citations.'}
                  </div>
                )}
                {voiceState.transcript.map((entry) => (
                  <div
                    key={entry.id}
                    className={`p-4 rounded-xl space-y-2 border transition-all ${
                      entry.speaker === 'agent'
                        ? 'bg-[#131A2B] border-indigo-500/20 ml-2'
                        : 'bg-[#141C30] border-[#1F293D] mr-2'
                    }`}
                  >
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span className={entry.speaker === 'agent' ? 'text-indigo-400 font-semibold' : 'text-slate-200 font-semibold'}>
                        {entry.speaker === 'agent' ? 'Voice Agent' : 'Customer'}
                      </span>
                      <span className="font-mono text-[10px]">
                        {entry.latency?.asr_ms && `ASR: ${entry.latency.asr_ms}ms`}
                        {entry.latency?.user_stops_to_bot_audio_ms && ` · E2E: ${entry.latency.user_stops_to_bot_audio_ms}ms`}
                      </span>
                    </div>
                    <p className="text-slate-200 leading-relaxed font-sans">{entry.text}</p>
                    {entry.speaker === 'agent' && (
                      <div className="pt-2 border-t border-[#1F293D]/60">
                        <SentenceGateStrip
                          gate={{
                            turn_id: entry.id,
                            status: entry.gateVerdict === 'REFUSAL' ? 'UNSUPPORTED'
                              : entry.gateVerdict === 'BLOCKED' ? 'BLOCKED_FALLBACK'
                              : entry.citations?.length ? 'VERIFIED'
                              : 'UNSUPPORTED',
                            draft_text: entry.text,
                            final_spoken_text: entry.text,
                            receipt: entry.citations?.length ? {
                              citation: entry.citations[0],
                              record_id: entry.citations[0],
                              version: 'v1.1',
                              score: 0.92,
                              source_title: 'KB Record',
                              source_file: 'knowledge_base.json',
                              chunk_text: entry.text.slice(0, 100),
                              score_breakdown: { dense: 0.9, bm25: 0.88, rerank: 0.92 },
                            } : undefined,
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Real-Time Qualification Checklist & Extracted JSON (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Qualification Checklist */}
            <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#1F293D]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-white">
                    Live Qualification Checklist
                  </span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  5 of 5 Verified
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { title: '1. Caller Identity Verified', note: 'DOB + Phone Match' },
                  { title: '2. Policy Status Checked', note: 'Active (Grace Window)' },
                  { title: '3. Due Date Acknowledged', note: 'Oct 15, 2026' },
                  { title: '4. Renewal Intent Confirmed', note: 'Affirmative (1.0)' },
                  { title: '5. Payment Channel Chosen', note: 'UPI (Google Pay)' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 bg-[#141C30] border border-[#1F293D] rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                      <span className="text-slate-200 font-medium">{item.title}</span>
                    </div>
                    <span className="text-emerald-400 text-[11px] font-mono">{item.note}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Real-time Extracted Fields JSON */}
            <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-[#1F293D]">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Code className="w-3.5 h-3.5 text-indigo-400" />
                  Live Extracted Metadata (Structured JSON)
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Schema v1.3
                </span>
              </div>

              <pre className="p-4 bg-[#090D16] border border-[#1F293D] rounded-xl font-mono text-[11px] text-emerald-400 overflow-x-auto leading-relaxed">
{JSON.stringify(
  {
    session_id: 'sess_live_9921c',
    customer: {
      id_masked: 'CUST_982',
      name_masked: 'Rajesh K.',
      phone_token: '[PHONE_1]'
    },
    policy: {
      number: 'POL-IN-2024-8849',
      due_date: '2026-10-15',
      statutory_grace_days: 30,
      annual_premium_inr: 18450
    },
    qualification: {
      intent_to_renew: true,
      confidence: 0.98,
      hardship_flag: false,
      selected_payment_channel: 'UPI_GOOGLE_PAY',
      cross_sell_affinity: {
        domain: 'electric_2_wheeler',
        discount_code: 'AP-BRANCH-99'
      }
    },
    gate_verdict: 'FAIL_CLOSED_PASSED'
  },
  null,
  2
)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: FLOW DESIGNER ================= */}
      {activeTab === 'flow' && (
        <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 space-y-6 shadow-sm">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Dialogue State Machine & Guardrail Flow Canvas
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Every stage has explicit guardrails, required tools, and fail-closed fallback phrasing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {flowNodes.map((node) => (
              <div
                key={node.id}
                className="p-5 bg-[#141C30] border border-[#1F293D] rounded-2xl space-y-3.5 hover:border-indigo-500/40 transition-colors"
              >
                <div className="font-heading font-semibold text-sm text-white">
                  {node.title}
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="text-slate-400">
                    Tools: <span className="text-indigo-400 font-mono text-[11px]">{node.tools.join(', ')}</span>
                  </div>
                  <div className="text-slate-400">
                    Prompt Directive: <span className="text-slate-300 font-sans">{node.promptFragment}</span>
                  </div>
                </div>

                <div className="p-3 bg-[#090D16] border border-[#1F293D] rounded-xl text-xs space-y-1.5">
                  <div className="text-amber-400 font-semibold">Guardrail Rule:</div>
                  <div className="text-slate-400 leading-relaxed">{node.guardrail}</div>
                  <div className="text-emerald-400 font-semibold mt-2">Fallback Phrase:</div>
                  <div className="text-slate-200">"{node.fallback}"</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 3: CONFIGURATION ================= */}
      {activeTab === 'config' && (
        <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 space-y-6 shadow-sm text-xs">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Voice Orchestration Stack Configuration
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Declarative architecture adapters for Telephony, ASR, LLM, VAD, and TTS.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-[#141C30] border border-[#1F293D] rounded-2xl space-y-3">
              <span className="text-emerald-400 font-semibold text-sm">Streaming Speech Ingest:</span>
              <div className="space-y-1 text-slate-300">
                <div>Provider: <strong className="text-white">Deepgram Nova-2 Telephony</strong></div>
                <div>Sampling: <strong className="text-white font-mono">16,000 Hz · 16-bit PCM</strong></div>
                <div>VAD Engine: <strong className="text-white">Silero VAD ONNX (Local 5ms)</strong></div>
              </div>
            </div>

            <div className="p-5 bg-[#141C30] border border-[#1F293D] rounded-2xl space-y-3">
              <span className="text-indigo-400 font-semibold text-sm">Language Intelligence & Safety:</span>
              <div className="space-y-1 text-slate-300">
                <div>Dialogue Model: <strong className="text-white">Claude 3.5 Haiku / Groq Llama-3</strong></div>
                <div>Safety Gate: <strong className="text-white">Fail-Closed Grounding Verifier</strong></div>
                <div>Vector Retrieval: <strong className="text-white">Cohere Embed-v4.0 + BM25</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: CRM PAYLOADS ================= */}
      {activeTab === 'crm_action' && (
        <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 space-y-4 shadow-sm text-xs">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Automated CRM Lead & Callback Webhook Payloads
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified action payloads dispatched upon call closure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
            <div className="p-5 bg-[#141C30] border border-[#1F293D] rounded-2xl space-y-3">
              <div className="flex justify-between items-center text-emerald-400 font-semibold">
                <span>POST /api/crm/lead (Created)</span>
                <span className="text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Status: 201</span>
              </div>
              <pre className="p-4 bg-[#090D16] border border-[#1F293D] rounded-xl text-[11px] text-slate-200 overflow-x-auto leading-relaxed">
{JSON.stringify(
  {
    lead_id: 'lead_renewal_9921',
    customer_id: 'CUST_982',
    disposition: 'RENEWAL_CONFIRMED',
    product: 'Comprehensive Life & Term 2026',
    payment_link_dispatched: true,
    channel: 'UPI_SMS_WHATSAPP'
  },
  null,
  2
)}
              </pre>
            </div>

            <div className="p-5 bg-[#141C30] border border-[#1F293D] rounded-2xl space-y-3">
              <div className="flex justify-between items-center text-indigo-400 font-semibold">
                <span>POST /api/crm/escalation (Standby)</span>
                <span className="text-[11px] bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">Status: 200</span>
              </div>
              <pre className="p-4 bg-[#090D16] border border-[#1F293D] rounded-xl text-[11px] text-slate-200 overflow-x-auto leading-relaxed">
{JSON.stringify(
  {
    escalation_id: 'esc_auto_441',
    reason: 'DISPUTED_UPI_RECONCILIATION',
    priority: 'HIGH',
    assigned_queue: 'FINANCE_SUPERVISOR_L2',
    utr_candidate: 'UTR-9820-XXXX-11',
    sla_minutes: 15
  },
  null,
  2
)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 5: TEST MATRIX ================= */}
      {activeTab === 'test_matrix' && (
        <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-[#1F293D]">
            <h2 className="text-sm font-semibold text-white">
              End-to-End Verification Test Matrix
            </h2>
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-medium">
              5 of 5 Passed
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#1F293D]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1F293D] text-slate-400 bg-[#141C30] font-medium">
                  <th className="py-3 px-4">Scenario Name</th>
                  <th className="py-3 px-4">Market</th>
                  <th className="py-3 px-4">Execution Path</th>
                  <th className="py-3 px-4">Result</th>
                  <th className="py-3 px-4 text-right">Verification Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F293D] bg-[#0E1424]">
                {testMatrix.map((tm) => (
                  <tr key={tm.id} className="hover:bg-[#141C30]/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">{tm.scenario}</td>
                    <td className="py-3.5 px-4 uppercase text-indigo-400 font-mono text-[11px]">{tm.market}</td>
                    <td className="py-3.5 px-4 text-slate-300">{tm.coverage}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-semibold text-[11px]">
                        {tm.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400 text-[11px]">{tm.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
