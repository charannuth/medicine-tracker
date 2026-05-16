import { useEffect, useState } from 'react'
import { getTheme, THEME_CHANGE_EVENT, toggleTheme, type Theme } from '../lib/settings'

export function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>(() => getTheme())

  useEffect(() => {
    function onThemeChange(e: Event) {
      setThemeState((e as CustomEvent<Theme>).detail)
    }
    window.addEventListener(THEME_CHANGE_EVENT, onThemeChange)
    return () => window.removeEventListener(THEME_CHANGE_EVENT, onThemeChange)
  }, [])

  function handleToggle() {
    setThemeState(toggleTheme())
  }

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={handleToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
