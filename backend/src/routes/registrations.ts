import { Router } from 'express';
import { db } from '../firebaseAdmin.js';
import { requireAuth, AuthedRequest } from '../middleware/auth.js';
import { MatchResult, Registration, Tournament } from '../types.js';

export const registrationsRouter = Router();

registrationsRouter.get('/mine', requireAuth, async (req: AuthedRequest, res) => {
  const regSnap = await db
    .collection('registrations')
    .where('userId', '==', req.authUid)
    .get();
  const registrations = regSnap.docs.map((d) => d.data() as Registration);

  const rows = await Promise.all(
    registrations.map(async (reg) => {
      const tournamentDoc = await db.collection('tournaments').doc(reg.tournamentId).get();
      const tournament = tournamentDoc.data() as Tournament | undefined;

      const resultDoc = await db
        .collection('results')
        .doc(`${reg.tournamentId}_${req.authUid}`)
        .get();
      const result = resultDoc.data() as MatchResult | undefined;

      return {
        registrationId: reg.id,
        tournamentId: reg.tournamentId,
        tournamentName: tournament?.name || 'Unknown tournament',
        date: tournament?.date || '',
        startTime: tournament?.startTime || '',
        registrationStatus: reg.status,
        roomStatus: tournament?.roomPublished ? 'published' : 'not_published',
        resultStatus: result?.verificationStatus || 'not_submitted',
      };
    })
  );

  rows.sort((a, b) => (a.date < b.date ? 1 : -1));
  res.json(rows);
});
