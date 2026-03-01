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
    color: colors.success,
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
    backgroundColor: colors.success,
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
  reportCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reportCardContent: {
    flex: 1,
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
  reportProgramBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  reportProgramText: {
    ...typography.bodySmall,
    color: colors.accent,
    fontSize: 12,
  },
  reportSummary: {
    ...typography.bodySmall,
    color: colors.accent,
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
  resourceImage: {
    width: '100%',
    height: 220,
    backgroundColor: colors.borderLight,
  },
  resourceVideoContainer: {
    width: '100%',
    height: 220,
    backgroundColor: colors.borderLight,
  },
  resourceVideoPlaceholder: {
    width: '100%',
    height: 220,
    backgroundColor: colors.gray800,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourcePlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlay,
  },
  resourceDocPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  resourceDocType: {
    ...typography.labelSmall,
    color: colors.textTertiary,
    fontSize: 10,
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

  // Resource sections
  resourceSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  resourceSectionHeaderFirst: {
    marginTop: 0,
  },
  resourceSectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceSectionIconPersonal: {
    backgroundColor: colors.accentLight,
  },
  resourceSectionIconGroup: {
    backgroundColor: colors.lavenderMistLight,
  },
  resourceSectionTitle: {
    ...typography.label,
    color: colors.textPrimary,
    fontSize: 15,
    flex: 1,
  },
  resourceSectionCount: {
    ...typography.bodySmall,
    color: colors.textTertiary,
  },
  resourceGroupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  resourceGroupBadgeText: {
    ...typography.labelSmall,
    color: colors.accent,
    fontSize: 11,
  },
});
