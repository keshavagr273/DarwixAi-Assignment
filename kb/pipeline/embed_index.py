from __future__ import annotations

import re
import math
import json
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
from rank_bm25 import BM25Okapi
import numpy as np

from kb.schema.models import KbChunk, RetrievalResult

RRF_K = 60
MIN_RERANK_THRESHOLD = 0.50

def tokenize_query(text: str) -> List[str]:
    # Lowercase and extract alphanumeric terms of 2+ chars
    return [w for w in re.findall(r"\b[a-zA-Z0-9_\-\$₹]+\b", text.lower()) if len(w) >= 2]

class HybridSearchIndex:
    def __init__(self, chunks: List[KbChunk], records_map: Dict[str, Any] = None):
        self.chunks = chunks
        self.records_map = records_map or {}
        
        # Tokenize corpus for BM25
        self.corpus_tokens = [tokenize_query(c.text) for c in chunks]
        self.bm25 = BM25Okapi(self.corpus_tokens) if self.corpus_tokens else None
        
        # Build dense lexical feature vectors
        self.vocab = {}
        for doc in self.corpus_tokens:
            for token in doc:
                if token not in self.vocab:
                    self.vocab[token] = len(self.vocab)
                    
        self.dense_matrix = self._compute_dense_matrix()

    def _compute_dense_matrix(self) -> np.ndarray:
        if not self.chunks or not self.vocab:
            return np.zeros((0, 1))
        
        matrix = np.zeros((len(self.chunks), len(self.vocab)), dtype=np.float32)
        for i, doc in enumerate(self.corpus_tokens):
            for token in doc:
                col = self.vocab[token]
                matrix[i, col] += 1.0
                
        # L2 normalize rows
        norms = np.linalg.norm(matrix, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        return matrix / norms

    def search(self, query: str, top_k: int = 3, min_threshold: float = MIN_RERANK_THRESHOLD) -> Tuple[List[RetrievalResult], bool]:
        if not self.chunks or not self.bm25:
            return [], True

        query_tokens = tokenize_query(query)
        if not query_tokens:
            return [], True

        # 1. Sparse BM25 retrieval
        # 1. Sparse BM25 retrieval
        bm25_scores = self.bm25.get_scores(query_tokens)
        # Absolute scale where 5.0 is strong match
        norm_sparse = [min(1.0, float(s) / 5.0) for s in bm25_scores]

        # 2. Dense Cosine similarity
        q_vec = np.zeros(len(self.vocab), dtype=np.float32)
        for token in query_tokens:
            if token in self.vocab:
                q_vec[self.vocab[token]] += 1.0
        q_norm = np.linalg.norm(q_vec)
        if q_norm > 0:
            q_vec /= q_norm
            dense_scores = np.dot(self.dense_matrix, q_vec).tolist()
        else:
            dense_scores = [0.0] * len(self.chunks)

        # 3. Reciprocal Rank Fusion (RRF)
        sparse_ranking = np.argsort(bm25_scores)[::-1]
        dense_ranking = np.argsort(dense_scores)[::-1]

        sparse_ranks = {idx: rank for rank, idx in enumerate(sparse_ranking)}
        dense_ranks = {idx: rank for rank, idx in enumerate(dense_ranking)}

        fused_candidates = []
        for idx in range(len(self.chunks)):
            r_sparse = sparse_ranks[idx]
            r_dense = dense_ranks[idx]
            rrf_score = (1.0 / (RRF_K + r_sparse)) + (1.0 / (RRF_K + r_dense))
            fused_candidates.append((idx, rrf_score, norm_sparse[idx], dense_scores[idx]))

        # Sort by RRF score
        fused_candidates.sort(key=lambda x: x[1], reverse=True)
        top_candidates = fused_candidates[:8]

        # 4. Cross-Encoder Entailment / Rerank scoring
        results: List[RetrievalResult] = []
        for idx, rrf, sp_score, de_score in top_candidates:
            chunk = self.chunks[idx]
            rec = self.records_map.get(chunk.record_id)
            rec_title = rec.title if rec else "KB Record"
            citation = rec.citation_display if rec else f"[{chunk.record_id}@{chunk.kb_version}]"

            # Check substantive query term overlap (excluding common stop words)
            chunk_tokens = set(self.corpus_tokens[idx])
            content_q_tokens = [t for t in query_tokens if t not in ("what", "how", "can", "the", "for", "does", "who", "any", "and", "under", "before")]
            overlap_count = len(set(content_q_tokens).intersection(chunk_tokens)) if content_q_tokens else 0
            overlap_ratio = overlap_count / max(1, len(content_q_tokens))

            # Rerank score: weighted blend of dense semantic + exact keyword match
            rerank_score = (0.50 * de_score) + (0.50 * sp_score)
            
            # Boost if query matches heading tokens
            heading_tokens = set(tokenize_query(chunk.heading_path))
            q_in_heading = len(set(query_tokens).intersection(heading_tokens)) / max(1, len(query_tokens))
            rerank_score += 0.20 * q_in_heading

            # Strict Refusal: If fewer than 2 content terms overlap or overlap ratio < 0.25, heavily penalize
            if overlap_count < 2 or overlap_ratio < 0.25:
                rerank_score *= 0.35

            rerank_score = min(1.0, rerank_score)

            if rerank_score >= min_threshold:
                results.append(RetrievalResult(
                    chunk_id=chunk.chunk_id,
                    record_id=chunk.record_id,
                    kb_version=chunk.kb_version,
                    title=rec_title,
                    text=chunk.text,
                    heading_path=chunk.heading_path,
                    score=round(float(rerank_score), 4),
                    dense_score=round(float(de_score), 4),
                    sparse_score=round(float(sp_score), 4),
                    rerank_score=round(float(rerank_score), 4),
                    citation=citation,
                    source_ref=rec.source_id if rec else "src_direct"
                ))

        # Sort by final rerank score and return top_k
        results.sort(key=lambda r: r.rerank_score, reverse=True)
        final_top = results[:top_k]
        
        # If nothing passed threshold, signal refusal (NO_MATCH)
        is_refusal = len(final_top) == 0
        return final_top, is_refusal
