import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Tournament } from '../types';
import { TournamentCard } from '../components/TournamentCard';
import { LoadingSpinner } from '../components/LoadingSpinner';

const filters = ['all', 'upcoming', 'live', 'completed'] as const;
type Filter = (typeof filters)[number];

export function Tournaments() {
  const [tournaments, setTournaments] = useState<Tournament[] | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Tournament[]>('/tournaments')
      .then(setTournaments)
      .catch(() => setError('Could not load tournaments.'));
  }, []);

  const visible = tournaments?.filter((t) => filter === 'all' || t.status === filter) || [];

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <h1 className="font-display text-2xl font-bold mb-4">Tournaments</h1>

      <div className="flex gap-2 mb-5 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium border transition-colors ${
              filter === f
                ? 'bg-arena-orange border-arena-orange text-white'
                : 'border-arena-border text-arena-muted'
            }`}
          >
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-arena-red">{error}</p>}
      {!tournaments && !error && <LoadingSpinner label="Loading tournaments" />}

      {tournaments && visible.length === 0 && (
        <p className="text-sm text-arena-muted">No tournaments match this filter.</p>
      )}

      <div className="space-y-3">
        {visible.map((t) => (
          <TournamentCard key={t.id} tournament={t} />
        ))}
      </div>
    </div>
  );
}
