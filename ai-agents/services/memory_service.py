"""
Shared Agent Memory Service (Enterprise Knowledge Layer)
Powered by Hybrid Vector Search + Metadata Filtering + Recency Weighting.
"""
import logging
import math
import time
from typing import List, Dict, Any, Optional
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from config.settings import settings
from services.backend_client import api_post, api_get

logger = logging.getLogger("mediagent.memory_service")

# Memory Categories
CATEGORIES = [
    "PATIENT_HISTORY",
    "CLINICAL_DECISION",
    "VOICE_CONVERSATION",
    "DOCTOR_ASSIGNMENT",
    "RESOURCE_EVENT",
    "HUMAN_OVERRIDE",
    "AI_FEEDBACK",
    "WORKFLOW_OUTCOME"
]

def generate_embedding(text: str) -> List[float]:
    """Generates a 768-dim normalized embedding using Gemini or deterministic fallback"""
    if settings.GEMINI_API_KEY and text:
        try:
            embeddings_model = GoogleGenerativeAIEmbeddings(
                model="models/text-embedding-004",
                google_api_key=settings.GEMINI_API_KEY
            )
            vec = embeddings_model.embed_query(text)
            if vec and len(vec) > 0:
                return vec
        except Exception as e:
            logger.warning(f"Gemini embedding generation failed ({e}), using fallback vector.")

    # Fallback deterministic 64-dim normalized vector
    dim = 64
    vec = [0.0] * dim
    words = text.lower().split()
    for word in words:
        h = hash(word)
        vec[abs(h) % dim] += 1.0
    norm = math.sqrt(sum(x * x for x in vec)) or 1.0
    return [round(x / norm, 5) for x in vec]

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.5
    dot = sum(a * b for a, b in zip(v1, v2))
    n1 = math.sqrt(sum(a * a for a in v1))
    n2 = math.sqrt(sum(b * b for b in v2))
    if n1 == 0 or n2 == 0:
        return 0.0
    return max(0.0, min(1.0, dot / (n1 * n2)))

async def store_memory(
    hospital_id: str,
    agent_name: str,
    memory_category: str,
    summary: str,
    metadata: Dict[str, Any] = None,
    patient_id: Optional[str] = None,
    source_workflow: Optional[str] = None,
    importance_score: float = 0.5,
    confidence: float = 0.9
) -> Dict[str, Any]:
    """Stores structured memory with embeddings into pgvector DB layer"""
    if metadata is None:
        metadata = {}

    vector_data = generate_embedding(summary)

    payload = {
        "hospitalId": hospital_id,
        "patientId": patient_id,
        "agentName": agent_name,
        "memoryCategory": memory_category,
        "sourceWorkflow": source_workflow,
        "summary": summary,
        "metadata": metadata,
        "vectorData": vector_data,
        "importanceScore": importance_score,
        "confidence": confidence
    }

    try:
        res = await api_post("/api/internal/agent-memory", payload)
        logger.info(f"🧠 Memory stored [{memory_category}] for Agent={agent_name}, Patient={patient_id}")
        return res.get("data", {})
    except Exception as e:
        logger.error(f"Failed to store memory: {e}")
        return {}

async def retrieve_memories(
    hospital_id: str,
    query: str,
    memory_category: Optional[str] = None,
    patient_id: Optional[str] = None,
    top_k: int = 5
) -> List[Dict[str, Any]]:
    """
    Hybrid Search Strategy:
    Score = (Semantic Similarity * 0.45) + (Importance * 0.25) + (Recency * 0.20) + (Confidence * 0.10)
    """
    query_vector = generate_embedding(query)

    try:
        res = await api_post("/api/internal/agent-memory/query", {
            "hospitalId": hospital_id,
            "patientId": patient_id,
            "memoryCategory": memory_category,
            "limit": 50
        })

        memories = res.get("data", [])
        if not memories:
            return []

        now_ms = time.time() * 1000
        scored_memories = []

        for mem in memories:
            mem_vector = mem.get("vectorData", [])
            sim = cosine_similarity(query_vector, mem_vector)
            
            importance = mem.get("importanceScore", 0.5)
            confidence = mem.get("confidence", 0.9)

            # Recency weighting (decay over 30 days)
            created_at_ms = time.mktime(time.strptime(mem["createdAt"][:19], "%Y-%m-%dT%H:%M:%S")) * 1000 if "createdAt" in mem else now_ms
            age_days = (now_ms - created_at_ms) / (1000 * 60 * 60 * 24)
            recency_weight = max(0.1, 1.0 - (age_days / 30.0))

            final_score = (sim * 0.45) + (importance * 0.25) + (recency_weight * 0.20) + (confidence * 0.10)

            scored_memories.append({
                **mem,
                "score": round(final_score, 4),
                "similarity": round(sim, 4)
            })

        # Sort by final score descending
        scored_memories.sort(key=lambda x: x["score"], reverse=True)
        top_results = scored_memories[:top_k]

        # Asynchronously update retrieval statistics in background
        for mem in top_results:
            try:
                await api_post(f"/api/internal/agent-memory/{mem['id']}/touch", {})
            except Exception:
                pass

        logger.info(f"🔍 Retrieved {len(top_results)} memories for query='{query[:30]}...'")
        return top_results
    except Exception as e:
        logger.error(f"Failed to retrieve memories: {e}")
        return []
