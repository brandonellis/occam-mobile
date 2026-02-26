import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { typography } from '../theme/typography';

export const progressReportDetailStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  headerMeta: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    marginTop: 2,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },

  // Program badge
  programBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  programBadgeText: {
    ...typography.labelSmall,
    color: colors.accent,
    textTransform: 'none',
    fontSize: 13,
    fontWeight: '600',
  },

  // Section
  section: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textPrimary,
    fontSize: 16,
  },

  // Curriculum summary
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  summaryPercent: {
    ...typography.h2,
    color: colors.accent,
  },
  summaryLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: colors.gray200,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
  },

  // Module card
  moduleCard: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  moduleName: {
    ...typography.label,
    color: colors.textPrimary,
    flex: 1,
  },
  moduleCount: {
    ...typography.bodySmall,
    color: colors.textTertiary,
  },
  moduleNotes: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  lessonText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  lessonTextComplete: {
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },

  // Assessment scores
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  scoreRowLast: {
    borderBottomWidth: 0,
  },
  scoreLabel: {
    ...typography.body,
    color: colors.textPrimary,
    width: 80,
  },
  scoreBarWrap: {
    flex: 1,
    height: 8,
    backgroundColor: colors.gray200,
    borderRadius: borderRadius.full,
    marginHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
  },
  scoreValue: {
    ...typography.label,
    color: colors.textPrimary,
    width: 32,
    textAlign: 'right',
  },
  scoreDelta: {
    width: 28,
    alignItems: 'center',
  },
  overallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  overallLabel: {
    ...typography.label,
    color: colors.textSecondary,
  },
  overallValue: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  overallDelta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  assessmentNotes: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
    fontStyle: 'italic',
  },

  // Empty state
  emptySection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptySectionText: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
