"""
ResourceAgent — Pure logic. Fires ONLY on specific triggers.
NOT called on every patient registration.
"""
import logging
from graph.state import HospitalState, AgentDecision, ConfidenceLevel
from services.backend_client import api_get, api_post

logger = logging.getLogger("mediagent.resource_agent")

BED_TYPE_CRITICAL_RESOURCES = {
    "ICU":       ["OXYGEN", "VENTILATOR"],
    "EMERGENCY": ["OXYGEN", "BLOOD"],
    "GENERAL":   ["MEDICINE"],
}


async def resource_agent(state: HospitalState) -> HospitalState:
    run_uuid     = state["run_id"]
    display_id   = state.get("display_run_id", run_uuid)
    hospital_id  = state["hospital_id"]
    trigger      = state.get("resource_trigger") or "bed_assigned"
    assigned_bed = state.get("assigned_bed")
    current_errors = list(state.get("errors", []))

    logger.info(f"[{display_id}] ResourceAgent → trigger={trigger}")

    # ── 1. Fetch low-stock resources ──────────────────────────────
    try:
        resp = await api_get("/api/internal/resources/low-stock", params={"hospitalId": hospital_id})
        data = resp.get("data", resp)
        low_resources = data.get("data", data) if isinstance(data, dict) else data
        if not isinstance(low_resources, list):
            low_resources = []
    except Exception as e:
        logger.error(f"[{display_id}] ResourceAgent: failed to fetch resources: {e}")
        current_errors.append(f"ResourceAgent: {e}")
        return {
            **state,
            "errors":          current_errors,
            "completed_nodes": [*state.get("completed_nodes", []), "ResourceAgent"],
        }

    # ── 2. Filter by bed type relevance ──────────────────────────
    if trigger == "bed_assigned" and assigned_bed:
        bed_type = assigned_bed.get("type", "GENERAL")
        critical_types = BED_TYPE_CRITICAL_RESOURCES.get(bed_type, ["MEDICINE"])
        relevant_low = [r for r in low_resources if r.get("type") in critical_types]
    else:
        relevant_low = low_resources

    # ── 3. Classify severity ──────────────────────────────────────
    critical_items = [r for r in relevant_low if r.get("quantity", 0) <= (r.get("threshold", 0) // 2)]
    warning_items  = [r for r in relevant_low if r not in critical_items]

    if not relevant_low:
        decision_summary = "All monitored resources are at adequate levels."
        confidence       = ConfidenceLevel.HIGH
        recommended      = "No immediate restocking required."
    else:
        parts = []
        if critical_items:
            names = ", ".join(r["name"] for r in critical_items)
            parts.append(f"CRITICAL shortage: {names}")
        if warning_items:
            names = ", ".join(r["name"] for r in warning_items)
            parts.append(f"Low stock warning: {names}")
        decision_summary = ". ".join(parts) + "."
        confidence       = ConfidenceLevel.LOW if critical_items else ConfidenceLevel.MEDIUM
        recommended      = "Initiate emergency restock for critical items immediately."

    decision: AgentDecision = {
        "decision_summary":   decision_summary,
        "confidence_level":   confidence.value,
        "recommended_action": recommended,
    }

    # ── 4. Log AgentAction ────────────────────────────────────────
    try:
        await api_post("/api/internal/agent-action", {
            "hospitalId":        hospital_id,
            "runId":             display_id,
            "agentRunId":        run_uuid,
            "agentName":         "ResourceAgent",
            "actionType":        "RESOURCE_CHECK",
            "targetType":        "RESOURCE",
            "targetId":          None,
            "decisionSummary":   decision["decision_summary"],
            "confidenceLevel":   decision["confidence_level"],
            "recommendedAction": decision["recommended_action"],
            "status":            "COMPLETED",
        })
    except Exception as e:
        logger.error(f"[{display_id}] Failed to log ResourceAgent action: {e}")

    return {
        **state,
        "resource_decision": decision,
        "resource_alerts":   [r["name"] for r in critical_items],
        "errors":            current_errors,
        "completed_nodes":   [*state.get("completed_nodes", []), "ResourceAgent"],
    }
