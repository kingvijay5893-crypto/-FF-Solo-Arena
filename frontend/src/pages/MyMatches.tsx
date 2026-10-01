import { useEffect, useState } from 'react';
import { api, ApiError } from '../lib/api';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface MyMatch {
  registrationId: string;
  tournamentId: string;
  tournamentName: string;
  date: string;
  startTime: string;
  registrationStatus: string;
  roomStatus: 'not_published' | 'published';
  resultStatus: 'not_submitted' | 'pending' | 'verified' | 'rejected';
}

export function MyMatches() {
  const [matches, setMatches] = useState<MyMatch[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeForm, setActiveForm] = useState<string | null>(null);

  const load = () => {
    api
      .get<MyMatch[]>('/registrations/mine')
      .then(setMatches)
      .catch(() => setError('Could not load your matches.'));
  };

  useEffect(load, []);

  if (error) return <p className="p-6 text-sm text-arena-red">{error}</p>;
  if (!matches) return <LoadingSpinner label="Loading your matches" />;

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-10">
      <h1 className="font-display text-2xl font-bold mb-5">My Matches</h1>

      {matches.length === 0 && (
        <p className="text-sm text-arena-muted">
          You haven't joined any tournaments yet. Head to Tournaments to get started.
        </p>
      )}

      <div className="space-y-3">
        {matches.map((m) => (
          <div key={m.registrationId} className="card p-4">
            <h3 className="font-display font-semibold">{m.tournamentName}</h3>
            <p className="text-sm text-arena-muted">{m.date} · {m.startTime}</p>

            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <Badge label="Registration" value={m.registrationStatus} />
              <Badge label="Room" value={m.roomStatus.replace('_', ' ')} />
              <Badge label="Result" value={m.resultStatus.replace('_', ' ')} />
            </div>

            {m.resultStatus === 'not_submitted' && (
              <button
                className="btn-secondary w-full mt-4"
                onClick={() => setActiveForm(m.tournamentId)}
              >
                Submit result
              </button>
            )}

            {activeForm === m.tournamentId && (
              <ResultForm
                tournamentId={m.tournamentId}
                onDone={() => {
                  setActiveForm(null);
                  load();
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-arena-surface2 px-2 py-1.5 text-center">
      <div className="text-arena-muted">{label}</div>
      <div className="font-medium capitalize">{value}</div>
    </div>
  );
}

function ResultForm({ tournamentId, onDone }: { tournamentId: string; onDone: () => void }) {
  const [rank, setRank] = useState('');
  const [kills, setKills] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!file) {
      setError('Upload a result screenshot.');
      return;
    }
    const rankNum = Number(rank);
    const killsNum = Number(kills);
    if (!Number.isInteger(rankNum) || rankNum < 1) {
      setError('Enter a valid final rank.');
      return;
    }
    if (!Number.isInteger(killsNum) || killsNum < 0) {
      setError('Enter a valid kill count.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      // Shrink the screenshot on the phone first so it fits in Firestore
      // (no Firebase Storage / billing needed).
      const screenshotUrl = await compressImage(file);

      await api.post(`/results`, {
        tournamentId,
        rank: rankNum,
        kills: killsNum,
        screenshotUrl,
      });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit result.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 space-y-3 border-t border-arena-border pt-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Final rank</label>
          <input
            type="number"
            min={1}
            className="input"
            value={rank}
            onChange={(e) => setRank(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Kills</label>
          <input
            type="number"
            min={0}
            className="input"
            value={kills}
            onChange={(e) => setKills(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="label">Result screenshot</label>
        <input
          type="file"
          accept="image/*"
          className="input"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>
      {error && <p className="text-sm text-arena-red">{error}</p>}
      <button onClick={onSubmit} disabled={submitting} className="btn-primary w-full">
        {submitting ? 'Submitting…' : 'Submit result'}
      </button>
      <p className="text-xs text-arena-muted">
        Your result will show as "Pending Verification" until an admin checks it.
      </p>
    </div>
  );
}

async function compressImage(file: File, maxSize = 900, quality = 0.6): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Could not read this image.'));
      image.src = objectUrl;
    });
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Image processing is not supported on this device.');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
