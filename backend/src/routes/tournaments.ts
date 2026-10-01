import { Router } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../firebaseAdmin.js';
import { requireAuth, AuthedRequest } from '../middleware/auth.js';
import { isFreeFireUid, isNonEmptyString } from '../utils/validate.js';
import { Registration, Tournament } from '../types.js';

export const tournamentsRouter = Router();

/** Strips room credentials unless the requester is registered or an admin. */
function toPublicTournament(
  t: Tournament,
  canSeeRoom: boolean
): Omit<Tournament, 'roomId' | 'roomPassword'> & {
  roomId?: string | null;
  roomPassword?: string | null;
} {
  if (canSeeRoom) return t;
  const { roomId, roomPassword, ...rest } = t;
  return rest;
}

tournamentsRouter.get('/', requireAuth, async (req: AuthedRequest, res) => {
  const snap = await db.collection('tournaments').orderBy('date', 'asc').get();
  const tournaments = snap.docs.map((d) => d.data() as Tournament);

  // Batch-check which of these the caller is registered for, so the list
  // view never needs to leak room credentials for tournaments they haven't
  // joined.
  const regSnap = await db
    .collection('registrations')
    .where('userId', '==', req.authUid)
    .get();
  const registeredIds = new Set(regSnap.docs.map((d) => d.data().tournamentId));

  const isAdmin = req.authRole === 'admin';
  res.json(
    tournaments.map((t) => toPublicTournament(t, isAdmin || registeredIds.has(t.id)))
  );
});

tournamentsRouter.get('/:id', requireAuth, async (req: AuthedRequest, res) => {
  const doc = await db.collection('tournaments').doc(req.params.id).get();
  if (!doc.exists) return res.status(404).json({ error: 'Tournament not found.' });
  const tournament = doc.data() as Tournament;

  const regId = `${req.params.id}_${req.authUid}`;
  const regDoc = await db.collection('registrations').doc(regId).get();
  const isRegistered = regDoc.exists;
  const reg = regDoc.data() as Registration | undefined;

  const isAdmin = req.authRole === 'admin';
  res.json({
    ...toPublicTournament(tournament, isAdmin || isRegistered),
    isRegistered,
    myFreeFireUid: reg?.freeFireUid,
    myNickname: reg?.nickname,
  });
});

tournamentsRouter.post('/:id/join', requireAuth, async (req: AuthedRequest, res) => {
  const { freeFireUid, nickname } = req.body || {};
  const tournamentId = req.params.id;

  if (!isFreeFireUid(freeFireUid)) {
    return res.status(400).json({ error: 'Free Fire UID must be 6–12 digits.' });
  }
  if (!isNonEmptyString(nickname)) {
    return res.status(400).json({ error: 'Enter your Free Fire nickname.' });
  }

  const tournamentRef = db.collection('tournaments').doc(tournamentId);
  const registrationRef = db
    .collection('registrations')
    .doc(`${tournamentId}_${req.authUid}`);

  try {
    await db.runTransaction(async (tx) => {
      const [tournamentSnap, registrationSnap] = await Promise.all([
        tx.get(tournamentRef),
        tx.get(registrationRef),
      ]);

      if (!tournamentSnap.exists) {
        throw new HttpError(404, 'Tournament not found.');
      }
      const tournament = tournamentSnap.data() as Tournament;

      if (tournament.status !== 'upcoming') {
        throw new HttpError(400, 'This tournament is no longer accepting players.');
      }
      // The authoritative duplicate-registration check — never trust the
      // frontend's disabled-button state alone.
      if (registrationSnap.exists) {
        throw new HttpError(409, 'You have already joined this tournament.');
      }
      if (tournament.registeredPlayers >= tournament.maxPlayers) {
        throw new HttpError(409, 'This tournament is full.');
      }

      const registration: Registration = {
        id: registrationRef.id,
        tournamentId,
        userId: req.authUid!,
        freeFireUid,
        nickname,
        joinedAt: new Date().toISOString(),
        status: 'registered',
      };

      tx.set(registrationRef, registration);
      tx.update(tournamentRef, {
        registeredPlayers: tournament.registeredPlayers + 1,
      });
      tx.update(db.collection('users').doc(req.authUid!), {
        totalTournaments: FieldValue.increment(1),
      });
    });

    res.status(201).json({ message: 'Successfully Joined' });
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message });
    }
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: 'Could not join tournament.' });
  }
});

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
