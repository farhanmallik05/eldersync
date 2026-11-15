export type UserRole = 'PATIENT' | 'CAREGIVER' | 'FAMILY';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
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
  id: string;
  patientId: string;
  userId: string;
  memberName: string;
  memberEmail: string;
  role: 'CAREGIVER' | 'FAMILY';
  permissions: CareMemberPermissions;
  status: 'ACTIVE' | 'REVOKED';
  joinedAt: string;
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
  timeOfDay: string;
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
  doseId: string;
  patientId: string;
  scheduleId: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  dateKey: string;
  scheduledAt: string;
  graceDeadlineAt: string;
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
  adherenceRate: number;
  totalDoses: number;
  takenCount: number;
  skippedCount: number;
  escalatedCount: number;
  disruptionSlot: TimeOfDayPeriod;
  avgConfirmationDelayMinutes: number;
}

export interface WorkspaceData {
  patient: Patient;
  todayDoseLogs: DoseLog[];
  medications: Medication[];
  schedules: Schedule[];
  appointments: Appointment[];
  careMembers: CareMember[];
  notifications: NotificationRecord[];
  auditLogs: AuditLog[];
  analytics: AdherenceAnalytics;
}

export interface CreateMedicationPayload {
  name: string;
  dosage: string;
  instructions: string;
  timesOfDay: string[];
  gracePeriodMinutes?: number;
}

export interface CreateAppointmentPayload {
  doctorName: string;
  specialty: string;
  location: string;
  scheduledAt: string;
  notes?: string;
}

export interface SchedulerCheckResult {
  success: boolean;
  simulatedNow?: string;
  remindersSent?: number;
  escalationsSent?: number;
  appointmentRemindersSent?: number;
  message?: string;
}

export interface UpdatePatientPayload {
  name?: string;
  age?: number;
  emergencyPhone?: string;
  gracePeriodMinutes?: number;
  highContrastDefault?: boolean;
}
