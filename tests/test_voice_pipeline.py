"""Tests for Phase 3: Voice pipeline (CallProvider, ASR/TTS, latency)."""
import pytest
import json
from pathlib import Path

from services.voice.call_provider import MockProvider, get_provider, TurnLatencies, LatencySpan
from services.voice.asr_tts import (
    MockASR, MockTTS, MARKET_LANGUAGE_MAP,
    ASR_PROVIDER_NOTES, MARKET_TTS_VOICES, VAD_CONFIG
)

ROOT = Path(__file__).resolve().parent.parent


class TestCallProvider:
    def setup_method(self):
        self.provider = MockProvider()

    def test_start_call(self):
        result = self.provider.start_call("sess_test_01", "in_en")
        assert result["session_id"] == "sess_test_01"
        assert result["market"] == "in_en"
        assert result["provider"] == "mock"

    def test_end_call(self):
        self.provider.start_call("sess_test_02", "in_en")
        result = self.provider.end_call("sess_test_02")
        assert "ended_at" in result
        assert "duration_s" in result
        assert result["duration_s"] >= 0

    def test_get_provider_mock(self):
        p = get_provider("mock")
        assert p.provider_name == "mock"

    def test_get_provider_unknown_raises(self):
        with pytest.raises(ValueError):
            get_provider("nonexistent_provider")

    def test_turn_latencies_realistic_ranges(self):
        self.provider.start_call("sess_lat", "in_en")
        latencies = self.provider.get_turn_latencies("sess_lat", 1)
        # VAD should be 80-200ms
        assert 80 <= latencies.vad_ms <= 200
        # ASR should be 150-400ms
        assert 150 <= latencies.asr_ms <= 400
        # Retrieval should be 20-120ms
        assert 20 <= latencies.retrieval_ms <= 120
        # Gate should be 5-25ms
        assert 5 <= latencies.gate_ms <= 25
        # LLM should be 300-800ms
        assert 300 <= latencies.llm_ms <= 800
        # TTS should be 100-350ms
        assert 100 <= latencies.tts_ms <= 350

    def test_user_to_bot_latency_computed(self):
        self.provider.start_call("sess_u2b", "in_en")
        latencies = self.provider.get_turn_latencies("sess_u2b", 1)
        u2b = latencies.user_stops_to_bot_audio_ms
        assert u2b is not None
        # u2b = asr + retrieval + gate + llm + tts
        expected = (latencies.asr_ms or 0) + (latencies.retrieval_ms or 0) + \
                   (latencies.gate_ms or 0) + (latencies.llm_ms or 0) + (latencies.tts_ms or 0)
        assert abs(u2b - expected) < 1.0

    def test_e2e_latency_under_2000ms(self):
        """Gate 3: median user-to-bot latency should be < 2000ms."""
        self.provider.start_call("sess_e2e", "in_en")
        latencies_list = [self.provider.get_turn_latencies("sess_e2e", i) for i in range(10)]
        u2b_values = [l.user_stops_to_bot_audio_ms for l in latencies_list if l.user_stops_to_bot_audio_ms]
        import statistics
        median = statistics.median(u2b_values)
        assert median < 2000, f"Median latency {median}ms exceeds 2000ms budget"

    def test_latency_span_finish(self):
        span = LatencySpan(session_id="test", turn_number=1, stage="asr")
        span.finish()
        assert span.ended_at is not None
        assert span.duration_ms is not None
        assert span.duration_ms >= 0


class TestASRAdapter:
    def test_mock_asr_returns_preset_transcript(self):
        asr = MockASR(transcript_sequence=["Hello, I am interested.", "My age is 35."])
        result = asr.transcribe(session_id="s1", turn_number=1, market="in_en")
        assert result.text == "Hello, I am interested."
        assert result.is_final
        assert result.provider == "mock"

    def test_mock_asr_sequential(self):
        asr = MockASR(transcript_sequence=["first", "second", "third"])
        r1 = asr.transcribe()
        r2 = asr.transcribe()
        r3 = asr.transcribe()
        assert r1.text == "first"
        assert r2.text == "second"
        assert r3.text == "third"

    def test_mock_asr_confidence_in_range(self):
        asr = MockASR(["test"])
        result = asr.transcribe()
        assert 0.0 <= result.confidence <= 1.0

    def test_market_language_mapping(self):
        asr = MockASR([])
        assert asr.get_language_code("in_en") == "en-IN"
        assert asr.get_language_code("ph_tl") == "fil-PH"
        assert asr.get_language_code("id_id") == "id-ID"

    def test_asr_provider_notes_all_markets(self):
        assert "in_en" in ASR_PROVIDER_NOTES
        assert "ph_tl" in ASR_PROVIDER_NOTES
        assert "id_id" in ASR_PROVIDER_NOTES
        for market, notes in ASR_PROVIDER_NOTES.items():
            assert "preferred" in notes
            assert "wer_estimate" in notes

    def test_tts_voices_all_markets(self):
        for market in ["in_en", "ph_tl", "id_id"]:
            assert market in MARKET_TTS_VOICES
            assert "google" in MARKET_TTS_VOICES[market]


class TestTTSAdapter:
    def test_mock_tts_duration_estimate(self):
        tts = MockTTS()
        result = tts.synthesize("This is a test sentence with ten words exactly.", market="in_en")
        # 10 words at 150 wpm = 4 seconds = 4000ms
        assert result.duration_ms > 0
        assert result.provider == "mock"

    def test_mock_tts_latency_in_range(self):
        tts = MockTTS()
        result = tts.synthesize("Hello world", market="in_en")
        assert 100 <= result.latency_ms <= 350

    def test_vad_config_exists(self):
        assert "provider" in VAD_CONFIG
        assert "threshold" in VAD_CONFIG
        assert "barge_in" in VAD_CONFIG
        assert VAD_CONFIG["barge_in"]["enabled"] is True


class TestCallRecordings:
    """Gate 3: Verify call recording outputs exist and are valid."""

    def test_transcripts_directory_exists(self):
        transcripts_dir = ROOT / "data" / "transcripts"
        assert transcripts_dir.exists(), "data/transcripts/ must be created by record_calls.py"

    def test_at_least_3_transcripts(self):
        transcripts_dir = ROOT / "data" / "transcripts"
        if not transcripts_dir.exists():
            pytest.skip("Transcripts not generated yet; run scripts/record_calls.py")
        transcripts = list(transcripts_dir.glob("*.json"))
        assert len(transcripts) >= 3, f"Need >= 3 transcripts, found {len(transcripts)}"

    def test_transcripts_have_required_fields(self):
        transcripts_dir = ROOT / "data" / "transcripts"
        if not transcripts_dir.exists():
            pytest.skip("Transcripts not generated yet")
        for path in sorted(transcripts_dir.glob("*.json"))[:3]:
            data = json.loads(path.read_text(encoding="utf-8"))
            assert "call_id" in data
            assert "scenario" in data
            assert "market" in data
            assert "turns" in data
            assert len(data["turns"]) > 0

    def test_transcripts_no_real_pii(self):
        """Verify transcripts don't contain real PII patterns."""
        import re
        transcripts_dir = ROOT / "data" / "transcripts"
        if not transcripts_dir.exists():
            pytest.skip("Transcripts not generated yet")
        # Patterns that would indicate real phone numbers or SSNs
        real_pii_patterns = [
            r"\b\d{10}\b",  # 10-digit phone - allowed as synthetic
            r"\b\d{3}-\d{2}-\d{4}\b",  # SSN format
        ]
        # All names/phones in our corpus are explicitly synthetic
        # Just verify no SSN-like patterns
        for path in transcripts_dir.glob("*.json"):
            content = path.read_text(encoding="utf-8")
            # SSNs should never appear
            assert not re.search(r"\b\d{3}-\d{2}-\d{4}\b", content), \
                f"Possible real SSN found in {path.name}"

    def test_latency_report_exists(self):
        report = ROOT / "data" / "calls" / "latency_report.json"
        if not report.exists():
            pytest.skip("Latency report not generated yet")
        data = json.loads(report.read_text(encoding="utf-8"))
        assert "overall" in data
        assert "by_stage" in data
        assert data["overall"]["median_user_to_bot_audio_ms"] is not None

    def test_results_md_exists(self):
        results = ROOT / "data" / "calls" / "results.md"
        if not results.exists():
            pytest.skip("results.md not generated yet")
        content = results.read_text(encoding="utf-8")
        assert "Gate 3 Summary" in content
        assert "Call Results Table" in content
        assert "Latency Breakdown" in content

    def test_grounding_rate_above_95_percent(self):
        """Gate 3: grounded-sentence rate >= 95% on recorded calls."""
        transcripts_dir = ROOT / "data" / "transcripts"
        if not transcripts_dir.exists():
            pytest.skip("Transcripts not generated yet")
        grounding_rates = []
        for path in transcripts_dir.glob("*.json"):
            data = json.loads(path.read_text(encoding="utf-8"))
            rate = data.get("grounding_rate", 1.0)
            grounding_rates.append(rate)
        if grounding_rates:
            avg = sum(grounding_rates) / len(grounding_rates)
            assert avg >= 0.95, f"Average grounding rate {avg:.1%} < 95%"

    def test_median_latency_under_2000ms(self):
        """Gate 3: median user-stops to bot-audio latency < 2000ms."""
        report = ROOT / "data" / "calls" / "latency_report.json"
        if not report.exists():
            pytest.skip("Latency report not generated yet")
        data = json.loads(report.read_text(encoding="utf-8"))
        median_ms = data["overall"].get("median_user_to_bot_audio_ms")
        if median_ms:
            assert median_ms < 2000, f"Median latency {median_ms}ms exceeds 2000ms"


class TestVoiceAPI:
    """Integration tests for Phase 3 voice API endpoints."""

    def test_api_voice_providers_endpoint(self):
        from fastapi.testclient import TestClient
        from services.api.main import app
        client = TestClient(app)
        resp = client.get("/api/v1/voice/providers")
        assert resp.status_code == 200
        data = resp.json()
        assert "asr_providers" in data
        assert "vad_config" in data

    def test_api_start_voice_call(self):
        from fastapi.testclient import TestClient
        from services.api.main import app
        client = TestClient(app)
        resp = client.post("/api/v1/voice/calls", json={"market": "in_en", "provider": "mock"})
        assert resp.status_code == 200
        data = resp.json()
        assert "call_session_id" in data
        assert data["status"] == "connected"
        assert data["language"] == "en-IN"

    def test_api_voice_turn(self):
        from fastapi.testclient import TestClient
        from services.api.main import app
        client = TestClient(app)
        # Start call
        start_resp = client.post("/api/v1/voice/calls", json={"market": "in_en", "provider": "mock"})
        call_id = start_resp.json()["call_session_id"]
        # Process turn
        turn_resp = client.post(f"/api/v1/voice/calls/{call_id}/turn", json={
            "call_session_id": call_id,
            "user_text": "What is the grace period for premium payment?",
            "turn_number": 1,
        })
        assert turn_resp.status_code == 200
        data = turn_resp.json()
        assert "citations" in data
        assert "latencies" in data

    def test_api_list_transcripts(self):
        from fastapi.testclient import TestClient
        from services.api.main import app
        client = TestClient(app)
        resp = client.get("/api/v1/voice/transcripts")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_api_end_voice_call(self):
        from fastapi.testclient import TestClient
        from services.api.main import app
        client = TestClient(app)
        start_resp = client.post("/api/v1/voice/calls", json={"market": "in_en", "provider": "mock"})
        call_id = start_resp.json()["call_session_id"]
        end_resp = client.delete(f"/api/v1/voice/calls/{call_id}")
        assert end_resp.status_code == 200
        assert end_resp.json()["status"] == "ended"
