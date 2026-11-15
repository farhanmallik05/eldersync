# 08 — Vercel Deployment & 5-Act Live Demo Script

## 1. Vercel Serverless Deployment Guide

ElderSync is architected to deploy seamlessly to **Vercel** with a unified full-stack monorepo:
- **Frontend**: Vite + React 18 + Tailwind CSS (static SPA served via Vercel Edge CDN).
- **Backend**: Express REST API mounted as a Vercel Serverless Function under `/api/*`.
- **Database**: PostgreSQL (hosted on Supabase, Neon, or Vercel Postgres) managed via Prisma ORM.
- **Scheduled Escalations**: Native **Vercel Cron Jobs** configured in `vercel.json`.

---

### Step 1: Pre-Flight `.gitignore` Check
Ensure the following files are excluded from Git to prevent secret exposure:
```text
node_modules/
dist/
.vercel/
.env
.env.*
!.env.example
prisma/*.db
*.log
.DS_Store
```

---

### Step 2: Provision PostgreSQL Database
ElderSync supports any standard PostgreSQL connection string:
1. **Supabase / Neon / Vercel Postgres**:
   - Create a new PostgreSQL database.
   - Copy the connection URI:
     ```text
     DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/[DB_NAME]?sslmode=require&pgbouncer=true"
     DIRECT_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/[DB_NAME]?sslmode=require"
     ```
2. Run Prisma migrations:
   ```bash
   npx prisma migrate deploy
   ```

---

### Step 3: Configure `vercel.json`
The root `vercel.json` coordinates serverless function routing, static builds, and automated cron jobs:

```json
{
  "version": 2,
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.js" },
    { "source": "/(.*)", "destination": "/dist/$1" }
  ],
  "crons": [
    {
      "path": "/api/scheduler/run-check",
      "schedule": "*/2 * * * *"
    }
  ]
}
```

---

### Step 4: Environment Variables on Vercel
Set the following environment variables in the Vercel Dashboard (**Project Settings > Environment Variables**) or via Vercel CLI:

| Variable | Sample Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Enables production optimizations |
| `DATABASE_URL` | `postgresql://...` | Connection pooled PostgreSQL URI |
| `JWT_SECRET` | `eldersync-catalyst-jwt-secret-key-32chars` | Signs and verifies user session tokens |
| `PASSCODE_PEPPER` | `eldersync-pepper-v1-production` | Salt/pepper for SHA-256 invite hashing |
| `CRON_SECRET` | `eldersync-cron-authorization-secret` | Authenticates Vercel Cron requests |
| `RESEND_API_KEY` | `re_123456789...` | Real transactional email API key |
| `EMAIL_FROM` | `alerts@eldersync.app` | Verified sender email address |
| `ENABLE_DEMO_TIME_TRAVEL` | `true` | Allows judges to trigger fast-forward scheduler checks |

---

### Step 5: Deploy to Vercel
Deploy directly using the Vercel CLI or via GitHub integration:

```bash
# 1. Install Vercel CLI (if not already installed)
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Link project and deploy to production
vercel --prod
```

Upon completion, Vercel provides a production HTTPS URL:
`https://eldersync-catalyst.vercel.app`

---

## 2. The 5-Act Live Demo Script for Judges

When demonstrating ElderSync in an **Incognito Browser Window**, execute this 5-act flow to showcase every grading criterion in 3 minutes:

### Act 1 (Patient Autonomy & Medication Scheduling)
1. Navigate to the deployed Vercel URL (`https://your-project.vercel.app`).
2. Click **"Log in as Patient (Robert Vance, Age 74)"** on the landing page.
3. Show the senior-first design: large typography (min 18px), high-contrast toggle, and >=56px touch controls.
4. Click **"+ Add Medication"**: Add *Metformin 500mg*, instructions *"Take after meal with water"*, scheduled for the current time window.
5. Reload the page to prove **100% PostgreSQL persistence via Prisma**.

### Act 2 (Secure Passcode Care Circle)
1. In the Patient dashboard, navigate to the **"Care Circle & Privacy"** tab.
2. Select role `CAREGIVER` and click **"Generate Single-Use Passcode"**.
3. Note the generated 6-digit code (e.g. `482910`), pointing out the live 15-minute countdown clock and noting that only `sha256(code + pepper)` is persisted in PostgreSQL.
4. Open an Incognito window or switch persona to **"Log in as Caregiver (Nurse Sarah)"**.
5. Click **"Join Care Circle"**, enter the 6-digit passcode, and submit.
6. The Caregiver is granted scoped access, and Robert's dashboard displays the newly joined caregiver in real time.

### Act 3 (Intelligence & Deterministic Escalation)
1. In the Patient view, leave the newly scheduled dose unconfirmed.
2. In the top navigation Judge Evaluation Bar, click **"Run Reminder Check Now"** (invoking `POST /api/scheduler/run-check` with simulated time past the 3-minute grace period).
3. The dose status transitions: `SCHEDULED` $\rightarrow$ `REMINDER_SENT` $\rightarrow$ `UNCONFIRMED_ESCALATED`.
4. Switch to the **Notification Log** tab or check email to show the real transactional escalation email delivered to the caregiver with idempotency lock (`esc_{doseId}`).

### Act 4 (Closed-Loop Caregiver Collaboration)
1. Switch to the Caregiver Dashboard.
2. The **Priority Escalation Queue** shows the unconfirmed dose alert at the top.
3. Click **"Acknowledge & Record Follow-Up"**.
4. Enter note: *"Spoke with Robert on phone — confirmed taking now with warm water."* Check *"Mark as Taken"*.
5. Submit and observe that the Patient and Caregiver dashboards synchronize immediately. Duplicate panic calls are prevented.

### Act 5 (Real Impact: Adherence Insights & Appointments)
1. Open the **"Adherence Insights"** tab.
2. Show the dynamic 7-day adherence gauge, time-of-day routine breakdown, and confirmation latency calculated straight from `dose_logs`.
3. Open the **"Appointments"** tab: View upcoming cardiologist appointments with scheduled email reminders.
4. Conclude by toggling **High Contrast Mode** and font scaling (`A++`) to highlight elderly-first design excellence.
