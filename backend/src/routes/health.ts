import { Router } from 'express';
import { db } from '../config/database.js';

const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'ElderSync API',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    metrics: {
      patientsCount: db.patients.size,
      medicationsCount: db.medications.size,
      doseLogsCount: db.doseLogs.size,
      notificationsSent: db.notifications.size,
    },
    emailConfig: {
      resendEnabled: Boolean(process.env.RESEND_API_KEY),
      smtpConfigured: Boolean(process.env.SMTP_HOST),
      fallbackMode: 'Local Outbox (Inspection Ready)',
    },
  });
});

export default router;
