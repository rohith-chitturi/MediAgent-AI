"""
BedAllocationAgent — Pure logic, no LLM.

Responsibilities:
  1. Get list of available beds from Node.js API
  2. Select best bed based on patient priority:
     CRITICAL → ICU first, HIGH → EMERGENCY first, others → GENERAL
  3. Assign the bed via POST /api/internal/beds/:id/assign
  4. Log AgentAction
"""
import logging
from graph.state import HospitalState, AgentDecision, ConfidenceLevel
from services.backend_client import api_get, api_post

logger = logging.getLogger("mediagent.bed_agent")

PRIORITY_BED_PREFERENCE = {
    "CRITICAL": ["ICU", "EMERGENCY", "GENERAL"],
    "HIGH":     ["EMERGENCY", "GENERAL", "ICU"],
    "MEDIUM":   ["GENERAL", "EMERGENCY", "ICU"],
    "LOW":      ["GENERAL", "EMERGENCY", "ICU"],
}


async def bed_agent(state: HospitalState) -> HospitalState:
    patient      = state["patient"]
    run_uuid     = state["run_id"]
    display_id   = state.get("display_run_id", run_uuid)
    hospital_id  = state["hospital_id"]
    priority     = state.get("assigned_priority") or "MEDIUM"

    logger.info(f"[{display_id}] BedAgent → priority={priority}, patient={patient['id']}")

    assigned_bed = None
    current_errors = list(state.get("errors", []))

    # ── 1. Fetch available beds ───────────────────────────────────
    try:
        resp = await api_get("/api/internal/beds", params={
            "status": "AVAILABLE", "limit": "50", "hospitalId": hospital_id,
        })
        # Normalise response shape
        data = resp.get("data", resp)
        beds = data.get("data", data) if isinstance(data, dict) else data
        if not isinstance(beds, list):
            beds = []
    except Exception as e:
        logger.error(f"[{display_id}] BedAgent: failed to fetch beds: {e}")
        current_errors.append(f"BedAgent: {e}")
        return {
            **state,
            "errors":          current_errors,
            "completed_nodes": [*state.get("completed_nodes", []), "BedAllocationAgent"],
        }

    # ── 2. Select best bed by priority preference ─────────────────
    preference = PRIORITY_BED_PREFERENCE.get(priority, ["GENERAL", "EMERGENCY", "ICU"])
    selected = None
    for bed_type in preference:
        matches = [b for b in beds if b.get("type") == bed_type]
        if matches:
            selected = sorted(matches, key=lambda b: b.get("number", ""))[0]
            break

    if not selected:
        logger.warning(f"[{display_id}] BedAgent: no beds available")
        decision: AgentDecision = {
            "decision_summary":   "No available beds found. Patient placed on waiting list.",
            "confidence_level":   ConfidenceLevel.LOW.value,
            "recommended_action": "Alert hospital management to bed shortage.",
        }
    else:
        # ── 3. Assign the bed ─────────────────────────────────────
        try:
            await api_post(f"/api/internal/beds/{selected['id']}/assign", {
                "patientId":  patient["id"],
                "hospitalId": hospital_id,
            })
            assigned_bed = selected
            decision: AgentDecision = {
                "decision_summary": (
                    f"Bed {selected['number']} ({selected['type']}) in "
                    f"{selected.get('ward', 'Ward')} assigned to patient."
                ),
                "confidence_level":   ConfidenceLevel.HIGH.value,
                "recommended_action": f"Patient transferred to {selected['type']} bed {selected['number']}.",
            }
            logger.info(f"[{display_id}] BedAgent: assigned {selected['number']} ({selected['type']})")
        except Exception as e:
            logger.error(f"[{display_id}] BedAgent: assign failed: {e}")
            current_errors.append(f"BedAgent assign: {e}")
            decision: AgentDecision = {
                "decision_summary":   f"Bed assignment failed: {str(e)[:120]}",
                "confidence_level":   ConfidenceLevel.LOW.value,
                "recommended_action": "Manual bed assignment required.",
            }

    # ── 4. Log AgentAction ────────────────────────────────────────
    try:
        await api_post("/api/internal/agent-action", {
            "hospitalId":        hospital_id,
            "runId":             display_id,
            "agentRunId":        run_uuid,
            "agentName":         "BedAllocationAgent",
            "actionType":        "BED_ASSIGN",
            "targetType":        "BED",
            "targetId":          assigned_bed["id"] if assigned_bed else None,
            "decisionSummary":   decision["decision_summary"],
            "confidenceLevel":   decision["confidence_level"],
            "recommendedAction": decision["recommended_action"],
            "status":            "COMPLETED" if assigned_bed else "FAILED",
        })
    except Exception as e:
        logger.error(f"[{display_id}] Failed to log BedAgent action: {e}")

    return {
        **state,
        "bed_decision":    decision,
        "assigned_bed":    assigned_bed,
        "errors":          current_errors,
        "completed_nodes": [*state.get("completed_nodes", []), "BedAllocationAgent"],
    }
