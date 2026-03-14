import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LoadingScreen from './components/LoadingScreen'
import BottomNav from './components/BottomNav'

import {
  OnboardingPage,
  SchedulePage,
  InteractionsPage,
  LabsPage,
  ProfilePage,
  MedicationsPage,
} from './pages/Pages'
import AuthPage     from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import AddMedPage   from './pages/AddMedPage'

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
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />

        <Route path="/"                element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/medications"     element={<PrivateRoute><MedicationsPage /></PrivateRoute>} />
        <Route path="/medications/add" element={<PrivateRoute><AddMedPage /></PrivateRoute>} />
        <Route path="/schedule"        element={<PrivateRoute><SchedulePage /></PrivateRoute>} />
        <Route path="/interactions"    element={<PrivateRoute><InteractionsPage /></PrivateRoute>} />
        <Route path="/labs"            element={<PrivateRoute><LabsPage /></PrivateRoute>} />
        <Route path="/profile"         element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

        <Route path="*" element={<Navigate to={user ? '/' : '/onboarding'} replace />} />
      </Routes>
      {user && <BottomNav />}
    </>
  )
}
