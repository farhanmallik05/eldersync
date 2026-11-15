import { Request, Response, NextFunction } from 'express';
import { db } from '../config/database.js';
import { CareMember, CareMemberPermissions } from '../types/index.js';

/**
 * Access resolution result for a specific patient and user context.
 */
export interface PatientAccessResolution {
  isOwner: boolean;
  member?: CareMember;
}

/**
 * Validates whether a user is either the patient owner or an active care member.
 *
 * @param patientId - Target patient identifier
 * @param userId - Requesting user identifier
 * @returns Access resolution object
 */
export function checkPatientAccess(patientId: string, userId: string): PatientAccessResolution {
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

/**
 * Express middleware requiring the requesting user to be the direct patient owner.
 *
 * @param getPatientId - Callback function to extract target patient ID from Request
 * @returns Express RequestHandler
 */
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

/**
 * Express middleware enforcing granular permissions for Care Circle members.
 * Patient owners bypass permission gates automatically.
 *
 * @param getPatientId - Callback function to extract target patient ID
 * @param permissionKey - Required CareMemberPermissions key
 * @returns Express RequestHandler
 */
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

/**
 * Express middleware requiring the user to be either the patient owner or an active care member.
 *
 * @param getPatientId - Callback function to extract target patient ID
 * @returns Express RequestHandler
 */
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
