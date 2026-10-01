from __future__ import annotations

import re
from typing import Dict, Any
from pathlib import Path
import yaml

def load_glossary(glossary_path: Path) -> Dict[str, Any]:
    if glossary_path.exists():
        return yaml.safe_load(glossary_path.read_text(encoding="utf-8")) or {}
    return {}

DATE_PATTERNS = [
    # DD/MM/YYYY
    (re.compile(r"\b(\d{1,2})/(\d{1,2})/(\d{4})\b"), lambda m: f"{m.group(3)}-{int(m.group(2)):02d}-{int(m.group(1)):02d}"),
    # MM-DD-YYYY
    (re.compile(r"\b(\d{1,2})-(\d{1,2})-(\d{4})\b"), lambda m: f"{m.group(3)}-{int(m.group(1)):02d}-{int(m.group(2)):02d}"),
    # YYYY.MM.DD
    (re.compile(r"\b(\d{4})\.(\d{1,2})\.(\d{1,2})\b"), lambda m: f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"),
]

def normalize_dates_in_text(text: str) -> str:
    normalized = text
    for pattern, repl in DATE_PATTERNS:
        normalized = pattern.sub(repl, normalized)
    return normalized

def normalize_field_name(name: str) -> str:
    cleaned = re.sub(r"[^\w\s-]", "", name).strip().lower()
    return re.sub(r"[-\s]+", "_", cleaned)

def normalize_terminology(text: str, market: str, glossary: Dict[str, Any]) -> str:
    market_terms = glossary.get("markets", {}).get(market, {}).get("terms", {})
    normalized = text
    for term_key, term_info in market_terms.items():
        canonical = term_info.get("canonical", term_key)
        for synonym in term_info.get("synonyms", []):
            if synonym.lower() != canonical.lower():
                pattern = re.compile(rf"\b{re.escape(synonym)}\b", re.IGNORECASE)
                normalized = pattern.sub(canonical, normalized)
    return normalized

def normalize_content(text: str, market: str = "in_en", glossary: Dict[str, Any] = None) -> str:
    if glossary is None:
        glossary_path = Path(__file__).resolve().parent.parent / "schema" / "glossary.yaml"
        glossary = load_glossary(glossary_path)
        
    date_normalized = normalize_dates_in_text(text)
    term_normalized = normalize_terminology(date_normalized, market, glossary)
    return term_normalized
