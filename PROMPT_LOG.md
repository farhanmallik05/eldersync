# ElderSync — AI-Assisted Engineering & Prompt Log (`PROMPT_LOG.md`)

**Competition:** PromptWars × Catalyst (Round 2)  
**Developer:** Farhan Mallick  
**AI Development Environment:** Google Antigravity IDE  

## Overview of AI-Assisted Engineering Workflow
Rather than prompting AI to generate a monolithic mock UI, ElderSync was engineered through a strict **10-phase spec-driven workflow** in Google Antigravity IDE. Each phase had an explicit architectural constraint, security boundary, and verification test before advancing.

---

## Iteration 1 — System Architecture, Threat Modeling & Schema Design
- **Objective:** Establish a patient-centric data model where elderly users retain ownership of their profile and permissions while supporting real-time caregiver escalation.
- **Prompt Summary:** Instructed Antigravity in Planning Mode to design the Firestore schema (`users`, `patients`, `careMembers`, `careInvitations`, `medications`, `schedules`, `doseLogs`, `appointments`, `notifications`, `auditLogs`), RBAC matrix, and single-container Cloud Run architecture.
- **Key Engineering Decision:** Rejected client-side `setTimeout` reminders and plain-text invitation codes. Designed a server-side idempotent state machine (`SCHEDULED` -> `REMINDER_SENT` -> `UNCONFIRMED_ESCALATED` -> `ACKNOWLEDGED`) and SHA-256 hashed single-use 6-digit passcodes with 15-minute TTL.

## Iteration 2 — Authentication, RBAC Middleware & Firestore Persistence
- **Objective:** Implement Firebase Auth token verification and server-side permission checks.
- **Prompt Summary:** Generated Express authentication middleware (`backend/src/middleware/auth.ts`), Zod validation schemas, and patient workspace endpoints.
- **Issue Identified & Resolved:** Initial draft allowed any care circle member to mutate medications. Added explicit `requirePermission('canManageMeds')` middleware and restricted permission changes strictly to `patient.ownerUid === req.user.uid`.

## Iteration 3 — Deterministic Adherence Engine & Idempotent Email Delivery
- **Objective:** Prevent duplicate email alerts when Cloud Scheduler invokes `/api/scheduler/run-check` repeatedly.
- **Prompt Summary:** Implemented deterministic idempotency keys (`rem_${doseId}`, `esc_${doseId}`, `appt_${appointmentId}`) stored in Firestore `notifications` prior to dispatching transactional emails via Resend/SMTP.
- **Verification:** Confirmed via automated Vitest tests that running the scheduler processor 5 consecutive times for the same overdue dose sends exactly 1 email.

## Iteration 4 — Accessible Patient-Primary UI & Role-Aware Dashboards
- **Objective:** Ensure the interface is genuinely usable by elderly individuals (WCAG AAA contrast, `>= 56px` touch targets, font scaling) while providing caregivers with an actionable escalation queue.
- **Prompt Summary:** Built the Patient Dashboard, Caregiver Escalation Queue, and Family Permission Matrix in React + TypeScript + Tailwind CSS.
- **Refinement:** Separated "Unconfirmed Dose" from "Confirmed Skipped Dose" in UI copy and email templates so caregivers receive accurate context rather than false medical emergency claims.

## Iteration 5 — Automated Testing, Security Hardening & Cloud Run Deployment
- **Objective:** Verify end-to-end persistence, passcode security, and Cloud Run container stability.
- **Prompt Summary:** Generated Vitest test suite (`tests/eldersync.test.ts`), `firestore.rules`, and multi-stage `Dockerfile` binding to `$PORT` (8080).
- **Verification:** Ran test suite validating TC-01 through TC-06, ensuring 100% pass rate.
