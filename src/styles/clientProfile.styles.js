import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

export const clientProfileStyles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },

  // ─── User Card ──────────────────────────────────────────────────────────────
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    ...shadows.md,
  },
  userName: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  userEmail: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 4,
  },

  // ─── Benefits Section ───────────────────────────────────────────────────────
  benefitsSection: {
    marginTop: spacing.xl,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitleText: {
    ...typography.label,
    color: colors.textPrimary,
    fontSize: 15,
  },

  // ─── Membership Summary (compact for profile) ──────────────────────────────
  membershipCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
    borderTopWidth: 3,
    borderTopColor: colors.accent,
  },
  membershipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  membershipPlanName: {
    ...typography.h3,
    color: colors.textPrimary,
    flex: 1,
  },
  membershipBilling: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
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

  // ─── Package Summary (compact for profile) ─────────────────────────────────
  packageCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  packageName: {
    ...typography.label,
    color: colors.textPrimary,
    fontSize: 15,
    flex: 1,
  },

  // ─── Action Buttons ──────────────────────────────────────────────────────────
  actionButtonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    flex: 1,
    minWidth: 140,
    borderWidth: 1.5,
    borderColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  actionButtonText: {
    ...typography.button,
    color: colors.accent,
    fontSize: 13,
  },

  // ─── Settings Section ──────────────────────────────────────────────────────
  settingsSection: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    minHeight: 48,
  },
  // ─── Sign Out ───────────────────────────────────────────────────────────────
  signOutButton: {
    borderWidth: 1.5,
    borderColor: colors.error,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: spacing.xl,
  },
  // ─── Loading ────────────────────────────────────────────────────────────────
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.bodySmall,
    color: colors.textTertiary,
  },
});
