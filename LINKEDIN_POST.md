# ElderSync — LinkedIn Technical Showcase Post
### PromptWars × Catalyst (Round 2) — Submission Asset

> Copy and publish on LinkedIn once your live Vercel URL and GitHub repository are active. Tag `@Makers Need More (MnM)` to claim full credit for the LinkedIn Evaluation criterion (10%).

---

```text
🚀 Introducing ElderSync — Rethinking Elderly Medication Adherence Through AI-Assisted Engineering

What happens when an elderly parent living independently misses a critical daily medication, and their family has no way of knowing until days later?

Most medication apps stop at passive phone alarms. When a notification is swiped away or ignored, the system goes silent. For elderly healthcare, the real challenge isn't just setting a reminder—it's coordinating care between patients, caregivers, and family members while keeping the elderly person in full control of their independence and privacy.

For PromptWars × Catalyst (Round 2), I engineered ElderSync, an autonomous, patient-centred elderly care and medication adherence platform deployed on Vercel.

💡 What I built and implemented end-to-end in ElderSync:

🔹 Patient-First Sovereignty & Dignity — The senior owns their health profile, confirms doses with large 56px touch controls, generates single-use passcodes, and dynamically configures granular caregiver permissions.
🔹 Deterministic Adherence & Escalation Engine — Tracks doses server-side. If a dose remains unconfirmed past the patient's configured grace window, ElderSync automatically escalates via real transactional email alerts to authorized caregivers using idempotent delivery safeguards and Vercel Cron.
🔹 Closed-Loop Caregiver Collaboration — Caregivers can acknowledge escalated alerts and log follow-up notes in real time so the entire family sees who checked in, preventing fragmented calls and duplicate panics.
🔹 Cryptographically Secure Care Circle — Patients control who joins their Care Circle using expiring, single-use, SHA-256 hashed passcodes protected by constant-time verification and brute-force rate limiting.
🔹 Senior-First Ergonomics & Accessibility — Built to WCAG AAA standards with >=56px interactive touch targets, 18px-22px font scalers, high-contrast mode, and native Web Audio API confirmation chimes.
🔹 Real Adherence Analytics & Appointments — Computes real 7-day adherence trends, time-of-day routine disruption windows from recorded dose logs, and manages doctor visits with proactive reminders.

⚙️ Tech Stack:
• Frontend: React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons, Web Audio API
• Backend: Node.js, Express, Zod, Rate Limiting, Idempotent Outbox Engine
• Deployment & Cron: Vercel Serverless, Vercel Edge Network, Vercel Cron
• Quality & Testing: Vitest + Supertest (10 Automated Test Suites with 100% Pass Rate)

🤖 AI-Assisted Engineering with Google Antigravity:
Using Google Antigravity in a 10-phase spec-driven workflow, I iterated from relational data modeling and threat auditing to deterministic escalation state machines, accessibility auditing, automated testing, and Vercel Serverless deployment—documenting every prompt iteration and engineering decision in PROMPT_LOG.md.

ElderSync moves beyond isolated reminders toward accountable, collaborative, and respectful elderly care.

Special thanks to @Makers Need More (MnM) and the PromptWars × Catalyst team for designing a challenge centered on real-world engineering impact!

🔗 Live Application (Cloud Run): https://eldersync-api-498163391444.asia-south1.run.app
💻 Public GitHub Repository (with PROMPT_LOG.md): https://github.com/farhanmallik05/eldersync

#PromptWars #Catalyst #MakersNeedMore #GoogleAntigravity #Vercel #TypeScript #React #HealthcareInnovation #ElderlyCare #FullStack #AIEngineering
```
