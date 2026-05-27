import type { User } from '@supabase/supabase-js'

export function getInitials(
  displayName: string | undefined,
  email: string | undefined,
): string {
  const name = displayName?.trim()
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    if (parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase()
    return parts[0].slice(0, 1).toUpperCase()
  }
  if (!email) return '?'
  const local = email.split('@')[0] ?? ''
  if (local.length >= 2) return local.slice(0, 2).toUpperCase()
  return local.slice(0, 1).toUpperCase() || '?'
}

export function getAvatarUrl(user: User | null | undefined): string | null {
  const url = user?.user_metadata?.avatar_url
  if (typeof url === 'string' && url.trim()) return url.trim()
  return null
}

export function getDisplayName(user: User | null | undefined): string | undefined {
  const name = user?.user_metadata?.display_name
  return typeof name === 'string' ? name : undefined
}
