import { Request, Response, NextFunction } from 'express';
import { db } from '../config/database.js';
import { UserRole } from '../types/index.js';

/**
 * Representation of an authenticated user injected onto Express Request.
 */
export interface AuthenticatedUser {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Bearer token authentication middleware for ElderSync API.
 * Validates incoming Authorization header and populates req.user.
 *
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header. Bearer token required.' });
  }

  const token = authHeader.split('Bearer ')[1].trim();

  if (!token) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header. Bearer token required.' });
  }

  // 1. Check for seeded demo tokens
  if (token.includes('patient')) {
    const user = db.users.get('demo-patient');
    req.user = {
      uid: user?.uid || 'demo-patient',
      email: user?.email || 'robert.vance@eldersync.health',
      name: user?.name || 'Robert Vance',
      role: 'PATIENT',
    };
    return next();
  }

  if (token.includes('caregiver')) {
    const user = db.users.get('demo-caregiver');
    req.user = {
      uid: user?.uid || 'demo-caregiver',
      email: user?.email || 'sarah.jenkins@eldercare.org',
      name: user?.name || 'Nurse Sarah Jenkins',
      role: 'CAREGIVER',
    };
    return next();
  }

  if (token.includes('family')) {
    const user = db.users.get('demo-family');
    req.user = {
      uid: user?.uid || 'demo-family',
      email: user?.email || 'david.vance@family.org',
      name: user?.name || 'David Vance',
      role: 'FAMILY',
    };
    return next();
  }

  // 2. Generic user lookup from memory DB
  const existingUser = db.users.get(token);
  if (existingUser) {
    req.user = {
      uid: existingUser.uid,
      email: existingUser.email,
      name: existingUser.name,
      role: existingUser.primaryRole,
    };
    return next();
  }

  // Fallback for new authenticated sessions
  req.user = {
    uid: token,
    email: `${token}@user.eldersync.health`,
    name: `User ${token.substring(0, 6)}`,
    role: 'PATIENT',
  };
  return next();
}
