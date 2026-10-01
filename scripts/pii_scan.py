#!/usr/bin/env python3
"""
PARLEY PII Leak Scanner
Scans all indexed chunks in the active KB snapshot (v1.1) to guarantee zero raw PII leaks.
"""

import sys
import json
from pathlib import Path

# Add project root to sys.path
root = Path(__file__).resolve().parent.parent
if str(root) not in sys.path:
    sys.path.insert(0, str(root))

from kb.pipeline.pii_shield import scan_text_for_raw_pii

def scan_indexed_chunks(chunks_file: Path) -> int:
    if not chunks_file.exists():
        print(f"[ERROR] Chunks file not found at {chunks_file}. Run pipeline first.")
        return 1

    chunks = json.loads(chunks_file.read_text(encoding="utf-8"))
    total_leaks = 0
    
    print(f"Scanning {len(chunks)} indexed chunks in {chunks_file.parent.name} for raw PII...")
    for chunk in chunks:
        chunk_id = chunk.get("chunk_id")
        text = chunk.get("text", "")
        leaks = scan_text_for_raw_pii(text)
        if leaks:
            print(f"  [LEAK] Chunk {chunk_id} contains {len(leaks)} raw PII leak(s):")
            for pii_type, snippet in leaks:
                print(f"    - Type: {pii_type} | Value: {snippet}")
            total_leaks += len(leaks)

    if total_leaks > 0:
        print(f"\n[FAIL] PII leak scan failed! Detected {total_leaks} raw PII instances in indexed chunks.")
        return 1
    else:
        print(f"\n[OK] PII scan passed: 0 raw PII leaks detected across all {len(chunks)} indexed chunks.")
        return 0

def main():
    root = Path(__file__).resolve().parent.parent
    snapshot_chunks = root / "kb" / "snapshots" / "v1.1" / "chunks.json"
    exit_code = scan_indexed_chunks(snapshot_chunks)
    sys.exit(exit_code)

if __name__ == "__main__":
    main()
