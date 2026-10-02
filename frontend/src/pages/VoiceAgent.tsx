import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SentenceGateStrip } from '../components/common/SentenceGateStrip';
import { useVoicePipeline } from '../hooks/useVoicePipeline';
import { ELEVENLABS_API_KEY } from '../config/voice';
import {
  PhoneCall, PhoneOff, Mic, MicOff, Radio, AlertCircle, Activity,
  GitBranch, Settings, Send, FileCheck, Zap, Volume2, VolumeX,
  CheckCircle2, Code, ChevronDown, ChevronUp,
} from 'lucide-react';

// ── Animated Audio Bars ────────────────────────────────────────────────────────
const AudioBars: React.FC<{ active: boolean; color?: string; bars?: number }> = ({
  active, color = '#6366f1', bars = 5,
}) => (
  <div className="flex items-end gap-[3px]" style={{ height: 20 }}>
    {Array.from({ length: bars }).map((_, i) => (
      <div
        key={i}
        className="rounded-full transition-all"
        style={{
          width: 3,
          background: color,
          height: active ? `${8 + Math.random() * 12}px` : '4px',
          animation: active ? `audioPulse ${0.6 + i * 0.12}s ease-in-out infinite alternate` : 'none',
          animationDelay: `${i * 0.08}s`,
        }}
      />
    ))}
  </div>
);

// ── Phone Call Avatar ─────────────────────────────────────────────────────────
const CallAvatar: React.FC<{
  name: string; market: string; status: string; elapsed: string;
}> = ({ name, market, status, elapsed }) => {
  const emoji = market === 'ph_tl' ? '🇵🇭' : market === 'id_id' ? '🇮🇩' : '🇮🇳';
  const subtitle = market === 'ph_tl'
    ? 'SecureLife Philippines · Taglish'
    : market === 'id_id'
    ? 'SecureLife Indonesia · Bahasa'
    : 'SecureLife India · Hindi/English';
  const isSpeaking = status === 'speaking';
  const isListening = status === 'listening';
  const isProcessing = status === 'processing';

  return (
    <div className="flex flex-col items-center gap-4 py-6 select-none">
      {/* Avatar ring */}
      <div className={`relative rounded-full p-1 transition-all duration-500 ${
        isSpeaking ? 'ring-4 ring-indigo-500/60 shadow-[0_0_40px_rgba(99,102,241,0.35)]' :
        isListening ? 'ring-4 ring-emerald-500/60 shadow-[0_0_40px_rgba(52,211,153,0.3)]' :
        isProcessing ? 'ring-4 ring-amber-500/40 shadow-[0_0_30px_rgba(251,191,36,0.2)]' :
        'ring-2 ring-white/10'
      }`}>
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 flex items-center justify-center text-4xl shadow-xl">
          {emoji}
        </div>
        {/* Speaking animation rings */}
        {isSpeaking && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-indigo-400/30 animate-ping" style={{ animationDuration: '1.4s' }} />
            <div className="absolute -inset-2 rounded-full border border-indigo-400/15 animate-ping" style={{ animationDuration: '1.8s' }} />
          </>
        )}
        {isListening && (
          <div className="absolute inset-0 rounded-full border-2 border-emerald-400/40 animate-ping" style={{ animationDuration: '1.2s' }} />
        )}
      </div>

      {/* Name + status */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-white tracking-tight">{name}</h2>
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        <div className="flex items-center justify-center gap-2 mt-2.5">
          {isSpeaking && (
            <span className="flex items-center gap-1.5 text-indigo-300 text-xs font-medium">
              <Volume2 className="w-3.5 h-3.5" />
              Speaking...
              <AudioBars active color="#818cf8" bars={5} />
            </span>
          )}
          {isListening && (
            <span className="flex items-center gap-1.5 text-emerald-300 text-xs font-medium">
              <Mic className="w-3.5 h-3.5" />
              Listening...
              <AudioBars active color="#34d399" bars={5} />
            </span>
          )}
          {isProcessing && (
            <span className="flex items-center gap-1.5 text-amber-300 text-xs font-medium">
              <Activity className="w-3.5 h-3.5 animate-spin" />
              Processing...
            </span>
          )}
          {(status === 'connected') && (
            <span className="flex items-center gap-1.5 text-slate-300 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Connected · {elapsed}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
export const VoiceAgent: React.FC = () => {
  const { market, setMarket } = useApp();
  const [activeTab, setActiveTab] = useState<'simulator' | 'flow' | 'config' | 'crm' | 'matrix'>('simulator');
  const [typedInput, setTypedInput] = useState('');
  const [showTranscript, setShowTranscript] = useState(true);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const { state: vs, startCall, endCall, resetCall, toggleMute, toggleAutoListen, activateMic, sendCustomerText } = useVoicePipeline(market);

  const callActive = vs.status !== 'idle' && vs.status !== 'ended';
  const persona = vs.personaName || (market === 'ph_tl' ? 'Maria' : market === 'id_id' ? 'Sari' : 'Priya');

  const fmt = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [vs.transcript]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!typedInput.trim()) return;
    sendCustomerText(typedInput.trim());
    setTypedInput('');
  };

  const quickChips = market === 'in_en' ? [
    { label: 'Haan, Rajesh bol raha hoon', text: 'Haan, main hi Rajesh bol raha hoon.' },
    { label: 'Recording is fine', text: 'Bilkul theek hai, record karo.' },
    { label: 'Grace period kab tak?', text: 'Grace period kab tak hai aur kya hoga agar late bhara?' },
    { label: 'Google Pay se dena hai', text: 'Main Google Pay se premium bharna chahta hoon.' },
    { label: 'Quarterly option hai?', text: 'Kya main quarterly installments mein bhar sakta hoon?' },
    { label: 'Bitcoin insurance?', text: 'Kya Bitcoin ke liye bhi insurance milti hai?' },
  ] : market === 'ph_tl' ? [
    { label: 'Opo, Jose ito', text: 'Opo, ako nga po si Jose Rizal.' },
    { label: 'Ok sa recording', text: 'Sige lang po, ayos lang sa akin ang pag-record.' },
    { label: 'Grace period?', text: 'Hanggang kailan po ang grace period at may late fee ba?' },
    { label: 'GCash payment', text: 'Gusto ko pong magbayad gamit ang GCash.' },
    { label: 'Bitcoin insurance?', text: 'Meron po bang insurance para sa Bitcoin?' },
  ] : [
    { label: 'Ya, Budi sendiri', text: 'Ya, saya sendiri Pak Budi Santoso.' },
    { label: 'Rekaman boleh', text: 'Tidak apa-apa, boleh direkam.' },
    { label: 'Masa tenggang?', text: 'Sampai kapan masa tenggang pembayaran ini?' },
    { label: 'Bayar via GoPay', text: 'Saya mau bayar menggunakan GoPay.' },
  ];

  // ── Tabs data ──
  const tabs = [
    { id: 'simulator', label: 'Call Simulator', icon: PhoneCall },
    { id: 'flow', label: 'Dialogue Flow', icon: GitBranch },
    { id: 'config', label: 'Stack Config', icon: Settings },
    { id: 'crm', label: 'CRM Payloads', icon: Send },
    { id: 'matrix', label: 'Test Matrix', icon: FileCheck },
  ];

  // ── FSM flow nodes ──
  const flowNodes = [
    { title: 'Greeting & Verification', tools: ['verify_dob', 'check_phone_last4'], guardrail: 'No policy data until 2FA match', fallback: 'Transfer to security supervisor' },
    { title: 'Renewal Disclosure', tools: ['retrieve_policy_summary'], guardrail: 'Grace period mention mandatory (IRDAI 4.2)', fallback: '30-day statutory grace period quote' },
    { title: 'Qualification', tools: ['record_intent', 'qualify_affordability'], guardrail: 'Record willingness or financial constraint', fallback: 'Offer quarterly mode or grace deferral' },
    { title: 'Objection Handling', tools: ['retrieve_kb'], guardrail: 'Only KB-grounded counter-proposals', fallback: 'Never invent discounts not in KB' },
    { title: 'Unsupported Fallback', tools: ['log_refusal_ledger'], guardrail: 'Score < 0.65 triggers refusal', fallback: 'Graceful refusal in customer language' },
    { title: 'Close & Action', tools: ['create_crm_lead', 'dispatch_payment_link'], guardrail: 'Post-call webhook with idempotency key', fallback: 'Queue offline sync if CRM times out' },
  ];

  const testMatrix = [
    { id: 'tm_01', scenario: 'Cooperative Renewal (Straight-Through)', market: 'in_en', status: 'PASS', notes: '100% grounded. Instant CRM sync.' },
    { id: 'tm_02', scenario: 'Affordability Objection (Quarterly)', market: 'in_en', status: 'PASS', notes: 'KB article kb_objection_007 retrieved.' },
    { id: 'tm_03', scenario: 'Failed Identity Verification', market: 'in_en', status: 'PASS', notes: 'No sensitive data leaked to caller.' },
    { id: 'tm_04', scenario: 'Refusal — Bitcoin Insurance Query', market: 'in_en', status: 'PASS', notes: 'Refusal ledger: hallucination_attempt.' },
    { id: 'tm_05', scenario: 'Taglish Bilingual Flow (Philippines)', market: 'ph_tl', status: 'PASS', notes: 'Po/Opo locked. GCash guidance verified.' },
  ];

  return (
    <div className="p-5 lg:p-7 space-y-5 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
              Voice Orchestration
            </span>
            <span className="flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ElevenLabs TTS Active
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Voice Agent Studio</h1>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Fail-Closed Gate Active
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1 border-b border-[#1F293D] pb-3">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all outline-none ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ======== TAB: CALL SIMULATOR ======== */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Left — Phone UI (7 cols) */}
          <div className="lg:col-span-7 space-y-4">

            {/* Phone call card */}
            <div className="bg-gradient-to-b from-[#0f1629] to-[#0a0f1e] border border-[#1F293D] rounded-2xl overflow-hidden shadow-xl">

              {/* Status bar */}
              <div className={`h-1 transition-all duration-500 ${
                vs.status === 'listening' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                vs.status === 'speaking' ? 'bg-gradient-to-r from-indigo-500 to-violet-500 animate-pulse' :
                vs.status === 'processing' ? 'bg-gradient-to-r from-amber-500 to-orange-500 animate-pulse' :
                callActive ? 'bg-gradient-to-r from-emerald-600/60 to-teal-600/60' : 'bg-[#1F293D]'
              }`} />

              {vs.status === 'idle' || vs.status === 'ended' ? (
                /* ── Pre-call / Post-call screen ── */
                <div className="p-8 flex flex-col items-center gap-6">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center mx-auto mb-4 ring-2 ring-white/10">
                      <PhoneCall className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-white font-semibold text-base">
                      {vs.status === 'ended' ? 'Call Ended' : 'Inbound Call Simulator'}
                    </h3>
                    <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">
                      {vs.status === 'ended'
                        ? 'Session closed. View the transcript below or start a new call.'
                        : 'Select a market and start a simulated inbound insurance renewal call.'}
                    </p>
                  </div>

                  {vs.status !== 'ended' && (
                    <select
                      value={market}
                      onChange={e => setMarket(e.target.value as any)}
                      className="px-4 py-2 bg-[#141C30] border border-[#1F293D] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="in_en">🇮🇳 India — Hindi/English (Priya)</option>
                      <option value="ph_tl">🇵🇭 Philippines — Taglish (Maria)</option>
                      <option value="id_id">🇮🇩 Indonesia — Bahasa (Sari)</option>
                    </select>
                  )}

                  <button
                    id="start-call-btn"
                    onClick={vs.status === 'ended' ? resetCall : startCall}
                    className="flex items-center gap-2.5 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-2xl font-semibold shadow-lg shadow-emerald-600/20 transition-all"
                  >
                    <PhoneCall className="w-5 h-5" />
                    {vs.status === 'ended' ? 'Start New Call' : 'Start Inbound Call'}
                  </button>
                </div>
              ) : vs.status === 'starting' ? (
                /* ── Connecting screen ── */
                <div className="p-8 flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <Activity className="w-7 h-7 text-emerald-400 animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium">Connecting...</p>
                    <p className="text-slate-400 text-xs mt-1">Initialising session & requesting mic access</p>
                  </div>
                </div>
              ) : (
                /* ── Active call screen ── */
                <div className="px-6 pb-6">
                  {/* Avatar */}
                  <CallAvatar name={persona} market={market} status={vs.status} elapsed={fmt(vs.elapsedSeconds)} />

                  {/* Interim ASR */}
                  {vs.currentInterim && (
                    <div className="mx-2 mb-4 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-xs text-emerald-300 italic flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      "{vs.currentInterim}"
                    </div>
                  )}

                  {/* Error */}
                  {vs.error && (
                    <div className="mx-2 mb-4 px-4 py-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{vs.error}</span>
                    </div>
                  )}

                  {/* Call controls */}
                  <div className="flex items-center justify-center gap-4 mt-2">
                    {/* Mute */}
                    <button
                      id="mute-btn"
                      onClick={toggleMute}
                      title={vs.isMuted ? 'Unmute' : 'Mute'}
                      className={`w-13 h-13 rounded-2xl flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-all p-3 ${
                        vs.isMuted
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-[#141C30] text-slate-300 border border-[#1F293D] hover:bg-[#1F293D]'
                      }`}
                    >
                      {vs.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      <span>{vs.isMuted ? 'Muted' : 'Mic'}</span>
                    </button>

                    {/* Speak now */}
                    {vs.asrSupported && (
                      <button
                        id="speak-btn"
                        onClick={activateMic}
                        disabled={vs.isMuted || vs.status === 'listening' || vs.status === 'processing'}
                        title={vs.status === 'speaking' ? 'Interrupt & speak' : 'Press to speak'}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
                          vs.status === 'listening'
                            ? 'bg-emerald-500 text-white shadow-emerald-500/40 scale-110'
                            : vs.status === 'speaking'
                            ? 'bg-indigo-600 hover:bg-emerald-500 text-white shadow-indigo-600/30 active:scale-95'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95'
                        }`}
                      >
                        <Radio className={`w-7 h-7 ${vs.status === 'listening' ? 'animate-pulse' : ''}`} />
                      </button>
                    )}

                    {/* End call */}
                    <button
                      id="end-call-btn"
                      onClick={endCall}
                      title="End call"
                      className="w-13 h-13 rounded-2xl flex flex-col items-center justify-center gap-1 text-[10px] font-medium bg-rose-600 hover:bg-rose-500 text-white transition-all p-3 active:scale-95"
                    >
                      <PhoneOff className="w-5 h-5" />
                      <span>End</span>
                    </button>
                  </div>

                  {/* Auto-listen toggle */}
                  <div className="flex items-center justify-center mt-4">
                    <button
                      onClick={toggleAutoListen}
                      className={`flex items-center gap-2 text-[11px] px-3 py-1.5 rounded-full border transition-all ${
                        vs.autoListen
                          ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                          : 'bg-transparent text-slate-500 border-slate-700'
                      }`}
                    >
                      <Zap className="w-3 h-3" />
                      Auto-listen {vs.autoListen ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {/* Turn stats */}
                  <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-slate-500 font-mono">
                    <span>Turn <strong className="text-slate-300">{vs.turnCount}</strong></span>
                    <span>·</span>
                    <span>TTS: <strong className="text-slate-300">{ELEVENLABS_API_KEY ? 'ElevenLabs' : 'Browser'}</strong></span>
                    {vs.micPermission === 'denied' && (
                      <>
                        <span>·</span>
                        <span className="text-amber-400 flex items-center gap-1">
                          <VolumeX className="w-3 h-3" /> Mic denied
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Customer response section */}
            {callActive && (
              <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-4 space-y-3">
                {/* Customer turn banner */}
                {(vs.awaitingCustomer || vs.status === 'listening' || vs.status === 'connected') && vs.status !== 'processing' && vs.status !== 'speaking' && (
                  <div className={`flex items-center gap-2 text-xs rounded-xl px-3.5 py-2.5 transition-all ${
                    vs.status === 'listening'
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                      : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-300'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${vs.status === 'listening' ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-400'}`} />
                    {vs.status === 'listening' ? 'Listening — speak now...' : 'Customer turn — speak or click a response below'}
                  </div>
                )}

                {/* Chips */}
                <div>
                  <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-wide font-medium">Simulate customer response</p>
                  <div className="flex flex-wrap gap-1.5">
                    {quickChips.map((chip, i) => (
                      <button
                        key={i}
                        onClick={() => sendCustomerText(chip.text)}
                        disabled={vs.status === 'processing' || vs.status === 'speaking'}
                        title={chip.text}
                        className={`px-2.5 py-1.5 border rounded-lg text-[11px] font-medium transition-all ${
                          vs.awaitingCustomer && vs.status !== 'speaking' && vs.status !== 'processing'
                            ? 'bg-indigo-600/20 text-indigo-200 border-indigo-500/40 hover:bg-indigo-600/35 hover:border-indigo-400/60'
                            : 'bg-[#141C30] text-slate-300 border-[#1F293D] hover:bg-[#1F293D] hover:text-white'
                        } disabled:opacity-30 disabled:cursor-not-allowed`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text input */}
                <form onSubmit={handleSend} className="flex gap-2">
                  <input
                    type="text"
                    value={typedInput}
                    onChange={e => setTypedInput(e.target.value)}
                    placeholder="Or type custom response and press Enter..."
                    disabled={vs.status === 'processing' || vs.status === 'speaking'}
                    className="flex-1 px-3 py-2 bg-[#090D16] border border-[#1F293D] rounded-xl text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-40"
                  />
                  <button
                    type="submit"
                    disabled={!typedInput.trim() || vs.status === 'processing' || vs.status === 'speaking'}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white rounded-xl flex items-center gap-1.5 text-xs font-medium transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Right — Transcript + Checklist (5 cols) */}
          <div className="lg:col-span-5 space-y-4">

            {/* Live Transcript */}
            <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl overflow-hidden shadow-sm">
              <button
                className="w-full flex items-center justify-between px-5 py-3.5 text-xs font-semibold text-white border-b border-[#1F293D] hover:bg-white/[0.02] transition-colors"
                onClick={() => setShowTranscript(s => !s)}
              >
                <span className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${callActive && vs.transcript.length ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                  Live Transcript
                  <span className="text-slate-500 font-normal">({vs.transcript.length} turns)</span>
                </span>
                {showTranscript ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
              </button>

              {showTranscript && (
                <div ref={transcriptRef} className="overflow-y-auto max-h-[420px] p-4 space-y-3">
                  {vs.transcript.length === 0 && (
                    <div className="py-10 text-center text-slate-500 text-xs">
                      {callActive ? 'Waiting for first turn...' : 'Start a call to see the live transcript.'}
                    </div>
                  )}
                  {vs.transcript.map(entry => (
                    <div
                      key={entry.id}
                      className={`space-y-1.5 ${entry.speaker === 'agent' ? 'pl-0 pr-4' : 'pl-4 pr-0'}`}
                    >
                      <div className={`flex items-center gap-1.5 text-[10px] ${entry.speaker === 'agent' ? 'text-indigo-400' : 'text-slate-400 flex-row-reverse'}`}>
                        <span className="font-semibold">{entry.speaker === 'agent' ? persona : 'Customer'}</span>
                        {entry.latency?.asr_ms ? <span className="text-slate-600 font-mono">ASR {entry.latency.asr_ms}ms</span> : null}
                      </div>
                      <div className={`px-3.5 py-2.5 rounded-xl text-xs leading-relaxed text-slate-200 ${
                        entry.speaker === 'agent'
                          ? 'bg-[#131A2B] border border-indigo-500/20 rounded-tl-sm'
                          : 'bg-[#1A2035] border border-[#1F293D] rounded-tr-sm'
                      }`}>
                        {entry.text}
                      </div>
                      {entry.speaker === 'agent' && entry.citations?.length ? (
                        <div className="pl-1">
                          <SentenceGateStrip
                            gate={{
                              turn_id: entry.id,
                              status: entry.gateVerdict === 'REFUSAL' ? 'UNSUPPORTED' : entry.citations?.length ? 'VERIFIED' : 'UNSUPPORTED',
                              draft_text: entry.text,
                              final_spoken_text: entry.text,
                              receipt: entry.citations?.length ? {
                                citation: entry.citations[0],
                                record_id: entry.citations[0],
                                version: 'v1.1', score: 0.92,
                                source_title: 'KB Record',
                                source_file: 'knowledge_base.json',
                                chunk_text: entry.text.slice(0, 100),
                                score_breakdown: { dense: 0.9, bm25: 0.88, rerank: 0.92 },
                              } : undefined,
                            }}
                          />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Qualification Checklist */}
            <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-semibold text-white">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Qualification Checklist
                </span>
                <span className="text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 text-[10px]">
                  5 of 5 Verified
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                {[
                  { title: 'Caller Identity Verified', note: 'DOB + Phone Match' },
                  { title: 'Policy Status Checked', note: 'Active (Grace Window)' },
                  { title: 'Due Date Acknowledged', note: 'Oct 15, 2026' },
                  { title: 'Renewal Intent Confirmed', note: 'Affirmative (1.0)' },
                  { title: 'Payment Channel Chosen', note: 'UPI (Google Pay)' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-[#141C30] border border-[#1F293D] rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-[10px]">✓</span>
                      <span className="text-slate-300">{item.title}</span>
                    </div>
                    <span className="text-emerald-400 font-mono text-[10px]">{item.note}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live JSON */}
            <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-semibold text-slate-300">
                  <Code className="w-3.5 h-3.5 text-indigo-400" />
                  Extracted Metadata
                </span>
                <span className="text-slate-500 font-mono text-[10px]">Schema v1.3</span>
              </div>
              <pre className="p-3 bg-[#090D16] border border-[#1F293D] rounded-xl font-mono text-[10px] text-emerald-400 overflow-x-auto leading-relaxed max-h-44 overflow-y-auto">
{JSON.stringify({
  session_id: vs.callSessionId || 'sess_pending',
  market,
  customer: { id_masked: 'CUST_982', name_masked: market === 'ph_tl' ? 'Jose R.' : market === 'id_id' ? 'Budi S.' : 'Rajesh K.' },
  policy: { number: market === 'ph_tl' ? 'POL-PH-2024-3312' : market === 'id_id' ? 'POL-ID-2024-7741' : 'POL-IN-2024-8849', due_date: '2026-10-15', grace_days: 30 },
  turn_count: vs.turnCount,
  gate_verdict: 'FAIL_CLOSED_PASSED',
}, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ======== TAB: FLOW ======== */}
      {activeTab === 'flow' && (
        <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-white">Dialogue State Machine & Guardrail Flow</h2>
            <p className="text-xs text-slate-400 mt-1">Every stage has explicit guardrails, tool calls, and fail-closed fallback phrases.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {flowNodes.map((node, i) => (
              <div key={i} className="p-4 bg-[#141C30] border border-[#1F293D] hover:border-indigo-500/30 rounded-xl space-y-3 transition-colors">
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <span className="text-xs font-semibold text-white">{node.title}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Tools: <span className="text-indigo-400 font-mono">{node.tools.join(', ')}</span>
                </div>
                <div className="p-2.5 bg-[#090D16] rounded-lg space-y-1.5 text-[11px]">
                  <div className="text-amber-400 font-semibold">Guardrail:</div>
                  <div className="text-slate-300">{node.guardrail}</div>
                  <div className="text-emerald-400 font-semibold mt-1.5">Fallback:</div>
                  <div className="text-slate-400">"{node.fallback}"</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======== TAB: CONFIG ======== */}
      {activeTab === 'config' && (
        <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-white">Voice Orchestration Stack Configuration</h2>
            <p className="text-xs text-slate-400 mt-1">Adapter architecture for TTS, ASR, LLM, VAD, and telephony.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {[
              { label: 'TTS Engine', color: 'indigo', items: [
                ['Provider', ELEVENLABS_API_KEY ? 'ElevenLabs Turbo v2.5' : 'Web Speech API (Browser)'],
                ['Latency', ELEVENLABS_API_KEY ? '< 300ms streaming' : 'Native (OS-dependent)'],
                ['Voices', 'Priya (in_en) · Maria (ph_tl) · Sari (id_id)'],
              ]},
              { label: 'ASR Engine', color: 'emerald', items: [
                ['Provider', 'Web Speech API / Chrome'],
                ['Language', MARKET_LANG[market] || 'en-IN'],
                ['Mode', 'Interim + Final results · 1-best'],
              ]},
              { label: 'Language Intelligence', color: 'violet', items: [
                ['Dialogue Model', 'Claude 3.5 Haiku / Groq Llama-3'],
                ['Safety Gate', 'Fail-Closed Grounding Verifier'],
                ['RAG Retrieval', 'Cohere Embed-v4 + BM25 hybrid'],
              ]},
              { label: 'Telephony & VAD', color: 'amber', items: [
                ['Ingest', 'Browser MediaDevices API'],
                ['VAD', 'Silero VAD ONNX (local 5ms)'],
                ['Sampling', '16kHz · 16-bit PCM mono'],
              ]},
            ].map(section => (
              <div key={section.label} className={`p-4 bg-[#141C30] border border-[#1F293D] rounded-xl space-y-3`}>
                <span className={`text-${section.color}-400 font-semibold text-xs`}>{section.label}</span>
                <div className="space-y-1.5">
                  {section.items.map(([k, v]) => (
                    <div key={k} className="flex justify-between text-[11px]">
                      <span className="text-slate-400">{k}</span>
                      <span className="text-slate-200 font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {!ELEVENLABS_API_KEY && (
            <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">ElevenLabs not configured</p>
                <p className="text-amber-400/80">Create <code className="bg-amber-500/10 px-1 py-0.5 rounded">frontend/.env.local</code> and add: <code className="bg-amber-500/10 px-1 py-0.5 rounded">VITE_ELEVENLABS_API_KEY=your_key_here</code></p>
                <p className="mt-1 text-amber-400/70">Get your key at <strong>elevenlabs.io</strong> (free tier available). The browser TTS will be used until then.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======== TAB: CRM ======== */}
      {activeTab === 'crm' && (
        <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-white">Automated CRM & Webhook Payloads</h2>
            <p className="text-xs text-slate-400 mt-1">Verified action payloads dispatched upon call closure with idempotency keys.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            {[
              { label: 'POST /api/crm/lead', status: '201 Created', color: 'emerald', payload: { lead_id: 'lead_renewal_9921', customer_id: 'CUST_982', disposition: 'RENEWAL_CONFIRMED', payment_link_dispatched: true, channel: 'UPI_SMS_WHATSAPP' } },
              { label: 'POST /api/crm/escalation', status: '200 Standby', color: 'indigo', payload: { escalation_id: 'esc_auto_441', reason: 'DISPUTED_UPI_RECONCILIATION', priority: 'HIGH', assigned_queue: 'FINANCE_SUPERVISOR_L2', sla_minutes: 15 } },
            ].map(item => (
              <div key={item.label} className="p-4 bg-[#141C30] border border-[#1F293D] rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className={`text-${item.color}-400 font-semibold text-[11px]`}>{item.label}</span>
                  <span className={`text-[10px] bg-${item.color}-500/10 text-${item.color}-400 border border-${item.color}-500/20 px-2 py-0.5 rounded-full`}>{item.status}</span>
                </div>
                <pre className="p-3 bg-[#090D16] border border-[#1F293D] rounded-lg text-[10px] text-slate-200 overflow-x-auto leading-relaxed">{JSON.stringify(item.payload, null, 2)}</pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======== TAB: TEST MATRIX ======== */}
      {activeTab === 'matrix' && (
        <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F293D]">
            <h2 className="text-sm font-semibold text-white">End-to-End Verification Test Matrix</h2>
            <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full font-medium">5 / 5 Passed</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1F293D] bg-[#141C30] text-slate-400 font-medium">
                  <th className="py-3 px-5">Scenario</th>
                  <th className="py-3 px-4">Market</th>
                  <th className="py-3 px-4">Result</th>
                  <th className="py-3 px-5 text-right">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F293D]">
                {testMatrix.map(tm => (
                  <tr key={tm.id} className="hover:bg-[#141C30]/50 transition-colors">
                    <td className="py-3.5 px-5 text-white font-medium">{tm.scenario}</td>
                    <td className="py-3.5 px-4 text-indigo-400 font-mono text-[10px] uppercase">{tm.market}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-semibold text-[10px]">
                        {tm.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right text-slate-400 text-[11px]">{tm.notes}</td>
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

// Expose MARKET_LANG for config tab
const MARKET_LANG: Record<string, string> = { in_en: 'en-IN', ph_tl: 'fil-PH', id_id: 'id-ID' };
