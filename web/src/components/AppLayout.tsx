import { useCallback, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useReminderPoller } from '../hooks/useReminderPoller'
import { Header } from './Header'

export type LayoutOutletContext = {
  registerAddHandler: (handler: (() => void) | null) => void
}

export function AppLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const [addHandler, setAddHandler] = useState<(() => void) | null>(null)

  useReminderPoller(user?.id)

  const registerAddHandler = useCallback((handler: (() => void) | null) => {
    setAddHandler(() => handler)
  }, [])

  const showAdd = location.pathname === '/' && addHandler

  return (
    <div className="app-shell">
      <Header onAddClick={showAdd ? addHandler : undefined} />
      <Outlet context={{ registerAddHandler } satisfies LayoutOutletContext} />
    </div>
  )
}
