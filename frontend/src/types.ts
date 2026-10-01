export type UserRole = 'player' | 'admin';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  freeFireUid: string;
  nickname: string;
  role: UserRole;
  tokenBalance: number;
  totalTournaments: number;
  wins: number;
  totalKills: number;
  suspended: boolean;
  createdAt: string;
}

export type TournamentStatus = 'upcoming' | 'live' | 'completed';

export interface Tournament {
  id: string;
  name: string;
  mode: 'Solo';
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  maxPlayers: number;
  registeredPlayers: number;
  status: TournamentStatus;
  rewardTokens: number;
  // Only present in the API response when the requester is registered for
  // this tournament, or is an admin. Stripped server-side otherwise.
  roomId?: string | null;
  roomPassword?: string | null;
  roomPublished: boolean;
  createdAt: string;
}

export type RegistrationStatus = 'registered' | 'suspended';

export interface Registration {
  id: string;
  tournamentId: string;
  userId: string;
  freeFireUid: string;
  nickname: string;
  joinedAt: string;
  status: RegistrationStatus;
}

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface MatchResult {
  id: string;
  tournamentId: string;
  userId: string;
  rank: number;
  kills: number;
  screenshotUrl: string;
  verificationStatus: VerificationStatus;
  submittedAt: string;
}

export type TransactionType = 'tournament_reward' | 'adjustment';

export interface WalletTransaction {
  id: string;
  userId: string;
  tournamentId?: string;
  type: TransactionType;
  tokens: number;
  description: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  nickname: string;
  freeFireUid: string;
  rank: number;
  kills: number;
  score: number;
  tokensEarned: number;
}
