import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { EMAIL_OTP_LENGTH } from '../lib/authOtp';
import { colors, radii, spacing } from '../constants/theme';

const RESEND_COOLDOWN_SEC = 60;

type EmailOtpVerificationProps = {
  email: string;
  description: string;
  verifyLabel?: string;
  busy: boolean;
  error: string | null;
  message: string | null;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack?: () => void;
};

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
  const [code, setCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SEC);
  const [resendBusy, setResendBusy] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function handleVerify() {
    const token = code.replace(/\D/g, '');
    if (token.length < EMAIL_OTP_LENGTH) return;
    await onVerify(token);
  }

  async function handleResend() {
    if (resendCooldown > 0 || resendBusy) return;
    setResendBusy(true);
    try {
      await onResend();
      setResendCooldown(RESEND_COOLDOWN_SEC);
    } finally {
      setResendBusy(false);
    }
  }

  return (
    <View>
      <Text style={styles.subtitle}>{description}</Text>
      <Text style={styles.hint}>
        Code sent to <Text style={styles.hintStrong}>{email}</Text>
      </Text>

      <Text style={styles.label}>Verification code</Text>
      <TextInput
        style={styles.otpInput}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        maxLength={EMAIL_OTP_LENGTH}
        placeholder={`${EMAIL_OTP_LENGTH}-digit code`}
        placeholderTextColor={colors.textMuted}
        value={code}
        onChangeText={(value) =>
          setCode(value.replace(/\D/g, '').slice(0, EMAIL_OTP_LENGTH))
        }
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.success}>{message}</Text> : null}

      <Pressable
        style={[styles.primaryButton, busy && styles.buttonDisabled]}
        disabled={busy || code.length < EMAIL_OTP_LENGTH}
        onPress={handleVerify}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>{verifyLabel}</Text>
        )}
      </Pressable>

      <Pressable
        style={styles.linkButton}
        disabled={resendCooldown > 0 || resendBusy}
        onPress={handleResend}
      >
        <Text style={styles.linkText}>
          {resendCooldown > 0
            ? `Resend code in ${resendCooldown}s`
            : resendBusy
              ? 'Sending…'
              : 'Resend code'}
        </Text>
      </Pressable>

      {onBack ? (
        <Pressable style={styles.linkButton} onPress={onBack}>
          <Text style={styles.linkText}>Back</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  hint: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  hintStrong: {
    color: colors.text,
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 24,
    letterSpacing: 6,
    textAlign: 'center',
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  error: {
    color: colors.error,
    marginBottom: spacing.sm,
  },
  success: {
    color: colors.success,
    marginBottom: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  linkButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  linkText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },
});
