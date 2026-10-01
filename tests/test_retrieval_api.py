from fastapi.testclient import TestClient
from services.api.main import app

client = TestClient(app)

def test_api_health_endpoint():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["active_kb_version"] == "v1.1"

def test_api_retrieval_factual_search():
    payload = {
        "query": "How many days of grace period are allowed for annual policy renewals?",
        "market": "in_en",
        "top_k": 3
    }
    res = client.post("/api/v1/retrieval/search", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["is_refusal"] is False
    assert len(data["results"]) >= 1
    assert data["latency_ms"] < 400.0  # Must be well within 400ms SLA
    
    retrieved_ids = [r["record_id"] for r in data["results"]]
    assert "kb_policy_hospital_cash" in retrieved_ids or "kb_faq_renewal_grace" in retrieved_ids
    assert data["results"][0]["score"] >= 0.50

def test_api_retrieval_out_of_scope_refusal():
    payload = {
        "query": "Does Meridian Assure cover cosmetic laser dental surgery for exotic pet dogs?",
        "market": "in_en",
        "top_k": 3
    }
    res = client.post("/api/v1/retrieval/search", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["is_refusal"] is True
    assert len(data["results"]) == 0

def test_api_retrieval_crypto_refusal():
    payload = {
        "query": "Can I pay my renewal insurance premium using Bitcoin or Ethereum cryptocurrency?",
        "market": "in_en",
        "top_k": 3
    }
    res = client.post("/api/v1/retrieval/search", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["is_refusal"] is True
    assert len(data["results"]) == 0

def test_api_kb_records_list():
    res = client.get("/api/v1/kb/records")
    assert res.status_code == 200
    records = res.json()
    assert len(records) >= 5
    # Verify kb_product_001 is present
    partner_recs = [r for r in records if r["record_id"] == "kb_product_001"]
    assert len(partner_recs) == 1
    assert partner_recs[0]["category"] == "partnership_benefits"
