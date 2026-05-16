import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import { AppLayout } from './components/AppLayout'
import { AuthPage } from './components/AuthPage'
import { ConfigGuard } from './components/ConfigGuard'
import { OnboardingModal } from './components/OnboardingModal'
import { isOnboardingDone } from './lib/settings'
import { AccountPage } from './pages/AccountPage'
import { HelpPage } from './pages/HelpPage'
import { HistoryPage } from './pages/HistoryPage'
import { MedicationsPage } from './pages/MedicationsPage'
import { InteractionsPage } from './pages/InteractionsPage'
import { TodayPage } from './pages/TodayPage'
import './App.css'

function AppRoutes() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const showOnboarding = Boolean(user) && !isOnboardingDone()

  if (loading) {
    return <p className="loading-screen">Loading…</p>
  }

  if (!user) {
    return <AuthPage />
  }

  return (
    <>
      {showOnboarding && (
        <OnboardingModal
          onDone={() => {}}
          onAddMedication={() => navigate('/', { state: { openAdd: true } })}
        />
      )}
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<TodayPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="medications" element={<MedicationsPage />} />
          <Route path="interactions" element={<InteractionsPage />} />
          <Route path="help" element={<HelpPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <ConfigGuard>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ConfigGuard>
  )
}
