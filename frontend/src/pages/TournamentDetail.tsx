import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { Tournament } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

interface DetailResponse extends Tournament {
  isRegistered: boolean;
  myFreeFireUid?: string;
  myNickname?: string;
}

export function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<DetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinForm, setJoinForm] = useState({ freeFireUid: '', nickname: '' });
  const [joinMessage, setJoinMessage] = useState<string | null>(null);

  const load = () => {
    api
      .get<DetailResponse>(`/tournaments/${id}`)
      .then((t) => {
        setData(t);
        setJoinForm({
          freeFireUid: profile?.freeFireUid || '',
          nickname: profile?.nickname || '',
        });
      })
      .catch(() => setError('Could not load this tournament.'));
  };

  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const countdown = useCountdown(data?.date, data?.startTime);

  const onJoin = async () => {
    if (!data) return;
    setJoining(true);
    setError(null);
    try {
      await api.post(`/tournaments/${data.id}/join`, joinForm);
      setJoinMessage('Successfully Joined');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not join tournament.');
    } finally {
      setJoining(false);
    }
  };

  if (error && !data) {
    return <p className="p-6 text-sm text-arena-red">{error}</p>;
  }
  if (!data) return <LoadingSpinner label="Loading tournament" />;

  const full = data.registeredPlayers >= data.maxPlayers;

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-10">
      <button onClick={() => navigate(-1)} className="text-sm text-arena-muted mb-4">
        ← Back
      </button>

      <h1 className="font-display text-2xl font-bold">{data.name}</h1>
      <div className="flex gap-4 mt-2 text-sm text-arena-muted">
        <span>Solo</span>
        <span>{data.date}</span>
        <span>{data.startTime}</span>
      </div>

      <div className="card p-4 mt-5 grid grid-cols-2 gap-4">
        <Stat label="Players" value={`${data.registeredPlayers} / ${data.maxPlayers}`} />
        <Stat label="Reward" value={`${data.rewardTokens} tokens`} />
        <Stat label="Status" value={data.status} />
        {data.status !== 'completed' && <Stat label="Starts in" value={countdown} />}
      </div>

      {joinMessage && (
        <div className="card p-4 mt-5 border-arena-orange/50 bg-arena-orange/10 text-arena-orange text-center font-display font-semibold">
          {joinMessage}
        </div>
      )}

      {!data.isRegistered && data.status === 'upcoming' && (
        <div className="mt-6 space-y-3">
          <h2 className="font-display text-lg font-semibold">Join this tournament</h2>
          <div>
            <label className="label">Free Fire UID</label>
            <input
              className="input"
              value={joinForm.freeFireUid}
              onChange={(e) => setJoinForm((f) => ({ ...f, freeFireUid: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Nickname</label>
            <input
              className="input"
              value={joinForm.nickname}
              onChange={(e) => setJoinForm((f) => ({ ...f, nickname: e.target.value }))}
            />
          </div>
          {error && <p className="text-sm text-arena-red">{error}</p>}
          <button
            onClick={onJoin}
            disabled={joining || full}
            className="btn-primary w-full"
          >
            {full ? 'Tournament full' : joining ? 'Joining…' : 'Join Tournament'}
          </button>
        </div>
      )}

      {data.isRegistered && (
        <div className="mt-6">
          <h2 className="font-display text-lg font-semibold mb-3">Room details</h2>
          {data.roomPublished && data.roomId ? (
            <div className="card p-4 space-y-2">
              <Row label="Room ID" value={data.roomId} />
              <Row label="Password" value={data.roomPassword || '—'} />
            </div>
          ) : (
            <p className="text-sm text-arena-muted">
              Room ID and password will appear here once the admin publishes them.
            </p>
          )}
        </div>
      )}

      {data.isRegistered && data.status !== 'upcoming' && (
        <button
          onClick={() => navigate(`/matches`)}
          className="btn-secondary w-full mt-6"
        >
          Submit your result in My Matches
        </button>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-arena-muted">{label}</div>
      <div className="font-display font-semibold capitalize">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-arena-muted text-sm">{label}</span>
      <span className="font-mono font-semibold">{value}</span>
    </div>
  );
}

function useCountdown(date?: string, time?: string) {
  const target = useMemo(() => {
    if (!date || !time) return null;
    const parsed = new Date(`${date}T${time}:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [date, time]);

  const [label, setLabel] = useState('—');

  useEffect(() => {
    if (!target) return;
    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setLabel('Starting');
        return;
      }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      setLabel(`${h}h ${m}m ${s}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [target]);

  return label;
}
