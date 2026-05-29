import { useMemo } from 'react';
import { Text, View } from 'react-native';
import type { ColorPalette } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import {
  getEarnedStreakBadges,
  getNextStreakBadge,
  STREAK_BADGES,
  type StreakBadge,
} from '../../lib/streakBadges';
import { TulipBadgeIcon } from './TulipBadgeIcon';

function makeBadgeStyles(colors: ColorPalette) {
  return {
    section: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.md,
    },
    title: { fontSize: 17, fontWeight: '900' as const, color: colors.text },
    hint: { color: colors.textMuted, lineHeight: 22 },
    grid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.sm,
      justifyContent: 'center' as const,
    },
    gridCatalog: {
      gap: spacing.sm,
    },
    tile: {
      alignItems: 'center' as const,
      padding: spacing.md,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: 100,
      gap: 4,
    },
    tileCatalog: {
      alignItems: 'center' as const,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6,
      width: '100%' as const,
    },
    tileEarned: { backgroundColor: colors.successBg, borderColor: colors.successBorder },
    tileLocked: { backgroundColor: colors.surface },
    tileDays: { fontWeight: '900' as const, color: colors.accent, fontSize: 13 },
    tileLabel: {
      fontWeight: '800' as const,
      color: colors.text,
      fontSize: 15,
      textAlign: 'center' as const,
    },
    tileReq: {
      fontWeight: '700' as const,
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center' as const,
    },
    tileReqEarned: { color: colors.success },
    tileDesc: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
      textAlign: 'center' as const,
      paddingHorizontal: spacing.sm,
      maxWidth: '100%' as const,
    },
    chip: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.successBorder,
      backgroundColor: colors.successBg,
    },
    chipDays: {
      fontWeight: '900' as const,
      fontSize: 13,
      color: colors.text,
    },
    chipRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.sm,
    },
  };
}

export function StreakBadges({
  longestStreak,
  compact = false,
  catalog = true,
}: {
  longestStreak: number;
  compact?: boolean;
  catalog?: boolean;
}) {
  const styles = useThemedStyles(makeBadgeStyles);

  function BadgeTile({
    badge,
    earned,
    catalog: catalogTile,
  }: {
    badge: StreakBadge;
    earned: boolean;
    catalog?: boolean;
  }) {
    const dayLabel = badge.minDays === 1 ? '1 day' : `${badge.minDays} days`;

    if (catalogTile) {
      return (
        <View
          style={[styles.tileCatalog, earned ? styles.tileEarned : styles.tileLocked]}
        >
          <TulipBadgeIcon earned={earned} minDays={badge.minDays} size={48} />
          <Text style={styles.tileLabel}>{badge.label}</Text>
          <Text style={[styles.tileReq, earned && styles.tileReqEarned]}>
            {earned ? 'Unlocked' : `Unlock at ${dayLabel}`}
          </Text>
          <Text style={styles.tileDesc}>{badge.description}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.tile, earned ? styles.tileEarned : styles.tileLocked]}>
        <TulipBadgeIcon earned={earned} minDays={badge.minDays} size={44} />
        <Text style={styles.tileDays}>{badge.minDays}d</Text>
        <Text style={styles.tileLabel}>{badge.label}</Text>
      </View>
    );
  }

  const earned = useMemo(() => getEarnedStreakBadges(longestStreak), [longestStreak]);
  const earnedIds = new Set(earned.map((b) => b.id));
  const next = useMemo(() => getNextStreakBadge(longestStreak), [longestStreak]);

  if (compact) {
    return (
      <View style={styles.section}>
        <Text style={styles.title}>Tulip badges</Text>
        {earned.length === 0 ? (
          <Text style={styles.hint}>
            Complete a perfect day to earn your first tulip badge.
          </Text>
        ) : (
          <View style={styles.chipRow}>
            {earned.map((badge) => (
              <View
                key={badge.id}
                style={styles.chip}
                accessibilityLabel={`${badge.label}, ${badge.minDays} days`}
              >
                <TulipBadgeIcon earned minDays={badge.minDays} size={32} />
                <Text style={styles.chipDays}>{badge.minDays}d</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  }

  if (catalog) {
    return (
      <View style={styles.section}>
        <Text style={styles.title}>Tulip badges</Text>
        <Text style={styles.hint}>
          Each badge unlocks when your longest streak reaches consecutive perfect days.
          {next ? ` Next: ${next.label} at ${next.minDays} days.` : ' You have every badge!'}
        </Text>
        <View style={styles.gridCatalog}>
          {STREAK_BADGES.map((badge) => (
            <BadgeTile
              key={badge.id}
              badge={badge}
              earned={earnedIds.has(badge.id)}
              catalog
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Streak badges</Text>
      <Text style={styles.hint}>
        Earn tulips for consecutive perfect adherence days.
        {next
          ? ` Next: ${next.label} at ${next.minDays} days${
              longestStreak > 0 ? ` (${next.minDays - longestStreak} to go)` : ''
            }.`
          : ' You have every badge!'}
      </Text>
      <View style={styles.grid}>
        {STREAK_BADGES.map((badge) => (
          <BadgeTile key={badge.id} badge={badge} earned={earnedIds.has(badge.id)} />
        ))}
      </View>
    </View>
  );
}
