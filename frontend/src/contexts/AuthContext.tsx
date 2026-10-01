import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../firebase';
import { api } from '../lib/api';
import { AppUser } from '../types';

interface RegisterInput {
  fullName: string;
  freeFireUid: string;
  nickname: string;
  mobile: string;
  email: string;
  password: string;
}

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  profile: AppUser | null;
  loading: boolean;
  isAdmin: boolean;
  register: (input: RegisterInput) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      const me = await api.get<AppUser>('/users/me');
      setProfile(me);
    } catch {
      setProfile(null);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await loadProfile();
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const register = async (input: RegisterInput) => {
    const cred = await createUserWithEmailAndPassword(
      auth,
      input.email,
      input.password
    );
    // Ask the backend to create the Firestore profile document — the
    // backend is the only thing allowed to write the `users` collection's
    // initial role/tokenBalance fields.
    await api.post('/users/register', {
      name: input.fullName,
      freeFireUid: input.freeFireUid,
      nickname: input.nickname,
      mobile: input.mobile,
      email: input.email,
      uid: cred.user.uid,
    });
    await loadProfile();
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    await loadProfile();
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  const value: AuthContextValue = {
    firebaseUser,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    register,
    login,
    logout,
    refreshProfile: loadProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
