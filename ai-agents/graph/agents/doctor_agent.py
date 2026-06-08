"""
DoctorAssignAgent — Pure logic, no LLM.

Uses assigned_department from TriageAgent. Sorts by workload. No Gemini call.
"""
import logging
from graph.state import HospitalState, AgentDecision, ConfidenceLevel
from services.backend_client import api_get, api_post, api_patch

logger = logging.getLogger("mediagent.doctor_agent")


async def doctor_agent(state: HospitalState) -> HospitalState:
    patient      = state["patient"]
    run_uuid     = state["run_id"]
    display_id   = state.get("display_run_id", run_uuid)
    hospital_id  = state["hospital_id"]
    department   = state.get("assigned_department") or "General Medicine"

    logger.info(f"[{display_id}] DoctorAgent → dept={department}, patient={patient['id']}")

    assigned_doctor = None
    current_errors  = list(state.get("errors", []))

    # ── 1. Fetch available doctors ────────────────────────────────
    try:
        resp = await api_get("/api/internal/doctors", params={
            "isAvailable": "true",
            "limit": "50",
            "hospitalId": hospital_id,
        })
        data = resp.get("data", resp)
        doctors = data.get("data", data) if isinstance(data, dict) else data
        if not isinstance(doctors, list):
            doctors = []
    except Exception as e:
        logger.error(f"[{display_id}] DoctorAgent: failed to fetch doctors: {e}")
        current_errors.append(f"DoctorAgent: {e}")
        return {
            **state,
            "errors":          current_errors,
            "completed_nodes": [*state.get("completed_nodes", []), "DoctorAssignAgent"],
        }

    # ── 2. Filter by department, then sort by workload ─────────────
    def has_capacity(d: dict) -> bool:
        return d.get("currentLoad", 999) < d.get("maxWorkload", 10)

    in_dept = [
        d for d in doctors
        if d.get("department", {}).get("name", "").lower() == department.lower()
        and has_capacity(d)
    ]

    if not in_dept:
        logger.warning(f"[{display_id}] No doctors in '{department}', trying General Medicine")
        in_dept = [
            d for d in doctors
            if d.get("department", {}).get("name", "").lower() == "general medicine"
            and has_capacity(d)
        ]

    if not in_dept:
        # Last fallback: any available doctor with capacity
        in_dept = [d for d in doctors if has_capacity(d)]

    if not in_dept:
        logger.warning(f"[{display_id}] DoctorAgent: no doctors available")
        decision: AgentDecision = {
            "decision_summary":   "No available doctors found. All physicians at capacity.",
            "confidence_level":   ConfidenceLevel.LOW.value,
            "recommended_action": "Escalate to department head or on-call physician.",
        }
    else:
        best      = sorted(in_dept, key=lambda d: d.get("currentLoad", 0))[0]
        doc_name  = best.get("user", {}).get("name", "Unknown")
        dept_name = best.get("department", {}).get("name", department)

        # ── 3. Assign doctor ──────────────────────────────────────
        try:
            await api_patch(f"/api/internal/patients/{patient['id']}/assign-doctor", {
                "doctorId":   best["id"],
                "hospitalId": hospital_id,
            })
            assigned_doctor = best
            load_pct = round(
                (best.get("currentLoad", 0) / max(best.get("maxWorkload", 10), 1)) * 100
            )
            decision: AgentDecision = {
                "decision_summary": (
                    f"Dr. {doc_name} ({dept_name}) assigned. "
                    f"Workload: {best.get('currentLoad', 0)}/{best.get('maxWorkload', 10)} ({load_pct}%)."
                ),
                "confidence_level":   ConfidenceLevel.HIGH.value,
                "recommended_action": f"Dr. {doc_name} to review patient within 15 minutes.",
            }
            logger.info(f"[{display_id}] DoctorAgent: assigned Dr. {doc_name} (load={best.get('currentLoad')})")
        except Exception as e:
            logger.error(f"[{display_id}] DoctorAgent: assign failed: {e}")
            current_errors.append(f"DoctorAgent assign: {e}")
            decision: AgentDecision = {
                "decision_summary":   f"Doctor assignment failed: {str(e)[:120]}",
                "confidence_level":   ConfidenceLevel.LOW.value,
                "recommended_action": "Manual doctor assignment required.",
            }

    # ── 4. Log AgentAction ────────────────────────────────────────
    try:
        await api_post("/api/internal/agent-action", {
            "hospitalId":        hospital_id,
            "runId":             display_id,
            "agentRunId":        run_uuid,
            "agentName":         "DoctorAssignAgent",
            "actionType":        "DOCTOR_ASSIGN",
            "targetType":        "DOCTOR",
            "targetId":          assigned_doctor["id"] if assigned_doctor else None,
            "decisionSummary":   decision["decision_summary"],
            "confidenceLevel":   decision["confidence_level"],
            "recommendedAction": decision["recommended_action"],
            "status":            "COMPLETED" if assigned_doctor else "FAILED",
        })
    except Exception as e:
        logger.error(f"[{display_id}] Failed to log DoctorAgent action: {e}")

    return {
        **state,
        "doctor_decision":  decision,
        "assigned_doctor":  assigned_doctor,
        "errors":           current_errors,
        "completed_nodes":  [*state.get("completed_nodes", []), "DoctorAssignAgent"],
    }
