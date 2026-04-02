import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

export const bookingDetailStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
  },
  statusBannerText: {
    ...typography.label,
    fontSize: 14,
  },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardTitle: {
    ...typography.labelSmall,
    color: colors.textTertiary,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  dateText: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  timeText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  primaryText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  secondaryText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  errorText: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  actionGroup: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  marshalButton: {
    borderRadius: borderRadius.md,
  },
  marshalButtonContent: {
    minHeight: 48,
  },
  marshalButtonLabel: {
    ...typography.label,
    fontSize: 14,
  },
  editButton: {
    borderRadius: borderRadius.md,
    borderColor: colors.accent,
  },
  editButtonContent: {
    minHeight: 48,
  },

  // Class session section
  capacityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  capacityBadges: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sectionDivider: {
    marginVertical: spacing.md,
  },
  subsectionLabel: {
    ...typography.labelSmall,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  attendeeName: {
    ...typography.body,
    color: colors.textPrimary,
  },
  waitlistPosition: {
    minWidth: 32,
  },
  enrollSearchbar: {
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
    elevation: 0,
  },
  enrollResultContent: {
    justifyContent: 'flex-start',
    minHeight: 44,
  },
  noResultsText: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  chipFull: {
    backgroundColor: colors.warningSubtle,
  },
  cancelSessionButton: {
    marginTop: spacing.sm,
    borderColor: colors.error,
  },
});
