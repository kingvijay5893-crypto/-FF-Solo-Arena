import { Router } from 'express';
import { db } from '../firebaseAdmin.js';
import { requireAuth, AuthedRequest } from '../middleware/auth.js';
import {
  isFreeFireUid,
  isMobile,
  isNonEmptyString,
} from '../utils/validate.js';
import { AppUser } from '../types.js';

export const usersRouter = Router();

/**
 * Called once, right after Firebase Auth account creation on the frontend.
 * Creates the Firestore profile with a fixed starting role/tokenBalance —
 * the client cannot set these fields itself (rules deny it), and this is
 * the only endpoint allowed to create a `users` doc.
 */
usersRouter.post('/register', requireAuth, async (req: AuthedRequest, res) => {
  const { name, freeFireUid, nickname, mobile, email, uid } = req.body || {};

  if (uid !== req.authUid) {
    return res.status(403).json({ error: 'UID mismatch.' });
  }
  if (!isNonEmptyString(name) || name.trim().length < 2) {
    return res.status(400).json({ error: 'Enter your full name.' });
  }
  if (!isFreeFireUid(freeFireUid)) {
    return res.status(400).json({ error: 'Free Fire UID must be 6–12 digits.' });
  }
  if (!isNonEmptyString(nickname) || nickname.trim().length < 2) {
    return res.status(400).json({ error: 'Enter your Free Fire nickname.' });
  }
  if (!isMobile(mobile)) {
    return res.status(400).json({ error: 'Enter a valid mobile number.' });
  }
  if (!isNonEmptyString(email)) {
    return res.status(400).json({ error: 'Enter a valid email.' });
  }

  const existing = await db.collection('users').doc(uid).get();
  if (existing.exists) {
    return res.status(409).json({ error: 'Profile already exists.' });
  }

  const newUser: AppUser = {
    id: uid,
    name: name.trim(),
    email,
    mobile,
    freeFireUid,
    nickname: nickname.trim(),
    role: 'player',
    tokenBalance: 0,
    totalTournaments: 0,
    wins: 0,
    totalKills: 0,
    suspended: false,
    createdAt: new Date().toISOString(),
  };

  await db.collection('users').doc(uid).set(newUser);
  res.status(201).json(newUser);
});

usersRouter.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  const doc = await db.collection('users').doc(req.authUid!).get();
  if (!doc.exists) {
    return res.status(404).json({ error: 'Profile not found.' });
  }
  res.json(doc.data());
});
