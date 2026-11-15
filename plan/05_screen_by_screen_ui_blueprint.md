# 05 — Screen-by-Screen UI Blueprint & Design System

## 1. Design System Tokens & Healthcare Styling

ElderSync uses an accessible, modern healthcare aesthetic inspired by shadcn/ui and Tailwind CSS. The design guarantees WCAG AAA compliance (>= 7:1 contrast ratio) with high-contrast accessibility options.

### Color Palette Tokens
| Token Name | Hex Code | Tailwind Equivalent | Purpose / Application |
|---|---|---|---|
| **Canvas Background** | `#F8FAFC` | `bg-slate-50` | Soft, glare-free background for long viewing |
| **Surface Cards** | `#FFFFFF` | `bg-white border-slate-200` | Elevated content containers with subtle shadow |
| **Primary Navy** | `#0F172A` | `text-slate-900 bg-slate-900` | Primary brand color, headers, navigation bars |
| **Clinical Teal** | `#0D9488` | `text-teal-600 bg-teal-600` | Interactive accents, active navigation states, badges |
| **Semantic Emerald** | `#16A34A` | `bg-emerald-50 text-emerald-800 border-emerald-300` | Dose Taken / Verified healthy state |
| **Semantic Amber** | `#D97706` | `bg-amber-50 text-amber-900 border-amber-300` | Due dose / Grace period elapsed |
| **Semantic Crimson** | `#DC2626` | `bg-red-50 text-red-900 border-red-300` | Unconfirmed Escalated alert / Immediate help request |

### Typography & Touch Targets
- **Font Families**: Inter or Plus Jakarta Sans.
- **Patient View Body Text**: Minimum `18px` (`text-lg`) for effortless readability without eye strain.
- **Patient Interactive Controls**: Minimum `56px` height (`min-h-14` / `h-14` or `h-16`) with wide touch padding.
- **Accessibility Scaler**:
  - `A`: Standard text size (18px base).
  - `A+`: Enlarged text (+20%, 22px base).
  - `A++`: Extra-large text (+40%, 25px base).
- **High Contrast Toggle**: Switches background to pure high-contrast `#000000` / `#FFFFFF` with thick borders and high-visibility yellow/cyan badges.

---

## 2. Screen Architecture (Role-Aware Unified Workspace)

### Screen 1: Landing & Authentication Screen (`/`, `/login`)
- **Hero Section**: "ElderSync — Patient-Centred Medication Adherence & Collaborative Care Circle". Clear healthcare mission framing and security promise.
- **1-Click Quick Demo Sign-In Bar (Judge Friendly)**:
  - Button 1: **"Log in as Patient (Rohit Sharma, Age 74)"** — immediately loads the full patient experience.
  - Button 2: **"Log in as Caregiver (Nurse Priya Sharma)"** — loads the caregiver escalation view.
  - Button 3: **"Log in as Family Member (Ravi Sharma, Son)"** — loads the family circle overview.
- **Standard Auth**: Email/Password login and Google Sign-In options.
- **Onboarding Flow**: New users select their primary persona: "I am an Elderly Patient managing my health" or "I am a Caregiver / Family Member joining a Care Circle".

### Screen 2: Persistent Top Navigation & Judge Evaluation Bar
- **Left**: ElderSync clinical logo + Active Patient Context chip (`Patient: Robert Vance (74)`).
- **Center**: Navigation Tabs:
  1. *My Schedule* (or *Patient Schedule*)
  2. *Medications & Prescriptions*
  3. *Appointments*
  4. *Care Circle & Privacy*
  5. *Adherence Insights*
- **Right**:
  - **Accessibility Scaler**: `A` | `A+` | `A++` toggle + High Contrast toggle (`Contrast: OFF/ON`).
  - **Live Demo Trigger Bar**:
    - **"Run Reminder Check Now"** button: Triggers `POST /api/scheduler/run-check` instantly so judges don't need to wait for the 2-minute cron.
    - **"Join via Passcode"** button: Opens modal to enter 6-digit invitation passcode.
    - **Current User Badge**: Shows active role and user email with Logout option.

### Screen 3: Experience A — Elderly Patient Dashboard (Primary View)
- **Top Autonomy & Help Bar**:
  - Live status indicator: *"Shared with 2 authorized members — You control access"* with direct link to Privacy & Permissions.
  - Prominent red/white **"Request Assistance"** button (56px height): Dispatches instant email alert to all caregivers with 1 click.
- **Today's Medication Schedule (Hero Grid)**:
  - Sorted chronologically into: Morning (06:00-11:59), Afternoon (12:00-16:59), Evening (17:00-20:59), Night (21:00-05:59).
  - Each Dose Card features:
    - Medicine Name (22px bold text)
    - Dosage & Instructions (`"500mg — Take after breakfast with water"`)
    - Scheduled Time & Grace Deadline (`"Scheduled: 09:00 AM | Grace until 09:03 AM"`)
    - Status Badge: `SCHEDULED` (Amber), `TAKEN` (Emerald), `SKIPPED` (Slate), `UNABLE` (Red), or `UNCONFIRMED_ESCALATED` (Red flashing).
  - **3 Large Touch Controls (`min-h-14`)**:
    1. **"I Took This Medicine"** (Solid Emerald `#16A34A` button): 1-tap confirmation with immediate tactile feedback.
    2. **"Skip for Now"** (Outline Slate button): Opens lightweight modal to pick reason ("Already took earlier", "Doctor advised hold", "Feeling nauseous", "Other").
    3. **"Unable to Take / Need Help"** (Solid Red button): Immediately alerts caregiver with note.
- **Upcoming Appointments Card**: Next 3 scheduled visits with doctor name, clinic address, and `+ Add Appointment` button.

### Screen 4: Experience B — Caregiver Dashboard
- **Priority Escalation Queue (`aria-live="polite"`)**:
  - Floats to top whenever an `UNCONFIRMED_ESCALATED` dose or `HELP_REQUESTED` event is active.
  - Banner: *"Unconfirmed Dose: Metformin 500mg (Scheduled 09:00 AM — Grace period elapsed at 09:03 AM). Note: Alert indicates dose is unconfirmed, not confirmed missed."*
  - **"Acknowledge & Record Follow-Up"** action button:
    - Opens modal to enter resolution: *"Called Papa — confirmed he took it at 9:05 AM"*.
    - Option to mark dose as confirmed `TAKEN`.
    - Logs caregiver UID, name, and timestamp in `auditLogs` and updates `doseLogs.status = 'ACKNOWLEDGED'`.
- **Co-Management Panels**:
  - If patient granted `canManageMeds`: Caregiver can add, edit, or adjust dosages.
  - If patient granted `canManageAppointments`: Caregiver can book, reschedule, or cancel doctor appointments.
- **Live Activity Feed**: Chronological stream of confirmations, sent reminders, and escalations.

### Screen 5: Experience C — Family Care Circle & Privacy Dashboard
- **Patient-Controlled Permission Matrix**:
  - Displays each member with role and toggles:
    - `canViewSchedule` (read-only calendar)
    - `canManageMeds` (can create or modify drugs)
    - `canManageAppointments` (can edit doctor visits)
    - `receiveEscalationEmails` (receives emergency escalation alerts)
  - **"Revoke Access"** button: Strictly restricted to the patient owner.
- **Secure Passcode Generator Card**:
  - Patient selects role to invite (`CAREGIVER` or `FAMILY`).
  - Clicks **"Generate Single-Use Passcode"**.
  - Displays a large, clear 6-digit code (e.g., `4 8 2 9 1 0`) with live 15-minute countdown clock and "Copy Code" button.
- **Adherence & Routine Insights Panel**:
  - 7-Day Adherence Gauge / Percentage Card.
  - Time-of-Day Routine Pattern Card (identifies whether Morning or Evening has higher slip rates).
  - Average Confirmation Delay Metric.
- **Audit Log Table**: Immutable history table showing Timestamp, Actor, Action, and Details.
