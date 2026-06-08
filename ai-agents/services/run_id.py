"""
Agent Run ID service.

Every workflow gets:
  - id          : UUID (true primary key, collision-safe)
  - display_run_id : "RUN-2026-0001" (human-facing, shown on dashboard)

The sequence counter is in-memory (resets on restart).
The UUID ensures no collisions even across restarts.
"""
import uuid
import asyncio
from datetime import datetime

_counter: int = 0
_lock = asyncio.Lock()


async def new_run_ids() -> tuple[str, str]:
    """
    Returns (uuid_id, display_run_id)
    e.g. ("550e8400-e29b-...", "RUN-2026-0001")
    """
    global _counter
    async with _lock:
        _counter += 1
        year = datetime.utcnow().year
        display = f"RUN-{year}-{_counter:04d}"
    return str(uuid.uuid4()), display
