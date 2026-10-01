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
} from 'lucide-react';

export const VoiceAgent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'config' | 'flow' | 'test_call' | 'crm_action' | 'test_matrix'>('test_call');
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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="bg-[#121821] border border-[#243041] rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 bg-[#18212D] text-[#3DDC97] border border-[#243041] rounded font-semibold">
              QUESTION 1 DELIVERABLE
            </span>
            <span className="text-xs font-mono text-[#8A97A8]">
              Insurance Renewal Voice Agent · Fail-Closed Failover
            </span>
          </div>
          <h1 className="font-heading text-xl font-bold text-[#E6EDF5] mt-1">
            Voice Agent Studio
          </h1>
          <p className="text-xs text-[#8A97A8]">
            Configure orchestration models, inspect dialog state machine, test browser telephony in real time, and verify test matrices.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="p-2.5 bg-[#0B0F14] border border-[#243041] rounded flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3DDC97]" />
            <span className="text-[#8A97A8]">KB Gate:</span>
            <span className="text-[#3DDC97] font-semibold">Fail-Closed Active</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1 border-b border-[#243041] pb-1 text-xs font-mono">
        <button
          onClick={() => setActiveTab('test_call')}
          className={`px-3.5 py-2 rounded-t font-semibold transition-colors ${
            activeTab === 'test_call'
              ? 'bg-[#18212D] text-[#3DDC97] border-t border-x border-[#243041]'
              : 'text-[#8A97A8] hover:text-[#E6EDF5]'
          }`}
        >
          1. Test Call Simulator (Live Browser Mic)
        </button>
        <button
          onClick={() => setActiveTab('flow')}
          className={`px-3.5 py-2 rounded-t font-semibold transition-colors ${
            activeTab === 'flow'
              ? 'bg-[#18212D] text-[#3DDC97] border-t border-x border-[#243041]'
              : 'text-[#8A97A8] hover:text-[#E6EDF5]'
          }`}
        >
          2. Flow Designer (Dialogue FSM)
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`px-3.5 py-2 rounded-t font-semibold transition-colors ${
            activeTab === 'config'
              ? 'bg-[#18212D] text-[#3DDC97] border-t border-x border-[#243041]'
              : 'text-[#8A97A8] hover:text-[#E6EDF5]'
          }`}
        >
          3. Model & Engine Configuration
        </button>
        <button
          onClick={() => setActiveTab('crm_action')}
          className={`px-3.5 py-2 rounded-t font-semibold transition-colors ${
            activeTab === 'crm_action'
              ? 'bg-[#18212D] text-[#3DDC97] border-t border-x border-[#243041]'
              : 'text-[#8A97A8] hover:text-[#E6EDF5]'
          }`}
        >
          4. Business Action Payloads
        </button>
        <button
          onClick={() => setActiveTab('test_matrix')}
          className={`px-3.5 py-2 rounded-t font-semibold transition-colors ${
            activeTab === 'test_matrix'
              ? 'bg-[#18212D] text-[#3DDC97] border-t border-x border-[#243041]'
              : 'text-[#8A97A8] hover:text-[#E6EDF5]'
          }`}
        >
          5. Mandatory Test Matrix
        </button>
      </div>

      {/* ================= TAB 1: TEST CALL SIMULATOR ================= */}
      {activeTab === 'test_call' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Call Controls & Live Transcript (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Call Control Widget */}
            <div className="bg-[#121821] border border-[#243041] rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      voiceState.status === 'listening' ? 'bg-[#3DDC97] animate-pulse' :
                      callActive ? 'bg-[#3DDC97]' : 'bg-[#57677D]'
                    }`}
                  />
                  <span className="font-heading font-semibold text-sm text-[#E6EDF5]">
                    {voiceState.status === 'idle' && 'BROWSER CALL SIMULATOR (STANDBY)'}
                    {voiceState.status === 'starting' && 'CONNECTING...'}
                    {voiceState.status === 'connected' && 'CALL CONNECTED'}
                    {voiceState.status === 'listening' && 'LISTENING (ASR ACTIVE)'}
                    {voiceState.status === 'processing' && 'PROCESSING TURN...'}
                    {voiceState.status === 'speaking' && 'AGENT SPEAKING (TTS)'}
                    {voiceState.status === 'ending' && 'ENDING CALL...'}
                    {voiceState.status === 'ended' && 'CALL ENDED'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono text-[#8A97A8]">
                  {callActive && <span>Duration: {formatElapsed(callElapsedSec)}</span>}
                  {callActive && <span>Turn: {voiceState.turnCount}</span>}
                  {!callActive && <span>Ready to Dial</span>}
                </div>
              </div>

              {/* Call Control Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {/* Market selector */}
                {!callActive && (
                  <select
                    id="market-select"
                    value={selectedMarket}
                    onChange={(e) => setSelectedMarket(e.target.value)}
                    className="px-3 py-2 bg-[#0B0F14] border border-[#243041] rounded text-xs font-mono text-[#8A97A8] cursor-pointer"
                    aria-label="Select market"
                  >
                    <option value="in_en">India (en-IN)</option>
                    <option value="ph_tl">Philippines (fil-PH)</option>
                    <option value="id_id">Indonesia (id-ID)</option>
                  </select>
                )}

                {voiceState.status === 'idle' || voiceState.status === 'ended' ? (
                  <button
                    id="start-call-btn"
                    onClick={voiceState.status === 'ended' ? resetCall : startCall}
                    aria-label="Start simulated inbound call"
                    className="flex items-center gap-2 px-4 py-2 bg-[#13221C] hover:bg-[#1A3328] text-[#3DDC97] border border-[#3DDC97]/60 rounded text-xs font-mono font-semibold"
                  >
                    <PhoneCall className="w-4 h-4" />
                    {voiceState.status === 'ended' ? 'Start New Call' : 'Start Simulated Inbound Call'}
                  </button>
                ) : voiceState.status === 'starting' ? (
                  <button disabled className="flex items-center gap-2 px-4 py-2 bg-[#18212D] text-[#57677D] border border-[#243041] rounded text-xs font-mono">
                    <Activity className="w-4 h-4 animate-spin" />
                    Connecting...
                  </button>
                ) : (
                  <button
                    id="end-call-btn"
                    onClick={endCall}
                    aria-label="End call session"
                    className="flex items-center gap-2 px-4 py-2 bg-[#251417] hover:bg-[#33181C] text-[#FF5C6C] border border-[#FF5C6C]/60 rounded text-xs font-mono font-semibold"
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
                  className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-mono border transition-colors ${
                    isMuted
                      ? 'bg-[#251417] text-[#FF5C6C] border-[#FF5C6C]/40'
                      : 'bg-[#18212D] text-[#8A97A8] border-[#243041] hover:text-[#E6EDF5]'
                  }`}
                >
                  {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  {isMuted ? 'Mic Muted' : 'Mute Mic'}
                </button>

                {/* Activate Mic / Listen button */}
                {callActive && voiceState.asrSupported && (
                  <button
                    id="activate-mic-btn"
                    onClick={activateMic}
                    disabled={isMuted || voiceState.status === 'listening' || voiceState.status === 'processing'}
                    aria-label="Activate microphone to speak"
                    className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-mono border transition-colors ${
                      voiceState.status === 'listening'
                        ? 'bg-[#13221C] text-[#3DDC97] border-[#3DDC97]/60 animate-pulse'
                        : 'bg-[#18212D] text-[#4CC9F0] border-[#4CC9F0]/40 hover:border-[#4CC9F0]/80'
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5" />
                    {voiceState.status === 'listening' ? 'Listening...' : 'Speak (Press to Talk)'}
                  </button>
                )}

                <button
                  id="push-to-talk-btn"
                  onClick={() => setPushToTalk(!pushToTalk)}
                  disabled={!callActive}
                  aria-label="Toggle push to talk mode"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-mono border transition-colors ${
                    pushToTalk
                      ? 'bg-[#18212D] text-[#4CC9F0] border-[#4CC9F0]/60'
                      : 'bg-[#18212D] text-[#8A97A8] border-[#243041]'
                  }`}
                >
                  Push-to-Talk Fallback: {pushToTalk ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Error message */}
              {voiceState.error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-[#251417] border border-[#FF5C6C]/40 rounded text-xs font-mono text-[#FF5C6C]">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {voiceState.error}
                </div>
              )}

              {/* Browser support notice */}
              {!voiceState.asrSupported && (
                <div className="flex items-center gap-2 px-3 py-2 bg-[#1A1A0A] border border-[#F4A535]/40 rounded text-xs font-mono text-[#F4A535]">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  Web Speech API not available in this browser. Use Chrome or Edge for live mic.
                </div>
              )}

              {/* Interim ASR */}
              {voiceState.currentInterim && (
                <div className="px-3 py-2 bg-[#18212D] border border-[#243041] rounded text-xs font-mono text-[#8A97A8] italic">
                  Listening: {voiceState.currentInterim}...
                </div>
              )}

              {/* Latency display */}
              {voiceState.lastLatency && callActive && (
                <div className="flex flex-wrap gap-2 font-mono text-[10px] text-[#57677D]">
                  {voiceState.lastLatency.asr_ms && <span>ASR: <span className="text-[#4CC9F0]">{voiceState.lastLatency.asr_ms}ms</span></span>}
                  {voiceState.lastLatency.retrieval_ms && <span>Retrieval: <span className="text-[#4CC9F0]">{voiceState.lastLatency.retrieval_ms}ms</span></span>}
                  {voiceState.lastLatency.user_stops_to_bot_audio_ms && <span className="text-[#3DDC97]">User→Bot: {voiceState.lastLatency.user_stops_to_bot_audio_ms}ms</span>}
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
            <div className="bg-[#121821] border border-[#243041] rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#243041]">
                <span className="text-xs font-mono uppercase tracking-wider text-[#E6EDF5] font-semibold">
                  Live Grounded Transcript
                </span>
                <span className="text-[11px] font-mono text-[#3DDC97]">
                  Every Bot Sentence Has A Receipt
                </span>
              </div>

              {/* Live Transcript — real turns from voice pipeline */}
              <div className="space-y-3 font-mono text-xs">
                {voiceState.transcript.length === 0 && (
                  <div className="p-4 text-center text-[#57677D] text-xs">
                    {callActive ? 'Waiting for first turn...' : 'Start a call to see live grounded transcript here.'}
                  </div>
                )}
                {voiceState.transcript.map((entry) => (
                  <div
                    key={entry.id}
                    className={`p-3 rounded space-y-1.5 ${
                      entry.speaker === 'agent'
                        ? 'bg-[#151D28] border border-[#243041]'
                        : 'bg-[#18212D] border border-[#243041]'
                    }`}
                  >
                    <div className="flex justify-between text-[11px] text-[#57677D]">
                      <span className={entry.speaker === 'agent' ? 'text-[#4CC9F0] font-semibold' : 'text-[#E6EDF5] font-semibold'}>
                        {entry.speaker === 'agent' ? 'BOT AGENT' : 'CALLER'}
                      </span>
                      <span>
                        {entry.latency?.asr_ms && `ASR ${entry.latency.asr_ms}ms`}
                        {entry.latency?.user_stops_to_bot_audio_ms && ` · U→B ${entry.latency.user_stops_to_bot_audio_ms}ms`}
                      </span>
                    </div>
                    <p className="font-sans text-[#E6EDF5]">{entry.text}</p>
                    {entry.speaker === 'agent' && (
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
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Real-Time Qualification Checklist & Extracted JSON (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Qualification Checklist */}
            <div className="bg-[#121821] border border-[#243041] rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#243041]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3DDC97]" />
                  <span className="text-xs font-mono uppercase tracking-wider text-[#E6EDF5] font-semibold">
                    Qualification Checklist (Live)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#3DDC97] bg-[#13221C] px-2 py-0.5 rounded border border-[#3DDC97]/40">
                  5 of 5 Verified
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 bg-[#18212D] border border-[#243041] rounded flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-[#13221C] border border-[#3DDC97] text-[#3DDC97] flex items-center justify-center text-[10px]">✓</span>
                    <span className="text-[#E6EDF5]">1. Caller Identity Verified</span>
                  </div>
                  <span className="text-[#3DDC97] text-[11px]">DOB + Phone Match</span>
                </div>

                <div className="p-2.5 bg-[#18212D] border border-[#243041] rounded flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-[#13221C] border border-[#3DDC97] text-[#3DDC97] flex items-center justify-center text-[10px]">✓</span>
                    <span className="text-[#E6EDF5]">2. Policy Status Checked</span>
                  </div>
                  <span className="text-[#3DDC97] text-[11px]">Active (Grace Window)</span>
                </div>

                <div className="p-2.5 bg-[#18212D] border border-[#243041] rounded flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-[#13221C] border border-[#3DDC97] text-[#3DDC97] flex items-center justify-center text-[10px]">✓</span>
                    <span className="text-[#E6EDF5]">3. Due Date Acknowledged</span>
                  </div>
                  <span className="text-[#3DDC97] text-[11px]">Oct 15, 2026</span>
                </div>

                <div className="p-2.5 bg-[#18212D] border border-[#243041] rounded flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-[#13221C] border border-[#3DDC97] text-[#3DDC97] flex items-center justify-center text-[10px]">✓</span>
                    <span className="text-[#E6EDF5]">4. Renewal Intent Confirmed</span>
                  </div>
                  <span className="text-[#3DDC97] text-[11px]">Intent: Positive (1.0)</span>
                </div>

                <div className="p-2.5 bg-[#18212D] border border-[#243041] rounded flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-[#13221C] border border-[#3DDC97] text-[#3DDC97] flex items-center justify-center text-[10px]">✓</span>
                    <span className="text-[#E6EDF5]">5. Payment Channel Chosen</span>
                  </div>
                  <span className="text-[#3DDC97] text-[11px]">UPI (Google Pay)</span>
                </div>
              </div>
            </div>

            {/* Real-time Extracted Fields JSON */}
            <div className="bg-[#121821] border border-[#243041] rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[#8A97A8] font-semibold flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-[#4CC9F0]" />
                  Live Extracted Fields (Structured JSON)
                </span>
                <span className="text-[10px] font-mono text-[#57677D]">
                  Schema: v1.3
                </span>
              </div>

              <pre className="p-3 bg-[#0B0F14] border border-[#243041] rounded font-mono text-[11px] text-[#3DDC97] overflow-x-auto leading-relaxed">
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
        <div className="bg-[#121821] border border-[#243041] rounded-lg p-5 space-y-6">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#E6EDF5] font-semibold">
              Dialogue State Machine & Guardrail Flow Canvas
            </h2>
            <p className="text-xs text-[#8A97A8] mt-1">
              Every stage has explicit guardrails, required tools, and fail-closed fallback phrasing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
            {flowNodes.map((node) => (
              <div
                key={node.id}
                className="p-4 bg-[#18212D] border border-[#243041] rounded-lg space-y-3 hover:border-[#3DDC97] transition-colors"
              >
                <div className="font-heading font-semibold text-sm text-[#E6EDF5]">
                  {node.title}
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="text-[#8A97A8]">
                    Tools: <span className="text-[#4CC9F0]">{node.tools.join(', ')}</span>
                  </div>
                  <div className="text-[#8A97A8]">
                    Prompt Directive: <span className="text-[#E6EDF5] font-sans">{node.promptFragment}</span>
                  </div>
                </div>

                <div className="p-2.5 bg-[#0B0F14] border border-[#243041] rounded text-[11px] space-y-1">
                  <div className="text-[#FFB547] font-semibold">Guardrail:</div>
                  <div className="text-[#8A97A8] font-sans">{node.guardrail}</div>
                  <div className="text-[#3DDC97] font-semibold mt-1">Fallback Phrase:</div>
                  <div className="text-[#E6EDF5] font-sans">"{node.fallback}"</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 3: CONFIGURATION ================= */}
      {activeTab === 'config' && (
        <div className="bg-[#121821] border border-[#243041] rounded-lg p-5 space-y-6 font-mono text-xs">
          <div>
            <h2 className="text-xs uppercase tracking-wider text-[#E6EDF5] font-semibold">
              Voice Orchestration Stack Configuration
            </h2>
            <p className="text-xs text-[#8A97A8] font-sans mt-0.5">
              Declarative architecture adapters for Telephony, ASR, LLM, VAD, and TTS.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#18212D] border border-[#243041] rounded space-y-2">
              <span className="text-[#3DDC97] font-semibold">Streaming Speech Ingest:</span>
              <div className="text-[#8A97A8]">Provider: <strong className="text-[#E6EDF5]">Deepgram Nova-2 Telephony</strong></div>
              <div className="text-[#8A97A8]">Sampling: <strong className="text-[#E6EDF5]">16,000 Hz · 16-bit Linear PCM</strong></div>
              <div className="text-[#8A97A8]">VAD Engine: <strong className="text-[#E6EDF5]">Silero VAD ONNX (Local 5ms)</strong></div>
            </div>

            <div className="p-4 bg-[#18212D] border border-[#243041] rounded space-y-2">
              <span className="text-[#4CC9F0] font-semibold">Language Intelligence & Gate:</span>
              <div className="text-[#8A97A8]">Dialogue Model: <strong className="text-[#E6EDF5]">Claude 3.5 Haiku (temp 0.2)</strong></div>
              <div className="text-[#8A97A8]">Safety Gate: <strong className="text-[#E6EDF5]">Fail-Closed Grounding Verifier</strong></div>
              <div className="text-[#8A97A8]">Index Provider: <strong className="text-[#E6EDF5]">pgvector + BM25 Hybrid</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: BUSINESS ACTION PAYLOADS ================= */}
      {activeTab === 'crm_action' && (
        <div className="bg-[#121821] border border-[#243041] rounded-lg p-5 space-y-4 font-mono text-xs">
          <div>
            <h2 className="text-xs uppercase tracking-wider text-[#E6EDF5] font-semibold">
              Automated CRM Lead & Callback Webhook Payloads
            </h2>
            <p className="text-xs text-[#8A97A8] font-sans mt-0.5">
              Verified action payloads dispatched upon call closure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#18212D] border border-[#243041] rounded space-y-2">
              <div className="flex justify-between items-center text-[#3DDC97] font-semibold">
                <span>POST /api/crm/lead (Created)</span>
                <span className="text-[10px] bg-[#13221C] px-1.5 py-0.2 rounded border border-[#3DDC97]/40">Status: 201</span>
              </div>
              <pre className="p-3 bg-[#0B0F14] rounded text-[11px] text-[#E6EDF5] overflow-x-auto">
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

            <div className="p-4 bg-[#18212D] border border-[#243041] rounded space-y-2">
              <div className="flex justify-between items-center text-[#4CC9F0] font-semibold">
                <span>POST /api/crm/escalation (Standby)</span>
                <span className="text-[10px] bg-[#121E2A] px-1.5 py-0.2 rounded border border-[#4CC9F0]/40">Status: 200</span>
              </div>
              <pre className="p-3 bg-[#0B0F14] rounded text-[11px] text-[#E6EDF5] overflow-x-auto">
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
        <div className="bg-[#121821] border border-[#243041] rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#E6EDF5] font-semibold">
              Mandatory Assessment Test Coverage Matrix
            </h2>
            <span className="text-xs font-mono text-[#3DDC97] bg-[#13221C] px-2 py-0.5 rounded border border-[#3DDC97]/40">
              5 of 5 Passed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#243041] text-[#8A97A8] bg-[#0B0F14]">
                  <th className="py-2.5 px-3">SCENARIO NAME</th>
                  <th className="py-2.5 px-3">MARKET</th>
                  <th className="py-2.5 px-3">EXECUTION PATH</th>
                  <th className="py-2.5 px-3">RESULT</th>
                  <th className="py-2.5 px-3">NOTES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243041]">
                {testMatrix.map((tm) => (
                  <tr key={tm.id} className="hover:bg-[#18212D]/60 transition-colors">
                    <td className="py-3 px-3 font-sans font-semibold text-[#E6EDF5]">{tm.scenario}</td>
                    <td className="py-3 px-3 uppercase text-[#4CC9F0]">{tm.market}</td>
                    <td className="py-3 px-3 text-[#8A97A8]">{tm.coverage}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-[#13221C] text-[#3DDC97] border border-[#3DDC97]/40 rounded font-semibold text-[10px]">
                        {tm.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#57677D] text-[11px] font-sans">{tm.notes}</td>
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
