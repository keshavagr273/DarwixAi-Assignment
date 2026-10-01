from __future__ import annotations

import re
from typing import Dict, List, Tuple

PII_PATTERNS = [
    # Indian, Philippine, Indonesian Phone Numbers
    ("PHONE", re.compile(r"(?:\+91[\s-]?|\+63[\s-]?|\+62[\s-]?)?[6-9]\d{3}[\s-]?\d{3}[\s-]?\d{3,4}")),
    # Email addresses
    ("EMAIL", re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b")),
    # Policy numbers (e.g. POL-982144, POL-PH-44019)
    ("POLICY_NUM", re.compile(r"\bPOL(?:-[A-Z]{2})?-\d{5,6}\b")),
    # Indian PAN card (5 letters, 4 digits, 1 letter)
    ("NATIONAL_ID_PAN", re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b")),
    # Indonesian NIK (16 digits)
    ("NATIONAL_ID_NIK", re.compile(r"\b\d{16}\b")),
    # Philippine TIN (e.g. 123-456-789-000)
    ("NATIONAL_ID_TIN", re.compile(r"\b\d{3}-\d{3}-\d{3}-\d{3}\b")),
]

class PiiVault:
    """Isolated PII storage vault separated from retrieval DB role."""
    def __init__(self):
        self._vault: Dict[str, Dict[str, str]] = {}
        self._counter: Dict[str, int] = {"PHONE": 0, "EMAIL": 0, "POLICY_NUM": 0, "ID": 0}

    def store(self, entity_type: str, raw_val: str) -> str:
        # Check if already mapped
        for token, data in self._vault.items():
            if data["raw"] == raw_val and data["type"] == entity_type:
                return token
                
        category = "ID" if "NATIONAL_ID" in entity_type else entity_type
        self._counter[category] = self._counter.get(category, 0) + 1
        token = f"[{category}_{self._counter[category]}]"
        
        self._vault[token] = {
            "token": token,
            "type": entity_type,
            "raw": raw_val
        }
        return token

    def lookup(self, token: str) -> str:
        return self._vault.get(token, {}).get("raw", token)

    @property
    def total_tokens(self) -> int:
        return len(self._vault)

# Global vault instance for pipeline execution
GLOBAL_VAULT = PiiVault()

def sanitize_pii(text: str, vault: PiiVault = None) -> Tuple[str, List[str], int]:
    if vault is None:
        vault = GLOBAL_VAULT
        
    sanitized = text
    detected_types = []
    replacement_count = 0
    
    for entity_type, pattern in PII_PATTERNS:
        matches = list(pattern.finditer(sanitized))
        if matches:
            if entity_type not in detected_types:
                detected_types.append(entity_type)
            # Replace backwards to preserve character indices
            for match in reversed(matches):
                raw_val = match.group(0)
                # Skip if already a token like [PHONE_1]
                if raw_val.startswith("[") and raw_val.endswith("]"):
                    continue
                token = vault.store(entity_type, raw_val)
                start, end = match.span()
                sanitized = sanitized[:start] + token + sanitized[end:]
                replacement_count += 1
                
    return sanitized, detected_types, replacement_count

def scan_text_for_raw_pii(text: str) -> List[Tuple[str, str]]:
    leaks = []
    for entity_type, pattern in PII_PATTERNS:
        for match in pattern.finditer(text):
            val = match.group(0)
            if not (val.startswith("[") and val.endswith("]")):
                leaks.append((entity_type, val))
    return leaks
