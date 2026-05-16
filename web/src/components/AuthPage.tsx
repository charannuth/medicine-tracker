import { useState, type FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'

type AuthMode = 'signin' | 'signup' | 'forgot'

export function AuthPage() {
  const { signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setBusy(true)

    try {
      if (mode === 'forgot') {
        await resetPassword(email)
        setMessage('Check your email for a password reset link.')
      } else if (mode === 'signin') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
        setMessage('Check your email to confirm your account, then sign in.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Medicine Tracker</h1>
        <p className="auth-subtitle">
          {mode === 'forgot'
            ? 'We will email you a reset link.'
            : 'Sign in to manage medications and log doses.'}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          {mode !== 'forgot' && (
            <label>
              Password
              <input
                type="password"
                autoComplete={
                  mode === 'signin' ? 'current-password' : 'new-password'
                }
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          )}

          {error && <p className="form-error">{error}</p>}
          {message && <p className="form-success">{message}</p>}

          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy
              ? 'Please wait…'
              : mode === 'forgot'
                ? 'Send reset link'
                : mode === 'signin'
                  ? 'Sign in'
                  : 'Create account'}
          </button>
        </form>

        <p className="auth-toggle">
          {mode === 'signin' && (
            <>
              <button type="button" onClick={() => setMode('forgot')}>
                Forgot password?
              </button>
              {' · '}
              <button type="button" onClick={() => setMode('signup')}>
                Create account
              </button>
            </>
          )}
          {mode === 'signup' && (
            <>
              Already have an account?{' '}
              <button type="button" onClick={() => setMode('signin')}>
                Sign in
              </button>
            </>
          )}
          {mode === 'forgot' && (
            <>
              <button type="button" onClick={() => setMode('signin')}>
                Back to sign in
              </button>
            </>
          )}
        </p>

        <p className="disclaimer">
          For personal use only. Not medical advice — always follow your
          healthcare provider&apos;s instructions.
        </p>
      </div>
    </div>
  )
}
