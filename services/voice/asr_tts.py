"""ASR adapter for PARLEY Voice Agent.

Implementations:
  - WebSpeechASR: uses browser's SpeechRecognition API (en-IN, en-PH, id-ID supported)
  - DeepgramASR: production streaming ASR (configured via DEEPGRAM_API_KEY)
  - GoogleSTTASR: Google Cloud Speech-to-Text (configured via GOOGLE_APPLICATION_CREDENTIALS)
  - MockASR: deterministic transcript replay for testing

All return normalized text with language tags and confidence scores.
VAD (Voice Activity Detection) is handled by Silero VAD integration notes below.
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
# ASR result
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
# Market → language code mapping
# ─────────────────────────────────────────────────────────────────────────────

MARKET_LANGUAGE_MAP: Dict[str, str] = {
    "in_en": "en-IN",
    "ph_tl": "fil-PH",
    "id_id": "id-ID",
}

ASR_PROVIDER_NOTES = {
    "in_en": {
        "preferred": "Google Cloud STT (en-IN, Chirp model)",
        "alternative": "Deepgram Nova-2 (en-IN enhanced)",
        "web_speech": "SpeechRecognition(lang='en-IN') — supported in Chrome/Edge",
        "phrase_boosting": [
            "SecureLife", "premium", "grace period", "policy", "sum assured",
            "nominee", "renewal", "term plan", "ULIP", "maturity"
        ],
        "wer_estimate": "~8-12% on insurance domain (phrase-boosted)",
        "notes": "en-IN accent support is good across all major providers."
    },
    "ph_tl": {
        "preferred": "Google Cloud STT (fil-PH)",
        "alternative": "Deepgram Nova-2 does not support fil-PH natively; use en-PH as fallback",
        "web_speech": "SpeechRecognition(lang='fil-PH') — partial support",
        "phrase_boosting": [
            "premium", "palugit", "patakaran", "benepisyaryo", "bayad", "po", "opo"
        ],
        "wer_estimate": "~15-20% on Taglish code-switching",
        "code_switching": "Filipino speakers mix English finance terms; provider must handle both",
        "notes": "Code-switching (Taglish) is the main challenge. Google fil-PH handles ~70% correctly."
    },
    "id_id": {
        "preferred": "Google Cloud STT (id-ID)",
        "alternative": "Deepgram Nova-2 (id-ID beta)",
        "web_speech": "SpeechRecognition(lang='id-ID') — supported",
        "phrase_boosting": [
            "premi", "polis", "cicilan", "masa tenggang", "jatuh tempo",
            "angsuran", "pembiayaan", "klaim", "SecureLife"
        ],
        "wer_estimate": "~10-15% on Jakarta standard; ~20-25% on regional accents",
        "accent_notes": "Regional accents (Javanese, Sundanese) significantly increase WER vs Jakarta standard.",
        "notes": "Indonesian has good provider support. Numeral parsing (tiga juta) needs post-processing."
    }
}


# ─────────────────────────────────────────────────────────────────────────────
# Abstract ASR Adapter
# ─────────────────────────────────────────────────────────────────────────────

class ASRAdapter(ABC):
    """Abstract ASR adapter."""
    provider_name: str = "abstract"

    @abstractmethod
    def transcribe(
        self,
        audio_bytes: Optional[bytes] = None,
        session_id: str = "",
        turn_number: int = 0,
        market: str = "in_en",
    ) -> ASRResult:
        """Transcribe audio and return ASRResult."""
        ...

    def get_language_code(self, market: str) -> str:
        return MARKET_LANGUAGE_MAP.get(market, "en-IN")


# ─────────────────────────────────────────────────────────────────────────────
# MockASR — deterministic replay
# ─────────────────────────────────────────────────────────────────────────────

class MockASR(ASRAdapter):
    """Deterministic ASR for testing — returns preset transcripts."""
    provider_name = "mock"

    def __init__(self, transcript_sequence: Optional[List[str]] = None):
        self._transcripts = transcript_sequence or []
        self._index = 0

    def transcribe(
        self,
        audio_bytes: Optional[bytes] = None,
        session_id: str = "",
        turn_number: int = 0,
        market: str = "in_en",
    ) -> ASRResult:
        import random
        text = ""
        if self._index < len(self._transcripts):
            text = self._transcripts[self._index]
            self._index += 1

        return ASRResult(
            session_id=session_id,
            turn_number=turn_number,
            text=text,
            confidence=round(random.uniform(0.82, 0.98), 3),
            is_final=True,
            language=self.get_language_code(market),
            provider=self.provider_name,
            latency_ms=round(random.uniform(150, 400), 1),
        )


# ─────────────────────────────────────────────────────────────────────────────
# DeepgramASR stub
# ─────────────────────────────────────────────────────────────────────────────

class DeepgramASR(ASRAdapter):
    """
    Deepgram Nova-2 streaming ASR adapter.

    Requires: DEEPGRAM_API_KEY environment variable
    Supported languages: en-IN, id-ID (fil-PH not natively supported)
    Install: pip install deepgram-sdk

    Phrase boosting: configured via keywords parameter in DeepgramOptions.
    """
    provider_name = "deepgram"

    def __init__(self):
        self.api_key = os.environ.get("DEEPGRAM_API_KEY", "")
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
                "DeepgramASR requires DEEPGRAM_API_KEY. "
                "See docs/ASR_TTS_REPORT.md for setup instructions."
            )
        # In production:
        # from deepgram import DeepgramClient, PrerecordedOptions
        # client = DeepgramClient(self.api_key)
        # options = PrerecordedOptions(model="nova-2", language=self.get_language_code(market))
        # response = client.listen.prerecorded.v("1").transcribe_file(audio_bytes, options)
        raise NotImplementedError("Deepgram production integration. See docs/ASR_TTS_REPORT.md.")


# ─────────────────────────────────────────────────────────────────────────────
# GoogleSTTASR stub
# ─────────────────────────────────────────────────────────────────────────────

class GoogleSTTASR(ASRAdapter):
    """
    Google Cloud Speech-to-Text ASR adapter (Chirp model).

    Requires: GOOGLE_APPLICATION_CREDENTIALS environment variable
    Supported: en-IN ✅, fil-PH ✅, id-ID ✅
    Install: pip install google-cloud-speech

    Phrase boosting: SpeechContext with boost weights up to 20.
    Streaming: via StreamingRecognizeRequest for real-time VAD.
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
                "GoogleSTTASR requires GOOGLE_APPLICATION_CREDENTIALS. "
                "See docs/ASR_TTS_REPORT.md for setup instructions."
            )
        # In production: use google.cloud.speech.SpeechClient
        raise NotImplementedError("Google STT production integration. See docs/ASR_TTS_REPORT.md.")


# ─────────────────────────────────────────────────────────────────────────────
# TTS Adapter
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


MARKET_TTS_VOICES: Dict[str, Dict[str, str]] = {
    "in_en": {
        "google": "en-IN-Wavenet-D",          # Female, natural
        "google_male": "en-IN-Wavenet-B",
        "elevenlabs": "Indian English Female",
        "web_speech": "en-IN",
        "notes": "WaveNet D is clearest for insurance domain"
    },
    "ph_tl": {
        "google": "fil-PH-Wavenet-A",          # Filipino female
        "google_male": "fil-PH-Wavenet-B",
        "elevenlabs": "Filipino Female",
        "web_speech": "fil-PH",
        "notes": "Limited SSML for Filipino; English loanwords generally fine",
        "ssml_loanwords": ["premium", "policy", "claim", "coverage", "beneficiary"]
    },
    "id_id": {
        "google": "id-ID-Wavenet-A",           # Indonesian female
        "google_male": "id-ID-Wavenet-B",
        "elevenlabs": "Indonesian Female",
        "web_speech": "id-ID",
        "notes": "SSML needed for amounts: tiga juta lima ratus ribu → 3.500.000"
    }
}


class MockTTS:
    """Mock TTS that returns simulated audio metadata."""
    provider_name = "mock"

    def synthesize(
        self,
        text: str,
        session_id: str = "",
        turn_number: int = 0,
        market: str = "in_en",
    ) -> TTSResult:
        import random
        # Estimate duration: ~150 words/minute speaking rate
        word_count = len(text.split())
        duration_ms = round((word_count / 150) * 60 * 1000, 0)
        return TTSResult(
            session_id=session_id,
            turn_number=turn_number,
            text=text,
            audio_bytes=None,    # No actual audio in mock
            audio_format="mp3",
            duration_ms=duration_ms,
            latency_ms=round(random.uniform(100, 350), 1),
            voice_name=MARKET_TTS_VOICES[market]["google"],
            provider=self.provider_name,
            language=MARKET_LANGUAGE_MAP.get(market, "en-IN"),
        )


# ─────────────────────────────────────────────────────────────────────────────
# VAD configuration notes
# ─────────────────────────────────────────────────────────────────────────────

VAD_CONFIG = {
    "provider": "Silero VAD (WebRTC-compatible)",
    "implementation": "Browser-side via @ricky0123/vad-web npm package",
    "threshold": 0.5,
    "min_speech_duration_ms": 200,
    "min_silence_duration_ms": 700,   # Silence after speech = end-of-utterance
    "frame_size_ms": 30,
    "notes": [
        "700ms silence threshold balances responsiveness vs false end-of-turn detection",
        "In noisy environments, raise to 900ms",
        "Barge-in: when new speech detected during TTS playback → cancel_tts() immediately"
    ],
    "barge_in": {
        "enabled": True,
        "mechanism": "VAD speech-start event during TTS playback triggers cancel_tts()",
        "frontend": "window.speechSynthesis.cancel() + reset agent state to LISTENING"
    }
}
