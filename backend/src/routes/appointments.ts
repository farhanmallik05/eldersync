import { Router } from 'express';
import { db } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireCareMemberOrOwner, requirePermission } from '../middleware/rbac.js';
import { CreateAppointmentSchema, Appointment } from '../types/index.js';

const router = Router();

// List patient appointments
router.get(
  '/:patientId/appointments',
  authMiddleware,
  requireCareMemberOrOwner((req) => req.params.patientId),
  (req, res) => {
    const { patientId } = req.params;
    const list = Array.from(db.appointments.values())
      .filter((a) => a.patientId === patientId)
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

    res.status(200).json(list);
  }
);

// Add new doctor appointment
router.post(
  '/:patientId/appointments',
  authMiddleware,
  requirePermission((req) => req.params.patientId, 'canManageAppointments'),
  (req, res) => {
    const { patientId } = req.params;
    const patient = db.patients.get(patientId);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const parseResult = CreateAppointmentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid input', details: parseResult.error.format() });
    }

    const { doctorName, specialty, location, scheduledAt, notes } = parseResult.data;
    const appointmentId = `appt_${Date.now()}`;
    const nowIso = new Date().toISOString();

    const appointment: Appointment = {
      appointmentId,
      patientId,
      doctorName,
      specialty,
      location,
      scheduledAt,
      notes: notes || '',
      reminderSent: false,
      status: 'UPCOMING',
      createdAt: nowIso,
    };

    db.appointments.set(appointmentId, appointment);

    db.auditLogs.unshift({
      logId: `audit_${Date.now()}`,
      patientId,
      actorUid: req.user!.uid,
      actorName: req.user!.name,
      action: 'APPOINTMENT_SCHEDULED',
      details: `Scheduled visit with ${doctorName} (${specialty}) at ${location} on ${new Date(scheduledAt).toLocaleString()}.`,
      timestamp: nowIso,
    });

    res.status(201).json(appointment);
  }
);

export default router;
