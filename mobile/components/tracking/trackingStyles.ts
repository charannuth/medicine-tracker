import { StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../../constants/theme';

export const trackingStyles = StyleSheet.create({
  hint: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  errorBanner: {
    backgroundColor: colors.errorBg,
    color: colors.error,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    fontSize: 14,
  },
  successBanner: {
    backgroundColor: colors.successBg,
    color: colors.success,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    fontSize: 14,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  textarea: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  secondaryBtnText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 15,
  },
  ghostBtn: {
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
  },
  ghostBtnText: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: 14,
  },
  dangerText: {
    color: colors.error,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.md,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    fontSize: 14,
    color: colors.text,
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  cardLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: spacing.sm,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  tabTextActive: {
    color: '#fff',
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  moduleTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  profileToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  profileSummary: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  addRow: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  selectBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    padding: 12,
    backgroundColor: colors.surface,
  },
  selectBtnText: {
    fontSize: 16,
    color: colors.text,
  },
  disabled: {
    opacity: 0.5,
  },
});
