import { Router } from 'express';
import { db } from '../firebaseAdmin.js';
import { requireAuth } from '../middleware/auth.js';
import { AppUser, MatchResult } from '../types.js';

export const leaderboardRouter = Router();

/**
 * Score formula: kills count directly, and a placement bonus rewards top
 * finishes. This is a simple, transparent scheme — tune freely.
 *   score = totalKills + (bestRank === 1 ? 15 : bestRank <= 3 ? 8 : bestRank <= 10 ? 3 : 0)
 */
function placementBonus(rank: number): number {
  if (rank === 1) return 15;
  if (rank <= 3) return 8;
  if (rank <= 10) return 3;
  return 0;
}

leaderboardRouter.get('/', requireAuth, async (_req, res) => {
  const resultsSnap = await db
    .collection('results')
    .where('verificationStatus', '==', 'verified')
    .get();
  const results = resultsSnap.docs.map((d) => d.data() as MatchResult);

  const byUser = new Map<string, { totalKills: number; bestRank: number; matches: number }>();
  for (const r of results) {
    const entry = byUser.get(r.userId) || { totalKills: 0, bestRank: Infinity, matches: 0 };
    entry.totalKills += r.kills;
    entry.bestRank = Math.min(entry.bestRank, r.rank);
    entry.matches += 1;
    byUser.set(r.userId, entry);
  }

  const userIds = [...byUser.keys()];
  const userDocs = await Promise.all(
    userIds.map((uid) => db.collection('users').doc(uid).get())
  );

  const leaderboard = userDocs
    .filter((d) => d.exists)
    .map((d) => {
      const user = d.data() as AppUser;
      const stats = byUser.get(user.id)!;
      const score = stats.totalKills + placementBonus(stats.bestRank);
      return {
        userId: user.id,
        nickname: user.nickname,
        freeFireUid: user.freeFireUid,
        rank: stats.bestRank,
        kills: stats.totalKills,
        score,
        tokensEarned: user.tokenBalance,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 100);

  res.json(leaderboard);
});
