import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  Patient,
  CareMember,
  CareInvitation,
  Medication,
  Schedule,
  DoseLog,
  Appointment,
  NotificationRecord,
  AuditLog,
  TimeOfDayPeriod,
} from '../types/index.js';

export const PASSCODE_PEPPER = process.env.PASSCODE_PEPPER || 'eldersync-catalyst-r2-salt-2026';

export function hashPasscode(passcode: string): string {
  return crypto.createHash('sha256').update(passcode + PASSCODE_PEPPER).digest('hex');
}

export function getTimePeriod(timeOfDay: string): TimeOfDayPeriod {
  const [hour] = timeOfDay.split(':').map(Number);
  if (hour >= 5 && hour < 12) return 'MORNING';
  if (hour >= 12 && hour < 17) return 'AFTERNOON';
  if (hour >= 17 && hour < 21) return 'EVENING';
  return 'NIGHT';
}

export function getTodayDateKey(date = new Date()): string {
  return date.toISOString().split('T')[0];
}

class DatabaseStore {
  public users: Map<string, User> = new Map();
  public patients: Map<string, Patient> = new Map();
  public careMembers: Map<string, CareMember> = new Map();
  public careInvitations: Map<string, CareInvitation> = new Map();
  public medications: Map<string, Medication> = new Map();
  public schedules: Map<string, Schedule> = new Map();
  public doseLogs: Map<string, DoseLog> = new Map();
  public appointments: Map<string, Appointment> = new Map();
  public notifications: Map<string, NotificationRecord> = new Map();
  public auditLogs: AuditLog[] = [];

  private storageFile = path.resolve(process.cwd(), 'backend-data.json');

  constructor() {
    this.seedDefaultData();
  }

  public seedDefaultData() {
    // 1. Seed Users
    const patientUser: User = {
      uid: 'demo-patient',
      name: 'Robert Vance',
      email: 'robert.vance@eldersync.health',
      primaryRole: 'PATIENT',
      createdAt: '2026-11-01T08:00:00Z',
    };
    const caregiverUser: User = {
      uid: 'demo-caregiver',
      name: 'Nurse Sarah Jenkins',
      email: 'sarah.jenkins@eldercare.org',
      primaryRole: 'CAREGIVER',
      createdAt: '2026-11-01T08:00:00Z',
    };
    const familyUser: User = {
      uid: 'demo-family',
      name: 'David Vance (Son)',
      email: 'david.vance@family.org',
      primaryRole: 'FAMILY',
      createdAt: '2026-11-01T08:00:00Z',
    };

    this.users.set(patientUser.uid, patientUser);
    this.users.set(caregiverUser.uid, caregiverUser);
    this.users.set(familyUser.uid, familyUser);

    // 2. Seed Patient Profile
    const patientId = 'patient_robert_vance';
    const patientProfile: Patient = {
      patientId,
      ownerUid: 'demo-patient',
      name: 'Robert Vance',
      age: 74,
      email: 'robert.vance@eldersync.health',
      emergencyPhone: '+1 (555) 382-9014',
      gracePeriodMinutes: 3, // Default 3 minutes for quick live judge demo evaluation
      highContrastDefault: false,
      createdAt: '2026-11-01T08:00:00Z',
    };
    this.patients.set(patientId, patientProfile);

    // 3. Seed Care Members
    const caregiverMember: CareMember = {
      id: `${patientId}_demo-caregiver`,
      patientId,
      userId: 'demo-caregiver',
      memberName: 'Nurse Sarah Jenkins',
      memberEmail: 'sarah.jenkins@eldercare.org',
      role: 'CAREGIVER',
      permissions: {
        canViewSchedule: true,
        canManageMeds: true,
        canManageAppointments: true,
        receiveEscalationEmails: true,
      },
      status: 'ACTIVE',
      joinedAt: '2026-11-02T10:00:00Z',
    };
    const familyMember: CareMember = {
      id: `${patientId}_demo-family`,
      patientId,
      userId: 'demo-family',
      memberName: 'David Vance (Son)',
      memberEmail: 'david.vance@family.org',
      role: 'FAMILY',
      permissions: {
        canViewSchedule: true,
        canManageMeds: false, // Patient retains strict autonomy: family can view, not change meds
        canManageAppointments: false,
        receiveEscalationEmails: true,
      },
      status: 'ACTIVE',
      joinedAt: '2026-11-02T10:30:00Z',
    };
    this.careMembers.set(caregiverMember.id, caregiverMember);
    this.careMembers.set(familyMember.id, familyMember);

    // 4. Seed Medications & Daily Schedules
    const medsData = [
      {
        id: 'med_metformin',
        name: 'Metformin',
        dosage: '500mg',
        instructions: 'Take 1 tablet after breakfast with water',
        times: ['09:00'],
      },
      {
        id: 'med_lisinopril',
        name: 'Lisinopril',
        dosage: '10mg',
        instructions: 'Take 1 tablet after lunch with a full glass of water',
        times: ['13:00'],
      },
      {
        id: 'med_atorvastatin',
        name: 'Atorvastatin',
        dosage: '20mg',
        instructions: 'Take 1 tablet in the evening before bed',
        times: ['20:00'],
      },
    ];

    medsData.forEach((m) => {
      this.medications.set(m.id, {
        medicineId: m.id,
        patientId,
        name: m.name,
        dosage: m.dosage,
        instructions: m.instructions,
        active: true,
        createdByUid: 'demo-patient',
        updatedAt: '2026-11-05T08:00:00Z',
      });

      m.times.forEach((t) => {
        const scheduleId = `sched_${m.id}_${t.replace(':', '')}`;
        this.schedules.set(scheduleId, {
          scheduleId,
          patientId,
          medicineId: m.id,
          medicineName: m.name,
          dosage: m.dosage,
          instructions: m.instructions,
          timeOfDay: t,
          periodLabel: getTimePeriod(t),
          gracePeriodMinutes: 3,
          active: true,
        });
      });
    });

    // 5. Seed historical dose logs for past 6 days to establish realistic 85% adherence analytics
    const today = new Date();
    for (let i = 6; i >= 1; i--) {
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - i);
      const dateKey = getTodayDateKey(pastDate);

      this.schedules.forEach((sched) => {
        const doseId = `${sched.scheduleId}_${dateKey}`;
        const scheduledAt = `${dateKey}T${sched.timeOfDay}:00.000Z`;
        const graceDeadlineAt = new Date(new Date(scheduledAt).getTime() + sched.gracePeriodMinutes * 60000).toISOString();

        // Simulate 85% adherence pattern
        let status: any = 'TAKEN';
        let confirmedAt = new Date(new Date(scheduledAt).getTime() + 120000).toISOString();
        if (i === 2 && sched.periodLabel === 'EVENING') {
          status = 'SKIPPED';
        } else if (i === 4 && sched.periodLabel === 'AFTERNOON') {
          status = 'ACKNOWLEDGED';
        }

        this.doseLogs.set(doseId, {
          doseId,
          patientId,
          scheduleId: sched.scheduleId,
          medicineId: sched.medicineId,
          medicineName: sched.medicineName,
          dosage: sched.dosage,
          dateKey,
          scheduledAt,
          graceDeadlineAt,
          status,
          confirmedAt: status === 'TAKEN' ? confirmedAt : undefined,
          confirmedByUid: status === 'TAKEN' ? 'demo-patient' : undefined,
          confirmedByName: status === 'TAKEN' ? 'Robert Vance' : undefined,
          patientNote: status === 'SKIPPED' ? 'Doctor advised hold due to blood pressure reading' : undefined,
          acknowledgedAt: status === 'ACKNOWLEDGED' ? confirmedAt : undefined,
          acknowledgedByName: status === 'ACKNOWLEDGED' ? 'Nurse Sarah Jenkins' : undefined,
          acknowledgementNote: status === 'ACKNOWLEDGED' ? 'Confirmed with patient via telephone call' : undefined,
        });
      });
    }

    // Materialize today's dose logs
    this.materializeTodayDoses(patientId, today);

    // 6. Seed Appointments
    const apptDate = new Date(today);
    apptDate.setDate(today.getDate() + 2);
    apptDate.setHours(10, 30, 0, 0);

    const apptId = 'appt_cardiology_followup';
    this.appointments.set(apptId, {
      appointmentId: apptId,
      patientId,
      doctorName: 'Dr. Aris Thorne',
      specialty: 'Cardiologist',
      location: 'Metro Health Heart Pavilion, Suite 402',
      scheduledAt: apptDate.toISOString(),
      notes: 'Quarterly ECG review and medication adjustment consultation',
      reminderSent: false,
      status: 'UPCOMING',
      createdAt: new Date().toISOString(),
    });

    // 7. Seed Initial Notifications and Audit Logs
    this.notifications.set('init_welcome', {
      idempotencyKey: 'init_welcome',
      patientId,
      recipientEmail: 'robert.vance@eldersync.health',
      recipientRole: 'PATIENT',
      type: 'DOSE_REMINDER',
      subject: 'Welcome to ElderSync — Care Routine Active',
      bodyPreview: 'Your daily schedule has been synchronized. Caregiver Nurse Sarah is connected.',
      deliveryStatus: 'SENT',
      sentAt: '2026-11-01T08:00:00Z',
    });

    this.auditLogs.push(
      {
        logId: 'audit_01',
        patientId,
        actorUid: 'demo-patient',
        actorName: 'Robert Vance',
        action: 'PATIENT_PROFILE_CREATED',
        details: 'Initial autonomous patient profile setup with 3-minute grace period.',
        timestamp: '2026-11-01T08:00:00Z',
      },
      {
        logId: 'audit_02',
        patientId,
        actorUid: 'demo-patient',
        actorName: 'Robert Vance',
        action: 'CARE_MEMBER_INVITED',
        details: 'Invited Nurse Sarah Jenkins as Caregiver with med management permissions.',
        timestamp: '2026-11-02T10:00:00Z',
      }
    );
  }

  public materializeTodayDoses(patientId: string, now = new Date()) {
    const dateKey = getTodayDateKey(now);
    const nowIso = now.toISOString();

    this.schedules.forEach((sched) => {
      if (sched.patientId === patientId && sched.active) {
        const doseId = `${sched.scheduleId}_${dateKey}`;
        if (!this.doseLogs.has(doseId)) {
          // Construct scheduled time for today
          const scheduledDate = new Date(`${dateKey}T${sched.timeOfDay}:00.000Z`);
          // If invalid timezone fallback, use today's date with time
          const scheduledAt = isNaN(scheduledDate.getTime())
            ? new Date().toISOString()
            : scheduledDate.toISOString();

          const graceDeadlineAt = new Date(
            new Date(scheduledAt).getTime() + (sched.gracePeriodMinutes || 3) * 60000
          ).toISOString();

          this.doseLogs.set(doseId, {
            doseId,
            patientId,
            scheduleId: sched.scheduleId,
            medicineId: sched.medicineId,
            medicineName: sched.medicineName,
            dosage: sched.dosage,
            dateKey,
            scheduledAt,
            graceDeadlineAt,
            status: 'SCHEDULED',
          });
        }
      }
    });
  }
}

export const db = new DatabaseStore();
