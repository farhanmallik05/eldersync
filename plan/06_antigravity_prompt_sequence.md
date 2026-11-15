# 06 — Google Antigravity Prompt Sequence (Vercel Edition)

This document contains the prompt sequence used to iteratively engineer ElderSync with the **Google Antigravity IDE**, preserving full traceability for the **20% Implementation** evaluation criterion and generating `PROMPT_LOG.md`.

---

## Prompt 0 — Master System Instruction

```markdown
# PROJECT: ELDERSYNC (PromptWars × Catalyst — Round 2 — Vercel Edition)

Act as a senior full-stack engineer, software architect, product designer, QA engineer, and technical auditor.
We are building ElderSync: a patient-centred elderly-care and medication adherence platform optimized for the Round 2 evaluation criteria:
- Implementation (20%)
- Problem-Solution Alignment (20%)
- Functionality (20%)
- UI/UX (15%)
- Deployment & Completeness (10%)
- LinkedIn Post Evaluation (10%)
- GitHub Repository (5%)

NON-NEGOTIABLE ENGINEERING RULES:
1. Patient-Primary Autonomy: The elderly patient is the primary user who owns their profile, confirms medications, views appointments, generates single-use Care Circle passcodes, and controls caregiver/family permissions.
2. Real Backend Persistence: Use Node.js + Express + TypeScript on Vercel Serverless with PostgreSQL and Prisma ORM (`prisma/schema.prisma`). Never use `localStorage` as the database or browser `setTimeout` for medication reminders.
3. Dual-Mode Storage Architecture: Implement a seamless repository adapter so that if a live database URL is not provided in a sandboxed CI/grading environment, all operations cleanly fall back to an in-memory transactional mock without failing tests.
4. Real Idempotent Email Notifications: Integrate a real transactional email service (Resend HTTP API / SMTP) with deterministic idempotency keys (`notifications/{idempotencyKey}`) so repeated Vercel Cron triggers never send duplicate emails.
5. Security by Default: Verify JWT tokens on protected API routes, validate inputs with Zod, hash 6-digit single-use invitation passcodes with SHA-256 + salt (timing-safe comparison), apply rate limiting on join routes, enforce 15-minute expiry, and log sensitive actions in `audit_logs`.
6. Unified Vercel Serverless Deployment: Configure `vercel.json` to route `/api/*` to the serverless function and static assets to `dist/`, with automated Vercel Cron scheduled checks (`*/2 * * * *`).
7. Maintain `PROMPT_LOG.md` in the root directory, recording every build phase, architectural decision, prompt iteration, and verification check.
```

---

## Phase 1–3 Prompt — Foundation, Auth & Patient Profile Persistence

```markdown
Execute Phases 1, 2, and 3 of ElderSync.

1. Create the repository structure:
   - `frontend/` (React, TypeScript, Vite, Tailwind CSS, Lucide icons, accessible components)
   - `backend/` (Node.js, Express, TypeScript, Prisma Client, JWT, bcryptjs, zod, helmet, cors, dotenv)
   - `prisma/schema.prisma` (PostgreSQL relational models)
   - `tests/` (Vitest + Supertest)
   - `docs/architecture.md`
   - `vercel.json`, `.gitignore`, `README.md`, `PROMPT_LOG.md`
2. Implement JWT Authentication on the frontend and backend:
   - Registration, login, and 1-click "Quick Demo Account Sign-In" that generates signed session tokens for Patient, Caregiver, and Family so judges and automated evaluators can test multi-role collaboration immediately.
3. Implement backend auth middleware (`backend/src/middleware/auth.ts`) verifying JWT tokens, with signed demo session token fallbacks.
4. Implement `POST /api/patients` and `GET /api/patients/:patientId/workspace` persisted in PostgreSQL via Prisma, including patient autonomy settings (`gracePeriodMinutes`, `emergencyPhone`, `highContrastDefault`, `timezone`).
5. Update `PROMPT_LOG.md` with Phase 1–3 architecture decisions and verify that `GET /api/health` and patient profile creation work end-to-end.
```

---

## Phase 4–6 Prompt — Medications, Adherence Engine & Passcode Care Circle

```markdown
Execute Phases 4, 5, and 6 of ElderSync.

1. Medication & Schedule CRUD (`backend/src/routes/medications.ts`):
   - Allow the Patient (or an authorized Caregiver with `canManageMeds: true`) to create, edit, and deactivate medications with recurring daily schedule times (`08:00`, `14:00`, `20:00`).
   - Automatically materialize today's `dose_logs` (`{scheduleId}_{YYYY-MM-DD}`) idempotently whenever the workspace is loaded or the scheduler runs.
2. Dose Confirmation Engine (`backend/src/routes/doses.ts`):
   - Implement `POST /api/doses/:doseId/confirm` supporting `TAKEN`, `SKIPPED`, and `UNABLE` (with optional patient note).
   - Implement `POST /api/doses/:doseId/acknowledge` allowing an authorized Caregiver to acknowledge an `UNCONFIRMED_ESCALATED` alert and record follow-up notes inside an atomic transaction.
3. Secure Passcode Care Circle (`backend/src/routes/careCircle.ts`):
   - Implement `POST /api/patients/:patientId/invitations` (Patient-only): generates a 6-digit passcode using `crypto.randomInt(100000, 999999)`, stores only `sha256(passcode + PEPPER)` in `care_invitations` with a 15-minute `expiresAt` timestamp and `used: false`.
   - Implement `POST /api/care-circle/join`: rate-limited (5 attempts/15 min), validates the passcode hash using timing-safe comparison inside a Prisma transaction, marks `used = true`, creates the `care_members` record with granular permissions, and writes to `audit_logs`.
   - Implement `PATCH /api/patients/:patientId/care-members/:memberId` (Patient-only): lets the patient toggle `canManageMeds`, `canManageAppointments`, `receiveEscalationEmails`, or revoke access (`status: 'REVOKED'`).
4. Update `PROMPT_LOG.md` and verify all routes.
```

---

## Phase 7–9 Prompt — Real Email Notifications, Appointments & Live Analytics

```markdown
Execute Phases 7, 8, and 9 of ElderSync.

1. Idempotent Email Notification Service (`backend/src/services/emailService.ts`):
   - Support real transactional email delivery via Resend API (`RESEND_API_KEY`) or SMTP (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`).
   - Before sending any email, check `notifications` by `idempotencyKey`. If it already exists, skip sending to guarantee zero duplicate alerts.
   - Persist every sent email record in `notifications` (including recipient, subject, HTML body preview, delivery status, and timestamp) so judges can also verify sent emails inside the UI's Notification Log.
2. Scheduled Reminder & Missed-Dose Escalation Processor (`POST /api/scheduler/run-check`):
   - For any dose where `now >= scheduledAt` and `status == 'SCHEDULED'`: send due reminder email to the patient (`idempotencyKey = rem_${doseId}`) and transition status to `'REMINDER_SENT'`.
   - For any dose where `now >= graceDeadlineAt` and `status == 'REMINDER_SENT'`: transition status to `'UNCONFIRMED_ESCALATED'` and send escalation email (`idempotencyKey = esc_${doseId}`) to all active Care Circle members with `receiveEscalationEmails: true`.
3. Appointment Management (`backend/src/routes/appointments.ts`):
   - Full CRUD for doctor appointments (`doctorName`, `specialty`, `location`, `scheduledAt`, `notes`) + upcoming appointment email reminders (`idempotencyKey = appt_${appointmentId}`).
4. Real Adherence Analytics (`backend/src/services/analyticsService.ts`):
   - Compute directly from `dose_logs`: 7-day adherence rate (%), counts of `TAKEN` vs `SKIPPED` vs `UNCONFIRMED_ESCALATED`, time-of-day disruption breakdown (`Morning`, `Afternoon`, `Evening`, `Night`), and average confirmation delay in minutes.
5. Connect all three frontend dashboards (Patient, Caregiver, Family) with accessible controls, font scaling, high-contrast mode, and a live `"Trigger Scheduler Check"` button for instant demo verification. Update `PROMPT_LOG.md`.
```

---

## Phase 10 Prompt — Automated Tests, Security Audit & Vercel Packaging

```markdown
Execute Phase 10 of ElderSync: Final Quality Gate, Tests, and Vercel Serverless Packaging.

1. Write and run unit and integration tests in `tests/` using Vitest:
   - Test passcode generation, SHA-256 hashing, single-use consumption, and expired passcode rejection.
   - Test passcode rate limiting (6th attempt triggers 429 Too Many Requests).
   - Test dose state transitions (`SCHEDULED` -> `REMINDER_SENT` -> `UNCONFIRMED_ESCALATED` -> `ACKNOWLEDGED` and `TAKEN`) and idempotency key deduplication.
   - Test RBAC enforcement (confirm unauthorized users or revoked care members receive `403 Forbidden`).
   - Test `GET /api/health` and demo seeding `POST /api/demo/seed`.
2. Audit the frontend for zero dead buttons, responsive layout, WCAG AAA contrast in High-Contrast mode, and explicit `aria-label` attributes on all interactive controls.
3. Configure `vercel.json` with static build and API rewrites + Vercel Cron.
4. Finalize `README.md`, `docs/architecture.md`, and `PROMPT_LOG.md`. Run `npm test` and `npm run build` to confirm zero errors.
```
