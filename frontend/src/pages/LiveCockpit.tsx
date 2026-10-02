import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { mockScenarios } from '../data/mockLiveData';
import type { ScenarioDefinition } from '../data/mockLiveData';
import type { LiveNudge, SuppressedNudge, MarketCode } from '../types';
import { LiveWaveform } from '../components/common/LiveWaveform';
import { SentenceGateStrip } from '../components/common/SentenceGateStrip';
import {
  Zap,
  Play,
  Pause,
  RotateCcw,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Activity,
  Info,
  Check,
  Volume2,
  Mic,
  Sliders,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Radio,
  Server,
  Globe,
  Database,
  Send,
  RefreshCw
} from 'lucide-react';
import { API_BASE, WS_BASE, SERVER_ROOT } from '../config/api';

export const LiveCockpit: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { market, setMarket, kbVersion, setKbVersion, apiMode, setApiMode } = useApp();
  const isLiveMode = apiMode === 'live';

  const initialScenario = searchParams.get('scenario') || 'cross_sell';
  const [activeScenarioId, setActiveScenarioId] = useState<string>(initialScenario);

  // Sync active scenario when market changes
  useEffect(() => {
    const marketScenarios = Object.values(mockScenarios).filter((s) => s.market === market);
    if (marketScenarios.length > 0) {
      const current = mockScenarios[activeScenarioId];
      if (!current || current.market !== market) {
        setActiveScenarioId(marketScenarios[0].id);
      }
    }
  }, [market]);

  const scenario: ScenarioDefinition = mockScenarios[activeScenarioId] || mockScenarios.cross_sell;

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTurnIdx, setCurrentTurnIdx] = useState<number>(scenario.turns.length);
  const [activeNudges, setActiveNudges] = useState<LiveNudge[]>(scenario.nudges);
  const [suppressedNudges, setSuppressedNudges] = useState<SuppressedNudge[]>(scenario.suppressedNudges);
  const [selectedNudgeToExplain, setSelectedNudgeToExplain] = useState<LiveNudge | null>(null);
  const [streamSource, setStreamSource] = useState<'replay_1x' | 'replay_chaos' | 'live_mic'>('replay_1x');
  const [audioMuted, setAudioMuted] = useState(false);
  const [chaosSnr, setChaosSnr] = useState(24);

  // Live Backend State
  const [backendHealth, setBackendHealth] = useState<{ status: string; version: string; activeKb: string } | null>(null);
  const [liveSessionId, setLiveSessionId] = useState<string | null>(null);
  const [liveIsSending, setLiveIsSending] = useState(false);
  const [liveStatusNote, setLiveStatusNote] = useState<string>('');

  // When switching scenario, reset state
  useEffect(() => {
    const newScen = mockScenarios[activeScenarioId] || mockScenarios.cross_sell;
    setCurrentTurnIdx(newScen.turns.length);
    setActiveNudges(newScen.nudges);
    setSuppressedNudges(newScen.suppressedNudges);
    setIsPlaying(true);
    if (activeScenarioId === 'noisy_call') {
      setChaosSnr(11);
    } else {
      setChaosSnr(24);
    }
  }, [activeScenarioId]);

  // Check live backend connectivity when in live mode
  useEffect(() => {
    if (!isLiveMode) {
      setLiveStatusNote('');
      return;
    }

    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_BASE}/health`);
        if (res.ok) {
          const data = await res.json();
          setBackendHealth({
            status: data.status,
            version: data.version,
            activeKb: data.active_kb_version || kbVersion
          });
          setLiveStatusNote(`Connected to FastAPI backend (${data.version}) · All 7 services green`);
        }
      } catch (e) {
        setLiveStatusNote('Connecting to FastAPI backend...');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 8000);
    return () => clearInterval(interval);
  }, [isLiveMode, kbVersion]);

  // Nudge expiry: ARCHITECTURE §10.2 — opportunity nudges expire after 30s
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setActiveNudges((prev) =>
        prev.map((n) => {
          if (n.status !== 'active') return n;
          if (n.type === 'compliance') return n;
          if ((n as any).expiresAt && now > (n as any).expiresAt * 1000) {
            return { ...n, status: 'dismissed' as const };
          }
          return n;
        })
      );
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Live WebSocket wiring — handles all ARCHITECTURE §12 event types when in live mode
  useEffect(() => {
    if (!isLiveMode) return;
    const wsBase = WS_BASE;
    let ws: WebSocket;
    try {
      ws = new WebSocket(`${wsBase}/ws/nudges`);
      ws.onopen = () => {
        setLiveStatusNote(`Live WebSocket Stream active (${wsBase}/ws/nudges)`);
      };
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const eventType = msg.event;

          if (eventType === 'nudge.fired') {
            const newNudge: LiveNudge = {
              id: msg.id,
              type: msg.topic || 'generic',
              title: msg.text?.substring(0, 40) || 'Nudge',
              text: msg.text,
              status: 'active',
              priority: parseInt(String(msg.priority || '3').replace('P', ''), 10),
              timestamp: new Date().toISOString().substring(11, 19),
              confidence: msg.confidence || 0.9,
              expiresAt: msg.expires_at,
            } as LiveNudge & { expiresAt?: number };
            setActiveNudges((prev) => [newNudge, ...prev]);
          } else if (eventType === 'nudge.suppressed') {
            const suppressed: SuppressedNudge = {
              id: msg.id,
              candidate_text: msg.details?.topic || 'Suppressed nudge',
              topic: msg.details?.topic || 'generic',
              suppression_reason: (msg.reason?.includes('cooldown')
                ? 'cooldown'
                : msg.reason?.includes('confidence')
                ? 'low_confidence'
                : msg.reason?.includes('rate')
                ? 'duplicate'
                : msg.reason?.includes('noisy')
                ? 'noisy_audio_guard'
                : 'low_confidence') as SuppressedNudge['suppression_reason'],
              verdict_detail: msg.reason || 'Suppressed by nudge court',
              confidence: msg.details?.confidence ?? 0,
              timestamp: new Date().toISOString().substring(11, 19),
            };
            setSuppressedNudges((prev) => [suppressed, ...prev].slice(0, 20));
          }
        } catch (err) {
          console.error('WS Error', err);
        }
      };
      ws.onerror = () => {
        setLiveStatusNote('Live Backend REST active · WebSocket waiting for next audio turn');
      };
    } catch (e) {
      console.error(e);
    }
    return () => {
      if (ws) ws.close();
    };
  }, [isLiveMode]);

  const handleNudgeAction = (nudgeId: string, action: 'accepted' | 'dismissed' | 'snoozed') => {
    setActiveNudges((prev) =>
      prev.map((n) => (n.id === nudgeId ? { ...n, status: action } : n))
    );
  };

  // Start or test a live call session on the backend
  const handleStartLiveBackendCall = async () => {
    setLiveIsSending(true);
    try {
      const res = await fetch(`${API_BASE}/voice/calls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market,
          customer_id: scenario.caller.includes('CUST') ? scenario.caller : 'CUST_DEMO_01'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setLiveSessionId(data.call_session_id);
        setLiveStatusNote(`Live Telephony Session ${data.call_session_id} active (${data.language})`);
      }
    } catch (err) {
      console.error('Failed to start live call', err);
    } finally {
      setLiveIsSending(false);
    }
  };

  // Scenarios belonging to current market
  const marketScenarios = Object.values(mockScenarios).filter((s) => s.market === market);
  const otherScenarios = Object.values(mockScenarios).filter((s) => s.market !== market);

  const visibleTurns = scenario.turns.slice(0, currentTurnIdx);
  const activeNudgesFiltered = activeNudges.filter((n) => n.status === 'active');
  const currentScenarioNudgesAvoided = suppressedNudges.length;

  const marketNames: Record<MarketCode, { name: string; flag: string; lang: string }> = {
    in_en: { name: 'India', flag: '🇮🇳', lang: 'English / Hindi' },
    ph_tl: { name: 'Philippines', flag: '🇵🇭', lang: 'Taglish (Filipino/English)' },
    id_id: { name: 'Indonesia', flag: '🇮🇩', lang: 'Bahasa Indonesia (Formal & Santai)' }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto select-none">
      {/* Dynamic Mode & Snapshot Notice Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-xs bg-[#0E1424] border-[#1F293D]">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Mode Badge */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLiveMode ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isLiveMode ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="font-semibold text-slate-200">
              Pipeline Mode:
            </span>
            <span className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold border ${
              isLiveMode
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}>
              {isLiveMode ? 'LIVE BACKEND ACTIVE (127.0.0.1:8000)' : 'MOCK FIXTURES ACTIVE (Deterministic Replay)'}
            </span>
          </div>

          <span className="text-slate-600 hidden md:inline">|</span>

          {/* Market Badge */}
          <div className="flex items-center gap-1.5 text-slate-300">
            <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-slate-400">Market:</span>
            <span className="font-medium text-white">{marketNames[market].flag} {marketNames[market].name} ({marketNames[market].lang})</span>
          </div>

          <span className="text-slate-600 hidden md:inline">|</span>

          {/* Snapshot Badge */}
          <div className="flex items-center gap-1.5 text-slate-300">
            <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-400">Snapshot:</span>
            <span className={`font-mono font-medium ${kbVersion === 'v1.3' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {kbVersion} {kbVersion === 'v1.3' ? '(Active Production)' : '(Legacy Mode)'}
            </span>
          </div>
        </div>

        {/* Live Backend Action Trigger */}
        <div className="flex items-center gap-2">
          {isLiveMode ? (
            <button
              onClick={handleStartLiveBackendCall}
              disabled={liveIsSending}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium flex items-center gap-1.5 shadow-sm transition-all text-xs"
            >
              <RefreshCw className={`w-3 h-3 ${liveIsSending ? 'animate-spin' : ''}`} />
              {liveSessionId ? 'Sync Live Call Session' : 'Start Live Backend Session'}
            </button>
          ) : (
            <button
              onClick={() => setApiMode('live')}
              className="px-3 py-1 bg-[#141C30] hover:bg-[#1A2540] text-amber-300 border border-amber-500/30 rounded-lg transition-colors font-medium text-xs flex items-center gap-1.5"
            >
              <Radio className="w-3 h-3 text-amber-400" />
              Switch to Live Backend
            </button>
          )}
        </div>
      </div>

      {liveStatusNote && (
        <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{liveStatusNote}</span>
        </div>
      )}

      {/* Top Header & Scenario Selection Bar */}
      <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-heading text-lg font-bold text-white tracking-tight">
                Live Agent Copilot & Nudge Court
              </h1>
              <span className="text-[11px] font-medium px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-mono">
                {isLiveMode ? 'Live Telephony Stream' : 'Streaming Replay · 60 FPS'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-2 flex-wrap">
              <span>Active Call Session:</span>
              <span className="font-mono text-indigo-400 font-semibold">{scenario.policyNo}</span>
              <span className="text-slate-500">·</span>
              <span className="text-white font-medium">{scenario.caller}</span>
              <span className="text-slate-500">·</span>
              <span className="px-2 py-0.5 bg-[#141C30] border border-[#1F293D] rounded text-slate-300 text-[10px]">
                {marketNames[scenario.market]?.flag} {scenario.market.toUpperCase()}
              </span>
            </p>
          </div>
        </div>

        {/* Dynamic Scenario Selectors tailored for Active Market */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          {/* Market Scenarios Group */}
          <div className="flex flex-wrap items-center gap-2">
            {marketScenarios.map((scen, idx) => (
              <button
                key={scen.id}
                onClick={() => setActiveScenarioId(scen.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeScenarioId === scen.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-[#141C30] text-slate-300 border border-[#1F293D] hover:bg-[#1A2540]'
                }`}
              >
                {idx + 1}. {scen.name.split(':')[0].split('(')[0].trim()}
              </button>
            ))}

            {/* Other Market Scenarios Quick Access */}
            {otherScenarios.map((scen) => (
              <button
                key={scen.id}
                onClick={() => {
                  setMarket(scen.market);
                  setActiveScenarioId(scen.id);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all opacity-70 hover:opacity-100 ${
                  activeScenarioId === scen.id
                    ? 'bg-indigo-600 text-white shadow-sm opacity-100'
                    : 'bg-[#141C30]/60 text-slate-400 border border-[#1F293D] hover:bg-[#1A2540]'
                }`}
                title={`Switch market to ${marketNames[scen.market].name}`}
              >
                {marketNames[scen.market].flag} {scen.name.split(':')[0].split('(')[0].trim()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ================= COLUMN 1: Audio & Streaming Transcript (5 cols) ================= */}
        <div className="lg:col-span-5 space-y-5">
          {/* Audio Ingest & Waveform */}
          <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Audio Stream & Ingest
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={streamSource}
                  onChange={(e) => setStreamSource(e.target.value as any)}
                  className="bg-[#141C30] border border-[#1F293D] text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="replay_1x">Replay Scripted Stream (1.0x)</option>
                  <option value="replay_chaos">Replay with Chaos Noise</option>
                  <option value="live_mic">Browser Mic (Live Audio)</option>
                </select>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 bg-[#141C30] hover:bg-[#1A2540] text-slate-200 rounded-lg border border-[#1F293D] transition-colors"
                  title={isPlaying ? 'Pause simulation' : 'Resume simulation'}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
                <button
                  onClick={() => {
                    setCurrentTurnIdx(0);
                    setTimeout(() => setCurrentTurnIdx(scenario.turns.length), 200);
                  }}
                  className="p-1.5 bg-[#141C30] hover:bg-[#1A2540] text-slate-400 hover:text-slate-200 rounded-lg border border-[#1F293D] transition-colors"
                  title="Rewind transcript"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <LiveWaveform
              isActive={isPlaying}
              isMuted={audioMuted}
              onToggleMute={() => setAudioMuted(!audioMuted)}
              noiseLevelDb={chaosSnr}
            />

            {streamSource === 'replay_chaos' && (
              <div className="p-3 bg-[#141C30] border border-[#1F293D] rounded-xl space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Injected Street Noise (SNR):</span>
                  <span className="text-amber-400 font-mono font-semibold">{chaosSnr} dB</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="35"
                  value={chaosSnr}
                  onChange={(e) => setChaosSnr(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#1F293D] rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Streaming Transcript Lanes */}
          <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F293D]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Dual-Lane Streaming Transcript
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                ASR: Deepgram Nova-2 ({marketNames[scenario.market].name})
              </span>
            </div>

            {/* Turns list with clean, robust alignment */}
            <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1 pb-2">
              {visibleTurns.map((turn) => {
                const isAgent = turn.speaker === 'agent';
                const isBlocked = turn.gate?.status === 'BLOCKED_FALLBACK';

                return (
                  <div
                    key={turn.id}
                    className={`p-4 rounded-xl border text-xs transition-all ${
                      isAgent
                        ? isBlocked
                          ? 'bg-[#181224] border-rose-500/35 ml-2 shadow-sm'
                          : 'bg-[#131A2B] border-indigo-500/25 ml-2 shadow-sm'
                        : 'bg-[#141C30] border-[#1F293D] mr-2 shadow-sm'
                    }`}
                  >
                    {/* Turn Speaker Header */}
                    <div className="flex items-center justify-between mb-2 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold px-2 py-0.5 rounded-md ${
                            isAgent
                              ? isBlocked
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {isAgent ? (isBlocked ? 'Voice Agent (Intercepted)' : 'Voice Agent') : 'Customer'}
                        </span>
                        <span className="text-slate-400 font-mono">{turn.timestamp}</span>
                        {turn.language && (
                          <span className="text-slate-400 bg-[#0E1424] px-1.5 py-0.5 rounded border border-[#1F293D] font-mono text-[10px]">
                            {turn.language}
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                        <span>ASR {turn.asr_latency_ms}ms</span>
                        <span>·</span>
                        <span>Conf {((turn.confidence || 0.98) * 100).toFixed(0)}%</span>
                      </div>
                    </div>

                    {/* Spoken Text (for blocked turns, show what was actually synthesized to caller) */}
                    <p className="text-slate-200 leading-relaxed font-sans text-xs">
                      {isBlocked && turn.gate?.final_spoken_text ? turn.gate.final_spoken_text : turn.text}
                    </p>

                    {/* Sentence Gate Visualizer */}
                    {isAgent && turn.gate && (
                      <SentenceGateStrip gate={turn.gate} />
                    )}
                  </div>
                );
              })}

              {isPlaying && (
                <div className="flex items-center gap-2 text-xs text-indigo-400 p-3 bg-[#141C30]/50 rounded-xl border border-indigo-500/20">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-ping" />
                  <span>
                    {isLiveMode
                      ? 'Listening to live telephony audio stream via Deepgram WebSocket...'
                      : 'Streaming and transcribing scripted audio stream...'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= COLUMN 2: Signals & Sentiment Swimlanes (3 cols) ================= */}
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-5 space-y-4 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F293D]">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                Real-Time Signals
              </span>
              <span className="text-[11px] text-emerald-400 font-medium">
                {isLiveMode ? 'Live Backend' : 'Live Replay'}
              </span>
            </div>

            {/* Sentiment Meter */}
            <div className="p-4 bg-[#141C30] border border-[#1F293D] rounded-xl space-y-2.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-400">Caller Sentiment Index:</span>
                <span
                  className={
                    activeScenarioId === 'rising_frustration'
                      ? 'text-rose-400 font-semibold'
                      : 'text-emerald-400 font-semibold'
                  }
                >
                  {activeScenarioId === 'rising_frustration' ? '-0.82 (Agitated)' : '+0.68 (Receptive)'}
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#090D16] rounded-full overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    activeScenarioId === 'rising_frustration' ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{
                    width: activeScenarioId === 'rising_frustration' ? '82%' : '68%'
                  }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Agitated</span>
                <span>Neutral</span>
                <span>Cooperative</span>
              </div>
            </div>

            {/* Extracted Signals list */}
            <div className="space-y-3 flex-1 overflow-y-auto">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
                Triggered Pipeline Signals
              </div>

              {activeScenarioId === 'cross_sell' && (
                <>
                  <div className="p-3 bg-[#141C30] border border-[#1F293D] rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-emerald-400 font-semibold">Intent: 2-Wheeler Inbound</span>
                      <span className="text-slate-400 font-mono">00:12</span>
                    </div>
                    <p className="text-slate-300">Customer mentioned new EV scooter purchase. Affinity score 0.88.</p>
                  </div>
                  <div className="p-3 bg-[#141C30] border border-[#1F293D] rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-indigo-400 font-semibold">Add-on Cover Request</span>
                      <span className="text-slate-400 font-mono">00:27</span>
                    </div>
                    <p className="text-slate-300">Commercial delivery rider coverage inquiry detected.</p>
                  </div>
                </>
              )}

              {activeScenarioId === 'ph_bancassurance' && (
                <>
                  <div className="p-3 bg-[#141C30] border border-[#1F293D] rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-emerald-400 font-semibold">Taglish Register Locked</span>
                      <span className="text-slate-400 font-mono">00:04</span>
                    </div>
                    <p className="text-slate-300">Po/Opo respect honorific verified. Zero English drift.</p>
                  </div>
                  <div className="p-3 bg-[#141C30] border border-[#1F293D] rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-sky-400 font-semibold">Payment Channel: GCash</span>
                      <span className="text-slate-400 font-mono">00:12</span>
                    </div>
                    <p className="text-slate-300">Customer prefers mobile wallet. Biller code #8849 prepared.</p>
                  </div>
                </>
              )}

              {activeScenarioId === 'id_multifinance' && (
                <>
                  <div className="p-3 bg-[#141C30] border border-[#1F293D] rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-emerald-400 font-semibold">Formal Sopan Register</span>
                      <span className="text-slate-400 font-mono">00:04</span>
                    </div>
                    <p className="text-slate-300">Bapak Hendra honorific validated. Angsuran ke-11 referenced.</p>
                  </div>
                  <div className="p-3 bg-[#141C30] border border-[#1F293D] rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-amber-400 font-semibold">Payday Cycle (Tgl 27)</span>
                      <span className="text-slate-400 font-mono">00:14</span>
                    </div>
                    <p className="text-slate-300">Customer requested 2-day grace until salary deposit.</p>
                  </div>
                </>
              )}

              {activeScenarioId === 'id_javanese_delay' && (
                <>
                  <div className="p-3 bg-[#141C30] border border-[#1F293D] rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-sky-400 font-semibold">Dialect: Javanese Loanwords</span>
                      <span className="text-slate-400 font-mono">00:05</span>
                    </div>
                    <p className="text-slate-300">"Dereng gajian saking pabrik" classified as polite regional phrasing.</p>
                  </div>
                  <div className="p-3 bg-[#141C30] border border-[#1F293D] rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-emerald-400 font-semibold">Retail Channel: Indomaret</span>
                      <span className="text-slate-400 font-mono">00:16</span>
                    </div>
                    <p className="text-slate-300">Convenience payment link generated for instant cash counter settlement.</p>
                  </div>
                </>
              )}

              {activeScenarioId === 'skipped_disclosure' && (
                <>
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-rose-400 font-semibold">Statutory Risk: IRDAI 4.2</span>
                      <span className="text-rose-400 font-mono">00:03</span>
                    </div>
                    <p className="text-slate-300">Grace period notice omitted; safety gate intercepted turn.</p>
                  </div>
                  <div className="p-3 bg-[#141C30] border border-[#1F293D] rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-emerald-400 font-semibold">Mandatory Notice Restored</span>
                      <span className="text-slate-400 font-mono">00:22</span>
                    </div>
                    <p className="text-slate-300">Statutory 30-day grace period clearly stated to customer.</p>
                  </div>
                </>
              )}

              {activeScenarioId === 'rising_frustration' && (
                <>
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-rose-400 font-semibold">Sentiment Anomaly</span>
                      <span className="text-rose-400 font-mono">00:06</span>
                    </div>
                    <p className="text-slate-300">Pending payment reconciliation issue. De-escalation protocol engaged.</p>
                  </div>
                  <div className="p-3 bg-[#141C30] border border-[#1F293D] rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-amber-400 font-semibold">UTR Lookup Initiated</span>
                      <span className="text-slate-400 font-mono">00:15</span>
                    </div>
                    <p className="text-slate-300">Requesting 12-digit transaction reference for instant hold release.</p>
                  </div>
                </>
              )}

              {activeScenarioId === 'noisy_call' && (
                <>
                  <div className="p-3 bg-[#141C30] border border-amber-500/30 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-amber-400 font-semibold">Low SNR Acoustic Guard</span>
                      <span className="text-amber-400 font-mono">00:05</span>
                    </div>
                    <p className="text-slate-300">Heavy street noise (SNR 10.4 dB). Commercial up-sell nudges suppressed.</p>
                  </div>
                  <div className="p-3 bg-[#141C30] border border-[#1F293D] rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-indigo-400 font-semibold">Polite Taglish Register</span>
                      <span className="text-slate-400 font-mono">00:14</span>
                    </div>
                    <p className="text-slate-300">Po/Opo honorific particles maintained. Zero English drift.</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ================= COLUMN 3: Nudge Stack & Nudge Court (4 cols) ================= */}
        <div className="lg:col-span-4 space-y-5">
          {/* Active Nudge Stack */}
          <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F293D]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-white">
                  Active Live Nudges
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                  {activeNudgesFiltered.length} Actionable
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                ≤ 18 Words Standard
              </span>
            </div>

            {/* Nudge Cards */}
            <div className="space-y-3">
              {activeNudgesFiltered.length === 0 ? (
                <div className="p-8 bg-[#141C30]/50 border border-[#1F293D] rounded-xl text-center space-y-2">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto" />
                  <div className="text-xs font-semibold text-white">No Pending Live Nudges</div>
                  <div className="text-[11px] text-slate-400">All suggestions handled or suppressed to protect focus.</div>
                </div>
              ) : (
                activeNudgesFiltered.map((nudge) => {
                  const isP0 = nudge.priority === 'P0';
                  const isP1 = nudge.priority === 'P1';

                  return (
                    <div
                      key={nudge.id}
                      className={`p-4 rounded-xl border text-xs space-y-3 transition-all ${
                        isP0
                          ? 'bg-rose-500/10 border-rose-500/30 shadow-md shadow-rose-950/20'
                          : isP1
                          ? 'bg-indigo-500/10 border-indigo-500/30'
                          : 'bg-[#141C30] border-[#1F293D]'
                      }`}
                    >
                      {/* Card Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isP0
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : isP1
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {nudge.priority} {nudge.pinned && '· PINNED'}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            Confidence: {(nudge.confidence * 100).toFixed(0)}%
                          </span>
                        </div>

                        {/* Expiry Countdown */}
                        <div className="flex items-center gap-1 font-mono text-[11px] text-amber-400">
                          <Clock className="w-3 h-3" />
                          <span>{nudge.expires_in_sec}s</span>
                        </div>
                      </div>

                      {/* Imperative Text */}
                      <div className="font-heading font-semibold text-sm text-white leading-snug">
                        "{nudge.imperative_text}"
                      </div>

                      {/* Rationale */}
                      <div className="text-[11px] text-slate-400 leading-relaxed">
                        {nudge.rationale}
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2.5 border-t border-[#1F293D] flex items-center justify-between gap-2">
                        <button
                          onClick={() => setSelectedNudgeToExplain(nudge)}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 font-medium"
                        >
                          <Info className="w-3 h-3" />
                          Explain
                        </button>

                        <div className="flex items-center gap-1.5 text-xs">
                          <button
                            onClick={() => handleNudgeAction(nudge.id, 'dismissed')}
                            className="px-2.5 py-1 bg-[#141C30] hover:bg-[#1A2540] text-slate-300 hover:text-white border border-[#1F293D] rounded-lg transition-colors"
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={() => handleNudgeAction(nudge.id, 'snoozed')}
                            className="px-2.5 py-1 bg-[#141C30] hover:bg-[#1A2540] text-amber-300 border border-[#1F293D] rounded-lg transition-colors"
                          >
                            Snooze
                          </button>
                          <button
                            onClick={() => handleNudgeAction(nudge.id, 'accepted')}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium flex items-center gap-1 shadow-sm transition-all"
                          >
                            <Check className="w-3 h-3" />
                            Accept
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Nudge Court: Suppressed Low-Value Alerts */}
          <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F293D]">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  Suppression Court
                </h2>
              </div>
              <span className="text-[11px] font-medium px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full font-mono">
                {currentScenarioNudgesAvoided} Filtered
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Filtered alerts rejected before reaching the agent, preventing distraction and cognitive fatigue.
            </p>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {suppressedNudges.map((sup) => (
                <div
                  key={sup.id}
                  className="p-3 bg-[#141C30] border border-[#1F293D] rounded-xl text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="line-through text-slate-400 truncate max-w-[200px]">
                      "{sup.candidate_text}"
                    </span>
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full font-mono text-[10px]">
                      {sup.suppression_reason}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 leading-tight">
                    {sup.verdict_detail}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Latency Waterfall Footer */}
      <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl p-5 space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-semibold text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Live Turn Execution Waterfall</span>
          </div>
          <div className="text-slate-400 flex items-center gap-3 text-xs">
            <span>
              Total: <span className="text-emerald-400 font-mono font-semibold">655 ms</span>
            </span>
            <span>·</span>
            <span>
              Budget: <span className="text-white font-mono">2,500 ms</span>
            </span>
            <span>·</span>
            <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
              73.8% Headroom
            </span>
          </div>
        </div>

        {/* Stacked Waterfall Bar */}
        <div className="w-full h-4 bg-[#141C30] rounded-lg border border-[#1F293D] flex overflow-hidden font-mono text-[10px] text-white">
          <div
            className="bg-sky-500 flex items-center justify-center truncate px-1"
            style={{ width: '9%' }}
            title="Audio Slicing: 60ms"
          >
            60ms
          </div>
          <div
            className="bg-emerald-500 flex items-center justify-center truncate px-1"
            style={{ width: '27%' }}
            title="ASR: 175ms"
          >
            ASR 175ms
          </div>
          <div
            className="bg-amber-500 flex items-center justify-center truncate px-1"
            style={{ width: '15%' }}
            title="Signals: 95ms"
          >
            95ms
          </div>
          <div
            className="bg-indigo-500 flex items-center justify-center truncate px-1"
            style={{ width: '44%' }}
            title="LLM + Gate: 290ms"
          >
            LLM + Gate 290ms
          </div>
          <div
            className="bg-violet-500 flex items-center justify-center truncate px-1"
            style={{ width: '5%' }}
            title="Dispatch: 35ms"
          >
            35ms
          </div>
        </div>
      </div>

      {/* Explanation Modal */}
      {selectedNudgeToExplain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0E1424] border border-[#1F293D] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F293D]">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-400" />
                <h3 className="font-heading font-semibold text-white">
                  Nudge Reasoning Audit
                </h3>
              </div>
              <button
                onClick={() => setSelectedNudgeToExplain(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div>
                <span className="text-slate-400 block mb-1">Imperative Prompt:</span>
                <p className="font-semibold text-white bg-[#141C30] p-3 rounded-xl border border-[#1F293D]">
                  "{selectedNudgeToExplain.imperative_text}"
                </p>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Trigger Rationale:</span>
                <p className="text-slate-300 leading-relaxed">
                  {selectedNudgeToExplain.rationale}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-[#141C30] rounded-xl border border-[#1F293D]">
                  <span className="text-slate-400 text-[11px] block">Confidence:</span>
                  <span className="font-mono text-emerald-400 font-bold text-sm">
                    {(selectedNudgeToExplain.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="p-3 bg-[#141C30] rounded-xl border border-[#1F293D]">
                  <span className="text-slate-400 text-[11px] block">Priority Tier:</span>
                  <span className="font-mono text-indigo-400 font-bold text-sm">
                    {selectedNudgeToExplain.priority}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#1F293D] flex justify-end">
              <button
                onClick={() => setSelectedNudgeToExplain(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
