import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { LeaderboardEntry } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<LeaderboardEntry[]>('/leaderboard')
      .then(setEntries)
      .catch(() => setError('Could not load the leaderboard.'));
  }, []);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-10">
      <h1 className="font-display text-2xl font-bold mb-5">Leaderboard</h1>

      {error && <p className="text-sm text-arena-red">{error}</p>}
      {!entries && !error && <LoadingSpinner label="Loading leaderboard" />}

      {entries && entries.length === 0 && (
        <p className="text-sm text-arena-muted">No verified results yet.</p>
      )}

      <div className="card divide-y divide-arena-border overflow-hidden">
        {entries?.map((e, i) => (
          <div key={e.userId} className="flex items-center gap-3 p-3.5">
            <span className="w-6 text-center font-display font-bold text-arena-muted">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{e.nickname}</p>
              <p className="text-xs text-arena-muted">UID {e.freeFireUid}</p>
            </div>
            <div className="text-right text-sm">
              <p>Rank #{e.rank} · {e.kills} kills</p>
              <p className="text-arena-gold font-medium">{e.tokensEarned} tokens</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
