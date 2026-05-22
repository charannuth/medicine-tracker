import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { AuthContext, type AuthContextValue, type SignUpResult } from './auth-context'

function authRedirectUrl() {
  return `${window.location.origin}/`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(() => supabase !== null)

  useEffect(() => {
    if (!supabase) return

    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session)
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase is not configured')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signUp = useCallback(async (email: string, password: string): Promise<SignUpResult> => {
    if (!supabase) throw new Error('Supabase is not configured')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return { needsVerification: data.session === null }
  }, [])

  const verifySignupOtp = useCallback(async (email: string, token: string) => {
    if (!supabase) throw new Error('Supabase is not configured')
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    })
    if (error) throw error
  }, [])

  const resendSignupOtp = useCallback(async (email: string) => {
    if (!supabase) throw new Error('Supabase is not configured')
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    })
    if (error) throw error
  }, [])

  const requestPasswordReset = useCallback(async (email: string) => {
    if (!supabase) throw new Error('Supabase is not configured')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: authRedirectUrl(),
    })
    if (error) throw error
  }, [])

  const verifyRecoveryOtp = useCallback(async (email: string, token: string) => {
    if (!supabase) throw new Error('Supabase is not configured')
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery',
    })
    if (error) throw error
  }, [])

  const resendRecoveryOtp = useCallback(async (email: string) => {
    if (!supabase) throw new Error('Supabase is not configured')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: authRedirectUrl(),
    })
    if (error) throw error
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    if (!supabase) throw new Error('Supabase is not configured')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
    const { data } = await supabase.auth.getSession()
    setSession(data.session)
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  const updateDisplayName = useCallback(async (displayName: string) => {
    if (!supabase) throw new Error('Supabase is not configured')
    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName.trim() },
    })
    if (error) throw error
    const { data } = await supabase.auth.getSession()
    setSession(data.session)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signIn,
      signUp,
      verifySignupOtp,
      resendSignupOtp,
      requestPasswordReset,
      verifyRecoveryOtp,
      resendRecoveryOtp,
      updatePassword,
      signOut,
      updateDisplayName,
    }),
    [
      session,
      loading,
      signIn,
      signUp,
      verifySignupOtp,
      resendSignupOtp,
      requestPasswordReset,
      verifyRecoveryOtp,
      resendRecoveryOtp,
      updatePassword,
      signOut,
      updateDisplayName,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
