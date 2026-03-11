import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

export const adminScheduleStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  monthLabel: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  todayResetButton: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accentSubtle,
  },
  todayResetText: {
    ...typography.labelSmall,
    color: colors.accent,
    fontWeight: '600',
  },
  dateStripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.xs,
  },
  navIconButton: {
    margin: 0,
  },
  dateStripList: {
    flex: 1,
  },
  dateItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.sm,
    minWidth: 46,
    height: 54,
  },
  dateItemSelected: {
    backgroundColor: colors.primary,
  },
  dateItemToday: {
    borderWidth: 1,
    borderColor: colors.accent,
  },
  dateDayName: {
    ...typography.labelSmall,
    color: colors.textTertiary,
    fontSize: 10,
  },
  dateDayNameSelected: {
    color: colors.textInverse,
  },
  dateDayNumber: {
    ...typography.label,
    color: colors.textPrimary,
    marginTop: 2,
    fontSize: 15,
  },
  dateDayNumberSelected: {
    color: colors.textInverse,
  },
  filterRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  filterChipHalf: {
    width: '48%',
  },
  filterChipFull: {
    width: '100%',
  },
  filterChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.infoLight,
  },
  filterChipIcon: {
    marginRight: spacing.xs,
  },
  filterChipText: {
    ...typography.labelSmall,
    flex: 1,
    textTransform: 'none',
    color: colors.textSecondary,
    marginRight: spacing.xs,
    flexShrink: 1,
  },
  filterChipTextActive: {
    color: colors.accent,
  },
  contentWrap: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.tabBarClearance,
  },
  summaryCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  summaryTitle: {
    ...typography.h3,
    color: colors.textInverse,
  },
  summarySubtitle: {
    ...typography.bodySmall,
    color: colors.textInverseMuted,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  activeFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  activeFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  activeFilterText: {
    ...typography.labelSmall,
    color: colors.textSecondary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  summaryText: {
    ...typography.bodySmall,
    color: colors.textTertiary,
  },
  resetFiltersText: {
    ...typography.labelSmall,
    color: colors.accent,
    fontWeight: '600',
  },
  timelineRow: {
    marginBottom: spacing.sm,
  },
  timeLabel: {
    marginBottom: 2,
  },
  timeLabelText: {
    ...typography.label,
    color: colors.textPrimary,
    fontSize: 12,
  },
  timelineContent: {
    flex: 1,
  },
  sessionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    ...shadows.sm,
  },
  sessionCardStackGap: {
    marginTop: spacing.sm,
  },
  sessionCardCancelled: {
    opacity: 0.8,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  sessionMain: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  sessionService: {
    ...typography.label,
    color: colors.textPrimary,
  },
  sessionClient: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 1,
  },
  sessionTime: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    marginTop: 2,
  },
  sessionMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  sessionMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
  },
  sessionMetaText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  sessionMetaIcon: {
    marginRight: 4,
  },
  sessionActions: {
    alignItems: 'flex-end',
  },
  sessionStatusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginBottom: 2,
  },
  sessionStatusText: {
    ...typography.labelSmall,
    fontWeight: '700',
  },
  sessionChevron: {
    marginTop: 2,
  },
  emptyWrap: {
    paddingTop: spacing.xxxl,
  },
  modalContent: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    maxHeight: '72%',
  },
  modalHeader: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  optionRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  optionRowSelected: {
    backgroundColor: colors.accentSubtle,
  },
  optionTitle: {
    ...typography.body,
    color: colors.textPrimary,
  },
  optionTitleSelected: {
    color: colors.accent,
    fontWeight: '600',
  },
  optionSubtitle: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    marginTop: 2,
  },
});
