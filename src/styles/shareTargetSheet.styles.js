import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

export const shareTargetSheetStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    ...typography.h3,
    fontSize: 17,
    color: colors.textPrimary,
  },
  headerAction: {
    ...typography.button,
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  headerActionDisabled: {
    color: colors.disabled,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    minHeight: 40,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 15,
    paddingVertical: 8,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray100,
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  tabText: {
    ...typography.button,
    fontSize: 14,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },

  // Selected chips
  selectedChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentLight,
    borderRadius: borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    maxWidth: 160,
  },
  chipText: {
    ...typography.bodySmall,
    color: colors.accent,
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 1,
  },

  // List
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 24,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: 12,
    marginBottom: 2,
  },
  targetRowSelected: {
    backgroundColor: 'rgba(76, 172, 213, 0.06)',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSelected: {
    backgroundColor: colors.accentLight,
  },
  avatarText: {
    ...typography.button,
    fontSize: 14,
    color: colors.textSecondary,
  },
  avatarTextSelected: {
    color: colors.accent,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupIconSelected: {
    backgroundColor: colors.accent,
  },
  targetInfo: {
    flex: 1,
  },
  targetName: {
    ...typography.body,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  targetMeta: {
    ...typography.bodySmall,
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 1,
  },

  // States
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textTertiary,
    fontSize: 15,
  },
});
