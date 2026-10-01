import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Tournament } from '../types';
import { TournamentCard } from '../components/TournamentCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

export function Home() {
  const { profile, isAdmin } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Tournament[]>('/tournaments')
      .then(setTournaments)
      .catch(() => setError('Could not load tournaments. Pull to refresh.'));
  }, []);

  const live = tournaments?.filter((t) => t.status === 'live') || [];
  const upcoming = tournaments?.filter((t) => t.status === 'upcoming') || [];
  const completed = tournaments?.filter((t) => t.status === 'completed') || [];

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">
            FF <span className="text-arena-orange">Solo Arena</span>
          </h1>
          <p className="text-sm text-arena-muted">
            Welcome back{profile ? `, ${profile.nickname}` : ''}
          </p>
        </div>
        {isAdmin && (
          <Link
            to="/admin"
            className="text-xs font-medium border border-arena-orange/50 text-arena-orange rounded-full px-3 py-1.5"
          >
            Admin
          </Link>
        )}
      </header>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <QuickAction to="/tournaments" label="Join Tournament" icon="🎮" />
        <QuickAction to="/matches" label="My Match" icon="📋" />
        <QuickAction to="/leaderboard" label="Leaderboard" icon="🏆" />
        <QuickAction to="/wallet" label="Wallet" icon="💰" />
      </div>

      {error && <p className="text-sm text-arena-red mb-4">{error}</p>}
      {!tournaments && !error && <LoadingSpinner label="Loading tournaments" />}

      {tournaments && (
        <div className="space-y-8">
          <Section title="Live now" tournaments={live} emptyText="No live matches right now." />
          <Section title="Upcoming" tournaments={upcoming} emptyText="No upcoming tournaments yet." />
          <Section title="Completed" tournaments={completed} emptyText="No completed tournaments yet." />
        </div>
      )}
    </div>
  );
}

function QuickAction({ to, label, icon }: { to: string; label: string; icon: string }) {
  return (
    <Link to={to} className="card flex items-center gap-3 p-4">
      <span className="text-2xl">{icon}</span>
      <span className="font-display font-semibold text-sm">{label}</span>
    </Link>
  );
}

function Section({
  title,
  tournaments,
  emptyText,
}: {
  title: string;
  tournaments: Tournament[];
  emptyText: string;
}) {
  return (
    <section>
      <h2 className="font-display text-lg font-semibold mb-3">{title}</h2>
      {tournaments.length === 0 ? (
        <p className="text-sm text-arena-muted">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {tournaments.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </div>
      )}
    </section>
  );
}
