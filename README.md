# ElderSync — Patient-Centred Medication Adherence & Collaborative Care Circle

[![PromptWars × Catalyst](https://img.shields.io/badge/Competition-PromptWars%20%C3%97%20Catalyst%20Round%202-0D9488?style=for-the-badge)](https://makersneedmore.com)
[![Engineered with Antigravity](https://img.shields.io/badge/Built%20With-Google%20Antigravity%20IDE-4285F4?style=for-the-badge&logo=google)](https://antigravity.google)
[![Tests Passing](https://img.shields.io/badge/Tests-TC--01%20to%20TC--06%20Passing-16A34A?style=for-the-badge)](./tests/eldersync.test.ts)
[![License: MIT](https://img.shields.io/badge/License-MIT-0F172A?style=for-the-badge)](./LICENSE)

ElderSync is an autonomous, patient-primary elderly healthcare and medication adherence SaaS platform built for **PromptWars × Catalyst Round 2**.

Unlike conventional medication reminders that rely on passive phone notifications, ElderSync gives elderly individuals complete ownership over their health profiles, establishes deterministic server-side escalation when doses remain unconfirmed past a grace period, and coordinates care circles using expiring, single-use, cryptographically hashed passcodes.

---

## 🌟 Key Features & Problem-Solution Alignment

1. **Patient-Primary Autonomy**: The elderly patient owns their profile, sets preferences, configures grace periods (default 3 min for demo, 5–120 min configurable), confirms doses, and controls/revokes access permissions.
2. **1-Tap Accessible Dose Confirmations**: Minimum 18px body typography, `>= 56px` touch targets, WCAG AAA high contrast mode, and 1-tap `Taken`, `Skipped` (with reason), or `Unable to Take` actions.
3. **Deterministic Escalation Engine**: Server-side Cloud Scheduler scans due doses. If unconfirmed past the grace deadline, it dispatches transactional email alerts with deterministic idempotency keys (`esc_${doseId}`) to prevent duplicate alerts.
4. **Closed-Loop Caregiver Acknowledgement**: Caregivers acknowledge escalated alerts and record notes live in the shared timeline, preventing conflicting phone calls and duplicate panics.
5. **Secure Passcode Care Circle**: Patients invite caregivers and family using single-use 6-digit numeric passcodes hashed with SHA-256 + salt/pepper, expiring in 15 minutes.
6. **Doctor Appointments & Reminders**: Doctor visit scheduling with 24-hour proactive email reminders.
7. **Real 7-Day Adherence Analytics**: Calculated directly from real `doseLogs`, surfacing adherence %, time-of-day disruption slots, and confirmation latency.
8. **Judge Evaluation Mode**: 1-click quick demo logins (Patient, Caregiver, Family) and a live **"Run Reminder Check Now"** demo trigger.

---

## 🏗️ Architecture & Technology Stack

```text
catalyst/
├── backend/            # Express, TypeScript, Zod, Idempotent Email Engine
│   └── src/
│       ├── config/     # Database store & seeded demo accounts
│       ├── middleware/ # Auth verification & RBAC permissions
│       ├── routes/     # Patients, Meds, Doses, CareCircle, Appointments, Scheduler
│       └── services/   # EmailService, AnalyticsService
├── frontend/           # React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
│   └── src/
│       ├── components/ # ScheduleDoseCard, CaregiverQueue, CareCircleMatrix, Analytics
│       ├── context/    # AuthContext, WorkspaceContext, AccessibilityContext
│       └── views/      # PatientDashboard, CaregiverDashboard, FamilyDashboard, LandingView
├── tests/              # Vitest & Supertest suite (TC-01 through TC-06)
├── plan/               # Vibe coding master planning markdown specifications
├── docs/               # Architecture diagrams and specifications
├── firestore.rules     # Production Cloud Firestore security rules
├── Dockerfile          # Single-container production build for Cloud Run (PORT 8080)
├── vercel.json         # Vercel serverless deployment configuration
└── PROMPT_LOG.md       # AI-assisted engineering prompt log
```

---

## ⚡ Quick Start & Local Execution

### Prerequisites
- Node.js v18+ (tested on v20 & v24)
- npm v9+

### 1. Install Dependencies
```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 2. Run in Development Mode
```bash
# Runs both backend (port 8080) and frontend (port 5173 with proxy)
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Run Automated Integration Tests (TC-01 to TC-06)
```bash
npm test
```

### 4. Build for Production
```bash
npm run build
npm start
```
The unified Express server serves both the REST API and the compiled frontend SPA from `frontend/dist` on port 8080.

---

## 🧪 Verification Test Matrix (`tests/eldersync.test.ts`)

| Test ID | Scenario | Expected Assertion |
|---|---|---|
| **TC-01** | Passcode Hashing & Single-Use | 1st redemption returns 200 OK; 2nd redemption returns 400 Bad Request; plain code never stored. |
| **TC-02** | Expired Passcode Rejection | Passcode with `expiresAt < Date.now()` returns 400 Bad Request. |
| **TC-03** | Patient Autonomy RBAC | Revoked `canManageMeds` permission returns 403 Forbidden on medication mutation. |
| **TC-04** | Idempotent Notification Locks | Running scheduler check consecutively past grace period creates exactly 1 escalation record. |
| **TC-05** | Caregiver Acknowledgement | Caregiver acknowledges escalated dose; status updates to ACKNOWLEDGED with audit entry. |
| **TC-06** | Real Analytics Calculation | 8 TAKEN, 1 SKIPPED, 1 ESCALATED returns 80% adherence rate and flags EVENING disruption window. |

---

## 🎭 5-Act Live Demo Guide for Judges (Incognito Window)

1. **Act 1 (Patient Autonomy)**: Open the app, click **"Patient (Robert Vance)"**, add a medication due now, and reload to verify persistence.
2. **Act 2 (Care Circle Passcode)**: In "Care Circle & Privacy", click **"Generate Single-Use Passcode"** (large 6-digit code with 15m countdown). In a second session as Caregiver, join using the passcode.
3. **Act 3 (Intelligence & Escalation)**: Leave the dose unconfirmed past the 3-minute grace period. Click **"Run Reminder Check Now"** in the top bar. The dose transitions to `UNCONFIRMED_ESCALATED` and dispatches an idempotent escalation alert.
4. **Act 4 (Collaboration)**: In the Caregiver view, open the **Priority Escalation Queue**, click **"Acknowledge & Record Follow-Up"**, enter notes, and confirm. All views synchronize immediately.
5. **Act 5 (Impact & Accessibility)**: Open **Adherence Insights** to view real computed metrics. Toggle **High Contrast Mode** and font scaling (`A++`) to show elderly-first healthcare accessibility.

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.
