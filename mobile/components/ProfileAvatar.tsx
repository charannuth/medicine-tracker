import { Image, StyleSheet, Text, View } from 'react-native';
import type { User } from '@supabase/supabase-js';
import { useTheme } from '../context/ThemeProvider';
import { getAvatarUrl, getDisplayName, getInitials } from '../lib/profile';
import { radii } from '../constants/theme';

export function ProfileAvatar({
  user,
  email,
  displayName,
  size = 'lg',
}: {
  user?: User | null;
  email?: string | null;
  displayName?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const resolvedName = displayName ?? getDisplayName(user ?? null) ?? undefined;
  const resolvedEmail = email ?? user?.email ?? undefined;
  const avatarUrl = getAvatarUrl(user ?? null);

  const { colors } = useTheme();
  const dims = size === 'sm' ? 34 : size === 'md' ? 44 : 60;
  const font = size === 'sm' ? 14 : size === 'md' ? 16 : 20;

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[
          styles.avatar,
          {
            width: dims,
            height: dims,
            borderRadius: dims / 2,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.avatar,
        styles.fallback,
        {
          width: dims,
          height: dims,
          borderRadius: dims / 2,
          borderColor: colors.avatarFallbackBorder,
          backgroundColor: colors.avatarFallbackBg,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize: font, color: colors.avatarInitials }]}>
        {getInitials(resolvedName, resolvedEmail)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderWidth: 1,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

