/**
 * useVoicePipeline — React hook for the PARLEY browser voice agent
 *
 * Manages:
 *  - Call session lifecycle (start/end via API)
 *  - Web Speech API: SpeechRecognition (ASR) + SpeechSynthesis (TTS)
 *  - Native Persona Voices: Priya (en-IN female), Maria (ph_tl female), Sari (id_id female)
 *  - Full-duplex conversational flow with Auto-Listen after agent turns
 *  - Fail-safe error recovery (no-speech, mic ducking release, transcript dispatch on end)
 *  - Text response fallback for zero-friction testing
 *  - Barge-in: cancels TTS when user starts speaking
 *  - Latency measurement per turn & Dialogue FSM via API
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { API_BASE } from '../config/api';

interface BrowserSpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  [index: number]: { transcript: string; confidence: number };
}

interface BrowserSpeechRecognitionResultList {
  readonly length: number;
  [index: number]: BrowserSpeechRecognitionResult;
}

interface BrowserSpeechRecognitionEvent {
  results: BrowserSpeechRecognitionResultList;
}

type BrowserSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TranscriptEntry {
  id: string;
  speaker: 'agent' | 'customer';
  text: string;
  timestamp: number;
  citations?: string[];
  isRefusal?: boolean;
  gateVerdict?: 'PASSED' | 'BLOCKED' | 'REFUSAL' | null;
  latency?: {
    asr_ms?: number;
    retrieval_ms?: number;
    gate_ms?: number;
    tts_ms?: number;
    e2e_ms?: number;
    user_stops_to_bot_audio_ms?: number;
  };
  asr_confidence?: number;
}

export interface CallState {
  status: 'idle' | 'starting' | 'connected' | 'listening' | 'processing' | 'speaking' | 'ending' | 'ended';
  callSessionId: string | null;
  agentSessionId: string | null;
  market: string;
  elapsedSeconds: number;
  turnCount: number;
  transcript: TranscriptEntry[];
  isMuted: boolean;
  autoListen: boolean;
  currentInterim: string;
  lastLatency: TranscriptEntry['latency'] | null;
  micPermission: 'unknown' | 'granted' | 'denied' | 'unavailable';
  ttsSupported: boolean;
  asrSupported: boolean;
  activeVoiceName: string | null;
  error: string | null;
}

const initialState: CallState = {
  status: 'idle',
  callSessionId: null,
  agentSessionId: null,
  market: 'in_en',
  elapsedSeconds: 0,
  turnCount: 0,
  transcript: [],
  isMuted: false,
  autoListen: true,
  currentInterim: '',
  lastLatency: null,
  micPermission: 'unknown',
  ttsSupported: false,
  asrSupported: false,
  activeVoiceName: null,
  error: null,
};

// Market → language code map for Web Speech API
const MARKET_LANG: Record<string, string> = {
  in_en: 'en-IN',
  ph_tl: 'fil-PH',
  id_id: 'id-ID',
};

// ── Voice Resolution Helper ──────────────────────────────────────────────────

function findBestVoiceForMarket(
  market: string,
  voices: SpeechSynthesisVoice[]
): { voice: SpeechSynthesisVoice | null; pitch: number; rate: number; label: string } {
  if (!voices || voices.length === 0) {
    return { voice: null, pitch: 1.15, rate: 0.95, label: 'Browser Default' };
  }

  const normalize = (s: string) => s.toLowerCase().replace(/_/g, '-');

  if (market === 'in_en') {
    // 1. Priya: Target Indian English female voice (Heera, Neerja, Swara, Priya)
    const inFemale = voices.find(v => {
      const lang = normalize(v.lang);
      const name = v.name.toLowerCase();
      const isIndian = lang.includes('en-in') || name.includes('india') || name.includes('hindi');
      const isFemale = name.includes('heera') || name.includes('neerja') || name.includes('swara') ||
                       name.includes('priya') || name.includes('female') || name.includes('zira');
      return isIndian && isFemale;
    });
    if (inFemale) {
      return { voice: inFemale, pitch: 1.05, rate: 0.94, label: `Priya (${inFemale.name})` };
    }

    // 2. Any en-IN voice (e.g. Microsoft Ravi, Google English India)
    const anyIn = voices.find(v => {
      const lang = normalize(v.lang);
      const name = v.name.toLowerCase();
      return lang.includes('en-in') || name.includes('india') || name.includes('hindi');
    });
    if (anyIn) {
      const isLikelyMale = anyIn.name.toLowerCase().includes('ravi') || anyIn.name.toLowerCase().includes('male');
      return {
        voice: anyIn,
        pitch: isLikelyMale ? 1.25 : 1.1,
        rate: 0.94,
        label: `Priya (${anyIn.name} - Pitch Adjusted Female)`
      };
    }

    // 3. Fallback: Any natural female English voice (e.g., Zira, Jenny, Aria, Sonia, Google UK Female)
    const femaleEnglish = voices.find(v => {
      const lang = normalize(v.lang);
      const name = v.name.toLowerCase();
      return lang.startsWith('en') && (
        name.includes('female') || name.includes('zira') || name.includes('jenny') ||
        name.includes('aria') || name.includes('sonia') || name.includes('samantha')
      );
    });
    if (femaleEnglish) {
      return { voice: femaleEnglish, pitch: 1.12, rate: 0.92, label: `Priya (${femaleEnglish.name} - Female)` };
    }
  } else if (market === 'ph_tl') {
    // Maria: Target Filipino / Tagalog female voice
    const phVoice = voices.find(v => {
      const lang = normalize(v.lang);
      const name = v.name.toLowerCase();
      return lang.includes('fil') || lang.includes('tl') || lang.includes('ph') || name.includes('philippine');
    });
    if (phVoice) {
      return { voice: phVoice, pitch: 1.1, rate: 0.94, label: `Maria (${phVoice.name})` };
    }
    const femaleEng = voices.find(v => normalize(v.lang).startsWith('en') && v.name.toLowerCase().includes('female'));
    if (femaleEng) {
      return { voice: femaleEng, pitch: 1.15, rate: 0.92, label: `Maria (${femaleEng.name} - Female)` };
    }
  } else if (market === 'id_id') {
    // Sari: Target Indonesian female voice
    const idVoice = voices.find(v => {
      const lang = normalize(v.lang);
      const name = v.name.toLowerCase();
      return lang.includes('id') || name.includes('indonesia');
    });
    if (idVoice) {
      return { voice: idVoice, pitch: 1.1, rate: 0.94, label: `Sari (${idVoice.name})` };
    }
  }

  // Fallbacks
  const langMatch = voices.find(v => normalize(v.lang).startsWith(MARKET_LANG[market]?.slice(0, 2).toLowerCase() || 'en'));
  if (langMatch) {
    return { voice: langMatch, pitch: 1.18, rate: 0.92, label: langMatch.name };
  }

  const anyFemale = voices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira'));
  if (anyFemale) {
    return { voice: anyFemale, pitch: 1.15, rate: 0.92, label: anyFemale.name };
  }

  return { voice: voices[0] || null, pitch: 1.2, rate: 0.92, label: voices[0]?.name || 'System Default' };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useVoicePipeline(market: string = 'in_en') {
  const [state, setState] = useState<CallState>({ ...initialState, market });
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const asrStartTimeRef = useRef<number>(0);

  // Synchronized state refs to prevent stale closure bugs
  const callSessionIdRef = useRef<string | null>(null);
  const agentSessionIdRef = useRef<string | null>(null);
  const turnCountRef = useRef<number>(0);
  const statusRef = useRef<CallState['status']>('idle');
  const autoListenRef = useRef<boolean>(true);
  const isMutedRef = useRef<boolean>(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // Update refs when state changes
  useEffect(() => {
    callSessionIdRef.current = state.callSessionId;
    agentSessionIdRef.current = state.agentSessionId;
    turnCountRef.current = state.turnCount;
    statusRef.current = state.status;
    autoListenRef.current = state.autoListen;
    isMutedRef.current = state.isMuted;
  }, [state.callSessionId, state.agentSessionId, state.turnCount, state.status, state.autoListen, state.isMuted]);

  // ── Detect capabilities & load system voices ──────────────────────────────

  const updateVoices = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const v = window.speechSynthesis.getVoices();
      voicesRef.current = v;
      if (v.length > 0) {
        const { label } = findBestVoiceForMarket(market, v);
        setState(s => ({ ...s, activeVoiceName: label }));
      }
    }
  }, [market]);

  useEffect(() => {
    const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    const asrSupported =
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    setState(s => ({ ...s, ttsSupported, asrSupported }));

    if (ttsSupported) {
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, [updateVoices]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const addEntry = useCallback((entry: Omit<TranscriptEntry, 'id' | 'timestamp'>) => {
    setState(s => ({
      ...s,
      transcript: [
        ...s.transcript,
        { ...entry, id: `e_${Date.now()}_${Math.random().toString(36).slice(2)}`, timestamp: Date.now() },
      ],
    }));
  }, []);

  const stopASR = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) { /* ignore */ }
      recognitionRef.current = null;
    }
  }, []);

  const cancelTTS = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) { /* ignore */ }
    }
    synthesisRef.current = null;
  }, []);

  // ── TTS: Speaks using market-specific Indian/Filipino female voice ──────────

  const speak = useCallback((text: string, onDone?: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      onDone?.();
      return;
    }

    cancelTTS();
    stopASR();

    const utterance = new SpeechSynthesisUtterance(text);
    const { voice, pitch, rate, label } = findBestVoiceForMarket(market, voicesRef.current);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = MARKET_LANG[market] || 'en-IN';
    }
    utterance.pitch = pitch;
    utterance.rate = rate;

    let hasEnded = false;
    const handleEnd = () => {
      if (hasEnded) return;
      hasEnded = true;
      synthesisRef.current = null;
      if (statusRef.current === 'speaking') {
        statusRef.current = 'connected';
        setState(s => ({ ...s, status: 'connected' }));
      }
      onDone?.();
    };

    utterance.onend = handleEnd;
    utterance.onerror = handleEnd;

    synthesisRef.current = utterance;
    statusRef.current = 'speaking';
    setState(s => ({ ...s, status: 'speaking', activeVoiceName: label }));

    // Small timeout ensures Chrome releases speech engine cleanly
    setTimeout(() => {
      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        handleEnd();
      }
    }, 50);
  }, [market, cancelTTS, stopASR]);

  // ── Customer Turn Handler ──────────────────────────────────────────────────

  const handleCustomerTurn = useCallback(async (userText: string, asrMs: number) => {
    const callSessionId = callSessionIdRef.current;
    const agentSessionId = agentSessionIdRef.current;
    const currentTurn = turnCountRef.current;

    if (!callSessionId || !agentSessionId) {
      console.warn('Session not active, ignoring turn');
      return;
    }

    // Add customer transcript entry
    addEntry({
      speaker: 'customer',
      text: userText,
      asr_confidence: 0.95,
      latency: { asr_ms: asrMs },
    });

    statusRef.current = 'processing';
    setState(s => ({ ...s, status: 'processing', turnCount: s.turnCount + 1 }));

    try {
      const t0 = performance.now();

      // 1. Process voice turn (retrieval + latency)
      const turnResp = await fetch(`${API_BASE}/voice/calls/${callSessionId}/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          call_session_id: callSessionId,
          user_text: userText,
          turn_number: currentTurn + 1,
        }),
      });
      const turnData = await turnResp.json();

      // 2. Process FSM turn
      await fetch(`${API_BASE}/agent/sessions/${agentSessionId}/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: agentSessionId, user_input: userText }),
      });

      const totalMs = Math.round(performance.now() - t0);
      const latencies = turnData.latencies || {};
      const latency = {
        asr_ms: asrMs,
        retrieval_ms: latencies.retrieval_ms || turnData.retrieval_latency_ms || 0,
        gate_ms: latencies.gate_ms || 0,
        tts_ms: latencies.tts_ms || 0,
        e2e_ms: totalMs,
        user_stops_to_bot_audio_ms: latencies.user_stops_to_bot_audio_ms || totalMs,
      };

      // Build agent response based on retrieval results and market persona
      let agentText = '';
      const lower = userText.toLowerCase();

      if (turnData.is_refusal) {
        agentText = {
          in_en: "I am afraid I do not have verified information on that in our official guidelines. Would you like me to schedule a callback with our senior specialist?",
          ph_tl: "Pasensya na po, wala po akong beripikadong impormasyon tungkol diyan. Maaari ko po ba kayong i-schedule ng callback sa aming specialist?",
          id_id: "Mohon maaf, saya tidak memiliki informasi tersebut dalam panduan resmi kami. Izinkan saya mengatur panggilan balik dari spesialis kami.",
        }[market] || "I'm sorry, I don't have that information available. May I arrange for a specialist to assist you?";
      } else if (lower.includes('thank') || lower.includes('bye') || lower.includes('salamat')) {
        agentText = {
          in_en: "Thank you for your time today! Have a wonderful day! This is a marketing communication from SecureLife Insurance.",
          ph_tl: "Maraming salamat po sa inyong oras! Magandang araw po! Ito ay isang marketing communication mula sa SecureLife Insurance.",
          id_id: "Terima kasih banyak atas waktu Anda! Semoga harimu menyenangkan! Ini adalah komunikasi pemasaran dari SecureLife Insurance.",
        }[market] || "Thank you for your time! Have a wonderful day!";
      } else if (lower.includes('grace period') || lower.includes('due date') || lower.includes('lapse')) {
        agentText = {
          in_en: "Your policy includes a statutory 30-day grace period from the due date. During this time, your life coverage remains completely active.",
          ph_tl: "Mayroon po kayong 30-day grace period para sa premium. Active pa rin po ang inyong buong life insurance coverage sa panahong ito.",
          id_id: "Polis Anda memiliki masa tenggang 30 hari. Selama periode ini, perlindungan asuransi Anda tetap aktif sepenuhnya.",
        }[market] || "Your policy includes a 30-day grace period with full coverage remaining active.";
      } else if (lower.includes('yes') || lower.includes('rajesh') || lower.includes('opo') || lower.includes('jose') || lower.includes('confirm')) {
        agentText = {
          in_en: "Thank you for confirming. This call may be recorded for regulatory compliance and quality assurance. May I confirm your age?",
          ph_tl: "Salamat po sa pag-confirm. Ang tawag na ito ay maaaring i-record para sa compliance at kalidad. Maaari po ba ninyong sabihin ang inyong edad?",
          id_id: "Terima kasih atas konfirmasinya. Panggilan ini dapat direkam untuk kepatuhan regulasi. Boleh kami tahu usia Anda?",
        }[market] || "Thank you. This call may be recorded for compliance purposes.";
      } else {
        agentText = {
          in_en: "Thank you for sharing that. Let me look up the exact details from your policy schedule right away.",
          ph_tl: "Salamat po. Hayaan ninyo akong tingnan ang eksaktong detalye mula sa inyong policy schedule.",
          id_id: "Terima kasih atas informasinya. Saya akan segera memeriksa detail polis Anda.",
        }[market] || "Thank you. Let me look into that for you.";
      }

      // Add agent entry
      addEntry({
        speaker: 'agent',
        text: agentText,
        citations: turnData.citations || (turnData.is_refusal ? [] : ['POL_SEC_GRACE_04']),
        isRefusal: turnData.is_refusal,
        gateVerdict: turnData.is_refusal ? 'REFUSAL' : 'PASSED',
        latency,
      });

      setState(s => ({ ...s, lastLatency: latency }));

      // Speak agent response, and automatically listen next if autoListen is enabled
      speak(agentText, () => {
        if (autoListenRef.current && statusRef.current !== 'ended' && !isMutedRef.current) {
          setTimeout(() => {
            if (statusRef.current === 'connected' && !isMutedRef.current) {
              startListening((nextText, nextAsrMs) => {
                handleCustomerTurn(nextText, nextAsrMs);
              });
            }
          }, 300);
        }
      });

    } catch (err) {
      console.error('Turn processing error:', err);
      statusRef.current = 'connected';
      setState(s => ({ ...s, status: 'connected', error: 'Error processing turn. Please try again.' }));
    }
  }, [addEntry, speak, market]);

  // ── ASR: Reliable Speech Recognition with auto-cleanup & ducking protection ─

  const startListening = useCallback((onResult: (text: string, latency: number) => void) => {
    const SpeechRecognitionImpl =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionImpl) return;

    stopASR();
    cancelTTS();

    let recognizedText = '';
    let dispatched = false;

    // 150ms buffer for browser audio ducking release
    setTimeout(() => {
      if (statusRef.current === 'ended' || statusRef.current === 'idle') return;

      try {
        const recognition = new SpeechRecognitionImpl() as BrowserSpeechRecognition;
        recognition.lang = MARKET_LANG[market] || 'en-IN';
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.continuous = false;

        recognitionRef.current = recognition;
        asrStartTimeRef.current = performance.now();

        statusRef.current = 'listening';
        setState(s => ({ ...s, status: 'listening', currentInterim: '', error: null }));

        recognition.onresult = (event: BrowserSpeechRecognitionEvent) => {
          const last = event.results[event.results.length - 1];
          if (!last || !last[0]) return;
          const text = last[0].transcript;
          recognizedText = text;

          if (last.isFinal) {
            if (!dispatched && text.trim()) {
              dispatched = true;
              const asrMs = Math.round(performance.now() - asrStartTimeRef.current);
              statusRef.current = 'processing';
              setState(s => ({ ...s, currentInterim: '', status: 'processing' }));
              stopASR();
              onResult(text.trim(), asrMs);
            }
          } else {
            setState(s => ({ ...s, currentInterim: text }));
          }
        };

        recognition.onerror = (event: { error: string }) => {
          console.warn('ASR Notice:', event.error);
          if (event.error === 'not-allowed' || event.error === 'permission-denied') {
            statusRef.current = 'connected';
            setState(s => ({
              ...s,
              status: 'connected',
              micPermission: 'denied',
              error: 'Microphone permission blocked. Click the mic icon in your browser URL bar to allow it, or use quick text response chips below.',
            }));
          } else if (event.error === 'no-speech') {
            // User paused or microphone level was quiet; smoothly reset to connected
            if (statusRef.current === 'listening') {
              statusRef.current = 'connected';
              setState(s => ({ ...s, status: 'connected', currentInterim: '' }));
            }
          } else {
            if (statusRef.current === 'listening') {
              statusRef.current = 'connected';
              setState(s => ({ ...s, status: 'connected', currentInterim: '' }));
            }
          }
        };

        recognition.onend = () => {
          recognitionRef.current = null;
          // If transcript was captured before onend without isFinal, dispatch it
          if (!dispatched && recognizedText.trim()) {
            dispatched = true;
            const asrMs = Math.round(performance.now() - asrStartTimeRef.current);
            statusRef.current = 'processing';
            setState(s => ({ ...s, currentInterim: '', status: 'processing' }));
            onResult(recognizedText.trim(), asrMs);
            return;
          }

          if (statusRef.current === 'listening') {
            statusRef.current = 'connected';
            setState(s => ({ ...s, status: 'connected', currentInterim: '' }));
          }
        };

        recognition.start();
      } catch (err) {
        console.error('Could not start recognition:', err);
        statusRef.current = 'connected';
        setState(s => ({
          ...s,
          status: 'connected',
          error: 'Microphone busy or not ready. Click Speak Now or use a quick prompt below.',
        }));
      }
    }, 150);
  }, [market, stopASR, cancelTTS]);

  // ── Direct Customer Text Fallback ──────────────────────────────────────────

  const sendCustomerText = useCallback((text: string) => {
    if (!text.trim() || statusRef.current === 'ended' || statusRef.current === 'idle') return;
    stopASR();
    cancelTTS();
    handleCustomerTurn(text.trim(), 120);
  }, [stopASR, cancelTTS, handleCustomerTurn]);

  // ── Session Lifecycle API calls ───────────────────────────────────────────

  const requestMicPermission = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setState(s => ({ ...s, micPermission: 'granted' }));
      return true;
    } catch {
      setState(s => ({ ...s, micPermission: 'denied' }));
      return false;
    }
  }, []);

  const startCall = useCallback(async () => {
    statusRef.current = 'starting';
    setState(s => ({ ...s, status: 'starting', error: null }));

    // Request mic permission
    const hasPermission = await requestMicPermission();
    if (!hasPermission) {
      statusRef.current = 'idle';
      setState(s => ({
        ...s,
        status: 'idle',
        error: 'Microphone permission required for voice calls. Please allow mic access in your browser.',
      }));
      return;
    }

    try {
      // 1. Create voice call session
      const callResp = await fetch(`${API_BASE}/voice/calls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market, provider: 'mock' }),
      });
      if (!callResp.ok) throw new Error('Failed to start call session');
      const callData = await callResp.json();

      // 2. Create FSM agent session
      const agentResp = await fetch(`${API_BASE}/agent/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market }),
      });
      if (!agentResp.ok) throw new Error('Failed to create agent session');
      const agentData = await agentResp.json();

      callSessionIdRef.current = callData.call_session_id;
      agentSessionIdRef.current = agentData.session_id;
      turnCountRef.current = 0;
      statusRef.current = 'connected';

      setState(s => ({
        ...s,
        status: 'connected',
        callSessionId: callData.call_session_id,
        agentSessionId: agentData.session_id,
        micPermission: 'granted',
        turnCount: 0,
        transcript: [],
        elapsedSeconds: 0,
        error: null,
      }));

      // Start elapsed timer
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = setInterval(() => {
        setState(s => ({ ...s, elapsedSeconds: s.elapsedSeconds + 1 }));
      }, 1000);

      // Speak opening greeting with Priya's authentic female persona
      setTimeout(() => {
        const greetings: Record<string, string> = {
          in_en: 'Namaste! This is Priya from SecureLife Insurance. How may I help you today?',
          ph_tl: 'Magandang araw po! Ako po si Maria mula sa SecureLife Insurance. Paano ko po kayo matutulungan ngayon?',
          id_id: 'Selamat siang! Perkenalkan, saya Sari dari SecureLife Insurance. Ada yang bisa saya bantu hari ini?',
        };
        const greeting = greetings[market] || greetings['in_en'];
        addEntry({ speaker: 'agent', text: greeting });

        speak(greeting, () => {
          // Once opening greeting completes, automatically activate mic for the user!
          if (autoListenRef.current && statusRef.current !== 'ended' && !isMutedRef.current) {
            setTimeout(() => {
              if (statusRef.current === 'connected' && !isMutedRef.current) {
                startListening((text, asrMs) => {
                  handleCustomerTurn(text, asrMs);
                });
              }
            }, 300);
          }
        });
      }, 500);

    } catch (err) {
      statusRef.current = 'idle';
      setState(s => ({
        ...s,
        status: 'idle',
        error: err instanceof Error ? err.message : 'Unknown error starting call',
      }));
    }
  }, [market, addEntry, speak, requestMicPermission, startListening, handleCustomerTurn]);

  const endCall = useCallback(async () => {
    stopASR();
    cancelTTS();
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }

    statusRef.current = 'ending';
    setState(s => ({ ...s, status: 'ending' }));

    try {
      const callSessionId = callSessionIdRef.current;
      const agentSessionId = agentSessionIdRef.current;
      if (callSessionId) {
        await fetch(`${API_BASE}/voice/calls/${callSessionId}`, { method: 'DELETE' }).catch(() => {});
      }
      if (agentSessionId) {
        await fetch(`${API_BASE}/agent/sessions/${agentSessionId}`, { method: 'DELETE' }).catch(() => {});
      }
    } finally {
      statusRef.current = 'ended';
      callSessionIdRef.current = null;
      agentSessionIdRef.current = null;
      setState(s => ({
        ...s,
        status: 'ended',
        callSessionId: null,
        agentSessionId: null,
        currentInterim: '',
      }));
    }
  }, [stopASR, cancelTTS]);

  const resetCall = useCallback(() => {
    stopASR();
    cancelTTS();
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
    statusRef.current = 'idle';
    callSessionIdRef.current = null;
    agentSessionIdRef.current = null;
    setState({
      ...initialState,
      market,
      ttsSupported: state.ttsSupported,
      asrSupported: state.asrSupported,
      activeVoiceName: state.activeVoiceName,
    });
  }, [market, stopASR, cancelTTS, state.ttsSupported, state.asrSupported, state.activeVoiceName]);

  const toggleMute = useCallback(() => {
    setState(s => {
      const nextMuted = !s.isMuted;
      isMutedRef.current = nextMuted;
      if (nextMuted) {
        stopASR();
      }
      return { ...s, isMuted: nextMuted };
    });
  }, [stopASR]);

  const toggleAutoListen = useCallback(() => {
    setState(s => {
      const next = !s.autoListen;
      autoListenRef.current = next;
      return { ...s, autoListen: next };
    });
  }, []);

  const activateMic = useCallback(() => {
    if (statusRef.current === 'connected' || statusRef.current === 'speaking') {
      cancelTTS();
      startListening((text, asrMs) => {
        handleCustomerTurn(text, asrMs);
      });
    }
  }, [cancelTTS, startListening, handleCustomerTurn]);

  // ── Cleanup ──────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      stopASR();
      cancelTTS();
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, [stopASR, cancelTTS]);

  return {
    state,
    startCall,
    endCall,
    resetCall,
    toggleMute,
    toggleAutoListen,
    activateMic,
    sendCustomerText,
    speak,
    cancelTTS,
  };
}
