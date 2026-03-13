import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'

// Pages
import { OnboardingPage }   from './pages/Pages'
import AuthPage             from './pages/AuthPage'
import DashboardPage        from './pages/DashboardPage'
import AddMedPage           from './pages/AddMedPage'
import { MedicationsPage }  from './pages/Pages'
import { SchedulePage }     from './pages/Pages'
import { InteractionsPage } from './pages/Pages'
import { LabsPage }         from './pages/Pages'
import { ProfilePage }      from './pages/Pages'

// Components
import BottomNav from './components/BottomNav'
import LoadingScreen from './components/LoadingScreen'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/auth" replace />
  return children
}

export default function App() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />

  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />

        {/* Private */}
        <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/medications" element={<PrivateRoute><MedicationsPage /></PrivateRoute>} />
        <Route path="/medications/add" element={<PrivateRoute><AddMedPage /></PrivateRoute>} />
        <Route path="/schedule" element={<PrivateRoute><SchedulePage /></PrivateRoute>} />
        <Route path="/interactions" element={<PrivateRoute><InteractionsPage /></PrivateRoute>} />
        <Route path="/labs" element={<PrivateRoute><LabsPage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={user ? "/" : "/onboarding"} replace />} />
      </Routes>

      {/* Bottom nav only for logged in users */}
      {user && <BottomNav />}
    </>
  )
}
