import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { sharedAgentStyles } from './agentChat.styles';

export const caddieStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.tabBarClearance,
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  heroIcon: {
    marginBottom: spacing.sm,
  },
  heroEyebrow: {
    ...typography.labelSmall,
    color: colors.aquaLight,
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  heroTitle: {
    ...typography.h2,
    color: colors.textInverse,
  },
  heroBody: {
    ...typography.body,
    color: colors.textInverseMuted,
    lineHeight: 22,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  sectionBody: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  heroTitleRow: sharedAgentStyles.heroTitleRow,
  statusDot: sharedAgentStyles.statusDot,
  statusConnected: sharedAgentStyles.statusConnected,
  statusDisconnected: sharedAgentStyles.statusDisconnected,
  statusUnknown: sharedAgentStyles.statusUnknown,
  betaBadge: sharedAgentStyles.betaBadge,
  betaBadgeText: sharedAgentStyles.betaBadgeText,
  nudgesSection: {
    marginBottom: spacing.xl,
  },
  nudgesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  nudgesSectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  nudgesRow: {
    gap: spacing.md,
    paddingRight: spacing.lg,
  },
  nudgeCard: {
    width: 240,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  nudgeTitle: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  nudgeBody: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  nudgeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nudgeAskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  nudgeAskText: {
    ...typography.bodySmall,
    color: colors.accent,
    fontWeight: '600',
  },
  nudgeDismiss: {
    ...typography.bodySmall,
    color: colors.textTertiary,
  },
});
