import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ProfileAvatar } from './ProfileAvatar'

const navItems = [
  { to: '/', label: 'Today', end: true },
  { to: '/history', label: 'History', end: false },
  { to: '/wellness', label: 'Wellness', end: false },
  { to: '/account', label: 'My account', end: false },
  { to: '/medications', label: 'All medications', end: false },
  { to: '/interactions', label: 'Drug safety check', end: false },
  { to: '/help', label: 'Help & safety', end: false },
] as const

const CLOSE_DELAY_MS = 220
const SIDEBAR_TRANSITION_MS = 300

export function ProfileMenu() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const sidebarId = useId()
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [pinned, setPinned] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelScheduledClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const beginClose = useCallback(() => {
    cancelScheduledClose()
    setVisible(false)
  }, [cancelScheduledClose])

  const scheduleClose = useCallback(() => {
    cancelScheduledClose()
    closeTimerRef.current = setTimeout(() => {
      beginClose()
    }, CLOSE_DELAY_MS)
  }, [cancelScheduledClose, beginClose])

  const closeMenu = useCallback(() => {
    setPinned(false)
    beginClose()
  }, [beginClose])

  const openMenu = useCallback(() => {
    cancelScheduledClose()
    if (!mounted) {
      setMounted(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true))
      })
      return
    }
    setVisible(true)
  }, [cancelScheduledClose, mounted])

  useEffect(() => {
    return () => cancelScheduledClose()
  }, [cancelScheduledClose])

  useEffect(() => {
    if (!mounted || visible) return

    const timeout = window.setTimeout(() => {
      setMounted(false)
      setPinned(false)
    }, SIDEBAR_TRANSITION_MS)

    return () => window.clearTimeout(timeout)
  }, [mounted, visible])

  useEffect(() => {
    if (!mounted) return

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') closeMenu()
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [mounted, closeMenu])

  function handleTriggerMouseEnter() {
    openMenu()
  }

  function handleTriggerMouseLeave() {
    if (!pinned) scheduleClose()
  }

  function handleSidebarMouseEnter() {
    openMenu()
  }

  function handleSidebarMouseLeave() {
    if (!pinned) scheduleClose()
  }

  function handleTriggerClick() {
    cancelScheduledClose()
    if (visible && pinned) {
      closeMenu()
      return
    }
    setPinned(true)
    openMenu()
  }

  async function handleSignOut() {
    closeMenu()
    await signOut()
    navigate('/')
  }

  const sidebar =
    mounted && typeof document !== 'undefined'
      ? createPortal(
          <>
            <button
              type="button"
              className={`profile-sidebar-backdrop${visible ? ' is-visible' : ''}`}
              aria-label="Close menu"
              tabIndex={visible ? 0 : -1}
              onClick={closeMenu}
            />
            <aside
              id={sidebarId}
              className={`profile-sidebar${visible ? ' is-visible' : ''}`}
              role="navigation"
              aria-label="Main menu"
              aria-hidden={!visible}
              onMouseEnter={handleSidebarMouseEnter}
              onMouseLeave={handleSidebarMouseLeave}
            >
              <div className="profile-sidebar-header">
                <ProfileAvatar user={user} size="lg" />
                <div className="profile-sidebar-user">
                  <p className="profile-dropdown-title">Signed in</p>
                  <p className="profile-dropdown-email">{user?.email}</p>
                </div>
              </div>

              <nav className="profile-nav profile-sidebar-nav">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `profile-nav-link${isActive ? ' active' : ''}`
                    }
                    onClick={closeMenu}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <div className="profile-sidebar-footer">
                <button
                  type="button"
                  className="profile-nav-link profile-sign-out"
                  onClick={() => void handleSignOut()}
                >
                  Sign out
                </button>
              </div>
            </aside>
          </>,
          document.body,
        )
      : null

  return (
    <div className="profile-menu">
      <button
        type="button"
        className={`profile-trigger${mounted ? ' profile-trigger-open' : ''}`}
        aria-expanded={visible}
        aria-controls={sidebarId}
        aria-label={visible ? 'Close menu' : 'Open menu'}
        onClick={handleTriggerClick}
        onMouseEnter={handleTriggerMouseEnter}
        onMouseLeave={handleTriggerMouseLeave}
      >
        <ProfileAvatar user={user} size="sm" />
      </button>
      {sidebar}
    </div>
  )
}
