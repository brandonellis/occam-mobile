import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

export const bookingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },

  // Step indicator
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
    gap: spacing.sm,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
    width: 24,
    borderRadius: 4,
  },
  stepDotCompleted: {
    backgroundColor: colors.accent,
  },
  stepConnector: {
    width: 16,
    height: 1,
    backgroundColor: colors.border,
  },

  // Service cards
  serviceCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  serviceCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  serviceName: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  serviceDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  servicePrice: {
    ...typography.label,
    color: colors.primary,
    fontSize: 16,
  },
  serviceDuration: {
    ...typography.bodySmall,
    color: colors.textTertiary,
  },

  // Coach cards
  coachCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  coachCardSelected: {
    borderColor: colors.primary,
  },
  coachInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  coachName: {
    ...typography.label,
    color: colors.textPrimary,
    fontSize: 16,
  },
  coachSpecialty: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Time slots
  dateSelector: {
    backgroundColor: colors.white,
    flexGrow: 0,
    flexShrink: 0,
    paddingVertical: spacing.xs,
  },
  dateItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    minWidth: 56,
    height: 68,
  },
  dateItemSelected: {
    backgroundColor: colors.primary,
  },
  dateItemDisabled: {
    opacity: 0.3,
  },
  dateDayName: {
    ...typography.labelSmall,
    color: colors.textTertiary,
    fontSize: 10,
  },
  dateDayNumber: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: 2,
  },
  dateDayNameSelected: {
    color: colors.textInverse,
  },
  dateDayNumberSelected: {
    color: colors.textInverse,
  },
  dateAvailabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  timeSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  timeSlot: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: '30%',
    alignItems: 'center',
  },
  timeSlotSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeSlotText: {
    ...typography.label,
    color: colors.textPrimary,
  },
  timeSlotTextSelected: {
    color: colors.textInverse,
  },
  timeSlotDisabled: {
    opacity: 0.3,
  },

  // Confirmation
  confirmSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  confirmLabel: {
    ...typography.labelSmall,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  confirmValue: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confirmDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  totalLabel: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  totalPrice: {
    ...typography.h2,
    color: colors.primary,
  },

  // Bottom action bar
  bottomBar: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    ...typography.button,
    color: colors.textInverse,
    fontSize: 16,
  },

  // Section headers
  sectionHeader: {
    ...typography.labelSmall,
    color: colors.textTertiary,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  noSlotsText: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing.xxxl,
  },

  // Payment summary
  summaryLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.body,
    color: colors.textPrimary,
  },
  confirmSubtext: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },

  // Fee breakdown (taxes & fees tooltip)
  feeBreakdown: {
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  feeBreakdownTitle: {
    ...typography.labelSmall,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },
  feeBreakdownItem: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  feeBreakdownDesc: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginTop: 4,
  },

  // Duration selection
  durationCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  durationCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  durationLabel: {
    ...typography.label,
    color: colors.textPrimary,
    fontSize: 16,
  },
  durationPrice: {
    ...typography.label,
    color: colors.primary,
    fontSize: 16,
  },

  // Membership allotment
  allotmentSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  allotmentTitle: {
    ...typography.label,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  allotmentItem: {
    marginBottom: spacing.sm,
  },
  allotmentItemCurrent: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    paddingLeft: spacing.sm,
  },
  allotmentServiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  allotmentServiceName: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontSize: 13,
  },
  allotmentServiceNameCurrent: {
    color: colors.primary,
    fontWeight: '600',
  },
  allotmentUsageText: {
    ...typography.bodySmall,
    fontSize: 12,
    fontWeight: '500',
  },
  allotmentProgressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  allotmentRemainingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  allotmentRemainingText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontSize: 11,
  },
  allotmentNoMembership: {
    backgroundColor: 'rgba(250, 173, 20, 0.08)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  allotmentNoMembershipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontSize: 13,
  },
  allotmentWarningBanner: {
    backgroundColor: 'rgba(250, 173, 20, 0.08)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },

  // Stripe card input
  cardSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  cardSectionTitle: {
    ...typography.label,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  cardField: {
    height: 50,
    marginVertical: spacing.xs,
  },
  cardError: {
    ...typography.bodySmall,
    color: colors.error,
    marginTop: 4,
  },
  cardFieldSkeleton: {
    height: 50,
    marginVertical: spacing.sm,
    backgroundColor: colors.border,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  cardFieldSkeletonShimmer: {
    width: '60%',
    height: '100%',
    backgroundColor: colors.background,
    opacity: 0.5,
    borderRadius: borderRadius.md,
  },
  confirmRowWithAvatar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  confirmValueWithMargin: {
    marginLeft: 12,
    flex: 1,
  },
  confirmPriceColumn: {
    alignItems: 'flex-end',
  },
  confirmTimeSubtext: {
    marginTop: 4,
  },
  summaryFeesRow: {
    marginTop: 4,
  },
  summaryFeesInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryInfoButton: {
    marginLeft: 6,
  },
  summaryInfoIcon: {
    fontSize: 14,
  },
  totalDivider: {
    marginVertical: spacing.sm,
  },
  loadingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  loadingBarText: {
    marginLeft: 8,
  },
  paymentDisabledBanner: {
    backgroundColor: 'rgba(24, 144, 255, 0.08)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  paymentDisabledText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontSize: 13,
  },

  // Class session styles
  classGroupContainer: {
    marginBottom: spacing.lg,
  },
  classGroupCoachName: {
    ...typography.bodyMedium,
    fontWeight: '600',
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  classSlotDisabled: {
    opacity: 0.4,
  },
  classSlotFull: {
    borderColor: colors.warning,
    borderWidth: 1,
  },
  classSlotSubtext: {
    fontSize: 10,
    marginTop: 2,
  },
  classSlotFullText: {
    color: colors.warning,
  },
  classSlotAvailableText: {
    color: colors.textSecondary,
  },
});
