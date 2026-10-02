"""
Cloudflare R2 storage service for PARLEY (S3-compatible via boto3).

Used for:
  1. Audio segment uploads from live voice calls (WAV/WebM chunks)
  2. Full call recording storage after a session ends
  3. KB source document archival (raw HTML/PDF/CSV before cleaning)
  4. Transcript JSON backup (offload from local data/transcripts/)

Credentials: darwin-token (Cloudflare R2 S3-compatible access)
Endpoint: https://c3e7b15da41135d788ba74c1436b7b60.r2.cloudflarestorage.com
Bucket: darwix-assignment

All uploads are keyed by: {prefix}/{session_id}/{timestamp}_{filename}
Presigned URLs are generated for browser playback (valid for 1 hour).
"""
from __future__ import annotations

import io
import os
import time
from typing import Any, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

_R2_ENDPOINT = os.environ.get(
    "MINIO_ENDPOINT",
    "https://c3e7b15da41135d788ba74c1436b7b60.r2.cloudflarestorage.com"
)
_ACCESS_KEY = os.environ.get("MINIO_ACCESS_KEY", "")
_SECRET_KEY = os.environ.get("MINIO_SECRET_KEY", "")
_BUCKET = os.environ.get("MINIO_BUCKET", "darwix-assignment")

_s3_client = None


def _get_client():
    global _s3_client
    if _s3_client is not None:
        return _s3_client
    if not _ACCESS_KEY or not _SECRET_KEY:
        raise RuntimeError(
            "MINIO_ACCESS_KEY / MINIO_SECRET_KEY not configured for R2 storage."
        )
    try:
        import boto3
        _s3_client = boto3.client(
            "s3",
            endpoint_url=_R2_ENDPOINT,
            aws_access_key_id=_ACCESS_KEY,
            aws_secret_access_key=_SECRET_KEY,
            region_name="auto",
        )
    except ImportError:
        raise RuntimeError("boto3 not installed. Run: pip install boto3")
    return _s3_client


def storage_ping() -> bool:
    """Check that R2 bucket is accessible."""
    try:
        client = _get_client()
        client.head_bucket(Bucket=_BUCKET)
        return True
    except Exception:
        return False


# ─────────────────────────────────────────────────────────────────────────────
# Upload audio segment
# ─────────────────────────────────────────────────────────────────────────────

def upload_audio_segment(
    audio_bytes: bytes,
    session_id: str,
    filename: str,
    content_type: str = "audio/webm",
) -> Dict[str, Any]:
    """
    Upload a raw audio segment to R2.
    Returns dict with: key, url (public), size_bytes, uploaded_at
    """
    ts = int(time.time())
    key = f"calls/{session_id}/{ts}_{filename}"
    client = _get_client()
    client.put_object(
        Bucket=_BUCKET,
        Key=key,
        Body=audio_bytes,
        ContentType=content_type,
    )
    presigned_url = client.generate_presigned_url(
        "get_object",
        Params={"Bucket": _BUCKET, "Key": key},
        ExpiresIn=3600,
    )
    return {
        "key": key,
        "url": presigned_url,
        "size_bytes": len(audio_bytes),
        "uploaded_at": ts,
        "bucket": _BUCKET,
        "session_id": session_id,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Upload full transcript JSON
# ─────────────────────────────────────────────────────────────────────────────

def upload_transcript(
    transcript_json: str,
    call_id: str,
) -> Dict[str, Any]:
    """Upload final transcript JSON to R2 for permanent storage."""
    key = f"transcripts/{call_id}_transcript.json"
    client = _get_client()
    client.put_object(
        Bucket=_BUCKET,
        Key=key,
        Body=transcript_json.encode("utf-8"),
        ContentType="application/json",
    )
    presigned_url = client.generate_presigned_url(
        "get_object",
        Params={"Bucket": _BUCKET, "Key": key},
        ExpiresIn=86400,  # 24h for transcript access
    )
    return {
        "key": key,
        "url": presigned_url,
        "call_id": call_id,
        "uploaded_at": int(time.time()),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Upload KB source document
# ─────────────────────────────────────────────────────────────────────────────

def upload_kb_source(
    content: bytes,
    source_name: str,
    content_type: str = "text/html",
) -> Dict[str, Any]:
    """Archive a raw KB source document to R2 for pipeline traceability."""
    ts = int(time.time())
    key = f"kb/sources/{ts}_{source_name}"
    client = _get_client()
    client.put_object(
        Bucket=_BUCKET,
        Key=key,
        Body=content,
        ContentType=content_type,
    )
    return {
        "key": key,
        "source_name": source_name,
        "uploaded_at": ts,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Generate presigned URL for existing object
# ─────────────────────────────────────────────────────────────────────────────

def get_presigned_url(key: str, expires_in: int = 3600) -> str:
    """Generate a presigned URL for an existing R2 object."""
    client = _get_client()
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": _BUCKET, "Key": key},
        ExpiresIn=expires_in,
    )


# ─────────────────────────────────────────────────────────────────────────────
# List objects (for call library)
# ─────────────────────────────────────────────────────────────────────────────

def list_call_recordings(session_id: str) -> list:
    """List all audio segments for a session."""
    client = _get_client()
    prefix = f"calls/{session_id}/"
    try:
        response = client.list_objects_v2(Bucket=_BUCKET, Prefix=prefix)
        return [
            {
                "key": obj["Key"],
                "size": obj["Size"],
                "last_modified": obj["LastModified"].isoformat(),
            }
            for obj in response.get("Contents", [])
        ]
    except Exception:
        return []
