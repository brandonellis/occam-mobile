import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

export const membershipStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  introText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Plan cards
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  planCardFeatured: {
    borderColor: colors.lavenderMist,
  },
  featuredBadge: {
    position: 'absolute',
    top: -1,
    right: spacing.lg,
    backgroundColor: colors.twilightPurple,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomLeftRadius: borderRadius.sm,
    borderBottomRightRadius: borderRadius.sm,
  },
  featuredBadgeText: {
    ...typography.labelSmall,
    color: colors.textInverse,
    fontSize: 9,
  },
  planName: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  planDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.lg,
  },
  planPrice: {
    ...typography.h1,
    color: colors.accent,
    fontSize: 36,
  },
  planPeriod: {
    ...typography.body,
    color: colors.textTertiary,
    marginLeft: spacing.xs,
  },
  planBenefits: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  benefitText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  selectPlanButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
    minHeight: 48,
  },
  selectPlanButtonFeatured: {
    backgroundColor: colors.accent,
  },
  selectPlanButtonText: {
    ...typography.button,
    color: colors.textInverse,
  },

  // Checkout
  checkoutSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  checkoutLabel: {
    ...typography.labelSmall,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  checkoutValue: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
  },
  checkoutDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  totalLabel: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  totalPrice: {
    ...typography.h2,
    color: colors.accent,
  },
  bottomBar: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  purchaseButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  purchaseButtonDisabled: {
    opacity: 0.5,
  },
  purchaseButtonText: {
    ...typography.button,
    color: colors.textInverse,
    fontSize: 16,
  },

  // Billing cycle selector
  billingCycleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  billingCycleOption: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  billingCycleOptionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.white,
  },
  billingCyclePrice: {
    ...typography.label,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  billingCyclePriceSelected: {
    color: colors.accent,
  },
  billingCycleLabel: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    marginTop: 2,
    fontSize: 11,
  },

  // Plan services list
  planServicesSection: {
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  planServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  planServiceText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    fontSize: 14,
  },
  planServiceQty: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    fontSize: 12,
  },

  // Checkout card input
  checkoutCardSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  checkoutCardTitle: {
    ...typography.label,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  checkoutCardField: {
    height: 50,
    marginVertical: spacing.xs,
  },
  checkoutCardError: {
    ...typography.bodySmall,
    color: colors.error,
    marginTop: 4,
  },
  checkoutSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  checkoutSummaryLabel: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
  },
  checkoutSummaryValue: {
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 14,
  },
  checkoutDescription: {
    color: colors.textSecondary,
    marginTop: 4,
    fontSize: 14,
  },
  checkoutBillingCycleText: {
    color: colors.textTertiary,
    marginTop: 4,
    fontSize: 13,
  },
  checkoutIncludesList: {
    gap: 8,
    marginTop: 4,
  },
  checkoutIncludesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkoutIncludesText: {
    color: colors.textPrimary,
    fontSize: 14,
    flex: 1,
  },
  checkoutIncludesQty: {
    color: colors.textTertiary,
    fontSize: 12,
  },
  checkoutPaymentsDisabledBanner: {
    backgroundColor: colors.infoSubtle,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  checkoutPaymentsDisabledText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  checkoutLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  checkoutLoadingText: {
    marginLeft: 8,
    color: colors.textSecondary,
  },

  // ─── Active Membership Detail Card ──────────────────────────────────────────
  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    ...shadows.md,
  },
  detailCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailPlanIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  detailPlanIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailPlanInfo: {
    flex: 1,
  },
  detailPlanName: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  detailPlanBilling: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
    fontSize: 13,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 5,
    marginLeft: spacing.sm,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusBadgeText: {
    ...typography.labelSmall,
    fontSize: 11,
    fontWeight: '600',
  },
  detailDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.lg,
  },
  detailMetaRow: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  detailMetaItem: {
    flex: 1,
  },
  detailMetaLabel: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    fontSize: 12,
    marginBottom: 4,
  },
  detailMetaValue: {
    ...typography.label,
    color: colors.textPrimary,
    fontSize: 14,
  },
  pauseBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.infoLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  pauseBannerText: {
    ...typography.body,
    color: colors.info,
    fontSize: 13,
    flex: 1,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
    minHeight: 48,
  },
  upgradeButtonText: {
    ...typography.button,
    color: colors.accent,
  },

  // ─── Section Title ──────────────────────────────────────────────────────────
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitleText: {
    ...typography.label,
    color: colors.textPrimary,
    fontSize: 15,
  },

  // ─── Service Usage Cards ────────────────────────────────────────────────────
  serviceCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  serviceCardName: {
    ...typography.label,
    color: colors.textPrimary,
    fontSize: 15,
    marginBottom: spacing.md,
  },
  serviceUnlimited: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  serviceUnlimitedText: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
  },
  serviceUsageBold: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  serviceUsageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  serviceUsageStat: {
    alignItems: 'center',
    flex: 1,
  },
  serviceUsageBig: {
    ...typography.h2,
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  serviceUsageLabel: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    fontSize: 11,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  serviceUsageDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.borderLight,
  },
  serviceProgressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borderLight,
  },
  serviceResetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.md,
  },
  serviceResetText: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    fontSize: 12,
  },
});
