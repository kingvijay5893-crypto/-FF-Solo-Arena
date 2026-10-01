import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../../lib/api';
import { Tournament } from '../../types';

export function AdminTournamentForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    date: '',
    startTime: '',
    maxPlayers: 48,
    rewardTokens: 10,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api.get<Tournament>(`/tournaments/${id}`).then((t) => {
      setForm({
        name: t.name,
        date: t.date,
        startTime: t.startTime,
        maxPlayers: t.maxPlayers,
        rewardTokens: t.rewardTokens,
      });
    });
  }, [id, isEdit]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (isEdit) {
        await api.patch(`/admin/tournaments/${id}`, form);
      } else {
        await api.post('/admin/tournaments', form);
      }
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save tournament.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-10">
      <h1 className="font-display text-2xl font-bold mb-5">
        {isEdit ? 'Edit tournament' : 'Create tournament'}
      </h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">Tournament name</label>
          <input
            required
            className="input"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              required
              className="input"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Start time</label>
            <input
              type="time"
              required
              className="input"
              value={form.startTime}
              onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Max players</label>
            <input
              type="number"
              min={2}
              max={100}
              required
              className="input"
              value={form.maxPlayers}
              onChange={(e) => setForm((f) => ({ ...f, maxPlayers: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className="label">Reward tokens</label>
            <input
              type="number"
              min={0}
              required
              className="input"
              value={form.rewardTokens}
              onChange={(e) => setForm((f) => ({ ...f, rewardTokens: Number(e.target.value) }))}
            />
          </div>
        </div>

        {error && <p className="text-sm text-arena-red">{error}</p>}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create tournament'}
        </button>
      </form>
    </div>
  );
}
