from __future__ import annotations

import re
from typing import List, Dict, Set

BOILERPLATE_PATTERNS = [
    r"We use cookies to improve your browsing experience.*?(?:Accept All|Dismiss)",
    r"Cookie consent notice:.*?(?:Accept All|Dismiss)",
    r"<div class=\"cookie-banner\".*?<\/div>",
    r"<nav class=\"nav-bar\".*?<\/nav>",
    r"<header class=\"site-header\".*?<\/header>",
    r"Home\s*\|\s*Products(?:\s*\|\s*Partners)?\s*\|\s*Contact",
    r"Home\s*\|\s*FAQs",
    r"Home\s*\|\s*Renewal Desk",
    r"Copyright © \d{4} Meridian Assure Corp\. All rights reserved\.",
    r"Copyright © \d{4} Meridian Assure Corp\.",
    r"Twitter\s*LinkedIn",
]

REPEATED_DISCLAIMER_REGEX = re.compile(
    r"Statutory Notice IRDAI:\s*Insurance is the subject matter of solicitation\.\s*Policy terms and conditions apply\.\s*IRDAI Reg No\.\s*994\.",
    re.IGNORECASE
)

def clean_text_boilerplate(text: str, seen_disclaimers: Set[str] = None) -> str:
    cleaned = text
    for pattern in BOILERPLATE_PATTERNS:
        cleaned = re.sub(pattern, " ", cleaned, flags=re.IGNORECASE | re.DOTALL)
        
    # Handle repeated disclaimers: keep only the first time encountered
    if seen_disclaimers is not None:
        def replace_disclaimer(match):
            key = match.group(0).strip().lower()
            if key in seen_disclaimers:
                return "" # Strip duplicate
            seen_disclaimers.add(key)
            return match.group(0) # Keep first occurrence
            
        cleaned = REPEATED_DISCLAIMER_REGEX.sub(replace_disclaimer, cleaned)
        
    # Collapse multiple blank lines
    cleaned = re.sub(r"\n\s*\n+", "\n\n", cleaned)
    cleaned = re.sub(r"[ \t]+", " ", cleaned)
    return cleaned.strip()

def clean_document_sections(sections: List[Dict[str, str]]) -> List[Dict[str, str]]:
    seen_disclaimers: Set[str] = set()
    cleaned_sections = []
    
    for sec in sections:
        cleaned_text = clean_text_boilerplate(sec["text"], seen_disclaimers)
        # Skip section if it became empty after stripping boilerplate
        if len(cleaned_text.strip()) > 15:
            cleaned_sections.append({
                "heading": sec["heading"].strip(),
                "text": cleaned_text
            })
    return cleaned_sections
