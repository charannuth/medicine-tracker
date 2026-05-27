import type { AuthError } from '@supabase/supabase-js'

export function authErrorMessage(err: unknown): string {
  if (!err || typeof err !== 'object' || !('message' in err)) {
    return 'Something went wrong'
  }

  const message = String((err as AuthError).message)
  const lower = message.toLowerCase()

  if (lower.includes('invalid login credentials')) {
    return 'Incorrect email or password.'
  }
  if (lower.includes('email not confirmed')) {
    return 'Confirm your email with the verification code we sent, then sign in.'
  }
  if (lower.includes('token has expired') || lower.includes('otp_expired')) {
    return 'That code has expired. Request a new one.'
  }
  if (lower.includes('invalid') && lower.includes('token')) {
    return 'That code is incorrect. Check your email and try again.'
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many attempts. Wait a minute and try again.'
  }
  if (lower.includes('user already registered')) {
    return 'An account with this email already exists. Sign in instead.'
  }

  return message
}
