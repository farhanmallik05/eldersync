# 01 — Product Specification & Round 2 Scoring Matrix (Vercel Edition)

## 1. Executive Summary & Problem Framing

### The Problem
Most elderly medication adherence applications treat medication management as passive phone alarms or intrusive surveillance. When a notification is dismissed or ignored, standard systems go silent until hours or days later. Furthermore, existing systems frequently disenfranchise the elderly individual by treating them merely as subjects monitored by adult children or nursing staff, rather than autonomous adults in control of their own health routines.

### The ElderSync Solution
**ElderSync** is an autonomous, patient-centred elderly care and medication adherence platform engineered with:
1. **Patient-Primary Autonomy**: The elderly individual owns their healthcare profile, confirms their doses, generates single-use access passcodes, and dynamically configures granular caregiver permissions.
2. **Deterministic Server-Side Escalation**: Missed doses are tracked server-side with configurable grace windows (default 3 minutes for live demo, 5–120 minutes in production). If unconfirmed, the backend dispatches transactional email alerts with idempotency locks.
3. **Closed-Loop Caregiver Collaboration**: When an escalation happens, caregivers acknowledge the alert and record notes in real-time to avoid duplicate panics or conflicting family actions.
4. **Accessible Healthcare UX**: High-contrast, large touch-target interface designed specifically for elderly ergonomics (min 56px interactive height, high contrast, clean typography).
5. **Modern Vercel Serverless Architecture**: Deployed on Vercel with serverless Express API endpoints, static Vite React UI, PostgreSQL database via Prisma ORM, and Vercel Cron jobs.

---

## 2. Official Round 2 Scoring Breakdown & Target Allocation (Top 1% Tier)

| Evaluation Criterion | Weight | Target Score | Concrete Execution Requirement |
|---|---|---|---|
| **Implementation** | 20% | **20/20** | Vercel Serverless + Express REST backend, Vite React frontend, strict TypeScript, Zod validation, Prisma ORM, `PROMPT_LOG.md` documenting iterative AI-assisted engineering. |
| **Problem-Solution Alignment** | 20% | **20/20** | Patient-primary architecture: Patient owns profile, controls sharing, confirms doses, manages appointments, and requests help; caregivers/family act as authorized support. |
| **Functionality** | 20% | **20/20** | 100% PostgreSQL-persisted CRUD via Prisma, real transactional email delivery (Resend / SMTP), Vercel Cron cron processing with idempotency keys, dual-mode storage fallback for CI grading bots. |
| **UI/UX** | 15% | **15/15** | Clean white/navy/teal healthcare SaaS interface (Tailwind + accessible components), WCAG AAA contrast, large elderly-friendly touch targets (>= 56px), responsive across mobile and desktop. |
| **Deployment & Completeness** | 10% | **10/10** | Publicly accessible Vercel HTTPS deployment tested in an incognito session + active Vercel Cron trigger. |
| **LinkedIn Post Evaluation** | 10% | **10/10** | Public technical showcase tagging `@Makers Need More (MnM)` with problem framing, implemented features, AI-assisted workflow, screenshots, live Vercel link, and GitHub link. |
| **GitHub Repository** | 5% | **5/5** | Clean `frontend/` + `backend/` + `tests/` + `docs/` structure, production `README.md`, `PROMPT_LOG.md`, `LICENSE`, `.gitignore` with zero leaked secrets. |
| **Total** | 100% | **100/100** | Exceptional delivery across all engineering dimensions. |

---

## 3. Strict MVP Scope Lock (Avoiding Feature Creep)

To guarantee 100% completion within the hackathon window and secure the Top 1% score, features are strictly tiered:

### Must-Have (P0 Tier — Required for 100% Completion)
- [x] **Patient Profile & Autonomy Controls**: Patient sets preferences, emergency contacts, grace period (default 3 min for demo, configurable 5–120 min), and revokes/grants permissions.
- [x] **Medication & Schedule CRUD**: Create, edit, pause, and delete medications with daily recurring time slots stored in PostgreSQL.
- [x] **Dose Confirmation Workflow**: 1-tap `Taken`, `Skipped`, or `Unable to Take` (with reason) persisted to `dose_logs` and reflected live across roles.
- [x] **Missed-Dose Detection & Escalation**: Backend endpoint evaluates unconfirmed doses past `scheduledAt + gracePeriodMinutes` and triggers caregiver escalation via Vercel Cron.
- [x] **Passcode Care Circle & Permissions**: Single-use, 15-minute expiring, SHA-256 hashed 6-digit passcodes with rate limiting (5 attempts/15 min) and granular permissions per member.
- [x] **Appointment Management**: Add/edit doctor visits with date, time, clinician, location, notes, and automated email reminders.
- [x] **Real Email Notifications**: Real transactional emails via Resend/SMTP for due doses, unconfirmed escalations, and appointments with idempotency keys.
- [x] **Accessibility Controls**: Font scale toggles (A / A+ / A++), High Contrast mode, and large >=56px touch targets.
- [x] **Judge Live Demo Trigger**: Quick-action bar with 1-click scheduler check and role switcher for demo evaluation.

### Should-Have (P1 Tier)
- [x] **Adherence Analytics**: Computed directly from real `dose_logs`: 7-day adherence %, time-of-day disruption window, confirmation latency.
- [x] **Audit Log Feed**: Real-time chronological audit trail of all actions taken in the Care Circle.

### Post-MVP / Defer Tier (P2 Tier)
- [ ] Prescription OCR / Camera Scanning (strictly deferred until Phases 1–10 are deployed).
- [ ] Voice Assistant integration.
- [ ] Multi-language i18n translation.

---

## 4. 10-Phase Build Order & Strict Quality Gates

| Phase | Deliverable | Mandatory Completion Test Before Moving On |
|---|---|---|
| **Phase 1** | Project foundation (`frontend/`, `backend/`, `shared/`) | Express API (`GET /api/health`) and Vite React SPA start cleanly and route properly on Vercel. |
| **Phase 2** | JWT Authentication & Role Switching | Users can sign up/sign in with JWT; 1-click Quick Demo logins available; backend verifies tokens. |
| **Phase 3** | Patient profiles & autonomy settings | Patient profile creation and updates persist in PostgreSQL `Patient` table via Prisma. |
| **Phase 4** | Medication & schedule management | Creating, editing, and deleting medications + daily time slots persist in PostgreSQL. |
| **Phase 5** | Adherence & confirmation engine | Clicking Taken, Skipped, or Unable to Take writes to `DoseLog` and updates UI state. |
| **Phase 6** | Care Circle & hashed passcode joining | Generating a 6-digit passcode and redeeming it from a Caregiver/Family account grants scoped access (rate-limited). |
| **Phase 7** | Real email notifications & escalation | Unconfirmed dose past grace period sends a real email to Caregiver with idempotency lock. |
| **Phase 8** | Appointment management & reminders | Doctor appointments persist in PostgreSQL and trigger scheduled reminder emails. |
| **Phase 9** | Real adherence analytics | Analytics charts/cards update dynamically when new `DoseLog` records are created. |
| **Phase 10** | Polish, Vercel deployment & submission assets | Public Vercel URL passes all 5 Demo Acts in an incognito browser window and 10/10 automated tests pass. |
