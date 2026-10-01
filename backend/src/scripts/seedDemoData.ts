/**
 * Usage: npm run seed
 * Creates the sample tournament described in the project spec:
 *   Name: FF Solo Night · Mode: Solo · Players: 48 · Reward: 10 tokens · Upcoming
 */
import '../firebaseAdmin.js';
import { db } from '../firebaseAdmin.js';
import { Tournament } from '../types.js';

async function main() {
  const ref = db.collection('tournaments').doc();

  // A week from now, 8 PM local — just needs to be in the future so the
  // "Join Tournament" flow is exercisable right after seeding.
  const date = new Date();
  date.setDate(date.getDate() + 7);
  const isoDate = date.toISOString().slice(0, 10);

  const tournament: Tournament = {
    id: ref.id,
    name: 'FF Solo Night',
    mode: 'Solo',
    date: isoDate,
    startTime: '20:00',
    maxPlayers: 48,
    registeredPlayers: 0,
    status: 'upcoming',
    rewardTokens: 10,
    roomId: null,
    roomPassword: null,
    roomPublished: false,
    createdAt: new Date().toISOString(),
  };

  await ref.set(tournament);
  console.log(`✅ Seeded demo tournament "FF Solo Night" (id: ${ref.id}, date: ${isoDate})`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
