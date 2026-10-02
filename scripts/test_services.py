import asyncio
import os
import sys
import pathlib
from dotenv import load_dotenv

# Ensure repo root is on sys.path
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))

load_dotenv()

async def test_all():
    results = {}

    # 1. PostgreSQL
    print("Testing PostgreSQL...")
    try:
        from services.db import db_ping
        ok = await db_ping()
        results["postgres"] = "OK" if ok else "FAIL"
    except Exception as e:
        results["postgres"] = f"ERROR: {e}"
    print(f"  postgres: {results['postgres']}")

    # 2. Redis
    print("Testing Redis...")
    try:
        from services.cache import redis_ping
        ok = await redis_ping()
        results["redis"] = "OK" if ok else "FAIL"
    except Exception as e:
        results["redis"] = f"ERROR: {e}"
    print(f"  redis: {results['redis']}")

    # 3. Cohere Embeddings
    print("Testing Cohere embeddings...")
    try:
        from services.embeddings import embed_query, EMBEDDING_DIM
        vec = embed_query("insurance renewal test")
        results["cohere"] = f"OK (dim={len(vec)})" if len(vec) == EMBEDDING_DIM else f"WARN: dim={len(vec)}"
    except Exception as e:
        results["cohere"] = f"ERROR: {e}"
    print(f"  cohere: {results['cohere']}")

    # 4. Groq LLM
    print("Testing Groq LLM...")
    try:
        from services.llm import detect_intent_llm
        result = detect_intent_llm("Hi, I want to renew my insurance policy", "in_en")
        results["groq"] = f"OK (intent={result['intent']}, latency={result['latency_ms']}ms)" if result["is_groq"] else f"FALLBACK: {result.get('error')}"
    except Exception as e:
        results["groq"] = f"ERROR: {e}"
    print(f"  groq: {results['groq']}")

    # 5. Deepgram (active API check)
    print("Testing Deepgram ASR...")
    try:
        import httpx
        dg_key = os.environ.get("DEEPGRAM_API_KEY", "")
        if not dg_key:
            results["deepgram"] = "NOT_CONFIGURED"
        else:
            with httpx.Client(timeout=10.0) as client:
                r = client.get("https://api.deepgram.com/v1/projects", headers={"Authorization": f"Token {dg_key}"})
                results["deepgram"] = f"OK (status={r.status_code})" if r.status_code == 200 else f"FAIL: {r.status_code}"
    except Exception as e:
        results["deepgram"] = f"ERROR: {e}"
    print(f"  deepgram: {results['deepgram']}")

    # 6. ElevenLabs (active synthesis check)
    print("Testing ElevenLabs TTS...")
    try:
        from services.voice.asr_tts import ElevenLabsTTS
        tts = ElevenLabsTTS()
        res = tts.synthesize("SecureLife service check", market="in_en")
        results["elevenlabs"] = f"OK ({len(res.audio_bytes)} bytes, latency={res.latency_ms}ms)" if res.audio_bytes else "FAIL: no audio"
    except Exception as e:
        results["elevenlabs"] = f"ERROR: {e}"
    print(f"  elevenlabs: {results['elevenlabs']}")

    # 7. R2/Minio storage
    print("Testing R2 storage...")
    try:
        from services.storage import storage_ping
        ok = storage_ping()
        results["r2"] = "OK" if ok else "FAIL"
    except Exception as e:
        results["r2"] = f"ERROR: {e}"
    print(f"  r2: {results['r2']}")

    print("\n=== SUMMARY ===")
    for k, v in results.items():
        status_tag = "[PASS]" if v.startswith("OK") or v.startswith("CONFIGURED") else "[FAIL]"
        print(f"  {status_tag} {k}: {v}")

asyncio.run(test_all())
