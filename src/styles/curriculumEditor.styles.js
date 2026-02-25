import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

export const curriculumEditorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },

  // Action bar
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  moduleCount: {
    ...typography.body,
    color: colors.textTertiary,
    fontSize: 13,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent + '15',
  },
  addButtonText: {
    ...typography.label,
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },

  // Module card
  moduleCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
    overflow: 'hidden',
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  moduleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleName: {
    ...typography.label,
    color: colors.textPrimary,
    fontSize: 14,
  },
  moduleProgress: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    fontSize: 12,
    marginTop: 1,
  },
  moduleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  progressBar: {
    width: 48,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 2,
  },

  // Lessons
  lessonList: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingVertical: spacing.xs,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  lessonName: {
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 14,
    flex: 1,
  },
  lessonNameDone: {
    textDecorationLine: 'line-through',
    color: colors.textTertiary,
  },
  emptyLessons: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyLessonsText: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    fontSize: 13,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    gap: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  emptyMessage: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCancel: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 15,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontSize: 17,
  },
  modalListContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },

  // Tab switcher
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 3,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  tabText: {
    ...typography.label,
    color: colors.textSecondary,
    fontSize: 13,
  },
  tabTextActive: {
    color: colors.textInverse,
  },

  // Template / package items
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    ...typography.label,
    color: colors.textPrimary,
    fontSize: 14,
  },
  templateDesc: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    fontSize: 12,
    marginTop: 2,
  },
  templateModuleCount: {
    ...typography.bodySmall,
    color: colors.accent,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
});
