import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, ApiError } from '../../lib/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';

interface AdminResultRow {
  resultId: string;
  userId: string;
  nickname: string;
  freeFireUid: string;
  rank: number;
  kills: number;
  screenshotUrl: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
}

export function AdminResults() {
  const { id } = useParams<{ id: string }>();
  const [rows, setRows] = useState<AdminResultRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    api
      .get<AdminResultRow[]>(`/admin/tournaments/${id}/results`)
      .then(setRows)
      .catch(() => setError('Could not load results.'));
  };

  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const decide = async (resultId: string, decision: 'verified' | 'rejected', isWinner = false) => {
    setBusyId(resultId);
    try {
      await api.patch(`/admin/results/${resultId}`, {
        verificationStatus: decision,
        markAsWinner: isWinner,
      });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update result.');
    } finally {
      setBusyId(null);
    }
  };

  if (error) return <p className="p-6 text-sm text-arena-red">{error}</p>;
  if (!rows) return <LoadingSpinner label="Loading results" />;

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-10">
      <h1 className="font-display text-2xl font-bold mb-5">Verify results</h1>

      {rows.length === 0 && <p className="text-sm text-arena-muted">No submitted results yet.</p>}

      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.resultId} className="card p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display font-semibold">{r.nickname}</p>
                <p className="text-xs text-arena-muted">UID {r.freeFireUid}</p>
              </div>
              <span
                className={`text-xs uppercase px-2 py-1 rounded-full ${
                  r.verificationStatus === 'verified'
                    ? 'bg-arena-orange/15 text-arena-orange'
                    : r.verificationStatus === 'rejected'
                    ? 'bg-arena-red/15 text-arena-red'
                    : 'bg-arena-surface2 text-arena-muted'
                }`}
              >
                {r.verificationStatus}
              </span>
            </div>

            <p className="text-sm mt-2">Rank #{r.rank} · {r.kills} kills</p>

            <details className="mt-2">
              <summary className="text-sm text-arena-orange cursor-pointer">View screenshot</summary>
              <img
                src={r.screenshotUrl}
                alt="Result screenshot"
                className="mt-2 w-full rounded-lg border border-arena-border"
              />
            </details>

            {r.verificationStatus === 'pending' && (
              <div className="flex gap-2 mt-3">
                <button
                  disabled={busyId === r.resultId}
                  onClick={() => decide(r.resultId, 'verified', r.rank === 1)}
                  className="btn-primary text-sm px-3 py-2 flex-1"
                >
                  {r.rank === 1 ? 'Verify & credit winner' : 'Verify'}
                </button>
                <button
                  disabled={busyId === r.resultId}
                  onClick={() => decide(r.resultId, 'rejected')}
                  className="btn-secondary text-sm px-3 py-2 flex-1"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
