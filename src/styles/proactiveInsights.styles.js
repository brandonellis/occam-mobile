import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

export const proactiveInsightsStyles = StyleSheet.create({
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  sectionHint: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  scrollContent: {
    gap: spacing.md,
    paddingRight: spacing.lg,
  },

  // ── Insight card ──
  card: {
    width: 280,
    height: 200,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderLeftWidth: 3,
    justifyContent: 'space-between',
    ...shadows.sm,
  },
  cardWarning: {
    borderLeftColor: colors.warning,
  },
  cardUrgent: {
    borderLeftColor: colors.error,
  },
  cardRevenue: {
    borderLeftColor: colors.success,
  },
  cardCapacity: {
    borderLeftColor: colors.accent,
  },
  cardEngagement: {
    borderLeftColor: colors.twilightPurple,
  },
  cardCaddie: {
    borderLeftColor: colors.peachGlow,
  },
  cardConversions: {
    borderLeftColor: colors.info,
  },

  cardBody: {
    flex: 1,
    overflow: 'hidden',
  },

  // ── Card header ──
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.label,
    color: colors.textPrimary,
    flex: 1,
  },
  cardPeriod: {
    ...typography.bodySmall,
    fontSize: 10,
    color: colors.textTertiary,
  },

  // ── Trend badge ──
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  trendUp: {
    backgroundColor: colors.successSubtle,
  },
  trendDown: {
    backgroundColor: colors.errorSubtle,
  },
  trendFlat: {
    backgroundColor: colors.gray100,
  },
  trendText: {
    ...typography.bodySmall,
    fontSize: 10,
    fontWeight: '700',
  },
  trendTextUp: {
    color: colors.success,
  },
  trendTextDown: {
    color: colors.error,
  },
  trendTextFlat: {
    color: colors.textTertiary,
  },

  // ── Big number ──
  headline: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  headlineNumber: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  headlineLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },

  // ── Revenue amounts ──
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  revenueAmount: {
    alignItems: 'center',
  },
  revenueValue: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  revenuePeriod: {
    ...typography.bodySmall,
    fontSize: 10,
    color: colors.textTertiary,
    marginTop: 2,
  },
  revenueSep: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },

  // ── Stats row (capacity) ──
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    ...typography.label,
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.bodySmall,
    color: colors.textTertiary,
  },

  // ── Member list ──
  memberList: {
    marginBottom: spacing.sm,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  memberName: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  memberDetail: {
    ...typography.bodySmall,
    fontSize: 10,
    color: colors.textTertiary,
  },
  daysPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
  },
  daysPillHot: {
    backgroundColor: colors.errorSubtle,
  },
  daysPillText: {
    ...typography.bodySmall,
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  daysPillTextHot: {
    color: colors.error,
  },
  memberOverflow: {
    ...typography.bodySmall,
    fontSize: 10,
    color: colors.textTertiary,
    marginTop: 2,
  },

  // ── Highlights list (caddie demand / conversions) ──
  highlightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  highlightLabel: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  highlightCount: {
    ...typography.bodySmall,
    fontSize: 10,
    color: colors.textTertiary,
    fontWeight: '600',
  },

  // ── Trending badge ──
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.successSubtle,
  },
  trendingText: {
    ...typography.bodySmall,
    fontSize: 9,
    color: colors.success,
    fontWeight: '700',
  },

  // ── All clear state ──
  allClear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  allClearText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },

  // ── Marshal CTA ──
  marshalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    minHeight: 44,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  marshalLinkText: {
    ...typography.bodySmall,
    color: colors.accent,
    fontWeight: '600',
  },

  // ── Error / empty ──
  errorWrap: {
    padding: spacing.md,
    alignItems: 'center',
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
});
