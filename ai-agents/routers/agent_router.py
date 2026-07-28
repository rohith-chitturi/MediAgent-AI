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
    from graph.mediagent_graph import run_patient_workflow, run_resource_workflow

    event = payload.event_type

    if event == "patient.registered":
        if not payload.patient:
            raise HTTPException(status_code=400, detail="patient field required for patient.registered")
        asyncio.create_task(run_patient_workflow(payload.model_dump()))
    elif event == "patient.discharged":
        if not payload.patient:
            raise HTTPException(status_code=400, detail="patient field required for patient.discharged")
        from graph.mediagent_graph import run_discharge_workflow
        asyncio.create_task(run_discharge_workflow(payload.model_dump()))
    elif event in ("bed.assigned", "resource.updated", "resource.scheduled"):
        asyncio.create_task(run_resource_workflow(payload.model_dump()))
    else:
        raise HTTPException(status_code=400, detail=f"Unknown event_type: {event}")

    return {"success": True, "message": f"Agent workflow started in background for {event}"}


# ─── POST /agents/run/{run_id}/resume ────────────────────────────
class ResumeRequest(BaseModel):
    action: str  # APPROVE, REJECT, ESCALATE
    comment: str
    userId: str
    overrideConfig: Optional[dict] = None

@router.post("/run/{run_id}/resume", dependencies=[Depends(verify_agent_key)])
async def resume_run(run_id: str, payload: ResumeRequest):
    from graph.mediagent_graph import get_patient_graph
    import time
    from services.backend_client import api_patch
    
    graph = await get_patient_graph()
    config = {"configurable": {"thread_id": run_id}}
    
    state_snap = await graph.aget_state(config)
    if not state_snap.next:
        raise HTTPException(status_code=400, detail="No pending node to resume for this run.")

    # We inject the human's response into the state by passing it as the command / state update
    # In LangGraph 1.x, we can simply invoke with the state update we want to merge.
    approval_context = {
        "action": payload.action,
        "comment": payload.comment,
        "userId": payload.userId,
        "overrideConfig": payload.overrideConfig or {}
    }
    
    # We resume by invoking the graph with the state update
    try:
        # Run graph to completion in the background
        async def run_resumed():
            start_ms = int(time.time() * 1000)
            final_state = await graph.ainvoke({"approval_context": approval_context}, config)
            
            workflow_status = "COMPLETED"
            if final_state.get("errors"):
                workflow_status = "PARTIAL"
                
            try:
                await api_patch(f"/api/internal/agent-runs/{run_id}", {
                    "workflowStatus": workflow_status,
                })
            except Exception as e:
                logger.error(f"[{run_id}] Could not update AgentRun after resume: {e}")
                
        asyncio.create_task(run_resumed())
        return {"success": True, "message": "Workflow resumed"}
    except Exception as e:
        logger.error(f"Failed to resume run {run_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ─── POST /agents/predictive/run ──────────────────────────────────
class PredictiveRequest(BaseModel):
    hospitalId: str
    telemetry: Dict[str, Any]

@router.post("/predictive/run", dependencies=[Depends(verify_agent_key)])
async def run_predictive_agent(payload: PredictiveRequest):
    from graph.agents.predictive_agent import predictive_agent
    result = await predictive_agent(payload.hospitalId, payload.telemetry)
    return result

# ─── GET /agents/health ───────────────────────────────────────────
@router.get("/health")
async def agent_health():
    return {
        "status": "ready",
        "llm":    "gemini" if settings.GEMINI_API_KEY else "mock",
        "agents": [
            "TriageAgent", "BedAllocationAgent", "DoctorAssignAgent",
            "ResourceAgent", "NotificationAgent", "VoiceAgent", "ApprovalAgent", "PredictiveAnalyticsAgent"
        ],
    }
