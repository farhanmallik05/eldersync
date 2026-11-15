import { z } from 'zod';

export type UserRole = 'PATIENT' | 'CAREGIVER' | 'FAMILY';

export interface User {
  uid: string;
  name: string;
  email: string;
  primaryRole: UserRole;
  createdAt: string;
}

export interface Patient {
  patientId: string;
  ownerUid: string;
  name: string;
  age: number;
  email: string;
  emergencyPhone: string;
  gracePeriodMinutes: number;
  highContrastDefault: boolean;
  createdAt: string;
}

export interface CareMemberPermissions {
  canViewSchedule: boolean;
  canManageMeds: boolean;
  canManageAppointments: boolean;
  receiveEscalationEmails: boolean;
}

export interface CareMember {
  id: string; // `${patientId}_${userId}`
  patientId: string;
  userId: string;
  memberName: string;
  memberEmail: string;
  role: 'CAREGIVER' | 'FAMILY';
  permissions: CareMemberPermissions;
  status: 'ACTIVE' | 'REVOKED';
  joinedAt: string;
}

export interface CareInvitation {
  inviteId: string;
  patientId: string;
  createdByUid: string;
  passcodeHash: string; // sha256(passcode + pepper)
  role: 'CAREGIVER' | 'FAMILY';
  permissions: CareMemberPermissions;
  expiresAt: string;
  used: boolean;
  usedByUid?: string;
  createdAt: string;
}

export interface Medication {
  medicineId: string;
  patientId: string;
  name: string;
  dosage: string;
  instructions: string;
  active: boolean;
  createdByUid: string;
  updatedAt: string;
}

export type TimeOfDayPeriod = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';

export interface Schedule {
  scheduleId: string;
  patientId: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  instructions: string;
  timeOfDay: string; // "09:00"
  periodLabel: TimeOfDayPeriod;
  gracePeriodMinutes: number;
  active: boolean;
}

export type DoseStatus =
  | 'SCHEDULED'
  | 'REMINDER_SENT'
  | 'TAKEN'
  | 'SKIPPED'
  | 'UNABLE'
  | 'UNCONFIRMED_ESCALATED'
  | 'ACKNOWLEDGED';

export interface DoseLog {
  doseId: string; // `${scheduleId}_${dateKey}`
  patientId: string;
  scheduleId: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  dateKey: string; // "YYYY-MM-DD"
  scheduledAt: string; // ISO
  graceDeadlineAt: string; // ISO
  status: DoseStatus;
  confirmedAt?: string;
  confirmedByUid?: string;
  confirmedByName?: string;
  patientNote?: string;
  acknowledgedAt?: string;
  acknowledgedByUid?: string;
  acknowledgedByName?: string;
  acknowledgementNote?: string;
}

export interface Appointment {
  appointmentId: string;
  patientId: string;
  doctorName: string;
  specialty: string;
  location: string;
  scheduledAt: string;
  notes: string;
  reminderSent: boolean;
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface NotificationRecord {
  idempotencyKey: string;
  patientId: string;
  recipientEmail: string;
  recipientRole: string;
  type: 'DOSE_REMINDER' | 'CAREGIVER_ESCALATION' | 'APPOINTMENT_REMINDER' | 'HELP_REQUEST';
  subject: string;
  bodyPreview: string;
  deliveryStatus: 'SENT' | 'FAILED';
  providerMessageId?: string;
  sentAt: string;
}

export interface AuditLog {
  logId: string;
  patientId: string;
  actorUid: string;
  actorName: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface AdherenceAnalytics {
  adherenceRate: number; // 0-100%
  totalDoses: number;
  takenCount: number;
  skippedCount: number;
  escalatedCount: number;
  disruptionSlot: TimeOfDayPeriod;
  avgConfirmationDelayMinutes: number;
}

// Zod validation schemas
export const CreatePatientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  age: z.number().int().min(1, 'Age must be valid'),
  emergencyPhone: z.string().min(5, 'Valid emergency phone required'),
  gracePeriodMinutes: z.number().int().min(1).max(120).default(3),
  highContrastDefault: z.boolean().optional().default(false),
});

export const CreateMedicationSchema = z.object({
  name: z.string().min(2, 'Medication name required'),
  dosage: z.string().min(1, 'Dosage required'),
  instructions: z.string().min(2, 'Instructions required'),
  timesOfDay: z.array(z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:mm format')).min(1),
  gracePeriodMinutes: z.number().int().min(1).max(120).optional(),
});

export const UpdateMedicationSchema = z.object({
  name: z.string().min(2).optional(),
  dosage: z.string().min(1).optional(),
  instructions: z.string().min(2).optional(),
  active: z.boolean().optional(),
  timesOfDay: z.array(z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/)).optional(),
});

export const ConfirmDoseSchema = z.object({
  status: z.enum(['TAKEN', 'SKIPPED', 'UNABLE']),
  patientNote: z.string().max(300).optional(),
});

export const AcknowledgeDoseSchema = z.object({
  acknowledgementNote: z.string().min(3, 'Note must be at least 3 characters'),
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
  passcode: z.string().length(6, 'Passcode must be a 6-digit number').regex(/^\d+$/),
});

export const UpdateCareMemberSchema = z.object({
  permissions: z.object({
    canViewSchedule: z.boolean().optional(),
    canManageMeds: z.boolean().optional(),
    canManageAppointments: z.boolean().optional(),
    receiveEscalationEmails: z.boolean().optional(),
  }).optional(),
  status: z.enum(['ACTIVE', 'REVOKED']).optional(),
});

export const CreateAppointmentSchema = z.object({
  doctorName: z.string().min(2, 'Doctor name required'),
  specialty: z.string().min(2, 'Specialty required'),
  location: z.string().min(2, 'Location required'),
  scheduledAt: z.string().datetime(),
  notes: z.string().default(''),
});

export const HelpRequestSchema = z.object({
  message: z.string().max(500).optional(),
});

export const SchedulerCheckSchema = z.object({
  simulatedNowIso: z.string().datetime().optional(),
  patientId: z.string().optional(),
});
