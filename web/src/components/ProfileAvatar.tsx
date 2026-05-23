import type { User } from '@supabase/supabase-js'
import { getAvatarUrl, getDisplayName, getInitials } from '../lib/profile'

type ProfileAvatarProps = {
  user?: User | null
  email?: string | null
  displayName?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ProfileAvatar({
  user,
  email,
  displayName,
  size = 'md',
  className = '',
}: ProfileAvatarProps) {
  const resolvedName = displayName ?? getDisplayName(user) ?? undefined
  const resolvedEmail = email ?? user?.email ?? undefined
  const avatarUrl = getAvatarUrl(user ?? null)
  const sizeClass = `profile-avatar-${size}`
  const classes = `profile-avatar ${sizeClass}${className ? ` ${className}` : ''}`

  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt="" className={`${classes} profile-avatar-img`} />
    )
  }

  return (
    <span className={classes} aria-hidden>
      {getInitials(resolvedName, resolvedEmail)}
    </span>
  )
}
