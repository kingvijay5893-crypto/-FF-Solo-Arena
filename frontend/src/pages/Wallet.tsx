import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { WalletTransaction } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

export function Wallet() {
  const { profile } = useAuth();
  const [transactions, setTransactions] = useState<WalletTransaction[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<WalletTransaction[]>('/wallet/transactions')
      .then(setTransactions)
      .catch(() => setError('Could not load wallet history.'));
  }, []);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-10">
      <h1 className="font-display text-2xl font-bold mb-5">Wallet</h1>

      <div className="card p-6 mb-6 text-center bg-gradient-to-br from-arena-surface to-arena-surface2">
        <p className="text-sm text-arena-muted">Token balance</p>
        <p className="font-display text-4xl font-bold text-arena-gold mt-1">
          {profile?.tokenBalance ?? 0}
        </p>
        <p className="text-xs text-arena-muted mt-2">Virtual tokens · not redeemable for cash</p>
      </div>

      <h2 className="font-display text-lg font-semibold mb-3">Reward history</h2>

      {error && <p className="text-sm text-arena-red">{error}</p>}
      {!transactions && !error && <LoadingSpinner label="Loading history" />}

      {transactions && transactions.length === 0 && (
        <p className="text-sm text-arena-muted">No token history yet — win a tournament to earn some.</p>
      )}

      <div className="space-y-2">
        {transactions?.map((t) => (
          <div key={t.id} className="card p-3.5 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{t.description}</p>
              <p className="text-xs text-arena-muted">{new Date(t.createdAt).toLocaleDateString()}</p>
            </div>
            <span className={`font-display font-semibold ${t.tokens >= 0 ? 'text-arena-gold' : 'text-arena-red'}`}>
              {t.tokens >= 0 ? '+' : ''}{t.tokens}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
