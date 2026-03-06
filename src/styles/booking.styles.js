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
    backgroundColor: colors.accent,
    width: 24,
    borderRadius: 4,
  },
  stepDotCompleted: {
    backgroundColor: colors.success,
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
    borderColor: colors.accent,
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
    color: colors.accent,
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
    marginBottom: spacing.md,
    ...shadows.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  coachCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  coachCardSelected: {
    borderColor: colors.accent,
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
    color: colors.accent,
  },

  // Bottom action bar
  bottomBar: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
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
    marginBottom: spacing.md,
    ...shadows.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  durationCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  durationCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.white,
  },
  durationLabel: {
    ...typography.label,
    color: colors.textPrimary,
    fontSize: 16,
  },
  durationPrice: {
    ...typography.label,
    color: colors.accent,
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
    borderLeftColor: colors.accent,
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
    color: colors.accent,
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
  skeletonBlock: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  skeletonBar: {
    width: '100%',
    height: 14,
    backgroundColor: colors.border,
    borderRadius: borderRadius.sm,
  },
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
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

  // Skeleton loading
  skeletonSlot: {
    borderColor: colors.borderLight,
    backgroundColor: colors.gray100,
  },
  skeletonTextBlock: {
    width: 48,
    height: 14,
    borderRadius: 4,
    backgroundColor: colors.gray200,
  },

  // Membership filter hint
  membershipHint: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  membershipHintText: {
    color: colors.textSecondary,
    fontSize: 13,
  },

  // Empty service state
  emptyServiceContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyServiceText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },

  // Payment mode toggle
  paymentModeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    padding: 3,
    marginBottom: spacing.lg,
  },
  paymentModeOption: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md - 2,
  },
  paymentModeOptionActive: {
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  paymentModeText: {
    ...typography.label,
    fontSize: 14,
    color: colors.textTertiary,
  },
  paymentModeTextActive: {
    color: colors.textPrimary,
  },

  // Saved card items
  savedCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  savedCardItemSelected: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(76, 172, 213, 0.08)',
  },
  savedCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  savedCardBrand: {
    ...typography.bodySmall,
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  savedCardLast4: {
    ...typography.label,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '600',
    letterSpacing: 1,
  },
  savedCardExpiry: {
    ...typography.bodySmall,
    fontSize: 12,
    fontWeight: '400',
    color: colors.textTertiary,
    letterSpacing: 0,
  },
  savedCardTextSelected: {
    color: colors.accent,
  },
  savedCardRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.gray400,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  savedCardRadioSelected: {
    borderColor: colors.accent,
  },
  savedCardRadioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent,
  },

  // Success screen
  successContainer: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  successIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  successTitle: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  successSubtitle: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.md,
    lineHeight: 22,
  },
  successCodeContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderStyle: 'dashed',
  },
  successCodeLabel: {
    ...typography.labelSmall,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  successCodeValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  successDetailsCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  successDetailLabel: {
    ...typography.labelSmall,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  successDetailValue: {
    ...typography.bodyLarge,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  successDetailTime: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  successDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  successDetailDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
  successBottomBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  successSecondaryButton: {
    flex: 1,
    height: 52,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  successSecondaryButtonText: {
    ...typography.button,
    color: colors.textPrimary,
  },
  successPrimaryFull: {
    flex: 1,
  },
  successDetailValueWithMargin: {
    marginLeft: spacing.sm,
  },

  // Allotment sub-text (smaller secondary line)
  allotmentSubtext: {
    marginTop: 4,
    fontSize: 12,
  },

  // Coach info banner (non-membership booking)
  coachInfoBanner: {
    backgroundColor: colors.infoLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  coachInfoBannerText: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 13,
  },
});
