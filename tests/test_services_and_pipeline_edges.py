"""Failure, security, persistence and decision-branch tests not covered by happy-path suites."""
import json
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

import pytest

from kb.pipeline.defect_detector import detect_all_defects
from kb.pipeline.fetch_parse import fetch_and_parse_all
from kb.pipeline.publisher import generate_snapshot_diff, save_snapshot
from kb.pipeline.run_pipeline import build_kb_record
from kb.pipeline.chunker import chunk_record
from services.insights.engine import InsightsEngine
from services.voice.asr_tts import DeepgramASR, GoogleSTTASR, MockASR, MockTTS
from services.voice.call_provider import LiveKitProvider, MockProvider, TurnLatencies, get_provider


def test_insights_fires_priority_alerts_suppresses_low_confidence_and_enforces_cooldown(monkeypatch):
    now = [100.0]
    monkeypatch.setattr("services.insights.engine.time.time", lambda: now[0])
    engine = InsightsEngine()
    assert engine.process_turn({"speaker": "agent", "text": "I guarantee a return"}, {})[0].action == "fired"
    again = engine.process_turn({"speaker": "agent", "text": "100% safe"}, {})[0]
    assert again.action == "suppressed" and "Cooldown" in again.suppression_reason
    noisy = engine.process_turn({"speaker": "customer", "text": "um"}, {})[0]
    assert noisy.action == "suppressed" and "Confidence" in noisy.suppression_reason
    assert engine.process_turn({"speaker": "customer", "text": "ordinary question"}, {}) == []
    now[0] += 16
    assert engine.process_turn({"speaker": "customer", "text": "My family needs cover"}, {})[0].action == "fired"


def test_mock_voice_provider_handles_empty_transcript_callbacks_and_latency_math(monkeypatch):
    provider = MockProvider([{"speaker": "agent", "text": "skip"}, {"speaker": "customer", "text": "answer"}])
    assert provider.stop_asr("s") is None  # non-customer does not incorrectly consume an agent turn
    called = []
    monkeypatch.setattr(provider, "_sim_latency", lambda _: 0)
    provider.speak("s", "hello", lambda: called.append(True))
    assert called == [True]
    ended = provider.end_call("unknown")
    assert ended["duration_s"] == 0.0
    latencies = TurnLatencies(session_id="s", turn_number=1, asr_ms=10, retrieval_ms=20, gate_ms=5, llm_ms=30, tts_ms=40)
    assert latencies.user_stops_to_bot_audio_ms == 105
    assert get_provider("mock").provider_name == "mock"
    assert get_provider("livekit").provider_name == "livekit"


def test_live_voice_and_external_asr_stubs_fail_closed_without_credentials(monkeypatch):
    monkeypatch.delenv("LIVEKIT_URL", raising=False); monkeypatch.delenv("LIVEKIT_API_KEY", raising=False); monkeypatch.delenv("LIVEKIT_API_SECRET", raising=False)
    with pytest.raises(NotImplementedError): LiveKitProvider().start_call("s")
    monkeypatch.delenv("DEEPGRAM_API_KEY", raising=False)
    with pytest.raises(NotImplementedError): DeepgramASR().transcribe()
    monkeypatch.delenv("GOOGLE_APPLICATION_CREDENTIALS", raising=False)
    with pytest.raises(NotImplementedError): GoogleSTTASR().transcribe()
    assert MockASR([]).transcribe().text == ""
    assert MockTTS().synthesize("", "unknown").language == "en-IN"


def test_defect_detection_reports_conflicts_typos_dates_and_quarantine():
    def doc(name, content, source="s"):
        return SimpleNamespace(file_path=Path(name), raw_content=content, source=SimpleNamespace(source_id=source))
    docs = [
        doc("policy_wording_hospital_cash.md", "thirty (30) calendar days", "policy"),
        doc("website_renewal_faq.html", "grace period of 15 days", "faq"),
        doc("meridian_shield.md", "INR 120,000", "brochure"),
        doc("schedule.csv", "01/02/2024; 03-04-2024", "csv"),
    ]
    quarantined = [SimpleNamespace(source_id="bad", reason_code="low_health", uri="file://bad", extraction_health=0.1)]
    issues, resolutions = detect_all_defects(docs, quarantined)
    assert {i.issue_id for i in issues} >= {"issue_conflict_grace_period", "issue_typo_rate_table", "issue_date_format_drift", "issue_quarantine_bad"}
    assert resolutions["grace_period"]["correct_value"] == 30


def test_fetch_parse_quarantines_low_health_file_and_parses_valid_document(tmp_path):
    raw, quarantine = tmp_path / "raw", tmp_path / "q"; raw.mkdir()
    (raw / "valid.md").write_text("# Policy\nThis is a sufficiently detailed policy text with renewal rules and other meaningful content.")
    (raw / "bad.txt").write_text("@!" * 20)
    docs = fetch_and_parse_all(raw, quarantine)
    assert len(docs) == 1 and docs[0].source.status == "ok"
    assert (quarantine / "bad.txt").exists()


def test_snapshot_publisher_writes_serialized_models_and_diff_is_safe_when_baseline_missing(tmp_path):
    rec = build_kb_record("r", "v1", "Title", "content", "faq", "faq/x", "s", "cite")
    chunk = chunk_record(rec, "v1")[0]
    source = SimpleNamespace(model_dump=lambda: {"source_id": "s"})
    # Use a real Pydantic source because publisher serializes models uniformly.
    from kb.schema.models import KbSource
    source = KbSource(source_id="s", type="website", uri="x", content_hash="h")
    save_snapshot(tmp_path / "v1", "v1", [rec], [chunk], [source], [])
    metadata = json.loads((tmp_path / "v1" / "metadata.json").read_text())
    assert metadata["total_records"] == 1 and metadata["total_chunks"] == 1
    out = tmp_path / "diff.json"; generate_snapshot_diff(tmp_path / "missing", tmp_path / "v1", out)
    assert not out.exists()
    save_snapshot(tmp_path / "v0", "v0", [rec], [chunk], [source], [])
    generate_snapshot_diff(tmp_path / "v0", tmp_path / "v1", out)
    assert json.loads(out.read_text())["target_version"] == "v1.1"
