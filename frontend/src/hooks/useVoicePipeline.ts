/**
 * useVoicePipeline — React hook for the PARLEY browser voice agent
 *
 * Manages:
 *  - Call session lifecycle (start/end via API)
 *  - Web Speech API: SpeechRecognition (ASR) + SpeechSynthesis (TTS)
 *  - Barge-in: cancels TTS when user starts speaking
 *  - Latency measurement per turn
 *  - Dialogue FSM via API (session create + turn processing)
 *  - Transcript accumulation with gate citations
 *
 * Works in Chrome / Edge (Web Speech API required).
 */

import { useState, useRef, useCallback, useEffect } from 'react';

type BrowserSpeechRecognition = {
  lang: string; interimResults: boolean; maxAlternatives: number; continuous: boolean;
  start(): void; stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

const rawApiBase = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const API_BASE = rawApiBase.endsWith('/api/v1') ? rawApiBase : `${rawApiBase}/api/v1`;

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
  pushToTalk: boolean;
  currentInterim: string;
  lastLatency: TranscriptEntry['latency'] | null;
  micPermission: 'unknown' | 'granted' | 'denied' | 'unavailable';
  ttsSupported: boolean;
  asrSupported: boolean;
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
  pushToTalk: false,
  currentInterim: '',
  lastLatency: null,
  micPermission: 'unknown',
  ttsSupported: false,
  asrSupported: false,
  error: null,
};

// Market → language code map for Web Speech API
const MARKET_LANG: Record<string, string> = {
  in_en: 'en-IN',
  ph_tl: 'fil-PH',
  id_id: 'id-ID',
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useVoicePipeline(market: string = 'in_en') {
  const [state, setState] = useState<CallState>({ ...initialState, market });
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const asrStartTimeRef = useRef<number>(0);

  // ── Detect capabilities ──────────────────────────────────────────────────

  useEffect(() => {
    const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    const asrSupported =
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    setState(s => ({ ...s, ttsSupported, asrSupported }));
  }, []);

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
      try { recognitionRef.current.stop(); } catch (_) { /* ignore */ }
      recognitionRef.current = null;
    }
  }, []);

  const cancelTTS = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // ── TTS ────────────────────────────────────────────────────────────────

  const speak = useCallback((text: string, onDone?: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      onDone?.();
      return;
    }
    cancelTTS();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = MARKET_LANG[market] || 'en-IN';
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    utterance.onend = () => { onDone?.(); };
    utterance.onerror = () => { onDone?.(); };
    synthesisRef.current = utterance;
    setState(s => ({ ...s, status: 'speaking' }));
    window.speechSynthesis.speak(utterance);
  }, [market, cancelTTS]);

  // ── ASR ────────────────────────────────────────────────────────────────

  const startListening = useCallback((onResult: (text: string, latency: number) => void) => {
    const SpeechRecognitionImpl =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionImpl) return;

    stopASR();
    cancelTTS(); // barge-in: cancel TTS if it was playing

    const recognition = new SpeechRecognitionImpl() as BrowserSpeechRecognition;
    recognition.lang = MARKET_LANG[market] || 'en-IN';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognitionRef.current = recognition;
    asrStartTimeRef.current = performance.now();

    setState(s => ({ ...s, status: 'listening', currentInterim: '' }));

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results[event.results.length - 1];
      const text = last[0].transcript;
      if (last.isFinal) {
        const asrMs = Math.round(performance.now() - asrStartTimeRef.current);
        setState(s => ({ ...s, currentInterim: '', status: 'processing' }));
        onResult(text, asrMs);
      } else {
        setState(s => ({ ...s, currentInterim: text }));
      }
    };

    recognition.onerror = (event: { error: string }) => {
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        setState(s => ({ ...s, micPermission: 'denied', error: 'Microphone access denied. Please allow mic access and try again.' }));
      }
    };

    recognition.onend = () => {
      setState(s => ({ ...s, currentInterim: '' }));
    };

    try {
      recognition.start();
    } catch (err) {
      setState(s => ({ ...s, error: 'Could not start microphone.' }));
    }
  }, [market, stopASR, cancelTTS]);

  // ── API calls ─────────────────────────────────────────────────────────────

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
    setState(s => ({ ...s, status: 'starting', error: null }));

    // Request mic permission first
    const hasPermission = await requestMicPermission();
    if (!hasPermission) {
      setState(s => ({ ...s, status: 'idle' }));
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
      elapsedTimerRef.current = setInterval(() => {
        setState(s => ({ ...s, elapsedSeconds: s.elapsedSeconds + 1 }));
      }, 1000);

      // Speak opening greeting after 500ms
      setTimeout(() => {
        const greetings: Record<string, string> = {
          in_en: 'Namaste! This is Priya from SecureLife Insurance. How may I help you today?',
          ph_tl: 'Magandang araw po! Ako po si Maria mula sa SecureLife Insurance. Paano ko po kayo matutulungan?',
          id_id: 'Selamat siang! Perkenalkan, saya Sari dari SecureLife Insurance. Ada yang bisa saya bantu?',
        };
        const greeting = greetings[market] || greetings['in_en'];
        addEntry({ speaker: 'agent', text: greeting });
        speak(greeting, () => {
          // After greeting, start listening for customer
          setState(s => {
            if (s.status === 'speaking') {
              return { ...s, status: 'connected' };
            }
            return s;
          });
        });
      }, 500);

    } catch (err) {
      setState(s => ({
        ...s,
        status: 'idle',
        error: err instanceof Error ? err.message : 'Unknown error starting call',
      }));
    }
  }, [market, addEntry, speak, requestMicPermission]);

  const endCall = useCallback(async () => {
    stopASR();
    cancelTTS();
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }

    setState(s => ({ ...s, status: 'ending' }));

    try {
      const { callSessionId, agentSessionId } = state;
      if (callSessionId) {
        await fetch(`${API_BASE}/voice/calls/${callSessionId}`, { method: 'DELETE' }).catch(() => {});
      }
      if (agentSessionId) {
        await fetch(`${API_BASE}/agent/sessions/${agentSessionId}`, { method: 'DELETE' }).catch(() => {});
      }
    } finally {
      setState(s => ({
        ...s,
        status: 'ended',
        callSessionId: null,
        agentSessionId: null,
        currentInterim: '',
      }));
    }
  }, [state, stopASR, cancelTTS]);

  const resetCall = useCallback(() => {
    stopASR();
    cancelTTS();
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
    setState({ ...initialState, market, ttsSupported: state.ttsSupported, asrSupported: state.asrSupported });
  }, [market, stopASR, cancelTTS, state.ttsSupported, state.asrSupported]);

  const toggleMute = useCallback(() => {
    setState(s => {
      if (!s.isMuted && recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) { /* ignore */ }
      }
      return { ...s, isMuted: !s.isMuted };
    });
  }, []);

  // ── Customer turn handler ─────────────────────────────────────────────────

  const handleCustomerTurn = useCallback(async (userText: string, asrMs: number) => {
    const { callSessionId, agentSessionId, turnCount } = state;
    if (!callSessionId || !agentSessionId) return;

    // Add customer transcript entry
    addEntry({
      speaker: 'customer',
      text: userText,
      asr_confidence: 0.9,
      latency: { asr_ms: asrMs },
    });

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
          turn_number: turnCount + 1,
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

      // Build agent response based on retrieval results
      let agentText = '';
      if (turnData.is_refusal) {
        agentText = {
          in_en: "I'm afraid I don't have that specific information. I'd like to arrange for a specialist to assist you. Would you like me to schedule a callback?",
          ph_tl: "Pasensya na po, wala po akong impormasyon tungkol doon. Maaari ko pong i-ayos ang isang callback para sa inyo?",
          id_id: "Mohon maaf, saya tidak memiliki informasi tersebut. Izinkan saya mengatur panggilan balik dari spesialis kami.",
        }[market] || "I'm sorry, I don't have that information available. May I arrange for a specialist to assist you?";
      } else if (userText.toLowerCase().includes('thank') || userText.toLowerCase().includes('bye')) {
        agentText = {
          in_en: "Thank you for your time! Have a wonderful day! This is a marketing communication from SecureLife Insurance.",
          ph_tl: "Salamat po sa inyong oras! Magandang araw po! Ito ay isang marketing communication mula sa SecureLife Insurance.",
          id_id: "Terima kasih atas waktu Anda! Semoga harimu menyenangkan! Ini adalah komunikasi pemasaran dari SecureLife Insurance.",
        }[market] || "Thank you for your time! Have a wonderful day!";
      } else {
        agentText = {
          in_en: "Thank you for sharing that. Let me retrieve the relevant information for you right away.",
          ph_tl: "Salamat po. Hayaan ninyo akong hanapin ang tamang impormasyon para sa inyo.",
          id_id: "Terima kasih. Izinkan saya mencari informasi yang tepat untuk Anda.",
        }[market] || "Thank you. Let me look into that for you.";
      }

      // Add agent entry
      addEntry({
        speaker: 'agent',
        text: agentText,
        citations: turnData.citations || [],
        isRefusal: turnData.is_refusal,
        gateVerdict: turnData.is_refusal ? 'REFUSAL' : 'PASSED',
        latency,
      });

      setState(s => ({ ...s, lastLatency: latency }));

      // Speak agent response
      speak(agentText);

    } catch (err) {
      console.error('Turn processing error:', err);
      setState(s => ({ ...s, status: 'connected', error: 'Error processing turn.' }));
    }
  }, [state, addEntry, speak, market]);

  // ── Activate listening ─────────────────────────────────────────────────

  const activateMic = useCallback(() => {
    if (state.status === 'connected' || state.status === 'speaking') {
      startListening((text, asrMs) => {
        handleCustomerTurn(text, asrMs);
      });
    }
  }, [state.status, startListening, handleCustomerTurn]);

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
    activateMic,
    speak,
    cancelTTS,
  };
}
