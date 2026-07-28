# MediAgent AI 🏥🤖

> **Enterprise Autonomous Multi-Agent Hospital Operations Platform**

[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge&logo=github)](https://github.com/rohith-chitturi/MediAgent-AI)
[![Architecture](https://img.shields.io/badge/Architecture-Event--Driven-blue?style=for-the-badge&logo=diagrams.net)](./ARCHITECTURE.md)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-orange?style=for-the-badge)](https://github.com/rohith-chitturi/MediAgent-AI/pulls)

MediAgent AI is a startup-grade, autonomous hospital operations platform powered by **LangGraph multi-agent state machines**, **Google Gemini 1.5 Pro**, **pgvector shared semantic memory**, **Vapi Voice AI telephony**, and real-time event orchestration.

Unlike conventional CRUD Hospital Management Systems, MediAgent AI deploys a network of specialized autonomous AI agents that collaborate to manage patient triage, bed allocation, doctor assignments, resource monitoring, voice check-ins, predictive operational forecasting, and human-in-the-loop approvals.

---

## 🌟 Key Platform Features & Modules

| Module | Architectural Highlights | Status |
| :--- | :--- | :---: |
| 🏢 **Multi-Tenant SaaS Foundation** | Multi-hospital data isolation, JWT authentication, RBAC policy engine. | ✅ **Production** |
| ⚡ **Real-Time Event Architecture** | Redis Pub/Sub event bus + Socket.IO live dashboard streaming. | ✅ **Production** |
| 🤖 **LangGraph Multi-Agent Engine** | Autonomous state machine workflows (`TriageAgent`, `BedAllocationAgent`, `DoctorAssignAgent`, `ResourceAgent`, `NotificationAgent`). | ✅ **Production** |
| 🛡️ **Human-in-the-Loop (HITL)** | Enterprise safety policy engine with `PostgresSaver`, doctor approval queues, versioning & feedback tracking. | ✅ **Production** |
| 📞 **Voice AI Agent (Vapi.ai)** | Autonomous outbound patient calls, retry policies (5m/30m), Gemini transcript sentiment analysis & emergency escalation. | ✅ **Production** |
| 🧠 **Shared Agent Memory (pgvector)** | 768-dimensional Gemini `text-embedding-004` vector search with hybrid scoring formula. | ✅ **Production** |
| 🔮 **Predictive Operational Analytics** | Scheduled 15-minute telemetry sweeps, 24h ICU risk forecasting, resource stockout countdowns & patient surge prediction. | ✅ **Production** |
| 🔒 **Audit & Governance Compliance** | Tamper-resistant append-only logging, Correlation ID tracing (`RUN-2026-X`), AI explainability & CSV export reporting. | ✅ **Production** |

---

## 🛠️ Technology Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                       MediAgent AI Stack                        │
├───────────────────┬─────────────────────────────────────────────┤
│ Frontend          │ React 18, Vite, Lucide Icons, Recharts,     │
│                   │ Socket.IO Client, TanStack Query            │
├───────────────────┼─────────────────────────────────────────────┤
│ Core Backend      │ Node.js, Express, Prisma ORM, JSON Web Tokens│
├───────────────────┼─────────────────────────────────────────────┤
│ AI Agent Engine   │ Python 3.11, FastAPI, LangGraph, LangChain, │
│                   │ Google Gemini 1.5 Pro & text-embedding-004 │
├───────────────────┼─────────────────────────────────────────────┤
│ Databases         │ PostgreSQL (Neon with pgvector), Redis 7    │
├───────────────────┼─────────────────────────────────────────────┤
│ Voice AI          │ Vapi REST API & Webhooks, Twilio Telephony  │
├───────────────────┼─────────────────────────────────────────────┤
│ DevOps            │ Docker, Docker Compose, GitHub Actions      │
└───────────────────┴─────────────────────────────────────────────┘
```

---

## 🎬 End-to-End Demo Scenarios

### 📍 Demo 1: Autonomous Patient Admission & Human-in-the-Loop Approval
1. **Intake**: Patient arrives with acute chest pain symptoms via React Command Center.
2. **TriageAgent**: Generates **CRITICAL (Level 1)** triage score, recommends ICU bed & Cardiology specialist.
3. **HITL Intercept**: Triggers policy threshold `TRIAGE_HIGH_RISK_INTERCEPT` requiring human verification.
4. **Doctor Review**: Attending physician reviews decision in **Approval Queue** drawer and approves.
5. **Auto-Allocation**: `BedAllocationAgent` assigns Bed #ICU-04 and `DoctorAssignAgent` routes case to Dr. Sarah.
6. **Notification**: Emits live Socket.IO update to Command Center.

### 📍 Demo 2: Post-Discharge Voice AI & Symptom Escalation
1. **Trigger Event**: Patient discharge workflow completes (`appointment.upcoming` or `discharge.followup`).
2. **VoiceAgent**: Initiates autonomous outbound call via Vapi REST API to patient.
3. **Patient Interaction**: Patient reports `"I am having mild shortness of breath and forgot to take my blood thinner."`
4. **Gemini Transcript Analysis**: Analyzes call transcript, detects **HIGH RISK** sentiment and medication non-compliance.
5. **Emergency Action**: Automatically logs call transcript, alerts doctor dashboard, and books an emergency follow-up appointment.

### 📍 Demo 3: Predictive Analytics & Resource Depletion Alert
1. **Telemetry Sweep**: Scheduled background cron job executes 15-minute telemetry sweep across hospital data.
2. **AI Forecast**: `PredictiveAnalyticsAgent` calculates 24h ICU occupancy risk at **88.5%** and identifies **Oxygen Cylinder stockout in ~14 hours**.
3. **Dashboard Briefing**: Real-time Socket.IO event updates **Predictive AI Dashboard**.
4. **Mitigation**: Displays actionable AI recommendations and emergency restock trigger.

### 📍 Demo 4: Governance Audit & Correlation ID Tracing
1. **Audit Query**: Compliance officer navigates to `/compliance`.
2. **Correlation Search**: Searches by Correlation ID `RUN-2026-000124`.
3. **Traceability**: Replays full timeline: `Patient Intake` ➔ `Triage Decision` ➔ `Doctor Approval` ➔ `Voice Call` ➔ `Predictive Update`.
4. **CSV Export**: Clicks **Export CSV** button to download full HIPAA audit trail report.

---

## 🚀 Quickstart & Installation

### Option 1: Local Development Setup

#### Prerequisites
- Node.js v18+
- Python 3.11+
- PostgreSQL database (Neon or local with `pgvector`)
- Redis instance

#### 1. Clone & Install Dependencies
```bash
git clone https://github.com/rohith-chitturi/MediAgent-AI.git
cd MediAgent-AI

# Install Backend
cd backend && npm install

# Install Frontend
cd ../frontend && npm install

# Install Python AI Service
cd ../ai-agents && pip install -r requirements.txt
```

#### 2. Environment Configuration
Create `.env` file in root and configure credentials:
```env
# Core Backend
PORT=5000
DATABASE_URL=postgresql://user:pass@localhost:5432/mediagent_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_key

# AI Agent Service
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-1.5-pro
AI_AGENT_API_KEY=internal-agent-secret

# Voice AI
VAPI_API_KEY=your_vapi_private_key
VAPI_PHONE_NUMBER_ID=your_vapi_phone_number_id
```

#### 3. Database Migration & Seed
```bash
cd backend
npx prisma db push
node prisma/seed.js
```

#### 4. Run Services
```bash
# Terminal 1: Core Node Backend
cd backend && npm run dev

# Terminal 2: Python AI Service
cd ai-agents && py -3.11 -m uvicorn main:app --reload --port 8000

# Terminal 3: React Frontend
cd frontend && npm run dev
```
Access UI at `http://localhost:5173`.

#### 🔑 Demo Login Credentials
- **Super Admin**: `superadmin@mediagent.ai` / `password123`
- **Hospital Admin**: `admin@cityhospital.com` / `password123`
- **Doctor**: `dr.sharma@cityhospital.com` / `password123`
- **Receptionist**: `reception@cityhospital.com` / `password123`

---

### Option 2: Docker Compose Setup

Launch the entire stack with a single command:
```bash
docker-compose up --build
```

---

## 📖 Architecture & System Design Documentation

For in-depth sequence diagrams, graph state machine specifications, ER diagrams, and scoring formulas, read **[ARCHITECTURE.md](./ARCHITECTURE.md)**.

---

## 📄 Resume & Interview Pitch Summary

> **MediAgent AI – Enterprise Multi-Agent Hospital Operations Platform**
> *Built a production-grade autonomous hospital operations platform using LangGraph, FastAPI, Node.js, React, PostgreSQL (`pgvector`), Redis, Google Gemini AI, and Vapi Voice Telephony. Implemented event-driven multi-agent orchestration, Human-in-the-Loop approvals, shared semantic memory, 24h predictive analytics, voice AI follow-ups, and HIPAA-style governance compliance with correlation ID tracing.*

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
