"""
FastAPI router — entry point for Node.js to trigger agent workflows.

Auth: x-agent-key header (internal service key, not JWT).
"""
import logging
import asyncio
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional

from config.settings import settings

logger = logging.getLogger("mediagent.router")
router = APIRouter()


# ─── Auth dependency (Depends — not plain function call) ──────────
async def verify_agent_key(x_agent_key: str = Header(None)):
    if x_agent_key != settings.AI_AGENT_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized — invalid x-agent-key")


# ─── Request schemas ──────────────────────────────────────────────
class PatientPayload(BaseModel):
    id:          str
    name:        str
    age:         int
    gender:      str
    symptoms:    str
    priority:    Optional[str] = None
    status:      str           = "WAITING"
    hospital_id: str


class RunRequest(BaseModel):
    event_type:       str
    hospital_id:      str
    patient:          Optional[PatientPayload] = None
    resource:         Optional[dict]           = None
    resource_trigger: Optional[str]            = None
    assigned_bed:     Optional[dict]           = None


# ─── POST /agents/run  (sync — waits for result, returns it) ──────
@router.post("/run", dependencies=[Depends(verify_agent_key)])
async def trigger_run(payload: RunRequest):
    # Import lazily to avoid top-level module-init crashes
    from graph.mediagent_graph import run_patient_workflow, run_resource_workflow

    event = payload.event_type

    if event == "patient.registered":
        if not payload.patient:
            raise HTTPException(status_code=400, detail="patient field required for patient.registered")
        result = await run_patient_workflow(payload.model_dump())
        return {"success": True, "data": result}

    elif event in ("bed.assigned", "resource.updated", "resource.scheduled"):
        result = await run_resource_workflow(payload.model_dump())
        return {"success": True, "data": result}

    else:
        raise HTTPException(status_code=400, detail=f"Unknown event_type: {event}")


# ─── POST /agents/run/background  (async — returns 202 immediately) 
@router.post("/run/background", status_code=202, dependencies=[Depends(verify_agent_key)])
async def trigger_run_background(payload: RunRequest):
    from graph.mediagent_graph import run_patient_workflow

    if not payload.patient:
        raise HTTPException(status_code=400, detail="patient field required")

    asyncio.create_task(run_patient_workflow(payload.model_dump()))
    return {"success": True, "message": "Agent workflow started in background"}


# ─── GET /agents/health ───────────────────────────────────────────
@router.get("/health")
async def agent_health():
    return {
        "status": "ready",
        "llm":    "gemini" if settings.GEMINI_API_KEY else "mock",
        "agents": [
            "TriageAgent", "BedAllocationAgent", "DoctorAssignAgent",
            "ResourceAgent", "NotificationAgent",
        ],
    }
