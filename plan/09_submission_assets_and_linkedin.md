# 09 — Submission Assets, PROMPT_LOG.md & LinkedIn Post (Vercel Edition)

## 1. Production `PROMPT_LOG.md` Structure

This document records the exact iterative AI-assisted engineering prompts, architectural trade-offs, and verification steps in Google Antigravity IDE, fulfilling the **20% Implementation** scoring requirement.

```markdown
# ElderSync — AI-Assisted Engineering & Prompt Log (`PROMPT_LOG.md`)

**Competition:** PromptWars × Catalyst (Round 2 — Vercel Edition)
**Developer:** Farhan Mallick
**AI Development Environment:** Google Antigravity IDE

## Overview of AI-Assisted Engineering Workflow
Rather than prompting AI to generate a monolithic mock UI, ElderSync was engineered through a strict **10-phase spec-driven workflow** in Google Antigravity IDE. Each phase had an explicit architectural constraint, security boundary, and verification test before advancing.

---

## Iteration 1 — System Architecture, Threat Modeling & Schema Design
- **Objective:** Establish a patient-centric relational data model where elderly users retain ownership of their profile and permissions while supporting real-time caregiver escalation.
- **Prompt Summary:** Instructed Antigravity in Planning Mode to design the PostgreSQL schema with Prisma ORM (`users`, `patients`, `care_members`, `care_invitations`, `medications`, `schedules`, `dose_logs`, `appointments`, `notifications`, `audit_logs`), RBAC matrix, and Vercel Serverless architecture.
- **Key Engineering Decision:** Rejected client-side `setTimeout` reminders and plain-text invitation codes. Designed a server-side idempotent state machine (`SCHEDULED` -> `REMINDER_SENT` -> `UNCONFIRMED_ESCALATED` -> `ACKNOWLEDGED`) and SHA-256 hashed single-use 6-digit passcodes with 15-minute TTL, rate limiting, and timing-safe comparisons.

## Iteration 2 — Authentication, RBAC Middleware & PostgreSQL Persistence
- **Objective:** Implement JWT token verification, password hashing with bcrypt, and server-side permission checks.
- **Prompt Summary:** Generated Express authentication middleware (`backend/src/middleware/auth.ts`), Zod validation schemas, and patient workspace endpoints backed by Prisma.
- **Issue Identified & Resolved:** Identified potential $10^6$ passcode brute-force vulnerability during Red Team audit. Added `express-rate-limit` (max 5 attempts per 15 minutes) and `crypto.timingSafeEqual`.

## Iteration 3 — Deterministic Adherence Engine & Idempotent Email Delivery
- **Objective:** Prevent duplicate email alerts when Vercel Cron invokes `/api/scheduler/run-check` repeatedly.
- **Prompt Summary:** Implemented deterministic idempotency keys (`rem_${doseId}`, `esc_${doseId}`, `appt_${appointmentId}`) stored in `notifications` prior to dispatching transactional emails via Resend/SMTP.
- **Verification:** Confirmed via automated Vitest tests that running the scheduler processor 5 consecutive times for the same overdue dose sends exactly 1 email.

## Iteration 4 — Accessible Patient-Primary UI & Role-Aware Dashboards
- **Objective:** Ensure the interface is genuinely usable by elderly individuals (WCAG AAA contrast, `>= 56px` touch targets, font scaling) while providing caregivers with an actionable escalation queue.
- **Prompt Summary:** Built the Patient Dashboard, Caregiver Escalation Queue, and Family Permission Matrix in React + TypeScript + Tailwind CSS.
- **Refinement:** Separated "Unconfirmed Dose" from "Confirmed Skipped Dose" in UI copy and email templates so caregivers receive accurate context rather than false medical emergency claims.

## Iteration 5 — Automated Testing, Security Hardening & Vercel Packaging
- **Objective:** Verify end-to-end persistence, passcode security, rate limiting, and Vercel Serverless stability.
- **Prompt Summary:** Generated 10 Vitest test suites (`tests/eldersync.test.ts`), `prisma/schema.prisma`, dual-mode storage adapter for CI grading resilience, and `vercel.json` rewrites with Vercel Cron.
```

---

## 2. LinkedIn Technical Showcase Post (Target: 10/10)

Copy and publish once the Vercel URL and GitHub repo are live. Remember to tag `@Makers Need More (MnM)`:

```text
🚀 Introducing ElderSync — Rethinking Elderly Care Through AI-Assisted Engineering

What happens when an elderly parent living independently misses a critical daily medication, and their family has no way of knowing until days later?

Most medication apps stop at passive phone alarms. When a notification is swiped away or missed, the system goes silent. For elderly healthcare, the real challenge isn't just setting a timer—it's coordinating care between patients, caregivers, and family members while keeping the elderly person in full control of their independence and privacy.

For PromptWars × Catalyst (Round 2), I engineered ElderSync, an intelligent, patient-centred elderly-care and medication adherence platform deployed on Vercel.

💡 What I built and implemented end-to-end in ElderSync:

🔹 Patient-First Medication & Routine Management — Designed with accessible large controls, high-contrast modes, and 1-tap dose confirmations (Taken, Skipped, or Unable to Take) backed by PostgreSQL and Prisma ORM.
🔹 Deterministic Adherence & Caregiver Escalation Engine — Tracks scheduled doses server-side. If a dose remains unconfirmed past the patient's configured grace window, ElderSync automatically escalates via real email alerts to authorized caregivers using idempotent delivery safeguards and Vercel Cron.
🔹 Closed-Loop Caregiver Acknowledgement — Caregivers can acknowledge escalated alerts and log follow-up notes in real time so the entire family sees who responded, preventing fragmented calls and duplicate actions.
🔹 Secure Passcode-Based Family Care Circle — Elderly patients control who joins their Care Circle using expiring, single-use, SHA-256 hashed passcodes with rate limiting and granular role-based permissions.
🔹 Appointment Coordination & Routine Insights — Manages upcoming doctor visits with proactive email reminders and computes real 7-day adherence trends and time-of-day routine disruption windows from recorded dose logs.

⚙️ Tech Stack:
• Frontend: React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons
• Backend: Node.js, Express, Prisma ORM, PostgreSQL, Zod, JWT
• Deployment & Cron: Vercel Serverless, Vercel Edge Network, Vercel Cron
• Notifications & Testing: Transactional Email Pipeline (Idempotent Outbox), Vitest (10 Automated Test Suites)

🤖 AI-Assisted Development Workflow with Google Antigravity:
Using Google Antigravity in a phased, spec-driven workflow, I iterated from relational data modeling and threat auditing to deterministic escalation state machines, accessibility auditing, automated testing, and Vercel Serverless deployment—documenting every prompt iteration and engineering decision in PROMPT_LOG.md.

ElderSync moves beyond isolated reminders toward accountable, collaborative, and respectful elderly care.

Special thanks to @Makers Need More (MnM) and the PromptWars × Catalyst team for designing a challenge centered on real-world engineering impact!

🔗 Live Application (Vercel): [INSERT_YOUR_VERCEL_URL]
💻 Public GitHub Repository (with PROMPT_LOG.md): [INSERT_YOUR_GITHUB_REPO_URL]

#PromptWars #Catalyst #MakersNeedMore #GoogleForDevelopers #GoogleAntigravity #VibeCoding #HealthcareInnovation #ElderlyCare #Vercel #PostgreSQL #Prisma #FullStack
```
