# MediAgent AI — System Architecture & Technical Design

This document details the high-level architecture, multi-agent workflows, data models, event orchestration, and security mechanisms powering **MediAgent AI**, an enterprise-grade autonomous hospital operations platform.

---

## 🏢 System Architecture Overview

MediAgent AI utilizes an **Event-Driven Microservices Architecture** split into four core runtime layers:
1. **Frontend Command Center**: React SPA (Vite) with real-time Socket.IO subscriptions and dynamic dashboards.
2. **Node.js Core Backend**: Express REST API, Prisma ORM, JWT multi-tenant auth, RBAC middleware, and scheduled cron jobs.
3. **Python AI Agent Service**: FastAPI backend powering LangGraph multi-agent state machines, Gemini 1.5 Pro LLM reasoning, and pgvector embeddings.
4. **Data & Telemetry Layer**: PostgreSQL (Neon with `pgvector`), Redis Event Bus (pub/sub & state queues), and Vapi Voice Telephony.

```mermaid
graph TD
    Client[React Command Center SPA] -->|HTTPS REST| API[Node.js Core Backend]
    Client <-->|Socket.IO Events| API
    
    API <-->|Prisma ORM| DB[(PostgreSQL + pgvector)]
    API <-->|Pub/Sub Events| Redis[(Redis Event Bus)]
    
    API <-->|HTTP Inter-Service| AIService[Python LangGraph AI Service]
    AIService <-->|Gemini 1.5 Pro| LLM[Google Gemini LLM]
    AIService <-->|Text-Embedding-004| VectorDB[(pgvector Shared Memory)]
    
    AIService <-->|Call Trigger / Webhook| Vapi[Vapi Voice AI Platform]
    Vapi <-->|Outbound Telephony| Patient[Patient / Doctor]
```

---

## 🤖 LangGraph Multi-Agent Workflows

### 1. Patient Triage & Admission State Machine
When a patient presents at triage, the autonomous agent graph executes sequentially with human intervention checkpoints:

```mermaid
graph LR
    Start([Patient Intake]) --> Triage[Triage Agent]
    Triage -->|Extract Symptoms & Priority| HITL{Human Approval Required?}
    
    HITL -->|High Risk / Policy Trigger| Approval[Approval Request Pending]
    HITL -->|Auto-Approved| Bed[Bed Allocation Agent]
    
    Approval -->|Doctor Approves| Bed
    Approval -->|Doctor Overrides| Override[Policy Override Logged] --> Bed
    
    Bed --> Doctor[Doctor Assignment Agent]
    Doctor --> Resource[Resource Monitoring Agent]
    Resource --> Notify[Notification Agent]
    Notify --> Memory[Store to Shared Memory]
    Memory --> End([Workflow Complete])
```

---

## 🧠 Shared Agent Memory (pgvector Architecture)

All autonomous agents retrieve historical context prior to decision making and persist structured learnings afterward using a hybrid vector scoring model.

### Hybrid Retrieval Scoring Formula:
$$\text{Score} = (\text{Similarity} \times 0.45) + (\text{Importance} \times 0.25) + (\text{Recency Weight} \times 0.20) + (\text{Confidence} \times 0.10)$$

```mermaid
graph TD
    Query[Agent Decision Query] --> Embed[Gemini text-embedding-004]
    Embed -->|768-dim Vector| VectorSearch[pgvector Cosine Search]
    
    VectorSearch --> Filter[Metadata Category Filter]
    Filter --> Hybrid[Hybrid Scoring Engine]
    Hybrid --> Rerank[Top-K Reranked Context]
    Rerank --> Inject[Inject Context into LLM Prompt]
```

---

## 📞 Voice AI Service & Retry Pipeline

Outbound call triggers (upcoming appointment reminders, post-discharge check-ins) are handled asynchronously via Vapi with automated exponential retries and transcript analysis.

```mermaid
graph TD
    Trigger[Call Trigger Event] --> Check[Voice Agent Service]
    Check --> VapiCall[Vapi REST API Call Initiated]
    
    VapiCall -->|Webhook Result| Webhook{Call Status}
    
    Webhook -->|Completed| Analyze[Gemini Transcript Analysis]
    Analyze --> Decision{Clinical Risk?}
    Decision -->|High Risk| Escalation[Emergency Doctor Notification + Appointment]
    Decision -->|Normal| Log[Log Call Analytics]
    
    Webhook -->|Failed / No Answer| Retry[Schedule Retry Queue]
    Retry -->|Attempt 1: 5m| VapiCall
    Retry -->|Attempt 2: 30m| VapiCall
    Retry -->|Max Exceeded| EscalateStaff[Escalate to Human Staff]
```

---

## 🔮 Predictive Operational Analytics Pipeline

Every 15 minutes, scheduled cron workers perform hospital-wide telemetry sweeps to project 24h occupancy and resource depletion count-downs.

```mermaid
graph LR
    CronJob[Cron Telemetry Sweep] --> Gather[Query PostgreSQL Telemetry]
    Gather --> Telemetry[Bed Occupancy + Stock Levels + Intake Rates]
    Telemetry --> PredAgent[PredictiveAnalyticsAgent]
    
    PredAgent -->|Historical Memory Lookup| VectorDB[(AgentMemory pgvector)]
    PredAgent -->|Gemini Forecast| Output[Occupancy & Stockout Forecast]
    
    Output --> Socket[Emit Socket.IO Event]
    Output --> Dash[Update Predictive Dashboard]
    Output --> Alert{Depletion Risk?}
    Alert -->|Critical| Notify[Send Emergency Restock Alert]
```

---

## 🛡️ Governance & Audit Trail (Correlation ID Tracing)

Every execution across the platform receives a unique **Correlation ID** (e.g. `RUN-2026-000124`) that binds all downstream sub-events together in a tamper-resistant append-only log.

```mermaid
sequenceDiagram
    autonumber
    participant UI as React Command Center
    participant API as Node Backend
    participant Agent as LangGraph Agent
    participant Audit as AuditLogger Utility
    
    UI->>API: POST /api/patients/triage (Correlation: RUN-2026-000124)
    API->>Audit: logAudit(PATIENT_REGISTERED)
    API->>Agent: Execute Graph Workflow
    Agent->>Audit: logAudit(TRIAGE_DECISION, Correlation ID)
    Agent->>Audit: logAudit(HUMAN_OVERRIDE, Correlation ID)
    Agent->>Audit: logAudit(VOICE_CALL_TRIGGERED, Correlation ID)
    UI->>API: GET /api/audit/export (Download CSV)
    API->>Audit: logAudit(EXPORT_AUDIT_TRAIL)
```

---

## 🗄️ Database ER Diagram (Core Models)

```mermaid
erDiagram
    Hospital ||--o{ User : employs
    Hospital ||--o{ Patient : admits
    Hospital ||--o{ Bed : owns
    Hospital ||--o{ Resource : tracks
    Hospital ||--o{ AgentMemory : stores
    Hospital ||--o{ AuditLog : records

    Patient ||--o{ Appointment : schedules
    Patient ||--o{ AgentRun : triggers
    Patient ||--o{ CallLog : receives

    AgentRun ||--o{ ApprovalRequest : generates
    AgentRun ||--o{ AgentAction : executes
    User ||--o{ ApprovalRequest : reviews
```
