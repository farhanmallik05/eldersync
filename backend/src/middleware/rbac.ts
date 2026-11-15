import { Request, Response, NextFunction } from 'express';
import { db } from '../config/database.js';
import { CareMemberPermissions } from '../types/index.js';

export function checkPatientAccess(patientId: string, userId: string): { isOwner: boolean; member?: any } {
  const patient = db.patients.get(patientId);
  if (!patient) return { isOwner: false };

  if (patient.ownerUid === userId) {
    return { isOwner: true };
  }

  const memberKey = `${patientId}_${userId}`;
  const member = db.careMembers.get(memberKey);

  if (member && member.status === 'ACTIVE') {
    return { isOwner: false, member };
  }

  return { isOwner: false };
}

export function requirePatientOwner(getPatientId: (req: Request) => string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const patientId = getPatientId(req);
    const { isOwner } = checkPatientAccess(patientId, req.user.uid);

    if (!isOwner) {
      return res.status(403).json({
        error: 'Forbidden. This action is strictly reserved for the elderly patient owner.',
      });
    }

    next();
  };
}

export function requirePermission(
  getPatientId: (req: Request) => string,
  permissionKey: keyof CareMemberPermissions
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const patientId = getPatientId(req);
    const { isOwner, member } = checkPatientAccess(patientId, req.user.uid);

    if (isOwner) {
      return next(); // Patient owner has full permissions
    }

    if (member && member.permissions && member.permissions[permissionKey] === true) {
      return next(); // Care member has active explicit permission
    }

    return res.status(403).json({
      error: `Forbidden. Missing required '${permissionKey}' permission for this patient.`,
    });
  };
}

export function requireCareMemberOrOwner(getPatientId: (req: Request) => string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const patientId = getPatientId(req);
    const { isOwner, member } = checkPatientAccess(patientId, req.user.uid);

    if (!isOwner && !member) {
      return res.status(403).json({
        error: 'Forbidden. You are not an active member or owner of this patient profile.',
      });
    }

    next();
  };
}
