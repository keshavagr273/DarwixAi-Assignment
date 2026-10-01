"""
Knowledge Time Machine - Call Replay Utility
Replays turns from recorded calls against versioned KB snapshots (v1.0 vs v1.1).
Validates that answers and citations update when the knowledge base evolves.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from services.retrieval.retriever import HybridRetriever
from services.agent.sentence_gate import get_gate
import yaml


def replay_call(call_id: str, kb_version: str = "v1.1"):
    transcript_file = ROOT_DIR / "data" / "transcripts" / f"{call_id}_transcript.json"
    if not transcript_file.exists():
        transcript_file = ROOT_DIR / "data" / "transcripts" / f"{call_id}.json"
    if not transcript_file.exists():
        print(f"Error: Transcript for {call_id} not found in data/transcripts/")
        return None

    call_data = json.loads(transcript_file.read_text(encoding="utf-8"))
    snapshot_dir = ROOT_DIR / "kb" / "snapshots" / kb_version
    if not snapshot_dir.exists():
        print(f"Error: Snapshot {kb_version} not found in kb/snapshots/")
        return None

    market = call_data.get("market", "in_en")
    fallbacks_path = ROOT_DIR / "services" / "agent" / "fallbacks.yaml"
    fallbacks = yaml.safe_load(fallbacks_path.read_text(encoding="utf-8"))[market]

    retriever = HybridRetriever(snapshot_dir)
    gate = get_gate()

    print(f"\n=======================================================")
    print(f"REPLAYING CALL: {call_id} against KB {kb_version} ({market})")
    print(f"=======================================================\n")

    replayed_turns = []
    turns = call_data.get("turns", call_data.get("transcript", []))
    for idx, turn in enumerate(turns):
        speaker = turn.get("speaker")
        text = turn.get("text", "")
        if speaker != "customer":
            continue

        results, is_refusal = retriever.search(text, market=market, top_k=3)
        if is_refusal:
            draft = fallbacks["unavailable_info_fallback"][0]
        else:
            draft = results[0].text if results else fallbacks["unavailable_info_fallback"][0]

        chunks = [r.to_dict() if hasattr(r, "to_dict") else r.__dict__ for r in results]
        final_resp, outcomes = gate.evaluate_response(draft, chunks)
        if not final_resp:
            final_resp = fallbacks["gate_blocked_fallback"][0]

        citations = [r.citation for r in results]
        replayed_turns.append({
            "turn_index": idx + 1,
            "user_text": text,
            "is_refusal": is_refusal,
            "citations": citations,
            "response": final_resp,
            "gate_status": outcomes[0].verdict if outcomes else "NO_CHUNKS",
        })

        print(f"Turn {idx + 1} (Customer): {text}")
        print(f"   -> Replayed Bot [{kb_version}]: {final_resp}")
        print(f"   -> Citations: {citations if citations else 'None (Refusal/Fallback)'}")
        print()

    return replayed_turns


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Replay call against KB snapshot")
    parser.add_argument("--call-id", default="call_001", help="Call ID to replay (e.g. call_001, call_006)")
    parser.add_argument("--kb-version", default="v1.1", help="KB snapshot version (v1.0, v1.1)")
    args = parser.parse_args()

    replay_call(args.call_id, args.kb_version)
