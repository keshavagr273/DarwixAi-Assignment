from __future__ import annotations

import re
import hashlib
import shutil
from pathlib import Path
from typing import List, Dict, Any, Tuple
from bs4 import BeautifulSoup

from kb.schema.models import KbSource, SourceType, SourceStatus

HEALTH_THRESHOLD = 0.60

def compute_extraction_health(text: str) -> float:
    if not text.strip():
        return 0.0
    total_chars = len(text)
    alpha_chars = sum(1 for c in text if c.isalnum() or c.isspace())
    garble_chars = len(re.findall(r"[%^&*@!~?\/\\#$\[\]{}]{2,}", text))
    
    alpha_ratio = alpha_chars / total_chars
    penalty = min(0.5, (garble_chars * 4) / max(1, total_chars))
    health = max(0.0, min(1.0, alpha_ratio - penalty))
    return round(health, 2)

def detect_source_type(file_path: Path) -> SourceType:
    suffix = file_path.suffix.lower()
    name = file_path.stem.lower()
    if suffix in (".html", ".htm"):
        return "website"
    elif suffix in (".csv", ".tsv"):
        return "table"
    elif "brochure" in name:
        return "brochure"
    elif "policy" in name or "wording" in name:
        return "policy_wording"
    elif "playbook" in name:
        return "playbook"
    elif suffix in (".md", ".txt"):
        return "docx"
    return "website"

class RawParsedDocument:
    def __init__(self, source: KbSource, title: str, raw_content: str, sections: List[Dict[str, str]], file_path: Path):
        self.source = source
        self.title = title
        self.raw_content = raw_content
        self.sections = sections
        self.file_path = file_path

def parse_html_document(file_path: Path, raw_text: str) -> Tuple[str, List[Dict[str, str]]]:
    soup = BeautifulSoup(raw_text, "html.parser")
    title = soup.title.string.strip() if soup.title and soup.title.string else file_path.stem.replace("_", " ").title()
    
    # Extract article or main if present, else body
    main_el = soup.find("article") or soup.find("main") or soup.find("body") or soup
    sections = []
    
    # Try finding sections with headings
    headings = main_el.find_all(["h1", "h2", "h3"])
    if headings:
        for h in headings:
            heading_text = h.get_text(strip=True)
            # Find next siblings until next heading
            content_parts = []
            for sibling in h.find_next_siblings():
                if sibling.name in ["h1", "h2", "h3"]:
                    break
                content_parts.append(sibling.get_text(separator=" ", strip=True))
            sec_text = " ".join(content_parts)
            if sec_text:
                sections.append({"heading": heading_text, "text": sec_text})
    
    if not sections:
        clean_text = main_el.get_text(separator="\n", strip=True)
        sections.append({"heading": title, "text": clean_text})
        
    return title, sections

def parse_markdown_document(file_path: Path, raw_text: str) -> Tuple[str, List[Dict[str, str]]]:
    lines = raw_text.splitlines()
    title = file_path.stem.replace("_", " ").title()
    for line in lines:
        if line.startswith("# "):
            title = line.replace("# ", "").strip()
            break
            
    sections = []
    current_heading = title
    current_lines = []
    
    for line in lines:
        if line.startswith("#"):
            if current_lines:
                sec_text = "\n".join(current_lines).strip()
                if sec_text:
                    sections.append({"heading": current_heading, "text": sec_text})
                current_lines = []
            current_heading = line.lstrip("#").strip()
        else:
            current_lines.append(line)
            
    if current_lines:
        sec_text = "\n".join(current_lines).strip()
        if sec_text:
            sections.append({"heading": current_heading, "text": sec_text})
            
    return title, sections

def parse_csv_document(file_path: Path, raw_text: str) -> Tuple[str, List[Dict[str, str]]]:
    title = file_path.stem.replace("_", " ").title()
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    if not lines:
        return title, []
    
    header = lines[0]
    sections = []
    for idx, row in enumerate(lines[1:], start=1):
        sections.append({
            "heading": f"{title} Row {idx}",
            "text": f"Columns: {header} | Data: {row}"
        })
    return title, sections

def fetch_and_parse_all(raw_dir: Path, quarantine_dir: Path) -> List[RawParsedDocument]:
    raw_dir.mkdir(parents=True, exist_ok=True)
    quarantine_dir.mkdir(parents=True, exist_ok=True)
    
    parsed_docs: List[RawParsedDocument] = []
    
    for file_path in raw_dir.glob("*.*"):
        if file_path.suffix.lower() == ".md" and file_path.name == "PLANTED_DEFECTS.md":
            continue
            
        raw_text = file_path.read_text(encoding="utf-8", errors="ignore")
        content_hash = hashlib.sha256(raw_text.encode("utf-8")).hexdigest()
        health = compute_extraction_health(raw_text)
        src_type = detect_source_type(file_path)
        source_id = f"src_{file_path.stem}"
        
        if health < HEALTH_THRESHOLD:
            # Quarantine low health source
            status: SourceStatus = "quarantined"
            reason = "LOW_HEALTH_OCR_GARBLE"
            quarantine_target = quarantine_dir / file_path.name
            shutil.copy2(file_path, quarantine_target)
            
            source = KbSource(
                source_id=source_id,
                type=src_type,
                uri=f"file://{file_path.name}",
                content_hash=content_hash,
                extraction_health=health,
                status=status,
                reason_code=reason
            )
            # Quarantined documents are not forwarded to standard ingestion
            print(f"Quarantined low-health source: {file_path.name} (health: {health} < {HEALTH_THRESHOLD}) -> {reason}")
            continue
            
        source = KbSource(
            source_id=source_id,
            type=src_type,
            uri=f"file://{file_path.name}",
            content_hash=content_hash,
            extraction_health=health,
            status="ok"
        )
        
        if file_path.suffix.lower() in (".html", ".htm"):
            title, sections = parse_html_document(file_path, raw_text)
        elif file_path.suffix.lower() in (".csv", ".tsv"):
            title, sections = parse_csv_document(file_path, raw_text)
        else:
            title, sections = parse_markdown_document(file_path, raw_text)
            
        parsed_docs.append(RawParsedDocument(
            source=source,
            title=title,
            raw_content=raw_text,
            sections=sections,
            file_path=file_path
        ))
        
    return parsed_docs
