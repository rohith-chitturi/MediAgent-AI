"""
DischargeAgent — Generates post-care instructions when a patient is discharged.

Responsibilities:
  1. Analyze patient symptoms and history.
  2. Generate a discharge summary and post-care instructions.
  3. Log AgentAction.
"""
import logging
import json
from typing import Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage

from graph.state import HospitalState, AgentDecision, ConfidenceLevel
from services.backend_client import api_post
from config.settings import settings

logger = logging.getLogger("mediagent.discharge_agent")

SYSTEM_PROMPT = """You are a senior attending physician AI for MediAgent hospital system.
The patient is being discharged. Analyze their information and return ONLY a valid JSON object with these fields:
{
  "postCareInstructions": "<concise 2-3 sentence post-care instructions>",
  "followUp": "<1 concise sentence about when/if to follow up>",
  "confidence": <float 0.0-1.0>
}

Return ONLY the JSON. No markdown, no explanation, no code blocks."""


def _mock_discharge(symptoms: str) -> dict:
    return {
        "postCareInstructions": "Rest, stay hydrated, and monitor symptoms. Take prescribed medications as directed.",
        "followUp": "Follow up with primary care in 1 week if symptoms do not improve.",
        "confidence": 0.90
    }


async def discharge_agent(state: HospitalState) -> HospitalState:
    patient      = state.get("patient")
    if not patient:
        return state
    
    run_uuid     = state["run_id"]
    display_id   = state.get("display_run_id", run_uuid)
    hospital_id  = state["hospital_id"]

    logger.info(f"[{display_id}] DischargeAgent → patient={patient['id']}")

    # ── 1. Call Gemini (or mock) ─────────────────────────────────
    result: Optional[dict] = None

    if settings.GEMINI_API_KEY:
        try:
            llm = ChatGoogleGenerativeAI(
                model=settings.GEMINI_MODEL,
                google_api_key=settings.GEMINI_API_KEY,
                temperature=0.2,
            )
            msgs = [
                SystemMessage(content=SYSTEM_PROMPT),
                HumanMessage(content=(
                    f"Patient: {patient['name']}, Age: {patient['age']}, "
                    f"Gender: {patient['gender']}\n"
                    f"Symptoms/Reason for visit: {patient['symptoms']}"
                )),
            ]
            response = await llm.ainvoke(msgs)
            raw = response.content
            if isinstance(raw, list):
                raw = raw[0].get("text", "") if isinstance(raw[0], dict) else raw[0]
            if isinstance(raw, str):
                raw = raw.strip()
                if raw.startswith("```"):
                    raw = raw.split("```")[1]
                    if raw.startswith("json"):
                        raw = raw[4:]
                result = json.loads(raw.strip())
            else:
                result = None
            if result:
                logger.info(f"[{display_id}] Gemini → discharge summary generated")
        except Exception as e:
            logger.warning(f"[{display_id}] Gemini call failed ({e}), falling back to mock")
            result = None

    if result is None:
        result = _mock_discharge(patient["symptoms"])
        logger.info(f"[{display_id}] Mock discharge generated")

    # ── 2. Build structured decision ─────────────────────────────
    confidence = ConfidenceLevel.from_score(result.get("confidence", 0.90))
    decision: AgentDecision = {
        "decision_summary": f"Discharge Summary generated. {result['postCareInstructions']}",
        "confidence_level": confidence.value,
        "recommended_action": result["followUp"],
    }

    # ── 3. Persist AgentAction ────────────────────────────────────
    try:
        await api_post("/api/internal/agent-action", {
            "hospitalId":        hospital_id,
            "runId":             display_id,
            "agentRunId":        run_uuid,
            "agentName":         "DischargeAgent",
            "actionType":        "DISCHARGE_SUMMARY",
            "targetType":        "PATIENT",
            "targetId":          patient["id"],
            "decisionSummary":   decision["decision_summary"],
            "confidenceLevel":   decision["confidence_level"],
            "recommendedAction": decision["recommended_action"],
            "status":            "COMPLETED",
        })
    except Exception as e:
        logger.error(f"[{display_id}] Failed to log DischargeAgent action: {e}")

    return {
        **state,
        "discharge_decision": decision,
        "completed_nodes":    [*state.get("completed_nodes", []), "DischargeAgent"],
    }
