import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

export const caddieStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  heroEyebrow: {
    ...typography.labelSmall,
    color: colors.aquaLight,
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  heroTitle: {
    ...typography.h2,
    color: colors.textInverse,
    marginBottom: spacing.sm,
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
});
