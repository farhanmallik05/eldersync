# 04 — Backend API Specification & Security Middleware (Vercel Edition)

## 1. Authentication & Security Middleware

All API endpoints (except `/api/health`, `/api/auth/*`, and `/api/scheduler/run-check` when invoked with the Vercel Cron secret) require an HTTP Authorization header:
```http
Authorization: Bearer <JWT_Token>
```

### Security Pipeline
1. **Helmet & CORS**: Protect headers and allow trusted origin.
2. **Auth Middleware (`backend/src/middleware/auth.ts`)**:
   - Parses `Bearer` token.
   - Verifies against `JWT_SECRET` (`jsonwebtoken.verify(token, secret)`).
   - In demo/testing mode, supports signed demo session tokens (`demo-patient-token`, `demo-caregiver-token`, `demo-family-token`) for instant judge and automated grading evaluation.
3. **RBAC Middleware (`backend/src/middleware/rbac.ts`)**:
   - Validates that the requesting user is either:
     - The **Patient Owner** (`patient.ownerUid == req.user.id`).
     - An **Active Care Member** (`careMembers.find(m => m.userId === req.user.id && m.status === 'ACTIVE')`) with the required granular permission flag (`canManageMeds`, `canManageAppointments`, etc.).
4. **Brute-Force Rate Limiting (`backend/src/middleware/rateLimiter.ts`)**:
   - Protects `POST /api/care-circle/join` using `express-rate-limit` (maximum 5 attempts per 15 minutes per IP).
5. **Zod Validation Middleware**:
   - Strictly validates request bodies before controller execution. Invalid payloads return `400 Bad Request` with structured error details.

---

## 2. API Endpoint Matrix

| Method & Path | Access Control | Request Body (Zod Validated) | Action & Side Effects |
|---|---|---|---|
| `GET /api/health` | Public | None | Verifies Express server on Vercel, PostgreSQL connection via Prisma, and email configuration; returns 200 OK. |
| `POST /api/auth/register` | Public | `{ name, email, password, primaryRole }` | Hashes password with bcrypt, creates `User` record in PostgreSQL, returns JWT token. |
| `POST /api/auth/login` | Public | `{ email, password }` | Validates credentials, returns JWT token and user profile. |
| `POST /api/auth/demo-login` | Public | `{ role: 'PATIENT' \| 'CAREGIVER' \| 'FAMILY' }` | Generates instant signed demo session token for 1-click evaluator access. |
| `POST /api/patients` | Authenticated User | `{ name, age, emergencyPhone, gracePeriodMinutes, highContrastDefault?, timezone? }` | Creates `Patient` record + user role assignment + logs `PATIENT_PROFILE_CREATED` in `AuditLog`. |
| `GET /api/patients/:patientId/workspace` | Patient Owner or Active Care Member | None | Returns full workspace: patient profile, today's `DoseLog` records (auto-materializing today's schedules idempotently), medications, appointments, careMembers, notifications outbox, and 7-day adherence analytics. |
| `POST /api/patients/:patientId/medications` | Patient Owner or Member with `canManageMeds` | `{ name, dosage, instructions, timesOfDay: string[], gracePeriodMinutes? }` | Creates `Medication` record, creates `Schedule` records for each time slot, materializes today's `DoseLog` entries, writes `AuditLog`. |
| `PUT /api/patients/:patientId/medications/:medicineId` | Patient Owner or Member with `canManageMeds` | `{ name, dosage, instructions, active, timesOfDay }` | Updates medication record and synchronizes recurring schedules, writes `AuditLog`. |
| `DELETE /api/patients/:patientId/medications/:medicineId` | Patient Owner or Member with `canManageMeds` | None | Soft-deactivates medication (`active: false`) and future schedule slots, writes `AuditLog`. |
| `POST /api/doses/:doseId/confirm` | Patient Owner or Member with `canManageMeds` | `{ status: 'TAKEN' \| 'SKIPPED' \| 'UNABLE', patientNote? }` | Updates `DoseLog` status & `confirmedAt`. If `UNABLE`, immediately dispatches caregiver alert email (idempotencyKey = `unable_${doseId}`). |
| `POST /api/doses/:doseId/acknowledge` | Active Caregiver (`receiveEscalationEmails` or `canManageMeds`) | `{ acknowledgementNote, markAsTaken?: boolean }` | Transitions `UNCONFIRMED_ESCALATED` dose to `ACKNOWLEDGED` (or `TAKEN` if confirmed verbally) inside an atomic transaction, records `acknowledgedByName` & `acknowledgedAt`, writes `AuditLog`. |
| `POST /api/patients/:patientId/invitations` | Patient Owner Only | `{ role: 'CAREGIVER' \| 'FAMILY', permissions }` | Generates CSPRNG 6-digit numeric passcode, stores `sha256(passcode + PEPPER)` with 15-min expiry in `CareInvitation`, returns plain passcode once to patient UI. |
| `POST /api/care-circle/join` | Authenticated User (Rate-Limited) | `{ patientId, passcode }` | Computes hash with `crypto.timingSafeEqual`, verifies `!used` and `expiresAt > now` inside a Prisma transaction; marks `used = true`, creates `CareMember` record, writes `AuditLog`. |
| `PATCH /api/patients/:patientId/care-members/:memberId` | Patient Owner Only | `{ permissions, status: 'ACTIVE' \| 'REVOKED' }` | Updates member permissions or revokes access immediately; writes `AuditLog`. |
| `POST /api/patients/:patientId/appointments` | Patient Owner or Member with `canManageAppointments` | `{ doctorName, specialty, location, scheduledAt, notes }` | Creates `Appointment` record and writes `AuditLog`. |
| `POST /api/patients/:patientId/help-request` | Patient Owner | `{ message? }` | Sends immediate high-priority email to all active Care Circle members and logs in `Notification` + `AuditLog`. |
| `POST /api/scheduler/run-check` | Vercel Cron or Authenticated User | `{ simulatedNowIso?: string, patientId?: string }` | Idempotently scans due `DoseLog` records and upcoming appointments within 24h: Transitions `SCHEDULED` -> `REMINDER_SENT` -> `UNCONFIRMED_ESCALATED` past grace period, sending idempotent emails. |
| `POST /api/demo/seed` | Public | None | Idempotently seeds demo patient (Robert Vance), caregiver (Nurse Sarah), medications, and dose logs so evaluators have a ready-to-test workspace. |

---

## 3. Zod Schemas

```typescript
import { z } from 'zod';

export const RegisterUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  primaryRole: z.enum(['PATIENT', 'CAREGIVER', 'FAMILY']).default('PATIENT'),
});

export const LoginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const CreatePatientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.number().int().min(1, "Age must be valid"),
  emergencyPhone: z.string().min(7, "Phone number required"),
  gracePeriodMinutes: z.number().int().min(1).max(120).default(3),
  highContrastDefault: z.boolean().optional().default(false),
  timezone: z.string().default("Asia/Kolkata"),
});

export const CreateMedicationSchema = z.object({
  name: z.string().min(2),
  dosage: z.string().min(1),
  instructions: z.string().min(3),
  timesOfDay: z.array(z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid HH:mm format")).min(1),
  gracePeriodMinutes: z.number().int().min(1).max(120).optional(),
});

export const ConfirmDoseSchema = z.object({
  status: z.enum(['TAKEN', 'SKIPPED', 'UNABLE']),
  patientNote: z.string().max(300).optional(),
});

export const AcknowledgeDoseSchema = z.object({
  acknowledgementNote: z.string().min(3, "Note must be at least 3 characters"),
  markAsTaken: z.boolean().optional().default(false),
});

export const CreateInvitationSchema = z.object({
  role: z.enum(['CAREGIVER', 'FAMILY']),
  permissions: z.object({
    canViewSchedule: z.boolean().default(true),
    canManageMeds: z.boolean().default(false),
    canManageAppointments: z.boolean().default(false),
    receiveEscalationEmails: z.boolean().default(true),
  }),
});

export const JoinCareCircleSchema = z.object({
  patientId: z.string().min(1),
  passcode: z.string().length(6, "Passcode must be a 6-digit number").regex(/^\d+$/),
});

export const CreateAppointmentSchema = z.object({
  doctorName: z.string().min(2),
  specialty: z.string().min(2),
  location: z.string().min(2),
  scheduledAt: z.string().datetime(),
  notes: z.string().default(""),
});
```
