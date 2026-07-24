"""
NotificationAgent — Pure logic. Final node in every workflow.
Handles both patient workflows and resource-only workflows (patient may be None).
"""
import logging
from graph.state import HospitalState, AgentDecision, ConfidenceLevel
from services.backend_client import api_post

logger = logging.getLogger("mediagent.notification_agent")


async def notification_agent(state: HospitalState) -> HospitalState:
    run_uuid     = state["run_id"]
    display_id   = state.get("display_run_id", run_uuid)
    hospital_id  = state["hospital_id"]
    patient      = state.get("patient")    # May be None in resource-only workflows
    completed    = list(state.get("completed_nodes", []))
    errors       = list(state.get("errors", []))

    logger.info(f"[{display_id}] NotificationAgent → nodes={completed}, errors={len(errors)}")

    # ── Safe accessors for optional nested dicts ──────────────────
    triage_d = state.get("triage_decision") or {}
    bed_d    = state.get("bed_decision")    or {}
    doctor_d = state.get("doctor_decision") or {}
    discharge_d = state.get("discharge_decision") or {}

    priority    = state.get("assigned_priority")    or "UNKNOWN"
    department  = state.get("assigned_department")  or "—"
    bed_info    = state.get("assigned_bed")
    doctor_info = state.get("assigned_doctor")

    bed_str    = f"Bed {bed_info['number']} ({bed_info['type']})" if bed_info else "No bed"
    doctor_str = (f"Dr. {doctor_info.get('user', {}).get('name', '?')}"
                  if doctor_info else "No doctor")
    error_str  = f" | {len(errors)} error(s)" if errors else ""

    notif_type = "CRITICAL" if priority == "CRITICAL" else (
        "WARNING" if priority == "HIGH" else "INFO"
    )

    # ── 1. Build notification content ─────────────────────────────
    if "DischargeAgent" in completed and patient:
        title   = f"[{display_id}] {patient['name']} — Discharged"
        message = discharge_d.get("decision_summary", "Patient discharged and summary generated.")
        patient_id = patient["id"]
        notif_type = "INFO"
    elif patient:
        title   = f"[{display_id}] {patient['name']} — {priority}"
        message = (
            f"Priority: {priority} | Dept: {department} | "
            f"{bed_str} | {doctor_str}{error_str}"
        )
        patient_id = patient["id"]
    else:
        # Resource-only workflow
        resource_d = state.get("resource_decision") or {}
        title   = f"[{display_id}] Resource Check"
        message = resource_d.get("decision_summary", "Resource check completed.")
        patient_id = None
        notif_type = "WARNING" if state.get("resource_alerts") else "INFO"

    # ── 2. Persist dashboard notification ─────────────────────────
    try:
        await api_post("/api/internal/notifications", {
            "hospitalId": hospital_id,
            "title":      title,
            "message":    message,
            "type":       notif_type,
            "channel":    "DASHBOARD",
            "metadata": {
                "runId":      display_id,
                "patientId":  patient_id,
                "priority":   priority,
                "department": department,
            },
        })
    except Exception as e:
        logger.error(f"[{display_id}] Failed to persist notification: {e}")

    # ── 3. Socket.io real-time push ────────────────────────────────
    try:
        run_summary = {
            "runId":       display_id,
            "patientId":   patient_id,
            "patientName": patient["name"] if patient else None,
            "priority":    priority,
            "department":  department,
            "bed":         bed_str,
            "doctor":      doctor_str,
            "steps": [
                {
                    "agent":      "TriageAgent",
                    "done":       "TriageAgent" in completed,
                    "summary":    triage_d.get("decision_summary", "—"),
                    "confidence": triage_d.get("confidence_level", "—"),
                },
                {
                    "agent":      "BedAllocationAgent",
                    "done":       "BedAllocationAgent" in completed,
                    "summary":    bed_d.get("decision_summary", "—"),
                    "confidence": bed_d.get("confidence_level", "—"),
                },
                {
                    "agent":      "DoctorAssignAgent",
                    "done":       "DoctorAssignAgent" in completed,
                    "summary":    doctor_d.get("decision_summary", "—"),
                    "confidence": doctor_d.get("confidence_level", "—"),
                },
                {
                    "agent":      "DischargeAgent",
                    "done":       "DischargeAgent" in completed,
                    "summary":    discharge_d.get("decision_summary", "—"),
                    "confidence": discharge_d.get("confidence_level", "—"),
                },
                {
                    "agent":      "NotificationAgent",
                    "done":       True,
                    "summary":    "Workflow complete. Notifications dispatched.",
                    "confidence": "HIGH",
                },
            ],
            "errors": errors,
        }
        await api_post("/api/internal/emit", {
            "hospitalId": hospital_id,
            "event":      "agent:run_complete",
            "data":       run_summary,
        })
        # Signal dashboard to refresh stats
        await api_post("/api/internal/emit", {
            "hospitalId": hospital_id,
            "event":      "dashboard:refresh",
            "data":       {"trigger": display_id},
        })
    except Exception as e:
        logger.error(f"[{display_id}] Socket emit failed: {e}")

    # ── 4. Log AgentAction ─────────────────────────────────────────
    decision: AgentDecision = {
        "decision_summary":   f"Workflow {display_id} complete. {len(completed)} agents ran{error_str}.",
        "confidence_level":   ConfidenceLevel.HIGH.value,
        "recommended_action": "Monitor patient and escalate if condition deteriorates.",
    }
    try:
        await api_post("/api/internal/agent-action", {
            "hospitalId":        hospital_id,
            "runId":             display_id,
            "agentRunId":        run_uuid,
            "agentName":         "NotificationAgent",
            "actionType":        "NOTIFY",
            "targetType":        "PATIENT" if patient else "SYSTEM",
            "targetId":          patient_id,
            "decisionSummary":   decision["decision_summary"],
            "confidenceLevel":   decision["confidence_level"],
            "recommendedAction": decision["recommended_action"],
            "status":            "COMPLETED",
        })
    except Exception as e:
        logger.error(f"[{display_id}] Failed to log NotificationAgent action: {e}")

    return {
        **state,
        "notification_decision": decision,
        "completed_nodes":       [*completed, "NotificationAgent"],
    }
