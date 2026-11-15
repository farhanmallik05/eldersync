import { Router } from 'express';
import { db, getTimePeriod, getTodayDateKey } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { CreateMedicationSchema, UpdateMedicationSchema } from '../types/index.js';

const router = Router({ mergeParams: true });

// Create Medication & Recurring Schedules
router.post(
  '/:patientId/medications',
  authMiddleware,
  requirePermission((req) => req.params.patientId, 'canManageMeds'),
  (req, res) => {
    const { patientId } = req.params;
    const patient = db.patients.get(patientId);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const parseResult = CreateMedicationSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid input', details: parseResult.error.format() });
    }

    const { name, dosage, instructions, timesOfDay, gracePeriodMinutes } = parseResult.data;
    const medicineId = `med_${Date.now()}`;
    const nowIso = new Date().toISOString();

    const medication = {
      medicineId,
      patientId,
      name,
      dosage,
      instructions,
      active: true,
      createdByUid: req.user!.uid,
      updatedAt: nowIso,
    };

    db.medications.set(medicineId, medication);

    // Create recurring schedules
    const createdSchedules = timesOfDay.map((time) => {
      const scheduleId = `sched_${medicineId}_${time.replace(':', '')}`;
      const schedule = {
        scheduleId,
        patientId,
        medicineId,
        medicineName: name,
        dosage,
        instructions,
        timeOfDay: time,
        periodLabel: getTimePeriod(time),
        gracePeriodMinutes: gracePeriodMinutes || patient.gracePeriodMinutes || 3,
        active: true,
      };
      db.schedules.set(scheduleId, schedule);
      return schedule;
    });

    // Materialize today's dose logs immediately
    const todayKey = getTodayDateKey();
    createdSchedules.forEach((sched) => {
      const doseId = `${sched.scheduleId}_${todayKey}`;
      const scheduledAt = `${todayKey}T${sched.timeOfDay}:00.000Z`;
      const graceDeadlineAt = new Date(
        new Date(scheduledAt).getTime() + sched.gracePeriodMinutes * 60000
      ).toISOString();

      db.doseLogs.set(doseId, {
        doseId,
        patientId,
        scheduleId: sched.scheduleId,
        medicineId,
        medicineName: name,
        dosage,
        dateKey: todayKey,
        scheduledAt,
        graceDeadlineAt,
        status: 'SCHEDULED',
      });
    });

    // Write audit log
    db.auditLogs.unshift({
      logId: `audit_${Date.now()}`,
      patientId,
      actorUid: req.user!.uid,
      actorName: req.user!.name,
      action: 'MEDICATION_CREATED',
      details: `Added ${name} (${dosage}) with ${timesOfDay.length} daily dose schedule slots: ${timesOfDay.join(', ')}.`,
      timestamp: nowIso,
    });

    res.status(201).json({ medication, schedules: createdSchedules });
  }
);

// Update Medication
router.put(
  '/:patientId/medications/:medicineId',
  authMiddleware,
  requirePermission((req) => req.params.patientId, 'canManageMeds'),
  (req, res) => {
    const { patientId, medicineId } = req.params;
    const med = db.medications.get(medicineId);
    if (!med || med.patientId !== patientId) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    const parseResult = UpdateMedicationSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid input', details: parseResult.error.format() });
    }

    const { name, dosage, instructions, active } = parseResult.data;
    if (name) med.name = name;
    if (dosage) med.dosage = dosage;
    if (instructions) med.instructions = instructions;
    if (typeof active === 'boolean') med.active = active;
    med.updatedAt = new Date().toISOString();

    db.medications.set(medicineId, med);

    // Update schedules
    db.schedules.forEach((sched) => {
      if (sched.medicineId === medicineId) {
        if (name) sched.medicineName = name;
        if (dosage) sched.dosage = dosage;
        if (instructions) sched.instructions = instructions;
        if (typeof active === 'boolean') sched.active = active;
      }
    });

    db.auditLogs.unshift({
      logId: `audit_${Date.now()}`,
      patientId,
      actorUid: req.user!.uid,
      actorName: req.user!.name,
      action: 'MEDICATION_UPDATED',
      details: `Updated medication ${med.name} (${med.dosage}). Active: ${med.active}`,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json(med);
  }
);

// Soft delete / deactivate medication
router.delete(
  '/:patientId/medications/:medicineId',
  authMiddleware,
  requirePermission((req) => req.params.patientId, 'canManageMeds'),
  (req, res) => {
    const { patientId, medicineId } = req.params;
    const med = db.medications.get(medicineId);
    if (!med || med.patientId !== patientId) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    med.active = false;
    med.updatedAt = new Date().toISOString();
    db.medications.set(medicineId, med);

    db.schedules.forEach((sched) => {
      if (sched.medicineId === medicineId) {
        sched.active = false;
      }
    });

    db.auditLogs.unshift({
      logId: `audit_${Date.now()}`,
      patientId,
      actorUid: req.user!.uid,
      actorName: req.user!.name,
      action: 'MEDICATION_DEACTIVATED',
      details: `Deactivated medication ${med.name}.`,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({ success: true, message: `Medication ${med.name} deactivated.` });
  }
);

export default router;
