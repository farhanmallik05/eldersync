import { Router } from 'express';
import { db } from '../config/database.js';

const router = Router();

// Idempotent endpoint to seed or reset demo data for evaluators
router.post('/seed', (req, res) => {
  db.seedDefaultData();
  db.materializeTodayDoses('patient_robert_vance');
  res.status(200).json({
    success: true,
    message: 'Demo dataset successfully seeded for Robert Vance, Nurse Sarah, and David Vance.',
    counts: {
      users: db.users.size,
      patients: db.patients.size,
      medications: db.medications.size,
      schedules: db.schedules.size,
      doseLogs: db.doseLogs.size,
      appointments: db.appointments.size,
    },
  });
});

export default router;
