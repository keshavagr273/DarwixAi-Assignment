from __future__ import annotations

import re
import hashlib
from typing import List, Dict, Set, Tuple
from collections import defaultdict

def tokenize_for_similarity(text: str) -> Set[str]:
    words = re.findall(r"\b[a-zA-Z0-9]{3,}\b", text.lower())
    return set(words)

def jaccard_similarity(set_a: Set[str], set_b: Set[str]) -> float:
    if not set_a or not set_b:
        return 0.0
    intersection = len(set_a.intersection(set_b))
    union = len(set_a.union(set_b))
    return round(intersection / union, 4) if union > 0 else 0.0

class DedupeCluster:
    def __init__(self, canonical_id: str):
        self.canonical_id = canonical_id
        self.duplicates: List[Tuple[str, float]] = []

def cluster_and_deduplicate(records: List[Any], similarity_threshold: float = 0.55) -> Tuple[List[Any], List[DedupeCluster]]:
    # Step 1: Exact Hash Deduplication
    hash_map: Dict[str, Any] = {}
    unique_records = []
    
    for rec in records:
        h = rec.content_hash
        if h in hash_map:
            rec.duplicate_of = hash_map[h].record_id
        else:
            hash_map[h] = rec
            unique_records.append(rec)
            
    # Step 2: Near-duplicate clustering on unique records
    clusters: List[DedupeCluster] = []
    assigned_duplicates: Set[str] = set()
    
    for i in range(len(unique_records)):
        rec_a = unique_records[i]
        if rec_a.record_id in assigned_duplicates:
            continue
            
        tokens_a = tokenize_for_similarity(rec_a.content)
        cluster = DedupeCluster(canonical_id=rec_a.record_id)
        
        for j in range(i + 1, len(unique_records)):
            rec_b = unique_records[j]
            if rec_b.record_id in assigned_duplicates:
                continue
                
            # Same category comparison
            if rec_a.category == rec_b.category:
                tokens_b = tokenize_for_similarity(rec_b.content)
                sim = jaccard_similarity(tokens_a, tokens_b)
                if sim >= similarity_threshold:
                    rec_b.duplicate_of = rec_a.record_id
                    assigned_duplicates.add(rec_b.record_id)
                    cluster.duplicates.append((rec_b.record_id, sim))
                    
        if cluster.duplicates:
            clusters.append(cluster)
            
    return unique_records, clusters
