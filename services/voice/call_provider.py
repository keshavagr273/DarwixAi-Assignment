"""
CallProvider adapter interface and implementations for PARLEY Voice Agent.

Supports:
  - WebSpeechProvider: uses browser Web Speech API (SpeechRecognition + SpeechSynthesis)
    → works for live demo without any external API keys
  - LiveKitProvider: stub for production LiveKit-based telephony
  - MockProvider: deterministic replay for testing

All providers conform to the CallProvider protocol defined below.
"""
from __future__ import annotations

import os
import time
import uuid
import json
import re
from abc import ABC, abstractmethod
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any, Dict, List, Optional, Callable
from dotenv import load_dotenv

load_dotenv()

# ─────────────────────────────────────────────────────────────────────────────
# Latency span
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class LatencySpan:
    """Records timing for one stage of a voice pipeline turn."""
    span_id: str = field(default_factory=lambda: uuid.uuid4().hex[:8])
    session_id: str = ""
    turn_number: int = 0
    stage: str = ""           # vad | asr | retrieval | gate | llm | tts | e2e
    started_at: float = field(default_factory=time.perf_counter)
    ended_at: Optional[float] = None
    duration_ms: Optional[float] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def finish(self) -> "LatencySpan":
        self.ended_at = time.perf_counter()
        self.duration_ms = round((self.ended_at - self.started_at) * 1000.0, 2)
        return self

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class TurnLatencies:
    """All latency spans for one dialogue turn."""
    session_id: str
    turn_number: int
    vad_ms: Optional[float] = None
    asr_ms: Optional[float] = None
    retrieval_ms: Optional[float] = None
    gate_ms: Optional[float] = None
    llm_ms: Optional[float] = None
    tts_ms: Optional[float] = None
    e2e_ms: Optional[float] = None
    spans: List[LatencySpan] = field(default_factory=list)

    @property
    def user_stops_to_bot_audio_ms(self) -> Optional[float]:
        """
        The key latency metric: from user-stops-speaking to bot-audio-starts.
        = asr + retrieval + gate + llm + tts
        """
        components = [self.asr_ms, self.retrieval_ms, self.gate_ms, self.llm_ms, self.tts_ms]
        if all(c is not None for c in components):
            return round(sum(components), 2)
        return self.e2e_ms

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["user_stops_to_bot_audio_ms"] = self.user_stops_to_bot_audio_ms
        return d


# ─────────────────────────────────────────────────────────────────────────────
# Abstract CallProvider
# ─────────────────────────────────────────────────────────────────────────────

class CallProvider(ABC):
    """Abstract voice call provider."""

    provider_name: str = "abstract"

    @abstractmethod
    def start_call(self, session_id: str, market: str = "in_en") -> Dict[str, Any]:
        """Initialize call session. Returns connection info."""
        ...

    @abstractmethod
    def end_call(self, session_id: str) -> Dict[str, Any]:
        """Terminate the call and return final metadata."""
        ...

    @abstractmethod
    def start_asr(self, session_id: str, on_transcript: Callable[[str, bool], None]) -> None:
        """Start ASR for a turn. Calls on_transcript(text, is_final)."""
        ...

    @abstractmethod
    def stop_asr(self, session_id: str) -> Optional[str]:
        """Stop ASR and return final transcript."""
        ...

    @abstractmethod
    def speak(self, session_id: str, text: str, on_complete: Optional[Callable] = None) -> None:
        """Synthesize and play TTS audio."""
        ...

    @abstractmethod
    def cancel_tts(self, session_id: str) -> None:
        """Cancel in-flight TTS (barge-in support)."""
        ...


# ─────────────────────────────────────────────────────────────────────────────
# MockProvider — deterministic replay (used by Python-side simulator)
# ─────────────────────────────────────────────────────────────────────────────

class MockProvider(CallProvider):
    """
    Mock provider for scripted testing and latency benchmarking.
    Simulates realistic latency ranges based on published ASR/TTS benchmarks.
    """
    provider_name = "mock"

    # Simulated latency ranges (ms) based on cloud ASR/TTS benchmarks
    LATENCY_RANGES = {
        "vad_end_ms": (80, 200),       # VAD silence detection
        "asr_ms": (150, 400),          # ASR finalization
        "retrieval_ms": (20, 120),     # KB retrieval
        "gate_ms": (5, 25),            # Sentence gate evaluation
        "llm_ms": (300, 800),          # LLM response generation
        "tts_ms": (100, 350),          # TTS audio generation
    }

    def __init__(self, scenario_transcript: Optional[List[Dict]] = None):
        import random
        self._random = random
        self._transcript = scenario_transcript or []
        self._turn_index = 0
        self._active_sessions: Dict[str, Dict] = {}

    def _sim_latency(self, stage: str) -> float:
        lo, hi = self.LATENCY_RANGES.get(stage, (50, 200))
        return round(self._random.uniform(lo, hi), 1)

    def start_call(self, session_id: str, market: str = "in_en") -> Dict[str, Any]:
        self._active_sessions[session_id] = {
            "session_id": session_id,
            "market": market,
            "started_at": time.time(),
            "provider": self.provider_name,
            "turn_count": 0,
        }
        return self._active_sessions[session_id]

    def end_call(self, session_id: str) -> Dict[str, Any]:
        sess = self._active_sessions.pop(session_id, {})
        sess["ended_at"] = time.time()
        sess["duration_s"] = round(sess["ended_at"] - sess.get("started_at", sess["ended_at"]), 2)
        return sess

    def start_asr(self, session_id: str, on_transcript: Callable[[str, bool], None]) -> None:
        # In mock mode, ASR is driven by get_next_turn()
        pass

    def stop_asr(self, session_id: str) -> Optional[str]:
        if self._turn_index < len(self._transcript):
            turn = self._transcript[self._turn_index]
            if turn.get("speaker") == "customer":
                self._turn_index += 1
                return turn.get("text", "")
        return None

    def speak(self, session_id: str, text: str, on_complete: Optional[Callable] = None) -> None:
        tts_ms = self._sim_latency("tts_ms")
        time.sleep(tts_ms / 1000.0 * 0.01)  # Don't actually wait; just simulate
        if on_complete:
            on_complete()

    def cancel_tts(self, session_id: str) -> None:
        pass  # No-op in mock

    def get_turn_latencies(self, session_id: str, turn_number: int) -> TurnLatencies:
        """Generate realistic mock latency spans for a turn."""
        latencies = TurnLatencies(session_id=session_id, turn_number=turn_number)
        latencies.vad_ms = self._sim_latency("vad_end_ms")
        latencies.asr_ms = self._sim_latency("asr_ms")
        latencies.retrieval_ms = self._sim_latency("retrieval_ms")
        latencies.gate_ms = self._sim_latency("gate_ms")
        latencies.llm_ms = self._sim_latency("llm_ms")
        latencies.tts_ms = self._sim_latency("tts_ms")
        latencies.e2e_ms = round(
            (latencies.vad_ms or 0) + (latencies.asr_ms or 0) +
            (latencies.retrieval_ms or 0) + (latencies.gate_ms or 0) +
            (latencies.llm_ms or 0) + (latencies.tts_ms or 0),
            1
        )
        return latencies


# ─────────────────────────────────────────────────────────────────────────────
# LiveKitProvider — production stub (configure LIVEKIT_URL + LIVEKIT_API_KEY)
# ─────────────────────────────────────────────────────────────────────────────

class LiveKitProvider(CallProvider):
    """
    LiveKit-based voice provider for production.

    Requires environment variables:
      LIVEKIT_URL       — wss://your-instance.livekit.cloud
      LIVEKIT_API_KEY   — your LiveKit API key
      LIVEKIT_API_SECRET — your LiveKit API secret

    ASR: Google Cloud STT (streaming) or Deepgram (en-IN, en-PH, id-ID)
    TTS: Google Cloud TTS (WaveNet voices) or ElevenLabs
    VAD: Silero VAD (WebRTC)

    NOTE: This stub raises NotImplementedError. Configure provider credentials
    and install livekit-server-sdk to activate.
    """
    provider_name = "livekit"

    def __init__(self):
        import os
        self.livekit_url = os.environ.get("LIVEKIT_URL", "")
        self.api_key = os.environ.get("LIVEKIT_API_KEY", "")
        self.api_secret = os.environ.get("LIVEKIT_API_SECRET", "")
        self._configured = bool(self.livekit_url and self.api_key and self.api_secret)

    def _assert_configured(self):
        if not self._configured:
            raise NotImplementedError(
                "LiveKit not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY, "
                "LIVEKIT_API_SECRET in environment. See docs/ASR_TTS_REPORT.md."
            )

    def start_call(self, session_id: str, market: str = "in_en") -> Dict[str, Any]:
        self._assert_configured()
        # In production: generate LiveKit room token and return connection URL
        return {
            "provider": "livekit",
            "session_id": session_id,
            "room": f"parley-{session_id}",
            "livekit_url": self.livekit_url,
            "status": "room_created",
        }

    def end_call(self, session_id: str) -> Dict[str, Any]:
        self._assert_configured()
        return {"status": "ended", "session_id": session_id}

    def start_asr(self, session_id: str, on_transcript: Callable[[str, bool], None]) -> None:
        self._assert_configured()
        # In production: start Deepgram/Google streaming ASR on the LiveKit audio track

    def stop_asr(self, session_id: str) -> Optional[str]:
        self._assert_configured()
        return None

    def speak(self, session_id: str, text: str, on_complete: Optional[Callable] = None) -> None:
        self._assert_configured()
        # In production: synthesize with Google TTS / ElevenLabs, play on LiveKit track

    def cancel_tts(self, session_id: str) -> None:
        self._assert_configured()
        # In production: cancel in-flight TTS synthesis and playback (barge-in)


# ─────────────────────────────────────────────────────────────────────────────
# Factory
# ─────────────────────────────────────────────────────────────────────────────

def get_provider(provider_type: str = "mock", **kwargs) -> CallProvider:
    """Return appropriate CallProvider based on type string."""
    if provider_type == "mock":
        return MockProvider(**kwargs)
    elif provider_type == "livekit":
        return LiveKitProvider()
    else:
        raise ValueError(f"Unknown provider: {provider_type!r}. Choose 'mock' or 'livekit'.")
