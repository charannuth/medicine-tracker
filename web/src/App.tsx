import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import { AppLayout } from './components/AppLayout'
import { AuthPage } from './components/AuthPage'
import { ConfigGuard } from './components/ConfigGuard'
import { OnboardingModal } from './components/OnboardingModal'
import { userHasMedications } from './lib/medications'
import { isOnboardingDone, setOnboardingDone } from './lib/settings'
import { AccountPage } from './pages/AccountPage'
import { HelpPage } from './pages/HelpPage'
import { HistoryPage } from './pages/HistoryPage'
import { MedicationsPage } from './pages/MedicationsPage'
import { InteractionsPage } from './pages/InteractionsPage'
import { TodayPage } from './pages/TodayPage'
import { MedicalRecordsPage } from './pages/MedicalRecordsPage'
import { StreaksPage } from './pages/StreaksPage'
import { WellnessPage } from './pages/WellnessPage'
import './App.css'

function AuthenticatedRoutes({ user }: { user: User }) {
  const navigate = useNavigate()
  const [onboardingReady, setOnboardingReady] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    let active = true

    void (async () => {
      if (isOnboardingDone(user.id)) {
        if (active) {
          setShowOnboarding(false)
          setOnboardingReady(true)
        }
        return
      }

      try {
        const hasMeds = await userHasMedications(user.id)
        if (hasMeds) {
          setOnboardingDone(user.id)
          if (active) setShowOnboarding(false)
        } else if (active) {
          setShowOnboarding(true)
        }
      } catch {
        if (active) setShowOnboarding(true)
      } finally {
        if (active) setOnboardingReady(true)
      }
    })()

    return () => {
      active = false
    }
  }, [user.id])

  if (!onboardingReady) {
    return <p className="loading-screen">Loading…</p>
  }

  return (
    <>
      {showOnboarding && (
        <OnboardingModal
          userId={user.id}
          onDone={() => setShowOnboarding(false)}
          onAddMedication={() => {
            setShowOnboarding(false)
            navigate('/', { state: { openAdd: true } })
          }}
        />
      )}
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<TodayPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="streaks" element={<StreaksPage />} />
          <Route path="medications" element={<MedicationsPage />} />
          <Route path="interactions" element={<InteractionsPage />} />
          <Route path="medical-records" element={<MedicalRecordsPage />} />
          <Route path="wellness" element={<WellnessPage />} />
          <Route path="help" element={<HelpPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  )
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return <p className="loading-screen">Loading…</p>
  }

  if (!user) {
    return <AuthPage />
  }

  return <AuthenticatedRoutes key={user.id} user={user} />
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
