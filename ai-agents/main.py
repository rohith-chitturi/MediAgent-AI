"""
MediAgent AI — Python FastAPI Service
Autonomous Hospital Agent Orchestration (LangGraph + Gemini)
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from config.settings import settings
from routers.agent_router import router as agent_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("mediagent")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🤖  MediAgent AI Agent Service starting...")
    logger.info(f"🌐  Backend API  : {settings.BACKEND_API_URL}")
    logger.info(f"🧠  LLM mode     : {'Gemini (' + settings.GEMINI_MODEL + ')' if settings.GEMINI_API_KEY else 'MOCK (no GEMINI_API_KEY set)'}")
    logger.info(f"🎙️  Vapi         : {'configured' if settings.VAPI_API_KEY else 'not configured'}")
    logger.info("✅  Agents ready : TriageAgent | BedAllocationAgent | DoctorAssignAgent | ResourceAgent | NotificationAgent")
    yield
    logger.info("🛑  MediAgent AI Agent Service shutting down...")


app = FastAPI(
    title="MediAgent AI — Agent Service",
    description="Autonomous multi-agent hospital coordination powered by LangGraph + Gemini",
    version="3.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.BACKEND_API_URL, "http://localhost:5000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────
app.include_router(agent_router, prefix="/agents", tags=["Agents"])


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "MediAgent AI Agent Service",
        "version": "3.0.0",
        "llm": "gemini" if settings.GEMINI_API_KEY else "mock",
        "agents": [
            "TriageAgent", "BedAllocationAgent", "DoctorAssignAgent",
            "ResourceAgent", "NotificationAgent",
        ],
    }


@app.get("/")
async def root():
    return {"message": "MediAgent AI Agent Service v3.0 running. See /docs for API."}
