"""API contract, lifecycle, persistence-isolation and negative-path tests."""
import json
from pathlib import Path
from unittest.mock import Mock

import pytest
from fastapi.testclient import TestClient

from services.agent import tools
from services.agent.fsm_engine import DialogueFSM, _SESSIONS
from services.api import main


@pytest.fixture(autouse=True)
def isolate_state(monkeypatch, tmp_path):
    _SESSIONS.clear(); main._CALL_SESSIONS.clear()
    monkeypatch.setattr(tools, "CRM_LOG", tmp_path / "leads.jsonl")
    monkeypatch.setattr(tools, "CALLBACK_LOG", tmp_path / "callbacks.jsonl")
    monkeypatch.setattr(tools, "ESCALATION_LOG", tmp_path / "escalations.jsonl")
    monkeypatch.setattr(tools, "OPT_OUT_LOG", tmp_path / "opt_outs.jsonl")
    yield
    _SESSIONS.clear(); main._CALL_SESSIONS.clear()


@pytest.fixture
def client():
    return TestClient(main.app, raise_server_exceptions=False)


def test_agent_tools_serialize_retrieval_and_persist_each_crm_action(monkeypatch):
    result = Mock(record_id="r", text="answer", score=.9, kb_version="v1", source_ref="src", citation="cite")
    retriever = Mock(); retriever.search.return_value = ([result], False)
    monkeypatch.setattr(tools, "get_retriever", lambda: retriever)
    retrieved = tools.retrieve_kb("question", session_id="s")
    assert retrieved["results"][0]["content"] == "answer" and retrieved["citations"] == ["cite"]
    lead = tools.create_lead_or_update_crm("s", "A", "999", slots={"age": 30})
    callback = tools.schedule_callback("s", "999", "A")
    escalation = tools.escalate_human("s", "requested")
    opt_out = tools.log_opt_out("s", "999")
    assert lead["status"] == "created" and callback["preferred_time"] == "flexible"
    assert escalation["webhook_payload"]["event"] == "agent.escalation" and opt_out["status"] == "recorded"
    for log in (tools.CRM_LOG, tools.CALLBACK_LOG, tools.ESCALATION_LOG, tools.OPT_OUT_LOG):
        assert json.loads(log.read_text().strip())["session_id"] == "s"


@pytest.mark.parametrize("text,intent", [
    ("I want to speak to a manager", "human_request"), ("no thanks", "not_interested"),
    ("call me later", "callback_requested"), ("what is the price", "question_asked"),
    ("sure, proceed", "interested"), ("this is too expensive", "objection_raised"),
    ("wrong number", "name_rejected"), ("hello", "continue"),
])
def test_fsm_intent_priority_and_state_safety(text, intent):
    assert DialogueFSM().detect_intent(text) == intent


def test_fsm_qualification_rejects_age_and_income_and_terminal_session_cannot_change():
    fsm = DialogueFSM()
    fsm.session.current_state = "QUALIFICATION"
    fsm.session.slots = {"age": "17"}
    assert fsm.evaluate_qualification() == (False, "NOT_ELIGIBLE")
    fsm.session.slots = {"age": 30, "annual_income": 100}
    assert fsm.evaluate_qualification() == (False, "LOW_INCOME_SOFT_END")
    fsm.session.is_terminal = True
    assert fsm.transition("interested")["error"] == "Session is already terminated"


def test_api_validates_requests_and_supports_complete_agent_session_lifecycle(client):
    assert client.post("/api/v1/retrieval/search", json={}).status_code == 422
    created = client.post("/api/v1/agent/sessions", json={"market": "in_en"})
    assert created.status_code == 200
    sid = created.json()["session_id"]
    assert client.post(f"/api/v1/agent/sessions/{sid}/turn", json={"session_id": sid}).status_code == 422
    turn = client.post(f"/api/v1/agent/sessions/{sid}/turn", json={"session_id": sid, "user_input": "hello"})
    assert turn.status_code == 200 and turn.json()["turn_count"] == 1
    assert client.get(f"/api/v1/agent/sessions/{sid}").json()["session_id"] == sid
    assert client.delete(f"/api/v1/agent/sessions/{sid}").status_code == 200
    assert client.get(f"/api/v1/agent/sessions/{sid}").status_code == 404
    assert client.delete(f"/api/v1/agent/sessions/{sid}").status_code == 404


def test_api_market_resources_and_missing_market_are_explicit(client):
    markets = client.get("/api/v1/markets").json()["markets"]
    assert {"in_en", "ph_tl", "id_id"} <= set(markets)
    assert client.get("/api/v1/markets/in_en").status_code == 200
    assert client.get("/api/v1/markets/in_en/system_prompt").json()["market"] == "in_en"
    assert client.get("/api/v1/markets/in_en/fallbacks").status_code == 200
    assert client.get("/api/v1/markets/in_en/localization").json()["count"] >= 0
    for suffix in ("", "/system_prompt", "/localization", "/fallbacks"):
        assert client.get(f"/api/v1/markets/no_such_market{suffix}").status_code == 404


def test_api_log_endpoints_enforce_limit_and_return_last_entries(client, monkeypatch, tmp_path):
    for attr in ("GATE_LOG_PATH", "CRM_LOG_PATH", "CALLBACK_LOG_PATH"):
        p = tmp_path / f"{attr}.jsonl"; p.write_text('{"n": 1}\n{"n": 2}\n')
        monkeypatch.setattr(main, attr, p)
    assert client.get("/api/v1/gate/log?limit=1").json() == [{"n": 2}]
    assert client.get("/api/v1/crm/leads?limit=501").status_code == 422
    assert client.get("/api/v1/crm/callbacks?limit=1").json() == [{"n": 2}]


def test_voice_api_handles_unknown_session_bad_provider_and_lifecycle(client):
    assert client.post("/api/v1/voice/calls/nope/turn", json={"call_session_id": "nope", "user_text": "hi"}).status_code == 404
    assert client.delete("/api/v1/voice/calls/nope").status_code == 404
    # The provider factory currently exposes invalid providers as a server error.
    assert client.post("/api/v1/voice/calls", json={"provider": "bogus"}).status_code == 500
    started = client.post("/api/v1/voice/calls", json={"session_id": "call-test", "market": "id_id"})
    assert started.status_code == 200 and started.json()["language"] == "id-ID"
    assert client.get("/api/v1/voice/calls").json()["active_calls"][0]["call_session_id"] == "call-test"
    turn = client.post("/api/v1/voice/calls/call-test/turn", json={"call_session_id": "call-test", "user_text": "bitcoin"})
    assert turn.json()["is_refusal"] is True and turn.json()["turn_number"] == 1
    assert client.delete("/api/v1/voice/calls/call-test").json()["total_turns"] == 1


def test_api_file_backed_endpoints_return_missing_and_found_contracts(client, monkeypatch, tmp_path):
    monkeypatch.setattr(main, "TRANSCRIPTS_DIR", tmp_path / "transcripts")
    monkeypatch.setattr(main, "CALLS_DIR", tmp_path / "calls")
    assert client.get("/api/v1/voice/transcripts").json() == []
    assert client.get("/api/v1/voice/transcripts/nope").status_code == 404
    assert "error" in client.get("/api/v1/voice/latency_report").json()
    (tmp_path / "transcripts").mkdir(); (tmp_path / "calls").mkdir()
    (tmp_path / "transcripts" / "x_transcript.json").write_text('{"call_id": "x"}')
    (tmp_path / "calls" / "latency_report.json").write_text('{"overall": {}}')
    (tmp_path / "calls" / "results.md").write_text("result")
    assert client.get("/api/v1/voice/transcripts").json() == ["x_transcript.json"]
    assert client.get("/api/v1/voice/transcripts/x").json()["call_id"] == "x"
    assert client.get("/api/v1/voice/results").json()["results_md"] == "result"


def test_kb_version_and_record_contracts_are_explicit(client):
    versions = client.get("/api/v1/kb/versions")
    assert versions.status_code == 200 and versions.json()["active_version"] == "v1.1"
    records = client.get("/api/v1/kb/records").json()
    assert records
    assert client.get(f"/api/v1/kb/records/{records[0]['record_id']}").status_code == 200
    assert client.get("/api/v1/kb/records/no-such-record").status_code == 404
    assert client.get("/api/v1/kb/versions/no-such-version/diff").status_code == 404


def test_voice_turn_executes_dialogue_gate_and_mock_tts(client):
    started = client.post("/api/v1/voice/calls", json={"session_id": "e2e-call", "market": "in_en"})
    assert started.status_code == 200
    turn = client.post("/api/v1/voice/calls/e2e-call/turn", json={"call_session_id": "e2e-call", "user_text": "hello"})
    body = turn.json()
    assert turn.status_code == 200
    assert body["dialogue"]["turn_count"] == 1 and body["detected_intent"] == "continue"
    assert body["agent_response"] and body["tts"]["provider"] == "mock"
    assert body["gate_outcomes"]


def test_live_nudge_rest_contract_persists_fired_and_suppressed_decisions(client):
    created = client.post("/api/v1/live/sessions", json={"session_id": "live-test", "market": "in_en"})
    assert created.status_code == 200 and created.json()["trace_id"].startswith("trace_")
    fired = client.post("/api/v1/live/sessions/live-test/turn", json={"speaker": "agent", "text": "I guarantee a return"})
    assert fired.status_code == 200 and fired.json()["decisions"][0]["decision"] == "fired"
    suppressed = client.post("/api/v1/live/sessions/live-test/turn", json={"speaker": "agent", "text": "100% safe"})
    assert suppressed.json()["decisions"][0]["decision"] == "suppressed"
    polled = client.get("/api/v1/live/live-test/nudges")
    assert len(polled.json()["nudges"]) == 2 and polled.json()["trace_id"].startswith("trace_")
    assert client.get("/api/v1/live/no-such/nudges").status_code == 404


def test_retrieval_evidence_contracts(client):
    resp = client.get("/api/v1/retrieval/evidence")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_queries"] == 19
    assert data["accuracy"] == 1.0
    assert "markdown" in data and data["trace_id"].startswith("trace_")

    update_resp = client.put("/api/v1/retrieval/evidence", json={"notes": "reviewed and verified"})
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "updated"


def test_calls_token_and_listing_contracts(client):
    tok = client.post("/api/v1/calls/token", json={"market": "in_en"})
    assert tok.status_code == 200
    tok_data = tok.json()
    assert tok_data["token"].startswith("parley_tok_")
    assert tok_data["expires_in_seconds"] == 3600
    assert tok_data["trace_id"].startswith("trace_")

    calls = client.get("/api/v1/calls")
    assert calls.status_code == 200
    calls_data = calls.json()
    assert "calls" in calls_data and calls_data["count"] >= 1

    detail = client.get("/api/v1/calls/call_001")
    assert detail.status_code == 200
    assert detail.json()["call_id"] == "call_001"

    missing = client.get("/api/v1/calls/no-such-call-12345")
    assert missing.status_code == 404


def test_trace_and_replay_contracts(client):
    trace_resp = client.get("/api/v1/trace/trace_test_1234")
    assert trace_resp.status_code == 200
    trace_data = trace_resp.json()
    assert trace_data["trace_id"] == "trace_test_1234"
    assert "spans" in trace_data

    replay_resp = client.post("/api/v1/replay", json={
        "call_id": "call_001",
        "turn_number": 2,
        "user_text": "What is the grace period for annual renewals?",
        "market": "in_en",
        "kb_version": "v1.1"
    })
    assert replay_resp.status_code == 200
    rep_data = replay_resp.json()
    assert rep_data["kb_version"] == "v1.1"
    assert rep_data["response"]
    assert "citations" in rep_data
    assert rep_data["trace_id"].startswith("trace_")


def test_websocket_live_stream_contract(client):
    """Verify the full ARCHITECTURE s12 WebSocket event contract."""
    with client.websocket_connect("/ws/live/test-stream-sess") as ws:
        # Initial call.state = connected
        init = ws.receive_json()
        assert init["event"] == "call.state" and init["state"] == "connected"

        # Send a turn that triggers a compliance signal
        ws.send_json({"speaker": "agent", "text": "I guarantee 100% return on this policy", "asr_confidence": 0.95})

        # 1. transcript.partial (streaming ASR partial arrives first)
        ev_partial = ws.receive_json()
        assert ev_partial["event"] == "transcript.partial", ev_partial.get("event")
        assert ev_partial["speaker"] == "agent"

        # 2. transcript.final
        ev_final = ws.receive_json()
        assert ev_final["event"] == "transcript.final", ev_final.get("event")
        assert ev_final["speaker"] == "agent"

        # 3. signal (compliance)
        ev_signal = ws.receive_json()
        assert ev_signal["event"] == "signal" and ev_signal["kind"] == "compliance"

        # 4. nudge.fired (P1 compliance)
        ev_nudge = ws.receive_json()
        assert ev_nudge["event"] == "nudge.fired"
        assert ev_nudge["priority"] == "P1"
        assert "expires_at" in ev_nudge

        # 5. gate.event for agent turn (ARCHITECTURE s12)
        ev_gate = ws.receive_json()
        assert ev_gate["event"] == "gate.event"
        assert "status" in ev_gate and "turn_id" in ev_gate and "citations" in ev_gate

        # 6. latency.sample
        ev_latency = ws.receive_json()
        assert ev_latency["event"] == "latency.sample" and "ms" in ev_latency

        # 7. register.update with market-specific lang_mix
        ev_register = ws.receive_json()
        assert ev_register["event"] == "register.update"
        assert "lang_mix" in ev_register and "formality" in ev_register

