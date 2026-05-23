import { supabase } from './supabase'

const BUCKET = 'avatars'

export function avatarStoragePath(userId: string): string {
  return `${userId}/avatar.jpg`
}

export async function uploadAvatar(userId: string, blob: Blob): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured')

  const path = avatarStoragePath(userId)
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    upsert: true,
    contentType: 'image/jpeg',
    cacheControl: '3600',
  })

  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  const base = data.publicUrl
  return `${base}${base.includes('?') ? '&' : '?'}v=${Date.now()}`
}

export async function deleteAvatar(userId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([avatarStoragePath(userId)])
  if (error) throw error
}
