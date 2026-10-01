from __future__ import annotations

import re
from typing import List, Dict, Any
from kb.schema.models import KbRecord, KbChunk

def estimate_tokens(text: str) -> int:
    return max(1, len(text.split()))

def split_prose_into_chunks(text: str, target_tokens: int = 200, overlap_tokens: int = 30) -> List[str]:
    words = text.split()
    if len(words) <= target_tokens:
        return [text]
        
    chunks = []
    start = 0
    while start < len(words):
        end = min(len(words), start + target_tokens)
        chunk_str = " ".join(words[start:end])
        chunks.append(chunk_str)
        if end >= len(words):
            break
        start += target_tokens - overlap_tokens
    return chunks

def chunk_record(record: KbRecord, kb_version: str) -> List[KbChunk]:
    chunks: List[KbChunk] = []
    
    # 1. FAQ records: 1 chunk per FAQ Q&A pair
    if record.category == "faq" or "FAQ" in record.title:
        # Check if multiple Q&As inside content
        qa_pairs = re.findall(r"(?:###|Q:|\d+\.)\s*(.*?)\n(?:A:|\n)(.*?)(?=(?:###|Q:|\d+\.|$))", record.content, re.DOTALL)
        if qa_pairs:
            for idx, (q, a) in enumerate(qa_pairs, start=1):
                clean_q = q.strip()
                clean_a = a.strip()
                heading_path = f"{record.title} > {clean_q}"
                chunk_text = f"Question: {clean_q}\nAnswer: {clean_a}"
                chunks.append(KbChunk(
                    chunk_id=f"{record.record_id}_c{idx:02d}",
                    record_id=record.record_id,
                    kb_version=kb_version,
                    chunk_index=idx,
                    heading_path=heading_path,
                    text=f"[{heading_path}]\n{chunk_text}",
                    token_count=estimate_tokens(chunk_text)
                ))
            return chunks

    # 2. Objection records: 1 chunk per objection-response
    if record.category == "objection_handling":
        objections = re.split(r"###\s*Objection\s*\d+:\s*", record.content)
        idx = 1
        for obj_block in objections:
            if not obj_block.strip():
                continue
            lines = obj_block.strip().splitlines()
            obj_title = lines[0].strip().replace('"', '')
            obj_text = "\n".join(lines[1:]).strip()
            heading_path = f"{record.title} > Objection: {obj_title}"
            chunk_text = f"Customer Objection: \"{obj_title}\"\nResponse Strategy:\n{obj_text}"
            chunks.append(KbChunk(
                chunk_id=f"{record.record_id}_c{idx:02d}",
                record_id=record.record_id,
                kb_version=kb_version,
                chunk_index=idx,
                heading_path=heading_path,
                text=f"[{heading_path}]\n{chunk_text}",
                token_count=estimate_tokens(chunk_text)
            ))
            idx += 1
        if chunks:
            return chunks

    # 3. Standard Prose or Policy Section Chunking
    heading_path = f"{record.category_path} > {record.title}"
    prose_splits = split_prose_into_chunks(record.content, target_tokens=220, overlap_tokens=30)
    for idx, split_text in enumerate(prose_splits, start=1):
        contextualized_text = f"[{heading_path} (Part {idx})]\n{split_text}"
        chunks.append(KbChunk(
            chunk_id=f"{record.record_id}_c{idx:02d}",
            record_id=record.record_id,
            kb_version=kb_version,
            chunk_index=idx,
            heading_path=heading_path,
            text=contextualized_text,
            token_count=estimate_tokens(contextualized_text)
        ))
        
    return chunks
