import { Router } from 'express';
import { db } from '../config/database.js';
import { SchedulerCheckSchema } from '../types/index.js';
import { emailService } from '../services/emailService.js';

const router = Router();

// Idempotent cron processor & Judge live demo trigger
router.post('/run-check', async (req, res) => {
  const parseResult = SchedulerCheckSchema.safeParse(req.body);
  const now = parseResult.success && parseResult.data?.simulatedNowIso
    ? new Date(parseResult.data.simulatedNowIso)
    : new Date();
  const filterPatientId = parseResult.success ? parseResult.data?.patientId : undefined;

  let remindersSent = 0;
  let escalationsSent = 0;
  let appointmentRemindersSent = 0;

  // Scan all dose logs
  for (const dose of db.doseLogs.values()) {
    if (filterPatientId && dose.patientId !== filterPatientId) continue;

    const patient = db.patients.get(dose.patientId);
    if (!patient) continue;

    const scheduledTime = new Date(dose.scheduledAt).getTime();
    const graceDeadlineTime = new Date(dose.graceDeadlineAt).getTime();
    const currentTime = now.getTime();

    // 1. Due reminder check: now >= scheduledAt and status == 'SCHEDULED'
    if (currentTime >= scheduledTime && dose.status === 'SCHEDULED') {
      const idempotencyKey = `rem_${dose.doseId}`;
      const { sent } = await emailService.sendNotification({
        idempotencyKey,
        patientId: dose.patientId,
        recipientEmail: patient.email,
        recipientRole: 'PATIENT',
        type: 'DOSE_REMINDER',
        subject: `⏰ Medication Reminder: Time for your ${dose.medicineName}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border-left: 6px solid #0D9488; background: #F0FDFA;">
            <h2 style="color: #0F766E; margin-top: 0;">Medication Reminder</h2>
            <p style="font-size: 18px;">Hello ${patient.name},</p>
            <p style="font-size: 16px;">It is time to take your scheduled medication:</p>
            <div style="background: white; padding: 16px; border: 1px solid #99F6E4; border-radius: 8px; margin: 16px 0;">
              <h3 style="margin: 0; color: #0F172A;">${dose.medicineName} (${dose.dosage})</h3>
              <p style="margin: 6px 0 0 0; color: #475569;">${dose.scheduledAt ? new Date(dose.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</p>
            </div>
            <p>Please open ElderSync to confirm when taken.</p>
          </div>
        `,
      });

      dose.status = 'REMINDER_SENT';
      db.doseLogs.set(dose.doseId, dose);
      if (sent) remindersSent++;
    }

    // 2. Caregiver escalation check: now >= graceDeadlineAt and status in ('REMINDER_SENT', 'SCHEDULED')
    if (currentTime >= graceDeadlineTime && (dose.status === 'REMINDER_SENT' || dose.status === 'SCHEDULED')) {
      dose.status = 'UNCONFIRMED_ESCALATED';
      db.doseLogs.set(dose.doseId, dose);

      // Find active care circle members with receiveEscalationEmails == true
      const activeCaregivers = Array.from(db.careMembers.values()).filter(
        (m) => m.patientId === dose.patientId && m.status === 'ACTIVE' && m.permissions.receiveEscalationEmails
      );

      const idempotencyKey = `esc_${dose.doseId}`;

      for (const caregiver of activeCaregivers) {
        const { sent } = await emailService.sendNotification({
          idempotencyKey: `${idempotencyKey}_${caregiver.userId}`,
          patientId: dose.patientId,
          recipientEmail: caregiver.memberEmail,
          recipientRole: caregiver.role,
          type: 'CAREGIVER_ESCALATION',
          subject: `⚠️ Care Alert: Unconfirmed Dose for ${patient.name} (${dose.medicineName})`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; border-left: 6px solid #DC2626; background: #FEF2F2;">
              <h2 style="color: #991B1B; margin-top: 0;">Unconfirmed Dose Escalation</h2>
              <p style="font-size: 16px;"><strong>${patient.name}</strong>'s scheduled dose of <strong>${dose.medicineName} (${dose.dosage})</strong> was due at ${new Date(dose.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.</p>
              <p style="color: #B91C1C;"><strong>Grace Period Status:</strong> The ${patient.gracePeriodMinutes}-minute confirmation grace window has elapsed without a recorded confirmation.</p>
              <div style="background: white; padding: 12px; border: 1px solid #FCA5A5; border-radius: 6px; margin: 16px 0;">
                <p style="margin: 0; font-size: 14px; color: #4B5563;">
                  <em>Note: This alert indicates the dose is unconfirmed, not necessarily missed. Please check in with the patient and record your acknowledgement in the ElderSync Caregiver Dashboard.</em>
                </p>
              </div>
            </div>
          `,
        });

        if (sent) escalationsSent++;
      }

      db.auditLogs.unshift({
        logId: `audit_${Date.now()}`,
        patientId: dose.patientId,
        actorUid: 'system-scheduler',
        actorName: 'ElderSync Adherence Engine',
        action: 'DOSE_UNCONFIRMED_ESCALATED',
        details: `Dose ${dose.medicineName} elapsed grace deadline without confirmation. Escalated to ${activeCaregivers.length} active caregivers.`,
        timestamp: now.toISOString(),
      });
    }
  }

  // 3. Scan upcoming doctor appointments within next 24 hours
  for (const appt of db.appointments.values()) {
    if (filterPatientId && appt.patientId !== filterPatientId) continue;

    const patient = db.patients.get(appt.patientId);
    if (!patient || appt.reminderSent || appt.status !== 'UPCOMING') continue;

    const apptTime = new Date(appt.scheduledAt).getTime();
    const hoursUntil = (apptTime - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntil > 0 && hoursUntil <= 24) {
      const idempotencyKey = `appt_${appt.appointmentId}`;
      const { sent } = await emailService.sendNotification({
        idempotencyKey,
        patientId: appt.patientId,
        recipientEmail: patient.email,
        recipientRole: 'PATIENT',
        type: 'APPOINTMENT_REMINDER',
        subject: `📅 Doctor Visit Reminder: ${appt.doctorName} (${appt.specialty})`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border-left: 6px solid #2563EB; background: #EFF6FF;">
            <h2 style="color: #1D4ED8; margin-top: 0;">Upcoming Appointment</h2>
            <p style="font-size: 16px;">Hello ${patient.name}, this is a reminder for your upcoming medical consultation:</p>
            <div style="background: white; padding: 16px; border: 1px solid #BFDBFE; border-radius: 8px;">
              <h3 style="margin: 0; color: #1E3A8A;">${appt.doctorName} — ${appt.specialty}</h3>
              <p style="margin: 4px 0;"><strong>Location:</strong> ${appt.location}</p>
              <p style="margin: 4px 0;"><strong>Date & Time:</strong> ${new Date(appt.scheduledAt).toLocaleString()}</p>
              ${appt.notes ? `<p style="margin: 4px 0;"><strong>Notes:</strong> ${appt.notes}</p>` : ''}
            </div>
          </div>
        `,
      });

      appt.reminderSent = true;
      db.appointments.set(appt.appointmentId, appt);
      if (sent) appointmentRemindersSent++;
    }
  }

  res.status(200).json({
    success: true,
    simulatedNow: now.toISOString(),
    remindersSent,
    escalationsSent,
    appointmentRemindersSent,
    message: `Scheduler check complete at ${now.toISOString()}. Reminders: ${remindersSent}, Escalations: ${escalationsSent}.`,
  });
});

export default router;
