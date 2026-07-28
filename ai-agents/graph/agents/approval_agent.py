import logging
from typing import Any, Dict
from graph.state import HospitalState, AgentDecision
from services.backend_client import api_post

logger = logging.getLogger("mediagent.approval_agent")


async def approval_agent(state: HospitalState) -> HospitalState:
    """
    This node is executed IMMEDIATELY AFTER the human approval is received.
    The graph was paused via interrupt_before=["approval"].
    When resumed, the state.approval_context contains the manual review.
    """
    run_uuid    = state["run_id"]
    display_id  = state.get("display_run_id", run_uuid)
    hospital_id = state["hospital_id"]
    
    ctx = state.get("approval_context", {})
    action = ctx.get("action", "APPROVE")
    comment = ctx.get("comment", "")
    user_id = ctx.get("userId", "system")

    logger.info(f"[{display_id}] ApprovalAgent → action={action}, user={user_id}")

    # Track decision versioning
    versions = state.get("decision_versions", [])
    
    # Let's say this was a triage decision (ICU allocation)
    triage_dec = state.get("triage_decision")
    
    # Store original AI decision if not already tracked
    if triage_dec and not any(v.get("version") == 1 for v in versions):
        triage_dec["version"] = 1
        versions.append(triage_dec)

    if action == "REJECT":
        # Human overrode the AI. We create a Version 2 decision.
        override_config = ctx.get("overrideConfig", {})
        
        # Example override: Changing priority or department manually
        if "priority" in override_config:
            state["assigned_priority"] = override_config["priority"]
        if "department" in override_config:
            state["assigned_department"] = override_config["department"]
            
        new_dec: AgentDecision = {
            "decision_summary": f"AI recommendation rejected by human. Reason: {comment}",
            "confidence_level": "HIGH", # Human confidence
            "recommended_action": f"Manual Override: {override_config}",
            "version": 2,
            "parent_action_id": None # Normally you'd pass the real Action ID here for tracing
        }
        
        state["triage_decision"] = new_dec
        versions.append(new_dec)
        
        # We also want to record this feedback into AgentMemory (Future task)
        # For now, we fire a specialized event that feedback was received
        try:
            await api_post("/api/internal/agent-action", {
                "hospitalId":        hospital_id,
                "runId":             display_id,
                "agentRunId":        run_uuid,
                "agentName":         "HumanFeedback",
                "actionType":        "FEEDBACK_LOGGED",
                "targetType":        "SYSTEM",
                "decisionSummary":   f"Doctor rejected AI recommendation: {comment}",
                "confidenceLevel":   "HIGH",
                "status":            "COMPLETED"
            })
        except Exception as e:
            logger.error(f"[{display_id}] Failed to log Human Feedback action: {e}")

    elif action == "APPROVE":
        # Just log that it was approved
        new_dec: AgentDecision = {
            "decision_summary": f"AI recommendation approved by human: {comment}",
            "confidence_level": "HIGH",
            "recommended_action": "Proceed with AI plan",
            "version": 2,
            "parent_action_id": None
        }
        versions.append(new_dec)

    return {
        **state,
        "decision_versions": versions,
        "approval_required": False,  # Reset
        "completed_nodes":   [*state.get("completed_nodes", []), "ApprovalAgent"],
    }
