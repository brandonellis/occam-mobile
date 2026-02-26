import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

export const progressStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
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
    borderBottomColor: colors.accent,
  },
  tabText: {
    ...typography.label,
    color: colors.textTertiary,
    fontSize: 13,
  },
  tabTextActive: {
    color: colors.accent,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },

  // Curriculum
  programCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  programName: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  programStatus: {
    ...typography.bodySmall,
    color: colors.accent,
    marginTop: 2,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: 3,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 3,
  },
  progressText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  moduleCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  moduleName: {
    ...typography.label,
    color: colors.textPrimary,
  },
  moduleProgress: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingLeft: spacing.md,
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

  // Reports
  reportCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  reportTitle: {
    ...typography.label,
    color: colors.textPrimary,
    fontSize: 16,
  },
  reportDate: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    marginTop: 2,
  },
  reportCoach: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // Resources
  resourceCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  resourceThumbnail: {
    width: '100%',
    height: 160,
    backgroundColor: colors.borderLight,
  },
  resourceInfo: {
    padding: spacing.md,
  },
  resourceName: {
    ...typography.label,
    color: colors.textPrimary,
  },
  resourceNotes: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  resourceMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  resourceCoach: {
    ...typography.bodySmall,
    color: colors.textTertiary,
  },
  resourceDate: {
    ...typography.bodySmall,
    color: colors.textTertiary,
  },
});
