import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../../lib/api';
import { Tournament } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';

interface AdminTournament extends Tournament {
  registeredCount: number;
}

export function AdminDashboard() {
  const [tournaments, setTournaments] = useState<AdminTournament[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    api
      .get<AdminTournament[]>('/admin/tournaments')
      .then(setTournaments)
      .catch(() => setError('Could not load tournaments.'));
  };

  useEffect(load, []);

  const publishRoom = async (id: string, roomId: string, roomPassword: string) => {
    setBusyId(id);
    try {
      await api.post(`/admin/tournaments/${id}/room`, { roomId, roomPassword });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not publish room details.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-10">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
        <Link to="/admin/tournaments/new" className="btn-secondary text-sm px-3 py-2">
          + New
        </Link>
      </div>

      {error && <p className="text-sm text-arena-red mb-3">{error}</p>}
      {!tournaments && !error && <LoadingSpinner label="Loading tournaments" />}

      <div className="space-y-3">
        {tournaments?.map((t) => (
          <div key={t.id} className="card p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display font-semibold">{t.name}</h3>
                <p className="text-xs text-arena-muted">
                  {t.date} · {t.startTime} · {t.registeredCount}/{t.maxPlayers} joined
                </p>
              </div>
              <span className="text-xs uppercase text-arena-muted">{t.status}</span>
            </div>

            <div className="flex gap-2 mt-3 flex-wrap">
              <Link
                to={`/admin/tournaments/${t.id}/edit`}
                className="text-xs font-medium border border-arena-border rounded-full px-3 py-1.5"
              >
                Edit
              </Link>
              <Link
                to={`/admin/tournaments/${t.id}/results`}
                className="text-xs font-medium border border-arena-border rounded-full px-3 py-1.5"
              >
                Results
              </Link>
              {!t.roomPublished && (
                <RoomPublishInline
                  onPublish={(roomId, pass) => publishRoom(t.id, roomId, pass)}
                  busy={busyId === t.id}
                />
              )}
              {t.roomPublished && (
                <span className="text-xs text-arena-orange px-3 py-1.5">Room published</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoomPublishInline({
  onPublish,
  busy,
}: {
  onPublish: (roomId: string, pass: string) => void;
  busy: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [pass, setPass] = useState('');

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-medium border border-arena-orange/50 text-arena-orange rounded-full px-3 py-1.5"
      >
        Publish room
      </button>
    );
  }

  return (
    <div className="w-full flex gap-2 mt-2">
      <input
        placeholder="Room ID"
        className="input text-sm py-2"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />
      <input
        placeholder="Password"
        className="input text-sm py-2"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
      />
      <button
        disabled={busy || !roomId || !pass}
        onClick={() => onPublish(roomId, pass)}
        className="btn-primary text-sm px-3 py-2 whitespace-nowrap"
      >
        {busy ? '…' : 'Send'}
      </button>
    </div>
  );
}
