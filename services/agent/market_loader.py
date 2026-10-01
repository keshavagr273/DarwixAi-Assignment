"""Market Pack loader for PARLEY Voice Agent."""
from __future__ import annotations

from pathlib import Path
from typing import Dict, Any, List, Optional
import yaml

PACK_DIR = Path(__file__).parent / "market_packs"

_PACKS: Dict[str, Dict[str, Any]] = {}


def load_pack(market: str) -> Dict[str, Any]:
    """Load and cache a market pack by market ID (in_en, ph_tl, id_id)."""
    if market in _PACKS:
        return _PACKS[market]
    pack_path = PACK_DIR / f"{market}.yaml"
    if not pack_path.exists():
        raise ValueError(f"No market pack found for market: {market!r}. Expected at {pack_path}")
    with open(pack_path, encoding="utf-8") as f:
        data = yaml.safe_load(f)
    _PACKS[market] = data
    return data


def get_persona(market: str) -> Dict[str, Any]:
    """Return persona config for the market."""
    return load_pack(market)["persona"]


def get_qualification_fields(market: str) -> List[Dict[str, Any]]:
    """Return qualification field definitions."""
    return load_pack(market).get("qualification_fields", [])


def get_glossary(market: str) -> Dict[str, str]:
    """Return glossary mapping for the market."""
    return load_pack(market).get("glossary", {})


def get_disclosures(market: str) -> Dict[str, str]:
    """Return disclosure texts for the market."""
    return load_pack(market).get("disclosures", {})


def get_compliance_rules(market: str) -> List[Dict[str, Any]]:
    """Return compliance rules list for the market."""
    return load_pack(market).get("compliance_rules", [])


def get_localization_examples(market: str) -> List[Dict[str, str]]:
    """Return localization examples (original vs. adapted phrases)."""
    return load_pack(market).get("localization_examples", [])


def list_markets() -> List[str]:
    """Return all available market IDs."""
    return [p.stem for p in sorted(PACK_DIR.glob("*.yaml"))]


def format_opener(market: str, customer_name: str = "valued customer") -> str:
    """Return the personalized opener for the market."""
    persona = get_persona(market)
    return persona["opener"].replace("{customer_name}", customer_name)


def format_closer(market: str, honorific: str = "", customer_name: str = "") -> str:
    """Return the personalized closer for the market."""
    persona = get_persona(market)
    closer = persona["closer"]
    closer = closer.replace("{customer_name}", customer_name)
    closer = closer.replace("{honorific}", honorific)
    return closer.strip()
