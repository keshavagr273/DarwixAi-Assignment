"""Automated test: system prompt contains NO FAQs, objection scripts, or policy facts.

Gate 2 requirement: grep the system prompt for banned-fact list patterns.
"""
import re
import pytest
from services.agent.system_prompt import build_system_prompt, BANNED_FACT_PATTERNS_IN_PROMPT, SYSTEM_PROMPT_TEMPLATE


def test_system_prompt_no_faq_content():
    """System prompt must not contain FAQ-style Q&A pairs."""
    prompt = build_system_prompt("in_en")
    assert "frequently asked" not in prompt.lower()
    assert not re.search(r"Q:\s*.+\nA:\s*.+", prompt)


def test_system_prompt_no_premium_rates():
    """System prompt must not embed any specific premium amounts."""
    prompt = build_system_prompt("in_en")
    assert not re.search(r"premium.*INR\s*\d+", prompt, re.IGNORECASE)
    assert not re.search(r"INR\s*\d+.*premium", prompt, re.IGNORECASE)
    assert not re.search(r"PHP\s*\d+", prompt, re.IGNORECASE)
    assert not re.search(r"IDR\s*\d+", prompt, re.IGNORECASE)


def test_system_prompt_no_grace_period_facts():
    """System prompt must not state specific grace period durations."""
    prompt = build_system_prompt("in_en")
    assert not re.search(r"grace period.*\d+\s*(days?|months?)", prompt, re.IGNORECASE)


def test_system_prompt_no_guaranteed_returns():
    """System prompt must not promise guaranteed returns."""
    prompt = build_system_prompt("in_en")
    assert not re.search(r"guaranteed.*\d+\s*%", prompt, re.IGNORECASE)
    assert not re.search(r"\d+\s*%.*guaranteed", prompt, re.IGNORECASE)


def test_system_prompt_no_policy_numbers():
    """System prompt must not embed specific sum assured or policy period numbers."""
    prompt = build_system_prompt("in_en")
    assert not re.search(r"sum assured.*\d+", prompt, re.IGNORECASE)
    assert not re.search(r"endowment.*\d+\s*(years?|months?)", prompt, re.IGNORECASE)


def test_system_prompt_no_objection_scripts():
    """System prompt must not contain pre-written objection scripts."""
    prompt = build_system_prompt("in_en")
    assert not re.search(r"objection.*response", prompt, re.IGNORECASE)
    assert not re.search(r"when.*customer.*say.*too expensive", prompt, re.IGNORECASE)


def test_banned_fact_patterns_not_in_prompt_all_markets():
    """Run banned fact pattern check for all three markets."""
    for market in ["in_en", "ph_tl", "id_id"]:
        prompt = build_system_prompt(market)
        for pattern in BANNED_FACT_PATTERNS_IN_PROMPT:
            match = re.search(pattern, prompt, re.IGNORECASE)
            assert not match, (
                f"Banned fact pattern {pattern!r} found in {market} system prompt: "
                f"{match.group()!r}"
            )


def test_system_prompt_contains_retrieve_kb_instruction():
    """System prompt MUST instruct the agent to use retrieve_kb."""
    prompt = build_system_prompt("in_en")
    assert "retrieve_kb" in prompt


def test_system_prompt_contains_grounding_rules():
    """System prompt must mention grounding / KB requirement."""
    prompt = build_system_prompt("in_en")
    assert "GROUNDING" in prompt or "knowledge base" in prompt.lower()


def test_system_prompt_contains_fallback_instruction():
    """System prompt must instruct agent to fall back when KB has no answer."""
    prompt = build_system_prompt("in_en")
    assert "callback" in prompt.lower() or "specialist" in prompt.lower()


def test_system_prompt_all_markets_build():
    """All three market prompts should build without errors."""
    for market in ["in_en", "ph_tl", "id_id"]:
        prompt = build_system_prompt(market)
        assert len(prompt) > 200, f"Prompt for {market} is suspiciously short"
        assert "retrieve_kb" in prompt
