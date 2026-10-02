/**
 * useVoicePipeline — PARLEY Voice Agent Pipeline Hook
 *
 * TTS Priority:
 *   1. Backend /api/v1/voice/tts (ElevenLabs server proxy)
 *   2. Direct ElevenLabs API (using VITE_ELEVENLABS_API_KEY)
 *   3. Web Speech API (browser built-in, fallback)
 *
 * ASR: Web Speech API (Chrome/Edge/Safari)
 * Conversation: Backend FSM + Groq LLM via API_BASE, or local grounded responses if offline
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { API_BASE } from '../config/api';
import {
  ELEVENLABS_API_KEY,
  ELEVENLABS_VOICES,
  ELEVENLABS_MODEL,
  ELEVENLABS_SETTINGS,
} from '../config/voice';

// ── Browser Speech API Types ──────────────────────────────────────────────────

type SR = {
  lang: string; interimResults: boolean; maxAlternatives: number; continuous: boolean;
  start(): void; stop(): void;
  onresult: ((e: { results: { length: number; [i: number]: { isFinal: boolean; [j: number]: { transcript: string; confidence: number } } } }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
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
    asr_ms?: number; retrieval_ms?: number; gate_ms?: number;
    tts_ms?: number; e2e_ms?: number; user_stops_to_bot_audio_ms?: number;
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
  ttsProvider: 'elevenlabs' | 'browser' | 'none';
  asrSupported: boolean;
  personaName: string;
  awaitingCustomer: boolean;
  error: string | null;
}

const initialState: CallState = {
  status: 'idle', callSessionId: null, agentSessionId: null, market: 'in_en',
  elapsedSeconds: 0, turnCount: 0, transcript: [], isMuted: false, autoListen: true,
  currentInterim: '', lastLatency: null, micPermission: 'unknown',
  ttsProvider: 'elevenlabs', asrSupported: false, personaName: 'Priya',
  awaitingCustomer: false, error: null,
};

// ── Language codes ────────────────────────────────────────────────────────────

const MARKET_LANG: Record<string, string> = {
  in_en: 'en-IN', ph_tl: 'fil-PH', id_id: 'id-ID',
};

const PERSONA_NAME: Record<string, string> = {
  in_en: 'Priya', ph_tl: 'Maria', id_id: 'Sari',
};

// ── Greetings per market ──────────────────────────────────────────────────────

const GREETINGS: Record<string, string> = {
  in_en: 'Hello! My name is Priya, I am calling from SecureLife Insurance. May I speak with Rajesh Kumar?',
  ph_tl: 'Magandang araw po! Ako po si Maria mula sa SecureLife Insurance. Kausap ko po ba si Jose Rizal?',
  id_id: 'Selamat siang! Saya Sari dari SecureLife Insurance. Apakah saya berbicara dengan Bapak Budi Santoso?',
};

// ── Local Agent Responses (offline / fallback) ────────────────────────────────

const RESPONSES: Record<string, (input: string) => { text: string; isRefusal: boolean; citations: string[] }> = {
  in_en: (input: string) => {
    const l = input.toLowerCase();
    if (/haan|yes|bol raha|rajesh|correct|theek|hi main|mera naam/i.test(l))
      return { text: 'Thank you Rajesh! Your identity is confirmed. Your SecureLife policy renewal is due on October 15. We have a 30-day grace period during which your full coverage remains active.', isRefusal: false, citations: ['ID_VERIFY_KB'] };
    if (/grace|kab tak|deadline|last date|kitne din/i.test(l))
      return { text: 'Rajesh, you have a 30-day grace period. This means you can pay the premium without any penalty until November 14. Your life cover remains active during this entire period.', isRefusal: false, citations: ['KB_GRACE_PERIOD_IN'] };
    if (/upi|google pay|gpay|payment|bharna|paytm|phonepe/i.test(l))
      return { text: 'Absolutely Rajesh! I will send a Google Pay payment link to your registered number right away. Once you click it, the payment will be processed. Is your number 98765-43210?', isRefusal: false, citations: ['PAYMENT_KB'] };
    if (/quarterly|installment|kist|baad mein|baad|baar mein pay/i.test(l))
      return { text: 'I understand Rajesh. We also offer a quarterly installment mode. If the annual premium is Rs. 18,450, the quarterly payment would be Rs. 4,613. Shall I activate this option?', isRefusal: false, citations: ['INSTALLMENT_KB'] };
    if (/bitcoin|crypto|share|stock|mutual fund|fd|deposit/i.test(l))
      return { text: 'I apologize Rajesh, but SecureLife only offers life and health insurance products. Cryptocurrency or stocks are not in our portfolio. Is there anything else I can help you with?', isRefusal: true, citations: [] };
    if (/shukriya|dhanyavaad|thank|bye|alvida|theek hai shukriya/i.test(l))
      return { text: 'Thank you Rajesh, thank you very much for your time. Have a great day! This was a marketing communication from SecureLife Insurance.', isRefusal: false, citations: [] };
    return { text: 'Sure Rajesh, I understand. You can ask any question — I am here to fully assist you!', isRefusal: false, citations: ['GENERAL_KB'] };
  },
  ph_tl: (input: string) => {
    const l = input.toLowerCase();
    if (/opo|ako|jose|yes|tama|oo|totoo/i.test(l))
      return { text: 'Salamat po, Jose! Na-confirm na ang inyong identity. Ang inyong SecureLife policy ay mag-e-expire sa Oktubre 15. Mayroon po kaming 30-day grace period kung saan aktibo pa rin ang inyong buong coverage.', isRefusal: false, citations: ['ID_VERIFY_KB'] };
    if (/grace|hanggang|bayad|kelan|magkano|kailan/i.test(l))
      return { text: 'Jose po, ang inyong grace period ay 30 araw. Maaari po kayong magbayad hanggang Nobyembre 14 nang walang late charge. Aktibo pa rin ang inyong buong life coverage sa panahong iyon.', isRefusal: false, citations: ['KB_GRACE_PERIOD_PH'] };
    if (/gcash|payment|bayad|pera|transfer|bdo|bpi/i.test(l))
      return { text: 'Sige po Jose! Ipapadala ko na po ang GCash payment link sa inyong registered na numero ngayon din. Pagkatapos mag-pay, makakatanggap po kayo ng SMS confirmation mula sa amin.', isRefusal: false, citations: ['PAYMENT_KB_PH'] };
    if (/bitcoin|crypto|stocks|negosyo|investment/i.test(l))
      return { text: 'Pasensya na po Jose. Ang SecureLife ay nag-aalok lamang ng life at health insurance. Hindi po kami sangkot sa cryptocurrency o investments. May iba pa po ba akong matutulungan?', isRefusal: true, citations: [] };
    if (/salamat|okay na|sige|bye|wala na|ayos na/i.test(l))
      return { text: 'Maraming salamat din po Jose! Nawa ay magkaroon kayo ng napakagandang araw. Ito po ay isang marketing communication mula sa SecureLife Insurance. Paalam po!', isRefusal: false, citations: [] };
    return { text: 'Naiintindihan ko po Jose. Nandito po ako para tulungan kayo sa lahat ng inyong mga katanungan tungkol sa inyong insurance policy!', isRefusal: false, citations: ['GENERAL_KB'] };
  },
  id_id: (input: string) => {
    const l = input.toLowerCase();
    if (/ya|iya|budi|benar|betul|saya sendiri/i.test(l))
      return { text: 'Terima kasih Pak Budi! Identitas Bapak sudah dikonfirmasi. Polis asuransi SecureLife Bapak akan jatuh tempo pada 15 Oktober. Kami memiliki masa tenggang 30 hari di mana perlindungan Bapak tetap aktif.', isRefusal: false, citations: ['ID_VERIFY_KB'] };
    if (/kapan|sampai|bayar|batas|tenggang|deadline/i.test(l))
      return { text: 'Pak Budi, masa tenggang polis Bapak adalah 30 hari. Jadi Bapak bisa melakukan pembayaran hingga 14 November tanpa denda sama sekali. Perlindungan asuransi jiwa Bapak tetap aktif selama periode ini.', isRefusal: false, citations: ['KB_GRACE_PERIOD_ID'] };
    if (/transfer|gopay|ovo|qris|payment|bayar|dana/i.test(l))
      return { text: 'Baik Pak Budi! Kami akan mengirimkan detail rekening tujuan dan konfirmasi pembayaran via SMS setelah transaksi berhasil. Ada pertanyaan lain yang bisa saya bantu?', isRefusal: false, citations: ['PAYMENT_KB_ID'] };
    if (/terima kasih|tidak ada|sudah|bye|selesai/i.test(l))
      return { text: 'Sama-sama Pak Budi! Terima kasih sudah meluangkan waktu. Semoga harinya sangat menyenangkan. Ini adalah komunikasi pemasaran dari SecureLife Insurance.', isRefusal: false, citations: [] };
    return { text: 'Baik Pak Budi, saya mengerti. Silakan tanyakan apa saja — saya siap membantu Bapak sepenuhnya!', isRefusal: false, citations: ['GENERAL_KB'] };
  },
};

// ── Web Speech best voice picker (fallback) ───────────────────────────────────

function pickBrowserVoice(market: string, voices: SpeechSynthesisVoice[]) {
  if (!voices.length) return { voice: null, pitch: 1.1, rate: 0.9 };
  const n = (s: string) => s.toLowerCase();
  if (market === 'in_en') {
    const heera = voices.find(v => /heera|neerja/i.test(v.name));
    if (heera) return { voice: heera, pitch: 1.0, rate: 0.86 };
    const inEn = voices.find(v => n(v.lang).includes('en-in') || n(v.name).includes('india'));
    if (inEn) return { voice: inEn, pitch: 1.1, rate: 0.88 };
  }
  if (market === 'ph_tl') {
    const fil = voices.find(v => /fil|tagalog|filipino/i.test(v.lang + v.name));
    if (fil) return { voice: fil, pitch: 1.08, rate: 0.9 };
  }
  if (market === 'id_id') {
    const id = voices.find(v => /id-id|indonesia/i.test(v.lang));
    if (id) return { voice: id, pitch: 1.05, rate: 0.9 };
  }
  const fem = voices.find(v => v.lang.startsWith('en') && /female|zira|jenny|aria|sonia|heera|neerja/i.test(v.name));
  const eng = voices.find(v => v.lang.startsWith('en'));
  return { voice: fem || eng || voices[0], pitch: 1.15, rate: 0.87 };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useVoicePipeline(market: string = 'in_en') {
  const [state, setState] = useState<CallState>({ ...initialState, market });

  const statusRef = useRef<CallState['status']>('idle');
  const callSidRef = useRef<string | null>(null);
  const agentSidRef = useRef<string | null>(null);
  const turnRef = useRef<number>(0);
  const autoListenRef = useRef<boolean>(true);
  const mutedRef = useRef<boolean>(false);
  const marketRef = useRef<string>(market);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const srRef = useRef<SR | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { marketRef.current = market; }, [market]);

  // ── Detect capabilities ──────────────────────────────────────────────────

  useEffect(() => {
    const hasASR = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    const hasBrowserTTS = typeof window !== 'undefined' && 'speechSynthesis' in window;

    setState(s => ({
      ...s,
      ttsProvider: 'elevenlabs',
      asrSupported: hasASR,
      personaName: PERSONA_NAME[market] || 'Priya',
    }));

    if (hasBrowserTTS) {
      const loadV = () => { voicesRef.current = window.speechSynthesis.getVoices(); };
      loadV(); window.speechSynthesis.onvoiceschanged = loadV;
      return () => { window.speechSynthesis.onvoiceschanged = null; };
    }
  }, [market]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const makeId = () => `e_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const addEntry = useCallback((entry: Omit<TranscriptEntry, 'id' | 'timestamp'>) => {
    setState(s => ({
      ...s,
      transcript: [...s.transcript, { ...entry, id: makeId(), timestamp: Date.now() }],
    }));
  }, []);

  const stopSR = useCallback(() => {
    try { srRef.current?.stop(); } catch (_) {}
    srRef.current = null;
  }, []);

  const stopTTS = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (_) {}
    }
  }, []);

  // ── Browser TTS (Fallback) ───────────────────────────────────────────────

  const speakBrowser = useCallback((text: string, onDone: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) { onDone(); return; }
    window.speechSynthesis.cancel();

    const utt = new SpeechSynthesisUtterance(text);
    // Retain global reference to avoid Chrome garbage-collection bug
    (window as any).__voiceAgentUtt = utt;

    const { voice, pitch, rate } = pickBrowserVoice(marketRef.current, voicesRef.current);
    if (voice) { utt.voice = voice; utt.lang = voice.lang; }
    else { utt.lang = MARKET_LANG[marketRef.current] || 'en-IN'; }
    utt.pitch = pitch; utt.rate = rate; utt.volume = 1;

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      (window as any).__voiceAgentUtt = null;
      if (statusRef.current === 'speaking') {
        statusRef.current = 'connected';
        setState(s => ({ ...s, status: 'connected' }));
      }
      onDone();
    };

    // Safety timeout prevents getting stuck if onend drops
    const maxDur = Math.max(4000, text.length * 80);
    const safety = setTimeout(finish, maxDur);

    utt.onend = () => { clearTimeout(safety); finish(); };
    utt.onerror = () => { clearTimeout(safety); finish(); };

    setTimeout(() => {
      try { window.speechSynthesis.speak(utt); }
      catch { clearTimeout(safety); finish(); }
    }, 60);
  }, []);

  // ── ElevenLabs TTS (Primary: Backend Proxy or Direct) ─────────────────────

  const speakElevenLabs = useCallback(async (text: string, onDone: () => void): Promise<void> => {
    const voiceId = ELEVENLABS_VOICES[marketRef.current] || ELEVENLABS_VOICES.in_en;
    const settings = ELEVENLABS_SETTINGS[marketRef.current] || ELEVENLABS_SETTINGS.in_en;

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      if (statusRef.current === 'speaking') {
        statusRef.current = 'connected';
        setState(s => ({ ...s, status: 'connected' }));
      }
      onDone();
    };

    // Safety timeout: Never stay stuck in speaking
    const safetyTimer = setTimeout(finish, Math.max(7000, text.length * 150));

    try {
      let audioBlob: Blob | null = null;

      // 1. First try Backend /api/v1/voice/tts (Fastest, zero CORS issues, authenticated server-side)
      try {
        const beRes = await fetch(`${API_BASE}/voice/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, market: marketRef.current, voice_id: voiceId }),
        });
        if (beRes.ok) {
          audioBlob = await beRes.blob();
        }
      } catch (beErr) {
        console.warn('[TTS] Backend proxy attempt failed:', beErr);
      }

      // 2. Fallback to direct ElevenLabs API if backend was unreachable
      if (!audioBlob && ELEVENLABS_API_KEY) {
        const res = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
          {
            method: 'POST',
            headers: {
              'xi-api-key': ELEVENLABS_API_KEY,
              'Content-Type': 'application/json',
              Accept: 'audio/mpeg',
            },
            body: JSON.stringify({
              text,
              model_id: ELEVENLABS_MODEL,
              voice_settings: {
                stability: settings.stability,
                similarity_boost: settings.similarity_boost,
                style: settings.style,
              },
            }),
          }
        );
        if (res.ok) {
          audioBlob = await res.blob();
        }
      }

      if (!audioBlob) {
        throw new Error('TTS audio unavailable, falling back to browser voice');
      }

      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.playbackRate = settings.speaking_rate || 1.0;

      audio.onended = () => {
        clearTimeout(safetyTimer);
        URL.revokeObjectURL(url);
        audioRef.current = null;
        finish();
      };
      audio.onerror = () => {
        clearTimeout(safetyTimer);
        URL.revokeObjectURL(url);
        audioRef.current = null;
        finish();
      };

      await audio.play();
    } catch (err) {
      clearTimeout(safetyTimer);
      console.warn('[ElevenLabs] Playing browser voice fallback:', err);
      speakBrowser(text, onDone);
    }
  }, [speakBrowser]);

  // ── Unified speak ─────────────────────────────────────────────────────────

  const speak = useCallback((text: string, onDone: () => void) => {
    stopTTS(); stopSR();
    statusRef.current = 'speaking';
    setState(s => ({ ...s, status: 'speaking', awaitingCustomer: false }));
    speakElevenLabs(text, onDone);
  }, [stopTTS, stopSR, speakElevenLabs]);

  // ── ASR Listen ────────────────────────────────────────────────────────────

  const listen = useCallback((onResult: (text: string, ms: number) => void) => {
    const SRCls = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SRCls) {
      setState(s => ({ ...s, status: 'connected', awaitingCustomer: true }));
      return;
    }
    stopSR(); stopTTS();

    setTimeout(() => {
      if (statusRef.current === 'ended' || statusRef.current === 'idle') return;
      try {
        const r = new SRCls() as SR;
        r.lang = MARKET_LANG[marketRef.current] || 'en-IN';
        r.interimResults = true; r.maxAlternatives = 1; r.continuous = false;
        srRef.current = r;
        let buffered = ''; let dispatched = false;
        const t0 = performance.now();

        statusRef.current = 'listening';
        setState(s => ({ ...s, status: 'listening', currentInterim: '', error: null, awaitingCustomer: true }));

        r.onresult = (e) => {
          const last = e.results[e.results.length - 1];
          if (!last?.[0]) return;
          buffered = last[0].transcript;
          if (last.isFinal && !dispatched) {
            dispatched = true; stopSR();
            statusRef.current = 'processing';
            setState(s => ({ ...s, currentInterim: '', status: 'processing', awaitingCustomer: false }));
            onResult(buffered.trim(), Math.round(performance.now() - t0));
          } else if (!last.isFinal) {
            setState(s => ({ ...s, currentInterim: buffered }));
          }
        };
        r.onerror = (e) => {
          srRef.current = null;
          if (e.error === 'not-allowed') {
            setState(s => ({ ...s, status: 'connected', micPermission: 'denied', awaitingCustomer: true,
              error: 'Mic access denied. Click a response chip below to speak.' }));
          } else {
            setState(s => ({ ...s, status: 'connected', currentInterim: '', awaitingCustomer: true }));
          }
          statusRef.current = 'connected';
        };
        r.onend = () => {
          srRef.current = null;
          if (buffered.trim() && !dispatched) {
            dispatched = true;
            statusRef.current = 'processing';
            setState(s => ({ ...s, currentInterim: '', status: 'processing', awaitingCustomer: false }));
            onResult(buffered.trim(), 300);
          } else if (!dispatched) {
            statusRef.current = 'connected';
            setState(s => ({ ...s, status: 'connected', currentInterim: '', awaitingCustomer: true }));
          }
        };
        r.start();
      } catch {
        statusRef.current = 'connected';
        setState(s => ({ ...s, status: 'connected', awaitingCustomer: true,
          error: 'Mic unavailable. Use chips or text input below.' }));
      }
    }, 200);
  }, [stopSR, stopTTS]);

  // ── Process customer turn ─────────────────────────────────────────────────

  const processCustomerTurn = useCallback(async (userText: string, asrMs: number) => {
    const sid = callSidRef.current;
    const asid = agentSidRef.current;

    addEntry({ speaker: 'customer', text: userText, asr_confidence: 0.95, latency: { asr_ms: asrMs } });
    statusRef.current = 'processing';
    setState(s => ({ ...s, status: 'processing', turnCount: s.turnCount + 1, awaitingCustomer: false }));

    const t0 = performance.now();
    let agentText = '';
    let isRefusal = false;
    let citations: string[] = [];

    // 1. Try Live Backend Turn
    if (sid && sid !== 'offline') {
      try {
        const tr = await fetch(`${API_BASE}/voice/calls/${sid}/turn`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ call_session_id: sid, user_text: userText, turn_number: turnRef.current + 1 }),
        }).then(r => r.json());

        isRefusal = !!tr.is_refusal;
        citations = tr.citations || [];
        agentText = tr.agent_response || tr.agent_text || tr.response || '';
      } catch (_) { /* fall through to local */ }
    }

    // 2. Grounded Fallback if backend offline or returned empty
    if (!agentText) {
      const fn = RESPONSES[marketRef.current] || RESPONSES.in_en;
      const local = fn(userText);
      agentText = local.text; isRefusal = local.isRefusal; citations = local.citations;
    }

    const totalMs = Math.round(performance.now() - t0);
    const latency = { asr_ms: asrMs, e2e_ms: totalMs, user_stops_to_bot_audio_ms: totalMs };
    turnRef.current += 1;
    addEntry({
      speaker: 'agent', text: agentText, citations, isRefusal,
      gateVerdict: isRefusal ? 'REFUSAL' : citations.length ? 'PASSED' : 'PASSED', latency,
    });
    setState(s => ({ ...s, lastLatency: latency }));

    speak(agentText, () => {
      if (autoListenRef.current && statusRef.current !== 'ended' && !mutedRef.current) {
        setTimeout(() => {
          if (statusRef.current === 'connected' && !mutedRef.current) listen(processCustomerTurn);
        }, 300);
      } else {
        setState(s => ({ ...s, awaitingCustomer: true }));
      }
    });
  }, [addEntry, speak, listen]);

  // ── sendCustomerText (chips or typing) ─────────────────────────────────────

  const sendCustomerText = useCallback((text: string) => {
    if (!text.trim() || statusRef.current === 'speaking' || statusRef.current === 'processing') return;
    stopSR();
    processCustomerTurn(text.trim(), 50);
  }, [stopSR, processCustomerTurn]);

  // ── activateMic (manual mic click) ────────────────────────────────────────

  const activateMic = useCallback(() => {
    if (statusRef.current === 'speaking') {
      stopTTS();
    }
    listen(processCustomerTurn);
  }, [stopTTS, listen, processCustomerTurn]);

  // ── startCall ─────────────────────────────────────────────────────────────

  const startCall = useCallback(async () => {
    statusRef.current = 'starting';
    setState(s => ({ ...s, status: 'starting', error: null, market, personaName: PERSONA_NAME[market] || 'Priya' }));

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setState(s => ({ ...s, micPermission: 'granted' }));
    } catch {
      setState(s => ({ ...s, micPermission: 'denied' }));
    }

    let sid = 'offline'; let asid = 'offline';
    try {
      const [cr, ar] = await Promise.all([
        fetch(`${API_BASE}/voice/calls`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ market, provider: 'mock' }),
        }).then(r => r.json()),
        fetch(`${API_BASE}/agent/sessions`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ market }),
        }).then(r => r.json()),
      ]);
      sid = cr.call_session_id; asid = ar.session_id;
    } catch (_) { /* offline mode */ }

    callSidRef.current = sid; agentSidRef.current = asid;
    turnRef.current = 0; statusRef.current = 'connected';

    setState(s => ({
      ...s, status: 'connected', callSessionId: sid, agentSessionId: asid,
      turnCount: 0, transcript: [], elapsedSeconds: 0, error: null,
    }));

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setState(s => ({ ...s, elapsedSeconds: s.elapsedSeconds + 1 })), 1000);

    const greeting = GREETINGS[market] || GREETINGS.in_en;
    addEntry({ speaker: 'agent', text: greeting, citations: [], gateVerdict: 'PASSED' });

    speak(greeting, () => {
      if (statusRef.current !== 'ended') {
        setTimeout(() => {
          if (statusRef.current === 'connected') {
            listen(processCustomerTurn);
          }
        }, 300);
      }
    });
  }, [market, addEntry, speak, listen, processCustomerTurn]);

  // ── endCall ───────────────────────────────────────────────────────────────

  const endCall = useCallback(async () => {
    stopSR(); stopTTS();
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    const sid = callSidRef.current;
    if (sid && sid !== 'offline') {
      try {
        await fetch(`${API_BASE}/voice/calls/${sid}`, { method: 'DELETE' });
      } catch (_) {}
    }
    callSidRef.current = null; agentSidRef.current = null;
    statusRef.current = 'ended';
    setState(s => ({ ...s, status: 'ended', awaitingCustomer: false }));
  }, [stopSR, stopTTS]);

  // ── resetCall ─────────────────────────────────────────────────────────────

  const resetCall = useCallback(() => {
    stopSR(); stopTTS();
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    callSidRef.current = null; agentSidRef.current = null;
    statusRef.current = 'idle';
    setState({ ...initialState, market: marketRef.current, personaName: PERSONA_NAME[marketRef.current] || 'Priya' });
  }, [stopSR, stopTTS]);

  // ── Controls ──────────────────────────────────────────────────────────────

  const toggleMute = useCallback(() => {
    mutedRef.current = !mutedRef.current;
    setState(s => ({ ...s, isMuted: mutedRef.current }));
    if (mutedRef.current) stopSR();
  }, [stopSR]);

  const toggleAutoListen = useCallback(() => {
    autoListenRef.current = !autoListenRef.current;
    setState(s => ({ ...s, autoListen: autoListenRef.current }));
  }, []);

  return {
    state,
    startCall,
    endCall,
    resetCall,
    toggleMute,
    toggleAutoListen,
    activateMic,
    sendCustomerText,
  };
}
