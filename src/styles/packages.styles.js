import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

export const packageStyles = StyleSheet.create({
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

  // ─── Package Cards ─────────────────────────────────────────────────────────
  packageCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  packageCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  packageCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packageCardName: {
    ...typography.h3,
    color: colors.textPrimary,
    flex: 1,
  },
  packageCardDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  packageCardPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.lg,
  },
  packageCardPrice: {
    ...typography.h1,
    color: colors.accent,
    fontSize: 32,
  },
  packageCardPriceLabel: {
    ...typography.body,
    color: colors.textTertiary,
    marginLeft: spacing.xs,
  },

  // Services list within package card
  packageServicesSection: {
    marginBottom: spacing.lg,
  },
  packageServicesSectionTitle: {
    ...typography.labelSmall,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  packageServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 6,
  },
  packageServiceText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    fontSize: 14,
  },
  packageServiceQty: {
    ...typography.label,
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  packageValidityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.md,
  },
  packageValidityText: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    fontSize: 12,
  },
  selectPackageButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: 48,
  },
  selectPackageButtonText: {
    ...typography.button,
    color: colors.textInverse,
  },

  // ─── Checkout ──────────────────────────────────────────────────────────────
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
  checkoutDescription: {
    color: colors.textSecondary,
    marginTop: 4,
    fontSize: 14,
  },
  checkoutDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.sm,
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
    ...typography.label,
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },

  // Card input
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

  // Payment summary
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

  // Payments disabled
  checkoutPaymentsDisabledBanner: {
    backgroundColor: 'rgba(24, 144, 255, 0.08)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  checkoutPaymentsDisabledText: {
    color: colors.textSecondary,
    fontSize: 13,
  },

  // Bottom bar
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

  // ─── My Packages (owned) ───────────────────────────────────────────────────
  ownedSection: {
    marginBottom: spacing.xl,
  },
  ownedSectionTitle: {
    ...typography.label,
    color: colors.textPrimary,
    fontSize: 15,
    marginBottom: spacing.md,
  },
  ownedCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  ownedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  ownedCardName: {
    ...typography.label,
    color: colors.textPrimary,
    fontSize: 15,
    flex: 1,
  },
  ownedStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  ownedStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ownedStatusText: {
    ...typography.labelSmall,
    fontSize: 10,
    fontWeight: '600',
  },
  ownedExpiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  ownedExpiryText: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    fontSize: 12,
  },
  ownedServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  ownedServiceName: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 13,
  },
  ownedServiceUsage: {
    ...typography.label,
    color: colors.textPrimary,
    fontSize: 13,
  },

  // ─── Section Divider ───────────────────────────────────────────────────────
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderLight,
  },
  sectionDividerText: {
    ...typography.labelSmall,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
