import { Router } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../firebaseAdmin.js';
import { requireAuth, requireAdmin, AuthedRequest } from '../middleware/auth.js';
import {
  isNonEmptyString,
  isNonNegativeInt,
  isPositiveInt,
  isValidDate,
  isValidTime,
} from '../utils/validate.js';
import { AppUser, MatchResult, Registration, Tournament, WalletTransaction } from '../types.js';

export const adminRouter = Router();

// Every route below runs requireAuth then requireAdmin — a non-admin caller
// is rejected here regardless of what the frontend shows or hides.
adminRouter.use(requireAuth, requireAdmin);

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function handleError(res: import('express').Response, err: unknown, fallback: string) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ error: fallback });
}

// ---------------------------------------------------------------------------
// Tournaments
// ---------------------------------------------------------------------------

adminRouter.get('/tournaments', async (_req, res) => {
  const snap = await db.collection('tournaments').orderBy('date', 'desc').get();
  const tournaments = snap.docs.map((d) => d.data() as Tournament);

  const withCounts = await Promise.all(
    tournaments.map(async (t) => {
      const regSnap = await db
        .collection('registrations')
        .where('tournamentId', '==', t.id)
        .get();
      return { ...t, registeredCount: regSnap.size };
    })
  );

  res.json(withCounts);
});

function validateTournamentInput(body: any): string | null {
  if (!isNonEmptyString(body.name)) return 'Enter a tournament name.';
  if (!isValidDate(body.date)) return 'Enter a valid date (YYYY-MM-DD).';
  if (!isValidTime(body.startTime)) return 'Enter a valid start time (HH:mm).';
  if (!isPositiveInt(body.maxPlayers) || body.maxPlayers > 100) {
    return 'Max players must be between 1 and 100.';
  }
  if (!isNonNegativeInt(body.rewardTokens)) return 'Reward tokens must be 0 or more.';
  return null;
}

adminRouter.post('/tournaments', async (req, res) => {
  const err = validateTournamentInput(req.body || {});
  if (err) return res.status(400).json({ error: err });

  const ref = db.collection('tournaments').doc();
  const tournament: Tournament = {
    id: ref.id,
    name: req.body.name.trim(),
    mode: 'Solo',
    date: req.body.date,
    startTime: req.body.startTime,
    maxPlayers: req.body.maxPlayers,
    registeredPlayers: 0,
    status: 'upcoming',
    rewardTokens: req.body.rewardTokens,
    roomId: null,
    roomPassword: null,
    roomPublished: false,
    createdAt: new Date().toISOString(),
  };

  await ref.set(tournament);
  res.status(201).json(tournament);
});

adminRouter.patch('/tournaments/:id', async (req, res) => {
  const err = validateTournamentInput(req.body || {});
  if (err) return res.status(400).json({ error: err });

  const ref = db.collection('tournaments').doc(req.params.id);
  const doc = await ref.get();
  if (!doc.exists) return res.status(404).json({ error: 'Tournament not found.' });

  await ref.update({
    name: req.body.name.trim(),
    date: req.body.date,
    startTime: req.body.startTime,
    maxPlayers: req.body.maxPlayers,
    rewardTokens: req.body.rewardTokens,
  });

  const updated = await ref.get();
  res.json(updated.data());
});

adminRouter.post('/tournaments/:id/room', async (req, res) => {
  const { roomId, roomPassword } = req.body || {};
  if (!isNonEmptyString(roomId) || !isNonEmptyString(roomPassword)) {
    return res.status(400).json({ error: 'Enter both room ID and password.' });
  }

  const ref = db.collection('tournaments').doc(req.params.id);
  const doc = await ref.get();
  if (!doc.exists) return res.status(404).json({ error: 'Tournament not found.' });

  await ref.update({
    roomId,
    roomPassword,
    roomPublished: true,
    status: 'live',
  });

  const updated = await ref.get();
  res.json(updated.data());
});

adminRouter.patch('/tournaments/:id/status', async (req, res) => {
  const { status } = req.body || {};
  if (!['upcoming', 'live', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  await db.collection('tournaments').doc(req.params.id).update({ status });
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

adminRouter.get('/tournaments/:id/results', async (req, res) => {
  const snap = await db
    .collection('results')
    .where('tournamentId', '==', req.params.id)
    .get();
  const results = snap.docs.map((d) => d.data() as MatchResult);

  const rows = await Promise.all(
    results.map(async (r) => {
      const [userDoc, regDoc] = await Promise.all([
        db.collection('users').doc(r.userId).get(),
        db.collection('registrations').doc(`${r.tournamentId}_${r.userId}`).get(),
      ]);
      const user = userDoc.data() as AppUser | undefined;
      const reg = regDoc.data() as Registration | undefined;
      return {
        resultId: r.id,
        userId: r.userId,
        nickname: reg?.nickname || user?.nickname || 'Unknown',
        freeFireUid: reg?.freeFireUid || user?.freeFireUid || '—',
        rank: r.rank,
        kills: r.kills,
        screenshotUrl: r.screenshotUrl,
        verificationStatus: r.verificationStatus,
      };
    })
  );

  rows.sort((a, b) => a.rank - b.rank);
  res.json(rows);
});

/**
 * Verify or reject a submitted result. Verifying is the ONLY path that can
 * credit tokens — it runs in a transaction so the token credit, the audit
 * transaction record, and the user's stat counters all update atomically
 * or not at all.
 */
adminRouter.patch('/results/:resultId', async (req: AuthedRequest, res) => {
  const { verificationStatus, markAsWinner } = req.body || {};
  if (!['verified', 'rejected'].includes(verificationStatus)) {
    return res.status(400).json({ error: 'Invalid verification status.' });
  }

  const resultRef = db.collection('results').doc(req.params.resultId);

  try {
    await db.runTransaction(async (tx) => {
      const resultSnap = await tx.get(resultRef);
      if (!resultSnap.exists) throw new HttpError(404, 'Result not found.');
      const result = resultSnap.data() as MatchResult;

      if (result.verificationStatus !== 'pending') {
        throw new HttpError(409, 'This result has already been decided.');
      }

      const tournamentRef = db.collection('tournaments').doc(result.tournamentId);
      const tournamentSnap = await tx.get(tournamentRef);
      if (!tournamentSnap.exists) throw new HttpError(404, 'Tournament not found.');
      const tournament = tournamentSnap.data() as Tournament;

      tx.update(resultRef, { verificationStatus });

      const userRef = db.collection('users').doc(result.userId);
      tx.update(userRef, { totalKills: FieldValue.increment(result.kills) });

      if (verificationStatus === 'verified' && markAsWinner) {
        tx.update(userRef, {
          wins: FieldValue.increment(1),
          tokenBalance: FieldValue.increment(tournament.rewardTokens),
        });

        const txnRef = db.collection('transactions').doc();
        const transaction: WalletTransaction = {
          id: txnRef.id,
          userId: result.userId,
          tournamentId: tournament.id,
          type: 'tournament_reward',
          tokens: tournament.rewardTokens,
          description: `Winner reward — ${tournament.name}`,
          createdAt: new Date().toISOString(),
        };
        tx.set(txnRef, transaction);
      }
    });

    res.json({ ok: true });
  } catch (err) {
    handleError(res, err, 'Could not update result.');
  }
});

// ---------------------------------------------------------------------------
// Players
// ---------------------------------------------------------------------------

adminRouter.post('/players/:userId/suspend', async (req, res) => {
  const ref = db.collection('users').doc(req.params.userId);
  const doc = await ref.get();
  if (!doc.exists) return res.status(404).json({ error: 'Player not found.' });

  await ref.update({ suspended: true });
  res.json({ ok: true });
});

adminRouter.post('/players/:userId/unsuspend', async (req, res) => {
  const ref = db.collection('users').doc(req.params.userId);
  const doc = await ref.get();
  if (!doc.exists) return res.status(404).json({ error: 'Player not found.' });

  await ref.update({ suspended: false });
  res.json({ ok: true });
});
