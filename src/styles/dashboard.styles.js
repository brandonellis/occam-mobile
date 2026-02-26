import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

export const dashboardStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  greeting: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.xl,
  },

  // Stats cards
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
  statValue: {
    ...typography.h2,
    color: colors.accent,
  },
  statLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // Section header with "See All" link
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  seeAllLink: {
    ...typography.body,
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },

  // Upcoming bookings
  bookingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  bookingCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookingTimeBlock: {
    width: 64,
    marginRight: spacing.md,
  },
  bookingTimeValue: {
    ...typography.label,
    color: colors.info,
    fontSize: 13,
    fontWeight: '700',
  },
  bookingCardContent: {
    flex: 1,
  },
  bookingService: {
    ...typography.label,
    color: colors.textPrimary,
  },
  bookingTime: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
    fontSize: 12,
  },
  bookingCoach: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    marginTop: 2,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.textTertiary,
    marginTop: spacing.md,
    textAlign: 'center',
  },

  // Quick actions
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    ...shadows.sm,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  quickActionLabel: {
    ...typography.labelSmall,
    color: colors.textPrimary,
    fontSize: 10,
    textAlign: 'center',
  },
});
