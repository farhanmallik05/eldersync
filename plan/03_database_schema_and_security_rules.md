# 03 — PostgreSQL Database Schema & Prisma ORM Specification

## 1. Relational Database Overview

ElderSync utilizes 10 core PostgreSQL tables managed via **Prisma ORM**, engineered for strict patient ownership, role-based access control, relational integrity, and auditability.

```text
PostgreSQL Schema (via Prisma)
├── users               # Global user credentials and identities (Patient, Caregiver, Family)
├── patients            # Patient health profiles, autonomy settings, and timezone
├── care_members        # Active or revoked members of a patient's Care Circle
├── care_invitations    # Cryptographically hashed, expiring single-use passcodes
├── medications         # Medication master records
├── schedules           # Daily recurring time slots per medication
├── dose_logs           # Daily materialized dose logs with adherence state
├── appointments        # Upcoming and past doctor visits
├── notifications       # Idempotent outbox & sent email log
└── audit_logs          # Immutable record of all Care Circle operations
```

---

## 2. Production `prisma/schema.prisma`

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  PATIENT
  CAREGIVER
  FAMILY
}

enum MemberStatus {
  ACTIVE
  REVOKED
}

enum PeriodLabel {
  MORNING
  AFTERNOON
  EVENING
  NIGHT
}

enum DoseStatus {
  SCHEDULED
  REMINDER_SENT
  TAKEN
  SKIPPED
  UNABLE
  UNCONFIRMED_ESCALATED
  ACKNOWLEDGED
}

enum AppointmentStatus {
  UPCOMING
  COMPLETED
  CANCELLED
}

enum NotificationType {
  DOSE_REMINDER
  CAREGIVER_ESCALATION
  APPOINTMENT_REMINDER
  HELP_REQUEST
}

enum DeliveryStatus {
  SENT
  FAILED
}

model User {
  id           String        @id @default(cuid())
  email        String        @unique
  name         String
  passwordHash String
  primaryRole  Role          @default(PATIENT)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  patients     Patient[]     @relation("PatientOwner")
  careMembers  CareMember[]

  @@map("users")
}

model Patient {
  id                  String           @id @default(cuid())
  ownerUid            String
  name                String
  age                 Int
  email               String
  emergencyPhone      String
  gracePeriodMinutes  Int              @default(3)
  highContrastDefault Boolean          @default(false)
  timezone            String           @default("Asia/Kolkata")
  createdAt           DateTime         @default(now())
  updatedAt           DateTime         @updatedAt

  owner               User             @relation("PatientOwner", fields: [ownerUid], references: [id], onDelete: Cascade)
  careMembers         CareMember[]
  careInvitations     CareInvitation[]
  medications         Medication[]
  schedules           Schedule[]
  doseLogs            DoseLog[]
  appointments        Appointment[]
  notifications       Notification[]
  auditLogs           AuditLog[]

  @@index([ownerUid])
  @@map("patients")
}

model CareMember {
  id                      String        @id @default(cuid())
  patientId               String
  userId                  String
  memberName              String
  memberEmail             String
  role                    Role
  canViewSchedule         Boolean       @default(true)
  canManageMeds           Boolean       @default(false)
  canManageAppointments   Boolean       @default(false)
  receiveEscalationEmails Boolean       @default(true)
  status                  MemberStatus  @default(ACTIVE)
  joinedAt                DateTime      @default(now())

  patient                 Patient       @relation(fields: [patientId], references: [id], onDelete: Cascade)
  user                    User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([patientId, userId])
  @@index([patientId])
  @@index([userId])
  @@map("care_members")
}

model CareInvitation {
  id                      String    @id @default(cuid())
  patientId               String
  createdByUid            String
  passcodeHash            String
  role                    Role
  canViewSchedule         Boolean   @default(true)
  canManageMeds           Boolean   @default(false)
  canManageAppointments   Boolean   @default(false)
  receiveEscalationEmails Boolean   @default(true)
  expiresAt               DateTime
  used                    Boolean   @default(false)
  usedByUid               String?
  createdAt               DateTime  @default(now())

  patient                 Patient   @relation(fields: [patientId], references: [id], onDelete: Cascade)

  @@index([patientId])
  @@index([passcodeHash])
  @@map("care_invitations")
}

model Medication {
  id           String      @id @default(cuid())
  patientId    String
  name         String
  dosage       String
  instructions String
  active       Boolean     @default(true)
  createdByUid String
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  patient      Patient     @relation(fields: [patientId], references: [id], onDelete: Cascade)
  schedules    Schedule[]
  doseLogs     DoseLog[]

  @@index([patientId])
  @@map("medications")
}

model Schedule {
  id                 String      @id @default(cuid())
  patientId          String
  medicineId         String
  medicineName       String
  dosage             String
  instructions       String
  timeOfDay          String      // "HH:mm" (24-hour format)
  periodLabel        PeriodLabel
  gracePeriodMinutes Int         @default(3)
  active             Boolean     @default(true)
  createdAt          DateTime    @default(now())

  patient            Patient     @relation(fields: [patientId], references: [id], onDelete: Cascade)
  medicine           Medication  @relation(fields: [medicineId], references: [id], onDelete: Cascade)
  doseLogs           DoseLog[]

  @@index([patientId])
  @@index([medicineId])
  @@map("schedules")
}

model DoseLog {
  id                  String      @id // Deterministic ID: `${scheduleId}_${dateKey}`
  patientId           String
  scheduleId          String
  medicineId          String
  medicineName        String
  dosage              String
  dateKey             String      // "YYYY-MM-DD"
  scheduledAt         DateTime
  graceDeadlineAt     DateTime
  status              DoseStatus  @default(SCHEDULED)
  
  // Confirmation details
  confirmedAt         DateTime?
  confirmedByUid      String?
  confirmedByName     String?
  patientNote         String?

  // Caregiver acknowledgement details
  acknowledgedAt      DateTime?
  acknowledgedByUid   String?
  acknowledgedByName  String?
  acknowledgementNote String?

  patient             Patient     @relation(fields: [patientId], references: [id], onDelete: Cascade)
  schedule            Schedule    @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  medicine            Medication  @relation(fields: [medicineId], references: [id], onDelete: Cascade)

  @@index([patientId])
  @@index([dateKey])
  @@index([status])
  @@map("dose_logs")
}

model Appointment {
  id           String            @id @default(cuid())
  patientId    String
  doctorName   String
  specialty    String
  location     String
  scheduledAt  DateTime
  notes        String            @default("")
  reminderSent Boolean           @default(false)
  status       AppointmentStatus @default(UPCOMING)
  createdAt    DateTime          @default(now())

  patient      Patient           @relation(fields: [patientId], references: [id], onDelete: Cascade)

  @@index([patientId])
  @@map("appointments")
}

model Notification {
  idempotencyKey    String           @id // e.g. "rem_dose123", "esc_dose123"
  patientId         String
  recipientEmail    String
  recipientRole     String
  type              NotificationType
  subject           String
  bodyPreview       String
  deliveryStatus    DeliveryStatus   @default(SENT)
  providerMessageId String?
  sentAt            DateTime         @default(now())

  patient           Patient          @relation(fields: [patientId], references: [id], onDelete: Cascade)

  @@index([patientId])
  @@map("notifications")
}

model AuditLog {
  id        String   @id @default(cuid())
  patientId String
  actorUid  String
  actorName String
  action    String
  details   String
  timestamp DateTime @default(now())

  patient   Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)

  @@index([patientId])
  @@map("audit_logs")
}
```

---

## 3. Server-Side RBAC & Security Enforcement Specification

In place of client-facing database security rules, all data access in ElderSync is secured at the server API layer:

1. **Authentication Layer (`requireAuth`)**:
   - Parses the `Authorization: Bearer <token>` header.
   - Verifies the signature with `JWT_SECRET`.
   - In demo mode, validates signed demo tokens (`demo-patient`, `demo-caregiver`, `demo-family`).
2. **Patient Ownership Layer (`requirePatientOwner`)**:
   - Verifies that `patient.ownerUid === req.user.id`.
   - Strictly required for: invite generation, permission modifications, member revocations, and profile updates.
3. **Role & Permission Scoping Layer (`requirePermission(flag)`)**:
   - Verifies that the caller is either the Patient Owner OR an active Care Member (`status === 'ACTIVE'`) with the specific permission flag (`canManageMeds`, `canManageAppointments`, `receiveEscalationEmails`).
4. **Brute-Force Rate Limiting**:
   - `POST /api/care-circle/join` is gated behind `express-rate-limit` allowing a maximum of 5 attempts per 15 minutes per IP/User to protect 6-digit invitation passcodes.
5. **Atomic Transactions**:
   - Passcode redemptions and caregiver alert acknowledgements execute inside `prisma.$transaction()` to guarantee zero race conditions.
