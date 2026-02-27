import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

export const bookingsListStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.accent,
  },
  tabText: {
    ...typography.label,
    color: colors.textTertiary,
  },
  tabTextActive: {
    color: colors.accent,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  filterChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterChipText: {
    ...typography.labelSmall,
    color: colors.textSecondary,
    fontSize: 12,
  },
  filterChipTextActive: {
    color: colors.textInverse,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
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
  bookingTimeDate: {
    ...typography.labelSmall,
    color: colors.textTertiary,
    fontSize: 10,
    marginTop: 2,
  },
  bookingCardContent: {
    flex: 1,
  },
  bookingService: {
    ...typography.label,
    color: colors.textPrimary,
  },
  bookingCoach: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    marginTop: 2,
  },
  bookingLocation: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
    fontSize: 12,
  },
  bookingEndColumn: {
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
    gap: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  statusConfirmed: {
    backgroundColor: colors.successLight,
  },
  statusPending: {
    backgroundColor: colors.warningLight,
  },
  statusCancelled: {
    backgroundColor: colors.errorLight,
  },
  statusCompleted: {
    backgroundColor: colors.background,
  },
  statusText: {
    ...typography.labelSmall,
    fontSize: 10,
  },
  statusTextConfirmed: {
    color: colors.success,
  },
  statusTextPending: {
    color: colors.warning,
  },
  statusTextCancelled: {
    color: colors.error,
  },
  statusTextCompleted: {
    color: colors.textTertiary,
  },
  bookingActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.md,
  },
  cancelButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  cancelButtonText: {
    ...typography.label,
    color: colors.error,
    fontSize: 13,
  },
  rebookButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
  },
  rebookButtonText: {
    ...typography.label,
    color: colors.textInverse,
    fontSize: 13,
  },
});
