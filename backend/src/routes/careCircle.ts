import { Router } from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { db, hashPasscode } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { requirePatientOwner } from '../middleware/rbac.js';
import {
  CreateInvitationSchema,
  JoinCareCircleSchema,
  UpdateCareMemberSchema,
  CareInvitation,
  CareMember,
} from '../types/index.js';

const router = Router();

// Rate limiter: Maximum 5 attempts per 15 minutes to prevent $10^6 brute force attacks
export const joinRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many join attempts. Please try again in 15 minutes.' },
  statusCode: 429,
});

// Timing-safe cryptographic comparison to eliminate side-channel timing attacks
function secureHashCompare(storedHash: string, candidateHash: string): boolean {
  if (!storedHash || !candidateHash) return false;
  const bufA = Buffer.from(storedHash, 'utf-8');
  const bufB = Buffer.from(candidateHash, 'utf-8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Patient generates a 6-digit invitation passcode with 15-minute TTL
router.post(
  '/patients/:patientId/invitations',
  authMiddleware,
  requirePatientOwner((req) => req.params.patientId),
  (req, res) => {
    const { patientId } = req.params;
    const patient = db.patients.get(patientId);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const parseResult = CreateInvitationSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid input', details: parseResult.error.format() });
    }

    const { role, permissions } = parseResult.data;

    // Generate cryptographically secure 6-digit numeric code
    const plainPasscode = crypto.randomInt(100000, 1000000).toString();
    const passcodeHash = hashPasscode(plainPasscode);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60000).toISOString(); // 15-minute expiration
    const inviteId = `invite_${Date.now()}`;

    const invitation: CareInvitation = {
      inviteId,
      patientId,
      createdByUid: req.user!.uid,
      passcodeHash,
      role,
      permissions,
      expiresAt,
      used: false,
      createdAt: now.toISOString(),
    };

    db.careInvitations.set(inviteId, invitation);

    db.auditLogs.unshift({
      logId: `audit_${Date.now()}`,
      patientId,
      actorUid: req.user!.uid,
      actorName: req.user!.name,
      action: 'PASSCODE_INVITATION_CREATED',
      details: `Generated single-use 6-digit passcode for ${role} role (valid for 15 minutes).`,
      timestamp: now.toISOString(),
    });

    // Return the plain passcode ONLY ONCE to the patient UI
    res.status(200).json({
      inviteId,
      passcode: plainPasscode,
      role,
      permissions,
      expiresAt,
      message: 'Passcode generated successfully. Share this 6-digit code with your caregiver or family member.',
    });
  }
);

// Caregiver or Family Member joins using 6-digit passcode (Rate-Limited & Timing-Safe)
router.post('/care-circle/join', joinRateLimiter, authMiddleware, (req, res) => {
  const parseResult = JoinCareCircleSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid input', details: parseResult.error.format() });
  }

  const { patientId, passcode } = parseResult.data;
  const patient = db.patients.get(patientId);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const inputHash = hashPasscode(passcode);
  const now = new Date();

  // Find matching invitation by patientId and constant-time passcodeHash comparison
  const matchingInvite = Array.from(db.careInvitations.values()).find(
    (inv) => inv.patientId === patientId && secureHashCompare(inv.passcodeHash, inputHash)
  );

  if (!matchingInvite) {
    return res.status(400).json({ error: 'Invalid invitation passcode' });
  }

  if (matchingInvite.used) {
    return res.status(400).json({ error: 'Passcode already used. Passcodes are single-use only.' });
  }

  if (new Date(matchingInvite.expiresAt).getTime() < now.getTime()) {
    return res.status(400).json({ error: 'Invitation expired. Please request a new passcode from the patient.' });
  }

  // Mark invitation as used
  matchingInvite.used = true;
  matchingInvite.usedByUid = req.user!.uid;
  db.careInvitations.set(matchingInvite.inviteId, matchingInvite);

  // Upsert CareMember record
  const memberId = `${patientId}_${req.user!.uid}`;
  const careMember: CareMember = {
    id: memberId,
    patientId,
    userId: req.user!.uid,
    memberName: req.user!.name,
    memberEmail: req.user!.email,
    role: matchingInvite.role,
    permissions: matchingInvite.permissions,
    status: 'ACTIVE',
    joinedAt: now.toISOString(),
  };

  db.careMembers.set(memberId, careMember);

  db.auditLogs.unshift({
    logId: `audit_${Date.now()}`,
    patientId,
    actorUid: req.user!.uid,
    actorName: req.user!.name,
    action: 'CARE_MEMBER_JOINED',
    details: `${req.user!.name} joined Care Circle as ${matchingInvite.role} using single-use passcode.`,
    timestamp: now.toISOString(),
  });

  res.status(200).json({
    success: true,
    careMember,
    patientName: patient.name,
    message: `Successfully joined ${patient.name}'s Care Circle!`,
  });
});

// Patient manages Care Member permissions or revokes access
router.patch(
  '/patients/:patientId/care-members/:memberId',
  authMiddleware,
  requirePatientOwner((req) => req.params.patientId),
  (req, res) => {
    const { patientId, memberId } = req.params;
    const member = db.careMembers.get(memberId) || db.careMembers.get(`${patientId}_${memberId}`);

    if (!member || member.patientId !== patientId) {
      return res.status(404).json({ error: 'Care member record not found' });
    }

    const parseResult = UpdateCareMemberSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid input', details: parseResult.error.format() });
    }

    const { permissions, status } = parseResult.data;

    if (permissions) {
      member.permissions = {
        ...member.permissions,
        ...permissions,
      };
    }

    if (status) {
      member.status = status;
    }

    db.careMembers.set(member.id, member);

    db.auditLogs.unshift({
      logId: `audit_${Date.now()}`,
      patientId,
      actorUid: req.user!.uid,
      actorName: req.user!.name,
      action: status === 'REVOKED' ? 'CARE_MEMBER_REVOKED' : 'PERMISSIONS_UPDATED',
      details: `Updated permissions for ${member.memberName} (${member.role}). Status: ${member.status}.`,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json(member);
  }
);

export default router;
