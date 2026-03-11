import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

export const adminDashboardStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.tabBarClearance,
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroTitleBlock: {
    flex: 1,
    paddingRight: spacing.md,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: spacing.sm,
  },
  heroBadgeText: {
    ...typography.labelSmall,
    color: colors.accent,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  heroTitle: {
    ...typography.h2,
    color: colors.textInverse,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.textInverseMuted,
    marginTop: spacing.xs,
    lineHeight: 22,
  },
  heroBellButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    ...typography.labelSmall,
    color: colors.textInverse,
    fontSize: 10,
    fontWeight: '700',
  },
  heroContextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  heroContextPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accentSubtle,
    marginRight: spacing.sm,
  },
  heroContextPillText: {
    ...typography.labelSmall,
    color: colors.accent,
    fontWeight: '700',
  },
  heroContextText: {
    ...typography.bodySmall,
    color: colors.textInverseMuted,
  },
  heroMetricsRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  heroMetric: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  heroMetricDivider: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.08)',
  },
  heroMetricValue: {
    ...typography.h3,
    color: colors.textInverse,
    marginTop: spacing.xs,
  },
  heroMetricLabel: {
    ...typography.bodySmall,
    color: colors.textInverseMuted,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  statEyebrow: {
    ...typography.labelSmall,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statValue: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  statLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionHeaderCopy: {
    flex: 1,
    paddingRight: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  sectionHint: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
  },
  actionCard: {
    width: '48.5%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    minHeight: 124,
    ...shadows.sm,
  },
  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  actionTitle: {
    ...typography.label,
    color: colors.textPrimary,
  },
  actionSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  bookingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  bookingCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bookingTimeBlock: {
    width: 74,
    marginRight: spacing.md,
  },
  bookingTimeValue: {
    ...typography.label,
    color: colors.accentDark,
    fontSize: 15,
  },
  bookingTimeMeta: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    marginTop: 4,
  },
  bookingCardContent: {
    flex: 1,
  },
  bookingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bookingService: {
    ...typography.label,
    color: colors.textPrimary,
    flex: 1,
    paddingRight: spacing.sm,
  },
  bookingStatusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  bookingStatusText: {
    ...typography.labelSmall,
    fontWeight: '700',
  },
  bookingClient: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  bookingMeta: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  bookingCountText: {
    ...typography.labelSmall,
    color: colors.accent,
    fontWeight: '700',
  },
});
