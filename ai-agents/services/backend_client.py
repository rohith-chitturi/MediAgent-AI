"""
Shared async HTTP client for all agent → Node.js API calls.
Handles auth, retries, and structured error logging.
"""
import httpx
import logging
from config.settings import settings

logger = logging.getLogger("mediagent.backend_client")

# Internal service key (set in both backend + ai-agents .env)
_HEADERS = {
    "Content-Type": "application/json",
    "x-agent-key": settings.AI_AGENT_API_KEY,
}

_client: httpx.AsyncClient | None = None


def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(
            base_url=settings.BACKEND_API_URL,
            headers=_HEADERS,
            timeout=15.0,
        )
    return _client


async def api_get(path: str, params: dict = None) -> dict:
    client = get_client()
    try:
        r = await client.get(path, params=params)
        r.raise_for_status()
        return r.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"GET {path} → {e.response.status_code}: {e.response.text}")
        raise
    except Exception as e:
        logger.error(f"GET {path} failed: {e}")
        raise


async def api_post(path: str, data: dict) -> dict:
    client = get_client()
    try:
        r = await client.post(path, json=data)
        r.raise_for_status()
        return r.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"POST {path} → {e.response.status_code}: {e.response.text}")
        raise
    except Exception as e:
        logger.error(f"POST {path} failed: {e}")
        raise


async def api_patch(path: str, data: dict) -> dict:
    client = get_client()
    try:
        r = await client.patch(path, json=data)
        r.raise_for_status()
        return r.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"PATCH {path} → {e.response.status_code}: {e.response.text}")
        raise
    except Exception as e:
        logger.error(f"PATCH {path} failed: {e}")
        raise
