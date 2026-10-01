import { Request, Response, NextFunction } from 'express';
import { adminAuth, db } from '../firebaseAdmin.js';

export interface AuthedRequest extends Request {
  authUid?: string;
  authRole?: 'player' | 'admin';
  authSuspended?: boolean;
}

/**
 * Verifies the Firebase ID token on every request. This is the ONLY source
 * of truth for who the caller is — never trust a userId/uid in the request
 * body for anything security-sensitive.
 */
export async function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token.' });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    req.authUid = decoded.uid;

    // Re-check role from Firestore on every request rather than trusting
    // only the custom claim, so a role change takes effect immediately
    // even before the client refreshes its ID token.
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    const data = userDoc.data();
    req.authRole = (data?.role as 'player' | 'admin') || 'player';
    req.authSuspended = Boolean(data?.suspended);

    if (req.authSuspended) {
      return res.status(403).json({ error: 'This account has been suspended.' });
    }

    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

/**
 * Must run after requireAuth. Blocks any non-admin caller, regardless of
 * what the frontend UI shows or hides.
 */
export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (req.authRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}
