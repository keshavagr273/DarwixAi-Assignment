import tempfile
from pathlib import Path
from scripts.scan_secrets import scan_file

def test_secret_scanner_detects_fake_anthropic_key():
    with tempfile.NamedTemporaryFile("w+", delete=False, suffix=".py") as tf:
        tf.write('ANTHROPIC_KEY = "sk-ant-api03-abcdef12345678901234567890123456"\n')
        tf.flush()
        temp_path = Path(tf.name)

    try:
        findings = scan_file(temp_path)
        assert len(findings) == 1
        assert "Anthropic API Key" in findings[0][2]
    finally:
        temp_path.unlink()

def test_secret_scanner_detects_private_key():
    with tempfile.NamedTemporaryFile("w+", delete=False, suffix=".pem") as tf:
        tf.write("-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----\n")
        tf.flush()
        temp_path = Path(tf.name)

    try:
        findings = scan_file(temp_path)
        assert len(findings) >= 1
    finally:
        temp_path.unlink()

def test_secret_scanner_ignores_clean_file():
    with tempfile.NamedTemporaryFile("w+", delete=False, suffix=".py") as tf:
        tf.write('API_URL = "http://localhost:8000/api/v1/search"\n')
        tf.flush()
        temp_path = Path(tf.name)

    try:
        findings = scan_file(temp_path)
        assert len(findings) == 0
    finally:
        temp_path.unlink()
