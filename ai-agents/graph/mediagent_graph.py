"""
MediAgent LangGraph — StateGraph orchestrating all agents.

Patient workflow:  triage → bed → doctor → notification → END
Resource workflow: resource → notification → END

Graphs are built lazily (inside functions, not at module import) so the
service starts cleanly even if langgraph is still being installed.
"""
import logging
import time
from langgraph.graph import StateGraph, END

from graph.state import HospitalState
from graph.agents.triage_agent import triage_agent
from graph.agents.bed_agent import bed_agent
from graph.agents.doctor_agent import doctor_agent
from graph.agents.resource_agent import resource_agent
from graph.agents.notification_agent import notification_agent
from graph.agents.discharge_agent import discharge_agent
from services.run_id import new_run_ids
from services.backend_client import api_post, api_patch

logger = logging.getLogger("mediagent.graph")

# Compiled graph singletons (built once on first call)
_patient_graph  = None
_resource_graph = None
_discharge_graph = None


def get_patient_graph():
    global _patient_graph
    if _patient_graph is None:
        g = StateGraph(HospitalState)
        g.add_node("triage",       triage_agent)
        g.add_node("bed",          bed_agent)
        g.add_node("doctor",       doctor_agent)
        g.add_node("notification", notification_agent)
        g.set_entry_point("triage")
        g.add_edge("triage",       "bed")
        g.add_edge("bed",          "doctor")
        g.add_edge("doctor",       "notification")
        g.add_edge("notification", END)
        _patient_graph = g.compile()
        logger.info("✅ Patient graph compiled")
    return _patient_graph


def get_resource_graph():
    global _resource_graph
    if _resource_graph is None:
        g = StateGraph(HospitalState)
        g.add_node("resource",     resource_agent)
        g.add_node("notification", notification_agent)
        g.set_entry_point("resource")
        g.add_edge("resource",     "notification")
        g.add_edge("notification", END)
        _resource_graph = g.compile()
        logger.info("✅ Resource graph compiled")
    return _resource_graph


def get_discharge_graph():
    global _discharge_graph
    if _discharge_graph is None:
        g = StateGraph(HospitalState)
        g.add_node("discharge",    discharge_agent)
        g.add_node("notification", notification_agent)
        g.set_entry_point("discharge")
        g.add_edge("discharge",    "notification")
        g.add_edge("notification", END)
        _discharge_graph = g.compile()
        logger.info("✅ Discharge graph compiled")
    return _discharge_graph


# ─── Patient registration workflow ───────────────────────────────
async def run_patient_workflow(event_payload: dict) -> dict:
    run_uuid, display_run_id = await new_run_ids()
    hospital_id = event_payload["hospital_id"]
    patient     = event_payload["patient"]
    start_ms    = int(time.time() * 1000)

    logger.info(f"🚀 [{display_run_id}] Patient workflow → {patient['name']}")

    # Create AgentRun record
    try:
        await api_post("/api/internal/agent-runs", {
            "id":           run_uuid,
            "displayRunId": display_run_id,
            "hospitalId":   hospital_id,
            "patientId":    patient["id"],
        })
    except Exception as e:
        logger.error(f"[{display_run_id}] Could not create AgentRun: {e}")

    initial_state: HospitalState = {
        "run_id":          run_uuid,
        "display_run_id":  display_run_id,
        "event_type":      event_payload.get("event_type", "patient.registered"),
        "hospital_id":     hospital_id,
        "patient":         patient,
        "resource":        None,
        "resource_trigger": None,
        "assigned_priority":    None,
        "assigned_department":  None,
        "assigned_bed":         None,
        "assigned_doctor":      None,
        "triage_decision":       None,
        "bed_decision":          None,
        "doctor_decision":       None,
        "resource_decision":     None,
        "discharge_decision":    None,
        "notification_decision": None,
        "notifications_sent":   [],
        "calls_initiated":      [],
        "resource_alerts":      [],
        "insights":        None,
        "errors":          [],
        "completed_nodes": [],
    }

    final_state     = initial_state
    workflow_status = "COMPLETED"
    try:
        final_state = await get_patient_graph().ainvoke(initial_state)
        if final_state.get("errors"):
            workflow_status = "PARTIAL"
    except Exception as e:
        logger.error(f"[{display_run_id}] Graph execution error: {e}", exc_info=True)
        workflow_status = "FAILED"

    # Update AgentRun record
    duration = int(time.time() * 1000) - start_ms
    try:
        await api_patch(f"/api/internal/agent-runs/{run_uuid}", {
            "workflowStatus": workflow_status,
            "durationMs":     duration,
        })
    except Exception as e:
        logger.error(f"[{display_run_id}] Could not update AgentRun: {e}")

    logger.info(f"✅ [{display_run_id}] {workflow_status} in {duration}ms — nodes={final_state.get('completed_nodes', [])}")

    return {
        "run_uuid":        run_uuid,
        "display_run_id":  display_run_id,
        "workflow_status": workflow_status,
        "duration_ms":     duration,
        "completed_nodes": final_state.get("completed_nodes", []),
        "errors":          final_state.get("errors", []),
    }


# ─── Resource-only workflow ──────────────────────────────────────
async def run_resource_workflow(event_payload: dict) -> dict:
    run_uuid, display_run_id = await new_run_ids()
    hospital_id = event_payload["hospital_id"]
    start_ms    = int(time.time() * 1000)

    logger.info(f"🔍 [{display_run_id}] Resource workflow → trigger={event_payload.get('resource_trigger')}")

    try:
        await api_post("/api/internal/agent-runs", {
            "id":           run_uuid,
            "displayRunId": display_run_id,
            "hospitalId":   hospital_id,
            "patientId":    None,
        })
    except Exception as e:
        logger.error(f"[{display_run_id}] Could not create AgentRun: {e}")

    initial_state: HospitalState = {
        "run_id":          run_uuid,
        "display_run_id":  display_run_id,
        "event_type":      event_payload.get("event_type", "resource.updated"),
        "hospital_id":     hospital_id,
        "patient":         None,
        "resource":        event_payload.get("resource"),
        "resource_trigger": event_payload.get("resource_trigger", "resource_updated"),
        "assigned_priority":    None,
        "assigned_department":  None,
        "assigned_bed":         event_payload.get("assigned_bed"),
        "assigned_doctor":      None,
        "triage_decision":       None,
        "bed_decision":          None,
        "doctor_decision":       None,
        "resource_decision":     None,
        "discharge_decision":    None,
        "notification_decision": None,
        "notifications_sent":   [],
        "calls_initiated":      [],
        "resource_alerts":      [],
        "insights":        None,
        "errors":          [],
        "completed_nodes": [],
    }

    final_state     = initial_state
    workflow_status = "COMPLETED"
    try:
        final_state = await get_resource_graph().ainvoke(initial_state)
        if final_state.get("errors"):
            workflow_status = "PARTIAL"
    except Exception as e:
        logger.error(f"[{display_run_id}] Resource workflow error: {e}", exc_info=True)
        workflow_status = "FAILED"

    duration = int(time.time() * 1000) - start_ms
    try:
        await api_patch(f"/api/internal/agent-runs/{run_uuid}", {
            "workflowStatus": workflow_status,
            "durationMs":     duration,
        })
    except Exception as e:
        logger.error(f"[{display_run_id}] Could not update AgentRun: {e}")

    return {
        "run_uuid":        run_uuid,
        "display_run_id":  display_run_id,
        "workflow_status": workflow_status,
        "duration_ms":     duration,
    }

# ─── Discharge workflow ───────────────────────────────────────
async def run_discharge_workflow(event_payload: dict) -> dict:
    run_uuid, display_run_id = await new_run_ids()
    hospital_id = event_payload["hospital_id"]
    patient     = event_payload["patient"]
    start_ms    = int(time.time() * 1000)

    logger.info(f"🚀 [{display_run_id}] Discharge workflow → {patient['name']}")

    try:
        await api_post("/api/internal/agent-runs", {
            "id":           run_uuid,
            "displayRunId": display_run_id,
            "hospitalId":   hospital_id,
            "patientId":    patient["id"],
        })
    except Exception as e:
        logger.error(f"[{display_run_id}] Could not create AgentRun: {e}")

    initial_state: HospitalState = {
        "run_id":          run_uuid,
        "display_run_id":  display_run_id,
        "event_type":      event_payload.get("event_type", "patient.discharged"),
        "hospital_id":     hospital_id,
        "patient":         patient,
        "resource":        None,
        "resource_trigger": None,
        "assigned_priority":    patient.get("priority"),
        "assigned_department":  None,
        "assigned_bed":         None,
        "assigned_doctor":      None,
        "triage_decision":       None,
        "bed_decision":          None,
        "doctor_decision":       None,
        "resource_decision":     None,
        "discharge_decision":    None,
        "notification_decision": None,
        "notifications_sent":   [],
        "calls_initiated":      [],
        "resource_alerts":      [],
        "insights":        None,
        "errors":          [],
        "completed_nodes": [],
    }

    final_state     = initial_state
    workflow_status = "COMPLETED"
    try:
        final_state = await get_discharge_graph().ainvoke(initial_state)
        if final_state.get("errors"):
            workflow_status = "PARTIAL"
    except Exception as e:
        logger.error(f"[{display_run_id}] Graph execution error: {e}", exc_info=True)
        workflow_status = "FAILED"

    duration = int(time.time() * 1000) - start_ms
    try:
        await api_patch(f"/api/internal/agent-runs/{run_uuid}", {
            "workflowStatus": workflow_status,
            "durationMs":     duration,
        })
    except Exception as e:
        logger.error(f"[{display_run_id}] Could not update AgentRun: {e}")

    logger.info(f"✅ [{display_run_id}] {workflow_status} in {duration}ms — nodes={final_state.get('completed_nodes', [])}")

    return {
        "run_uuid":        run_uuid,
        "display_run_id":  display_run_id,
        "workflow_status": workflow_status,
        "duration_ms":     duration,
        "completed_nodes": final_state.get("completed_nodes", []),
        "errors":          final_state.get("errors", []),
    }
