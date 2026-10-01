import { Router } from 'express';
import { db } from '../firebaseAdmin.js';
import { requireAuth, AuthedRequest } from '../middleware/auth.js';
import { isNonNegativeInt, isPositiveInt } from '../utils/validate.js';
import { MatchResult, Registration } from '../types.js';

export const resultsRouter = Router();

resultsRouter.post('/', requireAuth, async (req: AuthedRequest, res) => {
  const { tournamentId, rank, kills, screenshotUrl } = req.body || {};

  if (typeof tournamentId !== 'string' || !tournamentId) {
    return res.status(400).json({ error: 'Missing tournament.' });
  }
  if (!isPositiveInt(rank)) {
    return res.status(400).json({ error: 'Enter a valid final rank.' });
  }
  if (!isNonNegativeInt(kills)) {
    return res.status(400).json({ error: 'Enter a valid kill count.' });
  }
  // Screenshots are stored as small compressed JPEG data URLs directly in
  // Firestore (no Firebase Storage / billing needed). Firestore documents are
  // limited to 1 MiB, so cap the size well below that.
  const MAX_SCREENSHOT_CHARS = 700_000;
  if (
    typeof screenshotUrl !== 'string' ||
    !screenshotUrl.startsWith('data:image/jpeg;base64,') ||
    screenshotUrl.length > MAX_SCREENSHOT_CHARS
  ) {
    return res.status(400).json({ error: 'Upload a valid, smaller result screenshot.' });
  }

  const registrationDoc = await db
    .collection('registrations')
    .doc(`${tournamentId}_${req.authUid}`)
    .get();
  if (!registrationDoc.exists) {
    return res.status(403).json({ error: 'You are not registered for this tournament.' });
  }
  const registration = registrationDoc.data() as Registration;
  if (registration.status === 'suspended') {
    return res.status(403).json({ error: 'Your registration has been suspended.' });
  }

  const resultRef = db.collection('results').doc(`${tournamentId}_${req.authUid}`);
  const existing = await resultRef.get();
  if (existing.exists) {
    const current = existing.data() as MatchResult;
    if (current.verificationStatus !== 'rejected') {
      return res.status(409).json({
        error: 'A result has already been submitted for this tournament.',
      });
    }
  }

  const result: MatchResult = {
    id: resultRef.id,
    tournamentId,
    userId: req.authUid!,
    rank,
    kills,
    screenshotUrl,
    verificationStatus: 'pending',
    submittedAt: new Date().toISOString(),
  };

  await resultRef.set(result);
  res.status(201).json(result);
});
