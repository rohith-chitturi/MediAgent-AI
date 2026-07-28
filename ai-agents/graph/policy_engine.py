from typing import Optional, Dict, Any
from graph.state import HospitalState

class ApprovalPolicyEngine:
    @staticmethod
    def evaluate(state: HospitalState) -> Optional[Dict[str, Any]]:
        """
        Evaluates the current state to determine if human approval is required.
        Returns a dict with 'approval_type' and 'reason' if required, else None.
        """
        # Policy 1: Critical ICU Allocation
        priority = state.get("assigned_priority")
        if priority == "CRITICAL":
            return {
                "approval_type": "ICU_ALLOCATION",
                "reason": "CRITICAL priority patient requires Head Doctor or Admin approval for ICU allocation."
            }
        
        # Policy 2: Doctor Override (if implemented)
        # If the doctor requested a manual override, require approval
        if state.get("event_type") == "doctor.override_request":
            return {
                "approval_type": "DOCTOR_OVERRIDE",
                "reason": "Manual workflow override requested by doctor."
            }

        # Policy 3: Resource threshold triggers (e.g. Blood Bank, High-value purchase)
        resource_trigger = state.get("resource_trigger")
        if resource_trigger == "critical_shortage_alert":
            return {
                "approval_type": "RESOURCE_PURCHASE",
                "reason": "Critical resource shortage requires Admin approval for emergency purchase."
            }

        return None
