import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/tournaments', label: 'Tournaments', icon: TrophyIcon },
  { to: '/matches', label: 'Matches', icon: SwordIcon },
  { to: '/wallet', label: 'Wallet', icon: WalletIcon },
  { to: '/profile', label: 'Profile', icon: UserIcon },
];

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-arena-surface/95 backdrop-blur
                 border-t border-arena-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <ul className="flex justify-between px-2">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-xs transition-colors ${
                  isActive ? 'text-arena-orange' : 'text-arena-muted'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon active={isActive} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

type IconProps = { active: boolean };

function HomeIcon({ active }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF5A1F' : '#8B8B94'} strokeWidth="2">
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrophyIcon({ active }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF5A1F' : '#8B8B94'} strokeWidth="2">
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 5H4a2 2 0 0 0 2 4M18 5h2a2 2 0 0 1-2 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 13v3m-3 4h6m-6 0 1-1m5 1-1-1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SwordIcon({ active }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF5A1F' : '#8B8B94'} strokeWidth="2">
      <path d="m14 4 6 6-9 9-6-1-1-6 9-9Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m4 20 3-3" strokeLinecap="round" />
    </svg>
  );
}

function WalletIcon({ active }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF5A1F' : '#8B8B94'} strokeWidth="2">
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" strokeLinecap="round" />
      <circle cx="16" cy="14.5" r="1" fill={active ? '#FF5A1F' : '#8B8B94'} />
    </svg>
  );
}

function UserIcon({ active }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF5A1F' : '#8B8B94'} strokeWidth="2">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" strokeLinecap="round" />
    </svg>
  );
}
