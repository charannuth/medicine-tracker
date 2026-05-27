import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../../constants/theme';
import {
  getEarnedStreakBadges,
  getNextStreakBadge,
  STREAK_BADGES,
  type StreakBadge,
} from '../../lib/streakBadges';
import { TulipBadgeIcon } from './TulipBadgeIcon';

function BadgeTile({
  badge,
  earned,
  catalog,
}: {
  badge: StreakBadge;
  earned: boolean;
  catalog?: boolean;
}) {
  const dayLabel = badge.minDays === 1 ? '1 day' : `${badge.minDays} days`;

  if (catalog) {
    return (
      <View
        style={[
          styles.tileCatalog,
          earned ? styles.tileEarned : styles.tileLocked,
        ]}
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

export function StreakBadges({
  longestStreak,
  catalog = true,
}: {
  longestStreak: number;
  catalog?: boolean;
}) {
  const earned = useMemo(() => getEarnedStreakBadges(longestStreak), [longestStreak]);
  const earnedIds = new Set(earned.map((b) => b.id));
  const next = useMemo(() => getNextStreakBadge(longestStreak), [longestStreak]);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Tulip badges</Text>
      <Text style={styles.hint}>
        Each badge unlocks when your longest streak reaches consecutive perfect days.
        {next ? ` Next: ${next.label} at ${next.minDays} days.` : ' You have every badge!'}
      </Text>
      <View style={catalog ? styles.gridCatalog : styles.grid}>
        {STREAK_BADGES.map((badge) => (
          <BadgeTile
            key={badge.id}
            badge={badge}
            earned={earnedIds.has(badge.id)}
            catalog={catalog}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: { fontSize: 17, fontWeight: '900', color: colors.text },
  hint: { color: colors.textMuted, lineHeight: 22 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  gridCatalog: {
    gap: spacing.sm,
  },
  tile: {
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 100,
    gap: 4,
  },
  tileCatalog: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
    width: '100%',
  },
  tileEarned: { backgroundColor: colors.successBg, borderColor: '#bbf7d0' },
  tileLocked: { backgroundColor: colors.surface },
  tileDays: { fontWeight: '900', color: colors.accent, fontSize: 13 },
  tileLabel: {
    fontWeight: '800',
    color: colors.text,
    fontSize: 15,
    textAlign: 'center',
  },
  tileReq: {
    fontWeight: '700',
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  tileReqEarned: { color: colors.success },
  tileDesc: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
    maxWidth: '100%',
  },
});
