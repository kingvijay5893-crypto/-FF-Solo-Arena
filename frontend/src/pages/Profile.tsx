import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function Profile() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  if (!profile) return <LoadingSpinner label="Loading profile" />;

  const stats = [
    { label: 'Tournaments', value: profile.totalTournaments },
    { label: 'Wins', value: profile.wins },
    { label: 'Total kills', value: profile.totalKills },
    { label: 'Tokens earned', value: profile.tokenBalance },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-10">
      <h1 className="font-display text-2xl font-bold mb-5">Profile</h1>

      <div className="card p-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-arena-orange to-arena-red flex items-center justify-center font-display text-xl font-bold">
            {profile.nickname.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-display text-lg font-semibold">{profile.nickname}</p>
            <p className="text-sm text-arena-muted">{profile.name}</p>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <Row label="Free Fire UID" value={profile.freeFireUid} />
          <Row label="Email" value={profile.email} />
          <Row label="Mobile" value={profile.mobile} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <p className="font-display text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-arena-muted mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <button
        onClick={async () => {
          await logout();
          navigate('/login', { replace: true });
        }}
        className="btn-secondary w-full"
      >
        Sign out
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-arena-muted">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
