import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeProvider';
import {
  getExpoImagePicker,
  IMAGE_PICKER_REBUILD_HINT,
} from '../../lib/expoImagePicker';
import { getAvatarUrl } from '../../lib/profile';
import { ProfileAvatar } from '../ProfileAvatar';
import { radii, spacing } from '../../constants/theme';

const MAX_FILE_BYTES = 8 * 1024 * 1024;

export function ProfilePictureEditor() {
  const { user, updateProfileAvatar, removeProfileAvatar } = useAuth();
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const hasAvatar = Boolean(getAvatarUrl(user));
  const styles = makeStyles(colors);

  async function pickFromLibrary() {
    setError(null);
    setMessage(null);

    let ImagePicker: Awaited<ReturnType<typeof getExpoImagePicker>>;
    try {
      ImagePicker = await getExpoImagePicker();
    } catch {
      ImagePicker = null;
    }

    if (!ImagePicker) {
      setError(IMAGE_PICKER_REBUILD_HINT);
      Alert.alert('Rebuild required', IMAGE_PICKER_REBUILD_HINT);
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Photo access needed',
        'Allow access to your photo library in Settings to choose a profile picture.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > MAX_FILE_BYTES) {
      setError('Image must be 8 MB or smaller.');
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      await updateProfileAvatar(blob);
      setMessage('Profile photo saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save photo');
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
        Optional. Your initials show until you add a photo. Use the square crop when picking from
        your library.
      </Text>

      <View style={styles.row}>
        <ProfileAvatar user={user} size="lg" />
        <View style={styles.actions}>
          <Pressable
            style={[styles.btn, busy && styles.btnDisabled]}
            disabled={busy}
            onPress={() => void pickFromLibrary()}
          >
            {busy ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.btnText}>{hasAvatar ? 'Change photo' : 'Choose from library'}</Text>
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
