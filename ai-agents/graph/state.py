from enum import Enum
from typing import Optional, List, Any, Dict
from typing_extensions import TypedDict


class ConfidenceLevel(str, Enum):
    """Human-readable confidence tier. Raw LLM scores are never stored."""
    HIGH   = "HIGH"
    MEDIUM = "MEDIUM"
    LOW    = "LOW"

    @staticmethod
    def from_score(score: float) -> "ConfidenceLevel":
        if score >= 0.85:
            return ConfidenceLevel.HIGH
        if score >= 0.60:
            return ConfidenceLevel.MEDIUM
        return ConfidenceLevel.LOW


class AgentDecision(TypedDict, total=False):
    """
    Standard structured output contract for every agent node.
    Raw LLM chain-of-thought is processed internally and NEVER stored.
    """
    decision_summary:   str             # Plain-English admin-friendly summary
    confidence_level:   str             # ConfidenceLevel enum value
    recommended_action: str             # Concrete next step
    version:            Optional[int]   # Version of the decision (e.g. 1 for AI, 2 for manual override)
    parent_action_id:   Optional[str]   # For tracing override history


class PatientContext(TypedDict, total=False):
    id:               str
    name:             str
    age:              int
    gender:           str
    symptoms:         str
    priority:         Optional[str]
    status:           str
    hospital_id:      str


class ResourceContext(TypedDict, total=False):
    id:          str
    name:        str
    type:        str
    quantity:    int
    threshold:   int
    unit:        str
    hospital_id: str


class HospitalState(TypedDict, total=False):
    """
    LangGraph shared state passed between all agent nodes.
    Every field is Optional so nodes can be run independently.
    """
    # ── Run tracking ─────────────────────────────────────────────
    run_id:         str          # UUID — true primary key for AgentRun
    display_run_id: str          # e.g. "RUN-2026-0001" — shown on dashboard
    event_type:     str
    hospital_id:    str
    patient:        Optional[PatientContext]
    resource:       Optional[ResourceContext]
    resource_trigger: Optional[str]   # "bed_assigned" | "resource_updated" | "scheduled"

    # ── Derived triage outputs (carried forward to other agents) ──
    assigned_priority:   Optional[str]   # CRITICAL | HIGH | MEDIUM | LOW
    assigned_department: Optional[str]   # e.g. "Cardiology"
    assigned_bed:        Optional[Dict[str, Any]]
    assigned_doctor:     Optional[Dict[str, Any]]

    # ── Structured agent decisions (never raw LLM traces) ────────
    triage_decision:       Optional[AgentDecision]
    bed_decision:          Optional[AgentDecision]
    doctor_decision:       Optional[AgentDecision]
    resource_decision:     Optional[AgentDecision]
    discharge_decision:    Optional[AgentDecision]
    notification_decision: Optional[AgentDecision]
    
    # ── Version History for Audit ────────────────────────────────
    decision_versions:     List[AgentDecision]

    # ── Approvals & Interrupts ───────────────────────────────────
    approval_requests:     List[Dict[str, Any]] # Stores pending/resolved approval data
    approval_required:     Optional[bool]
    approval_reason:       Optional[str]
    approval_type:         Optional[str]
    approval_context:      Optional[Dict[str, Any]] # Manual override inputs (e.g. action, comment, new decisions)

    # ── Notifications & calls ────────────────────────────────────
    notifications_sent: List[Dict[str, Any]]
    calls_initiated:    List[Dict[str, Any]]
    resource_alerts:    List[Dict[str, Any]]

    # ── Manager state ─────────────────────────────────────────────
    insights:        Optional[str]   # Gemini AI Insights for dashboard
    errors:          List[str]       # Non-fatal agent errors
    completed_nodes: List[str]       # Graph routing tracker
