import { useEffect, useState, type FormEvent } from 'react'
import { EMAIL_OTP_LENGTH } from '../lib/authOtp'

const RESEND_COOLDOWN_SEC = 60

type EmailOtpVerificationProps = {
  email: string
  description: string
  verifyLabel?: string
  busy: boolean
  error: string | null
  message: string | null
  onVerify: (code: string) => Promise<void>
  onResend: () => Promise<void>
  onBack?: () => void
}

export function EmailOtpVerification({
  email,
  description,
  verifyLabel = 'Verify',
  busy,
  error,
  message,
  onVerify,
  onResend,
  onBack,
}: EmailOtpVerificationProps) {
  const [code, setCode] = useState('')
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SEC)
  const [resendBusy, setResendBusy] = useState(false)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = window.setInterval(() => {
      setResendCooldown((s) => Math.max(0, s - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [resendCooldown])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const token = code.replace(/\D/g, '')
    if (token.length < EMAIL_OTP_LENGTH) return
    await onVerify(token)
  }

  async function handleResend() {
    if (resendCooldown > 0 || resendBusy) return
    setResendBusy(true)
    try {
      await onResend()
      setResendCooldown(RESEND_COOLDOWN_SEC)
    } finally {
      setResendBusy(false)
    }
  }

  return (
    <>
      <p className="auth-subtitle">{description}</p>
      <p className="otp-email-hint">
        Code sent to <strong>{email}</strong>
      </p>

      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Verification code
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={EMAIL_OTP_LENGTH}
            required
            placeholder={`${EMAIL_OTP_LENGTH}-digit code`}
            className="otp-input"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, '').slice(0, EMAIL_OTP_LENGTH))
            }
          />
        </label>

        {error && <p className="form-error">{error}</p>}
        {message && <p className="form-success">{message}</p>}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={busy || code.replace(/\D/g, '').length < EMAIL_OTP_LENGTH}
        >
          {busy ? 'Verifying…' : verifyLabel}
        </button>
      </form>

      <p className="auth-toggle">
        <button
          type="button"
          disabled={resendCooldown > 0 || resendBusy}
          onClick={() => void handleResend()}
        >
          {resendBusy
            ? 'Sending…'
            : resendCooldown > 0
              ? `Resend code (${resendCooldown}s)`
              : 'Resend code'}
        </button>
        {onBack && (
          <>
            {' · '}
            <button type="button" onClick={onBack}>
              Back
            </button>
          </>
        )}
      </p>
    </>
  )
}
