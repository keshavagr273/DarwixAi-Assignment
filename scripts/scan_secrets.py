#!/usr/bin/env python3
"""
Secret scanning utility for PARLEY.
Scans files or git staged diffs for accidental secrets, API keys, and sensitive tokens.
"""

import re
import sys
from pathlib import Path

SECRET_PATTERNS = [
    (r"sk-[a-zA-Z0-9]{32,}", "OpenAI API Key"),
    (r"sk-ant-[a-zA-Z0-9_-]{32,}", "Anthropic API Key"),
    (r"gsk_[a-zA-Z0-9]{32,}", "Groq API Key"),
    (r"dg-[a-zA-Z0-9]{32,}", "Deepgram API Key"),
    (r"(?:LIVEKIT_API_SECRET|LIVEKIT_SECRET)\s*=\s*['\"][a-zA-Z0-9]{20,}['\"]", "LiveKit Secret"),
    (r"-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----", "Private Key"),
    (r"(?:api_key|apikey|secret_key|private_key)\s*[:=]\s*['\"][A-Za-z0-9+/=_-]{24,}['\"]", "Generic High-Entropy Secret"),
]

IGNORED_PATHS = [
    Path(".git"),
    Path(".env.example"),
    Path("tests/test_secret_scan.py"),
    Path("node_modules"),
    Path("frontend/node_modules"),
    Path("frontend/dist"),
    Path(".venv"),
    Path("__pycache__"),
]

def should_skip(path: Path) -> bool:
    path_str = str(path).replace("\\", "/")
    if "test_secret_scan.py" in path_str:
        return True
    for part in path.parts:
        if part in ("node_modules", ".git", ".venv", "dist", "__pycache__", ".testdeps", ".agents"):
            return True
    return False

def scan_file(file_path: Path):
    findings = []
    try:
        content = file_path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return findings

    for line_no, line in enumerate(content.splitlines(), start=1):
        for pattern, label in SECRET_PATTERNS:
            if re.search(pattern, line):
                # Don't trigger on commented example placeholder lines containing "your_" or "placeholder"
                if "your_" in line.lower() or "placeholder" in line.lower() or "example" in line.lower():
                    continue
                findings.append((file_path, line_no, label, line.strip()[:60]))
    return findings

def main():
    root = Path(__file__).resolve().parent.parent
    all_findings = []
    for file_path in root.rglob("*"):
        if file_path.is_file() and not should_skip(file_path):
            findings = scan_file(file_path)
            all_findings.extend(findings)

    if all_findings:
        print(f"[FAIL] Secret scan failed! Found {len(all_findings)} potential secret(s):")
        for path, line, label, snippet in all_findings:
            print(f"  - {path}:{line} [{label}]: {snippet}...")
        sys.exit(1)
    else:
        print("[OK] Secret scan passed: 0 secrets detected.")
        sys.exit(0)

if __name__ == "__main__":
    main()
