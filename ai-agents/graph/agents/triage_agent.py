"""
TriageAgent — ONLY agent that calls Gemini.

Responsibilities:
  1. Assess patient symptoms
  2. Determine: priority, department, recommendedAction (single LLM call)
  3. Log AgentAction with Run ID
  4. PATCH /api/internal/patients/:id to update priority + triageNotes
"""
import logging
import json
from typing import Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage

from graph.state import HospitalState, AgentDecision, ConfidenceLevel
from services.backend_client import api_post, api_patch
from config.settings import settings

logger = logging.getLogger("mediagent.triage_agent")

DEPARTMENTS = [
    "Cardiology", "Emergency", "General Medicine", "Neurology",
    "Orthopedics", "Pediatrics", "Psychiatry", "Pulmonology",
    "Oncology", "Gastroenterology", "Nephrology", "ICU",
]

SYSTEM_PROMPT = """You are a senior triage physician AI for MediAgent hospital system.
Analyze the patient's symptoms and return ONLY a valid JSON object with these fields:
{
  "priority": "<CRITICAL|HIGH|MEDIUM|LOW>",
  "department": "<department name from the list>",
  "recommendedAction": "<1 concise sentence describing immediate next step>",
  "confidence": <float 0.0-1.0>,
  "triageNotes": "<brief clinical reasoning in 1-2 sentences>"
}

Priority definitions:
- CRITICAL: Immediate life threat (chest pain, stroke, severe bleeding, unconscious)
- HIGH: Urgent but not immediately life-threatening (high fever, severe pain, fracture)
- MEDIUM: Needs attention within hours (moderate symptoms, infections)
- LOW: Non-urgent (minor injuries, routine issues)

Available departments: """ + ", ".join(DEPARTMENTS) + """

Return ONLY the JSON. No markdown, no explanation, no code blocks."""


def _mock_triage(symptoms: str, age: int) -> dict:
    """Deterministic mock when no Gemini key configured."""
    s = symptoms.lower()
    if any(w in s for w in ["chest", "heart", "cardiac", "attack"]):
        return {"priority": "CRITICAL", "department": "Cardiology",
                "recommendedAction": "Immediate ECG and cardiac evaluation required.",
                "confidence": 0.93, "triageNotes": "Symptoms indicate possible cardiac event."}
    if any(w in s for w in ["stroke", "paralysis", "unconscious", "seizure"]):
        return {"priority": "CRITICAL", "department": "Neurology",
                "recommendedAction": "Immediate neurological assessment and CT scan.",
                "confidence": 0.91, "triageNotes": "Neurological emergency signs present."}
    if any(w in s for w in ["breath", "oxygen", "asthma", "lung"]):
        return {"priority": "HIGH", "department": "Pulmonology",
                "recommendedAction": "Administer oxygen and perform spirometry.",
                "confidence": 0.87, "triageNotes": "Respiratory distress requires urgent evaluation."}
    if any(w in s for w in ["fever", "temperature", "infection"]):
        return {"priority": "HIGH", "department": "General Medicine",
                "recommendedAction": "Blood cultures and broad-spectrum antibiotics.",
                "confidence": 0.82, "triageNotes": "Infectious process suspected."}
    if any(w in s for w in ["fracture", "bone", "fall", "joint"]):
        return {"priority": "HIGH", "department": "Orthopedics",
                "recommendedAction": "X-ray and orthopedic consult.",
                "confidence": 0.85, "triageNotes": "Musculoskeletal injury evaluation needed."}
    if age < 12:
        return {"priority": "MEDIUM", "department": "Pediatrics",
                "recommendedAction": "Pediatric assessment and monitoring.",
                "confidence": 0.78, "triageNotes": "Pediatric case requiring age-appropriate care."}
    return {"priority": "MEDIUM", "department": "General Medicine",
            "recommendedAction": "Clinical examination and routine workup.",
            "confidence": 0.72, "triageNotes": "General evaluation required."}


async def triage_agent(state: HospitalState) -> HospitalState:
    patient      = state["patient"]
    run_uuid     = state["run_id"]          # UUID — FK for DB
    display_id   = state.get("display_run_id", run_uuid)   # RUN-2026-XXXX for logs
    hospital_id  = state["hospital_id"]

    logger.info(f"[{display_id}] TriageAgent → patient={patient['id']} symptoms={patient['symptoms'][:60]}")

    # ── 1. Call Gemini (or mock) ─────────────────────────────────
    triage_result: Optional[dict] = None

    if settings.GEMINI_API_KEY:
        try:
            llm = ChatGoogleGenerativeAI(
                model=settings.GEMINI_MODEL,
                google_api_key=settings.GEMINI_API_KEY,
                temperature=0.1,
            )
            msgs = [
                SystemMessage(content=SYSTEM_PROMPT),
                HumanMessage(content=(
                    f"Patient: {patient['name']}, Age: {patient['age']}, "
                    f"Gender: {patient['gender']}\n"
                    f"Symptoms: {patient['symptoms']}"
                )),
            ]
            response = await llm.ainvoke(msgs)
            raw = response.content.strip()
            # Strip markdown code blocks if model wraps output
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            triage_result = json.loads(raw.strip())
            logger.info(f"[{display_id}] Gemini → priority={triage_result.get('priority')} dept={triage_result.get('department')}")
        except Exception as e:
            logger.warning(f"[{display_id}] Gemini call failed ({e}), falling back to mock")
            triage_result = None

    if triage_result is None:
        triage_result = _mock_triage(patient["symptoms"], patient["age"])
        logger.info(f"[{display_id}] Mock triage → priority={triage_result['priority']} dept={triage_result['department']}")

    # ── 2. Build structured decision ─────────────────────────────
    confidence = ConfidenceLevel.from_score(triage_result.get("confidence", 0.75))
    decision: AgentDecision = {
        "decision_summary": (
            f"Priority assigned as {triage_result['priority']}. "
            f"Department: {triage_result['department']}. "
            f"{triage_result.get('triageNotes', '')}"
        ),
        "confidence_level":   confidence.value,
        "recommended_action": triage_result["recommendedAction"],
    }

    # ── 3. Persist AgentAction ────────────────────────────────────
    try:
        await api_post("/api/internal/agent-action", {
            "hospitalId":        hospital_id,
            "runId":             display_id,   # human-facing display ID
            "agentRunId":        run_uuid,     # UUID FK
            "agentName":         "TriageAgent",
            "actionType":        "TRIAGE",
            "targetType":        "PATIENT",
            "targetId":          patient["id"],
            "decisionSummary":   decision["decision_summary"],
            "confidenceLevel":   decision["confidence_level"],
            "recommendedAction": decision["recommended_action"],
            "status":            "COMPLETED",
        })
    except Exception as e:
        logger.error(f"[{display_id}] Failed to log TriageAgent action: {e}")

    # ── 4. Update patient priority + triageNotes ─────────────────
    update_errors = list(state.get("errors", []))
    try:
        await api_patch(f"/api/internal/patients/{patient['id']}", {
            "priority":    triage_result["priority"],
            "triageNotes": triage_result.get("triageNotes", ""),
            "status":      "TRIAGED",
        })
    except Exception as e:
        logger.error(f"[{display_id}] Failed to update patient: {e}")
        update_errors.append(f"TriageAgent: {str(e)}")

    return {
        **state,
        "triage_decision":    decision,
        "assigned_department": triage_result["department"],
        "assigned_priority":  triage_result["priority"],
        "errors":             update_errors,
        "completed_nodes":    [*state.get("completed_nodes", []), "TriageAgent"],
    }
