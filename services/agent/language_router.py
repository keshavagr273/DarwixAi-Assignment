"""
Language Router and Drift Detector for PARLEY Native-Language Bots.
Phase 4 Q3 requirements.

Provides:
- LanguageRouter: Detects language mix and formality per turn.
- DriftDetector: Analyzes transcripts for unexpected language shifts.
"""
from __future__ import annotations

import re
from typing import Dict, Any, List


class LanguageRouter:
    """Analyzes text to determine language mix and formality level."""
    
    def __init__(self, market: str):
        self.market = market
        
        # Simple lexicons for heuristic analysis
        self.lexicon = {
            "ph_tl": {
                "formal": ["po", "opo", "sir", "ma'am", "ninyo", "kayo"],
                "informal": ["ka", "mo", "sige", "lang"],
                "loanwords": ["premium", "policy", "claim", "grace period", "beneficiary", "due date"],
                "native": ["bayad", "palugit", "patakaran", "benepisyaryo", "magkano"]
            },
            "id_id": {
                "formal": ["bapak", "ibu", "mohon", "maaf", "kami", "anda"],
                "informal": ["kamu", "aku", "dong", "sih", "kok", "tolong"],
                "loanwords": ["premium", "policy", "claim", "cover", "grace period"],
                "native": ["premi", "polis", "klaim", "masa tenggang", "jatuh tempo", "cicilan", "ahli waris"]
            }
        }
        
    def analyze_turn(self, text: str) -> Dict[str, Any]:
        """Returns lang_mix and formality scores for a given text."""
        text_lower = text.lower()
        words = set(re.findall(r'\b\w+\b', text_lower))
        
        if self.market not in self.lexicon:
            return {"lang_mix": "unknown", "formality": "unknown"}
            
        lex = self.lexicon[self.market]
        
        # Formality
        formal_count = sum(1 for w in lex["formal"] if w in words)
        informal_count = sum(1 for w in lex["informal"] if w in words)
        
        if formal_count > informal_count:
            formality = "high"
        elif informal_count > formal_count:
            formality = "low"
        else:
            formality = "neutral"
            
        # Language Mix
        loan_count = sum(1 for w in lex["loanwords"] if w in text_lower)
        native_count = sum(1 for w in lex["native"] if w in text_lower)
        
        if loan_count > 0 and native_count > 0:
            lang_mix = "code_mixed"
        elif loan_count > native_count:
            lang_mix = "mostly_english"
        elif native_count > 0:
            lang_mix = "mostly_native"
        else:
            lang_mix = "neutral"
            
        return {
            "lang_mix": lang_mix,
            "formality": formality,
            "formal_words": formal_count,
            "loanwords": loan_count
        }


class DriftDetector:
    """Detects unexpected language drift (e.g., bot replying in pure English when it shouldn't)."""
    
    def __init__(self, market: str):
        self.market = market
        self.router = LanguageRouter(market)
        
    def check_drift(self, agent_text: str) -> Dict[str, Any]:
        """
        Check if the agent drifted into unexpected English.
        For PH/ID, the agent should ideally remain code_mixed or mostly_native,
        and never drop into mostly_english unless repeating a specific entity.
        """
        analysis = self.router.analyze_turn(agent_text)
        
        is_drift = False
        drift_reason = None
        
        if analysis["lang_mix"] == "mostly_english":
            # Heuristic check for drift
            # If there are no formal native markers (po/opo or Bapak/Ibu), it's a strong drift signal
            if analysis["formal_words"] == 0:
                is_drift = True
                drift_reason = "pure_english_no_honorifics"
                
        return {
            "is_drift": is_drift,
            "reason": drift_reason,
            "analysis": analysis
        }
        
    def analyze_transcript(self, transcript_turns: List[Dict]) -> Dict[str, Any]:
        """Run drift detection over an entire transcript."""
        drift_events = []
        
        for turn in transcript_turns:
            if turn["speaker"] == "agent":
                drift_check = self.check_drift(turn["text"])
                if drift_check["is_drift"]:
                    drift_events.append({
                        "turn": turn["turn"],
                        "text": turn["text"],
                        "reason": drift_check["reason"]
                    })
                    
        return {
            "total_agent_turns": sum(1 for t in transcript_turns if t["speaker"] == "agent"),
            "drift_events_count": len(drift_events),
            "events": drift_events,
            "passed": len(drift_events) == 0
        }
