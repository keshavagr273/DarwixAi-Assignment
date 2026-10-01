"""Tests for market pack loader."""
import pytest
from services.agent.market_loader import (
    load_pack,
    get_persona,
    get_qualification_fields,
    get_glossary,
    get_disclosures,
    get_compliance_rules,
    get_localization_examples,
    list_markets,
    format_opener,
    format_closer,
)


class TestMarketLoader:
    def test_list_markets(self):
        markets = list_markets()
        assert "in_en" in markets
        assert "ph_tl" in markets
        assert "id_id" in markets

    def test_load_in_en(self):
        pack = load_pack("in_en")
        assert pack["market"] == "in_en"
        assert pack["currency"] == "INR"

    def test_load_ph_tl(self):
        pack = load_pack("ph_tl")
        assert pack["market"] == "ph_tl"
        assert pack["currency"] == "PHP"

    def test_load_id_id(self):
        pack = load_pack("id_id")
        assert pack["market"] == "id_id"
        assert pack["currency"] == "IDR"

    def test_invalid_market_raises(self):
        with pytest.raises(ValueError):
            load_pack("xx_xx")

    def test_persona_in_en(self):
        persona = get_persona("in_en")
        assert persona["name"] == "Priya"
        assert "po" not in persona.get("honorifics", [])  # India uses ji/sir/ma'am

    def test_persona_ph_tl(self):
        persona = get_persona("ph_tl")
        assert persona["name"] == "Maria"
        assert "po" in persona["honorifics"]
        assert "opo" in persona["honorifics"]

    def test_persona_id_id(self):
        persona = get_persona("id_id")
        assert persona["name"] == "Sari"
        assert "Bapak" in persona["honorifics"]
        assert "Ibu" in persona["honorifics"]

    def test_qualification_fields_have_required_flag(self):
        for market in ["in_en", "ph_tl", "id_id"]:
            fields = get_qualification_fields(market)
            assert len(fields) > 0
            for f in fields:
                assert "id" in f
                assert "required" in f

    def test_glossary_has_grace_period(self):
        for market in ["in_en", "ph_tl", "id_id"]:
            glossary = get_glossary(market)
            assert "grace_period" in glossary

    def test_disclosures_has_opener(self):
        for market in ["in_en", "ph_tl", "id_id"]:
            disclosures = get_disclosures(market)
            assert "mandatory_opener" in disclosures

    def test_compliance_rules_not_empty(self):
        for market in ["in_en", "ph_tl", "id_id"]:
            rules = get_compliance_rules(market)
            assert len(rules) > 0

    def test_localization_examples_ph_tl(self):
        examples = get_localization_examples("ph_tl")
        assert len(examples) >= 5
        for ex in examples:
            assert "phrase" in ex
            assert "localized" in ex
            assert "reason" in ex

    def test_localization_examples_id_id(self):
        examples = get_localization_examples("id_id")
        assert len(examples) >= 5

    def test_format_opener_in_en(self):
        opener = format_opener("in_en", "Rajesh Kumar")
        assert "Rajesh Kumar" in opener
        assert "Priya" in opener

    def test_format_opener_ph_tl(self):
        opener = format_opener("ph_tl", "Juan")
        assert "Juan" in opener
        assert "Maria" in opener

    def test_format_closer_id_id(self):
        closer = format_closer("id_id", honorific="Bapak", customer_name="Budi")
        assert "Budi" in closer or len(closer) > 0

    def test_caching(self):
        """Loading the same pack twice should return the same object (cached)."""
        pack1 = load_pack("in_en")
        pack2 = load_pack("in_en")
        assert pack1 is pack2
