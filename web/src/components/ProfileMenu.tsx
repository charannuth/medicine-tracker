import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function getInitials(email: string | undefined): string {
  if (!email) return '?'
  const local = email.split('@')[0] ?? ''
  if (local.length >= 2) return local.slice(0, 2).toUpperCase()
  return local.slice(0, 1).toUpperCase() || '?'
}

const navItems = [
  { to: '/', label: 'Today', end: true },
  { to: '/history', label: 'History', end: false },
  { to: '/wellness', label: 'Wellness', end: false },
  { to: '/account', label: 'My account', end: false },
  { to: '/medications', label: 'All medications', end: false },
  { to: '/interactions', label: 'Drug safety check', end: false },
  { to: '/help', label: 'Help & safety', end: false },
] as const

export function ProfileMenu() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  async function handleSignOut() {
    setOpen(false)
    await signOut()
    navigate('/')
  }

  return (
    <div ref={rootRef} className="profile-menu">
      <button
        type="button"
        className="profile-trigger"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Open menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="profile-avatar" aria-hidden>
          {getInitials(user?.email)}
        </span>
      </button>

      {open && (
        <div className="profile-dropdown" role="menu">
          <div className="profile-dropdown-header">
            <span className="profile-avatar profile-avatar-lg" aria-hidden>
              {getInitials(user?.email)}
            </span>
            <div>
              <p className="profile-dropdown-title">Signed in</p>
              <p className="profile-dropdown-email">{user?.email}</p>
            </div>
          </div>

          <nav className="profile-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                role="menuitem"
                className={({ isActive }) =>
                  `profile-nav-link${isActive ? ' active' : ''}`
                }
                onClick={() => setOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="profile-dropdown-footer">
            <button
              type="button"
              className="profile-nav-link profile-sign-out"
              role="menuitem"
              onClick={() => void handleSignOut()}
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
