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
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.label,
    color: colors.textTertiary,
  },
  tabTextActive: {
    color: colors.primary,
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
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bookingService: {
    ...typography.label,
    color: colors.textPrimary,
    fontSize: 16,
    flex: 1,
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
  bookingDetails: {
    marginTop: spacing.sm,
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  bookingDetailText: {
    ...typography.body,
    color: colors.textSecondary,
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
    backgroundColor: colors.primary,
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
