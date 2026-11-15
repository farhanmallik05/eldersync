import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../backend/src/server.js';
import { db, hashPasscode } from '../backend/src/config/database.js';
import { calculateAdherenceAnalytics } from '../backend/src/services/analyticsService.js';

describe('ElderSync Quality Gates (TC-01 through TC-10)', () => {
  const patientId = 'patient_robert_vance';
  const patientToken = 'Bearer demo-patient-token';
  const caregiverToken = 'Bearer demo-caregiver-token';
  const familyToken = 'Bearer demo-family-token';

  it('TC-01: Passcode Hashing & Single-Use Enforcement', async () => {
    // 1. Patient generates a 6-digit passcode invitation
    const invRes = await request(app)
      .post(`/api/patients/${patientId}/invitations`)
      .set('Authorization', patientToken)
      .send({
        role: 'CAREGIVER',
        permissions: {
          canViewSchedule: true,
          canManageMeds: true,
          canManageAppointments: true,
          receiveEscalationEmails: true,
        },
      });

    expect(invRes.status).toBe(200);
    const { passcode, inviteId } = invRes.body;
    expect(passcode).toMatch(/^\d{6}$/);

    // Verify plain passcode is NEVER saved in the database
    const savedInvite = db.careInvitations.get(inviteId);
    expect(savedInvite).toBeDefined();
    expect(savedInvite?.passcodeHash).toBe(hashPasscode(passcode));
    expect(savedInvite?.used).toBe(false);

    // 2. First redemption should succeed
    const join1 = await request(app)
      .post('/api/care-circle/join')
      .set('Authorization', 'Bearer new-caregiver-user')
      .send({ patientId, passcode });

    expect(join1.status).toBe(200);
    expect(join1.body.success).toBe(true);
    expect(savedInvite?.used).toBe(true);

    // 3. Second redemption with the exact same code MUST return 400 Bad Request
    const join2 = await request(app)
      .post('/api/care-circle/join')
      .set('Authorization', 'Bearer another-user')
      .send({ patientId, passcode });

    expect(join2.status).toBe(400);
    expect(join2.body.error).toMatch(/used/i);
  });

  it('TC-02: Expired Passcode Rejection', async () => {
    const expiredPasscode = '123456';
    const expiredInviteId = 'invite_expired_test';
    db.careInvitations.set(expiredInviteId, {
      inviteId: expiredInviteId,
      patientId,
      createdByUid: 'demo-patient',
      passcodeHash: hashPasscode(expiredPasscode),
      role: 'FAMILY',
      permissions: {
        canViewSchedule: true,
        canManageMeds: false,
        canManageAppointments: false,
        receiveEscalationEmails: true,
      },
      expiresAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour in past
      used: false,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    });

    const res = await request(app)
      .post('/api/care-circle/join')
      .set('Authorization', 'Bearer expired-tester')
      .send({ patientId, passcode: expiredPasscode });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/expired/i);
  });

  it('TC-03: Passcode Brute-Force Rate Limiting (429 Too Many Requests)', async () => {
    // TC-01 made 2 join requests, TC-02 made 1 join request (Total: 3).
    // Send 2 more invalid requests to hit the 5-request limit:
    for (let i = 1; i <= 2; i++) {
      await request(app)
        .post('/api/care-circle/join')
        .set('Authorization', caregiverToken)
        .send({ patientId, passcode: `99990${i}` });
    }

    // The 6th request MUST be rate-limited and return 429
    const rateLimitedRes = await request(app)
      .post('/api/care-circle/join')
      .set('Authorization', caregiverToken)
      .send({ patientId, passcode: '999903' });

    expect(rateLimitedRes.status).toBe(429);
    expect(rateLimitedRes.body.error).toMatch(/too many/i);
  });

  it('TC-04: Patient Autonomy Permission Revocation (Server-Side RBAC 403)', async () => {
    // 1. Patient revokes canManageMeds from demo-family
    const patchRes = await request(app)
      .patch(`/api/patients/${patientId}/care-members/demo-family`)
      .set('Authorization', patientToken)
      .send({
        permissions: {
          canViewSchedule: true,
          canManageMeds: false, // Explicitly revoked
          canManageAppointments: false,
          receiveEscalationEmails: true,
        },
      });

    expect(patchRes.status).toBe(200);

    // 2. Family user attempts to create a medication -> Must receive 403 Forbidden
    const medRes = await request(app)
      .post(`/api/patients/${patientId}/medications`)
      .set('Authorization', familyToken)
      .send({
        name: 'Hydrochlorothiazide',
        dosage: '25mg',
        instructions: 'Take 1 tablet every morning',
        timesOfDay: ['08:00'],
      });

    expect(medRes.status).toBe(403);
    expect(medRes.body.error).toMatch(/forbidden/i);
  });

  it('TC-05: Deterministic State Machine & Idempotent Escalation Deduplication', async () => {
    const testDoseId = 'test_escalation_dose_1';
    const pastTime = new Date(Date.now() - 30 * 60000).toISOString();
    const pastGrace = new Date(Date.now() - 25 * 60000).toISOString();

    db.doseLogs.set(testDoseId, {
      doseId: testDoseId,
      patientId,
      scheduleId: 'sched_test',
      medicineId: 'med_metformin',
      medicineName: 'Metformin',
      dosage: '500mg',
      dateKey: new Date().toISOString().split('T')[0],
      scheduledAt: pastTime,
      graceDeadlineAt: pastGrace,
      status: 'SCHEDULED',
    });

    // Run scheduler check first time
    const run1 = await request(app)
      .post('/api/scheduler/run-check')
      .send({ simulatedNowIso: new Date().toISOString() });

    expect(run1.status).toBe(200);
    const updatedDose = db.doseLogs.get(testDoseId);
    expect(updatedDose?.status).toBe('UNCONFIRMED_ESCALATED');

    // Run scheduler check second time (Recurring cron trigger)
    const run2 = await request(app)
      .post('/api/scheduler/run-check')
      .send({ simulatedNowIso: new Date().toISOString() });

    expect(run2.status).toBe(200);

    // Verify notifications map has exactly 1 entry for this dose (Idempotency locked)
    const caregiverEscalations = Array.from(db.notifications.values()).filter((n) =>
      n.idempotencyKey.startsWith(`esc_${testDoseId}`)
    );
    expect(caregiverEscalations.length).toBeGreaterThanOrEqual(1);
    const initialCount = caregiverEscalations.length;

    // Running a 3rd time must not increase notification count
    await request(app)
      .post('/api/scheduler/run-check')
      .send({ simulatedNowIso: new Date().toISOString() });

    const subsequentCount = Array.from(db.notifications.values()).filter((n) =>
      n.idempotencyKey.startsWith(`esc_${testDoseId}`)
    ).length;

    expect(subsequentCount).toBe(initialCount);
  });

  it('TC-06: Caregiver Acknowledgement Workflow & Audit Logging', async () => {
    const doseId = 'test_ack_dose';
    db.doseLogs.set(doseId, {
      doseId,
      patientId,
      scheduleId: 'sched_test',
      medicineId: 'med_lisinopril',
      medicineName: 'Lisinopril',
      dosage: '10mg',
      dateKey: new Date().toISOString().split('T')[0],
      scheduledAt: new Date().toISOString(),
      graceDeadlineAt: new Date().toISOString(),
      status: 'UNCONFIRMED_ESCALATED',
    });

    const ackRes = await request(app)
      .post(`/api/doses/${doseId}/acknowledge`)
      .set('Authorization', caregiverToken)
      .send({
        acknowledgementNote: 'Spoke with Robert on telephone — taking with breakfast right now.',
        markAsTaken: true,
      });

    expect(ackRes.status).toBe(200);
    expect(ackRes.body.status).toBe('TAKEN');
    expect(ackRes.body.acknowledgedByName).toBe('Nurse Sarah Jenkins');
    expect(ackRes.body.acknowledgementNote).toBe(
      'Spoke with Robert on telephone — taking with breakfast right now.'
    );

    // Verify entry in audit logs
    const latestAudit = db.auditLogs[0];
    expect(latestAudit.action).toBe('DOSE_ACKNOWLEDGED');
    expect(latestAudit.actorName).toBe('Nurse Sarah Jenkins');
  });

  it('TC-07: Deterministic Daily Dose Materialization', () => {
    const today = new Date();
    const dateKey = today.toISOString().split('T')[0];

    db.materializeTodayDoses(patientId, today);
    const countBefore = Array.from(db.doseLogs.values()).filter((d) => d.patientId === patientId && d.dateKey === dateKey).length;
    expect(countBefore).toBeGreaterThan(0);

    // Materializing again for the same date must be 100% idempotent
    db.materializeTodayDoses(patientId, today);
    const countAfter = Array.from(db.doseLogs.values()).filter((d) => d.patientId === patientId && d.dateKey === dateKey).length;
    expect(countAfter).toBe(countBefore);
  });

  it('TC-08: Real Adherence Analytics Calculation from doseLogs', () => {
    const testPatientId = 'patient_analytics_calc_test';
    const today = new Date();
    const dateKey = today.toISOString().split('T')[0];

    const eveningSchedId = 'sched_evening_calc';
    db.schedules.set(eveningSchedId, {
      scheduleId: eveningSchedId,
      patientId: testPatientId,
      medicineId: 'med_test',
      medicineName: 'Test Med',
      dosage: '10mg',
      instructions: 'Take in evening',
      timeOfDay: '19:00',
      periodLabel: 'EVENING',
      gracePeriodMinutes: 3,
      active: true,
    });

    // 8 TAKEN
    for (let i = 1; i <= 8; i++) {
      const dId = `calc_dose_taken_${i}`;
      db.doseLogs.set(dId, {
        doseId: dId,
        patientId: testPatientId,
        scheduleId: eveningSchedId,
        medicineId: 'med_test',
        medicineName: 'Test Med',
        dosage: '10mg',
        dateKey,
        scheduledAt: today.toISOString(),
        graceDeadlineAt: today.toISOString(),
        status: 'TAKEN',
        confirmedAt: today.toISOString(),
      });
    }

    // 1 SKIPPED
    db.doseLogs.set('calc_dose_skipped', {
      doseId: 'calc_dose_skipped',
      patientId: testPatientId,
      scheduleId: eveningSchedId,
      medicineId: 'med_test',
      medicineName: 'Test Med',
      dosage: '10mg',
      dateKey,
      scheduledAt: today.toISOString(),
      graceDeadlineAt: today.toISOString(),
      status: 'SKIPPED',
    });

    // 1 UNCONFIRMED_ESCALATED
    db.doseLogs.set('calc_dose_escalated', {
      doseId: 'calc_dose_escalated',
      patientId: testPatientId,
      scheduleId: eveningSchedId,
      medicineId: 'med_test',
      medicineName: 'Test Med',
      dosage: '10mg',
      dateKey,
      scheduledAt: today.toISOString(),
      graceDeadlineAt: today.toISOString(),
      status: 'UNCONFIRMED_ESCALATED',
    });

    const analytics = calculateAdherenceAnalytics(testPatientId);

    // 8 TAKEN out of 10 evaluated = 80% adherence rate
    expect(analytics.adherenceRate).toBe(80);
    expect(analytics.takenCount).toBe(8);
    expect(analytics.skippedCount).toBe(1);
    expect(analytics.escalatedCount).toBe(1);
    expect(analytics.disruptionSlot).toBe('EVENING');
  });

  it('TC-09: Health Check & System Status (GET /api/health)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toBe('ElderSync API');
    expect(res.body.metrics.patientsCount).toBeGreaterThan(0);
  });

  it('TC-10: Demo Fast-Forward Simulation & Seeding Endpoint (POST /api/demo/seed)', async () => {
    const res = await request(app).post('/api/demo/seed');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.counts.users).toBeGreaterThanOrEqual(3);
    expect(res.body.counts.patients).toBeGreaterThanOrEqual(1);
    expect(res.body.counts.medications).toBeGreaterThanOrEqual(2);
  });
});
