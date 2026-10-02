"""ASR and TTS adapters for PARLEY Voice Agent.

Production implementations:
  - DeepgramASR: streaming Nova-2 STT via deepgram-sdk (en-IN, id-ID, fil-PH)
  - ElevenLabsTTS: multilingual native-voice synthesis via elevenlabs SDK
  - MockASR / MockTTS: deterministic replay for testing (no external calls)
  - GoogleSTTASR: stub (configure GOOGLE_APPLICATION_CREDENTIALS to activate)

Market → language mapping covers all three target markets.
"""
from __future__ import annotations

import os
import time
import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass, field, asdict
from typing import Any, Callable, Dict, List, Optional
from dotenv import load_dotenv

load_dotenv()


# ─────────────────────────────────────────────────────────────────────────────
# ASR result dataclass
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class ASRResult:
    transcript_id: str = field(default_factory=lambda: f"asr_{uuid.uuid4().hex[:8]}")
    session_id: str = ""
    turn_number: int = 0
    text: str = ""
    confidence: float = 0.0
    is_final: bool = True
    language: str = "en-IN"
    provider: str = "unknown"
    latency_ms: float = 0.0
    timestamp: float = field(default_factory=time.time)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


# ─────────────────────────────────────────────────────────────────────────────
# Market / language configuration
# ─────────────────────────────────────────────────────────────────────────────

MARKET_LANGUAGE_MAP: Dict[str, str] = {
    "in_en": "en-IN",
    "ph_tl": "fil-PH",
    "id_id": "id-ID",
}

# Deepgram language codes (their internal identifiers)
DEEPGRAM_LANGUAGE_MAP: Dict[str, str] = {
    "in_en": "en-IN",
    "ph_tl": "en",      # Deepgram handles Taglish better under 'en' + keyphrases
    "id_id": "id",
}

ASR_PROVIDER_NOTES = {
    "in_en": {
        "preferred": "Deepgram Nova-2 (en-IN)",
        "alternative": "Google Cloud STT (en-IN, Chirp model)",
        "wer_estimate": "6-9% (urban Indian English)",
        "web_speech": "SpeechRecognition(lang='en-IN') — supported in Chrome/Edge",
    },
    "ph_tl": {
        "preferred": "Deepgram Nova-2 (en, code-switch boost)",
        "alternative": "Google Cloud STT (fil-PH)",
        "wer_estimate": "12-18% (mixed Taglish)",
        "web_speech": "SpeechRecognition(lang='fil-PH')",
        "note": "Deepgram handles Taglish better with keyterm boosting than lang=fil-PH",
    },
    "id_id": {
        "preferred": "Deepgram Nova-2 (id) — limited regional accent support",
        "alternative": "Google Cloud STT (id-ID, Chirp) — better for Javanese/Sundanese",
        "wer_estimate": "8-12% (standard Jakarta), 22-28% (regional accents)",
        "web_speech": "SpeechRecognition(lang='id-ID')",
        "accent_note": "Standard Jakarta model. Regional (Javanese/Sundanese/Batak) accuracy drops ~15-20 WER points.",
    },
}


# ─────────────────────────────────────────────────────────────────────────────
# Abstract base
# ─────────────────────────────────────────────────────────────────────────────

class ASRAdapter(ABC):
    provider_name: str = "abstract"

    def get_language_code(self, market: str) -> str:
        return MARKET_LANGUAGE_MAP.get(market, "en-IN")

    @abstractmethod
    def transcribe(
        self,
        audio_bytes: Optional[bytes] = None,
        session_id: str = "",
        turn_number: int = 0,
        market: str = "in_en",
    ) -> ASRResult:
        ...


# ─────────────────────────────────────────────────────────────────────────────
# MockASR — deterministic replay (no external calls)
# ─────────────────────────────────────────────────────────────────────────────

class MockASR(ASRAdapter):
    """
    Deterministic mock ASR for testing and demo mode.
    Returns a scripted transcript cycling through predefined sentences.
    """
    provider_name = "mock"

    _MOCK_TRANSCRIPTS = [
        "Hello, I'm calling about my insurance renewal.",
        "The premium seems quite high this year.",
        "How many days do I have to make the payment?",
        "Can I pay in installments?",
        "I would like to speak to a human agent please.",
        "Thank you, I'll renew my policy.",
    ]

    def __init__(self, transcript_sequence: Optional[List[str]] = None):
        self.transcript_sequence = transcript_sequence if transcript_sequence is not None else self._MOCK_TRANSCRIPTS
        self._idx = 0

    def transcribe(
        self,
        audio_bytes: Optional[bytes] = None,
        session_id: str = "",
        turn_number: int = 0,
        market: str = "in_en",
    ) -> ASRResult:
        import random
        seq = self.transcript_sequence if self.transcript_sequence is not None else self._MOCK_TRANSCRIPTS
        if not seq:
            text = ""
        elif turn_number > 0:
            text = seq[(turn_number - 1) % len(seq)]
        else:
            text = seq[self._idx % len(seq)]
            self._idx += 1
        return ASRResult(
            session_id=session_id,
            turn_number=turn_number,
            text=text,
            confidence=round(random.uniform(0.88, 0.98), 3),
            is_final=True,
            language=self.get_language_code(market),
            provider=self.provider_name,
            latency_ms=round(random.uniform(150, 400), 1),
        )


# ─────────────────────────────────────────────────────────────────────────────
# DeepgramASR — production streaming STT
# ─────────────────────────────────────────────────────────────────────────────

class DeepgramASR(ASRAdapter):
    """
    Deepgram Nova-2 streaming ASR adapter.

    For prerecorded audio (test calls): uses synchronous transcription.
    For live streaming: use DeepgramASR.stream_websocket() in the WebSocket handler.

    Requires: DEEPGRAM_API_KEY environment variable
    Supported: en-IN ✅, id ✅, en (Taglish) ✅
    Install: pip install deepgram-sdk
    """
    provider_name = "deepgram"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("DEEPGRAM_API_KEY", "")
        self._configured = bool(self.api_key)

    def transcribe(
        self,
        audio_bytes: Optional[bytes] = None,
        session_id: str = "",
        turn_number: int = 0,
        market: str = "in_en",
    ) -> ASRResult:
        if not self._configured:
            raise NotImplementedError(
                "DeepgramASR: DEEPGRAM_API_KEY not configured. "
                "Set DEEPGRAM_API_KEY in .env to enable live transcription."
            )
        if not audio_bytes:
            raise ValueError("DeepgramASR: audio_bytes required for transcription.")

        t_start = time.perf_counter()
        try:
            import httpx

            language = DEEPGRAM_LANGUAGE_MAP.get(market, "en-IN")
            url = f"https://api.deepgram.com/v1/listen?model=nova-2&language={language}&smart_format=true&punctuate=true"

            # Keyterm boosting for Taglish / Indonesian markets
            if market == "ph_tl":
                url += "&keywords=premium:5&keywords=policy:5&keywords=lapse:4&keywords=beneficiary:4"
            elif market == "id_id":
                url += "&keywords=cicilan:5&keywords=tenor:5&keywords=jatuh%20tempo:4&keywords=premi:4"

            headers = {
                "Authorization": f"Token {self.api_key}",
                "Content-Type": "audio/wav",
            }
            with httpx.Client(timeout=30.0) as client:
                resp = client.post(url, headers=headers, content=audio_bytes)
                resp.raise_for_status()
                data = resp.json()

            channels = data.get("results", {}).get("channels", [])
            alt = channels[0].get("alternatives", [{}])[0] if channels else {}
            text = alt.get("transcript", "")
            confidence = alt.get("confidence", 0.0)
            latency_ms = round((time.perf_counter() - t_start) * 1000, 1)

            return ASRResult(
                session_id=session_id,
                turn_number=turn_number,
                text=text,
                confidence=round(confidence, 3),
                is_final=True,
                language=MARKET_LANGUAGE_MAP.get(market, "en-IN"),
                provider=self.provider_name,
                latency_ms=latency_ms,
            )
        except Exception as exc:
            latency_ms = round((time.perf_counter() - t_start) * 1000, 1)
            raise RuntimeError(f"DeepgramASR transcription failed: {exc}") from exc

    async def stream_live(
        self,
        market: str = "in_en",
        on_partial: Optional[Callable[[str], None]] = None,
        on_final: Optional[Callable[[str, float], None]] = None,
    ):
        """
        Start a live Deepgram WebSocket streaming session.
        Calls on_partial(text) for interim results.
        Calls on_final(text, confidence) for finalized utterances.

        Usage in FastAPI WebSocket handler:
          dg = DeepgramASR()
          await dg.stream_live(market="in_en",
                               on_final=lambda t, c: push_to_nudge_engine(t, c))
        """
        if not self._configured:
            raise RuntimeError("DeepgramASR: DEEPGRAM_API_KEY not configured.")

        from deepgram import DeepgramClient, LiveTranscriptionEvents, LiveOptions
        import asyncio

        client = DeepgramClient(self.api_key)
        language = DEEPGRAM_LANGUAGE_MAP.get(market, "en-IN")

        dg_connection = client.listen.asynclive.v("1")

        async def _on_message(self_ws, result, **_kwargs):
            sentence = result.channel.alternatives[0].transcript
            if not sentence:
                return
            is_final = result.is_final
            conf = result.channel.alternatives[0].confidence
            if is_final and on_final:
                on_final(sentence, conf)
            elif not is_final and on_partial:
                on_partial(sentence)

        dg_connection.on(LiveTranscriptionEvents.Transcript, _on_message)

        options = LiveOptions(
            model="nova-2",
            language=language,
            encoding="linear16",
            channels=1,
            sample_rate=16000,
            interim_results=True,
            utterance_end_ms="1000",
            vad_events=True,
            endpointing=300,
        )
        await dg_connection.start(options)
        return dg_connection


# ─────────────────────────────────────────────────────────────────────────────
# GoogleSTTASR stub (configure credentials to activate)
# ─────────────────────────────────────────────────────────────────────────────

class GoogleSTTASR(ASRAdapter):
    """
    Google Cloud Speech-to-Text (Chirp model) — best for regional Indonesian accents.

    Requires: GOOGLE_APPLICATION_CREDENTIALS environment variable
    Supported: en-IN ✅, fil-PH ✅, id-ID ✅ (Javanese/Sundanese better than Deepgram)
    Install: pip install google-cloud-speech
    """
    provider_name = "google_stt"

    def __init__(self):
        self.credentials_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "")
        self._configured = bool(self.credentials_path)

    def transcribe(
        self,
        audio_bytes: Optional[bytes] = None,
        session_id: str = "",
        turn_number: int = 0,
        market: str = "in_en",
    ) -> ASRResult:
        if not self._configured:
            raise NotImplementedError(
                "GoogleSTTASR: GOOGLE_APPLICATION_CREDENTIALS not configured. "
                "See docs/ASR_TTS_REPORT.md for setup instructions."
            )
        raise NotImplementedError("Google STT: install google-cloud-speech and configure credentials.")


# ─────────────────────────────────────────────────────────────────────────────
# TTS result dataclass
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class TTSResult:
    tts_id: str = field(default_factory=lambda: f"tts_{uuid.uuid4().hex[:8]}")
    session_id: str = ""
    turn_number: int = 0
    text: str = ""
    audio_bytes: Optional[bytes] = None
    audio_format: str = "mp3"
    duration_ms: float = 0.0
    latency_ms: float = 0.0
    voice_name: str = ""
    provider: str = "unknown"
    language: str = "en-IN"
    timestamp: float = field(default_factory=time.time)


# ─────────────────────────────────────────────────────────────────────────────
# ElevenLabs TTS voice IDs by market
# ─────────────────────────────────────────────────────────────────────────────

# ElevenLabs premade voice IDs for each market (multilingual v2 model handles all)
ELEVENLABS_VOICE_IDS: Dict[str, str] = {
    "in_en": "EXAVITQu4vr4xnSDxMaL",  # Sarah — mature, reassuring, professional English
    "ph_tl": "hpp4J3VqNfWAUOO0d1Us",  # Bella — bright, natural Filipino/Taglish
    "id_id": "pNInz6obpgDQGcFmaJgB",  # Adam — natural Bahasa Indonesia
}

MARKET_TTS_VOICES: Dict[str, Dict[str, str]] = {
    "in_en": {
        "elevenlabs": "Sarah (en-IN)",
        "elevenlabs_id": ELEVENLABS_VOICE_IDS["in_en"],
        "google": "en-IN-Wavenet-D",
        "web_speech": "en-IN",
        "notes": "Sarah provides clear, reassuring customer service tone",
    },
    "ph_tl": {
        "elevenlabs": "Bella (Taglish)",
        "elevenlabs_id": ELEVENLABS_VOICE_IDS["ph_tl"],
        "google": "fil-PH-Wavenet-A",
        "web_speech": "fil-PH",
        "notes": "Bella handles Tagalog/English code-switching fluently with multilingual v2",
    },
    "id_id": {
        "elevenlabs": "Adam (Bahasa Indonesia)",
        "elevenlabs_id": ELEVENLABS_VOICE_IDS["id_id"],
        "google": "id-ID-Wavenet-A",
        "web_speech": "id-ID",
        "notes": "Adam with multilingual v2 model; handles formal & colloquial Indonesian",
    },
}


# ─────────────────────────────────────────────────────────────────────────────
# ElevenLabsTTS — production native-voice synthesis
# ─────────────────────────────────────────────────────────────────────────────

class ElevenLabsTTS:
    """
    ElevenLabs Text-to-Speech adapter.

    Uses multilingual-v2 model for natural Filipino/Indonesian voice.
    Returns audio_bytes (mp3) that can be uploaded to R2 or streamed to browser.

    Requires: ELEVENLABS_API_KEY environment variable
    """
    provider_name = "elevenlabs"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("ELEVENLABS_API_KEY", "")
        self._configured = bool(self.api_key)

    def synthesize(
        self,
        text: str,
        session_id: str = "",
        turn_number: int = 0,
        market: str = "in_en",
        voice_id: Optional[str] = None,
    ) -> TTSResult:
        if not self._configured:
            raise RuntimeError(
                "ElevenLabsTTS: ELEVENLABS_API_KEY not configured. "
                "Set ELEVENLABS_API_KEY in .env."
            )
        t_start = time.perf_counter()
        target_voice_id = voice_id or ELEVENLABS_VOICE_IDS.get(market, ELEVENLABS_VOICE_IDS["in_en"])
        try:
            import httpx

            url = f"https://api.elevenlabs.io/v1/text-to-speech/{target_voice_id}"
            headers = {
                "xi-api-key": self.api_key,
                "Content-Type": "application/json",
            }
            payload = {
                "text": text,
                "model_id": "eleven_multilingual_v2",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75,
                },
            }
            with httpx.Client(timeout=30.0) as client:
                resp = client.post(url, headers=headers, json=payload)
                resp.raise_for_status()
                audio_bytes = resp.content

            latency_ms = round((time.perf_counter() - t_start) * 1000, 1)

            # Estimate duration: ~150 wpm for voice agents
            word_count = len(text.split())
            duration_ms = round((word_count / 150) * 60 * 1000, 0)

            return TTSResult(
                session_id=session_id,
                turn_number=turn_number,
                text=text,
                audio_bytes=audio_bytes,
                audio_format="mp3",
                duration_ms=duration_ms,
                latency_ms=latency_ms,
                voice_name=MARKET_TTS_VOICES.get(market, {}).get("elevenlabs", "Sarah"),
                provider=self.provider_name,
                language=MARKET_LANGUAGE_MAP.get(market, "en-IN"),
            )
        except Exception as exc:
            latency_ms = round((time.perf_counter() - t_start) * 1000, 1)
            raise RuntimeError(f"ElevenLabsTTS synthesis failed: {exc}") from exc


# ─────────────────────────────────────────────────────────────────────────────
# MockTTS — deterministic (no external calls)
# ─────────────────────────────────────────────────────────────────────────────

class MockTTS:
    """Mock TTS: returns realistic metadata without audio bytes. Used in testing."""
    provider_name = "mock"

    def synthesize(
        self,
        text: str,
        session_id: str = "",
        turn_number: int = 0,
        market: str = "in_en",
    ) -> TTSResult:
        import random
        word_count = len(text.split())
        duration_ms = round((word_count / 150) * 60 * 1000, 0)
        return TTSResult(
            session_id=session_id,
            turn_number=turn_number,
            text=text,
            audio_bytes=None,
            audio_format="mp3",
            duration_ms=duration_ms,
            latency_ms=round(random.uniform(100, 350), 1),
            voice_name=MARKET_TTS_VOICES[market]["elevenlabs"],
            provider=self.provider_name,
            language=MARKET_LANGUAGE_MAP.get(market, "en-IN"),
        )


# ─────────────────────────────────────────────────────────────────────────────
# VAD configuration notes (browser-side Silero VAD)
# ─────────────────────────────────────────────────────────────────────────────

VAD_CONFIG = {
    "provider": "Silero VAD (WebRTC-compatible)",
    "implementation": "Browser-side via @ricky0123/vad-web npm package",
    "threshold": 0.5,
    "min_speech_duration_ms": 200,
    "min_silence_duration_ms": 700,
    "frame_size_ms": 30,
    "notes": [
        "700ms silence = end-of-utterance trigger",
        "Raise to 900ms for noisy environments",
        "Barge-in: VAD speech-start during TTS → cancel_tts()",
    ],
    "barge_in": {
        "enabled": True,
        "mechanism": "VAD speech-start during TTS playback → cancel_tts()",
        "frontend": "window.speechSynthesis.cancel() + reset state to LISTENING",
    },
}
