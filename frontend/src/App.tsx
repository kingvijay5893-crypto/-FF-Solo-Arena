import { Routes, Route, useLocation } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';

import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Tournaments } from './pages/Tournaments';
import { TournamentDetail } from './pages/TournamentDetail';
import { MyMatches } from './pages/MyMatches';
import { Wallet } from './pages/Wallet';
import { Profile } from './pages/Profile';
import { Leaderboard } from './pages/Leaderboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminTournamentForm } from './pages/admin/AdminTournamentForm';
import { AdminResults } from './pages/admin/AdminResults';

export default function App() {
  const location = useLocation();
  const hideNav = ['/login', '/register'].includes(location.pathname);

  return (
    <div className="min-h-screen">
      <main className={hideNav ? '' : 'pb-20'}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/tournaments" element={<ProtectedRoute><Tournaments /></ProtectedRoute>} />
          <Route path="/tournaments/:id" element={<ProtectedRoute><TournamentDetail /></ProtectedRoute>} />
          <Route path="/matches" element={<ProtectedRoute><MyMatches /></ProtectedRoute>} />
          <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />

          <Route
            path="/admin"
            element={<AdminRoute><AdminDashboard /></AdminRoute>}
          />
          <Route
            path="/admin/tournaments/new"
            element={<AdminRoute><AdminTournamentForm /></AdminRoute>}
          />
          <Route
            path="/admin/tournaments/:id/edit"
            element={<AdminRoute><AdminTournamentForm /></AdminRoute>}
          />
          <Route
            path="/admin/tournaments/:id/results"
            element={<AdminRoute><AdminResults /></AdminRoute>}
          />
        </Routes>
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
