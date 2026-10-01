"""High-signal regression matrix for deterministic backend utilities.

Each parameter row represents an independently reported unit test.  The cases
deliberately cover normal inputs, boundary inputs, and inputs that must not be
mistaken for supported formats or sensitive data.
"""
from pathlib import Path

import pytest

from kb.pipeline.chunker import estimate_tokens, split_prose_into_chunks
from kb.pipeline.cleaner import clean_text_boilerplate
from kb.pipeline.dedupe import jaccard_similarity, tokenize_for_similarity
from kb.pipeline.fetch_parse import (
    compute_extraction_health,
    detect_source_type,
    parse_csv_document,
    parse_html_document,
    parse_markdown_document,
)
from kb.pipeline.normalizer import normalize_dates_in_text, normalize_field_name, normalize_terminology
from kb.pipeline.pii_shield import PiiVault, sanitize_pii, scan_text_for_raw_pii
from services.agent.language_router import DriftDetector, LanguageRouter


@pytest.mark.parametrize(("raw", "expected"), [
    ("Annual Income", "annual_income"), ("Annual-Income", "annual_income"),
    ("  Age  ", "age"), ("Policy #", "policy"), ("PIN Code", "pin_code"),
    ("customer.name", "customername"), ("UPPER CASE", "upper_case"),
    ("already_normalized", "already_normalized"), ("A--B", "a_b"),
    ("a   b", "a_b"), ("a/b", "ab"), ("a (optional)", "a_optional"),
    ("  First-Name! ", "first_name"), ("DOB%", "dob"), ("", ""),
])
def test_normalize_field_name_matrix(raw, expected):
    assert normalize_field_name(raw) == expected


@pytest.mark.parametrize(("raw", "expected"), [
    ("01/02/2024", "2024-02-01"), ("1/2/2024", "2024-02-01"),
    ("31/12/2025", "2025-12-31"), ("12-31-2024", "2024-12-31"),
    ("1-2-2024", "2024-01-02"), ("02-03-2024", "2024-02-03"),
    ("2024.02.03", "2024-02-03"), ("2024.2.3", "2024-02-03"),
    ("due 01/02/2024 please", "due 2024-02-01 please"),
    ("01/02/2024; 12-31-2024", "2024-02-01; 2024-12-31"),
    ("no date", "no date"), ("2024/02/03", "2024/02/03"),
    ("1/2/24", "1/2/24"), ("abc01/02/2024def", "abc01/02/2024def"),
    ("2024.13.1", "2024-13-01"),
])
def test_normalize_dates_matrix(raw, expected):
    assert normalize_dates_in_text(raw) == expected


@pytest.mark.parametrize(("name", "kind"), [
    ("site.html", "website"), ("site.HTM", "website"), ("fees.csv", "table"),
    ("fees.TSV", "table"), ("product_brochure.md", "brochure"),
    ("policy_wording.md", "policy_wording"), ("renewal_policy.txt", "policy_wording"),
    ("objection_playbook.md", "playbook"), ("notes.md", "docx"),
    ("notes.txt", "docx"), ("unknown.bin", "website"),
])
def test_detect_source_type_matrix(name, kind):
    assert detect_source_type(Path(name)) == kind


@pytest.mark.parametrize(("text", "expected"), [
    ("Plain content", "Plain content"),
    ("Cookie consent notice: keep out Accept All\nBody", "Body"),
    ("Cookie consent notice: keep out Dismiss\nBody", "Body"),
    ("Home | FAQs\nBody", "Body"), ("Home | Renewal Desk\nBody", "Body"),
    ("Home | Products | Contact\nBody", "Body"),
    ("Twitter LinkedIn\nBody", "Body"),
    ("A    lot\t of spaces", "A lot of spaces"),
    ("Before\n\n\nAfter", "Before\n\nAfter"),
    ("<nav class=\"nav-bar\">links</nav>\nBody", "Body"),
])
def test_cleaner_boilerplate_matrix(text, expected):
    assert clean_text_boilerplate(text) == expected


@pytest.mark.parametrize(("text", "entity_type", "token"), [
    ("Call 9876543210", "PHONE", "[PHONE_1]"),
    ("Call +91 9876 543 210", "PHONE", "[PHONE_1]"),
    ("Call +63-987-654-3210", "PHONE", "[PHONE_1]"),
    ("Call +62 812 345 6789", "PHONE", "[PHONE_1]"),
    ("Mail jane.doe@example.com", "EMAIL", "[EMAIL_1]"),
    ("Policy POL-12345", "POLICY_NUM", "[POLICY_NUM_1]"),
    ("Policy POL-PH-123456", "POLICY_NUM", "[POLICY_NUM_1]"),
    ("PAN ABCDE1234F", "NATIONAL_ID_PAN", "[ID_1]"),
    ("NIK 1234567890123456", "NATIONAL_ID_NIK", "[ID_1]"),
    ("TIN 123-456-789-000", "NATIONAL_ID_TIN", "[ID_1]"),
])
def test_pii_sanitization_matrix(text, entity_type, token):
    clean, types, count = sanitize_pii(text, PiiVault())
    assert types == [entity_type] and count == 1 and token in clean
    assert scan_text_for_raw_pii(clean) == []


@pytest.mark.parametrize(("text", "expected"), [
    ("one two three", {"one", "two", "three"}), ("One ONE one", {"one"}),
    ("a an the premium", {"the", "premium"}), ("policy-number 123", {"policy", "number", "123"}),
    ("punctuation, stays!", {"punctuation", "stays"}), ("", set()),
    ("two-letter aa bee", {"two", "letter", "bee"}), ("ABC_123", set()),
    ("x99 y", {"x99"}), ("UPPER lower", {"upper", "lower"}),
])
def test_similarity_tokenization_matrix(text, expected):
    assert tokenize_for_similarity(text) == expected


@pytest.mark.parametrize(("left", "right", "expected"), [
    (set(), set(), 0.0), (set(), {"a"}, 0.0), ({"a"}, set(), 0.0),
    ({"a"}, {"a"}, 1.0), ({"a"}, {"b"}, 0.0),
    ({"a", "b"}, {"a", "b"}, 1.0), ({"a", "b"}, {"b", "c"}, 0.3333),
    ({"a", "b", "c"}, {"a"}, 0.3333), ({"a", "b"}, {"a", "b", "c", "d"}, 0.5),
    ({"a", "b", "c"}, {"b", "c", "d"}, 0.5),
])
def test_jaccard_similarity_matrix(left, right, expected):
    assert jaccard_similarity(left, right) == expected


@pytest.mark.parametrize(("market", "text", "mix", "formality"), [
    ("ph_tl", "Magandang araw po", "neutral", "high"),
    ("ph_tl", "sige ka", "neutral", "low"),
    ("ph_tl", "po sige", "neutral", "neutral"),
    ("ph_tl", "premium policy", "mostly_english", "neutral"),
    ("ph_tl", "bayad palugit", "mostly_native", "neutral"),
    ("ph_tl", "premium bayad", "code_mixed", "neutral"),
    ("id_id", "Bapak mohon", "neutral", "high"),
    ("id_id", "kamu dong", "neutral", "low"),
    ("id_id", "premium polis", "code_mixed", "neutral"),
    ("in_en", "hello", "unknown", "unknown"),
])
def test_language_router_matrix(market, text, mix, formality):
    analysis = LanguageRouter(market).analyze_turn(text)
    assert analysis["lang_mix"] == mix and analysis["formality"] == formality


@pytest.mark.parametrize(("text", "target", "overlap", "expected"), [
    ("", 10, 2, [""]), ("one two", 2, 1, ["one two"]),
    ("one two three", 2, 0, ["one two", "three"]),
    ("one two three", 2, 1, ["one two", "two three"]),
    ("one two three four", 2, 1, ["one two", "two three", "three four"]),
    ("one two three four five", 3, 1, ["one two three", "three four five"]),
    ("one two three four five six", 3, 1, ["one two three", "three four five", "five six"]),
    ("one two three four", 4, 2, ["one two three four"]),
    ("one", 5, 2, ["one"]),
    ("one two three four five", 2, 1, ["one two", "two three", "three four", "four five"]),
])
def test_prose_chunking_matrix(text, target, overlap, expected):
    assert split_prose_into_chunks(text, target, overlap) == expected


@pytest.mark.parametrize(("raw", "title", "sections"), [
    ("# Main\nIntro", "Main", [("Main", "Intro")]),
    ("# Main\n## First\nA\n## Second\nB", "Main", [("First", "A"), ("Second", "B")]),
    ("No heading\nBody", "My File", [("My File", "No heading\nBody")]),
    ("# Heading\n\nText\n", "Heading", [("Heading", "Text")]),
    ("## First\nA", "My File", [("First", "A")]),
])
def test_markdown_parser_matrix(raw, title, sections):
    actual_title, actual_sections = parse_markdown_document(Path("my_file.md"), raw)
    assert actual_title == title
    assert [(item["heading"], item["text"]) for item in actual_sections] == sections


@pytest.mark.parametrize(("raw", "expected_count"), [
    ("a,b\n1,2", 1), ("a,b\n1,2\n3,4", 2), ("a,b\n", 0),
    ("", 0), ("name\nvalue", 1),
])
def test_csv_parser_matrix(raw, expected_count):
    title, sections = parse_csv_document(Path("fee_table.csv"), raw)
    assert title == "Fee Table" and len(sections) == expected_count


@pytest.mark.parametrize(("raw", "expected_title", "expected_sections"), [
    ("<html><title>Title</title><body>Body text</body></html>", "Title", 1),
    ("<main><h1>First</h1><p>One</p><h2>Second</h2><p>Two</p></main>", "Page", 2),
    ("<body><article>Only article</article></body>", "Page", 1),
    ("<body><h2>Heading</h2><div>Content</div></body>", "Page", 1),
])
def test_html_parser_matrix(raw, expected_title, expected_sections):
    title, sections = parse_html_document(Path("page.html"), raw)
    assert title == expected_title and len(sections) == expected_sections


@pytest.mark.parametrize(("text", "minimum", "maximum"), [
    ("", 0.0, 0.0), ("clean words 123", 0.9, 1.0),
    ("@!@!@!@!", 0.0, 0.2), ("abc ### def", 0.3, 0.9),
    ("normal\ntext\nwith spaces", 0.9, 1.0),
])
def test_extraction_health_matrix(text, minimum, maximum):
    assert minimum <= compute_extraction_health(text) <= maximum


@pytest.mark.parametrize(("text", "market", "expected"), [
    ("premium payment", "in_en", "premium"), ("PREMIUM PAYMENT", "in_en", "premium"),
    ("unrelated text", "in_en", "unrelated text"), ("premium payment", "unknown", "premium payment"),
])
def test_terminology_normalization_matrix(text, market, expected):
    glossary = {"markets": {"in_en": {"terms": {"premium": {"canonical": "premium", "synonyms": ["premium payment"]}}}}}
    assert normalize_terminology(text, market, glossary) == expected


@pytest.mark.parametrize(("market", "text", "drift"), [
    ("ph_tl", "The policy premium is due", True),
    ("ph_tl", "po premium policy", False),
    ("ph_tl", "bayad palugit", False),
    ("id_id", "The claim is pending", True),
    ("id_id", "Bapak premium policy", False),
])
def test_drift_detector_matrix(market, text, drift):
    assert DriftDetector(market).check_drift(text)["is_drift"] is drift


@pytest.mark.parametrize(("text", "expected"), [
    ("", 1), ("one", 1), ("one two", 2), ("  one   two  ", 2),
    ("one\ntwo\nthree", 3),
])
def test_token_estimation_matrix(text, expected):
    assert estimate_tokens(text) == expected
