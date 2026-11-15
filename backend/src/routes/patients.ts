import { Router } from 'express';
import { db } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireCareMemberOrOwner, requirePatientOwner } from '../middleware/rbac.js';
import { CreatePatientSchema, HelpRequestSchema } from '../types/index.js';
import { calculateAdherenceAnalytics } from '../services/analyticsService.js';
import { emailService } from '../services/emailService.js';

const router = Router();

// Create new patient profile
router.post('/', authMiddleware, (req, res) => {
  const parseResult = CreatePatientSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid input', details: parseResult.error.format() });
  }

  const { name, age, emergencyPhone, gracePeriodMinutes, highContrastDefault } = parseResult.data;
  const patientId = `patient_${Date.now()}`;
  const ownerUid = req.user!.uid;

  const patient = {
    patientId,
    ownerUid,
    name,
    age,
    email: req.user!.email,
    emergencyPhone,
    gracePeriodMinutes: gracePeriodMinutes || 3,
    highContrastDefault: Boolean(highContrastDefault),
    createdAt: new Date().toISOString(),
  };

  db.patients.set(patientId, patient);

  // Record in audit log
  db.auditLogs.unshift({
    logId: `audit_${Date.now()}`,
    patientId,
    actorUid: ownerUid,
    actorName: req.user!.name,
    action: 'PATIENT_PROFILE_CREATED',
    details: `Patient profile created for ${name} (age ${age}) with ${patient.gracePeriodMinutes}m grace window.`,
    timestamp: new Date().toISOString(),
  });

  res.status(201).json(patient);
});

// Get patient workspace (Unified data bundle for fast client load)
router.get(
  '/:patientId/workspace',
  authMiddleware,
  requireCareMemberOrOwner((req) => req.params.patientId),
  (req, res) => {
    const { patientId } = req.params;
    const patient = db.patients.get(patientId);

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Materialize today's dose logs idempotently
    db.materializeTodayDoses(patientId);

    // Retrieve today's dateKey
    const todayKey = new Date().toISOString().split('T')[0];

    const todayDoseLogs = Array.from(db.doseLogs.values())
      .filter((d) => d.patientId === patientId && d.dateKey === todayKey)
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

    const medications = Array.from(db.medications.values()).filter((m) => m.patientId === patientId);
    const schedules = Array.from(db.schedules.values()).filter((s) => s.patientId === patientId && s.active);
    const appointments = Array.from(db.appointments.values())
      .filter((a) => a.patientId === patientId)
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

    const careMembers = Array.from(db.careMembers.values()).filter((m) => m.patientId === patientId);
    const notifications = Array.from(db.notifications.values())
      .filter((n) => n.patientId === patientId)
      .sort((a, b) => b.sentAt.localeCompare(a.sentAt))
      .slice(0, 20);

    const auditLogs = db.auditLogs.filter((a) => a.patientId === patientId).slice(0, 30);
    const analytics = calculateAdherenceAnalytics(patientId);

    res.status(200).json({
      patient,
      todayDoseLogs,
      medications,
      schedules,
      appointments,
      careMembers,
      notifications,
      auditLogs,
      analytics,
    });
  }
);

// High-priority Help Request from Elderly Patient
router.post(
  '/:patientId/help-request',
  authMiddleware,
  requirePatientOwner((req) => req.params.patientId),
  async (req, res) => {
    const { patientId } = req.params;
    const patient = db.patients.get(patientId);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const parseResult = HelpRequestSchema.safeParse(req.body);
    const customMessage = parseResult.success && parseResult.data.message ? parseResult.data.message : 'Patient requested immediate assistance via ElderSync.';

    // Find active care members configured to receive escalation alerts
    const activeCaregivers = Array.from(db.careMembers.values()).filter(
      (m) => m.patientId === patientId && m.status === 'ACTIVE' && m.permissions.receiveEscalationEmails
    );

    const now = new Date();
    const idempotencyKey = `help_${patientId}_${now.getTime()}`;

    // Dispatch email to all eligible caregivers
    for (const member of activeCaregivers) {
      await emailService.sendNotification({
        idempotencyKey: `${idempotencyKey}_${member.userId}`,
        patientId,
        recipientEmail: member.memberEmail,
        recipientRole: member.role,
        type: 'HELP_REQUEST',
        subject: `🚨 URGENT: Assistance Requested by ${patient.name}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border-left: 6px solid #DC2626; background: #FEF2F2;">
            <h2 style="color: #991B1B; margin-top: 0;">Urgent Assistance Request</h2>
            <p style="font-size: 16px;"><strong>${patient.name}</strong> has pressed the Request Assistance button on their ElderSync dashboard.</p>
            <p style="background: white; padding: 12px; border: 1px solid #FCA5A5; border-radius: 6px;">
              <strong>Note:</strong> ${customMessage}
            </p>
            <p><strong>Emergency Contact Phone:</strong> ${patient.emergencyPhone}</p>
            <p>Please check in with ${patient.name} immediately.</p>
          </div>
        `,
      });
    }

    db.auditLogs.unshift({
      logId: `audit_${Date.now()}`,
      patientId,
      actorUid: req.user!.uid,
      actorName: patient.name,
      action: 'HELP_REQUEST_DISPATCHED',
      details: `Urgent assistance requested. Notified ${activeCaregivers.length} active caregivers. Note: "${customMessage}"`,
      timestamp: now.toISOString(),
    });

    res.status(200).json({
      success: true,
      notifiedCaregiversCount: activeCaregivers.length,
      message: 'Urgent assistance request dispatched to active Care Circle members.',
    });
  }
);

export default router;
