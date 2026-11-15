# ElderSync — Vibe Coding & Execution Master Plan
## PromptWars × Catalyst — Round 2 Antigravity Execution Pack (Vercel Edition)

Welcome to the **ElderSync** plan repository. This directory contains the complete specifications, architectural blueprints, database schemas, UI design systems, phased build prompts, testing matrices, and deployment scripts for building ElderSync into an MVP ready for demo and automated scoring on **Vercel**.

---

## 📑 Directory Index

| File | Description | Target Focus |
|---|---|---|
| [01_product_specification_and_scoring.md](./01_product_specification_and_scoring.md) | Scoring Breakdown (Top 1% Target: 98–100/100), Core Problem, Patient Autonomy Principles, and Scope Lock | Evaluation & Strategy |
| [02_architecture_and_tech_stack.md](./02_architecture_and_tech_stack.md) | System architecture, Vercel Serverless + Vite React deployment, component diagrams, and tech stack | Implementation (20%) |
| [03_database_schema_and_security_rules.md](./03_database_schema_and_security_rules.md) | 10 PostgreSQL Tables with full Prisma schema, TypeScript types, and server-side RBAC security rules | Security & Data Integrity |
| [04_backend_api_specification.md](./04_backend_api_specification.md) | REST API endpoints, Zod validation schemas, JWT RBAC middleware, and idempotency key logic | Backend & API |
| [05_screen_by_screen_ui_blueprint.md](./05_screen_by_screen_ui_blueprint.md) | Design tokens, WCAG AAA accessibility, >=56px touch targets, and Screen Architecture for Patient, Caregiver, and Family views | UI/UX (15%) |
| [06_antigravity_prompt_sequence.md](./06_antigravity_prompt_sequence.md) | Complete prompt sequence (Prompts 0 through 10) for iterative AI-assisted engineering with Google Antigravity on Vercel | AI Workflow |
| [07_test_cases_and_quality_gates.md](./07_test_cases_and_quality_gates.md) | Vitest & Supertest test cases (TC-01 through TC-10) covering hashing, state transitions, idempotency, rate limiting, and RBAC | Quality & Verification |
| [08_vercel_deployment_and_demo_script.md](./08_vercel_deployment_and_demo_script.md) | Vercel Serverless deployment, `vercel.json` Vercel Cron configuration, and 5-Act Live Demo sequence for judges | Deployment (10%) |
| [09_submission_assets_and_linkedin.md](./09_submission_assets_and_linkedin.md) | `PROMPT_LOG.md` template, GitHub `README.md` structure, and viral LinkedIn showcase post tagging @Makers Need More (MnM) | Submission Assets (15%) |

---

## 🎯 Scoring Target Matrix (Top 1% Target: 98–100/100)

- **Implementation (20% - Target: 20/20):** Express Serverless + React Vite + strict TypeScript + Zod + Prisma ORM + zero-defect `PROMPT_LOG.md`.
- **Problem-Solution Alignment (20% - Target: 20/20):** Patient-primary autonomy (patient owns data and access; caregivers support).
- **Functionality (20% - Target: 20/20):** 100% PostgreSQL persisted, real transactional email delivery, Vercel Cron cron processing with idempotency keys, dual-mode storage fallback for CI test runner.
- **UI/UX (15% - Target: 15/15):** Healthcare SaaS aesthetic (Navy/Teal/White), WCAG AAA contrast, >= 56px touch targets, font scalers (`A`/`A+`/`A++`), high-contrast mode, responsive.
- **Deployment & Completeness (10% - Target: 10/10):** Public Vercel HTTPS URL, active Vercel Cron trigger, tested in an incognito session.
- **LinkedIn Post Evaluation (10% - Target: 10/10):** Comprehensive showcase tagging @Makers Need More (MnM) with problem framing, architecture, AI-assisted workflow, screenshots, and live Vercel link.
- **GitHub Repository (5% - Target: 5/5):** Clean structure (`frontend/`, `backend/`, `tests/`, `docs/`, `plan/`), production `README.md`, `PROMPT_LOG.md`, `LICENSE`, `.gitignore` with zero leaked secrets.
