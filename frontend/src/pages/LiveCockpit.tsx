import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { mockScenarios } from '../data/mockLiveData';

import type { ScenarioDefinition } from '../data/mockLiveData';
import type { LiveNudge, SuppressedNudge } from '../types';
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
  Check
} from 'lucide-react';

export const LiveCockpit: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialScenario = searchParams.get('scenario') || 'cross_sell';

  const [activeScenarioId, setActiveScenarioId] = useState<string>(initialScenario);
  const scenario: ScenarioDefinition = mockScenarios[activeScenarioId] || mockScenarios.cross_sell;

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTurnIdx, setCurrentTurnIdx] = useState<number>(scenario.turns.length);
  const [activeNudges, setActiveNudges] = useState<LiveNudge[]>(scenario.nudges);
  const [suppressedNudges, setSuppressedNudges] = useState<SuppressedNudge[]>(scenario.suppressedNudges);
  const [selectedNudgeToExplain, setSelectedNudgeToExplain] = useState<LiveNudge | null>(null);
  const [streamSource, setStreamSource] = useState<'replay_1x' | 'replay_chaos' | 'live_mic'>('replay_1x');
  const [audioMuted, setAudioMuted] = useState(false);
  const [chaosSnr, setChaosSnr] = useState(24);

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

  // Live WebSocket wiring
  const isLiveMode = import.meta.env.VITE_API_MODE === 'live';
  useEffect(() => {
    if (!isLiveMode) return;
    const ws = new WebSocket('ws://127.0.0.1:8000/ws/nudges');
    ws.onmessage = (event) => {
      try {
        const nudgeData = JSON.parse(event.data);
        const newNudge: LiveNudge = {
          id: nudgeData.id,
          type: nudgeData.type,
          title: nudgeData.title,
          text: nudgeData.text,
          status: 'active',
          priority: nudgeData.priority,
          timestamp: new Date().toISOString().substring(11,19),
          confidence: 0.95
        };
        setActiveNudges(prev => [newNudge, ...prev]);
      } catch (err) {
        console.error('WS Error', err);
      }
    };
    return () => ws.close();
  }, [isLiveMode]);

  const handleNudgeAction = (nudgeId: string, action: 'accepted' | 'dismissed' | 'snoozed') => {
    setActiveNudges((prev) =>
      prev.map((n) => (n.id === nudgeId ? { ...n, status: action } : n))
    );
  };

  const visibleTurns = scenario.turns.slice(0, currentTurnIdx);
  const activeNudgesFiltered = activeNudges.filter((n) => n.status === 'active');
  const acceptedNudgesCount = activeNudges.filter((n) => n.status === 'accepted').length;

  const currentScenarioNudgesAvoided = suppressedNudges.length;

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto select-none">
      {!isLiveMode && (
        <div className="bg-[#1A1A0A] border border-[#F4A535]/40 text-[#F4A535] px-4 py-2 rounded text-xs font-mono flex items-center gap-2">
          <Info className="w-4 h-4" />
          Running in MOCK mode (VITE_API_MODE is not 'live'). Displaying simulated scripted scenarios.
        </div>
      )}
      
      {/* Top Cockpit Control Bar */}
      <div className="bg-[#121821] border border-[#243041] rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#122329] border border-[#4CC9F0]/40 rounded text-[#4CC9F0]">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-lg font-bold text-[#E6EDF5]">
                Live Nudge Cockpit
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#121E2A] text-[#4CC9F0] border border-[#4CC9F0]/40 rounded font-semibold">
                STREAMING REPLAY · 60 FPS
              </span>
            </div>
            <p className="text-xs text-[#8A97A8]">
              Active Session: <span className="font-mono text-[#E6EDF5]">{scenario.policyNo}</span> ({scenario.caller})
            </p>
          </div>
        </div>

        {/* 4 One-Click Scenario Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveScenarioId('cross_sell')}
            className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors ${
              activeScenarioId === 'cross_sell'
                ? 'bg-[#18212D] text-[#3DDC97] border border-[#3DDC97]/60'
                : 'bg-[#0B0F14] text-[#8A97A8] border border-[#243041] hover:text-[#E6EDF5]'
            }`}
          >
            1. Cross-Sell
          </button>
          <button
            onClick={() => setActiveScenarioId('skipped_disclosure')}
            className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors ${
              activeScenarioId === 'skipped_disclosure'
                ? 'bg-[#18212D] text-[#FF5C6C] border border-[#FF5C6C]/60'
                : 'bg-[#0B0F14] text-[#8A97A8] border border-[#243041] hover:text-[#E6EDF5]'
            }`}
          >
            2. Skipped Disclosure
          </button>
          <button
            onClick={() => setActiveScenarioId('rising_frustration')}
            className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors ${
              activeScenarioId === 'rising_frustration'
                ? 'bg-[#18212D] text-[#FFB547] border border-[#FFB547]/60'
                : 'bg-[#0B0F14] text-[#8A97A8] border border-[#243041] hover:text-[#E6EDF5]'
            }`}
          >
            3. Rising Frustration
          </button>
          <button
            onClick={() => setActiveScenarioId('noisy_call')}
            className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors ${
              activeScenarioId === 'noisy_call'
                ? 'bg-[#18212D] text-[#4CC9F0] border border-[#4CC9F0]/60'
                : 'bg-[#0B0F14] text-[#8A97A8] border border-[#243041] hover:text-[#E6EDF5]'
            }`}
          >
            4. Noisy Ambiguous Call
          </button>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ================= COLUMN 1: Audio & Streaming Transcript (5 cols) ================= */}
        <div className="lg:col-span-5 space-y-4">
          {/* Audio Ingest & Waveform */}
          <div className="bg-[#121821] border border-[#243041] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[#8A97A8] font-semibold">
                Audio Stream & Ingest Control
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={streamSource}
                  onChange={(e) => setStreamSource(e.target.value as any)}
                  className="bg-[#0B0F14] border border-[#243041] text-[#E6EDF5] text-xs font-mono rounded px-2 py-1 focus:outline-none"
                >
                  <option value="replay_1x">Replay Scripted Stream (1.0x)</option>
                  <option value="replay_chaos">Replay with Chaos Noise</option>
                  <option value="live_mic">Browser Mic (Live Audio)</option>
                </select>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 bg-[#18212D] hover:bg-[#243041] text-[#E6EDF5] rounded border border-[#243041]"
                  title={isPlaying ? 'Pause simulation' : 'Resume simulation'}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-[#3DDC97]" />}
                </button>
                <button
                  onClick={() => setCurrentTurnIdx(scenario.turns.length)}
                  className="p-1.5 bg-[#18212D] hover:bg-[#243041] text-[#8A97A8] hover:text-[#E6EDF5] rounded border border-[#243041]"
                  title="Reset to full conversation"
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
              <div className="p-2.5 bg-[#0B0F14] border border-[#243041] rounded space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-[#8A97A8]">
                  <span>Injected Acoustic Noise (SNR):</span>
                  <span className="text-[#FFB547] font-semibold">{chaosSnr} dB</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="35"
                  value={chaosSnr}
                  onChange={(e) => setChaosSnr(Number(e.target.value))}
                  className="w-full h-1 bg-[#243041] rounded-lg appearance-none cursor-pointer accent-[#FFB547]"
                />
              </div>
            )}
          </div>

          {/* Streaming Transcript Lanes */}
          <div className="bg-[#121821] border border-[#243041] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#243041]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-[#8A97A8] font-semibold">
                  Live Streaming Transcript
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#0B0F14] text-[#3DDC97] border border-[#243041] rounded">
                  Dual-Lane
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#57677D]">
                ASR: Deepgram Nova-2 Telephony
              </span>
            </div>

            {/* Turns list */}
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {visibleTurns.map((turn) => {
                const isAgent = turn.speaker === 'agent';
                return (
                  <div
                    key={turn.id}
                    className={`p-3 rounded-md border text-xs ${
                      isAgent
                        ? 'bg-[#151D28] border-[#243041] ml-2'
                        : 'bg-[#18212D] border-[#243041] mr-2'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5 text-[11px] font-mono">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold px-1.5 py-0.2 rounded ${
                            isAgent
                              ? 'bg-[#122329] text-[#4CC9F0] border border-[#4CC9F0]/40'
                              : 'bg-[#0B0F14] text-[#E6EDF5] border border-[#243041]'
                          }`}
                        >
                          {isAgent ? 'BOT AGENT' : 'CALLER'}
                        </span>
                        <span className="text-[#57677D]">{turn.timestamp}</span>
                        {turn.language && (
                          <span className="text-[#8A97A8] bg-[#0B0F14] px-1 rounded">
                            {turn.language}
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-[#57677D] flex items-center gap-1.5">
                        <span>ASR {turn.asr_latency_ms}ms</span>
                        <span>·</span>
                        <span>Conf {((turn.confidence || 0.98) * 100).toFixed(0)}%</span>
                      </div>
                    </div>

                    <p className="text-[#E6EDF5] leading-relaxed select-text font-sans">
                      {turn.text}
                    </p>

                    {/* Sentence Gate Visualizer if turn is from agent */}
                    {isAgent && turn.gate && (
                      <SentenceGateStrip gate={turn.gate} />
                    )}
                  </div>
                );
              })}

              {/* Streaming typing indicator */}
              {isPlaying && (
                <div className="flex items-center gap-2 text-xs font-mono text-[#4CC9F0] p-2 bg-[#0B0F14] rounded border border-[#243041]">
                  <span className="w-1.5 h-1.5 bg-[#4CC9F0] rounded-full animate-ping" />
                  <span>Listening & transcribing streaming audio chunk...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= COLUMN 2: Signal Timeline & Sentiment Swimlanes (3 cols) ================= */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-[#121821] border border-[#243041] rounded-lg p-4 space-y-4 h-full flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-[#243041]">
              <span className="text-xs font-mono uppercase tracking-wider text-[#8A97A8] font-semibold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#3DDC97]" />
                Signal Timeline
              </span>
              <span className="text-[11px] font-mono text-[#3DDC97]">
                Live Swimlanes
              </span>
            </div>

            {/* Sentiment Meter */}
            <div className="p-3 bg-[#18212D] border border-[#243041] rounded space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#8A97A8]">Caller Sentiment Index:</span>
                <span
                  className={`font-semibold ${
                    activeScenarioId === 'rising_frustration'
                      ? 'text-[#FF5C6C]'
                      : 'text-[#3DDC97]'
                  }`}
                >
                  {activeScenarioId === 'rising_frustration' ? '-0.82 (Agitated)' : '+0.64 (Receptive)'}
                </span>
              </div>
              <div className="w-full h-2 bg-[#0B0F14] rounded-full overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-300 ${
                    activeScenarioId === 'rising_frustration' ? 'bg-[#FF5C6C]' : 'bg-[#3DDC97]'
                  }`}
                  style={{
                    width: activeScenarioId === 'rising_frustration' ? '82%' : '64%'
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-[#57677D]">
                <span>Frustrated</span>
                <span>Neutral</span>
                <span>Cooperative</span>
              </div>
            </div>

            {/* Live Detected Signals list */}
            <div className="space-y-2.5 flex-1 overflow-y-auto">
              <div className="text-[11px] font-mono text-[#8A97A8] uppercase tracking-wider">
                Extracted Real-Time Signals
              </div>

              {activeScenarioId === 'cross_sell' && (
                <>
                  <div className="p-2.5 bg-[#0B0F14] border border-[#243041] rounded text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#3DDC97] font-semibold">BUYING SIGNAL: 2-WHEELER</span>
                      <span className="text-[#57677D]">00:12</span>
                    </div>
                    <p className="text-[#8A97A8]">Customer mentioned new EV scooter acquisition. Affinity 0.88.</p>
                  </div>
                  <div className="p-2.5 bg-[#0B0F14] border border-[#243041] rounded text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#4CC9F0] font-semibold">POLICY INQUIRY: ADD-ON</span>
                      <span className="text-[#57677D]">00:27</span>
                    </div>
                    <p className="text-[#8A97A8]">Question regarding commercial delivery rider coverage.</p>
                  </div>
                </>
              )}

              {activeScenarioId === 'skipped_disclosure' && (
                <>
                  <div className="p-2.5 bg-[#1F1416] border border-[#FF5C6C]/40 rounded text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#FF5C6C] font-semibold">COMPLIANCE RISK: IRDAI 4.2</span>
                      <span className="text-[#FF5C6C]">00:03</span>
                    </div>
                    <p className="text-[#8A97A8]">Agent skipped 30-day grace period notice; triggered safety gate correction.</p>
                  </div>
                  <div className="p-2.5 bg-[#0B0F14] border border-[#243041] rounded text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#3DDC97] font-semibold">DISCLOSURE RESTORED</span>
                      <span className="text-[#57677D]">00:22</span>
                    </div>
                    <p className="text-[#8A97A8]">Statutory grace period and active medical cover confirmed to caller.</p>
                  </div>
                </>
              )}

              {activeScenarioId === 'rising_frustration' && (
                <>
                  <div className="p-2.5 bg-[#1F1416] border border-[#FF5C6C]/40 rounded text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#FF5C6C] font-semibold">NEGATIVE SENTIMENT SPIKE</span>
                      <span className="text-[#FF5C6C]">00:06</span>
                    </div>
                    <p className="text-[#8A97A8]">Unacknowledged UPI debit (Rs 14,500). De-escalation protocol engaged.</p>
                  </div>
                  <div className="p-2.5 bg-[#0B0F14] border border-[#243041] rounded text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#FFB547] font-semibold">RECONCILIATION INITIATED</span>
                      <span className="text-[#57677D]">00:15</span>
                    </div>
                    <p className="text-[#8A97A8]">Requesting 12-digit bank UTR reference for immediate ledger release.</p>
                  </div>
                </>
              )}

              {activeScenarioId === 'noisy_call' && (
                <>
                  <div className="p-2.5 bg-[#18212D] border border-[#FFB547]/40 rounded text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#FFB547] font-semibold">LOW SNR ACOUSTIC GUARD</span>
                      <span className="text-[#FFB547]">00:05</span>
                    </div>
                    <p className="text-[#8A97A8]">Street noise detected (SNR 10.4 dB). Commercial upsell nudges throttled.</p>
                  </div>
                  <div className="p-2.5 bg-[#0B0F14] border border-[#243041] rounded text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#3DDC97] font-semibold">POLITE TAGLISH REGISTER</span>
                      <span className="text-[#57677D]">00:14</span>
                    </div>
                    <p className="text-[#8A97A8]">Warm respectful po/opo tone maintained. Zero English drift.</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ================= COLUMN 3: Nudge Stack & Nudge Court (4 cols) ================= */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Nudge Stack */}
          <div className="bg-[#121821] border border-[#243041] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#243041]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-[#E6EDF5] font-semibold">
                  Active Live Nudges
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-[#18212D] text-[#3DDC97] border border-[#243041] rounded font-semibold">
                  {activeNudgesFiltered.length} Pending
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#57677D]">
                ≤ 18 Words Standard
              </span>
            </div>

            {/* Nudge Cards */}
            <div className="space-y-3">
              {activeNudgesFiltered.length === 0 ? (
                <div className="p-6 bg-[#0B0F14] border border-[#243041] rounded text-center space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-[#3DDC97] mx-auto" />
                  <div className="text-xs font-mono text-[#E6EDF5]">No Pending Live Nudges</div>
                  <div className="text-[11px] text-[#8A97A8]">All actionable nudges handled or suppressed.</div>
                </div>
              ) : (
                activeNudgesFiltered.map((nudge) => {
                  const isP0 = nudge.priority === 'P0';
                  const isP1 = nudge.priority === 'P1';

                  return (
                    <div
                      key={nudge.id}
                      className={`p-3.5 rounded-md border text-xs space-y-2.5 transition-all ${
                        isP0
                          ? 'bg-[#1F1416] border-[#FF5C6C] shadow-sm'
                          : isP1
                          ? 'bg-[#18212D] border-[#3DDC97]/60'
                          : 'bg-[#151D28] border-[#243041]'
                      }`}
                    >
                      {/* Card Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isP0
                                ? 'bg-[#251417] text-[#FF5C6C] border border-[#FF5C6C]/40'
                                : isP1
                                ? 'bg-[#13221C] text-[#3DDC97] border border-[#3DDC97]/40'
                                : 'bg-[#121E2A] text-[#4CC9F0] border border-[#4CC9F0]/40'
                            }`}
                          >
                            {nudge.priority} {nudge.pinned && '· PINNED'}
                          </span>
                          <span className="font-mono text-[10px] text-[#8A97A8]">
                            Conf: {(nudge.confidence * 100).toFixed(0)}%
                          </span>
                        </div>

                        {/* Expiry Countdown ring / badge */}
                        <div className="flex items-center gap-1 font-mono text-[10px] text-[#FFB547]">
                          <Clock className="w-3 h-3" />
                          <span>{nudge.expires_in_sec}s</span>
                        </div>
                      </div>

                      {/* Imperative Text */}
                      <div className="font-heading font-semibold text-sm text-[#E6EDF5] leading-snug">
                        "{nudge.imperative_text}"
                      </div>

                      {/* Rationale */}
                      <div className="text-[11px] text-[#8A97A8] leading-tight">
                        {nudge.rationale}
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 border-t border-[#243041] flex items-center justify-between gap-2">
                        <button
                          onClick={() => setSelectedNudgeToExplain(nudge)}
                          className="text-[11px] font-mono text-[#4CC9F0] hover:underline flex items-center gap-1"
                        >
                          <Info className="w-3 h-3" />
                          Explain
                        </button>

                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <button
                            onClick={() => handleNudgeAction(nudge.id, 'dismissed')}
                            className="px-2 py-1 bg-[#18212D] hover:bg-[#243041] text-[#8A97A8] hover:text-[#E6EDF5] border border-[#243041] rounded"
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={() => handleNudgeAction(nudge.id, 'snoozed')}
                            className="px-2 py-1 bg-[#18212D] hover:bg-[#243041] text-[#FFB547] border border-[#243041] rounded"
                          >
                            Snooze
                          </button>
                          <button
                            onClick={() => handleNudgeAction(nudge.id, 'accepted')}
                            className="px-2.5 py-1 bg-[#13221C] hover:bg-[#1A3328] text-[#3DDC97] border border-[#3DDC97]/60 rounded font-semibold flex items-center gap-1"
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

          {/* Nudge Court: Loud & Beautiful False-Positive Suppression Proof */}
          <div className="bg-[#121821] border border-[#243041] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#243041]">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#FFB547]" />
                <h2 className="text-xs font-mono uppercase tracking-wider text-[#FFB547] font-semibold">
                  Nudge Court (Suppressed Alerts)
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#261E14] text-[#FFB547] border border-[#FFB547]/40 rounded font-semibold">
                {currentScenarioNudgesAvoided} Avoided
              </span>
            </div>

            <p className="text-[11px] text-[#8A97A8]">
              Suppression is the core proof of false-positive control. Low-value alerts are rejected before reaching the agent.
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {suppressedNudges.map((sup) => (
                <div
                  key={sup.id}
                  className="p-2.5 bg-[#0B0F14] border border-[#243041] rounded text-xs space-y-1 font-mono"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="line-through text-[#8A97A8] font-sans truncate max-w-[200px]">
                      "{sup.candidate_text}"
                    </span>
                    <span className="px-1.5 py-0.2 bg-[#251417] text-[#FFB547] border border-[#FFB547]/30 rounded text-[10px]">
                      {sup.suppression_reason}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#57677D] leading-tight">
                    {sup.verdict_detail}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM DOCK: Latency Waterfall (ms breakdown against budget) ================= */}
      <div className="bg-[#121821] border border-[#243041] rounded-lg p-4 space-y-2 select-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3DDC97]" />
            <span className="text-[#E6EDF5] font-semibold">
              Live Nudge Latency Waterfall (Latest Turn Turn-around)
            </span>
          </div>
          <div className="text-[#8A97A8] flex items-center gap-3 text-[11px]">
            <span>
              Total: <span className="text-[#3DDC97] font-semibold">655 ms</span>
            </span>
            <span>·</span>
            <span>
              Budget Line: <span className="text-[#E6EDF5]">2,500 ms</span>
            </span>
            <span>·</span>
            <span className="text-[#3DDC97] bg-[#13221C] px-1.5 py-0.5 rounded border border-[#3DDC97]/40">
              WITHIN BUDGET (73.8% Headroom)
            </span>
          </div>
        </div>

        {/* Stacked Waterfall Bar without gradients */}
        <div className="space-y-1.5">
          <div className="w-full h-5 bg-[#0B0F14] rounded border border-[#243041] flex overflow-hidden font-mono text-[10px] text-[#0B0F14] font-semibold">
            {/* Audio Chunk: 60ms (9%) */}
            <div
              className="bg-[#4CC9F0] flex items-center justify-center truncate px-1"
              style={{ width: '9%' }}
              title="Audio Chunk Slicing: 60ms"
            >
              Chunk 60ms
            </div>
            {/* ASR: 175ms (27%) */}
            <div
              className="bg-[#3DDC97] flex items-center justify-center truncate px-1"
              style={{ width: '27%' }}
              title="Streaming ASR: 175ms (Deepgram Nova-2)"
            >
              ASR 175ms
            </div>
            {/* Signal Extraction: 95ms (15%) */}
            <div
              className="bg-[#FFB547] flex items-center justify-center truncate px-1"
              style={{ width: '15%' }}
              title="Signal Classification: 95ms"
            >
              Signal 95ms
            </div>
            {/* LLM Inference: 290ms (44%) */}
            <div
              className="bg-[#A78BFA] flex items-center justify-center truncate px-1"
              style={{ width: '44%' }}
              title="LLM Synthesis & Gate: 290ms (Claude 3.5 Haiku)"
            >
              LLM + Gate 290ms
            </div>
            {/* WebRTC Delivery: 35ms (5%) */}
            <div
              className="bg-[#E6EDF5] flex items-center justify-center truncate px-1"
              style={{ width: '5%' }}
              title="WebSocket Client Delivery: 35ms"
            >
              35ms
            </div>
          </div>

          <div className="flex justify-between text-[10px] font-mono text-[#57677D]">
            <span>0 ms</span>
            <span>500 ms</span>
            <span>1,000 ms</span>
            <span>1,500 ms</span>
            <span>2,000 ms</span>
            <span className="text-[#FF5C6C]">2,500 ms (Strict Budget)</span>
          </div>
        </div>
      </div>

      {/* Explain Nudge Modal */}
      {selectedNudgeToExplain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70"
            onClick={() => setSelectedNudgeToExplain(null)}
          />
          <div className="relative w-full max-w-lg bg-[#121821] border border-[#243041] rounded-lg p-5 z-10 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#243041]">
              <span className="text-[#3DDC97] font-semibold text-sm">
                Nudge Execution Diagnostics
              </span>
              <button
                onClick={() => setSelectedNudgeToExplain(null)}
                className="text-[#8A97A8] hover:text-[#E6EDF5]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-[#8A97A8]">NUDGE ID:</span>
                <span className="text-[#E6EDF5] ml-2">{selectedNudgeToExplain.id}</span>
              </div>
              <div>
                <span className="text-[#8A97A8]">TRIGGER TEXT:</span>
                <p className="text-[#E6EDF5] font-sans text-sm mt-0.5">
                  "{selectedNudgeToExplain.imperative_text}"
                </p>
              </div>
              <div>
                <span className="text-[#8A97A8]">RATIONALE:</span>
                <p className="text-[#8A97A8] font-sans mt-0.5">
                  {selectedNudgeToExplain.rationale}
                </p>
              </div>
              <div className="p-3 bg-[#0B0F14] border border-[#243041] rounded space-y-1">
                <div className="text-[#3DDC97] font-semibold">Confidence Formulation:</div>
                <div className="text-[11px] text-[#8A97A8]">
                  Signal Affinity (0.92) × Acoustic Quality (0.96) × Topic Weight (1.0) = {(selectedNudgeToExplain.confidence * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#243041] flex justify-end">
              <button
                onClick={() => setSelectedNudgeToExplain(null)}
                className="px-3 py-1.5 bg-[#18212D] text-[#E6EDF5] rounded border border-[#243041]"
              >
                Close Diagnostics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
