import { useLocation } from 'react-router-dom'
import { ProfileMenu } from './ProfileMenu'
import { ThemeToggle } from './ThemeToggle'

type HeaderProps = {
  onAddClick?: () => void
}

export function Header({ onAddClick }: HeaderProps) {
  const location = useLocation()
  const showAdd = location.pathname === '/' && onAddClick

  return (
    <header className="app-header">
      <div className="header-brand">
        <ProfileMenu />
        <h1>Dr. Dose</h1>
      </div>
      <div className="header-actions">
        <ThemeToggle />
        {showAdd && (
          <button type="button" className="btn btn-secondary" onClick={onAddClick}>
            Add medication
          </button>
        )}
      </div>
    </header>
  )
}
