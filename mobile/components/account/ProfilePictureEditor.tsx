import { useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeProvider';
import { getAvatarUrl } from '../../lib/profile';
import {
  openAppSettings,
  PhotoPermissionError,
  pickProfilePhotoFromLibrary,
  profilePhotoPermissionMessage,
  takeProfilePhotoWithCamera,
} from '../../lib/profilePhoto';
import { ProfileAvatar } from '../ProfileAvatar';
import { radii, spacing } from '../../constants/theme';

export function ProfilePictureEditor() {
  const { user, updateProfileAvatar, removeProfileAvatar } = useAuth();
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const hasAvatar = Boolean(getAvatarUrl(user));
  const styles = makeStyles(colors);

  function showSourcePicker() {
    const chooseLibrary = () => void saveFromLibrary();
    const chooseCamera = () => void saveFromCamera();

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Choose from library', 'Take photo'],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) chooseLibrary();
          if (index === 2) chooseCamera();
        },
      );
      return;
    }

    Alert.alert('Profile photo', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Photo library', onPress: chooseLibrary },
      { text: 'Camera', onPress: chooseCamera },
    ]);
  }

  function handlePermissionError(source: 'library' | 'camera') {
    Alert.alert(
      source === 'library' ? 'Photo access needed' : 'Camera access needed',
      profilePhotoPermissionMessage(source),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            void openAppSettings().catch(() => Linking.openSettings());
          },
        },
      ],
    );
  }

  async function saveFromLibrary() {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const bytes = await pickProfilePhotoFromLibrary();
      if (!bytes) return;
      await updateProfileAvatar(bytes);
      setMessage('Profile photo saved.');
    } catch (err) {
      if (err instanceof PhotoPermissionError) {
        handlePermissionError('library');
      } else {
        setError(err instanceof Error ? err.message : 'Could not choose photo');
      }
    } finally {
      setBusy(false);
    }
  }

  async function saveFromCamera() {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const bytes = await takeProfilePhotoWithCamera();
      if (!bytes) return;
      await updateProfileAvatar(bytes);
      setMessage('Profile photo saved.');
    } catch (err) {
      if (err instanceof PhotoPermissionError) {
        handlePermissionError('camera');
      } else {
        setError(err instanceof Error ? err.message : 'Could not take photo');
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (!hasAvatar) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await removeProfileAvatar();
      setMessage('Profile photo removed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove photo');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Profile photo</Text>
      <Text style={styles.hint}>
        Optional. Pick from your photo library or take a new photo — use the square crop, then save.
        Your initials show until you add one.
      </Text>

      <View style={styles.row}>
        <ProfileAvatar user={user} size="lg" />
        <View style={styles.actions}>
          <Pressable
            style={[styles.btn, busy && styles.btnDisabled]}
            disabled={busy}
            onPress={showSourcePicker}
          >
            {busy ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.btnText}>
                {hasAvatar ? 'Change photo' : 'Add photo'}
              </Text>
            )}
          </Pressable>
          {hasAvatar ? (
            <Pressable
              style={[styles.btnGhost, busy && styles.btnDisabled]}
              disabled={busy}
              onPress={() => void handleRemove()}
            >
              <Text style={styles.btnGhostText}>Remove photo</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.success}>{message}</Text> : null}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    wrap: { gap: spacing.sm },
    title: { fontSize: 16, fontWeight: '900', color: colors.text },
    hint: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
    row: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', marginTop: spacing.xs },
    actions: { flex: 1, gap: spacing.sm },
    btn: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      paddingVertical: 10,
      paddingHorizontal: spacing.md,
      alignItems: 'center',
      backgroundColor: colors.bg,
    },
    btnText: { fontWeight: '700', color: colors.text },
    btnGhost: { paddingVertical: 8, alignItems: 'center' },
    btnGhostText: { fontWeight: '700', color: colors.textMuted },
    btnDisabled: { opacity: 0.6 },
    error: { color: colors.error, fontWeight: '600', lineHeight: 20 },
    success: { color: colors.success, fontWeight: '600' },
  });
}
