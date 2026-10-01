import { Link } from 'react-router-dom';
import { Tournament } from '../types';

const statusStyles: Record<Tournament['status'], string> = {
  upcoming: 'bg-arena-surface2 text-arena-gold border-arena-gold/30',
  live: 'bg-arena-red/15 text-arena-red border-arena-red/40 animate-pulse',
  completed: 'bg-arena-surface2 text-arena-muted border-arena-border',
};

const statusLabel: Record<Tournament['status'], string> = {
  upcoming: 'Upcoming',
  live: 'Live now',
  completed: 'Completed',
};

export function TournamentCard({ tournament }: { tournament: Tournament }) {
  const full = tournament.registeredPlayers >= tournament.maxPlayers;

  return (
    <Link
      to={`/tournaments/${tournament.id}`}
      className="card block p-4 hover:border-arena-orange/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-lg font-semibold leading-tight">
          {tournament.name}
        </h3>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[tournament.status]}`}
        >
          {statusLabel[tournament.status]}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-arena-muted">
        <span>Solo</span>
        <span>{tournament.date}</span>
        <span>{tournament.startTime}</span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm">
          <span className={full ? 'text-arena-red' : 'text-arena-text'}>
            {tournament.registeredPlayers}
          </span>
          <span className="text-arena-muted"> / {tournament.maxPlayers} players</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-arena-gold">
          <TokenIcon />
          {tournament.rewardTokens} tokens
        </div>
      </div>
    </Link>
  );
}

function TokenIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8M12 8v8" strokeLinecap="round" />
    </svg>
  );
}
