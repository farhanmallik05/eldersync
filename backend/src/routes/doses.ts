import { Router } from 'express';
import { db } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { checkPatientAccess } from '../middleware/rbac.js';
import { ConfirmDoseSchema, AcknowledgeDoseSchema } from '../types/index.js';
import { emailService } from '../services/emailService.js';
import { sanitizeString, escapeHtml } from '../utils/sanitize.js';

const router = Router();

/**
 * POST /api/doses/:doseId/confirm
 * Allows patient or authorized care circle member to confirm a scheduled dose.
 * Handles TAKEN, SKIPPED, and UNABLE states with automated caregiver escalation on UNABLE.
 */
router.post('/:doseId/confirm', authMiddleware, async (req, res) => {
  try {
    const { doseId } = req.params;
    const dose = db.doseLogs.get(doseId);

    if (!dose) {
      return res.status(404).json({ error: 'Dose log not found' });
    }

    const { isOwner, member } = checkPatientAccess(dose.patientId, req.user!.uid);
    if (!isOwner && !member) {
      return res.status(403).json({ error: 'Forbidden. You do not have access to this patient profile.' });
    }

    const parseResult = ConfirmDoseSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid input', details: parseResult.error.format() });
    }

    const { status, patientNote } = parseResult.data;
    const sanitizedNote = patientNote ? sanitizeString(patientNote, 1000) : undefined;
    const nowIso = new Date().toISOString();

    dose.status = status;
    dose.confirmedAt = nowIso;
    dose.confirmedByUid = req.user!.uid;
    dose.confirmedByName = req.user!.name;
    if (sanitizedNote) dose.patientNote = sanitizedNote;

    db.doseLogs.set(doseId, dose);

    // If UNABLE, immediately dispatch an alert email to active caregivers
    if (status === 'UNABLE') {
      const patient = db.patients.get(dose.patientId);
      const activeCaregivers = Array.from(db.careMembers.values()).filter(
        (m) => m.patientId === dose.patientId && m.status === 'ACTIVE' && m.permissions.receiveEscalationEmails
      );

      const idempotencyKey = `unable_${doseId}`;

      for (const member of activeCaregivers) {
        await emailService.sendNotification({
          idempotencyKey: `${idempotencyKey}_${member.userId}`,
          patientId: dose.patientId,
          recipientEmail: member.memberEmail,
          recipientRole: member.role,
          type: 'CAREGIVER_ESCALATION',
          subject: `⚠️ URGENT ALERT: ${escapeHtml(patient?.name || 'Patient')} Unable to Take ${escapeHtml(dose.medicineName)}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; border-left: 6px solid #DC2626; background: #FEF2F2;">
              <h2 style="color: #991B1B; margin-top: 0;">Medication Assistance Alert</h2>
              <p style="font-size: 16px;"><strong>${escapeHtml(patient?.name || 'Patient')}</strong> indicated they are unable to take their scheduled dose of <strong>${escapeHtml(dose.medicineName)} (${escapeHtml(dose.dosage)})</strong>.</p>
              <p><strong>Reason provided:</strong> ${escapeHtml(sanitizedNote || 'No specific reason given')}</p>
              <p><strong>Scheduled Time:</strong> ${escapeHtml(dose.scheduledAt)}</p>
              <p>Please check on the patient or open your ElderSync Caregiver Dashboard to acknowledge.</p>
            </div>
          `,
        });
      }
    }

    // Record audit log
    db.auditLogs.unshift({
      logId: `audit_${Date.now()}`,
      patientId: dose.patientId,
      actorUid: req.user!.uid,
      actorName: req.user!.name,
      action: `DOSE_${status}`,
      details: `Confirmed ${dose.medicineName} (${dose.dosage}) as ${status}.${patientNote ? ` Reason: ${patientNote}` : ''}`,
      timestamp: nowIso,
    });

    res.status(200).json(dose);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[DoseConfirm] Error:', err);
    res.status(500).json({ error: 'Failed to confirm dose', message: errorMessage });
  }
});

/**
 * POST /api/doses/:doseId/acknowledge
 * Caregiver acknowledges an escalated or missed dose, with optional mark-as-taken.
 */
router.post('/:doseId/acknowledge', authMiddleware, (req, res) => {
  const { doseId } = req.params;
  const dose = db.doseLogs.get(doseId);

  if (!dose) {
    return res.status(404).json({ error: 'Dose log not found' });
  }

  const { isOwner, member } = checkPatientAccess(dose.patientId, req.user!.uid);
  if (!isOwner && !member) {
    return res.status(403).json({ error: 'Forbidden. You do not have access to this patient profile.' });
  }

  const parseResult = AcknowledgeDoseSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid input', details: parseResult.error.format() });
  }

  const { acknowledgementNote, markAsTaken } = parseResult.data;
  const sanitizedNote = sanitizeString(acknowledgementNote, 1000);
  const nowIso = new Date().toISOString();

  dose.status = markAsTaken ? 'TAKEN' : 'ACKNOWLEDGED';
  dose.acknowledgedAt = nowIso;
  dose.acknowledgedByUid = req.user!.uid;
  dose.acknowledgedByName = req.user!.name;
  dose.acknowledgementNote = sanitizedNote;

  if (markAsTaken && !dose.confirmedAt) {
    dose.confirmedAt = nowIso;
    dose.confirmedByUid = req.user!.uid;
    dose.confirmedByName = `${req.user!.name} (Caregiver Confirmed)`;
  }

  db.doseLogs.set(doseId, dose);

  // Write to audit log
  db.auditLogs.unshift({
    logId: `audit_${Date.now()}`,
    patientId: dose.patientId,
    actorUid: req.user!.uid,
    actorName: req.user!.name,
    action: 'DOSE_ACKNOWLEDGED',
    details: `Caregiver acknowledged dose for ${dose.medicineName}.${markAsTaken ? ' Marked as TAKEN.' : ''} Note: "${sanitizedNote}"`,
    timestamp: nowIso,
  });

  res.status(200).json(dose);
});

export default router;
